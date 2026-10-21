import test from 'node:test';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';
import {encryptBackup,decryptBackup,isEncryptedBackup} from '../src/crypto-backup.js';
globalThis.crypto??=webcrypto;
test('AES-GCM sichert und entschlüsselt Backup verlustfrei',async()=>{const plain='{"version":2,"positions":[{"name":"Bitcoin"}]}';const secret=await encryptBackup(plain,'mein-sicheres-testpasswort');assert.equal(isEncryptedBackup(JSON.parse(secret)),true);assert.ok(!secret.includes('Bitcoin'));assert.equal(await decryptBackup(JSON.parse(secret),'mein-sicheres-testpasswort'),plain);});
test('Falsches Passwort, Manipulation und zu kurze Kennwörter abgewiesen',async()=>{await assert.rejects(()=>encryptBackup('x','kurz'));const x=JSON.parse(await encryptBackup('ABC','mindestens-zehn-zeichen'));await assert.rejects(()=>decryptBackup(x,'anderes-passwort'));x.data=x.data.slice(0,-3)+'AAA';await assert.rejects(()=>decryptBackup(x,'mindestens-zehn-zeichen'));});
