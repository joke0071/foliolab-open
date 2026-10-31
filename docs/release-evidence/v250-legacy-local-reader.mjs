// Independent synthetic old-writer fixture; run with the candidate vault module path.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const modulePath=process.argv[2];
const {configureBackupPassword,decryptPasswordBackup,encryptWithBackupPassword}=await import(pathToFileURL(modulePath));
const map=new Map(),db={objectStoreNames:{contains:()=>true},close(){},transaction(){const tx={};tx.objectStore=()=>({get(k){const r={result:map.get(k)};queueMicrotask(()=>{r.onsuccess();tx.oncomplete();});return r;},put(v,k){map.set(k,v);const r={result:k};queueMicrotask(()=>{r.onsuccess();tx.oncomplete();});return r;}});return tx;}};
globalThis.indexedDB={open(){const r={result:db};queueMicrotask(()=>r.onsuccess());return r;}};
const password='Synthetic old-writer password 2026!';
await configureBackupPassword(password,password);
const saved=map.get('active'),plain=JSON.stringify({synthetic:'😀'.repeat(3000000)}),raw=new TextEncoder().encode(plain),iv=crypto.getRandomValues(new Uint8Array(12));
// Reproduce the previous writer directly with the exact unchanged GCM/AAD contract.
const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('FolioLab Open password backup v2')},saved.key,raw));
const b64=b=>{let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(s);};
const envelope={format:'foliolab-open-encrypted-v2',keyId:saved.keyId,wrap:saved.wrap,iv:b64(iv),data:b64(encrypted),createdAt:'2026-10-31T20:00:00.000Z'};
const file=JSON.stringify(envelope),fileBytes=new TextEncoder().encode(file).length;
assert.ok(file.length>15000000);assert.ok(fileBytes<=20000000);assert.ok(encrypted.length<=15000000);assert.ok(plain.length<=10000000);
const restored=await decryptPasswordBackup(envelope,password);
assert.equal(restored,plain);
await assert.rejects(encryptWithBackupPassword(plain),/sichere Wiederherstellung/);
assert.equal(map.get('active'),saved);
console.log(JSON.stringify({result:'PASS',fixture:'synthetic old v2 writer; above Drive limit, below unchanged local/cipher limits',plainChars:plain.length,plainUtf8Bytes:raw.length,cipherBytes:encrypted.length,fileChars:file.length,fileBytes,restoredExact:true,newExportRejected:true,vaultUnchanged:true,sha256:createHash('sha256').update(restored).digest('hex')}));
