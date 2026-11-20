import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,backup,createProvider} from '../src/model.js';
import {commitPortfolioRecord,readPortfolioSyncRecord,restoreDamagedRecord,commitPortfolioSyncRecord,adoptPortfolioRecord} from '../src/atomic-storage.js';
import {verifySyncOutboxState,advanceSyncOutboxState} from '../experimental/sync/sync-outbox-state.js';
import {createSyncOutboxStorage} from '../experimental/sync/sync-outbox-storage.js';
import {PortfolioStorage,MODE_KEY,MODE_VALUE} from '../src/browser-portfolio-storage.js';
import {portfolioId,epochId,verify,snapshotFrame as frame} from './sync-outbox-fixture.mjs';

import {memoryDB} from './transaction-double.mjs';

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
 await withFactory(db,async()=>{
  const before=await readPortfolioSyncRecord(db);
  db.fault='abort-after-put';await assert.rejects(()=>controller.save(model,{intent:'restore'}));
  assert.equal(controller.revision,1);assert.deepEqual(await readPortfolioSyncRecord(db),before);
  await controller.save(model,{intent:'restore'});
  assert.equal(controller.revision,2);assert.equal((await readPortfolioSyncRecord(db)).sync.disabled,'portfolio-restored');
  assert.equal((await readPortfolioSyncRecord(db)).portfolio.raw,p.raw);
  await assert.rejects(()=>controller.save(model,{intent:'unknown'}),/Speichergrund/);
  assert.equal(controller.revision,2);
 });
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
 db.version=1;
 db.objectStoreNames={contains:name=>name==='records'};
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

test('reopening and retry refuse an uncertain successor behind another outstanding frame',async()=>{
 const {db,api,args,model}=await fixture();
 await api.capture(args);
 const second=await commitPortfolioRecord(db,{expectedRevision:1,raw:backup(model,{includeHistory:true}),settings:model.settings});
 const receipt=await verify(frame(second.raw,'S','R','2','56'.repeat(32)));
 const queued=await api.capture({...args,receipt,expectedLocalRevision:2,expectedSyncVersion:1});
 for(const predecessor of ['pending','uncertain']){
  const damaged=structuredClone(queued);
  damaged.entries[0].status=predecessor;
  damaged.entries[1].status='uncertain';
  db.data.set('sync-outbox-v1',damaged);
  const before=await readPortfolioSyncRecord(db);
  const reopened=createSyncOutboxStorage(db,verify);
  await assert.rejects(()=>reopened.recover(),/attempt-order/);
  await assert.rejects(()=>reopened.begin({expectedLocalRevision:2,expectedSyncVersion:queued.version,revisionId:'S'}),/attempt-order/);
  assert.deepEqual(await readPortfolioSyncRecord(db),before);
 }
 db.data.set('sync-outbox-v1',queued);
 await matchForModel(db,{revisionId:'R',readback:args.receipt});
 const allowed=await api.begin({expectedLocalRevision:2,expectedSyncVersion:queued.version+1,revisionId:'S'});
 assert.deepEqual(allowed.state.entries.map(entry=>entry.status),['confirmed','uncertain']);
 assert.deepEqual((await api.recover()).state,allowed.state);
});

test('a backend ignoring strict durability cannot return sendable bytes or advance the outbox',async()=>{
 const {db,api,args}=await fixture();
 await api.capture(args);
 const before=await readPortfolioSyncRecord(db),transaction=db.transaction.bind(db);
 db.transaction=(store,mode)=>transaction(store,mode);
 await assert.rejects(()=>api.begin({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R'}),/strict-durability-unavailable/);
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
});

test('frame planning verifies the whole encrypted branch and classifies forks without mutation',async()=>{
 const {db,p,api,args}=await fixture();await api.capture(args);
 const before=await readPortfolioSyncRecord(db),root=frame(p.raw);
 const child=frame(p.raw,'B','R','2','41'.repeat(32)),tip=frame(p.raw,'C','B','3','42'.repeat(32));
 const sibling=frame(p.raw,'X','R','2','43'.repeat(32));
 const plan=(frameTexts,observationComplete=true)=>api.planFrameApply({expectedLocalRevision:1,expectedSyncVersion:1,frameTexts,observationComplete});
 const next=await plan([tip,child,root,child]);
 assert.equal(next.status,'apply-candidate');assert.equal(next.candidateId,'C');assert.equal(next.applyAuthorized,false);
 const fork=await plan([tip,sibling,child]);assert.equal(fork.status,'conflict');assert.deepEqual(fork.heads,['C','X']);
 assert.equal((await plan([tip])).reason,'missing-parent');
 assert.equal((await plan([child],false)).reason,'incomplete-observation');
 assert.equal((await plan([root])).status,'unchanged');
 for(const batch of [[frame(p.raw,'R',null,'1','45'.repeat(32))],[child,frame(p.raw,'B','R','2','46'.repeat(32))]])
  await assert.rejects(()=>plan(batch),/identity-collision/);
 await assert.rejects(()=>plan([tip,frame(p.raw,'B','R','2','41'.repeat(32),Buffer.alloc(32,99))]),/authentication/);
 const bad=JSON.parse(p.raw);bad.purchaseEvidence={privateExtension:true};
 await assert.rejects(()=>plan([tip,frame(JSON.stringify(bad),'B','R','2')]));
 for(const batch of [[{}],Array(2049).fill(''),['x'.repeat(15000001)],Array(4).fill('x'.repeat(8000000))])
  await assert.rejects(()=>plan(batch),/frame-batch-limit/);
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
});

test('frame planning detaches the listing and discards a result raced by another save during remote verification',async()=>{
 const {db,p,api,args}=await fixture();await api.capture(args);
 const child=frame(p.raw,'B','R','2','49'.repeat(32)),batch=[child];
 const request={expectedLocalRevision:1,expectedSyncVersion:1,frameTexts:batch,observationComplete:true};
 const first=api.planFrameApply(request);batch[0]='altered';
 assert.equal((await first).candidateId,'B');
 const racing=createSyncOutboxStorage(db,async text=>{
  const receipt=await verify(text);
  if(text===child)await commitPortfolioRecord(db,{expectedRevision:1,raw:p.raw,settings:p.settings});
  return receipt;
 });
 await assert.rejects(()=>racing.planFrameApply({...request,frameTexts:[child]}),/apply-plan-race/);
 const after=await readPortfolioSyncRecord(db);assert.equal(after.portfolio.revision,2);
 assert.equal(after.sync.entries.length,1);assert.equal(after.sync.entries[0].status,'pending');
});

test('present nullish outbox slots survive capture, cutover, restore and explicit recovery',async()=>{
 for(const value of [null,undefined]){
  const {db,p,api,args}=await fixture();db.data.set('sync-outbox-v1',value);
  for(const action of [()=>api.recover(),()=>api.capture(args),
   ()=>adoptPortfolioRecord(db,{expectedPortfolio:p,raw:p.raw,settings:p.settings})])
   await assert.rejects(action,/malformed-outbox-slot/);
  assert.deepEqual(db.data.get('portfolio'),p);
  const restored=await commitPortfolioRecord(db,{expectedRevision:p.revision,raw:p.raw,settings:p.settings,intent:'restore'});
  await restoreDamagedRecord(db,{expected:restored,raw:p.raw,settings:p.settings});
  assert.equal(db.data.has('sync-outbox-v1'),true);assert.equal(db.data.get('sync-outbox-v1'),value);
  await assert.rejects(()=>api.recover(),/malformed-outbox-slot/);
 }
});

test('outbox commits recheck keyslot presence and cannot overwrite a nullish slot inserted during verification',async()=>{
 for(const key of ['sync-local-anchor-v1','sync-outbox-v1'])for(const value of [null,undefined]){
  const {db,p,args}=await fixture();
  const api=createSyncOutboxStorage(db,async text=>{
   const receipt=await verify(text);db.data.set(key,value);return receipt;
  });
  const reason=key==='sync-outbox-v1'?/malformed-outbox-slot/:/unfenced-anchor/;
  await assert.rejects(()=>api.capture(args),reason);
  await assert.rejects(()=>api.recover(),reason);
  await assert.rejects(()=>adoptPortfolioRecord(db,{expectedPortfolio:p,raw:p.raw,settings:p.settings}),reason);
  assert.deepEqual(db.data.get('portfolio'),p);
  assert.equal(db.data.has(key),true);assert.equal(db.data.get(key),value);
  assert.equal(db.data.has('sync-outbox-v1'),key==='sync-outbox-v1');
 }
});

test('native values hidden by JSON cannot pass the outbox preimage after verification',async()=>{
 for(const action of ['capture','begin','recover','planFrameApply'])for(const slot of ['portfolio','sync-outbox-v1']){
  const {db,p,api,args}=await fixture();await api.capture(args);
  const before=structuredClone(db.data);
  const raced=createSyncOutboxStorage(db,async text=>{
   const value=structuredClone(db.data.get(slot));value.extra=undefined;db.data.set(slot,value);
   return verify(text);
  });
  const params={expectedLocalRevision:p.revision,expectedSyncVersion:1};
  const call={capture:()=>raced.capture({...args,...params}),begin:()=>raced.begin({...params,revisionId:'R'}),
   recover:()=>raced.recover(),planFrameApply:()=>raced.planFrameApply({...params,frameTexts:[],observationComplete:true})};
  await assert.rejects(call[action],/unsupported-preimage/);
  before.get(slot).extra=undefined;assert.deepEqual(db.data,before);
 }
});
test('cutover cannot equate distinct structured-clone data with the same JSON encoding',async()=>{
 const shared={id:'example'};
 for(const [original,replacement] of [[null,NaN],[0,-0],['2026-01-01T00:00:00.000Z',new Date('2026-01-01')],
  [{},new Map()],[[null],Array(1)],[[1],Object.assign([1],{metadata:true})],[shared,{...shared,extra:undefined}]]){
  const {db,p}=await fixture(),expected={...p,metadata:original},actual={...p,metadata:replacement};
  assert.equal(JSON.stringify(expected),JSON.stringify(actual));db.data.set('portfolio',actual);
  await assert.rejects(()=>adoptPortfolioRecord(db,{expectedPortfolio:expected,raw:p.raw,settings:p.settings}),/unsupported-preimage/);
  assert.deepEqual(db.data.get('portfolio'),actual);
 }
});

test('selected conflict heads are compared to the nearest shared ancestor without leaking portfolio values',async()=>{
 const {db,p,api,args}=await fixture();await api.capture(args);
 const before=await readPortfolioSyncRecord(db),baseline=JSON.parse(p.raw);
 baseline.providers.push(createProvider({id:'private-broker',name:'Sensitive source',type:'broker'}));
 const left=structuredClone(baseline),right=structuredClone(baseline);
 left.providers[0].name='Sensitive left';right.providers[0].name='Sensitive right';
 left.performanceFlowTrackingSince='2026-11-01';
 right.snapshots.push({id:'snap',date:'2026-11-01',total:1,totalEURExact:'1',recordedAt:null,byAccount:null,
  byPosition:null,valuationStatus:'manual',source:'manual',quoteTimes:[],revisions:[],note:''});
 const middle=frame(JSON.stringify(baseline),'M','R','2','45'.repeat(32));
 const l=frame(JSON.stringify(left),'L','M','3','46'.repeat(32)),r=frame(JSON.stringify(right),'S','M','3','47'.repeat(32));
 const third=frame(p.raw,'T','R','2','49'.repeat(32));
 const pair=['L','S'];
 const request={expectedLocalRevision:1,expectedSyncVersion:1,frameTexts:[r,third,l,middle],observationComplete:true,comparisonHeads:pair};
 const pending=api.planFrameApply(request);pair.reverse();const result=await pending;
 assert.equal(result.status,'conflict');assert.equal(result.applyAuthorized,false);
 assert.deepEqual(result.comparison,{status:'compared',baseId:'M',leftId:'L',rightId:'S',sections:[
  {section:'performanceFlowTrackingSince',change:'left-only'},{section:'providers',change:'both-different'},{section:'snapshots',change:'right-only'}]});
 assert.doesNotMatch(JSON.stringify(result),/Sensitive|private-broker|2026-11-01/);
 const equal=await api.planFrameApply({...request,frameTexts:[middle,l,frame(JSON.stringify(left),'S','M','3','48'.repeat(32))]});
 assert.equal(equal.status,'conflict');assert.deepEqual(equal.comparison.sections,[
  {section:'performanceFlowTrackingSince',change:'both-equal'},{section:'providers',change:'both-equal'}]);
 for(const heads of [['M','L'],['L','absent'],['S','S'],['L'],null])
  await assert.rejects(()=>api.planFrameApply({...request,comparisonHeads:heads}),/comparison/);
 const separate=await api.planFrameApply({...request,comparisonHeads:['L','Z'],frameTexts:[l,middle,frame(p.raw,'Z',null,'1','50'.repeat(32))]});
 assert.deepEqual(separate.comparison,{status:'no-common-ancestor',leftId:'L',rightId:'Z'});
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
});

test('a concurrent edit during selected-branch comparison discards the whole comparison',async()=>{
 const {db,p,api,args}=await fixture();await api.capture(args);
 const child=frame(p.raw,'L','R','2','51'.repeat(32)),sibling=frame(p.raw,'S','R','2','52'.repeat(32));
 let reads=0;
 const racing=createSyncOutboxStorage(db,async text=>{
  if(text===sibling&&++reads===2)await commitPortfolioRecord(db,{expectedRevision:1,raw:p.raw,settings:p.settings});
  return verify(text);
 });
 await assert.rejects(()=>racing.planFrameApply({expectedLocalRevision:1,expectedSyncVersion:1,frameTexts:[child,sibling],
  observationComplete:true,comparisonHeads:['L','S']}),/apply-plan-race/);
 assert.equal(reads,2);assert.equal((await readPortfolioSyncRecord(db)).sync.version,1);
});

test('conflict archive preserves every encrypted branch and ancestor and reopens under an independent pin',async()=>{
 const {db,p,api,args}=await fixture();await api.capture(args);
 const initial=await readPortfolioSyncRecord(db);
 const child=(id,parent,gen,n)=>frame(p.raw,id,parent,gen,n.repeat(32));
 const r=frame(p.raw),b=child('B','R','2','61'),c=child('C','B','3','62'),d=child('D','R','2','63'),z=child('Z','R','2','64');
 const cas={expectedLocalRevision:1,expectedSyncVersion:1},request={...cas,frameTexts:[d,z,b,c,b],observationComplete:true};
 const saved=await api.createConflictArchive(request),{text,digest}=saved.archive;
 const [header,...frames]=text.split('\n');assert.match(header,/^FolioLabConflict\/1 1 1 [0-9a-f]{64}$/);
 assert.deepEqual(frames,[b,c,d,r,z]);
 const {createHash}=await import('node:crypto');const pin=t=>createHash('sha256').update(t).digest('hex');
 assert.equal(digest,pin(text));assert.equal(saved.applyAuthorized,false);
 const restarted=createSyncOutboxStorage(db,verify);
 const reopen=(t,hash=digest)=>restarted.reopenConflictArchive({...cas,text:t,expectedDigest:hash,comparisonHeads:['C','D']});
 const restored=await reopen(text);assert.deepEqual(restored.heads,['C','D','Z']);
 assert.equal(restored.comparison.baseId,'R');assert.equal(restored.applyAuthorized,false);
 assert.deepEqual((await api.createConflictArchive({...request,frameTexts:[z,c,d,b]})).archive,saved.archive);
 await assert.rejects(()=>reopen(text.replace('\n'+z,'')),/digest/);
 for(const altered of [text.replace('\n'+r,''),text+'\n'+b])
  await assert.rejects(()=>reopen(altered,pin(altered)),/noncanonical/);
 await assert.rejects(()=>api.createConflictArchive({...request,observationComplete:false}),/needs-conflict/);
 assert.deepEqual(await readPortfolioSyncRecord(db),initial);
 await commitPortfolioRecord(db,{expectedRevision:1,raw:p.raw,settings:p.settings});
 await assert.rejects(()=>reopen(text),/stale-preimage/);
});

test('conflict archive is bound to the actual local queue even if the revision counters match',async()=>{
 const first=await fixture(),second=await fixture();await first.api.capture(first.args);
 const other=frame(first.p.raw,'S',null,'1','66'.repeat(32));
 await second.api.capture({...second.args,receipt:await verify(other)});
 const cas={expectedLocalRevision:1,expectedSyncVersion:1};
 const {archive}=await first.api.createConflictArchive({...cas,frameTexts:[other],observationComplete:true});
 await assert.rejects(()=>second.api.reopenConflictArchive({...cas,text:archive.text,expectedDigest:archive.digest}),/noncanonical/);
});

test('durable archive pin serializes competing observations, preserves prior pin on abort, and rejects stale local records',async()=>{
 const {db,p,api,args}=await fixture();await api.capture(args);
 const cas={expectedLocalRevision:1,expectedSyncVersion:1};
 const make=async(id,salt)=>(await api.createConflictArchive({...cas,observationComplete:true,frameTexts:[
  frame(p.raw,'B','R','2','81'.repeat(32)),frame(p.raw,id,'R','2',salt.repeat(32))]})).archive;
 const variants=[await make('C','82'),await make('D','83')];
 const pin=(a,n)=>api.pinConflictArchive({...cas,text:a.text,expectedDigest:a.digest,expectedPinVersion:n});
 const reopen=a=>createSyncOutboxStorage(db,verify).reopenPinnedConflictArchive({text:a.text});
 await assert.rejects(()=>reopen(variants[0]),/pin-missing/);
 const both=await Promise.allSettled(variants.map(a=>pin(a,0)));
 assert.deepEqual(both.map(x=>x.status).sort(),['fulfilled','rejected']);
 const i=both.findIndex(x=>x.status==='fulfilled'),first=variants[i],second=variants[1-i];
 assert.equal((await pin(first,0)).pinVersion,1);
 db.fault='abort-after-put';await assert.rejects(()=>pin(second,1));
 assert.equal((await reopen(first)).pinVersion,1);await assert.rejects(()=>reopen(second),/archive-digest/);
 assert.equal((await pin(second,await api.archivePinVersion())).pinVersion,2);
 await assert.rejects(()=>pin(first,0),/pin-version/);
 await assert.rejects(()=>reopen(first),/archive-digest/);
 const record=db.data.get('portfolio');db.data.set('portfolio',{...record,updatedAt:'changed'});
 await assert.rejects(()=>reopen(second),/pin-binding/);
 db.data.set('portfolio',record);
 await commitPortfolioRecord(db,{expectedRevision:1,raw:p.raw,settings:p.settings});
 await assert.rejects(()=>reopen(second),/stale-preimage/);
});

test('present malformed archive pins are retained and cannot be adopted as an empty slot',async()=>{
 const {api,db,p,args}=await fixture();await api.capture(args);
 const cas={expectedLocalRevision:1,expectedSyncVersion:1};
 const {archive}=await api.createConflictArchive({...cas,observationComplete:true,frameTexts:[
  frame(p.raw,'C','R','2','84'.repeat(32)),frame(p.raw,'D','R','2','85'.repeat(32))]});
 for(const bad of [null,undefined,{version:1,digest:archive.digest}]){
  db.data.set('sync-conflict-archive-pin-v1',bad);
  await assert.rejects(()=>api.archivePinVersion(),/pin-malformed/);
  await assert.rejects(()=>api.pinConflictArchive({...cas,text:archive.text,expectedDigest:archive.digest,expectedPinVersion:0}),/pin-malformed/);
  assert.ok(db.data.has('sync-conflict-archive-pin-v1'));assert.deepEqual(db.data.get('sync-conflict-archive-pin-v1'),bad);
 }
});

test('restore preview binds the explicit head to the pinned archive and current portfolio until return',async()=>{
 const {db,p,api,args}=await fixture();await api.capture(args);
 const edited=JSON.parse(p.raw);edited.performanceFlowTrackingSince='2026-11-01';
 const left=frame(JSON.stringify(edited),'L','R','2','91'.repeat(32)),right=frame(p.raw,'S','R','2','92'.repeat(32));
 const cas={expectedLocalRevision:1,expectedSyncVersion:1};
 const {archive}=await api.createConflictArchive({...cas,observationComplete:true,frameTexts:[left,right]});
 await api.pinConflictArchive({...cas,expectedPinVersion:0,expectedDigest:archive.digest,text:archive.text});
 const request={text:archive.text,selectedHead:'L',expectedPinVersion:1};
 const before=await readPortfolioSyncRecord(db);
 const selected=await api.previewPinnedRestore(request);
 assert.deepEqual(selected.restorePreview,{selectedHead:'L',changedSections:['performanceFlowTrackingSince'],
  positions:0,bookings:0,journalEntries:0});
 assert.equal(selected.applyAuthorized,false);
 assert.deepEqual((await api.previewPinnedRestore({...request,selectedHead:'S'})).restorePreview.changedSections,[]);
 for(const selectedHead of ['R',null,'missing'])await assert.rejects(()=>api.previewPinnedRestore({...request,selectedHead}),/preview/);
 await assert.rejects(()=>api.previewPinnedRestore({...request,expectedPinVersion:2}),/pin-version/);
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
 let passes=0;
 const racing=createSyncOutboxStorage(db,async text=>{
  if(text===left&&++passes===2)await commitPortfolioRecord(db,{expectedRevision:1,raw:p.raw,settings:p.settings});
  return verify(text);
 });
 await assert.rejects(()=>racing.previewPinnedRestore(request),/pin-preimage/);
 assert.equal(passes,2);
});
