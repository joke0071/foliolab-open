// FLH04 C1 candidate probes, opt-in from the existing browser-sync-outbox harness.
// Synthetic fresh BrowserContexts only. NOT a product v2 adapter or crypto approval.
// Current product is expected to fail C1-MARKERS and C1-NO-REVERT until a separately
// reviewed product implementation exists. No expected failure is converted to PASS.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

export async function runVersion2Candidate({browser,setup,operation,url}) {
 const origin=new URL(url);
 assert.equal(origin.protocol,'http:','C1 requires a local HTTP test origin');
 assert.ok(['127.0.0.1','localhost'].includes(origin.hostname),'C1 forbids production origins');
 assert.equal(origin.pathname,'/tests/storage-origin.html');
 const results=[];
 async function scenario(id,body) {
  const context=await browser.newContext();
  try {
   const a=await context.newPage(),b=await context.newPage();
   await setup(a);await setup(b);
   const initial=await operation(a,'initialize');
   await operation(a,'adopt',{expected:initial,raw:initial.raw});
   await operation(a,'prepare-anchor');
   const original=await operation(a,'read'),proof=await operation(a,'anchor-proof');
   await body({a,b,context,original,proof});
   results.push({id,status:'PASS'});
  } catch(error) {
   results.push({id,status:'FAIL',errorType:error.name});
  } finally {await context.close();}
 }
 async function startUpgrade(page) {
  // Prototype of schema-only transition for THIS synthetic context.
  // This does not call or qualify a production cutover implementation.
  await page.evaluate(()=>{
   const t=window.syncTest;
   const state={blocked:false,cancelled:false,outcome:null};
   window.v2CandidateProbe=state;
   const request=indexedDB.open('foliolab-open-portfolio',2);
   request.onblocked=()=>{state.blocked=true;};
   request.onupgradeneeded=event=>{
    if(state.cancelled||event.oldVersion!==1||event.newVersion!==2||
       !request.result.objectStoreNames.contains('records'))request.transaction.abort();
    // NO record/store/index writes; NO crypto, network, timers or keepalive.
   };
   request.onerror=()=>{state.outcome={status:'aborted',errorName:request.error?.name};};
   request.onsuccess=()=>{
    const db=request.result;
    db.onversionchange=()=>db.close();
    if(state.cancelled){db.close();state.outcome={status:'unknown-after-cancel'};return;}
    t.db=db;state.outcome={status:'schema-committed',version:db.version};
   };
  });
 }
 async function outcome(page) {
  await page.waitForFunction(()=>window.v2CandidateProbe?.outcome!==null);
  return page.evaluate(()=>window.v2CandidateProbe.outcome);
 }
 async function upgraded(a,b) {
  // Existing setup installs onversionchange=>close on both old handles.
  await startUpgrade(b);
  assert.deepEqual(await outcome(b),{status:'schema-committed',version:2});
  assert.equal(await a.evaluate(()=>window.syncTest.db.version),1,
   'closed old handle does not become a v2 handle');
 }
 async function state(page,version=null){
  return page.evaluate(async version=>{
   const t=window.syncTest,wanted=version??t.db.version;
   const db=await new Promise((resolve,reject)=>{
    const request=indexedDB.open('foliolab-open-portfolio',wanted);
    request.onupgradeneeded=()=>request.transaction.abort();
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>resolve(request.result);
   });
   try{return await t.storage.readPortfolioSyncRecord(db);}
   finally{db.close();}
  },version);
 }
 async function legacy(page) {
  return page.evaluate(()=>Object.fromEntries(
   ['foliolab-open-v1','foliolab-open-storage-mode','foliolab-open-idb-revert-intent']
    .map(key=>[key,localStorage.getItem(key)])));
 }
 async function prepareLegacy(page,raw) {
  await page.evaluate(raw=>{
   localStorage.setItem('foliolab-open-v1',raw);
   localStorage.setItem('foliolab-open-storage-mode','idb-v1');
  },raw);
 }
 async function recovery(page,expected,{fault=false,lostResponse=false}={}) {
  return page.evaluate(async({expected,fault,lostResponse})=>{
   const t=window.syncTest;
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const controller=new PortfolioStorage(localStorage);
   // Explicit synthetic fixture attachment; not a supported product v2 startup.
   controller.mode='idb';controller.db=t.db;controller.revision=expected.revision;
   const model=t.model.safeImport(JSON.parse(expected.raw));
   model.providers.push({id:'c1-backup-provider',name:'C1 synthetic restore',type:'broker'});
   const originalPut=IDBObjectStore.prototype.put;
   if(fault)IDBObjectStore.prototype.put=function(value,key){
    if(key==='portfolio')throw new DOMException('C1 injected quota','QuotaExceededError');
    return originalPut.call(this,value,key);
   };
   try{
    const record=await controller.recoverFromBackup(model,expected);
    if(lostResponse)throw Error('C1 injected reply loss after completed API call');
    return {revision:record.revision};
   }finally{IDBObjectStore.prototype.put=originalPut;}
  },{expected,fault,lostResponse});
 }

 await scenario('C1-CANCEL',async({a,b,original,proof})=>{
  await a.evaluate(()=>{window.syncTest.db.onversionchange=()=>{};});
  await startUpgrade(b);
  await b.waitForFunction(()=>window.v2CandidateProbe.blocked===true);
  await b.evaluate(()=>{window.v2CandidateProbe.cancelled=true;});
  await a.evaluate(()=>window.syncTest.db.close());
  assert.deepEqual(await outcome(b),{status:'aborted',errorName:'AbortError'});
  await b.evaluate(async()=>{window.syncTest.db=await window.syncTest.storage.openPortfolioDB();});
  assert.equal(await b.evaluate(()=>window.syncTest.db.version),1);
  assert.deepEqual(await state(b),original);
  assert.deepEqual(await operation(b,'anchor-proof'),proof);
 });

 await scenario('C1-VERSION-FENCE',async({a,b,original,proof})=>{
  await upgraded(a,b);
  assert.deepEqual(await state(b),original);
  assert.deepEqual(await operation(b,'anchor-proof'),proof);
  const oldReopen=await a.evaluate(async()=>{
   try{const db=await window.syncTest.storage.openPortfolioDB();db.close();return 'unexpected-open';}
   catch(error){return error.name;}
  });
  assert.equal(oldReopen,'VersionError');
  assert.deepEqual(await state(b),original);
 });

 await scenario('C1-MARKERS',async({a,b,original,proof})=>{
  await upgraded(a,b);
  await prepareLegacy(b,original.portfolio.raw);
  await b.evaluate(()=>{
   localStorage.removeItem('foliolab-open-storage-mode');
   localStorage.setItem('foliolab-open-idb-revert-intent',
    JSON.stringify({revision:1,fingerprint:'stale-synthetic-intent'}));
  });
  const disposition=await b.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const store=new PortfolioStorage(localStorage);
   try{await store.initialize();return store.isIndexedDB?'idb':'legacy';}
   catch{return 'blocked';}
   finally{store.close();}
  });
  assert.deepEqual(await state(b),original);
  assert.deepEqual(await operation(b,'anchor-proof'),proof);
  assert.notEqual(disposition,'legacy',
   'Confirmed v2 must not adopt legacy data after an old marker tail');
 });

 await scenario('C1-NO-REVERT',async({a,b,original})=>{
  await upgraded(a,b);
  await prepareLegacy(b,original.portfolio.raw);
  const beforeLegacy=await legacy(b);
  const result=await b.evaluate(async()=>{
   const t=window.syncTest;
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const store=new PortfolioStorage(localStorage);
   store.mode='idb';store.db=t.db;
   store.revision=(await t.storage.readPortfolioRecord(t.db)).revision;
   const model=t.model.safeImport(JSON.parse((await t.storage.readPortfolioRecord(t.db)).raw));
   try{await store.revert(model);return {rejected:false};}
   catch(error){return {rejected:true,errorName:error.name};}
  });
  assert.deepEqual(await state(b),original,'No tombstone or other record write before v2 rejection');
  assert.deepEqual(await legacy(b),beforeLegacy,'No target/intent/marker write before v2 rejection');
  assert.equal(result.rejected,true,'The retained internal revert path must reject confirmed v2');
 });

 await scenario('C1-RESTORE-CAS',async({a,b,original,proof})=>{
  await upgraded(a,b);
  await prepareLegacy(b,original.portfolio.raw);
  const changed=JSON.parse(original.portfolio.raw);
  changed.providers.push({id:'c1-newer-save',name:'C1 newer local save',type:'broker'});
  await operation(b,'save',{revision:original.portfolio.revision,raw:JSON.stringify(changed)});
  const newer=await state(b);
  await assert.rejects(()=>recovery(b,original.portfolio));
  assert.deepEqual(await state(b),newer,'Stale backup restore must not overwrite newer state');
  const receipt=await recovery(b,newer.portfolio);
  const restored=await state(a,2);
  assert.equal(receipt.revision,newer.portfolio.revision+1);
  assert.equal(restored.portfolio.revision,receipt.revision);
  assert.equal(JSON.parse(restored.portfolio.raw).providers.filter(p=>p.id==='c1-backup-provider').length,1);
  assert.equal(restored.portfolio.syncEnrollmentRequired,true);
  assert.equal(restored.sync,null);
  assert.deepEqual(await operation(b,'anchor-proof'),proof,
   'Financial backup restore must preserve local locked identities and keys');
 });

 await scenario('C1-RESTORE-FAULT-REPLY',async({a,b,original,proof})=>{
  await upgraded(a,b);
  await prepareLegacy(b,original.portfolio.raw);
  const beforeLegacy=await legacy(b);
  await assert.rejects(()=>recovery(b,original.portfolio,{fault:true}));
  assert.deepEqual(await state(b),original,'Injected put failure must leave persisted state unchanged');
  assert.deepEqual(await operation(b,'anchor-proof'),proof);
  await assert.rejects(()=>recovery(b,original.portfolio,{lostResponse:true}),
   /C1 injected reply loss/);
  const committed=await state(a,2);
  assert.equal(committed.portfolio.revision,original.portfolio.revision+1);
  assert.equal(JSON.parse(committed.portfolio.raw).providers.filter(p=>p.id==='c1-backup-provider').length,1);
  assert.equal(committed.portfolio.syncEnrollmentRequired,true);
  assert.equal(committed.sync,null);
  assert.deepEqual(await operation(b,'anchor-proof'),proof);
  assert.deepEqual(await legacy(b),beforeLegacy,'Restore must not refresh a legacy portfolio mirror');
  // Reply loss is injected AFTER the API completed. No real process crash claim.
 });
 const require=createRequire(import.meta.url);
 const report={kind:'FLH04Version2CandidateProbe',version:1,node:process.version,
  playwright:require('playwright/package.json').version,engine:browser.version(),
  cases:results,limitations:['test-only schema transition','no product v2 startup implementation',
   'not full writer closure','reply loss and quota are injections','not process crash or real quota',
   'not sync/enrollment/crypto approval']};
 console.log(JSON.stringify(report));
 if(results.some(result=>result.status!=='PASS'))
  throw new AggregateError(results.filter(result=>result.status!=='PASS')
   .map(result=>Error(result.id+': '+result.errorType)),'FLH04 C1 candidate probes failed');
}
