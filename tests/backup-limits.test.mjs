import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightBackup,assertLocalBackupFileSize,assertDriveBackupTextSize} from '../src/backup-limits.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';

test('legacy export fits the unchanged 6-million-character reader at the exact GCM/Base64 boundary',async()=>{
 const max=4500000-16;
 assert.equal(preflightBackup('a'.repeat(max),'v1').byteLength,max);
 assert.throws(()=>preflightBackup('a'.repeat(max+1),'v1'),/Altformat.*6 Millionen/);
 // Multi-byte text crosses the byte limit before the JS character limit.
 await assert.rejects(encryptBackup('€'.repeat(1500000),'short'),/sichere Wiederherstellung/);
 const plain='ÄÖü 😀 漢字'.repeat(3000);
 assert.equal(await decryptBackup(JSON.parse(await encryptBackup(plain,'synthetic-password-2026')),'synthetic-password-2026'),plain);
});
test('v2 export checks text, UTF-8, GCM tag, padded Base64 and actual envelope overhead separately',()=>{
 const overhead=403;
 const max=3*Math.floor((15000000-overhead)/4)-16;
 // Two-byte data fits the original 10-million-character rule and reaches the envelope boundary first.
 const plain='ä'.repeat(Math.floor(max/2))+(max%2?'x':'');
 const raw=preflightBackup(plain,'v2',overhead);
 assert.equal(Buffer.byteLength(plain,'utf8'),max);
 assert.equal(raw.byteLength,max);
 assert.ok(Buffer.from(new Uint8Array(max+16)).toString('base64').length+overhead<=15000000);
 assert.throws(()=>preflightBackup(plain+'x','v2',overhead),/einschließlich Verschlüsselung/);
 assert.throws(()=>preflightBackup('😀'.repeat(3000000),'v2',overhead),/einschließlich Verschlüsselung/);
 assert.throws(()=>preflightBackup('漢'.repeat(5000000),'v2',overhead),/15 MB/);
 assert.throws(()=>preflightBackup('x'.repeat(10000001),'v2',overhead),/10 Millionen Textzeichen/);
 assert.throws(()=>preflightBackup('abc','v2',NaN),/Dateigröße/);
 assert.throws(()=>preflightBackup('abc','future'),/Unbekanntes/);
 assert.throws(()=>preflightBackup(null,'v2'),/ungültige/);
});
test('local and Drive readers retain their existing file limits',()=>{
 assert.doesNotThrow(()=>assertLocalBackupFileSize(20000000));
 assert.throws(()=>assertLocalBackupFileSize(20000001),/20 MB.*unverändert/);
 assert.doesNotThrow(()=>assertDriveBackupTextSize('x'.repeat(15000000)));
 assert.throws(()=>assertDriveBackupTextSize('x'.repeat(15000001)),/15 Millionen.*unverändert/);
});

test('Unicode envelope bytes must fit the independent unchanged 20-MB local file reader',()=>{
 // An independently specified UTF-8 envelope fits Drive characters but reaches the local byte boundary.
 assert.doesNotThrow(()=>preflightBackup('','v2',7000000,20000000-24));
 assert.throws(()=>preflightBackup('','v2',7000000,20000000-23),/20 MB Dateigröße/);
 assert.throws(()=>preflightBackup('abc','v2',12000000,24000000),/20 MB Dateigröße/);
 assert.throws(()=>preflightBackup('abc','v2',300,299),/Dateigröße konnte nicht geprüft/);
 assert.throws(()=>preflightBackup('abc','v2',300,Infinity),/Dateigröße konnte nicht geprüft/);
});
