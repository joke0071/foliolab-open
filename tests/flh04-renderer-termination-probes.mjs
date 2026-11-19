import assert from 'node:assert/strict';
import {snapshotFrame as frame} from './sync-outbox-fixture.mjs';
import {expectedRevertIntent} from './flh04-source-lifecycle-probes.mjs';

// Chromium's chrome://kill terminates the target renderer abruptly, NOT normal page.close, synthetic close,
// browser-process termination, power loss, or a native IDB close-event proof.
export async function crashRenderer({context,page,browser}){
 const session=await context.newCDPSession(page);
 let crashed=false,closed=false;
 const onCrash=()=>{crashed=true;},onClose=()=>{closed=true;};
 page.on('crash',onCrash);page.on('close',onClose);
 try{
  // A protocol rejection alone is never accepted as a crash oracle.
  await session.send('Inspector.enable');
  const observed=page.waitForEvent('crash',{timeout:15000});
  let commandOutcome='pending-at-crash',navigationError;
  session.send('Page.navigate',{url:'chrome://kill'}).then(result=>{
   commandOutcome='resolved';navigationError=result?.errorText;
  },()=>{commandOutcome='rejected';});
  try{
   await observed;
  }catch(error){
   console.error('Renderer crash was not observed', {commandOutcome,navigationError,closed,browserConnected:browser.isConnected(),errorName:error.name});
   throw error;
  }
  assert.equal(crashed,true);assert.equal(closed,false);
  assert.equal(browser.isConnected(),true,'browser must survive renderer crash');
  return {mechanism:'CDP.Page.navigate chrome://kill',crashObserved:true,pageClosed:false,
   browserConnected:true,commandOutcome};
 }finally{
  page.off('crash',onCrash);page.off('close',onClose);
  // A crashed target may never answer detach. Its owning context disposes the session.
  void session.detach().catch(()=>{});
 }
}

export function assertCrashBarrier(snapshot,barrierMode,sourceCount=1){
 assert.equal(snapshot.settled,false);assert.equal(snapshot.sourceCount,sourceCount);
 assert.equal(snapshot.result,null);
 const names=snapshot.events.map(e=>e.name);
 assert.ok(names.includes(barrierMode==='readonly'?'read-complete':'write-complete'));
 assert.ok(names.includes('barrier-held'));
 assert.ok(!names.includes('barrier-release'));
 assert.ok(!names.includes('source-close-call'));
 assert.ok(!names.includes('operation-settled'));
}

// Interrupt the real begin() after its IDB transaction commits but before the
// caller receives sendable bytes. Both frames are queued through the storage API.
async function checkUncertainRetry({context,setup,operation,restart}){
 const source=await context.newPage();
 await setup(source);
 const root=await operation(source,'initialize');
 const rootFrame=frame(root.raw);
 await operation(source,'capture',{expectedLocalRevision:root.revision,expectedSyncVersion:null,frameText:rootFrame});
 const model=JSON.parse(root.raw);
 model.providers.push({id:'test-broker',name:'Second revision',type:'broker'});
 const child=await operation(source,'save',{revision:root.revision,raw:JSON.stringify(model)});
 const childFrame=frame(child.raw,'S','R','2','56'.repeat(32));
 const queued=await operation(source,'capture',{expectedLocalRevision:child.revision,expectedSyncVersion:1,frameText:childFrame});
 assert.deepEqual(queued.entries.map(e=>[e.capturedLocalRevision,e.status,e.frameText]),
  [[root.revision,'pending',rootFrame],[child.revision,'pending',childFrame]]);
 assert.equal(queued.anchorIndex,-1);
 const begin={expectedLocalRevision:child.revision,expectedSyncVersion:queued.version,revisionId:'R'};
 await source.evaluate(async args=>{
  const {installLifecycleHarness}=await import('/tests/flh04-source-lifecycle-harness.mjs');
  window.lifecycle=installLifecycleHarness({controller:window.syncTest.api,action:'begin',model:args,barrierMode:'readwrite'});
 },begin);
 await source.waitForFunction(()=>window.lifecycle.snapshot().settled||window.lifecycle.snapshot().events.some(e=>e.name==='barrier-held'));
 const barrier=await source.evaluate(()=>window.lifecycle.snapshot());
 assertCrashBarrier(barrier,'readwrite',0); // begin uses the open database handle
 const uncertain=structuredClone(queued);
 uncertain.version++;
 uncertain.entries[0].status='uncertain';
 const expected={portfolio:child,sync:uncertain};
 assert.deepEqual(await operation(source,'read'),expected);
 const {reopened,crash}=await restart(source);
 await setup(reopened);
 assert.deepEqual(await operation(reopened,'read'),expected);
 const recovered=await operation(reopened,'recover');
 assert.deepEqual(recovered.state,uncertain);
 assert.equal(recovered.localRevision,child.revision);
 assert.equal(recovered.summary.remoteAnchor,null);
 assert.equal(recovered.summary.acknowledgedLocalRevision,null);
 assert.equal(recovered.summary.hasPendingChanges,true);
 const retry={...begin,expectedSyncVersion:uncertain.version};
 await assert.rejects(()=>operation(reopened,'begin',begin),/stale-preimage/);
 await assert.rejects(()=>operation(reopened,'begin',{...retry,revisionId:'S'}),/anchor-order/);
 assert.deepEqual(await operation(reopened,'begin',retry),{state:uncertain,frameText:rootFrame});
 await assert.rejects(()=>operation(reopened,'confirm',{...retry,frameText:rootFrame}),/remote-provenance-unavailable/);
 assert.deepEqual(await operation(reopened,'read'),expected);
 return {crash,events:barrier.events,entryStates:uncertain.entries.map(entry=>entry.status)};
}

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

export async function runRendererTerminationCandidate({browser,setup,operation,url}){
 const origin=new URL(url);
 assert.equal(origin.protocol,'http:');assert.equal(origin.port,'4173');
 assert.ok(['127.0.0.1','localhost'].includes(origin.hostname));
 assert.equal(origin.pathname,'/tests/storage-origin.html');
 const results=[];
 for(const [id,action,barrierMode] of [
  ['T1-READ-COMPLETE','initialize','readonly'],
  ['T2-REVERT-COMMITTED','revertLocked','readwrite']]){
  const context=await browser.newContext();let a,b,active='SETUP';
  const checks=['BARRIER','COMMITTED','INTERRUPTED-MARKERS','CRASH','PERSISTED','MARKERS','ANCHOR','RESTART','FINAL']
   .map(name=>({id:id+'.'+name,status:'NOT_REACHED',assertion:{path:'tests/flh04-renderer-termination-probes.mjs',anchor:name}}));
  const check=(name,fn)=>{active=name;const row=checks.find(row=>row.id===id+'.'+name);
   assert.equal(row.status,'NOT_REACHED');row.status='RUNNING';fn();row.status='PASS';};
  try{
   a=await context.newPage();await setup(a);
   const initial=await operation(a,'initialize');
   await operation(a,'adopt',{expected:initial,raw:initial.raw});await operation(a,'prepare-anchor');
   const before=await operation(a,'read'),proof=await operation(a,'anchor-proof');
   const expectedRaw=await a.evaluate(async originalRaw=>{
    const t=window.syncTest,{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
    localStorage.setItem('foliolab-open-storage-mode','idb-v1');
    t.controller=new PortfolioStorage(localStorage);await t.controller.initialize();
    t.draft=t.model.safeImport(JSON.parse(originalRaw));return JSON.stringify(structuredClone(t.draft));
   },before.portfolio.raw);
   const beforeMarkers=await a.evaluate(()=>['foliolab-open-v1','foliolab-open-storage-mode','foliolab-open-idb-revert-intent'].map(k=>localStorage.getItem(k)));
   await a.evaluate(async({action,barrierMode})=>{
    const t=window.syncTest,{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
    if(action==='initialize'){t.controller.close();t.controller=new PortfolioStorage(localStorage);}
    t.db.close();
    const {installLifecycleHarness}=await import('/tests/flh04-source-lifecycle-harness.mjs');
    window.lifecycle=installLifecycleHarness({controller:t.controller,action,model:t.draft,barrierMode});
   },{action,barrierMode});
   await a.waitForFunction(()=>window.lifecycle.snapshot().settled||window.lifecycle.snapshot().events.some(e=>e.name==='barrier-held'));
   const held=await a.evaluate(()=>window.lifecycle.snapshot());
   check('BARRIER',()=>assertCrashBarrier(held,barrierMode));
   // Read completed state BEFORE crashing using the held source connection.
   // No other page exists during crash; same-origin process sharing cannot be
   // mistaken for an independently surviving observer. Reopen only afterwards.
   active='COMMITTED';const atCrash=await a.evaluate(async()=>{
    const t=window.syncTest;return t.storage.readPortfolioSyncRecord(t.controller.db);
   });
   const expected=barrierMode==='readonly'?before:{portfolio:{...before.portfolio,
    revision:before.portfolio.revision+1,raw:null,settings:null,deleted:true,
    updatedAt:atCrash.portfolio.updatedAt},sync:before.sync};
   check('COMMITTED',()=>{
    assert.deepEqual(atCrash,expected);
    if(barrierMode==='readwrite')assert.ok(Number.isFinite(Date.parse(atCrash.portfolio.updatedAt)));
   });
   const expectedMarkers=barrierMode==='readonly'?beforeMarkers:[expectedRaw,'idb-v1',expectedRevertIntent(expectedRaw,before.portfolio.revision+1)];
   active='INTERRUPTED-MARKERS';const markers=await a.evaluate(()=>['foliolab-open-v1','foliolab-open-storage-mode','foliolab-open-idb-revert-intent'].map(k=>localStorage.getItem(k)));
   check('INTERRUPTED-MARKERS',()=>assert.deepEqual(markers,expectedMarkers));
   active='CRASH';const crash=await crashRenderer({context,page:a,browser});
   check('CRASH',()=>{assert.equal(crash.crashObserved,true);assert.equal(crash.browserConnected,true);assert.equal(crash.pageClosed,false);});
   active='REOPEN';b=await context.newPage();await setup(b);
   const persisted=await operation(b,'read');check('PERSISTED',()=>assert.deepEqual(persisted,expected));
   active='MARKERS';const persistedMarkers=await b.evaluate(()=>['foliolab-open-v1','foliolab-open-storage-mode','foliolab-open-idb-revert-intent'].map(k=>localStorage.getItem(k)));
   check('MARKERS',()=>assert.deepEqual(persistedMarkers,expectedMarkers));
   active='ANCHOR';const afterProof=await operation(b,'anchor-proof');check('ANCHOR',()=>assert.deepEqual(afterProof,proof));
   active='RESTART';const restart=await b.evaluate(async()=>{
    const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),c=new PortfolioStorage(localStorage);
    try{const model=await c.initialize();return {mode:c.mode,revision:c.revision,model,markers:['foliolab-open-v1','foliolab-open-storage-mode','foliolab-open-idb-revert-intent'].map(k=>localStorage.getItem(k))};}
    finally{c.close();}
   });
   check('RESTART',()=>{
    assert.equal(restart.mode,barrierMode==='readonly'?'idb':'local');
    assert.equal(restart.revision,barrierMode==='readonly'?before.portfolio.revision:null);
    assert.deepEqual(restart.model,JSON.parse(expectedRaw));
    assert.deepEqual(restart.markers,barrierMode==='readonly'?beforeMarkers:[expectedRaw,null,null]);
   });
   active='FINAL';const final=await operation(b,'read'),finalProof=await operation(b,'anchor-proof');
   check('FINAL',()=>{assert.deepEqual(final,expected);assert.deepEqual(finalProof,proof);});
   results.push({id,status:'PASS',checks,crash,
    barrier:{mode:barrierMode,settled:held.settled,result:held.result,sourceCount:held.sourceCount,events:held.events}});
  }catch(error){
   const row=checks.find(row=>row.id===id+'.'+active);
   if(row)row.status='FAIL';else checks.push({id:id+'.'+active,status:'FAIL'});
   results.push({id,status:'FAIL',checks,errorType:error?.name==='AssertionError'?'AssertionError':error?.name==='TimeoutError'?'TimeoutError':'Error'});
  }finally{
   // Never release a failed crash fixture into product writes during cleanup.
   // Context disposal happens only after the crash oracle or a recorded FAIL.
   await context.close();
  }
 }
 console.log(JSON.stringify({kind:'FLH04RendererTerminationProbe',version:1,node:process.version,
  engine:browser.version(),cases:results,instrumentation:'native transaction complete callback held after event; native renderer termination; no browser-process or power-loss claim',
  openCases:['native IDB forced-close event','browser-process crash','power loss','real quota','full writer/worker/assets/keyslot/ABA/recovery qualification']}));
 if(results.some(x=>x.status!=='PASS'))throw new AggregateError(results.filter(x=>x.status!=='PASS').map(x=>Error(x.id)),'renderer termination candidate failed');
 const context=await browser.newContext();
 try{
  const evidence=await checkUncertainRetry({context,setup,operation,restart:async page=>{
   const crash=await crashRenderer({context,page,browser});
   return {reopened:await context.newPage(),crash};
  }});
  console.log(JSON.stringify({kind:'FLH04OutboxRetryAfterCrash',status:'PASS',engine:browser.version(),...evidence}));
 }finally{await context.close();}
 if(process.env.FLH04_BROWSER_PROCESS_RESTART==='1'){
  const {checkPersistentRestart}=await import('./flh04-persistent-restart.mjs');
  await checkPersistentRestart({setup,operation,checkUncertainRetry,assertCrashBarrier});
  const {checkProfileRestore}=await import('./flh04-profile-restore.mjs');
  await checkProfileRestore({setup,operation});
  await checkCrossTabFramePlan(browser,setup,operation);
  await checkMalformedSyncSlots(browser,setup,operation);
 }
}
