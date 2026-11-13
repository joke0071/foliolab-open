import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {syncPayloadDigest,assertSyncPayloadDigest} from '../src/sync-payload-integrity.js';
import {PASSWORD_BACKUP_PLAIN_CHARS,PASSWORD_BACKUP_CIPHER_BYTES} from '../src/backup-limits.js';
const oracle=s=>createHash('sha256').update(s,'utf8').digest('hex');

test('exact-byte commitment agrees with independent Node SHA256, including Unicode',async()=>{
 for(const text of ['', 'abc', 'äö€😀', '{"amount":"9007199254740993.00000001","fxRate":null,"fxState":"UNKNOWN","bookingId":"id-A","journal":[]}']) {
  assert.equal(await syncPayloadDigest(text),oracle(text));
  assert.equal(await assertSyncPayloadDigest(text,oracle(text)),undefined);
 }
});
test('decimal rounding, UNKNOWN replacement, booking ID and journal edits invalidate commitment',async()=>{
 const raw='{"amount":"1.000000000000001","fx":null,"id":"booking-A","journal":["A","B"]}';
 const expected=oracle(raw);
 for(const changed of [raw.replace('1.000000000000001','1'),raw.replace('null','1'),raw.replace('booking-A','booking-B'),raw.replace('["A","B"]','["A"]')])
  await assert.rejects(()=>assertSyncPayloadDigest(changed,expected),/digest-mismatch/);
 assert.equal(await syncPayloadDigest(raw),expected,'original input remains usable');
});
test('whitespace, key order, newline and Unicode normalization are not silently canonicalized',async()=>{
 for(const [a,b] of [['{"a":1,"b":2}','{"b":2,"a":1}'],['{}','{}\n'],['{"a":1}','{ "a": 1 }'],['é','e\u0301']])
  await assert.rejects(()=>assertSyncPayloadDigest(b,oracle(a)),/digest-mismatch/);
});
test('malformed Unicode is rejected before lossy TextEncoder replacement',async()=>{
 for(const value of ['\ud800','\udc00','\ud800x','\ud800\ud800','\udc00\ud800'])
  await assert.rejects(()=>syncPayloadDigest(value),/payload-unicode/);
 assert.equal(await syncPayloadDigest('\ud83d\ude00'),oracle('😀'));
});
test('plain character and encoded-byte limits are both retained, not raised',async()=>{
 for(const value of [null,{},new Uint8Array([1]),'a'.repeat(PASSWORD_BACKUP_PLAIN_CHARS+1)])
  await assert.rejects(()=>syncPayloadDigest(value),/size-or-type/);
 const oversized='€'.repeat(Math.floor((PASSWORD_BACKUP_CIPHER_BYTES-16)/3)+1);
 assert.ok(oversized.length<PASSWORD_BACKUP_PLAIN_CHARS);
 await assert.rejects(()=>syncPayloadDigest(oversized),/size-or-type/);
});
test('invalid commitments fail without accepting truncated or case-normalized digests',async()=>{
 for(const value of [null,'',oracle('abc').toUpperCase(),oracle('abc').slice(1),'g'.repeat(64)])
  await assert.rejects(()=>assertSyncPayloadDigest('abc',value),/invalid-payload-digest/);
});
