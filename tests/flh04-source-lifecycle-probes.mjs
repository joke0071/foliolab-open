import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createC1Diagnostics} from './flh04-c1-diagnostics.mjs';

export const lifecycleCases=[
 ['L1-REVERT','revert',null,'tombstone'],
 ['L2-MARKER-FAIL','revertLocked','marker-injected','tombstone'],
 ['L3-INITIALIZE','initialize',null,'same'],
 ['L4-READ-ERROR','initialize','read-error-injected','same'],
 ['L5-CLOSE-EVENT','initialize','close-event-injected','same'],
 ['L6-INTENT','initialize',null,'intent'],
 ['L7-MIGRATE','migrateLocked',null,'adopt'],
];
const keys=['foliolab-open-v1','foliolab-open-storage-mode','foliolab-open-idb-revert-intent'];
// Independent Node oracle: BigInt FNV-1a over UTF-16 code units, modulo 2^32.
// Do not import the product fingerprint or derive the expected value from intent.
export function expectedRevertIntent(raw,revision){
 assert.equal(typeof raw,'string');assert.ok(Number.isSafeInteger(revision)&&revision>0);
 let hash=2166136261n;
 for(let i=0;i<raw.length;i++)hash=((hash^BigInt(raw.charCodeAt(i)))*16777619n)&0xffffffffn;
 return JSON.stringify({revision,fingerprint:raw.length+':'+hash.toString(16)});
}
export function assertRetainedRevertIntent(actual,expected){
 // Exact string equality covers all fields, fingerprint, extras and serialization.
 assert.equal(actual,expected,'entire retained revert intent must match independent oracle');
}
export function assertOverlap(snapshot,upgrade){
 assert.equal(snapshot.settled,false);
 assert.equal(snapshot.sourceCount,1,'initialize must reuse its source handle');
 assert.ok(snapshot.events.some(e=>e.name==='source-versionchange'));
 assert.equal(upgrade.started,true);assert.equal(upgrade.blocked,true);
 assert.equal(upgrade.upgrading,false);assert.equal(upgrade.outcome,null);
 assert.ok(snapshot.events.some(e=>e.name==='barrier-held'));
}
export function assertReleased(snapshot){
 const names=snapshot.events.map(e=>e.name);
 assert.equal(snapshot.settled,true);
 assert.ok(names.indexOf('source-versionchange')>names.indexOf('barrier-held'));
 assert.ok(names.indexOf('barrier-release')>names.indexOf('source-versionchange'));
 assert.ok(names.indexOf('source-close-call')>names.indexOf('barrier-release'));
 assert.ok(names.indexOf('operation-settled')>names.indexOf('source-close-call'));
 const close=names.lastIndexOf('source-close-call');
 for(let i=close+1;i<names.length;i++)assert.ok(!/^(setItem|removeItem):/.test(names[i]));
}
export async function runSourceLifecycleCandidate({browser,setup,operation,url}){
 const origin=new URL(url);
 assert.equal(origin.protocol,'http:');assert.equal(origin.port,'4173');
 assert.ok(['127.0.0.1','localhost'].includes(origin.hostname));
 assert.equal(origin.pathname,'/tests/storage-origin.html');
 const results=[];
 async function state(page,version){
  return page.evaluate(async version=>{
   const t=window.syncTest;
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('foliolab-open-portfolio',version);
    r.onupgradeneeded=()=>r.transaction.abort();r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(r.result);
   });
   try{return await t.storage.readPortfolioSyncRecord(db);}finally{db.close();}
  },version);
 }
 const legacy=page=>page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
 async function scenario(id,plan,body){
  const checks=createC1Diagnostics(id,plan,{path:'tests/flh04-source-lifecycle-probes.mjs'}),context=await browser.newContext();
  let a,b;
  const check=(id,fn)=>{checks.start(id);fn();checks.pass(id);};
  try{
   a=await context.newPage();b=await context.newPage();await setup(a);await setup(b);
   const initial=await operation(a,'initialize');
   await operation(a,'adopt',{expected:initial,raw:initial.raw});await operation(a,'prepare-anchor');
   const original=await operation(a,'read'),proof=await operation(a,'anchor-proof');
   await a.evaluate(async raw=>{
    const t=window.syncTest,{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
    localStorage.setItem('foliolab-open-storage-mode','idb-v1');
    t.controller=new PortfolioStorage(localStorage);await t.controller.initialize();
    t.originalRaw=raw;t.draft=t.model.safeImport(JSON.parse(raw));
    t.expectedLegacy=JSON.stringify(structuredClone(t.draft));
   },original.portfolio.raw);
   await body({a,b,original,proof,check,context});checks.complete();
   const trace=await a.evaluate(()=>window.lifecycle?.snapshot().events??window.probeFault?.events.map((name,seq)=>({seq,name,kind:'injected'}))??[]);
   const upgradeEvents=await b.evaluate(()=>window.upgrade?.events??[]);
   results.push({id,status:'PASS',checks:checks.report(),events:trace,upgradeEvents});
  }catch(error){
   const failure=checks.fail(error);
   let trace=[];try{trace=await a.evaluate(()=>window.lifecycle?.snapshot().events??[]);}catch{}
   results.push({id,status:'FAIL',failure,checks:checks.report(),events:trace});
  }finally{
   if(a)await a.evaluate(()=>{window.lifecycle?.cleanup();window.syncTest?.controller?.close();window.syncTest?.db?.close();}).catch(()=>{});
   if(b)await b.evaluate(()=>{window.upgrade?.db?.close();window.syncTest?.db?.close();}).catch(()=>{});
   await context.close();
  }
 }
 async function upgrade(b){
  await b.evaluate(()=>{
   const u=window.upgrade={started:false,blocked:false,upgrading:false,outcome:null,events:[]};
   // Native second participant begins HERE, not merely a queued Node promise.
   const r=indexedDB.open('foliolab-open-portfolio',2);u.started=true;u.events.push('open-called');
   r.onblocked=()=>{u.blocked=true;u.events.push('blocked');};
   r.onupgradeneeded=e=>{
    u.upgrading=true;u.events.push('upgradeneeded');
    u.markers=['foliolab-open-v1','foliolab-open-storage-mode','foliolab-open-idb-revert-intent'].map(k=>localStorage.getItem(k));
    if(e.oldVersion!==1||e.newVersion!==2)r.transaction.abort();
   };
   r.onerror=()=>{u.outcome={status:'rejected',errorName:r.error.name};};
   r.onsuccess=()=>{u.db=r.result;u.db.onversionchange=()=>u.db.close();u.events.push('success');u.outcome={status:'fulfilled',version:u.db.version};};
  });
  await b.waitForFunction(()=>window.upgrade.blocked||window.upgrade.outcome!==null);
 }
 for(const [id,action,fault,expected] of lifecycleCases)await scenario(id,
  ['OVERLAP','RELEASE','RESULT','PERSISTED','LEGACY','ANCHOR','REOPEN','V2-BLOCK'],
  async({a,b,original,proof,check})=>{
   let before=original;
   if(expected==='intent'){
    await operation(a,'delete',{revision:original.portfolio.revision});before=await operation(a,'read');
    await a.evaluate(revision=>{
     const raw=window.syncTest.expectedLegacy;let h=2166136261;
     for(let i=0;i<raw.length;i++)h=Math.imul(h^raw.charCodeAt(i),16777619);
     localStorage.setItem('foliolab-open-v1',raw);
     localStorage.setItem('foliolab-open-idb-revert-intent',JSON.stringify({revision,fingerprint:raw.length+':'+(h>>>0).toString(16)}));
    },before.portfolio.revision);
   }
   if(expected==='adopt')await a.evaluate(()=>{
    const t=window.syncTest;t.controller.close();t.controller.mode='local';t.controller.revision=null;
    localStorage.removeItem('foliolab-open-storage-mode');localStorage.setItem('foliolab-open-v1',t.originalRaw);
    t.controller.legacyRaw=t.originalRaw;
   });
   const beforeLegacy=await legacy(a);
   const expectedRaw=await a.evaluate(()=>window.syncTest.expectedLegacy);
   const retainedIntent=expected==='tombstone'&&fault?expectedRevertIntent(expectedRaw,before.portfolio.revision+1):null;
   await a.evaluate(async({action,fault})=>{
    const t=window.syncTest,{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
    if(action==='initialize'){t.controller.close();t.controller=new PortfolioStorage(localStorage);}
    // Close setup's separate handle; it must not be the reason upgrade waits.
    t.db.close();
    const {installLifecycleHarness}=await import('/tests/flh04-source-lifecycle-harness.mjs');
    window.lifecycle=installLifecycleHarness({controller:t.controller,action,model:t.draft,fault});
   },{action,fault});
   await a.waitForFunction(()=>window.lifecycle.snapshot().settled||window.lifecycle.snapshot().events.some(e=>e.name==='barrier-held'));
   await upgrade(b);
   // Cross-page observations precede release; no duration/timer assertion.
   const held=await a.evaluate(()=>window.lifecycle.snapshot());
   const pending=await b.evaluate(()=>({started:window.upgrade.started,blocked:window.upgrade.blocked,upgrading:window.upgrade.upgrading,outcome:window.upgrade.outcome}));
   check('OVERLAP',()=>assertOverlap(held,pending));
   await a.evaluate(async()=>{window.lifecycle.release();await window.lifecycle.done;});
   const completed=await a.evaluate(()=>window.lifecycle.snapshot());
   check('RELEASE',()=>assertReleased(completed));
   check('RESULT',()=>{
    assert.equal(completed.result.status,fault?'rejected':'fulfilled');
    if(fault==='close-event-injected'){
     const close=completed.events.filter(e=>e.name==='source-close-event');
     assert.equal(close.length,1);assert.equal(close[0].kind,'synthetic');assert.equal(close[0].isTrusted,false);
    }
    if(['read-error-injected','close-event-injected'].includes(fault))
     assert.ok(completed.events.every(e=>e.name!=='transaction-readwrite'&&!/^(setItem|removeItem):/.test(e.name)));
   });
   await b.waitForFunction(()=>window.upgrade.outcome!==null);
   const upgraded=await b.evaluate(()=>window.upgrade.outcome);
   const after=await state(b,2);
   check('PERSISTED',()=>{
    assert.deepEqual(upgraded,{status:'fulfilled',version:2});
    assert.deepEqual(after.sync,before.sync);
    if(expected==='tombstone'){
     assert.deepEqual(after.portfolio,{...before.portfolio,revision:before.portfolio.revision+1,raw:null,settings:null,deleted:true,updatedAt:after.portfolio.updatedAt});
     assert.ok(Number.isFinite(Date.parse(after.portfolio.updatedAt)));
    }else if(expected==='adopt'){
     assert.deepEqual(after.portfolio,{...before.portfolio,revision:before.portfolio.revision+1,updatedAt:after.portfolio.updatedAt});
     assert.ok(Number.isFinite(Date.parse(after.portfolio.updatedAt)));
    }else assert.deepEqual(after,before);
   });
   const afterLegacy=await legacy(a);
   const markersAtUpgrade=await b.evaluate(()=>window.upgrade.markers);
   check('LEGACY',()=>{
    assert.deepEqual(markersAtUpgrade,afterLegacy,'upgrade begins only after final marker state');
    if(expected==='tombstone'){
     assert.equal(afterLegacy[0],expectedRaw);
     assert.equal(afterLegacy[1],fault?beforeLegacy[1]:null);
     if(fault)assertRetainedRevertIntent(afterLegacy[2],retainedIntent);
     else assert.equal(afterLegacy[2],null);
    }else if(expected==='intent')assert.deepEqual(afterLegacy,[expectedRaw,null,null]);
    else if(expected==='adopt')assert.deepEqual(afterLegacy,[beforeLegacy[0],'idb-v1',beforeLegacy[2]]);
    else assert.deepEqual(afterLegacy,beforeLegacy);
   });
   // Upgrade handle is now the fixture's only anchor access; compare full proof.
   await b.evaluate(()=>{window.syncTest.db=window.upgrade.db;});
   const afterProof=await operation(b,'anchor-proof');
   check('ANCHOR',()=>assert.deepEqual(afterProof,proof));
   const reopened=await state(a,2);check('REOPEN',()=>assert.deepEqual(reopened,after));
   const v2=await a.evaluate(async()=>{
    const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),c=new PortfolioStorage(localStorage);
    try{await c.initialize();return 'unexpected-success';}catch{return 'rejected';}finally{c.close();}
   });
   check('V2-BLOCK',()=>assert.equal(v2,'rejected'));
  });

 await scenario('L8-V2-LOCKED',['REJECT','UNCHANGED','ANCHOR','REOPEN'],async({a,b,original,proof,check})=>{
  await a.evaluate(()=>{window.syncTest.controller.close();window.syncTest.db.close();});
  await upgrade(b);await b.waitForFunction(()=>window.upgrade.outcome!==null);
  const beforeLegacy=await legacy(a);
  const statuses=await a.evaluate(async()=>{
   const t=window.syncTest,{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const statuses=[];
   // Deliberately matching old intent plus tombstone is covered separately at v1;
   // here all direct entries and automatic initialize must reject native v2.
   for(const action of ['migrateLocked','removeAllLocked','revertLocked','initialize']){
    const c=new PortfolioStorage(localStorage);c.mode='idb';
    try{await c[action](t.draft);statuses.push('fulfilled');}catch{statuses.push('rejected');}finally{c.close();}
   }
   return statuses;
  });
  check('REJECT',()=>assert.deepEqual(statuses,['rejected','rejected','rejected','rejected']));
  const after=await state(b,2),afterLegacy=await legacy(a);
  check('UNCHANGED',()=>{assert.deepEqual(after,original);assert.deepEqual(afterLegacy,beforeLegacy);});
  await b.evaluate(()=>{window.syncTest.db=window.upgrade.db;});
  const afterProof=await operation(b,'anchor-proof');
  check('ANCHOR',()=>assert.deepEqual(afterProof,proof));
  const reopened=await state(a,2);check('REOPEN',()=>assert.deepEqual(reopened,original));
 });

 await scenario('L9-V1-REMOVE',['RESULT','PERSISTED','ORIGINAL','RECOVERY'],async({a,b,original,proof,check})=>{
  await a.evaluate(()=>window.syncTest.controller.removeAllLocked());
  const after=await state(b,1);check('RESULT',()=>assert.equal(after.portfolio.revision,original.portfolio.revision+1));
  check('PERSISTED',()=>{assert.deepEqual(after.portfolio,{...original.portfolio,revision:original.portfolio.revision+1,raw:null,settings:null,deleted:true,updatedAt:after.portfolio.updatedAt});assert.deepEqual(after.sync,original.sync);});
  const originalDownload=await a.evaluate(()=>window.syncTest.controller.unverifiedBackup());
  check('ORIGINAL',()=>assert.deepEqual(originalDownload,after.portfolio));
  await a.evaluate(async expected=>{const t=window.syncTest;await t.controller.recoverFromBackup(t.draft,expected);},after.portfolio);
  const recovered=await state(b,1),afterProof=await operation(b,'anchor-proof');
  check('RECOVERY',()=>{assert.equal(recovered.portfolio.raw,original.portfolio.raw);assert.deepEqual(recovered.portfolio.settings,original.portfolio.settings);assert.equal(recovered.portfolio.revision,after.portfolio.revision+1);assert.deepEqual(recovered.sync,original.sync);assert.deepEqual(afterProof,proof);});
 });

 await scenario('L10-V2-INTENT',['REJECT','UNCHANGED','ANCHOR','REOPEN'],async({a,b,original,proof,check})=>{
  await operation(a,'delete',{revision:original.portfolio.revision});
  const tombstone=await operation(a,'read');
  await a.evaluate(revision=>{
   const t=window.syncTest,raw=t.expectedLegacy;let h=2166136261;
   for(let i=0;i<raw.length;i++)h=Math.imul(h^raw.charCodeAt(i),16777619);
   localStorage.setItem('foliolab-open-v1',raw);
   localStorage.setItem('foliolab-open-idb-revert-intent',JSON.stringify({revision,fingerprint:raw.length+':'+(h>>>0).toString(16)}));
   t.controller.close();t.db.close();
  },tombstone.portfolio.revision);
  const beforeLegacy=await legacy(a);await upgrade(b);await b.waitForFunction(()=>window.upgrade.outcome!==null);
  const status=await a.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),c=new PortfolioStorage(localStorage);
   try{await c.initialize();return 'fulfilled';}catch{return 'rejected';}finally{c.close();}
  });
  check('REJECT',()=>assert.equal(status,'rejected'));
  const after=await state(b,2),afterLegacy=await legacy(a);
  check('UNCHANGED',()=>{assert.deepEqual(after,tombstone);assert.deepEqual(afterLegacy,beforeLegacy);});
  await b.evaluate(()=>{window.syncTest.db=window.upgrade.db;});
  const afterProof=await operation(b,'anchor-proof');check('ANCHOR',()=>assert.deepEqual(afterProof,proof));
  const reopened=await state(a,2);check('REOPEN',()=>assert.deepEqual(reopened,tombstone));
 });

 for(const fault of ['error','blocked'])await scenario('L11-PROBE-'+fault.toUpperCase(),
  ['REJECT','NO-WRITES','UPGRADE','PRESERVED'],async({a,b,original,check})=>{
   await a.evaluate(fault=>{
    const t=window.syncTest;t.controller.close();t.db.close();
    const open=IDBFactory.prototype.open,events=[];
    window.probeFault={events,restore:()=>{IDBFactory.prototype.open=open;}};
    IDBFactory.prototype.open=function(...args){
     if(fault==='error'){events.push('injected-open-SecurityError');throw new DOMException('synthetic','SecurityError');}
     const r=open.apply(this,args);
     r.addEventListener('success',()=>{
      // Native success still follows; dispatch blocked before product onsuccess.
      events.push('injected-blocked-event');r.dispatchEvent(new Event('blocked'));
      r.result.addEventListener('versionchange',()=>events.push('versionchange'));
     },{once:true});return r;
    };
   },fault);
   const beforeLegacy=await legacy(a);
   const status=await a.evaluate(async()=>{
    const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),c=new PortfolioStorage(localStorage);
    try{await c.initialize();return 'fulfilled';}catch{return 'rejected';}finally{c.close();window.probeFault.restore();}
   });
   check('REJECT',()=>assert.equal(status,'rejected'));
   const afterLegacy=await legacy(a);check('NO-WRITES',()=>assert.deepEqual(afterLegacy,beforeLegacy));
   await upgrade(b);await b.waitForFunction(()=>window.upgrade.outcome!==null);
   const outcome=await b.evaluate(()=>window.upgrade.outcome);
   check('UPGRADE',()=>assert.deepEqual(outcome,{status:'fulfilled',version:2}));
   const after=await state(a,2);check('PRESERVED',()=>assert.deepEqual(after,original));
  });
 await scenario('L12-V2-RECOVERY',['REJECT','ORIGINAL','RECOVERY','ANCHOR','REOPEN'],async({a,b,original,proof,check})=>{
  await a.evaluate(()=>{window.syncTest.controller.close();window.syncTest.db.close();});
  await upgrade(b);await b.waitForFunction(()=>window.upgrade.outcome!==null);
  const status=await a.evaluate(async()=>{
   const t=window.syncTest,{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   t.controller=new PortfolioStorage(localStorage);
   try{await t.controller.initialize();return 'fulfilled';}catch{return 'rejected';}
  });
  check('REJECT',()=>assert.equal(status,'rejected'));
  const downloaded=await a.evaluate(()=>window.syncTest.controller.unverifiedBackup());
  check('ORIGINAL',()=>assert.deepEqual(downloaded,original.portfolio));
  await a.evaluate(async expected=>{const t=window.syncTest;await t.controller.recoverFromBackup(t.draft,expected);},downloaded);
  const recovered=await state(b,2);
  check('RECOVERY',()=>{assert.equal(recovered.portfolio.raw,original.portfolio.raw);assert.deepEqual(recovered.portfolio.settings,original.portfolio.settings);assert.equal(recovered.portfolio.revision,original.portfolio.revision+1);assert.equal(recovered.portfolio.syncEnrollmentRequired,true);assert.deepEqual(recovered.sync,original.sync);});
  await b.evaluate(()=>{window.syncTest.db=window.upgrade.db;});
  const afterProof=await operation(b,'anchor-proof');check('ANCHOR',()=>assert.deepEqual(afterProof,proof));
  const reopened=await state(a,2);check('REOPEN',()=>assert.deepEqual(reopened,recovered));
 });
 const require=createRequire(import.meta.url);
 console.log(JSON.stringify({kind:'FLH04SourceLifecycleProbe',version:1,node:process.version,
  playwright:require('playwright/package.json').version,engine:browser.version(),cases:results,
  openCases:['native forced-close/process termination','native source-open blocked/error (injections separate)',
   'unknown old writers/workers/mixed assets','full keyslot/ABA/recovery closure'],
  instrumentation:'readonly oncomplete callback delayed after native event; real product methods/imports unchanged; synthetic close/read/marker faults explicitly labeled'}));
 if(results.some(x=>x.status!=='PASS'))throw new AggregateError(results.filter(x=>x.status!=='PASS').map(x=>Error(x.id)),'FLH04 lifecycle candidate failed');
}
