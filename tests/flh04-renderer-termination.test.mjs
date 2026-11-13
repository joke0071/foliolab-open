// Node orchestration/metadata tests and explicit CDP doubles; NO native crash.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {crashRenderer,assertCrashBarrier} from './flh04-renderer-termination-probes.mjs';

function crashFixture({event='crash',connected=true,rejectCommand=false}={}){
 const page=new EventEmitter();let detached=0;const calls=[];
 page.waitForEvent=()=>new Promise((resolve,reject)=>{
  page.once('crash',resolve);
  if(event!=='crash')queueMicrotask(()=>reject(Error('synthetic missing-crash timeout')));
 });
 const session={send(command){calls.push(command);queueMicrotask(()=>page.emit(event));
  return rejectCommand?Promise.reject(Error('synthetic protocol closure')):Promise.resolve();},async detach(){detached++;}};
 return {page,context:{newCDPSession:async target=>{assert.equal(target,page);return session;}},
  browser:{isConnected:()=>connected},calls,detached:()=>detached};
}
test('crash orchestration requires actual crash event in double and surviving browser',async()=>{
 const f=crashFixture();const r=await crashRenderer(f);
 assert.deepEqual(f.calls,['Page.crash']);assert.equal(r.crashObserved,true);
 assert.equal(r.pageClosed,false);assert.equal(r.browserConnected,true);assert.equal(f.detached(),1);
 assert.equal(f.page.listenerCount('close'),0);
});
test('protocol rejection with observed crash is distinct from crash evidence',async()=>{
 const f=crashFixture({rejectCommand:true}),r=await crashRenderer(f);
 assert.equal(r.commandOutcome,'rejected');assert.equal(r.crashObserved,true);
});
test('ordinary page close and command rejection alone cannot pass crash oracle',async()=>{
 const f=crashFixture({event:'close',rejectCommand:true});
 await assert.rejects(()=>crashRenderer(f),/missing-crash/);assert.equal(f.detached(),1);
});
test('browser disconnect rejects a renderer-only qualification',async()=>{
 const f=crashFixture({connected:false});await assert.rejects(()=>crashRenderer(f),/browser must survive/);
 assert.equal(f.detached(),1);
});
test('crash barrier oracle rejects resumed, completed, closed and wrong-transaction snapshots',()=>{
 for(const mode of ['readonly','readwrite']){
  const good={settled:false,sourceCount:1,result:null,events:[{name:mode==='readonly'?'read-complete':'write-complete'},{name:'barrier-held'}]};
  assertCrashBarrier(good,mode);
  for(const delta of [{settled:true},{sourceCount:2},{result:{status:'fulfilled'}},{events:[]}])
   assert.throws(()=>assertCrashBarrier({...good,...delta},mode));
  for(const name of ['barrier-release','source-close-call','operation-settled'])
   assert.throws(()=>assertCrashBarrier({...good,events:[...good.events,{name}]},mode));
  assert.throws(()=>assertCrashBarrier(good,mode==='readonly'?'readwrite':'readonly'));
 }
});
test('actual prelaunch guard requires explicit bounded combination before any browser starts',async()=>{
 const text=await readFile(new URL('./browser-sync-outbox.mjs',import.meta.url),'utf8');
 const guard=text.slice(text.indexOf('const v2Candidate='),text.indexOf('const browser='));
 const run=(env,name='chromium')=>vm.runInNewContext(guard,{process:{env},name,URL});
 run({});run({FLH04_SOURCE_LIFECYCLE:'1'});
 run({FLH04_SOURCE_LIFECYCLE:'1',FLH04_RENDERER_TERMINATION:'1'});
 for(const env of [{FLH04_RENDERER_TERMINATION:'1'},
  {FLH04_SOURCE_LIFECYCLE:'1',FLH04_RENDERER_TERMINATION:'0'},
  {FLH04_SOURCE_LIFECYCLE:'1',FLH04_RENDERER_TERMINATION:'1',FLH04_VERSION2_CANDIDATE:'1'},
  {FLH04_SOURCE_LIFECYCLE:'1',FLH04_RENDERER_TERMINATION:'1',BASE_URL:'https://example.invalid'},
  {FLH04_SOURCE_LIFECYCLE:'1',FLH04_RENDERER_TERMINATION:'1',BASE_URL:'http://127.0.0.1:4174'}])assert.throws(()=>run(env));
 assert.throws(()=>run({FLH04_SOURCE_LIFECYCLE:'1',FLH04_RENDERER_TERMINATION:'1'},'firefox'));
});
