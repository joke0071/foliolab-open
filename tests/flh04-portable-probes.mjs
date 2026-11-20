import {prepareSourceRestore,verifyRestoredSource,recoveryFiles,verifyRollbackRecovery} from './flh04-source-restore-fixture.mjs';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
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
  const left=JSON.parse(root.raw);left.performanceFlowTrackingSince='2026-11-01';
  const forkRequest={...request,comparisonHeads:['L','B'],
   frameTexts:[...request.frameTexts,frame(JSON.stringify(left),'L','R','2','72'.repeat(32))]};
  const fork=await a.evaluate(request=>window.syncTest.api.createConflictArchive(request),forkRequest);
  assert.equal(fork.status,'conflict');assert.equal(fork.applyAuthorized,false);
  assert.deepEqual(fork.comparison,{status:'compared',baseId:'R',leftId:'L',rightId:'B',
   sections:[{section:'performanceFlowTrackingSince',change:'left-only'}]});
  const directory=await mkdtemp(join(tmpdir(),'flh04-conflict-'));
  try{
   const file=join(directory,'conflict.flh');
   await writeFile(file,fork.archive.text,'utf8');
   const fresh=await context.newPage();await setup(fresh);
   const pin=await a.evaluate(request=>window.syncTest.api.pinConflictArchive(request),{expectedPinVersion:0,
    expectedLocalRevision:root.revision,expectedSyncVersion:queue.version,comparisonHeads:['L','B'],
    expectedDigest:fork.archive.digest,text:await readFile(file,'utf8')});
   assert.equal(pin.pinVersion,1);
   const reopened=await fresh.evaluate(request=>window.syncTest.api.reopenPinnedConflictArchive(request),
    {text:await readFile(file,'utf8'),comparisonHeads:['L','B']});
   assert.deepEqual(reopened.comparison,fork.comparison);assert.equal(reopened.applyAuthorized,false);
   const selected=await fresh.evaluate(request=>window.syncTest.api.previewPinnedRestore(request),
    {text:await readFile(file,'utf8'),expectedPinVersion:pin.pinVersion,selectedHead:'L'});
   assert.deepEqual(selected.restorePreview,{selectedHead:'L',changedSections:['performanceFlowTrackingSince'],
    positions:0,bookings:0,journalEntries:0});
   assert.equal(selected.applyAuthorized,false);
   const text=await readFile(file,'utf8');
   const contenders=await Promise.allSettled([[a,'L'],[fresh,'B']].map(([page,selectedHead])=>
    page.evaluate(request=>window.syncTest.api.recordPinnedSelection(request),{text,selectedHead,expectedPinVersion:1})));
   assert.deepEqual(contenders.map(r=>r.status).sort(),['fulfilled','rejected']);
   assert.match(String(contenders.find(r=>r.status==='rejected').reason),/pin-version/);
   const winner=contenders.find(r=>r.status==='fulfilled').value;
   assert.equal(winner.pinVersion,2);
   assert.deepEqual(await b.evaluate(text=>window.syncTest.api.reopenPinnedSelection({text}),text),winner);
   const copy=await b.evaluate(request=>window.syncTest.api.exportPinnedFinancialCopy(request),
    {text,expectedPinVersion:winner.pinVersion});
   const expected=winner.restorePreview.selectedHead==='L'?left:JSON.parse(root.raw);
   delete expected.settings;
   assert.deepEqual(JSON.parse(copy.financialCopy),expected);
   const password='Portable synthetic example';
   const decoded=await fresh.evaluate(async({text,password})=>{
    const vault=await import('/src/backup-vault.js');
    await vault.configureBackupPassword(password,password);
    const copy=await window.syncTest.api.exportEncryptedPinnedFinancialCopy({text,expectedPinVersion:2});
    return vault.decryptPasswordBackup(JSON.parse(copy.encryptedCopy),password);
   },{text,password});
   assert.deepEqual(JSON.parse(decoded),expected);
   // Pause only the outgoing backup encryption. A newer selection must suppress its result.
   await fresh.evaluate(text=>{
    const subtle=crypto.subtle,encrypt=subtle.encrypt.bind(subtle);
    subtle.encrypt=async(...args)=>{
     const ciphertext=await encrypt(...args);
     await new Promise(resolve=>{window.resumeBackupEncryption=resolve;});
     return ciphertext;
    };
    window.pendingBackup=window.syncTest.api.exportEncryptedPinnedFinancialCopy({text,expectedPinVersion:2})
     .then(()=>null,error=>error.message).finally(()=>{delete subtle.encrypt;});
   },text);
   await fresh.waitForFunction(()=>typeof window.resumeBackupEncryption==='function');
   await b.evaluate(request=>window.syncTest.api.recordPinnedSelection(request),
    {text,expectedPinVersion:2,selectedHead:winner.restorePreview.selectedHead==='L'?'B':'L'});
   assert.match(await fresh.evaluate(()=>{window.resumeBackupEncryption();return window.pendingBackup;}),/selection-changed|pin-version/);
   // Pause the second file after encryption but before the final portfolio/queue check.
   await a.evaluate(text=>{
    const subtle=crypto.subtle,encrypt=subtle.encrypt.bind(subtle);
    let count=0;
    subtle.encrypt=async(...args)=>{
     const ciphertext=await encrypt(...args);
     if(++count===2)await new Promise(resolve=>{window.resumePair=resolve;});
     return ciphertext;
    };
    window.pendingPair=window.syncTest.api.exportPinnedRecoveryFiles({text,expectedPinVersion:3})
     .then(()=>null,error=>error.message).finally(()=>{delete subtle.encrypt;});
   },text);
   await a.waitForFunction(()=>typeof window.resumePair==='function');
   await fresh.close();
  }finally{await rm(directory,{recursive:true,force:true});}
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
  assert.match(await a.evaluate(()=>{window.resumePair();return window.pendingPair;}),/pin-preimage/);
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

async function checkLocalRollback(browser,setup,operation){
 const context=await browser.newContext();
 try{
  const page=await context.newPage();await setup(page);
  const {request,local}=await prepareSourceRestore(page,operation);
  const files=recoveryFiles(request),password=request.password;
  const open=input=>page.evaluate(input=>window.syncTest.api.reopenLocalRecoveryCase(input),input);
  assert.deepEqual(await open(files),{status:'undetermined',applyAuthorized:false});
  const pending=await open({...files,password});
  assert.deepEqual(pending,{status:'verified-pending-selection',selectedHead:'S',expectedPinVersion:2,
   localRevision:local.revision,rollbackAvailable:false,applyAuthorized:false});
  const restore=await page.evaluate(req=>window.syncTest.api.restorePinnedLocalCopy(req),
   {...files,password,expectedPinVersion:pending.expectedPinVersion,confirmedHead:pending.selectedHead});
  const before=await operation(page,'read');
  const rollback=req=>page.evaluate(req=>window.syncTest.api.rollbackPinnedLocalCopy(req),req);
  const currentCase=await open(files);
  assert.deepEqual(currentCase,{...pending,status:'matches-restored-state',rollbackAvailable:true,localRevision:restore.localRevision});
  const confirmed={...request,confirmedRollbackRevision:currentCase.localRevision};
  const unknown={status:'undetermined',applyAuthorized:false};
  for(const invalid of [request,{...confirmed,confirmedRollbackRevision:local.revision},
   {...confirmed,password:'wrong password'},{...confirmed,localFile:request.selectedFile}]){
   assert.deepEqual(await rollback(invalid),unknown);
  }
  // A failure after the put must preserve the full original record.
  assert.deepEqual(await page.evaluate(async req=>{
   const put=IDBObjectStore.prototype.put;
   IDBObjectStore.prototype.put=function(value,key){
    const result=put.call(this,value,key);
    if(key==='sync-local-restore-receipt-v1'&&value.rollback)this.transaction.abort();
    return result;
   };
   try{return await window.syncTest.api.rollbackPinnedLocalCopy(req);}
   finally{IDBObjectStore.prototype.put=put;}
  },confirmed),unknown);
  assert.deepEqual(await operation(page,'read'),before);
  assert.deepEqual(await open(files),currentCase);
  const second=await context.newPage();await setup(second);
  const results=await Promise.all([rollback(confirmed),
   second.evaluate(req=>window.syncTest.api.rollbackPinnedLocalCopy(req),confirmed)]);
  const revision=restore.localRevision+1;
  assert.deepEqual(results.filter(r=>r.status==='rolled-back-local-copy'),
   [{status:'rolled-back-local-copy',localRevision:revision,applyAuthorized:false}]);
  await page.close();await second.close();
  const reopened=await context.newPage();await setup(reopened);
  const after=await operation(reopened,'read');
  assert.deepEqual(after,{portfolio:{...before.portfolio,raw:local.raw,revision,updatedAt:after.portfolio.updatedAt},sync:before.sync});
  await assert.rejects(()=>operation(reopened,'recover'),/enrollment-required/);
  await verifyRollbackRecovery(reopened,operation,files,local,restore.localRevision);
  const foreign=await browser.newContext();
  try{
   const unrelated=await foreign.newPage();await setup(unrelated);
   assert.deepEqual(await unrelated.evaluate(req=>window.syncTest.api.reopenLocalRecoveryCase(req),{...files,password}),unknown);
  }finally{await foreign.close();}
  console.log(JSON.stringify({kind:'FLH04LocalRollback',status:'PASS',engine:browser.browserType().name()}));
 }finally{await context.close();}
}

export async function runPortableProbes(browser,setup,operation){
 await checkLocalRollback(browser,setup,operation);
 await checkCrossTabFramePlan(browser,setup,operation);
 await checkMalformedSyncSlots(browser,setup,operation);
 const context=await browser.newContext();
 try{
  const page=await context.newPage();await setup(page);
  const fixture=await prepareSourceRestore(page,operation);
  const result=await page.evaluate(req=>window.syncTest.api.restorePinnedLocalCopy(req),fixture.request);
  assert.deepEqual(result,{status:'restored-local-copy',selectedHead:'S',localRevision:fixture.local.revision+1,applyAuthorized:false});
  await page.close();
  const reopened=await context.newPage();await setup(reopened);
  await verifyRestoredSource(reopened,operation,fixture,setup);
  console.log(JSON.stringify({kind:'FLH04PortableSourceRestore',status:'PASS',engine:browser.browserType().name()}));
 }finally{await context.close();}
}
