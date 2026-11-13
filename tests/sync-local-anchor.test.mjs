import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {blankModel,backup} from '../src/model.js';
import {adoptPortfolioRecord,commitPortfolioRecord,restoreDamagedRecord,readPortfolioSyncRecord} from '../src/atomic-storage.js';
import {prepareLocalSyncAnchor} from '../src/sync-local-anchor.js';
import {createSyncOutboxStorage} from '../src/sync-outbox-storage.js';
import {verify,frame} from './sync-outbox-fixture.mjs';
import {memoryDB} from './transaction-double.mjs';

const anchorKey='sync-local-anchor-v1';
async function fixture() {
 const db=memoryDB(),model=blankModel();
 const portfolio=await adoptPortfolioRecord(db,{expectedPortfolio:null,
  raw:backup(model,{includeHistory:true}),settings:model.settings});
 return {db,portfolio};
}
async function hook(method,fn,operation) {
 const original=crypto.subtle[method],bound=original.bind(crypto.subtle);
 crypto.subtle[method]=async(...args)=>{const result=await bound(...args);await fn(args);return result;};
 try{return await operation();}finally{crypto.subtle[method]=original;}
}
function keyShape(key,type,name,usage,extractable) {
 assert.ok(key instanceof CryptoKey);assert.equal(key.type,type);
 assert.equal(key.algorithm.name,name);assert.deepEqual(key.usages,[usage]);
 assert.equal(key.extractable,extractable);
}

test('locked anchor double: local WebCrypto material, exact full-record binding, no caller identities or exposed keys',async()=>{
 const {db,portfolio}=await fixture();const before=structuredClone(db.data);
 const result=await prepareLocalSyncAnchor(db);
 const anchor=db.data.get(anchorKey);
 assert.equal(result.status,'prepared-locked');assert.equal(result.enrollmentAuthorized,false);
 assert.equal(result.localRevision,portfolio.revision);assert.equal(anchor.lifecycle,1);
 for(const field of ['lineId','portfolioId','epochId','deviceId'])assert.match(result[field],/^[0-9a-f]{32}$/);
 assert.equal(new Set(['lineId','portfolioId','epochId','deviceId'].map(f=>result[f])).size,4);
 assert.equal(anchor.portfolioDigest,createHash('sha256').update(JSON.stringify(portfolio)).digest('hex'));
 assert.deepEqual(Object.keys(result).sort(),['format','status','lifecycle','lineId','portfolioId','epochId','deviceId','localRevision','enrollmentAuthorized'].sort());
 assert.ok(Object.isFrozen(result));
 assert.deepEqual(db.data.get('portfolio'),before.get('portfolio'));assert.equal(db.data.has('sync-outbox-v1'),false);
 assert.equal(Object.hasOwn(anchor,'raw'),false);assert.equal(Object.hasOwn(anchor,'settings'),false);
 keyShape(anchor.epochKey,'secret','HKDF','deriveKey',false);
 keyShape(anchor.writerPrivateKey,'private','ECDSA','sign',false);
 keyShape(anchor.writerPublicKey,'public','ECDSA','verify',true);
 assert.equal(anchor.writerPrivateKey.algorithm.namedCurve,'P-256');
 await assert.rejects(()=>crypto.subtle.exportKey('raw',anchor.epochKey));
 await assert.rejects(()=>crypto.subtle.exportKey('pkcs8',anchor.writerPrivateKey));
 // Local key coherence only, NOT enrollment/individual remote authorization.
 const challenge=crypto.getRandomValues(new Uint8Array(32));
 const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},anchor.writerPrivateKey,challenge);
 assert.equal(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},anchor.writerPublicKey,sig,challenge),true);
});

test('locked anchor double: independent preparations get separate local identities and writer keys',async()=>{
 const a=await fixture(),b=await fixture();
 const one=await prepareLocalSyncAnchor(a.db),two=await prepareLocalSyncAnchor(b.db);
 for(const f of ['lineId','portfolioId','epochId','deviceId'])assert.notEqual(one[f],two[f]);
 const k1=await crypto.subtle.exportKey('raw',a.db.data.get(anchorKey).writerPublicKey);
 const k2=await crypto.subtle.exportKey('raw',b.db.data.get(anchorKey).writerPublicKey);
 assert.notDeepEqual(new Uint8Array(k1),new Uint8Array(k2));
});

test('locked anchor double: missing, deleted, unfenced and malformed portfolio never generate keys',async()=>{
 for(const change of [db=>db.data.delete('portfolio'),db=>{db.data.get('portfolio').deleted=true;db.data.get('portfolio').raw=null;},
  db=>delete db.data.get('portfolio').syncEnrollmentRequired,db=>{db.data.get('portfolio').syncEnrollmentRequired=false;},
  db=>{db.data.get('portfolio').raw='invalid';}]) {
  const {db}=await fixture();change(db);const before=structuredClone(db.data);let calls=0;
  await hook('generateKey',()=>{calls++;},()=>assert.rejects(()=>prepareLocalSyncAnchor(db)));
  assert.equal(calls,0);assert.deepEqual(db.data,before);
 }
});

test('locked anchor double: every existing outbox or anchor, including null and disabled, blocks without overwrite',async()=>{
 for(const [key,value] of [['sync-outbox-v1',undefined],['sync-outbox-v1',null],['sync-outbox-v1',{disabled:'portfolio-restored',entries:['original']}],
  [anchorKey,undefined],[anchorKey,null],[anchorKey,{status:'prepared-locked',original:'preserve'}]]) {
  const {db}=await fixture();db.data.set(key,value);const before=structuredClone(db.data);
  await assert.rejects(()=>prepareLocalSyncAnchor(db),/existing-(outbox|anchor)/);
  assert.deepEqual(db.data,before);
 }
});

test('locked anchor double: complete same-CAS portfolio preimage survives every crypto boundary race',async()=>{
 const changes=[
  p=>{p.updatedAt='changed';},p=>{p.settings={...p.settings,theme:'other'};},
  p=>{p.raw+=' ';},p=>{delete p.syncEnrollmentRequired;},
  p=>{p.revision++;},p=>{p.deleted=true;p.raw=null;},p=>{p.unexpected='metadata';}
 ];
 for(const method of ['importKey','generateKey','digest'])for(const change of changes) {
  const {db}=await fixture();let changed;
  await hook(method,()=>{change(db.data.get('portfolio'));changed=structuredClone(db.data);},
   ()=>assert.rejects(()=>prepareLocalSyncAnchor(db),/stale-portfolio|unsupported-record/));
  assert.deepEqual(db.data,changed);assert.equal(db.data.has(anchorKey),false);
 }
});

test('locked anchor double: non-JSON and unknown metadata cannot collapse into an accepted digest',async()=>{
 for(const mutate of [
  p=>{p.extra=undefined;},p=>{p.updatedAt=new Date();},
  p=>{p.settings.extra=undefined;},p=>{p.settings.extra={};},
  p=>{p.settings.extra=NaN;},p=>{p.settings.extra=-0;},p=>{p.settings=undefined;}
 ]) {
  const {db}=await fixture();mutate(db.data.get('portfolio'));const before=structuredClone(db.data);
  await assert.rejects(()=>prepareLocalSyncAnchor(db),/unsupported-/);assert.deepEqual(db.data,before);
 }
 const {db}=await fixture();
 await hook('digest',()=>{db.data.get('portfolio').extra=undefined;},
  ()=>assert.rejects(()=>prepareLocalSyncAnchor(db),/unsupported-record/));
 assert.equal(db.data.has(anchorKey),false);assert.equal(Object.hasOwn(db.data.get('portfolio'),'extra'),true);
});

test('locked anchor double: missing record, outbox or competing anchor appearing after crypto prevents commit',async()=>{
 for(const method of ['importKey','generateKey','digest'])for(const change of [
  db=>db.data.delete('portfolio'),db=>db.data.set('sync-outbox-v1',null),db=>db.data.set('sync-outbox-v1',undefined),
  db=>db.data.set('sync-outbox-v1',{entries:['preserve']}),db=>db.data.set(anchorKey,null),db=>db.data.set(anchorKey,undefined)]) {
  const {db}=await fixture();let changed;
  await hook(method,()=>{change(db);changed=structuredClone(db.data);},
   ()=>assert.rejects(()=>prepareLocalSyncAnchor(db),/stale-portfolio|existing-outbox|existing-anchor/));
  assert.deepEqual(db.data,changed);
 }
});

test('locked anchor double: serialized readwrite contenders persist exactly one whole prepared identity',async()=>{
 const {db,portfolio}=await fixture();
 const outcomes=await Promise.allSettled([prepareLocalSyncAnchor(db),prepareLocalSyncAnchor(db)]);
 assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);
 const winner=outcomes.find(r=>r.status==='fulfilled').value;
 const loser=outcomes.find(r=>r.status==='rejected').reason;assert.match(loser.message,/existing-anchor/);
 assert.equal(db.data.get(anchorKey).lineId,winner.lineId);assert.deepEqual(db.data.get('portfolio'),portfolio);
});

test('locked anchor double: abort and synthetic quota at the only put preserve full original state',async()=>{
 for(const fault of ['quota','abort-after-put']) {
  const {db}=await fixture();const before=structuredClone(db.data);db.fault=fault;
  await assert.rejects(()=>prepareLocalSyncAnchor(db));assert.deepEqual(db.data,before);
  assert.equal((await prepareLocalSyncAnchor(db)).status,'prepared-locked');
 }
});

test('locked anchor double: crypto failures never write and temporary epoch bytes are cleared',async()=>{
 for(const method of ['importKey','generateKey','digest']) {
  const {db}=await fixture(),before=structuredClone(db.data);let raw;
  const originalImport=crypto.subtle.importKey,original=crypto.subtle[method];
  crypto.subtle.importKey=async(...args)=>{raw=args[1];return originalImport.apply(crypto.subtle,args);};
  crypto.subtle[method]=async(...args)=>{if(method==='importKey')raw=args[1];throw Error('synthetic-crypto-failure');};
  try{await assert.rejects(()=>prepareLocalSyncAnchor(db),/synthetic-crypto-failure/);}
  finally{crypto.subtle.importKey=originalImport;crypto.subtle[method]=original;}
  assert.ok(raw instanceof Uint8Array);assert.ok(raw.every(b=>b===0));assert.deepEqual(db.data,before);
 }
 const {db}=await fixture();let raw;
 await hook('importKey',args=>{raw=args[1];},()=>prepareLocalSyncAnchor(db));
 assert.ok(raw.every(b=>b===0));
});

test('locked anchor double: completed preparation retry preserves keys, including discarded first result',async()=>{
 const {db}=await fixture();await prepareLocalSyncAnchor(db); // deliberately discard response
 const original=db.data.get(anchorKey);
 await assert.rejects(()=>prepareLocalSyncAnchor(db),/existing-anchor/);
 assert.equal(db.data.get(anchorKey),original);assert.equal(db.data.get('portfolio').syncEnrollmentRequired,true);
});

test('locked anchor double: readonly and commit-read abort expose no result or partial material',async()=>{
 for(const mode of ['readonly','readwrite']) {
  const {db}=await fixture(),before=structuredClone(db.data),transaction=db.transaction;
  db.transaction=function(store,kind){
   const tx=transaction.call(this,store,kind);
   if(kind===mode)setImmediate(()=>tx.abort());
   return tx;
  };
  await assert.rejects(()=>prepareLocalSyncAnchor(db),/aborted/);
  assert.deepEqual(db.data,before);
 }
});

test('locked anchor double: unexpected caller arguments cannot supply keys, identity, consent or an unlock',async()=>{
 const {db}=await fixture();
 const fake={lineId:'fake',portfolioId:'P',epochId:'12'.repeat(16),deviceId:'writer',
  key:'caller-key',verified:true,enrollmentAuthorized:true,syncEnrollmentRequired:false};
 const result=await prepareLocalSyncAnchor(db,fake);
 assert.notEqual(result.lineId,fake.lineId);assert.notEqual(result.portfolioId,fake.portfolioId);
 assert.notEqual(result.epochId,fake.epochId);assert.notEqual(result.deviceId,fake.deviceId);
 assert.equal(result.enrollmentAuthorized,false);assert.equal(db.data.get('portfolio').syncEnrollmentRequired,true);
});

test('locked anchor double: edits, restore, tombstone and explicit recovery preserve original locked material',async()=>{
 const {db,portfolio}=await fixture();await prepareLocalSyncAnchor(db);
 const publicBefore=await crypto.subtle.exportKey('raw',db.data.get(anchorKey).writerPublicKey);
 const originalDigest=db.data.get(anchorKey).portfolioDigest;
 await commitPortfolioRecord(db,{expectedRevision:1,raw:portfolio.raw,settings:portfolio.settings});
 await commitPortfolioRecord(db,{expectedRevision:2,raw:portfolio.raw,settings:portfolio.settings,intent:'restore'});
 await commitPortfolioRecord(db,{expectedRevision:3,raw:null,settings:null});
 const tombstone=(await readPortfolioSyncRecord(db)).portfolio;
 await restoreDamagedRecord(db,{expected:tombstone,raw:portfolio.raw,settings:portfolio.settings});
 const after=(await readPortfolioSyncRecord(db)).portfolio,anchor=db.data.get(anchorKey);
 assert.equal(after.revision,5);assert.equal(after.syncEnrollmentRequired,true);
 assert.equal(anchor.portfolioDigest,originalDigest);assert.equal(anchor.localRevision,1);
 assert.notEqual(createHash('sha256').update(JSON.stringify(after)).digest('hex'),originalDigest);
 assert.deepEqual(await crypto.subtle.exportKey('raw',anchor.writerPublicKey),publicBefore);
 assert.equal(anchor.status,'prepared-locked');await assert.rejects(()=>prepareLocalSyncAnchor(db),/existing-anchor/);
});

test('locked anchor double: preparation never bypasses A1/A2 or releases outbox work',async()=>{
 const {db,portfolio}=await fixture();await prepareLocalSyncAnchor(db);
 const api=createSyncOutboxStorage(db,verify),before=structuredClone(db.data),receipt=await verify(frame(portfolio.raw));
 await assert.rejects(()=>api.capture({expectedLocalRevision:1,expectedSyncVersion:null,
  receipt,expectedPortfolioId:'P',expectedEpochId:'12'.repeat(16)}),/enrollment-required/);
 await assert.rejects(()=>api.begin({expectedLocalRevision:1,expectedSyncVersion:null,revisionId:'R'}),/enrollment-required/);
 await assert.rejects(()=>api.recover(),/enrollment-required/);
 await assert.rejects(()=>api.planApply({expectedLocalRevision:1,expectedSyncVersion:null,revisions:[],observationComplete:true}),/enrollment-required/);
 await assert.rejects(()=>api.confirm({http200:true}),/remote-provenance-unavailable/);
 // CryptoKey instances are cloned by each successful readonly double tx.
 assert.deepEqual(db.data,before);
});
