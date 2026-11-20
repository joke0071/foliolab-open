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
