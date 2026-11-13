import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {frame} from './sync-outbox-fixture.mjs';

// Directed NATIVE IDB acceptance harness. Not part of a workflow until reviewed.
// No test double; scripted abort/quota are fault injection, not real process
// crash/power loss or actual disk exhaustion. Those gates remain separate.
const engines={chromium,firefox,webkit},name=process.env.ENGINE||'chromium';
if(!engines[name])throw Error('Unsupported ENGINE');
const v2Candidate=process.env.FLH04_VERSION2_CANDIDATE;
// Independent opt-in; consumed C1 runs are not repeated by this candidate.
const sourceLifecycle=process.env.FLH04_SOURCE_LIFECYCLE;
if(sourceLifecycle!==undefined&&(sourceLifecycle!=='1'||name!=='chromium'||v2Candidate!==undefined))
 throw Error('FLH04 lifecycle requires value 1, Chromium and no C1 opt-in');
const rendererTermination=process.env.FLH04_RENDERER_TERMINATION;
if(rendererTermination!==undefined&&(rendererTermination!=='1'||sourceLifecycle!=='1'||name!=='chromium'||v2Candidate!==undefined))
 throw Error('FLH04 renderer termination requires value 1, source lifecycle, Chromium and no C1 opt-in');
if(v2Candidate!==undefined&&(v2Candidate!=='1'||name!=='chromium'))
 throw Error('FLH04 C1 requires explicit value 1 and ENGINE=chromium');
if(v2Candidate==='1'||sourceLifecycle==='1'){
 const candidateURL=new URL((process.env.BASE_URL||'http://127.0.0.1:4173')+'/tests/storage-origin.html');
 if(candidateURL.protocol!=='http:'||!['127.0.0.1','localhost'].includes(candidateURL.hostname)||
    candidateURL.port!=='4173'||candidateURL.pathname!=='/tests/storage-origin.html')
  throw Error('FLH04 C1 requires the local synthetic test origin on port 4173');
}
const browser=await engines[name].launch({headless:true});
const context=await browser.newContext();
const url=(process.env.BASE_URL||'http://127.0.0.1:4173')+'/tests/storage-origin.html';
async function setup(page){
 await page.goto(url);
 await page.evaluate(async()=>{
  const storage=await import('/src/atomic-storage.js'),model=await import('/src/model.js');
  const {createSyncFrameVerifier}=await import('/src/sync-frame-verifier.js');
  const {createSyncOutboxStorage}=await import('/src/sync-outbox-storage.js');
  const {prepareLocalSyncAnchor}=await import('/src/sync-local-anchor.js');
  const key=await crypto.subtle.importKey('raw',new Uint8Array(32).fill(17),'HKDF',false,['deriveKey']);
  const verify=createSyncFrameVerifier({portfolioId:'P',epochId:'12'.repeat(16),key});
  const db=await storage.openPortfolioDB();
  window.syncTest={storage,model,db,verify,prepareLocalSyncAnchor,api:createSyncOutboxStorage(db,verify)};
 });
}
async function operation(page,action,args={}){
 return page.evaluate(async({action,args})=>{
  const t=window.syncTest;
  if(action==='prepare-anchor')return t.prepareLocalSyncAnchor(t.db);
  if(action==='anchor-proof'){
   const anchor=await new Promise((resolve,reject)=>{
    const tx=t.db.transaction('records','readonly'),r=tx.objectStore('records').get('sync-local-anchor-v1');let value;
    r.onsuccess=()=>{value=r.result;};tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(tx.error);
   });
   if(!(anchor.epochKey instanceof CryptoKey)||anchor.epochKey.extractable||
    !(anchor.writerPrivateKey instanceof CryptoKey)||anchor.writerPrivateKey.extractable||
    anchor.status!=='prepared-locked')throw Error('native-anchor-invalid-key-storage');
   const challenge=crypto.getRandomValues(new Uint8Array(32));
   const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},anchor.writerPrivateKey,challenge);
   if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},anchor.writerPublicKey,signature,challenge))
    throw Error('native-anchor-key-pair-mismatch');
   await crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:new Uint8Array(32),info:new Uint8Array(0)},
    anchor.epochKey,{name:'AES-GCM',length:256},false,['decrypt']);
   return {lineId:anchor.lineId,status:anchor.status,localRevision:anchor.localRevision,
    publicKey:Array.from(new Uint8Array(await crypto.subtle.exportKey('raw',anchor.writerPublicKey)))};
  }
  if(action==='initialize')return t.storage.commitPortfolioRecord(t.db,{expectedRevision:null,raw:t.model.backup(t.model.blankModel(),{includeHistory:true}),settings:t.model.defaultSettings()});
  if(action==='read')return t.storage.readPortfolioSyncRecord(t.db);
  if(action==='recover')return t.api.recover();
  if(action==='capture')return t.api.capture({...args,receipt:await t.verify(args.frameText),expectedPortfolioId:'P',expectedEpochId:'12'.repeat(16)});
  if(action==='begin')return t.api.begin(args);
  if(action==='confirm')return t.api.confirm({...args,readback:await t.verify(args.frameText)});
  if(action==='save')return t.storage.commitPortfolioRecord(t.db,{expectedRevision:args.revision,raw:args.raw,settings:t.model.defaultSettings()});
  if(action==='restore')return t.storage.commitPortfolioRecord(t.db,{expectedRevision:args.revision,raw:args.raw,settings:t.model.defaultSettings(),intent:'restore'});
  if(action==='delete')return t.storage.commitPortfolioRecord(t.db,{expectedRevision:args.revision,raw:null,settings:null});
  if(action==='adopt')return t.storage.adoptPortfolioRecord(t.db,{expectedPortfolio:args.expected,raw:args.raw,settings:t.model.defaultSettings(),allowTombstone:true});
  if(action==='recover-record')return t.storage.restoreDamagedRecord(t.db,{expected:args.expected,raw:args.raw,settings:t.model.defaultSettings()});
  if(action==='fault-capture'||action==='fault-restore'){
   const put=IDBObjectStore.prototype.put;
   IDBObjectStore.prototype.put=function(value,key){
    if(key==='sync-outbox-v1'){
     if(args.fault==='quota')throw new DOMException('synthetic-quota','QuotaExceededError');
     const result=put.call(this,value,key);this.transaction.abort();return result;
    }
    return put.call(this,value,key);
   };
   try{
    if(action==='fault-restore')return await t.storage.commitPortfolioRecord(t.db,{expectedRevision:args.revision,raw:args.raw,settings:t.model.defaultSettings(),intent:'restore'});
    return await t.api.capture({...args,receipt:await t.verify(args.frameText),expectedPortfolioId:'P',expectedEpochId:'12'.repeat(16)});
   }
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
 await assert.rejects(()=>operation(c,'confirm',{expectedLocalRevision:2,expectedSyncVersion:3,revisionId:'R',frameText:rootFrame}),/remote-provenance-unavailable/);
 const guarded=await c.evaluate(async()=>window.syncTest.api.planApply({expectedLocalRevision:2,expectedSyncVersion:3,revisions:[],observationComplete:true}));
 assert.equal(guarded.status,'unchanged');assert.equal(guarded.applyAuthorized,false);
 const unmatched=await operation(c,'recover');assert.equal(unmatched.summary.remoteAnchor,null);assert.equal(unmatched.summary.hasPendingChanges,true);
 const preserved=await operation(c,'read');
 for(const fault of ['quota','abort']){
  await assert.rejects(()=>operation(c,'fault-restore',{revision:2,raw:preserved.portfolio.raw,fault}));
  assert.deepEqual(await operation(b,'read'),preserved);
 }
 await operation(c,'restore',{revision:2,raw:preserved.portfolio.raw});
 assert.equal((await operation(b,'read')).sync.disabled,'portfolio-restored');
 assert.deepEqual((await operation(b,'read')).sync.entries,preserved.sync.entries);
 await assert.rejects(()=>operation(b,'recover'));
 const restored=await operation(c,'read');
 await operation(c,'recover-record',{expected:restored.portfolio,raw:restored.portfolio.raw});
 assert.equal((await operation(b,'read')).sync.disabled,'explicit-recovery');
 await assert.rejects(()=>operation(b,'recover'));
 assert.deepEqual((await operation(c,'read')).sync.entries,preserved.sync.entries);
 await operation(c,'delete',{revision:4});
 assert.equal((await operation(b,'read')).sync.disabled,'portfolio-deleted');
 await assert.rejects(()=>operation(b,'recover'));
 const tombstone=await operation(b,'read');
 const adopted=await operation(c,'adopt',{expected:tombstone.portfolio,raw:restored.portfolio.raw});
 assert.equal(adopted.syncEnrollmentRequired,true);assert.equal(adopted.revision,6);
 const fenced=await operation(b,'read');
 assert.deepEqual(fenced.sync.entries,preserved.sync.entries);
 await assert.rejects(()=>operation(b,'capture',{expectedLocalRevision:6,expectedSyncVersion:fenced.sync.version,frameText:frame(adopted.raw)}),/enrollment-required/);
 await assert.rejects(()=>operation(b,'begin',{expectedLocalRevision:6,expectedSyncVersion:fenced.sync.version,revisionId:'R'}),/enrollment-required/);
 await assert.rejects(()=>operation(b,'recover'),/enrollment-required/);
 assert.deepEqual(await operation(c,'read'),fenced);
 // A distinct empty origin context: old outboxes MUST NOT be adopted.
 const local=await browser.newContext();
 try{
  const page=await local.newPage();await setup(page);
  const p=await operation(page,'initialize');
  const fenced=await operation(page,'adopt',{expected:p,raw:p.raw});
  const prepared=await operation(page,'prepare-anchor');
  assert.equal(prepared.status,'prepared-locked');assert.equal(prepared.enrollmentAuthorized,false);
  assert.deepEqual(await operation(page,'read'),{portfolio:fenced,sync:null});
  const proof=await operation(page,'anchor-proof');assert.equal(proof.lineId,prepared.lineId);
  await page.close();const resumed=await local.newPage();await setup(resumed);
  assert.deepEqual(await operation(resumed,'anchor-proof'),proof);
  await assert.rejects(()=>operation(resumed,'prepare-anchor'),/existing-anchor/);
  await assert.rejects(()=>operation(resumed,'recover'),/enrollment-required/);
  await operation(resumed,'restore',{revision:fenced.revision,raw:fenced.raw});
  assert.deepEqual(await operation(resumed,'anchor-proof'),proof);
  assert.equal((await operation(resumed,'read')).portfolio.syncEnrollmentRequired,true);
 }finally{await local.close();}
 if(sourceLifecycle==='1'){
  const {runSourceLifecycleCandidate}=await import('./flh04-source-lifecycle-probes.mjs');
  await runSourceLifecycleCandidate({browser,setup,operation,url});
  if(rendererTermination==='1'){
   const {runRendererTerminationCandidate}=await import('./flh04-renderer-termination-probes.mjs');
   await runRendererTerminationCandidate({browser,setup,operation,url});
  }
 }
 if(v2Candidate==='1'){
  const {runVersion2Candidate}=await import('./flh04-version2-candidate-probes.mjs');
  await runVersion2Candidate({browser,setup,operation,url});
 }
 console.log('NATIVE SYNC OUTBOX '+name+': injected abort/quota, two-page CAS, page restart/reverify, newer save, A1 preimage guard, A2 pseudo-readback rejection, ordinary restore/recovery/delete invalidation, prepared-locked CryptoKey persistence/page reopen (not enrollment) PASS. Real process crash/power-loss/real quota NOT QUALIFIED.');
}finally{await context.close();await browser.close();}
