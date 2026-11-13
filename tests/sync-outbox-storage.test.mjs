import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,backup,createProvider} from '../src/model.js';
import {commitPortfolioRecord,readPortfolioSyncRecord,restoreDamagedRecord,commitPortfolioSyncRecord,adoptPortfolioRecord} from '../src/atomic-storage.js';
import {verifySyncOutboxState,advanceSyncOutboxState} from '../src/sync-outbox-state.js';
import {createSyncOutboxStorage} from '../src/sync-outbox-storage.js';
import {PortfolioStorage,MODE_KEY,MODE_VALUE} from '../src/browser-portfolio-storage.js';
import {portfolioId,epochId,verify,frame} from './sync-outbox-fixture.mjs';

/** Transaction DOUBLE only. Tests orchestration/error paths, NOT native IDB,
 * browser durability, actual quota, process crash or real tabs. No such PASS.
 * Tentative writes publish only on completion; all readwrite tx serialize.
 */
function memoryDB() {
 const data=new Map();let tail=Promise.resolve();
 const db={data,fault:null,transaction(_store,mode){
  const tx={error:null,abort(){if(tx.done)return;tx.done=true;setImmediate(()=>{tx.onabort?.();release();});}};
  let working,active=false,release,scheduled=false;const queue=[];
  const done=new Promise(r=>release=r),prior=tail;tail=done;
  const store={get(key){const req={};queue.push(()=>{req.result=structuredClone(working.get(key));req.onsuccess?.();});pump();return req;},
   put(value,key){if(!active||tx.done)throw Error('inactive');if(db.fault==='quota'){db.fault=null;throw new DOMException('quota-double','QuotaExceededError');}
    working.set(key,structuredClone(value));
    if(db.fault==='abort-after-put'){db.fault=null;tx.abort();}
    return {};}};
  tx.objectStore=()=>store;
  function pump(){if(!active||scheduled||tx.done)return;scheduled=true;setImmediate(()=>{
   scheduled=false;if(tx.done)return;
   if(queue.length){try{queue.shift()();}catch(e){tx.error=e;tx.abort();}pump();return;}
   tx.done=true;if(mode==='readwrite'){data.clear();for(const [k,v] of working)data.set(k,v);}
   tx.oncomplete?.();release();
  });}
  prior.then(()=>{working=structuredClone(data);active=true;pump();});return tx;
 }};return db;
}
async function fixture() {
 const db=memoryDB(),model=blankModel();
 const p=await commitPortfolioRecord(db,{expectedRevision:null,raw:backup(model,{includeHistory:true}),settings:model.settings});
 const api=createSyncOutboxStorage(db,verify),receipt=await verify(frame(p.raw));
 const args={expectedLocalRevision:1,expectedSyncVersion:null,receipt,expectedPortfolioId:portfolioId,expectedEpochId:epochId};
 return {db,model,p,api,receipt,args};
}
// Pure local frame-match setup ONLY. Never a remote receipt or transport PASS.
async function matchForModel(db,args) {
 const current=await readPortfolioSyncRecord(db);
 const next=advanceSyncOutboxState({ticket:await verifySyncOutboxState(current.sync,verify),revisionId:args.revisionId,
  readback:args.readback,currentLocalRevision:current.portfolio.revision});
 return commitPortfolioSyncRecord(db,{expectedLocalRevision:current.portfolio.revision,expectedPortfolio:current.portfolio,expectedState:current.sync,nextState:next});
}
test('transaction double: capture/restart retains full frame without changing portfolio or settings',async()=>{
 const {db,p,api,args}=await fixture();const s=await api.capture(args);
 assert.equal(s.version,1);assert.equal(s.entries[0].capturedLocalRevision,1);
 assert.deepEqual((await readPortfolioSyncRecord(db)).portfolio,p);
 const restarted=createSyncOutboxStorage(db,verify);assert.deepEqual((await restarted.recover()).state,s);
 assert.equal((await restarted.recover()).summary.remoteAnchor,null);
 assert.deepEqual(await api.capture({...args,expectedSyncVersion:1}),s);
});
test('transaction double: staged write abort and quota expose no half-state; retry after recovery',async()=>{
 for(const fault of ['quota','abort-after-put']) {
  const {db,p,api,args}=await fixture();db.fault=fault;
  await assert.rejects(()=>api.capture(args));assert.deepEqual(await readPortfolioSyncRecord(db),{portfolio:p,sync:null});
  assert.equal((await api.capture(args)).entries.length,1);
 }
});
test('transaction double: two metadata contenders have one winner; stale CAS cannot overwrite',async()=>{
 const {db,api,args}=await fixture();const outcomes=await Promise.allSettled([api.capture(args),api.capture(args)]);
 assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);assert.equal(outcomes.filter(x=>x.status==='rejected').length,1);
 const before=await readPortfolioSyncRecord(db);
 await assert.rejects(()=>api.begin({expectedLocalRevision:1,expectedSyncVersion:0,revisionId:'R'}),/stale-preimage/);
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
});
test('transaction double: save during upload protects newer revision; frame match records only old CAS',async()=>{
 const {db,p,model,api,args}=await fixture();await api.capture(args);
 const started=await api.begin({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R'});
 assert.equal(started.state.entries[0].status,'uncertain');assert.equal(started.frameText,frame(p.raw));
 // Simulated HTTP answer lost: NO confirm; restart still uncertain.
 assert.equal((await createSyncOutboxStorage(db,verify).recover()).state.entries[0].status,'uncertain');
 model.providers.push(createProvider({id:'new-provider',name:'newer-save',type:'broker'}));await commitPortfolioRecord(db,{expectedRevision:1,raw:backup(model,{includeHistory:true}),settings:model.settings});
 await assert.rejects(()=>api.confirm({expectedLocalRevision:1,expectedSyncVersion:2,revisionId:'R',readback:args.receipt}),/remote-provenance-unavailable/);
 await matchForModel(db,{revisionId:'R',readback:await verify(started.frameText)});
 const current=await api.recover();assert.equal(current.summary.matchedLocalRevision,1);assert.equal(current.summary.hasPendingChanges,true);
 assert.equal((await readPortfolioSyncRecord(db)).portfolio.revision,2);
 assert.equal(JSON.parse((await readPortfolioSyncRecord(db)).portfolio.raw).providers[0].name,'newer-save');
 await assert.rejects(()=>api.begin({expectedLocalRevision:2,expectedSyncVersion:3,revisionId:'R'}),/not-publishable/);
});
test('transaction double: valid different cipher is conflict; no readback or foreign state cannot confirm',async()=>{
 const {db,p,api,args}=await fixture();await api.capture(args);const before=await readPortfolioSyncRecord(db);
 await assert.rejects(()=>api.confirm({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R',readback:awaitableDummy()}),/remote-provenance-unavailable/);
 const other=await verify(frame(p.raw,'R',null,'1','45'.repeat(32)));
 await assert.rejects(()=>api.confirm({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R',readback:other}),/remote-provenance-unavailable/);
 await assert.rejects(()=>api.confirm({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R'}),/remote-provenance-unavailable/);
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
});
function awaitableDummy(){return {verified:true};}
test('transaction double: reset and explicit recovery atomically disable old line and preserve originals',async()=>{
 for(const recovery of [false,true]){
  const {db,model,api,args}=await fixture();const s=await api.capture(args),before=await readPortfolioSyncRecord(db);
  if(recovery)await restoreDamagedRecord(db,{expected:before.portfolio,raw:backup(model,{includeHistory:true}),settings:model.settings});
  else await commitPortfolioRecord(db,{expectedRevision:1,raw:null,settings:null});
  const stored=await readPortfolioSyncRecord(db);assert.deepEqual(stored.sync.entries,s.entries);
  assert.equal(stored.sync.disabled,recovery?'explicit-recovery':'portfolio-deleted');
  await assert.rejects(()=>api.recover(),/disabled|no-local-portfolio/);
  await assert.rejects(()=>api.confirm({expectedLocalRevision:2,expectedSyncVersion:1,revisionId:'R',readback:args.receipt}));
 }
});
test('transaction double: lifecycle invalidation failure rolls back portfolio tombstone/recovery too',async()=>{
 for(const recovery of [false,true]){
  const {db,model,api,args}=await fixture();await api.capture(args);const before=await readPortfolioSyncRecord(db);
  const original=db.transaction;db.transaction=function(...a){const tx=original.apply(db,a),get=tx.objectStore;
   tx.objectStore=function(...b){const store=get.apply(tx,b),put=store.put;store.put=function(v,k){if(k==='sync-outbox-v1')throw new DOMException('quota-double','QuotaExceededError');return put.call(store,v,k);};return store;};return tx;};
  if(recovery)await assert.rejects(()=>restoreDamagedRecord(db,{expected:before.portfolio,raw:backup(model,{includeHistory:true}),settings:model.settings}));
  else await assert.rejects(()=>commitPortfolioRecord(db,{expectedRevision:1,raw:null,settings:null}));
  assert.deepEqual(await readPortfolioSyncRecord(db),before);
 }
});
test('transaction double: post-commit reply loss rereads full committed state; mutable inputs captured before tx',async()=>{
 const {db,api,args}=await fixture();const s=await api.capture(args);
 // No fictional rollback: dropping caller result does not undo oncomplete.
 assert.deepEqual((await createSyncOutboxStorage(db,verify).recover()).state,s);
 const next=structuredClone(s);next.version=2;next.entries[0].status='uncertain';
 const pending=commitPortfolioSyncRecord(db,{expectedLocalRevision:1,expectedPortfolio:(await readPortfolioSyncRecord(db)).portfolio,expectedState:s,nextState:next});
 next.entries[0].status='confirmed';s.version=99;await pending;
 assert.equal((await api.recover()).state.entries[0].status,'uncertain');
});

test('transaction double: local save during async recovery cannot return a stale synchronized summary',async()=>{
 const {db,model,api,args}=await fixture();await api.capture(args);
 await matchForModel(db,{revisionId:'R',readback:args.receipt});
 let once=true;
 const racing=createSyncOutboxStorage(db,async text=>{
  if(once){once=false;await commitPortfolioRecord(db,{expectedRevision:1,raw:backup(model,{includeHistory:true}),settings:model.settings});}
  return verify(text);
 });
 await assert.rejects(()=>racing.recover(),/recovery-race/);
 assert.equal((await api.recover()).summary.hasPendingChanges,true);
});
test('A2 transaction double: rejected pseudo-confirmation leaves the complete uncertain frame and old anchor',async()=>{
 const {db,api,args}=await fixture();await api.capture(args);await api.begin({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R'});
 const before=await readPortfolioSyncRecord(db);db.fault='abort-after-put';
 await assert.rejects(()=>api.confirm({expectedLocalRevision:1,expectedSyncVersion:2,revisionId:'R',readback:args.receipt}));
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
 assert.equal((await api.recover()).summary.remoteAnchor,null);
});
test('transaction double: reset/recovery during crypto re-verification invalidates the pending confirmation',async()=>{
 for(const recovery of [false,true]){
  const {db,model,api,args}=await fixture();await api.capture(args);let once=true;
  const racing=createSyncOutboxStorage(db,async text=>{
   if(once){once=false;const before=await readPortfolioSyncRecord(db);
    if(recovery)await restoreDamagedRecord(db,{expected:before.portfolio,raw:backup(model,{includeHistory:true}),settings:model.settings});
    else await commitPortfolioRecord(db,{expectedRevision:1,raw:null,settings:null});
   }return verify(text);
  });
  await assert.rejects(()=>racing.planApply({expectedLocalRevision:1,expectedSyncVersion:1,revisions:[],observationComplete:true}),/apply-plan-race/);
  const after=await readPortfolioSyncRecord(db);assert.equal(after.sync.anchorIndex,-1);
  assert.equal(after.sync.disabled,recovery?'explicit-recovery':'portfolio-deleted');
 }
});

test('A1 transaction double: adapter reads current IDB preimage and blocks unrepresented saves',async()=>{
 const {db,model,api,args}=await fixture();await api.capture(args);
 await commitPortfolioRecord(db,{expectedRevision:1,raw:backup(model,{includeHistory:true}),settings:model.settings});
 const before=await readPortfolioSyncRecord(db),d=before.sync.entries[0].revision;
 const result=await api.planApply({expectedLocalRevision:2,expectedSyncVersion:1,revisions:[{...d,revisionId:'B',parentId:'R',generation:'2'}],observationComplete:true});
 assert.equal(result.reason,'unrepresented-local-changes');assert.deepEqual(await readPortfolioSyncRecord(db),before);
});
test('A2 transaction double: local proof, HTTP flags and asserted object URLs never constitute remote provenance',async()=>{
 const {db,api,args}=await fixture();await api.capture(args);const before=await readPortfolioSyncRecord(db);
 for(const extra of [{readback:args.receipt},{readback:await verify(frame(before.portfolio.raw))},{readback:args.receipt,remote:true,httpStatus:200,objectId:'claimed',url:'https://example.invalid/object'},{}])
  await assert.rejects(()=>api.confirm({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R',...extra}),/remote-provenance-unavailable/);
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
 assert.equal((await api.recover()).summary.acknowledgedLocalRevision,null);
});

test('A1 transaction double: local save while planning invalidates even an initially clean Apply candidate',async()=>{
 const {db,model,api,args}=await fixture();await api.capture(args);let once=true;
 const racing=createSyncOutboxStorage(db,async text=>{if(once){once=false;
  await commitPortfolioRecord(db,{expectedRevision:1,raw:backup(model,{includeHistory:true}),settings:model.settings});
 }return verify(text);});
 const d=(await readPortfolioSyncRecord(db)).sync.entries[0].revision;
 await assert.rejects(()=>racing.planApply({expectedLocalRevision:1,expectedSyncVersion:1,revisions:[{...d,revisionId:'B',parentId:'R',generation:'2'}],observationComplete:true}),/apply-plan-race/);
 assert.equal((await readPortfolioSyncRecord(db)).portfolio.revision,2);
});

test('restore lifecycle double: identical restore preserves attempts and disables every old-line operation',async()=>{
 const {db,p,model,api,args}=await fixture();await api.capture(args);
 await api.begin({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R'});
 const before=await readPortfolioSyncRecord(db);
 const result=await commitPortfolioRecord(db,{expectedRevision:1,raw:p.raw,settings:p.settings,intent:'restore'});
 const after=await readPortfolioSyncRecord(db);
 assert.equal(result.revision,2);assert.equal(result.raw,p.raw);
 assert.deepEqual(after.sync,{...before.sync,disabled:'portfolio-restored'});
 await assert.rejects(()=>createSyncOutboxStorage(db,verify).recover(),/disabled/);
 await assert.rejects(()=>api.begin({expectedLocalRevision:2,expectedSyncVersion:2,revisionId:'R'}),/disabled/);
 await assert.rejects(()=>api.capture({...args,expectedLocalRevision:2,expectedSyncVersion:2}),/disabled/);
 await assert.rejects(()=>api.planApply({expectedLocalRevision:2,expectedSyncVersion:2,revisions:[],observationComplete:true}),/disabled/);
 await assert.rejects(()=>api.confirm(),/remote-provenance-unavailable/);
 await commitPortfolioRecord(db,{expectedRevision:2,raw:p.raw,settings:model.settings});
 assert.deepEqual((await readPortfolioSyncRecord(db)).sync,after.sync);
});

test('restore lifecycle double: ordinary edits/CSV successors preserve line; restore creates no outbox',async()=>{
 const {db,p,model,api,args}=await fixture();await api.capture(args);
 const before=(await readPortfolioSyncRecord(db)).sync;
 model.providers.push(createProvider({id:'imported',name:'Synthetic import',type:'broker'}));
 const saved=await commitPortfolioRecord(db,{expectedRevision:1,raw:backup(model,{includeHistory:true}),settings:model.settings});
 assert.deepEqual((await readPortfolioSyncRecord(db)).sync,before);
 await api.capture({...args,expectedLocalRevision:2,expectedSyncVersion:1,receipt:await verify(frame(saved.raw,'S','R','2'))});
 assert.equal((await api.recover()).state.entries.length,2);
 const clean=await fixture();
 await commitPortfolioRecord(clean.db,{expectedRevision:1,raw:p.raw,settings:p.settings,intent:'restore'});
 assert.equal((await readPortfolioSyncRecord(clean.db)).sync,null);
});

test('restore lifecycle double: abort/quota at invalidation rolls back both records after portfolio put',async()=>{
 for(const fault of ['quota','abort']){
  const {db,p,api,args}=await fixture();await api.capture(args);const before=await readPortfolioSyncRecord(db);
  const transaction=db.transaction;
  db.transaction=function(...a){const tx=transaction.apply(db,a),objectStore=tx.objectStore;
   tx.objectStore=function(...b){const store=objectStore.apply(tx,b),put=store.put;
    store.put=function(value,key){if(key==='sync-outbox-v1'){
     if(fault==='quota')throw new DOMException('metadata-quota-double','QuotaExceededError');
     const result=put.call(store,value,key);tx.abort();return result;
    }return put.call(store,value,key);};return store;};return tx;};
  await assert.rejects(()=>commitPortfolioRecord(db,{expectedRevision:1,raw:p.raw,settings:p.settings,intent:'restore'}));
  assert.deepEqual(await readPortfolioSyncRecord(db),before);
 }
});

test('restore lifecycle double: stale CAS, invalid data and unknown intent never invalidate frames',async()=>{
 const {db,p,api,args}=await fixture();await api.capture(args);const before=await readPortfolioSyncRecord(db);
 for(const patch of [{expectedRevision:99},{raw:'{"version":999}'},{intent:'RESTORE'},{intent:null},{intent:{restore:true}}]){
  await assert.rejects(()=>commitPortfolioRecord(db,{expectedRevision:1,raw:p.raw,settings:p.settings,intent:'restore',...patch}));
  assert.deepEqual(await readPortfolioSyncRecord(db),before);
 }
});

test('restore lifecycle double: restore during crypto prevents stale capture/begin/plan/recovery',async()=>{
 for(const action of ['capture','begin','planApply','recover']){
  const {db,p,api,args}=await fixture();await api.capture(args);const before=await readPortfolioSyncRecord(db);let once=true;
  const racing=createSyncOutboxStorage(db,async text=>{
   if(once){once=false;await commitPortfolioRecord(db,{expectedRevision:1,raw:p.raw,settings:p.settings,intent:'restore'});}
   return verify(text);
  });
  const call=action==='capture'?()=>racing.capture({...args,expectedSyncVersion:1}):
   action==='begin'?()=>racing.begin({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R'}):
   action==='planApply'?()=>racing.planApply({expectedLocalRevision:1,expectedSyncVersion:1,revisions:[],observationComplete:true}):()=>racing.recover();
  await assert.rejects(call,/cas|race/);
  const after=await readPortfolioSyncRecord(db);
  assert.equal(after.portfolio.revision,2);assert.deepEqual(after.sync,{...before.sync,disabled:'portfolio-restored'});
 }
});

test('restore lifecycle double: PortfolioStorage forwards intent and advances its revision only after commit',async()=>{
 const {db,p,model,api,args}=await fixture();await api.capture(args);
 const local={getItem:key=>key===MODE_KEY?MODE_VALUE:null};
 const controller=new PortfolioStorage(local);controller.mode='idb';controller.db=db;controller.revision=1;
 const before=await readPortfolioSyncRecord(db);
 db.fault='abort-after-put';await assert.rejects(()=>controller.save(model,{intent:'restore'}));
 assert.equal(controller.revision,1);assert.deepEqual(await readPortfolioSyncRecord(db),before);
 await controller.save(model,{intent:'restore'});
 assert.equal(controller.revision,2);assert.equal((await readPortfolioSyncRecord(db)).sync.disabled,'portfolio-restored');
 assert.equal((await readPortfolioSyncRecord(db)).portfolio.raw,p.raw);
 await assert.rejects(()=>controller.save(model,{intent:'unknown'}),/Speichergrund/);
 assert.equal(controller.revision,2);
});

test('installation lifecycle double: missing record cannot rebind old frames at restarted CAS1',async()=>{
 const {db,p,api,args}=await fixture();await api.capture(args);const original=(await readPortfolioSyncRecord(db)).sync;
 db.data.delete('portfolio'); // Simulated partial local loss, NOT a native crash.
 const next=await commitPortfolioRecord(db,{expectedRevision:null,raw:p.raw,settings:p.settings});
 assert.equal(next.revision,1);assert.equal(next.raw,p.raw);
 assert.deepEqual((await readPortfolioSyncRecord(db)).sync,{...original,disabled:'portfolio-reinitialized'});
 await assert.rejects(()=>api.capture({...args,expectedSyncVersion:1}),/disabled/);
 await assert.rejects(()=>api.begin({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R'}),/disabled/);
 await assert.rejects(()=>api.recover(),/disabled|enrollment-required/);
});

test('installation lifecycle double: reinitialization invalidation failure preserves missing-record preimage',async()=>{
 for(const fault of ['quota','abort']){
  const {db,p,api,args}=await fixture();await api.capture(args);db.data.delete('portfolio');
  const before=await readPortfolioSyncRecord(db),transaction=db.transaction;
  db.transaction=function(...a){const tx=transaction.apply(db,a),objectStore=tx.objectStore;
   tx.objectStore=function(...b){const store=objectStore.apply(tx,b),put=store.put;
    store.put=function(value,key){if(key==='sync-outbox-v1'){
     if(fault==='quota')throw new DOMException('reinit-quota-double','QuotaExceededError');
     const result=put.call(store,value,key);tx.abort();return result;
    }return put.call(store,value,key);};return store;};return tx;};
  await assert.rejects(()=>commitPortfolioRecord(db,{expectedRevision:null,raw:p.raw,settings:p.settings}));
  assert.deepEqual(await readPortfolioSyncRecord(db),before);
 }
});

// Factory orchestration DOUBLE, not a browser/IDB/cutover/installation PASS.
async function withFactory(db,run){
 const owned=Object.hasOwn(globalThis,'indexedDB'),previous=globalThis.indexedDB;
 db.close=()=>{};
 globalThis.indexedDB={open(){const request={};setImmediate(()=>{request.result=db;request.onsuccess?.();});return request;}};
 try{return await run();}finally{if(owned)globalThis.indexedDB=previous;else delete globalThis.indexedDB;}
}
function localFixture(){
 const data=new Map();return {data,storage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
}

test('installation lifecycle double: marker loss cannot adopt byte-identical live record or orphan outbox',async()=>{
 for(const lostRecord of [false,true])for(const migration of [false,true]){
  const {db,model,api,args}=await fixture();await api.capture(args);
  if(lostRecord)db.data.delete('portfolio');const before=await readPortfolioSyncRecord(db);
  const local=localFixture(),controller=new PortfolioStorage(local.storage);
  await withFactory(db,()=>assert.rejects(()=>migration?controller.migrate(model):controller.initializeNew(),/Synchronisierungslinie/));
  assert.deepEqual(await readPortfolioSyncRecord(db),before);assert.equal(local.data.size,0);
 }
});

test('installation lifecycle double: fresh and identical interrupted installation without outbox still work',async()=>{
 for(const interrupted of [false,true]){
  const db=memoryDB(),model=blankModel(),local=localFixture();
  if(interrupted)await commitPortfolioRecord(db,{expectedRevision:null,raw:backup(model,{includeHistory:true}),settings:model.settings});
  const controller=new PortfolioStorage(local.storage);
  const loaded=await withFactory(db,()=>controller.initializeNew());
  assert.equal(controller.revision,interrupted?2:1);assert.equal(controller.isIndexedDB,true);
  assert.deepEqual(loaded,model);assert.equal(local.data.get(MODE_KEY),MODE_VALUE);
  assert.equal((await readPortfolioSyncRecord(db)).sync,null);
 }
});

test('installation lifecycle double: consented migration over tombstone preserves and disables old originals',async()=>{
 const {db,model,api,args}=await fixture();await api.capture(args);
 const original=(await readPortfolioSyncRecord(db)).sync;
 await commitPortfolioRecord(db,{expectedRevision:1,raw:null,settings:null});
 const local=localFixture(),controller=new PortfolioStorage(local.storage);
 await withFactory(db,()=>controller.migrate(model));
 assert.equal(controller.revision,3);assert.equal(local.data.get(MODE_KEY),MODE_VALUE);
 assert.deepEqual((await readPortfolioSyncRecord(db)).sync,{...original,disabled:'portfolio-reinitialized'});
 await assert.rejects(()=>api.recover(),/disabled|enrollment-required/);
});

test('atomic adoption double: capture before cutover blocks adoption without changing originals',async()=>{
 const {db,p,api,args}=await fixture();await api.capture(args);
 const before=await readPortfolioSyncRecord(db);
 await assert.rejects(()=>adoptPortfolioRecord(db,{expectedPortfolio:p,raw:p.raw,settings:p.settings}),/Synchronisierungslinie/);
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
});

test('atomic adoption double: cutover before capture fences every outbox entry and ordinary saves retain it',async()=>{
 const {db,p,api,args,model}=await fixture();
 const next=await adoptPortfolioRecord(db,{expectedPortfolio:p,raw:p.raw,settings:p.settings});
 assert.equal(next.revision,2);assert.equal(next.syncEnrollmentRequired,true);
 await assert.rejects(()=>api.capture(args),/stale-preimage/);
 await assert.rejects(()=>api.capture({...args,expectedLocalRevision:2}),/enrollment-required/);
 await assert.rejects(()=>api.begin({expectedLocalRevision:2,expectedSyncVersion:null,revisionId:'R'}),/enrollment-required/);
 await assert.rejects(()=>api.planApply({expectedLocalRevision:2,expectedSyncVersion:null,revisions:[],observationComplete:true}),/enrollment-required/);
 await assert.rejects(()=>api.recover(),/enrollment-required/);
 await assert.rejects(()=>api.confirm(),/remote-provenance-unavailable/);
 let edited=await commitPortfolioRecord(db,{expectedRevision:2,raw:p.raw,settings:model.settings});
 assert.equal(edited.syncEnrollmentRequired,true);
 edited=await commitPortfolioRecord(db,{expectedRevision:3,raw:p.raw,settings:model.settings,intent:'restore'});
 assert.equal(edited.syncEnrollmentRequired,true);
 const recovered=await restoreDamagedRecord(db,{expected:edited,raw:p.raw,settings:p.settings});
 assert.equal(recovered.syncEnrollmentRequired,true);assert.equal((await readPortfolioSyncRecord(db)).sync,null);
});

test('atomic adoption double: simultaneous capture/cutover cannot both succeed',async()=>{
 for(const adoptionFirst of [false,true]){
  const {db,p,api,args}=await fixture();
  const adopt=()=>adoptPortfolioRecord(db,{expectedPortfolio:p,raw:p.raw,settings:p.settings});
  const outcomes=await Promise.allSettled(adoptionFirst?[adopt(),api.capture(args)]:[api.capture(args),adopt()]);
  assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);
  const current=await readPortfolioSyncRecord(db);
  if(current.sync===null)assert.equal(current.portfolio.syncEnrollmentRequired,true);
  else assert.deepEqual(current.portfolio,p);
 }
});

test('atomic adoption double: full preimage, tombstone consent and source bytes are mandatory',async()=>{
 const {db,p}=await fixture(),before=await readPortfolioSyncRecord(db);
 await assert.rejects(()=>adoptPortfolioRecord(db,{raw:p.raw,settings:p.settings}),/preimage/);
 await assert.rejects(()=>adoptPortfolioRecord(db,{expectedPortfolio:{...p,updatedAt:'different'},raw:p.raw,settings:p.settings}),/stale-preimage/);
 const changed=JSON.parse(p.raw);changed.providers.push(createProvider({id:'other',name:'different',type:'broker'}));
 await assert.rejects(()=>adoptPortfolioRecord(db,{expectedPortfolio:p,raw:JSON.stringify(changed),settings:p.settings}),/data-mismatch/);
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
 const tombstone=await commitPortfolioRecord(db,{expectedRevision:1,raw:null,settings:null});
 await assert.rejects(()=>adoptPortfolioRecord(db,{expectedPortfolio:tombstone,raw:p.raw,settings:p.settings}),/tombstone/);
 assert.deepEqual((await readPortfolioSyncRecord(db)).portfolio,tombstone);
});

test('atomic adoption double: same-CAS changes during crypto block capture, begin, planning and recovery',async()=>{
 for(const mutation of ['raw','settings','updatedAt','syncEnrollmentRequired'])for(const action of ['capture','begin','planApply','recover']){
  const {db,p,api,args}=await fixture();await api.capture(args);const before=await readPortfolioSyncRecord(db);let once=true;
  const racing=createSyncOutboxStorage(db,async text=>{
   if(once){once=false;const replacement=structuredClone(p);
    if(mutation==='raw'){
     const changed=JSON.parse(p.raw);changed.providers.push(createProvider({id:'new',name:'replacement',type:'broker'}));
     replacement.raw=backup(changed,{includeHistory:true});
    }else if(mutation==='settings')replacement.settings={...p.settings,theme:p.settings.theme==='dark'?'light':'dark'};
    else replacement[mutation]=mutation==='syncEnrollmentRequired'?true:'replacement-time';
    db.data.set('portfolio',replacement); // deliberate same-CAS record replacement DOUBLE
   }return verify(text);
  });
  const call=action==='capture'?()=>racing.capture({...args,expectedSyncVersion:1}):
   action==='begin'?()=>racing.begin({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R'}):
   action==='planApply'?()=>racing.planApply({expectedLocalRevision:1,expectedSyncVersion:1,revisions:[],observationComplete:true}):()=>racing.recover();
  await assert.rejects(call,/preimage|race|enrollment-required/);
  const after=await readPortfolioSyncRecord(db);
  assert.equal(after.portfolio.revision,1);assert.deepEqual(after.sync,before.sync);
 }
});

test('atomic adoption double: metadata commit requires full detached portfolio and honors persistent fence',async()=>{
 const {db,p,api,args}=await fixture();const state=await api.capture(args);
 await assert.rejects(()=>commitPortfolioSyncRecord(db,{expectedLocalRevision:1,expectedState:state,nextState:state}),/preimage/);
 const fenced={...p,syncEnrollmentRequired:true};db.data.set('portfolio',fenced);
 const before=await readPortfolioSyncRecord(db);
 await assert.rejects(()=>commitPortfolioSyncRecord(db,{expectedLocalRevision:1,expectedPortfolio:fenced,expectedState:state,nextState:state}),/enrollment-required/);
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
});

test('atomic adoption double: quota/abort roll back record, fence and tombstone outbox invalidation together',async()=>{
 for(const tombstoned of [false,true])for(const fault of ['quota','abort-after-put']){
  const {db,p,api,args}=await fixture();let expected=p;
  if(tombstoned){await api.capture(args);expected=await commitPortfolioRecord(db,{expectedRevision:1,raw:null,settings:null});}
  const before=await readPortfolioSyncRecord(db);db.fault=fault;
  await assert.rejects(()=>adoptPortfolioRecord(db,{expectedPortfolio:expected,raw:p.raw,settings:p.settings,allowTombstone:tombstoned}));
  assert.deepEqual(await readPortfolioSyncRecord(db),before);
 }
});

test('atomic adoption factory double: marker failure keeps durable fence; interrupted new/migrate resume safely',async()=>{
 for(const migration of [false,true]){
  const db=memoryDB(),model=blankModel(),local=localFixture();const original=local.storage.setItem;let fail=true;
  local.storage.setItem=(key,value)=>{if(key===MODE_KEY&&fail){fail=false;throw Error('marker-double');}return original(key,value);};
  const controller=new PortfolioStorage(local.storage);
  await withFactory(db,()=>assert.rejects(()=>migration?controller.migrate(model):controller.initializeNew(),/marker-double/));
  const committed=await readPortfolioSyncRecord(db);
  assert.equal(committed.portfolio.syncEnrollmentRequired,true);assert.equal(committed.portfolio.revision,1);
  assert.equal(local.storage.getItem(MODE_KEY),null);
  const api=createSyncOutboxStorage(db,verify),receipt=await verify(frame(committed.portfolio.raw));
  await assert.rejects(()=>api.capture({expectedLocalRevision:1,expectedSyncVersion:null,receipt,expectedPortfolioId:portfolioId,expectedEpochId:epochId}),/enrollment-required/);
  const resumed=new PortfolioStorage(local.storage);
  await withFactory(db,()=>migration?resumed.migrate(model):resumed.initializeNew());
  assert.equal(resumed.revision,2);assert.equal(local.storage.getItem(MODE_KEY),MODE_VALUE);
  assert.equal((await readPortfolioSyncRecord(db)).portfolio.syncEnrollmentRequired,true);
 }
});

test('atomic adoption double: second put failure preserves tombstone and all encrypted attempts',async()=>{
 for(const fault of ['quota','abort']){
  const {db,p,api,args}=await fixture();await api.capture(args);await api.begin({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R'});
  const tombstone=await commitPortfolioRecord(db,{expectedRevision:1,raw:null,settings:null}),before=await readPortfolioSyncRecord(db);
  const transaction=db.transaction;db.transaction=function(...a){const tx=transaction.apply(db,a),objectStore=tx.objectStore;
   tx.objectStore=function(...b){const store=objectStore.apply(tx,b),put=store.put;
    store.put=function(value,key){if(key==='sync-outbox-v1'){
     if(fault==='quota')throw new DOMException('adoption-second-put','QuotaExceededError');
     const result=put.call(store,value,key);tx.abort();return result;
    }return put.call(store,value,key);};return store;};return tx;};
  await assert.rejects(()=>adoptPortfolioRecord(db,{expectedPortfolio:tombstone,raw:p.raw,settings:p.settings,allowTombstone:true}));
  assert.deepEqual(await readPortfolioSyncRecord(db),before);
 }
});

test('atomic adoption double: caller mutation cannot change preimages, preferences or captured next state',async()=>{
 const {db,p}=await fixture(),expected=structuredClone(p),settings=structuredClone(p.settings);
 const pending=adoptPortfolioRecord(db,{expectedPortfolio:expected,raw:p.raw,settings});
 expected.updatedAt='caller-change';settings.theme='caller-change';const committed=await pending;
 assert.deepEqual(committed.settings,p.settings);
 assert.equal(committed.raw,p.raw);assert.equal(committed.syncEnrollmentRequired,true);
});
