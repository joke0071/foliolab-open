import test from 'node:test';
import assert from 'node:assert/strict';
import {
 BACKUP_V2,hasBackupPassword,configureBackupPassword,encryptWithBackupPassword,
 decryptPasswordBackup,isPasswordBackup,adoptBackupPassword
} from '../src/backup-vault.js';

const originalDb=globalThis.indexedDB;
function dbMock(){
 const map=new Map();
 const database={
  objectStoreNames:{contains:()=>true},createObjectStore(){},close(){},
  transaction(){
   const tx={oncomplete:null,onabort:null,onerror:null};
   tx.objectStore=()=>({
    get(key){const req={result:map.get(key)};queueMicrotask(()=>{req.onsuccess?.();tx.oncomplete?.()});return req},
    put(value,key){map.set(key,value);const req={result:key};queueMicrotask(()=>{req.onsuccess?.();tx.oncomplete?.()});return req}
   });
   return tx;
  }
 };
 const indexedDB={open(){
  const req={result:database};
  queueMicrotask(()=>{req.onupgradeneeded?.();req.onsuccess?.()});
  return req;
 }};
 return {indexedDB,map};
}
function setup(){
 const mock=dbMock();
 globalThis.indexedDB=mock.indexedDB;
 return mock;
}
test.after(()=>{globalThis.indexedDB=originalDb});

test('single password allows automatic local/Drive encryption and cross-device recovery',async()=>{
 const db=setup(),plain=JSON.stringify({version:3,positions:[{name:'Private holdings',value:12345}],snapshots:[]});
 assert.equal(await hasBackupPassword(),false);
 await assert.rejects(encryptWithBackupPassword(plain),/einrichten/);
 await assert.rejects(configureBackupPassword('too short','too short'),/mindestens 10/);
 await assert.rejects(configureBackupPassword('strong-password-example','wrong'),/stimmen nicht/);
 await configureBackupPassword('strong-password-example','strong-password-example');
 assert.equal(await hasBackupPassword(),true);
 const vault=[...db.map.values()][0];
 assert.equal(vault.version,2);
 assert.equal(vault.key.extractable,false);
 assert.equal(JSON.stringify({keyId:vault.keyId,wrap:vault.wrap}).includes('strong-password-example'),false);
 const encrypted=JSON.parse(await encryptWithBackupPassword(plain));
 assert.equal(encrypted.format,BACKUP_V2);
 assert.equal(isPasswordBackup(encrypted),true);
 assert.ok(!JSON.stringify(encrypted).includes('Private holdings'));
 assert.equal(await decryptPasswordBackup(encrypted,'strong-password-example'),plain);
 await assert.rejects(decryptPasswordBackup(encrypted,'incorrect-password'),/Passwort/);
 const next=JSON.parse(await encryptWithBackupPassword(plain));
 assert.equal(next.keyId,encrypted.keyId);
 assert.notEqual(next.iv,encrypted.iv,'Every backup requires a fresh nonce');
 // New browser: no device key, password alone permits decryption and opt-in adoption.
 db.map.clear();
 assert.equal(await hasBackupPassword(),false);
 assert.equal(await decryptPasswordBackup(encrypted,'strong-password-example'),plain);
 assert.equal(await adoptBackupPassword(encrypted,'strong-password-example'),true);
 assert.equal(await hasBackupPassword(),true);
 assert.equal(await adoptBackupPassword(encrypted,'strong-password-example'),false);
 const afterRestore=JSON.parse(await encryptWithBackupPassword(plain));
 assert.equal(afterRestore.keyId,encrypted.keyId);
});

test('password rotation changes future backups, not old passwords or the underlying data key',async()=>{
 const db=setup();
 await configureBackupPassword('initial-very-long-password','initial-very-long-password');
 const old=JSON.parse(await encryptWithBackupPassword('abc'));
 await assert.rejects(configureBackupPassword('new-safe-password','new-safe-password'),/bisherige/);
 await assert.rejects(configureBackupPassword('new-safe-password','new-safe-password','wrong-old-password'),/Passwort/);
 const result=await configureBackupPassword('new-safe-password','new-safe-password','initial-very-long-password');
 assert.equal(result.changed,true);
 const fresh=JSON.parse(await encryptWithBackupPassword('abc'));
 assert.equal(fresh.keyId,old.keyId);
 assert.equal(await decryptPasswordBackup(old,'initial-very-long-password'),'abc');
 assert.equal(await decryptPasswordBackup(fresh,'new-safe-password'),'abc');
 await assert.rejects(decryptPasswordBackup(fresh,'initial-very-long-password'),/Passwort/);
 db.map.clear();
 assert.equal(await decryptPasswordBackup(fresh,'new-safe-password'),'abc');
});

test('malformed backup envelopes fail closed',async()=>{
 setup();
 await configureBackupPassword('testing-password-1234','testing-password-1234');
 const encrypted=JSON.parse(await encryptWithBackupPassword('data'));
 await assert.rejects(decryptPasswordBackup({...encrypted,iv:'bad'},'testing-password-1234'),/ungültige/);
 await assert.rejects(decryptPasswordBackup({...encrypted,data:''},'testing-password-1234'),/ungültige/);
 await assert.rejects(decryptPasswordBackup({...encrypted,wrap:{...encrypted.wrap,salt:'invalid'}},'testing-password-1234'),/ungültige/);
 await assert.rejects(decryptPasswordBackup({...encrypted,format:'unknown'},'testing-password-1234'),/Backupformat/);
});

test('oversized Unicode export fails before encryption and leaves the existing vault usable',async()=>{
 const db=setup(),password='synthetic-boundary-password';
 await configureBackupPassword(password,password);
 const before=db.map.get('active'),plain='{"name":"Synthetisch ä 😀 漢字"}';
 const saved=JSON.parse(await encryptWithBackupPassword(plain));
 await assert.rejects(encryptWithBackupPassword('😀'.repeat(3000000)),/sichere Wiederherstellung.*15 Millionen/);
 assert.equal(db.map.get('active'),before);
 assert.equal(await decryptPasswordBackup(saved,password),plain);
 const next=JSON.parse(await encryptWithBackupPassword(plain));
 assert.equal(next.keyId,saved.keyId);
 assert.equal(await decryptPasswordBackup(next,password),plain);
});

test('actual legacy vault adoption with Unicode wrap metadata cannot produce an oversized local file',async()=>{
 const db=setup(),password='synthetic-envelope-password';
 const {blankModel,backup,safeImport}=await import('../src/model.js');
 const {createCompleteBackup,unpackCompleteBackup}=await import('../src/complete-backup.js');
 const {assertDriveBackupTextSize}=await import('../src/backup-limits.js');
 await configureBackupPassword(password,password);
 const plain=JSON.stringify(createCompleteBackup(JSON.parse(backup(blankModel()))));
 const old=JSON.parse(await encryptWithBackupPassword(plain));old.wrap.extra='😀'.repeat(6000000);
 assertDriveBackupTextSize(JSON.stringify(old));
 safeImport(unpackCompleteBackup(JSON.parse(await decryptPasswordBackup(old,password))).data);
 db.map.clear();assert.equal(await adoptBackupPassword(old,password),true);
 const before=db.map.get('active');assert.equal(before.wrap.extra,old.wrap.extra);
 await assert.rejects(encryptWithBackupPassword(plain),/sichere Wiederherstellung.*20 MB/);
 assert.equal(db.map.get('active'),before,'No metadata stripping, key rewrite or vault replacement');
 assert.equal(await decryptPasswordBackup(old,password),plain,'The existing backup remains readable');
});
