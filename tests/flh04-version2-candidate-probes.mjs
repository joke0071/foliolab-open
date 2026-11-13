// FLH04 C1 candidate probes, opt-in from the existing browser-sync-outbox harness.
// Synthetic fresh BrowserContexts only. NOT a product v2 adapter or crypto approval.
// Current product is expected to fail C1-MARKERS and C1-NO-REVERT until a separately
// reviewed product implementation exists. No expected failure is converted to PASS.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createC1Diagnostics} from './flh04-c1-diagnostics.mjs';
const assertionPlans={"C1-CANCEL":["A.01","A.02","A.03","A.04"],"C1-VERSION-FENCE":["UPGRADE.01","UPGRADE.02","A.01","A.02","A.03","A.04"],"C1-MARKERS":["UPGRADE.01","UPGRADE.02","A.01","A.02","A.03"],"C1-NO-REVERT":["UPGRADE.01","UPGRADE.02","A.01","A.02","A.03"],"C1-RESTORE-CAS":["UPGRADE.01","UPGRADE.02","A.01","A.02","A.03","A.04","A.05","A.06","A.07","A.08"],"C1-RESTORE-FAULT-REPLY":["UPGRADE.01","UPGRADE.02","A.01","A.02","A.03","A.04","A.05","A.06","A.07","A.08","A.09","A.10"]};

export async function runVersion2Candidate({browser,setup,operation,url}) {
 const origin=new URL(url);
 assert.equal(origin.protocol,'http:','C1 requires a local HTTP test origin');
 assert.equal(origin.port,'4173','C1 requires the assigned local test port');
 assert.ok(['127.0.0.1','localhost'].includes(origin.hostname),'C1 forbids production origins');
 assert.equal(origin.pathname,'/tests/storage-origin.html');
 const results=[];
 let checks;
 async function scenario(id,body) {
  checks=createC1Diagnostics(id,assertionPlans[id]);
  const context=await browser.newContext();
  try {
   const a=await context.newPage(),b=await context.newPage();
   await setup(a);await setup(b);
   const initial=await operation(a,'initialize');
   await operation(a,'adopt',{expected:initial,raw:initial.raw});
   await operation(a,'prepare-anchor');
   const original=await operation(a,'read'),proof=await operation(a,'anchor-proof');
   await body({a,b,context,original,proof});
   checks.complete();
   results.push({id,status:'PASS',checks:checks.report()});
  } catch(error) {
   const failure=checks.fail(error);
   results.push({id,status:'FAIL',errorType:failure.errorType,failure,checks:checks.report()});
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
  checks.start('UPGRADE.01');
 assert.deepEqual(await outcome(b),{status:'schema-committed',version:2});
 checks.pass('UPGRADE.01');
  checks.start('UPGRADE.02');
 assert.equal(await a.evaluate(()=>window.syncTest.db.version),1,
   'closed old handle does not become a v2 handle');
 checks.pass('UPGRADE.02');
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
  checks.start('A.01');
 assert.deepEqual(await outcome(b),{status:'aborted',errorName:'AbortError'});
 checks.pass('A.01');
  await b.evaluate(async()=>{window.syncTest.db=await window.syncTest.storage.openPortfolioDB();});
  checks.start('A.02');
 assert.equal(await b.evaluate(()=>window.syncTest.db.version),1);
 checks.pass('A.02');
  checks.start('A.03');
 assert.deepEqual(await state(b),original);
 checks.pass('A.03');
  checks.start('A.04');
 assert.deepEqual(await operation(b,'anchor-proof'),proof);
 checks.pass('A.04');
 });

 await scenario('C1-VERSION-FENCE',async({a,b,original,proof})=>{
  await upgraded(a,b);
  checks.start('A.01');
 assert.deepEqual(await state(b),original);
 checks.pass('A.01');
  checks.start('A.02');
 assert.deepEqual(await operation(b,'anchor-proof'),proof);
 checks.pass('A.02');
  const oldReopen=await a.evaluate(async()=>{
   try{const db=await window.syncTest.storage.openPortfolioDB();db.close();return 'unexpected-open';}
   catch(error){return error.name;}
  });
  checks.start('A.03');
 assert.equal(oldReopen,'VersionError');
 checks.pass('A.03');
  checks.start('A.04');
 assert.deepEqual(await state(b),original);
 checks.pass('A.04');
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
  checks.start('A.01');
 assert.deepEqual(await state(b),original);
 checks.pass('A.01');
  checks.start('A.02');
 assert.deepEqual(await operation(b,'anchor-proof'),proof);
 checks.pass('A.02');
  checks.start('A.03');
 assert.notEqual(disposition,'legacy',
   'Confirmed v2 must not adopt legacy data after an old marker tail');
 checks.pass('A.03');
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
  checks.start('A.01');
 assert.deepEqual(await state(b),original,'No tombstone or other record write before v2 rejection');
 checks.pass('A.01');
  checks.start('A.02');
 assert.deepEqual(await legacy(b),beforeLegacy,'No target/intent/marker write before v2 rejection');
 checks.pass('A.02');
  checks.start('A.03');
 assert.equal(result.rejected,true,'The retained internal revert path must reject confirmed v2');
 checks.pass('A.03');
 });

 await scenario('C1-RESTORE-CAS',async({a,b,original,proof})=>{
  await upgraded(a,b);
  await prepareLegacy(b,original.portfolio.raw);
  const changed=JSON.parse(original.portfolio.raw);
  changed.providers.push({id:'c1-newer-save',name:'C1 newer local save',type:'broker'});
  await operation(b,'save',{revision:original.portfolio.revision,raw:JSON.stringify(changed)});
  const newer=await state(b);
  checks.start('A.01');
 await assert.rejects(()=>recovery(b,original.portfolio));
 checks.pass('A.01');
  checks.start('A.02');
 assert.deepEqual(await state(b),newer,'Stale backup restore must not overwrite newer state');
 checks.pass('A.02');
  const receipt=await recovery(b,newer.portfolio);
  const restored=await state(a,2);
  checks.start('A.03');
 assert.equal(receipt.revision,newer.portfolio.revision+1);
 checks.pass('A.03');
  checks.start('A.04');
 assert.equal(restored.portfolio.revision,receipt.revision);
 checks.pass('A.04');
  checks.start('A.05');
 assert.equal(JSON.parse(restored.portfolio.raw).providers.filter(p=>p.id==='c1-backup-provider').length,1);
 checks.pass('A.05');
  checks.start('A.06');
 assert.equal(restored.portfolio.syncEnrollmentRequired,true);
 checks.pass('A.06');
  checks.start('A.07');
 assert.equal(restored.sync,null);
 checks.pass('A.07');
  checks.start('A.08');
 assert.deepEqual(await operation(b,'anchor-proof'),proof,
   'Financial backup restore must preserve local locked identities and keys');
 checks.pass('A.08');
 });

 await scenario('C1-RESTORE-FAULT-REPLY',async({a,b,original,proof})=>{
  await upgraded(a,b);
  await prepareLegacy(b,original.portfolio.raw);
  const beforeLegacy=await legacy(b);
  checks.start('A.01');
 await assert.rejects(()=>recovery(b,original.portfolio,{fault:true}));
 checks.pass('A.01');
  checks.start('A.02');
 assert.deepEqual(await state(b),original,'Injected put failure must leave persisted state unchanged');
 checks.pass('A.02');
  checks.start('A.03');
 assert.deepEqual(await operation(b,'anchor-proof'),proof);
 checks.pass('A.03');
  checks.start('A.04');
 await assert.rejects(()=>recovery(b,original.portfolio,{lostResponse:true}),
   /C1 injected reply loss/);
 checks.pass('A.04');
  const committed=await state(a,2);
  checks.start('A.05');
 assert.equal(committed.portfolio.revision,original.portfolio.revision+1);
 checks.pass('A.05');
  checks.start('A.06');
 assert.equal(JSON.parse(committed.portfolio.raw).providers.filter(p=>p.id==='c1-backup-provider').length,1);
 checks.pass('A.06');
  checks.start('A.07');
 assert.equal(committed.portfolio.syncEnrollmentRequired,true);
 checks.pass('A.07');
  checks.start('A.08');
 assert.equal(committed.sync,null);
 checks.pass('A.08');
  checks.start('A.09');
 assert.deepEqual(await operation(b,'anchor-proof'),proof);
 checks.pass('A.09');
  checks.start('A.10');
 assert.deepEqual(await legacy(b),beforeLegacy,'Restore must not refresh a legacy portfolio mirror');
 checks.pass('A.10');
  // Reply loss is injected AFTER the API completed. No real process crash claim.
 });
 const require=createRequire(import.meta.url);
 const report={kind:'FLH04Version2CandidateProbe',version:2,node:process.version,
  playwright:require('playwright/package.json').version,engine:browser.version(),
  cases:results,limitations:['test-only schema transition','no product v2 startup implementation',
   'not full writer closure','reply loss and quota are injections','not process crash or real quota',
   'not sync/enrollment/crypto approval']};
 console.log(JSON.stringify(report));
 if(results.some(result=>result.status!=='PASS'))
  throw new AggregateError(results.filter(result=>result.status!=='PASS')
   .map(result=>Error(result.id+': '+result.errorType)),'FLH04 C1 candidate probes failed');
}
