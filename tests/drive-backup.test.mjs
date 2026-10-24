import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../src/drive-backup.js',import.meta.url),'utf8');

function makeApp(initialPreferences=null){
 const values=new Map(),events=new Map();
 if(initialPreferences)values.set('foliolab-open-drive-backup-settings-v1',JSON.stringify(initialPreferences));
 const storage={
  getItem:(key)=>values.get(key)||null,
  setItem:(key,value)=>values.set(key,String(value)),
  removeItem:(key)=>values.delete(key)
 };
 const ids=['driveBackupStatus','driveConnect','driveSaveNow','driveRefreshList','driveRestore',
  'driveAutoMode','driveRetention','driveClientId','driveDisconnect','exportBackup','driveRecoveryExport','recoveryKeyDisplay','recoveryKeyReveal','recoveryKeyCopy','recoveryKeyConfirmed','recoveryKeyStatus','driveBackupSelect',
  'driveRecoveryInput','driveFolderSelect','driveFolderRefresh','driveFolderNewName','driveFolderCreate'];
 const elements=Object.fromEntries(ids.map(id=>[id,{
  value:'',textContent:'',disabled:false,open:false,classList:(()=>{
   const names=new Set();
   return {toggle(name,force){if(force===undefined?!names.has(name):force)names.add(name);else names.delete(name);return names.has(name)},
    add(name){names.add(name)},remove(name){names.delete(name)},contains(name){return names.has(name)}};
  })(),
  addEventListener(type,fn){this[type]=fn},setAttribute(){},onclick:null,onchange:null
 }]));
 const document={
  getElementById:id=>elements[id]||null,
  addEventListener(type,fn){events.set(type,fn)}
 };
 const window={addEventListener(type,fn){events.set(type,fn)}};
 runInNewContext(source,{window,document,localStorage:storage,Date,Number,Error,JSON,
  setTimeout,clearTimeout},{filename:'drive-backup.js'});
 return {window,elements,storage};
}

test('backup is optional, disabled until Google authorization, defaults to three retained files',async()=>{
 const app=makeApp();
 await app.window.FolioDriveBackup.init({readData:()=>({positions:[],snapshots:[]})});
 assert.equal(app.elements.driveAutoMode.value,'off');
 assert.equal(app.elements.driveRetention.value,'3');
 assert.equal(app.elements.driveSaveNow.disabled,true);
 assert.match(app.elements.driveBackupStatus.textContent,/lokal/);
 assert.equal(app.storage.getItem('foliolab-open-drive-backup-settings-v1'),null);
});

test('changes to schedule and retention are local, bounded and need no Google sign-in',async()=>{
 const app=makeApp();await app.window.FolioDriveBackup.init({readData:()=>({positions:[],snapshots:[]})});
 app.elements.driveAutoMode.value='weekly';
 app.elements.driveRetention.value='5';
 app.elements.driveAutoMode.onchange();
 let settings=JSON.parse(app.storage.getItem('foliolab-open-drive-backup-settings-v1'));
 assert.equal(settings.mode,'weekly');
 assert.equal(settings.retention,5);
 app.elements.driveRetention.value='0';app.elements.driveRetention.onchange();
 settings=JSON.parse(app.storage.getItem('foliolab-open-drive-backup-settings-v1'));
 assert.equal(settings.retention,5);
 assert.equal(app.elements.driveRetention.value,'5');
 assert.match(app.elements.driveBackupStatus.textContent,/1 bis 30/);
});

test('the backup code requires cryptographic restore material and scopes its Drive files',()=>{
 assert.match(source,/AES-GCM/);
 assert.match(source,/https:\/\/www\.googleapis\.com\//);
 assert.match(source,/drive\.file/);
 assert.match(source,/appProperties:\{foliolabBackup:LABEL\}/);
 assert.match(source,/if\(!saved\.some\(f=>f\.id===uploaded\.id\)\)/);
 assert.match(source,/slice\(prefs\.retention\)/);
 assert.match(source,/Keine Positionen vorhanden/);
 assert.match(source,/function trimExisting\(\)/);
 assert.match(source,/function maybeAuto\(\)/);
 assert.doesNotMatch(source,/api\\/public-config/);
 assert.match(source,/prefs\\.clientId/);
 assert.doesNotMatch(source,/client_secret|refresh_token|localStorage\.setItem\(.+accessToken/);
});

test('encrypted local backups round-trip with AES-GCM and reject a wrong recovery key',async()=>{
 const {webcrypto}=await import('node:crypto');
 const {TextEncoder,TextDecoder}=await import('node:util');
 const savedKeys=new Map(),downloaded=[],copied=[];
 const fakeDb={
  createObjectStore(){},
  close(){},
  transaction(){
   const transaction={oncomplete:null,onabort:null};
   transaction.objectStore=()=>({
    get(key){
     const req={result:savedKeys.get(key)};
     queueMicrotask(()=>{req.onsuccess?.();transaction.oncomplete?.()});
     return req;
    },
    put(value,key){
     savedKeys.set(key,value);
     const req={result:key};
     queueMicrotask(()=>{req.onsuccess?.();transaction.oncomplete?.()});
     return req;
    }
   });
   return transaction;
  }
 };
 const indexedDB={open(){
  const req={result:fakeDb};
  queueMicrotask(()=>{req.onupgradeneeded?.();req.onsuccess?.()});
  return req;
 }};
 const storeMap=new Map();
 const storage={getItem:k=>storeMap.get(k)||null,setItem:(k,v)=>storeMap.set(k,String(v)),removeItem:k=>storeMap.delete(k)};
 const ids=['driveBackupStatus','driveConnect','driveSaveNow','driveRefreshList','driveRestore',
  'driveAutoMode','driveRetention','driveClientId','driveRecoveryExport','recoveryKeyDisplay','recoveryKeyReveal','recoveryKeyCopy','recoveryKeyConfirmed','recoveryKeyStatus','driveBackupSelect','driveRecoveryInput','driveSetup','driveFolderSelect','driveFolderRefresh','driveFolderNewName','driveFolderCreate'];
 const elements=Object.fromEntries(ids.map(id=>[id,{value:'',textContent:'',disabled:false,
  classList:{toggle(){},add(){},remove(){}},addEventListener(){},setAttribute(){}}]));
 const document={
  getElementById:id=>elements[id]||null,
  addEventListener(){},
  createElement(){return {click(){},remove(){},href:'',download:''}},
  body:{appendChild(){}}
 };
 const window={addEventListener(){},indexedDB,crypto:webcrypto,
  FolioLabSaveFile:async(name,text,mime)=>{
   downloaded.push(new Blob([text],{type:mime}));
   return {native:false,saved:false};
  }};
 const navigator={clipboard:{writeText:async value=>{copied.push(value)}}};
 const blobUrls={createObjectURL(blob){downloaded.push(blob);return 'blob:test'},revokeObjectURL(){}};
 runInNewContext(source,{window,document,navigator,localStorage:storage,indexedDB,crypto:webcrypto,
  TextEncoder,TextDecoder,Blob,URL:blobUrls,btoa,atob,Date,Number,Error,JSON,
  setTimeout,clearTimeout,queueMicrotask},{filename:'drive-backup.js'});
 const mod=window.FolioDriveBackup;
 await mod.init({readData:()=>({positions:[],snapshots:[]})});
 assert.equal(elements.recoveryKeyDisplay.value,'','No secret should be present in the DOM at rest');
 assert.equal(elements.recoveryKeyDisplay.type,'password');
 await elements.recoveryKeyReveal.onclick();
 assert.match(elements.recoveryKeyDisplay.value,/^FLBK1-[a-f0-9]{64}$/);
 assert.equal(elements.recoveryKeyDisplay.type,'text');
 const revealed=elements.recoveryKeyDisplay.value;
 await elements.recoveryKeyCopy.onclick();
 assert.equal(copied.at(-1),revealed);
 await elements.recoveryKeyReveal.onclick();
 assert.equal(elements.recoveryKeyDisplay.value,'');
 assert.equal(elements.recoveryKeyDisplay.type,'password');
 await elements.driveRecoveryExport.onclick();
 assert.equal(elements.recoveryKeyConfirmed.checked,true);
 assert.equal(downloaded.length,1);
 const recoveryText=await downloaded[0].text();
 const key=recoveryText.match(/FLBK1-[0-9a-f]{64}/)?.[0];
 assert.ok(key,'recovery key was exported');
 const payload={positions:[{id:'test',name:'Confidential holding',value:1234}],snapshots:[]};
 elements.recoveryKeyConfirmed.checked=false;
 await elements.recoveryKeyConfirmed.onchange({target:elements.recoveryKeyConfirmed});
 await assert.rejects(mod.encryptLocal(payload),/bestätigen/);
 elements.recoveryKeyConfirmed.checked=true;
 await elements.recoveryKeyConfirmed.onchange({target:elements.recoveryKeyConfirmed});
 const envelope=await mod.encryptLocal(payload);
 assert.equal(envelope.format,'foliolab-drive-encrypted-v1');
 assert.ok(!JSON.stringify(envelope).includes('Confidential holding'));
 assert.deepEqual(JSON.parse(JSON.stringify(await mod.decryptLocal(envelope))),payload);
 await assert.rejects(mod.decryptLocal(envelope,'FLBK1-'+('00'.repeat(32))),/entschlüsselt/);
 assert.deepEqual(JSON.parse(JSON.stringify(await mod.decryptLocal(envelope,key))),payload);
 // A backup from a different installation may be decrypted with an external
 // recovery key, but that must not silently replace this device's key.
 const externalKey='FLBK1-'+('01'.repeat(32));
 await mod.installRecovery(externalKey);
 assert.deepEqual(JSON.parse(JSON.stringify(await mod.decryptLocal(envelope))),payload);
 const nextEnvelope=await mod.encryptLocal(payload);
 assert.deepEqual(JSON.parse(JSON.stringify(await mod.decryptLocal(nextEnvelope,key))),payload);
 await assert.rejects(mod.decryptLocal(nextEnvelope,externalKey),/entschlüsselt/);
});


test('BYOC UI documents user-owned OAuth and no shared developer credentials',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(html,/id="driveClientId"/);
 assert.match(html,/id="driveDisconnect"/);
 assert.match(html,/id="recoveryKeyConfirmed"/);
 assert.match(html,/id="driveRecoveryInput"/);
 assert.match(html,/Google Cloud/);
 assert.match(html,/https:\/\/accounts.google.com/);
 assert.match(app,/JSON\.parse\(backup\(model\)\)/);
 assert.match(app,/safeImport\(data\)/);
 assert.match(app,/downloadBackup\(\)/);
 assert.doesNotMatch(source,/api\/public-config|client_secret|refresh_token|FolioLabNativeGoogleAuth/);
});

test('OAuth client ID is optional and persisted only in local preferences',async()=>{
 const app=makeApp();
 await app.window.FolioDriveBackup.init({readData:()=>({positions:[],snapshots:[]})});
 assert.equal(app.elements.driveConnect.disabled,true);
 app.elements.driveClientId.value='123456789-abc.apps.googleusercontent.com';
 app.elements.driveClientId.onchange();
 const saved=JSON.parse(app.storage.getItem('foliolab-open-drive-backup-settings-v1'));
 assert.equal(saved.clientId,'123456789-abc.apps.googleusercontent.com');
 assert.equal(app.elements.driveConnect.disabled,false);
 assert.doesNotMatch(JSON.stringify(saved),/access_token|refresh_token/);
});
