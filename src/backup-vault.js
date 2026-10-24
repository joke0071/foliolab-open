/**
 * FolioLab Open – unified local/Drive backup vault.
 * No password is persisted. A device-local, non-extractable AES-GCM CryptoKey
 * enables backups during an open session; each backup carries its own
 * password-wrapped copy of the 256-bit data key for cross-device recovery.
 */
export const BACKUP_V2='foliolab-open-encrypted-v2';
const DB_NAME='foliolab-open-backup-password-v1',STORE='vault',KEY='active';
const E=new TextEncoder(),D=new TextDecoder(),AAD=E.encode('FolioLab Open password backup v2');
const b64=b=>{let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(s)};
function bytes(s,min,max){
 if(typeof s!=='string'||s.length>Math.ceil(max*4/3)+8||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error('Backup enthält ungültige Kryptodaten.');
 let b;try{b=Uint8Array.from(atob(s),c=>c.charCodeAt(0))}catch{throw Error('Backup enthält beschädigte Kryptodaten.')}
 if(b.length<min||b.length>max)throw Error('Backup enthält ungültige Schlüssellängen.');
 return b;
}
const iv=()=>crypto.getRandomValues(new Uint8Array(12));
async function passwordKey(password,salt){
 if(typeof password!=='string'||password.length<10)throw Error('Backup-Passwort muss mindestens 10 Zeichen haben.');
 const base=await crypto.subtle.importKey('raw',E.encode(password),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function wrapRaw(raw,password){
 const salt=crypto.getRandomValues(new Uint8Array(16)),nonce=iv();
 const key=await passwordKey(password,salt);
 const data=await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:AAD},key,raw);
 return {salt:b64(salt),iv:b64(nonce),data:b64(new Uint8Array(data))};
}
async function unwrapRaw(wrap,password){
 if(!wrap||typeof wrap!=='object')throw Error('Passwortschutz im Backup fehlt.');
 const salt=bytes(wrap.salt,16,16),nonce=bytes(wrap.iv,12,12),sealed=bytes(wrap.data,48,48);
 const key=await passwordKey(password,salt);
 try{
  const raw=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:nonce,additionalData:AAD},key,sealed));
  if(raw.length!==32)throw Error('Ungültiger Schlüssel.');
  return raw;
 }catch{throw Error('Backup-Passwort falsch oder verschlüsselte Datei beschädigt.')}
}
async function importDataKey(raw){return crypto.subtle.importKey('raw',raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
function openDB(){
 if(!globalThis.indexedDB)throw Error('Für automatische Backups wird IndexedDB benötigt.');
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('Backup-Schlüsselspeicher nicht verfügbar.'));
 });
}
async function record(value){
 const db=await openDB();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,value===undefined?'readonly':'readwrite'),store=tx.objectStore(STORE);
  const request=value===undefined?store.get(KEY):store.put(value,KEY);
  let result;
  request.onsuccess=()=>{result=request.result};
  request.onerror=()=>reject(request.error||Error('Schlüssel konnte nicht gelesen werden.'));
  tx.oncomplete=()=>resolve(result);
  tx.onabort=()=>reject(tx.error||Error('Schlüssel konnte nicht gespeichert werden.'));
  tx.onerror=()=>reject(tx.error||Error('Schlüsselzugriff fehlgeschlagen.'));
 })}finally{db.close()}
}
const validRecord=v=>Boolean(v?.version===2&&v.key&&v.wrap&&typeof v.keyId==='string');
export async function hasBackupPassword(){return validRecord(await record())}
export async function configureBackupPassword(password,confirmation,previousPassword=''){
 if(password!==confirmation)throw Error('Die beiden Backup-Passwörter stimmen nicht überein.');
 if(typeof password!=='string'||password.length<10)throw Error('Bitte ein Passwort mit mindestens 10 Zeichen verwenden.');
 const previous=await record();
 let raw;
 if(validRecord(previous)){
  if(!previousPassword)throw Error('Zum Ändern das bisherige Backup-Passwort angeben.');
  raw=await unwrapRaw(previous.wrap,previousPassword);
 }else raw=crypto.getRandomValues(new Uint8Array(32));
 try{
  const wrap=await wrapRaw(raw,password);
  const key=await importDataKey(raw);
  const keyId=validRecord(previous)?previous.keyId:b64(crypto.getRandomValues(new Uint8Array(16)));
  await record({version:2,key,keyId,wrap});
  return {changed:Boolean(validRecord(previous))};
 }finally{raw.fill(0)}
}
export function isPasswordBackup(envelope){return envelope?.format===BACKUP_V2}
function validateEnvelope(envelope){
 if(!isPasswordBackup(envelope)||typeof envelope.keyId!=='string'||envelope.keyId.length>64||
    typeof envelope.wrap!=='object')throw Error('Unbekanntes Backupformat.');
 return {nonce:bytes(envelope.iv,12,12),ciphertext:bytes(envelope.data,16,15000000)};
}
export async function encryptWithBackupPassword(plain){
 const saved=await record();
 if(!validRecord(saved))throw Error('Bitte zuerst unter „Backup-Verschlüsselung“ ein gemeinsames Backup-Passwort einrichten.');
 if(typeof plain!=='string'||plain.length>10000000)throw Error('Backup ist zu groß.');
 const nonce=iv();
 const ciphertext=new Uint8Array(await crypto.subtle.encrypt(
  {name:'AES-GCM',iv:nonce,additionalData:AAD},saved.key,E.encode(plain)));
 return JSON.stringify({format:BACKUP_V2,keyId:saved.keyId,wrap:saved.wrap,iv:b64(nonce),data:b64(ciphertext),createdAt:new Date().toISOString()});
}
export async function decryptPasswordBackup(envelope,password){
 const {nonce,ciphertext}=validateEnvelope(envelope);
 const raw=await unwrapRaw(envelope.wrap,password);
 try{
  const key=await importDataKey(raw);
  try{return D.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:nonce,additionalData:AAD},key,ciphertext))}
  catch{throw Error('Backup ist beschädigt oder kann nicht entschlüsselt werden.')}
 }finally{raw.fill(0)}
}
/** Adopt a verified backup's key ONLY on a device without a vault. */
export async function adoptBackupPassword(envelope,password){
 if(await hasBackupPassword())return false;
 // Decrypt/authenticate payload before storing any local recovery material.
 await decryptPasswordBackup(envelope,password);
 const raw=await unwrapRaw(envelope.wrap,password);
 try{
  if(await hasBackupPassword())return false;
  const key=await importDataKey(raw);
  await record({version:2,key,keyId:envelope.keyId,wrap:envelope.wrap});
  return true;
 }finally{raw.fill(0)}
}
