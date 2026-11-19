import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,backup,createProvider} from '../src/model.js';
import {commitPortfolioRecord,readPortfolioSyncRecord} from '../src/atomic-storage.js';
import {createSyncOutboxStorage} from '../experimental/sync/sync-outbox-storage.js';
import {appendSyncOutboxState} from '../experimental/sync/sync-outbox-state.js';
import {createSyncFrameVerifier,readVerifiedSyncFrame} from '../experimental/sync/sync-frame-verifier.js';
import {memoryDB} from './transaction-double.mjs';
import {frame,snapshotFrame,verify,portfolioId,epochId} from './sync-outbox-fixture.mjs';

async function fixture() {
 const db=memoryDB(),model=blankModel();
 model.settings.coinGeckoKey='LOCAL-ONLY-TEST';
 const portfolio=await commitPortfolioRecord(db,{expectedRevision:null,raw:backup(model,{includeHistory:true}),settings:model.settings});
 const api=createSyncOutboxStorage(db,verify);
 const capture={expectedLocalRevision:1,expectedSyncVersion:null,expectedPortfolioId:portfolioId,expectedEpochId:epochId};
 return {db,model,portfolio,api,capture};
}

test('capture only accepts the exact local financial snapshot and keeps local settings in IndexedDB',async()=>{
 const {db,model,portfolio,api,capture}=await fixture();
 const before=await readPortfolioSyncRecord(db);
 const substituted=structuredClone(model);
 substituted.providers.push(createProvider({id:'different',name:'Other',type:'broker'}));
 for(const text of [frame(portfolio.raw),snapshotFrame(backup(substituted,{includeHistory:true}))]){
  const receipt=await verify(text);
  await assert.rejects(()=>api.capture({...capture,receipt}),/capture-binding/);
  assert.deepEqual(await readPortfolioSyncRecord(db),before);
 }
 const text=snapshotFrame(portfolio.raw);
 const receipt=await verify(text);
 await api.capture({...capture,receipt});
 const sent=await api.begin({expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R'});
 assert.equal(sent.frameText,text);
 const data=JSON.parse(readVerifiedSyncFrame(await verify(sent.frameText)).plain).data;
 const {settings,...expected}=JSON.parse(portfolio.raw);
 assert.deepEqual(data,expected);
 assert.equal(Object.hasOwn(data,'settings'),false);
 assert.equal((await readPortfolioSyncRecord(db)).portfolio.settings.coinGeckoKey,'LOCAL-ONLY-TEST');
 assert.deepEqual((await readPortfolioSyncRecord(db)).portfolio,portfolio);
});

test('another verifier with matching IDs cannot seed an unrecoverable outbox',async()=>{
 const {db,portfolio,api,capture}=await fixture();
 const foreign=Buffer.alloc(32,88);
 const key=await crypto.subtle.importKey('raw',foreign,'HKDF',false,['deriveKey']);
 const other=createSyncFrameVerifier({portfolioId,epochId,key});
 const receipt=await other(snapshotFrame(portfolio.raw,'R',null,'1','77'.repeat(32),foreign));
 await assert.rejects(()=>api.capture({...capture,receipt}),/authentication/);
 assert.deepEqual(await readPortfolioSyncRecord(db),{portfolio,sync:null});
});

test('old raw frames and authenticated non-snapshot data remain intact and cannot be retried or applied',async()=>{
 const {db,portfolio,api,capture}=await fixture();
 for(const plain of [portfolio.raw,JSON.stringify({kind:'FolioLabSyncSnapshot',snapshotVersion:1,data:JSON.parse(portfolio.raw),configuration:{}})]){
  const receipt=await verify(frame(plain));
  const old=appendSyncOutboxState({portfolio:{...portfolio,raw:plain},receipt,expectedPortfolioId:portfolioId,expectedEpochId:epochId});
  db.data.set('sync-outbox-v1',old);
  const before=await readPortfolioSyncRecord(db);
  const args={expectedSyncVersion:1,expectedLocalRevision:1,revisionId:'R'};
  for(const read of [()=>api.recover(),()=>api.begin(args),()=>api.planApply({...args,revisions:[],observationComplete:true}),()=>api.capture({...capture,...args,receipt})]){
   await assert.rejects(read,/sync-snapshot/);
   assert.deepEqual(await readPortfolioSyncRecord(db),before);
  }
 }
});

test('financial substitution already present at the same revision blocks reopen, retry and apply planning',async()=>{
 const {db,portfolio,model,api,capture}=await fixture();
 await api.capture({...capture,receipt:await verify(snapshotFrame(portfolio.raw))});
 model.providers.push(createProvider({id:'other',name:'Changed',type:'broker'}));
 db.data.set('portfolio',{...portfolio,raw:backup(model,{includeHistory:true})});
 const before=await readPortfolioSyncRecord(db);
 const args={expectedSyncVersion:1,expectedLocalRevision:1,revisionId:'R'};
 await assert.rejects(()=>api.recover(),/local-snapshot-mismatch/);
 await assert.rejects(()=>api.begin(args),/local-snapshot-mismatch/);
 assert.equal((await api.planApply({...args,revisions:[],observationComplete:true})).reason,'local-snapshot-mismatch');
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
});
