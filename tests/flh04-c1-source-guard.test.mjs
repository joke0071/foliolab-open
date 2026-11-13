// Adapter source is evaluated unchanged except its three dependency import URLs.
// Request events and all model/atomic dependencies are doubles. NO native proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as fixture from './fixtures/c1-storage-dependencies.mjs';
const dependency=new URL('./fixtures/c1-storage-dependencies.mjs',import.meta.url).href;
let source=await readFile(new URL('../src/browser-portfolio-storage.js',import.meta.url),'utf8');
for(const name of ['complete-backup','model','atomic-storage'])source=source.replaceAll("from './"+name+".js'","from '"+dependency+"'");
const {PortfolioStorage,MODE_KEY,MODE_VALUE,REVERT_INTENT_KEY}=await import('data:text/javascript;base64,'+Buffer.from(source+'\n//# sourceURL=flh04-c1-adapter-under-test.js\n').toString('base64'));
function setup({version=1,mode=null,missing=false,error=false,blocked=false,stores=true}={}){
 fixture.reset();const values=new Map([['foliolab-open-v1',JSON.stringify(fixture.blankModel())]]);
 if(mode!==null)values.set(MODE_KEY,mode);
 const stats={writes:[],opens:[],handles:[],aborts:0};
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{stats.writes.push(k);values.set(k,v);},removeItem:k=>{stats.writes.push(k);values.delete(k);}};
 const factory={open(...args){
  stats.opens.push(args);const request={};
  queueMicrotask(()=>{
   const handle={version:args[1]??version,closed:false,objectStoreNames:{contains:()=>stores},close(){this.closed=true;}};
   stats.handles.push(handle);request.result=handle;
   if(error){request.error=new DOMException('synthetic','SecurityError');request.onerror();return;}
   if(blocked){request.onblocked();queueMicrotask(()=>request.onsuccess());return;}
   if(missing&&args.length===1){
    request.transaction={abort(){stats.aborts++;request.error=new DOMException('synthetic','AbortError');queueMicrotask(()=>request.onerror());}};
    request.onupgradeneeded({oldVersion:0});return;
   }
   request.onsuccess();
  });return request;
 }};
 globalThis.indexedDB=factory;
 return {values,stats,storage,controller:new PortfolioStorage(storage)};
}
test.afterEach(()=>{delete globalThis.indexedDB;});
test('stub-reported v2 blocks every normal/legacy/revert entry before writes, including stale handles',async()=>{
 const actions=[c=>c.initialize(),c=>c.initializeNew(),c=>c.reload(),c=>c.save(fixture.blankModel()),c=>c.assertCurrent(),c=>c.migrate(fixture.blankModel()),c=>c.migrateLocked(fixture.blankModel()),c=>c.removeAll(),c=>c.removeAllLocked(),c=>c.revert(fixture.blankModel()),c=>c.revertLocked(fixture.blankModel())];
 for(const action of actions){
  const {controller:c,values,stats}=setup({version:2});
  values.set(REVERT_INTENT_KEY,'old-intent');c.db={version:1,close(){}};
  await assert.rejects(()=>action(c),/geschützt/);
  assert.equal(stats.writes.length,0);assert.equal(fixture.state.calls.length,0);
  assert.equal(stats.opens.length,1);assert.equal(stats.opens[0].length,1);assert.equal(stats.handles[0].closed,true);
 }
});
test('v2 automatic matching-intent resume and damaged/absent markers stay untouched',async()=>{
 for(const mode of [null,MODE_VALUE,'future-version']){
  const {controller:c,values,stats}=setup({version:2,mode});
  fixture.state.record={...fixture.state.record,raw:null,deleted:true};
  const raw=values.get('foliolab-open-v1');let h=2166136261;for(let i=0;i<raw.length;i++)h=Math.imul(h^raw.charCodeAt(i),16777619);
  const intent=JSON.stringify({revision:1,fingerprint:raw.length+':'+(h>>>0).toString(16)});values.set(REVERT_INTENT_KEY,intent);
  await assert.rejects(()=>c.initialize());assert.equal(stats.writes.length,0);
  assert.equal(values.get(REVERT_INTENT_KEY),intent);assert.equal(values.get('foliolab-open-v1')===raw,true);assert.equal(fixture.state.calls.length,0);
 }
});
test('unknown native version and missing records store block before legacy use',async()=>{
 for(const options of [{version:3},{stores:false}]){
  const {controller,stats}=setup(options);await assert.rejects(()=>controller.initialize(),/geschützt/);assert.equal(stats.writes.length,0);assert.equal(fixture.state.calls.length,0);
 }
});
test('unavailable IndexedDB preserves active and empty startup regression gates',async()=>{
 for(const mode of [null,MODE_VALUE]){
  const {controller,stats,values}=setup({mode});if(mode===null)values.clear();delete globalThis.indexedDB;
  await assert.rejects(()=>controller.initialize(),/IndexedDB/);assert.equal(controller.isIndexedDB,true);
  await assert.rejects(()=>controller.save(fixture.blankModel()),/IndexedDB/);assert.equal(stats.writes.length,0);
 }
});
test('failed or blocked source probe never falls back; late success closes',async()=>{
 for(const options of [{error:true},{blocked:true}]){
  const {controller,stats}=setup(options);await assert.rejects(()=>controller.initialize());await Promise.resolve();
  assert.equal(stats.writes.length,0);assert.equal(fixture.state.calls.length,0);
  if(options.blocked)assert.equal(stats.handles[0].closed,true);
 }
});
test('missing active IDB aborts probe and does not silently recreate',async()=>{
 const {controller,stats}=setup({missing:true,mode:MODE_VALUE});await assert.rejects(()=>controller.initialize(),/fehlt/);
 assert.equal(stats.aborts,1);assert.equal(stats.opens.length,1);assert.equal(stats.writes.length,0);assert.equal(fixture.state.calls.length,0);
});
test('v1 legacy read/save retained; probe connection held until local operation finishes',async()=>{
 const {controller,stats}=setup();await controller.initialize();await controller.save(fixture.blankModel());
 assert.equal(fixture.state.calls.includes('load'),true);assert.equal(fixture.state.calls.includes('persist'),true);
 assert.equal(stats.handles.every(h=>h.closed),true);assert.equal(stats.opens.every(args=>args.length===1),true);
});
test('v1 IDB startup reuses inspected handle, avoiding a queued second open',async()=>{
 const {controller,stats}=setup({mode:MODE_VALUE});await controller.initialize();
 assert.equal(stats.opens.length,1);assert.equal(controller.db,stats.handles[0]);assert.equal(controller.db.closed,false);
 controller.db.onversionchange();assert.equal(controller.db.closed,true);
});
test('pending versionchange waits through v1 revert cleanup, then guard closes',async()=>{
 const {controller,stats}=setup({mode:MODE_VALUE});controller.mode='idb';controller.revision=1;controller.db={version:1,close(){}};
 fixture.state.beforeCommit=()=>{const guard=stats.handles[0];guard.onversionchange();assert.equal(guard.closed,false);};
 await controller.revert(fixture.blankModel());assert.equal(controller.isIndexedDB,false);assert.equal(stats.handles[0].closed,true);
 assert.equal(fixture.state.calls.includes('commit'),true);assert.equal(stats.opens.length,1);
});
test('forced close after read blocks credential retirement and writes',async()=>{
 const {controller,stats}=setup({mode:MODE_VALUE});fixture.state.beforeRead=()=>stats.handles[0].onclose();
 await assert.rejects(()=>controller.initialize(),/verloren/);assert.equal(fixture.state.calls.includes('retire-idb'),false);assert.equal(stats.writes.length,0);
});
test('new empty installation still uses existing explicit v1 creation, no local mirror',async()=>{
 const {controller,values,stats}=setup({missing:true});values.clear();fixture.state.record=null;
 await controller.initialize();assert.equal(stats.aborts,1);assert.equal(stats.opens.length,2);assert.equal(stats.opens[1][1],1);
 assert.equal(values.has('foliolab-open-v1'),false);assert.equal(values.get(MODE_KEY),MODE_VALUE);assert.equal(controller.isIndexedDB,true);
});
test('original download reads actual v2 through fresh probe; missing source never created',async()=>{
 const {controller,stats}=setup({version:2,mode:MODE_VALUE});controller.mode='idb';await controller.unverifiedBackup();
 assert.equal(fixture.state.calls.join(','),'unverified');assert.equal(stats.writes.length,0);assert.equal(controller.db,stats.handles[0]);
 await controller.recoverFromBackup(fixture.blankModel(),{revision:1});assert.equal(fixture.state.record.revision,2);assert.equal(stats.writes.length,0);
 const other=setup({missing:true,mode:MODE_VALUE});other.controller.mode='idb';await assert.rejects(()=>other.controller.unverifiedBackup(),/fehlt/);assert.equal(other.stats.opens.length,1);
});
test('existing explicit fixture-bound recovery CAS remains, with no legacy mirror',async()=>{
 const {controller,stats}=setup({version:2,mode:MODE_VALUE});controller.mode='idb';controller.db={version:2};
 await assert.rejects(()=>controller.recoverFromBackup(fixture.blankModel(),{revision:0}),/stale/);
 await controller.recoverFromBackup(fixture.blankModel(),{revision:1});assert.equal(fixture.state.record.revision,2);assert.equal(stats.writes.length,0);
});
test('one local lock is acquired before source inspection, also for direct locked entry',async()=>{
 for(const action of [c=>c.initialize(),c=>c.initializeNew(),c=>c.reload(),c=>c.save(fixture.blankModel()),c=>c.assertCurrent(),c=>c.migrate(fixture.blankModel()),c=>c.migrateLocked(fixture.blankModel()),c=>c.removeAll(),c=>c.removeAllLocked(),c=>c.revert(fixture.blankModel()),c=>c.revertLocked(fixture.blankModel())]){
  const {controller,stats}=setup({version:2});let locks=0;
  controller.withLocalLock=async callback=>{locks++;assert.equal(stats.opens.length,0);return callback();};
  await assert.rejects(()=>action(controller));assert.equal(locks,1);assert.equal(stats.writes.length,0);
 }
});
test('v1 exact matching automatic revert intent still resumes without replacing original bytes',async()=>{
 const {controller,values,stats}=setup({mode:MODE_VALUE});fixture.state.record={...fixture.state.record,raw:null,deleted:true};
 const raw=values.get('foliolab-open-v1');let h=2166136261;for(let i=0;i<raw.length;i++)h=Math.imul(h^raw.charCodeAt(i),16777619);
 values.set(REVERT_INTENT_KEY,JSON.stringify({revision:1,fingerprint:raw.length+':'+(h>>>0).toString(16)}));
 await controller.initialize();assert.equal(controller.isIndexedDB,false);assert.equal(values.get('foliolab-open-v1')===raw,true);
 assert.equal(values.has(MODE_KEY),false);assert.equal(values.has(REVERT_INTENT_KEY),false);assert.equal(stats.opens.length,1);
});
