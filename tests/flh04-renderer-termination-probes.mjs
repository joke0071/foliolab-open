import assert from 'node:assert/strict';
import {expectedRevertIntent} from './flh04-source-lifecycle-probes.mjs';

// CDP Page.crash is a renderer crash, NOT normal page.close, synthetic close,
// browser-process termination, power loss, or a native IDB close-event proof.
// Actual capability is checked only in the separately authorized native run.
export async function crashRenderer({context,page,browser}){
 const session=await context.newCDPSession(page);
 let crashed=false,closed=false;
 const onCrash=()=>{crashed=true;},onClose=()=>{closed=true;};
 page.on('crash',onCrash);page.on('close',onClose);
 try{
  // A protocol rejection alone is never accepted as a crash oracle.
  const observed=page.waitForEvent('crash');
  let commandOutcome='pending-at-crash';
  session.send('Page.crash').then(()=>{commandOutcome='resolved';},()=>{commandOutcome='rejected';});
  await observed;
  assert.equal(crashed,true);assert.equal(closed,false);
  assert.equal(browser.isConnected(),true,'browser must survive renderer crash');
  return {mechanism:'CDP.Page.crash',crashObserved:true,pageClosed:false,
   browserConnected:true,commandOutcome};
 }finally{
  page.off('crash',onCrash);page.off('close',onClose);
  await session.detach().catch(()=>{});
 }
}

export function assertCrashBarrier(snapshot,barrierMode){
 assert.equal(snapshot.settled,false);assert.equal(snapshot.sourceCount,1);
 assert.equal(snapshot.result,null);
 const names=snapshot.events.map(e=>e.name);
 assert.ok(names.includes(barrierMode==='readonly'?'read-complete':'write-complete'));
 assert.ok(names.includes('barrier-held'));
 assert.ok(!names.includes('barrier-release'));
 assert.ok(!names.includes('source-close-call'));
 assert.ok(!names.includes('operation-settled'));
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
   results.push({id,status:'FAIL',checks,errorType:error?.name==='AssertionError'?'AssertionError':'Error'});
  }finally{
   // Never release a failed crash fixture into product writes during cleanup.
   // Context disposal happens only after the crash oracle or a recorded FAIL.
   await context.close();
  }
 }
 console.log(JSON.stringify({kind:'FLH04RendererTerminationProbe',version:1,node:process.version,
  engine:browser.version(),cases:results,instrumentation:'native transaction complete callback held after event; actual CDP renderer crash; no browser-process or power-loss claim',
  openCases:['native IDB forced-close event','browser-process crash','power loss','real quota','non-null lifecycle outbox','full writer/worker/assets/keyslot/ABA/recovery qualification']}));
 if(results.some(x=>x.status!=='PASS'))throw new AggregateError(results.filter(x=>x.status!=='PASS').map(x=>Error(x.id)),'renderer termination candidate failed');
}
