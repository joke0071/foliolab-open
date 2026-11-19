import assert from 'node:assert/strict';
import {snapshotFrame as frame} from './sync-outbox-fixture.mjs';

// Hold the return of a real remote-frame verification while a second tab commits.
async function checkCrossTabFramePlan(browser,setup,operation){
 const context=await browser.newContext();
 try{
  const a=await context.newPage(),b=await context.newPage();await setup(a);await setup(b);
  const root=await operation(a,'initialize');
  const queue=await operation(a,'capture',{expectedLocalRevision:root.revision,expectedSyncVersion:null,frameText:frame(root.raw)});
  const request={expectedLocalRevision:root.revision,expectedSyncVersion:queue.version,observationComplete:true,
   frameTexts:[frame(root.raw,'B','R','2','71'.repeat(32))]};
  const stable=await a.evaluate(request=>window.syncTest.api.planFrameApply(request),request);
  assert.equal(stable.candidateId,'B');assert.equal(stable.applyAuthorized,false);
  await a.evaluate(async request=>{
   const {createSyncOutboxStorage}=await import('/experimental/sync/sync-outbox-storage.js');
   const {db,verify}=window.syncTest;
   const api=createSyncOutboxStorage(db,async text=>{
    const receipt=await verify(text);
    if(text===request.frameTexts[0])await new Promise(resolve=>{window.releaseFramePlan=resolve;});
    return receipt;
   });
   window.framePlan=api.planFrameApply(request).then(result=>result,error=>({error:error.message}));
  },request);
  await a.waitForFunction(()=>typeof window.releaseFramePlan==='function');
  const updated=await operation(b,'save',{revision:root.revision,raw:root.raw});
  const result=await a.evaluate(()=>{window.releaseFramePlan();return window.framePlan;});
  assert.deepEqual(result,{error:'sync-outbox-apply-plan-race'});
  assert.deepEqual(await operation(a,'read'),{portfolio:updated,sync:queue});
  // The version and serialized JSON can both stay unchanged after an IndexedDB update.
  await b.evaluate(async updated=>{
   const tx=window.syncTest.db.transaction('records','readwrite');
   tx.objectStore('records').put({...updated,extra:undefined},'portfolio');
   await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});
  },updated);
  await assert.rejects(()=>a.evaluate(({updated,queue})=>{
   const {db,storage}=window.syncTest;
   return storage.commitPortfolioSyncRecord(db,{expectedLocalRevision:updated.revision,expectedPortfolio:updated,
    expectedState:queue,nextState:queue});
  },{updated,queue}),/unsupported-preimage/);
  const preserved=await a.evaluate(async()=>{
   const {db,storage}=window.syncTest,record=await storage.readPortfolioSyncRecord(db);
   return {extra:Object.hasOwn(record.portfolio,'extra'),revision:record.portfolio.revision,sync:record.sync};
  });
  assert.deepEqual(preserved,{extra:true,revision:updated.revision,sync:queue});
  console.log(JSON.stringify({kind:'FLH04CrossTabFramePlan',status:'PASS',engine:browser.version()}));
 }finally{await context.close();}
}

async function checkMalformedSyncSlots(browser,setup,operation){
 const context=await browser.newContext();
 try{
  const a=await context.newPage(),b=await context.newPage();await setup(a);await setup(b);
  const root=await operation(a,'initialize'),request={expectedLocalRevision:root.revision,expectedSyncVersion:null,frameText:frame(root.raw)};
  for(const key of ['sync-outbox-v1','sync-local-anchor-v1'])for(const isNull of [true,false]){
   await b.evaluate(async({key,isNull})=>{
    const tx=window.syncTest.db.transaction('records','readwrite');
    tx.objectStore('records').put(isNull?null:undefined,key);
    await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});
   },{key,isNull});
   const reason=key==='sync-outbox-v1'?/malformed-outbox-slot/:/unfenced-anchor/;
   await assert.rejects(()=>operation(a,'capture',request),reason);
   await assert.rejects(()=>operation(a,'adopt',{expected:root,raw:root.raw}),reason);
   const originals=await b.evaluate(async key=>{
    const tx=window.syncTest.db.transaction('records','readwrite'),store=tx.objectStore('records');
    const count=store.count(key),value=store.get(key),portfolio=store.get('portfolio');
    store.delete(key);
    await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});
    return {count:count.result,isNull:value.result===null,isUndefined:value.result===undefined,portfolio:portfolio.result};
   },key);
   assert.deepEqual(originals,{count:1,isNull,isUndefined:!isNull,portfolio:root});
  }
  const captured=await operation(a,'capture',request);assert.equal(captured.entries.length,1);
  console.log(JSON.stringify({kind:'FLH04MalformedSyncSlots',status:'PASS',nativeCases:4}));
 }finally{await context.close();}
}

export async function runPortableProbes(browser,setup,operation){
 await checkCrossTabFramePlan(browser,setup,operation);
 await checkMalformedSyncSlots(browser,setup,operation);
}
