import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {frame} from './sync-outbox-fixture.mjs';

// Directed NATIVE IDB acceptance harness. Not part of a workflow until reviewed.
// No test double; scripted abort/quota are fault injection, not real process
// crash/power loss or actual disk exhaustion. Those gates remain separate.
const engines={chromium,firefox,webkit},name=process.env.ENGINE||'chromium';
if(!engines[name])throw Error('Unsupported ENGINE');
const browser=await engines[name].launch({headless:true});
const context=await browser.newContext();
const url=(process.env.BASE_URL||'http://127.0.0.1:4173')+'/tests/storage-origin.html';
async function setup(page){
 await page.goto(url);
 await page.evaluate(async()=>{
  const storage=await import('/src/atomic-storage.js'),model=await import('/src/model.js');
  const {createSyncFrameVerifier}=await import('/src/sync-frame-verifier.js');
  const {createSyncOutboxStorage}=await import('/src/sync-outbox-storage.js');
  const key=await crypto.subtle.importKey('raw',new Uint8Array(32).fill(17),'HKDF',false,['deriveKey']);
  const verify=createSyncFrameVerifier({portfolioId:'P',epochId:'12'.repeat(16),key});
  const db=await storage.openPortfolioDB();
  window.syncTest={storage,model,db,verify,api:createSyncOutboxStorage(db,verify)};
 });
}
async function operation(page,action,args={}){
 return page.evaluate(async({action,args})=>{
  const t=window.syncTest;
  if(action==='initialize')return t.storage.commitPortfolioRecord(t.db,{expectedRevision:null,raw:t.model.backup(t.model.blankModel(),{includeHistory:true}),settings:t.model.defaultSettings()});
  if(action==='read')return t.storage.readPortfolioSyncRecord(t.db);
  if(action==='recover')return t.api.recover();
  if(action==='capture')return t.api.capture({...args,receipt:await t.verify(args.frameText),expectedPortfolioId:'P',expectedEpochId:'12'.repeat(16)});
  if(action==='begin')return t.api.begin(args);
  if(action==='confirm')return t.api.confirm({...args,readback:await t.verify(args.frameText)});
  if(action==='save')return t.storage.commitPortfolioRecord(t.db,{expectedRevision:args.revision,raw:args.raw,settings:t.model.defaultSettings()});
  if(action==='delete')return t.storage.commitPortfolioRecord(t.db,{expectedRevision:args.revision,raw:null,settings:null});
  if(action==='recover-record')return t.storage.restoreDamagedRecord(t.db,{expected:args.expected,raw:args.raw,settings:t.model.defaultSettings()});
  if(action==='fault-capture'){
   const put=IDBObjectStore.prototype.put;
   IDBObjectStore.prototype.put=function(value,key){
    if(key==='sync-outbox-v1'){
     if(args.fault==='quota')throw new DOMException('synthetic-quota','QuotaExceededError');
     const result=put.call(this,value,key);this.transaction.abort();return result;
    }
    return put.call(this,value,key);
   };
   try{return await t.api.capture({...args,receipt:await t.verify(args.frameText),expectedPortfolioId:'P',expectedEpochId:'12'.repeat(16)});}
   finally{IDBObjectStore.prototype.put=put;}
  }
  throw Error('Unknown action');
 },{action,args});
}
try{
 const a=await context.newPage(),b=await context.newPage();await setup(a);await setup(b);
 const initial=await operation(a,'initialize'),rootFrame=frame(initial.raw);
 const capture={expectedLocalRevision:1,expectedSyncVersion:null,frameText:rootFrame};
 for(const fault of ['quota','abort']){
  await assert.rejects(()=>operation(a,'fault-capture',{...capture,fault}));
  assert.deepEqual(await operation(b,'read'),{portfolio:initial,sync:null});
 }
 const racers=await Promise.allSettled([operation(a,'capture',capture),operation(b,'capture',capture)]);
 assert.equal(racers.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(racers.filter(r=>r.status==='rejected').length,1);
 assert.deepEqual((await operation(a,'read')).portfolio,initial);
 const started=await operation(a,'begin',{expectedLocalRevision:1,expectedSyncVersion:1,revisionId:'R'});
 assert.equal(started.frameText,rootFrame);assert.equal(started.state.entries[0].status,'uncertain');
 // Closed page destroys JS capabilities. Reopening requires re-decrypting IDB.
 await a.close();const c=await context.newPage();await setup(c);
 const recovered=await operation(c,'recover');assert.deepEqual(recovered.state,started.state);assert.equal(recovered.summary.remoteAnchor,null);
 const changed=JSON.parse(initial.raw);changed.providers.push({id:'provider-B',name:'Synthetic B',type:'broker'});
 // Let the normal portfolio validator/serializer create the confirmed bytes.
 const saved=await operation(b,'save',{revision:1,raw:JSON.stringify(changed)});
 const childFrame=frame(saved.raw,'S','R','2');
 await operation(b,'capture',{expectedLocalRevision:2,expectedSyncVersion:2,frameText:childFrame});
 await assert.rejects(()=>operation(c,'confirm',{expectedLocalRevision:1,expectedSyncVersion:2,revisionId:'R',frameText:rootFrame}));
 const before=await operation(c,'read');
 await assert.rejects(()=>operation(c,'confirm',{expectedLocalRevision:2,expectedSyncVersion:3,revisionId:'R',frameText:frame(initial.raw,'R',null,'1','45'.repeat(32))}));
 await assert.rejects(()=>operation(c,'confirm',{expectedLocalRevision:2,expectedSyncVersion:3,revisionId:'S',frameText:childFrame}));
 assert.deepEqual(await operation(c,'read'),before);
 await operation(c,'confirm',{expectedLocalRevision:2,expectedSyncVersion:3,revisionId:'R',frameText:rootFrame});
 const old=await operation(b,'recover');assert.equal(old.summary.acknowledgedLocalRevision,1);assert.equal(old.summary.hasPendingChanges,true);
 await operation(b,'confirm',{expectedLocalRevision:2,expectedSyncVersion:4,revisionId:'S',frameText:childFrame});
 assert.equal((await operation(c,'recover')).summary.hasPendingChanges,false);
 const confirmed=await operation(c,'read');
 await operation(c,'recover-record',{expected:confirmed.portfolio,raw:confirmed.portfolio.raw});
 assert.equal((await operation(b,'read')).sync.disabled,'explicit-recovery');
 await assert.rejects(()=>operation(b,'recover'));
 assert.deepEqual((await operation(c,'read')).sync.entries,confirmed.sync.entries);
 await operation(c,'delete',{revision:3});
 assert.equal((await operation(b,'read')).sync.disabled,'portfolio-deleted');
 await assert.rejects(()=>operation(b,'recover'));
 console.log('NATIVE SYNC OUTBOX '+name+': injected abort/quota, two-page CAS, page restart/reverify, newer save, exact readback, anchor order, recovery/delete invalidation PASS. Real process crash/power-loss/real quota NOT QUALIFIED.');
}finally{await context.close();await browser.close();}
