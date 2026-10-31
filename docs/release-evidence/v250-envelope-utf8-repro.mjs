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
const {blankModel,backup,safeImport}=await import(pathToFileURL(modulePath.replace('backup-vault.js','model.js')));
const {createCompleteBackup,unpackCompleteBackup}=await import(pathToFileURL(modulePath.replace('backup-vault.js','complete-backup.js')));
const {adoptBackupPassword}=await import(pathToFileURL(modulePath));
const plain=JSON.stringify(createCompleteBackup(JSON.parse(backup(blankModel()))));
const envelope=JSON.parse(await encryptWithBackupPassword(plain));
// Unknown fields are not authenticated; the actual old reader and adoption accept them.
envelope.wrap.extra='😀'.repeat(6000000);
const input=JSON.stringify(envelope);
const {assertDriveBackupTextSize,assertLocalBackupFileSize}=await import(pathToFileURL(modulePath.replace('backup-vault.js','backup-limits.js')));
assertDriveBackupTextSize(input);
const payload=JSON.parse(await decryptPasswordBackup(envelope,password));
safeImport(unpackCompleteBackup(payload).data);
map.clear();assert.equal(await adoptBackupPassword(envelope,password),true);
assert.equal(map.get('active').wrap.extra,envelope.wrap.extra);
const file=await encryptWithBackupPassword(plain);
assertDriveBackupTextSize(file);
const bytes=new TextEncoder().encode(file).length;
let localRejected=false;try{assertLocalBackupFileSize(bytes);}catch{localRejected=true;}
assert.equal(localRejected,true);
assert.equal(await decryptPasswordBackup(JSON.parse(file),password),plain);
console.log(JSON.stringify({result:'REPRODUCED',scope:'synthetic valid complete backup with valid wrap plus unknown Unicode metadata accepted by reader and actual cross-device vault adoption',fileChars:file.length,fileUtf8Bytes:bytes,driveCharacterLimitPass:true,validPortfolio:true,actualVaultAdoption:true,localFileLimitRejected:true,writerReturnedFile:true,ciphertextDecrypts:true}));
