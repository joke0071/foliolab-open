// Real Node promises/EventTargets, explicit IDB doubles. NOT native IDB proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {installLifecycleHarness,closeEventProvenance} from './flh04-source-lifecycle-harness.mjs';
import {assertOverlap,assertReleased,lifecycleCases,expectedRevertIntent,assertRetainedRevertIntent} from './flh04-source-lifecycle-probes.mjs';
import {createC1Diagnostics} from './flh04-c1-diagnostics.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

function setup(){
 class Database extends EventTarget{
  name='foliolab-open-portfolio';closed=false;
  transaction(){const tx=new EventTarget();queueMicrotask(()=>{const event=new Event('complete');tx.dispatchEvent(event);tx.oncomplete?.(event);});return tx;}
  close(){this.closed=true;}
 }
 class Factory{open(){const request=new EventTarget();request.result=new Database();queueMicrotask(()=>{request.dispatchEvent(new Event('success'));request.onsuccess?.();});return request;}}
 class Storage{setItem(){}removeItem(){}}
 globalThis.IDBFactory=Factory;globalThis.IDBDatabase=Database;globalThis.Storage=Storage;globalThis.localStorage=new Storage();
 const original={open:Factory.prototype.open,transaction:Database.prototype.transaction,close:Database.prototype.close,set:Storage.prototype.setItem,remove:Storage.prototype.removeItem};
 let source;
 const controller={
  async initialize(){
   source=await new Promise(resolve=>{const r=new Factory().open('foliolab-open-portfolio');r.onsuccess=()=>resolve(r.result);});
   await new Promise(resolve=>{const tx=source.transaction('records','readonly');tx.oncomplete=()=>resolve();});
   localStorage.removeItem('foliolab-open-storage-mode');source.close();
  },close(){source?.close();}
 };
 return {Factory,Database,Storage,original,controller,getSource:()=>source};
}
test.afterEach(()=>{for(const k of ['IDBFactory','IDBDatabase','Storage','localStorage'])delete globalThis[k];});
test('close provenance uses strict isTrusted and keeps absent provenance unknown',()=>{
 assert.deepEqual(closeEventProvenance(new Event('close')),{kind:'synthetic',isTrusted:false});
 // Explicit metadata double; this does NOT generate or prove a native close.
 assert.deepEqual(closeEventProvenance({isTrusted:true}),{kind:'native',isTrusted:true});
 for(const event of [null,{}, {isTrusted:1},{isTrusted:'true'}])
  assert.deepEqual(closeEventProvenance(event),{kind:'unknown',isTrusted:null});
});
test('actual Node dispatch through installed close listener is recorded synthetic',async()=>{
 const f=setup(),h=installLifecycleHarness({controller:f.controller,action:'initialize',fault:'close-event-injected'});
 try{
  await h.atBarrier;h.release();await h.done;
  const close=h.events.filter(e=>e.name==='source-close-event');
  assert.equal(close.length,1);assert.equal(close[0].kind,'synthetic');assert.equal(close[0].isTrusted,false);
  assert.ok(h.events.some(e=>e.name==='close-event-injected'&&e.kind==='injected'));
 }finally{h.cleanup();}
});
test('ordinary close call does not invent a close event',async()=>{
 const f=setup(),h=installLifecycleHarness({controller:f.controller,action:'initialize'});
 try{await h.atBarrier;h.release();await h.done;
  assert.ok(h.events.some(e=>e.name==='source-close-call'));
  assert.ok(h.events.every(e=>e.name!=='source-close-event'));
 }finally{h.cleanup();}
});
test('readwrite barrier holds callback after commit event and allows no marker cleanup yet',async()=>{
 const f=setup();let cleaned=false;
 f.controller.revertLocked=async()=>{
  const source=await new Promise(resolve=>{const r=new f.Factory().open('foliolab-open-portfolio');r.onsuccess=()=>resolve(r.result);});
  await new Promise(resolve=>{source.transaction('records','readonly').oncomplete=resolve;});
  await new Promise(resolve=>{source.transaction('records','readwrite').oncomplete=resolve;});
  cleaned=true;source.close();
 };
 const h=installLifecycleHarness({controller:f.controller,action:'revertLocked',barrierMode:'readwrite'});
 try{await h.atBarrier;
  assert.equal(cleaned,false);assert.equal(h.snapshot().settled,false);
  assert.ok(h.events.some(e=>e.name==='transaction-complete'));
  assert.ok(h.events.some(e=>e.name==='write-complete'));
  assert.ok(h.events.every(e=>e.name!=='source-close-call'));
  h.release();await h.done;assert.equal(cleaned,true);
 }finally{h.cleanup();}
});
test('independent intent fingerprint has fixed empty, ASCII and UTF-16 vectors',()=>{
 assert.equal(expectedRevertIntent('',7),'{"revision":7,"fingerprint":"0:811c9dc5"}');
 assert.equal(expectedRevertIntent('hello',7),'{"revision":7,"fingerprint":"5:4f9f2cab"}');
 assert.equal(expectedRevertIntent('a',7),'{"revision":7,"fingerprint":"1:e40c292c"}');
 assert.equal(expectedRevertIntent('ä😀',7),'{"revision":7,"fingerprint":"3:e28c507e"}');
 assert.throws(()=>expectedRevertIntent(null,7));assert.throws(()=>expectedRevertIntent('x',0));
});
test('retained intent oracle rejects same-revision fingerprint and complete-string mutations',()=>{
 const expected=expectedRevertIntent('hello',7);assertRetainedRevertIntent(expected,expected);
 // Negative control: predecessor's revision-only expression accepts this wrong fingerprint.
 assert.equal(JSON.parse('{"revision":7,"fingerprint":"5:00000000"}').revision,7);
 for(const actual of [null,'{}','not-json',
  '{"revision":7,"fingerprint":"5:00000000"}',
  '{"revision":8,"fingerprint":"5:4f9f2cab"}',
  '{"revision":7}',
  '{"revision":7,"fingerprint":"5:4f9f2cab","extra":true}',
  '{"fingerprint":"5:4f9f2cab","revision":7}',expected+' '])
  assert.throws(()=>assertRetainedRevertIntent(actual,expected));
});
test('native-event double finishes transaction while product callback remains held; release is explicit',async()=>{
 const f=setup(),h=installLifecycleHarness({controller:f.controller,action:'initialize'});
 try{
  await h.atBarrier;
  assert.equal(h.snapshot().settled,false);assert.equal(f.getSource().closed,false);
  assert.deepEqual(h.events.map(e=>e.name),['operation-start','source-open','source-success','transaction-readonly','read-complete','barrier-held']);
  f.getSource().dispatchEvent(new Event('versionchange'));
  assertOverlap(h.snapshot(),{started:true,blocked:true,upgrading:false,outcome:null});
  h.release();await h.done;assertReleased(h.snapshot());
  assert.equal(h.snapshot().result.status,'fulfilled');
 }finally{h.cleanup();}
 assert.equal(f.Factory.prototype.open,f.original.open);assert.equal(f.Database.prototype.transaction,f.original.transaction);
 assert.equal(f.Database.prototype.close,f.original.close);assert.equal(f.Storage.prototype.setItem,f.original.set);assert.equal(f.Storage.prototype.removeItem,f.original.remove);
});
test('cleanup releases the barrier and restores instrumentation after assertion failure',async()=>{
 const f=setup(),h=installLifecycleHarness({controller:f.controller,action:'initialize'});await h.atBarrier;
 h.cleanup();await h.done;assert.equal(h.snapshot().settled,true);assert.equal(f.Factory.prototype.open,f.original.open);
});
test('overlap oracle rejects completed first operation, absent second request and already upgrading state',()=>{
 const good={settled:false,sourceCount:1,events:[{name:'barrier-held'},{name:'source-versionchange'}]};
 const upgrade={started:true,blocked:true,upgrading:false,outcome:null};
 for(const altered of [{settled:true},{sourceCount:2},{events:[]}])assert.throws(()=>assertOverlap({...good,...altered},upgrade));
 for(const altered of [{started:false},{blocked:false},{upgrading:true},{outcome:{status:'fulfilled'}}])assert.throws(()=>assertOverlap(good,{...upgrade,...altered}));
});
test('release oracle rejects premature close and marker writes after final release',()=>{
 const good=['barrier-held','source-versionchange','barrier-release','source-close-call','operation-settled'];
 assertReleased({settled:true,events:good.map(name=>({name}))});
 for(const names of [good.filter(n=>n!=='source-close-call'),['source-close-call',...good.filter(n=>n!=='source-close-call')],[...good,'removeItem:foliolab-open-storage-mode']])
  assert.throws(()=>assertReleased({settled:true,events:names.map(name=>({name}))}));
});
test('matrix retains both successful v1 continuations and explicitly injected failure paths',()=>{
 assert.equal(lifecycleCases.length,7);
 assert.deepEqual(lifecycleCases.filter(x=>x[2]!==null).map(x=>x[2]),['marker-injected','read-error-injected','close-event-injected']);
 assert.ok(lifecycleCases.some(x=>x[1]==='migrateLocked'));assert.ok(lifecycleCases.some(x=>x[3]==='intent'));
});
test('C1 helper stays byte exact and the lifecycle hook preserves the entire prior harness',async()=>{
 const blob=text=>createHash('sha1').update('blob '+Buffer.byteLength(text)+'\0').update(text).digest('hex');
 const helper=await readFile(new URL('./flh04-version2-candidate-probes.mjs',import.meta.url),'utf8');
 assert.equal(blob(helper),'d87ab642d1ba409814af517c2b28ad50fd924b0c');
 let harness=await readFile(new URL('./browser-sync-outbox.mjs',import.meta.url),'utf8');
 harness=harness.replace("// Independent opt-in; consumed C1 runs are not repeated by this candidate.\nconst sourceLifecycle=process.env.FLH04_SOURCE_LIFECYCLE;\nif(sourceLifecycle!==undefined&&(sourceLifecycle!=='1'||name!=='chromium'||v2Candidate!==undefined))\n throw Error('FLH04 lifecycle requires value 1, Chromium and no C1 opt-in');\n",'')
  .replace("if(v2Candidate==='1'||sourceLifecycle==='1'){","if(v2Candidate==='1'){")
  .replace("const rendererTermination=process.env.FLH04_RENDERER_TERMINATION;\nif(rendererTermination!==undefined&&(rendererTermination!=='1'||sourceLifecycle!=='1'||name!=='chromium'||v2Candidate!==undefined))\n throw Error('FLH04 renderer termination requires value 1, source lifecycle, Chromium and no C1 opt-in');\n",'')
  .replace("  if(rendererTermination==='1'){\n   const {runRendererTerminationCandidate}=await import('./flh04-renderer-termination-probes.mjs');\n   await runRendererTerminationCandidate({browser,setup,operation,url});\n  }\n",'')
  .replace(" if(sourceLifecycle==='1'){\n  const {runSourceLifecycleCandidate}=await import('./flh04-source-lifecycle-probes.mjs');\n  await runSourceLifecycleCandidate({browser,setup,operation,url});\n }\n",'');
 assert.equal(blob(harness),'f5d6bcab636ff8b9cf5d4b62514dcb98acb2475c');
});
test('lifecycle diagnostics name the actual file and never pass unfinished assertions',()=>{
 const d=createC1Diagnostics('L-X',['OVERLAP','RESULT'],{path:'tests/flh04-source-lifecycle-probes.mjs'});
 d.start('OVERLAP');const failure=d.fail(new assert.AssertionError({actual:'secret-raw',expected:true}));
 assert.equal(failure.assertion.path,'tests/flh04-source-lifecycle-probes.mjs');
 assert.equal(d.report()[1].status,'NOT_REACHED');assert.throws(()=>d.complete());
 assert.ok(!JSON.stringify(failure).includes('secret-raw'));
 assert.throws(()=>createC1Diagnostics('X',[],{path:'other'}));
});
test('existing explicit recovery implementation remains byte exact',async()=>{
 const source=await readFile(new URL('../src/browser-portfolio-storage.js',import.meta.url),'utf8');
 const start=source.indexOf(' async recoverFromBackup('),end=source.indexOf(' async removeAll()',start);
 assert.equal(createHash('sha256').update(source.slice(start,end)).digest('hex'),'309dab4d9921e66f9860a79018cd16ededfe1ba5573eae5be6e887a2ba295836');
});
