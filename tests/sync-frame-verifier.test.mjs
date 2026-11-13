import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,createCipheriv,hkdfSync} from 'node:crypto';
import {createSyncFrameVerifier,readVerifiedSyncFrame,SYNC_FRAME_TEXT_LIMIT,SYNC_FRAME_CIPHER_LIMIT} from '../src/sync-frame-verifier.js';
import {prepareSyncOutboxAttempt,readSyncOutboxAttempt,classifySyncOutboxAttempt} from '../src/sync-outbox-attempt.js';
import {planSyncRevisions} from '../src/sync-revisions.js';

// Independent Node/OpenSSL encoder: no production encoding/AAD/KDF helper used.
// Fixed keys/nonces are synthetic fixtures ONLY; there is no production encoder.
const secret=Buffer.from('ab'.repeat(32),'hex');
const portfolioId='portfolio-A',epochId='01'.repeat(16),suite='HKDF-SHA256-A256GCM';
const oracle=s=>createHash('sha256').update(s).digest('hex');
const plain='{"amount":"9007199254740993.00000001","fx":null,"fxState":"UNKNOWN","journal":["B"],"label":"€😀"}\n';
const root={format:1,portfolioId,revisionId:'root',deviceId:'device-A',parentId:null,generation:'1',payloadDigest:oracle(plain)};
const child={...root,revisionId:'child',parentId:'root',generation:'2'};
const fields=['format','portfolioId','revisionId','deviceId','parentId','generation','payloadDigest'];
const imported=await crypto.subtle.importKey('raw',secret,'HKDF',false,['deriveKey']);
const verifier=createSyncFrameVerifier({portfolioId,epochId,key:imported});
function seal({descriptor=root,payload=plain,epoch=epochId,portfolio=portfolioId,salt='02'.repeat(32),nonce='03'.repeat(12),
 keyBytes=secret,keyDomain='foliolab-sync-key',aadDomain='foliolab-sync',raw}={}) {
 const info=Buffer.from(JSON.stringify([keyDomain,1,suite,portfolio,epoch]));
 const key=hkdfSync('sha256',keyBytes,Buffer.from(salt,'hex'),info,32);
 const cipher=createCipheriv('aes-256-gcm',key,Buffer.from(nonce,'hex'),{authTagLength:16});
 cipher.setAAD(Buffer.from(JSON.stringify([aadDomain,1,suite,portfolio,epoch,salt,nonce])));
 const content=raw ?? Buffer.from(JSON.stringify(['foliolab-sync-content',1,fields.map(k=>descriptor[k]),payload]));
 const ciphertext=Buffer.concat([cipher.update(content),cipher.final(),cipher.getAuthTag()]);
 return JSON.stringify(['foliolab-sync',1,suite,epoch,salt,nonce,ciphertext.toString('hex')]);
}
const frame=seal();
const change=(text,index,value)=>{const a=JSON.parse(text);a[index]=value;return JSON.stringify(a);};
const capture=(receipt,extra={})=>prepareSyncOutboxAttempt({receipt,expectedPortfolioId:portfolioId,expectedEpochId:epochId,
 expectedRevision:root,capturedLocalRevision:42,...extra});

test('independent Node HKDF/GCM fixture verifies exact payload, descriptor and frame hash',async()=>{
 const receipt=await verifier(frame),v=readVerifiedSyncFrame(receipt);
 assert.deepEqual(v.descriptor,root);assert.equal(v.plain,plain);assert.equal(v.frameText,frame);
 assert.equal(v.frameDigest,oracle(frame));assert.equal(v.epochId,epochId);
 assert.ok(Object.isFrozen(v)&&Object.isFrozen(v.descriptor)&&Object.isFrozen(receipt));
 assert.throws(()=>{v.descriptor.parentId='x';},TypeError);
 assert.ok(!frame.includes('portfolio-A')&&!frame.includes('payloadDigest')&&!frame.includes('UNKNOWN'));
});
test('portfolio binding prevents cross-portfolio decrypt even with the same group secret',async()=>{
 const other=createSyncFrameVerifier({portfolioId:'portfolio-B',epochId,key:imported});
 await assert.rejects(()=>other(frame),/authentication/);
 await assert.rejects(()=>verifier(seal({portfolio:'portfolio-B'})),/authentication/);
});
test('unknown epoch never selects a key or changes the trusted binding',async()=>{
 await assert.rejects(()=>verifier(change(frame,3,'04'.repeat(16))),/epoch-mismatch/);
 await assert.rejects(()=>verifier(seal({epoch:'04'.repeat(16)})),/epoch-mismatch/);
 assert.equal(readVerifiedSyncFrame(await verifier(frame)).epochId,epochId);
});
test('salt, nonce, ciphertext and tag mutations fail authentication',async()=>{
 const a=JSON.parse(frame);
 for(const [i,value] of [[4,'04'.repeat(32)],[5,'04'.repeat(12)],[6,'ff'+a[6].slice(2)],[6,a[6].slice(0,-2)+'ff']])
  await assert.rejects(()=>verifier(change(frame,i,value)),/authentication/);
});
test('wrong secret, backup AAD or wrong key domain cannot authenticate sync content',async()=>{
 for(const option of [{keyBytes:Buffer.alloc(32,9)},{aadDomain:'foliolab-backup-v2'},{keyDomain:'foliolab-backup-key'}])
  await assert.rejects(()=>verifier(seal(option)),/authentication/);
});
test('encrypted parent, generation, writer, portfolio and digest are all tag protected',async()=>{
 const raw=Buffer.from(JSON.stringify(['foliolab-sync-content',1,fields.map(k=>child[k]),plain]));
 const original=seal({descriptor:child}),a=JSON.parse(original);
 for(const needle of ['"portfolio-A"','"root"','"device-A"','"2"',root.payloadDigest]) {
  const pos=raw.indexOf(needle);assert.ok(pos>=0);
  const cipher=Buffer.from(a[6],'hex');cipher[pos]^=1;
  await assert.rejects(()=>verifier(change(original,6,cipher.toString('hex'))),/authentication/);
 }
});
test('valid AEAD with wrong inner portfolio, invalid descriptor or digest is still rejected',async()=>{
 for(const descriptor of [{...root,portfolioId:'portfolio-B'},{...root,generation:'01'},
  {...root,parentId:42},{...root,format:2}])
  await assert.rejects(()=>verifier(seal({descriptor})),/descriptor/);
 await assert.rejects(()=>verifier(seal({payload:plain.replace('null','1')})),/digest-mismatch/);
});
test('authenticated malformed UTF8, BOM and ambiguous inner encodings fail closed',async()=>{
 const content=['foliolab-sync-content',1,fields.map(k=>root[k]),plain];
 for(const raw of [Buffer.from([0xc3,0x28]),Buffer.from('\ufeff'+JSON.stringify(content))])
  await assert.rejects(()=>verifier(seal({raw})),/content-encoding/);
 for(const raw of [JSON.stringify([...content,'extra']),JSON.stringify(content,null,1),
  JSON.stringify(['other',...content.slice(1)]),JSON.stringify(['foliolab-sync-content',1,[...content[2],'extra'],plain])])
  await assert.rejects(()=>verifier(seal({raw:Buffer.from(raw)})),/content-format/);
});
test('lone surrogate snapshot cannot pass by TextEncoder replacement',async()=>{
 const payload='\ud800',descriptor={...root,payloadDigest:oracle(payload)};
 await assert.rejects(()=>verifier(seal({descriptor,payload})),/payload-unicode/);
});
test('outer formats, extra fields, noncanonical JSON and hex are rejected before crypto',async()=>{
 const a=JSON.parse(frame);
 for(const input of ['{}','[',JSON.stringify([...a,'extra']),JSON.stringify(a,null,1),
  change(frame,0,'foliolab-backup'),change(frame,1,2),change(frame,2,'AES-GCM'),
  change(frame,4,a[4].toUpperCase().replace('02','AB')),change(frame,5,'0'),change(frame,6,'xyz'),
  change(frame,6,a[6].slice(1)),change(frame,6,'00'.repeat(15)),frame.replace('1,','1.0,')])
  await assert.rejects(()=>verifier(input),/outer-format/);
 for(const input of [null,{},new Uint8Array([1]),' '.repeat(SYNC_FRAME_TEXT_LIMIT+1)])
  await assert.rejects(()=>verifier(input),/size-or-type/);
 await assert.rejects(()=>verifier(change(frame,6,'00'.repeat(SYNC_FRAME_CIPHER_LIMIT+1))),/outer-format/);
});
test('verifier requires a real nonextractable HKDF key and explicit local identity',async()=>{
 const aes=await crypto.subtle.importKey('raw',secret,'AES-GCM',false,['decrypt']);
 const wrongUsage=await crypto.subtle.importKey('raw',secret,'HKDF',false,['deriveBits']);
 for(const args of [{},{portfolioId,epochId,key:{}},{portfolioId,epochId,key:aes},
  {portfolioId,epochId,key:wrongUsage},{portfolioId:'private/name',epochId,key:imported},
  {portfolioId,epochId:'unknown',key:imported}]) assert.throws(()=>createSyncFrameVerifier(args),/invalid-binding/);
});
test('forged, copied or serialized verification flags are not capabilities',async()=>{
 const receipt=await verifier(frame);
 for(const fake of [null,{},true,{verified:true},{...receipt},JSON.parse(JSON.stringify(receipt))]) {
  assert.throws(()=>readVerifiedSyncFrame(fake),/unverified-receipt/);
  assert.throws(()=>capture(fake),/unverified-receipt/);
 }
});
test('decrypting replays does not authorize rollback or enrollment; graph remains required',async()=>{
 const r=readVerifiedSyncFrame(await verifier(frame)).descriptor;
 const c=readVerifiedSyncFrame(await verifier(seal({descriptor:child}))).descriptor;
 const args={portfolioId,localHead:c,localRevision:42,observationComplete:true};
 assert.equal(planSyncRevisions({...args,revisions:[r,c]}).status,'unchanged');
 assert.equal(planSyncRevisions({...args,revisions:[r]}).reason,'missing-local-anchor');
 assert.equal(planSyncRevisions({...args,localHead:null,revisions:[r,c]}).status,'enrollment-required');
});
test('authenticated siblings and equivocation remain conflicts or blocks after decrypt',async()=>{
 const sibling={...child,revisionId:'sibling',deviceId:'device-B'};
 const rows=await Promise.all([root,child,sibling].map(async descriptor=>readVerifiedSyncFrame(await verifier(seal({descriptor}))).descriptor));
 const args={portfolioId,localHead:root,localRevision:42,observationComplete:true};
 assert.equal(planSyncRevisions({...args,revisions:rows}).status,'conflict');
 const equivocation=readVerifiedSyncFrame(await verifier(seal({descriptor:{...root,deviceId:'device-B'}}))).descriptor;
 assert.equal(planSyncRevisions({...args,revisions:[equivocation]}).reason,'identity-collision');
});
test('outbox capture binds full expected descriptor, portfolio, epoch and captured CAS',async()=>{
 const receipt=await verifier(frame),attempt=capture(receipt),stored=readSyncOutboxAttempt(attempt);
 assert.equal(stored.frameText,frame);assert.equal(stored.frameDigest,oracle(frame));
 assert.equal(stored.capturedLocalRevision,42);assert.ok(Object.isFrozen(stored));
 assert.equal(stored.plain,undefined);assert.equal(stored.key,undefined);
 for(const extra of [{expectedPortfolioId:'portfolio-B'},{expectedEpochId:'04'.repeat(16)},
  {expectedRevision:{...root,parentId:'other'}},{expectedRevision:{...root,deviceId:'other'}},
  ...[0,-1,'42',1.5,Number.MAX_SAFE_INTEGER+1].map(capturedLocalRevision=>({capturedLocalRevision}))])
  assert.throws(()=>capture(receipt,extra),/outbox-binding/);
});
test('HTTP success, failed and unknown outcomes cannot acknowledge an upload without readback',async()=>{
 const attempt=capture(await verifier(frame));
 for(const [outcome,status] of [['not-started','pending'],['failed','pending'],['unknown','uncertain'],['uploaded','uncertain']]) {
  const result=classifySyncOutboxAttempt({attempt,outcome,currentLocalRevision:42});
  assert.equal(result.status,status);assert.equal(result.acknowledgedLocalRevision,null);
 }
});
test('only exact independently authenticated frame readback confirms the same attempt',async()=>{
 const receipt=await verifier(frame),attempt=capture(receipt);
 const readback=await verifier(frame);
 const result=classifySyncOutboxAttempt({attempt,outcome:'unknown',readback,currentLocalRevision:45});
 assert.deepEqual(result,{status:'confirmed',capturedLocalRevision:42,currentLocalRevision:45,
  acknowledgedLocalRevision:42,hasNewerLocalChanges:true});
 assert.equal(readSyncOutboxAttempt(attempt).frameText,frame);
});
test('same descriptor reencrypted with another salt/nonce does not confirm an old attempt',async()=>{
 const attempt=capture(await verifier(frame));
 for(const fresh of [seal({salt:'05'.repeat(32)}),seal({nonce:'06'.repeat(12)}),seal({descriptor:child})]) {
  const readback=await verifier(fresh);
  assert.deepEqual(classifySyncOutboxAttempt({attempt,outcome:'uploaded',readback,currentLocalRevision:42}),
   {status:'blocked',reason:'readback-mismatch'});
 }
});
test('outbox cannot adopt older CAS, forged tickets or JSON readback after restart',async()=>{
 const receipt=await verifier(frame),attempt=capture(receipt);
 for(const currentLocalRevision of [41,0,null,'42',Number.MAX_SAFE_INTEGER+1])
  assert.equal(classifySyncOutboxAttempt({attempt,outcome:'uploaded',currentLocalRevision}).reason,'invalid-local-revision');
 assert.equal(classifySyncOutboxAttempt({attempt,outcome:'future',currentLocalRevision:42}).reason,'invalid-outcome');
 assert.throws(()=>readSyncOutboxAttempt({...attempt}),/unrecognized-attempt/);
 assert.throws(()=>classifySyncOutboxAttempt({attempt,outcome:'uploaded',readback:{...receipt},currentLocalRevision:42}),/unverified-receipt/);
});
