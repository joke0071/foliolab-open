import {preflightBackup,LEGACY_BACKUP_DATA_CHARS} from './backup-limits.js';
/**
 * Optional encrypted backups. AES-256-GCM + PBKDF2-HMAC-SHA-256.
 * Passwords and derived keys exist only in memory, never in portfolio settings.
 */
const format='foliolab-open-encrypted-v1';
const encoder=new TextEncoder(),decoder=new TextDecoder();
const b64=bytes=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function keyFromPassword(password,salt){
  if(typeof password!=='string'||password.length<10)throw Error('Bitte ein Passwort mit mindestens 10 Zeichen verwenden.');
  const base=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
/** @returns {Promise<string>} */
export async function encryptBackup(plain,password){
  const raw=preflightBackup(plain,'v1');
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await keyFromPassword(password,salt);
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,raw);
  return JSON.stringify({format,salt:b64(salt),iv:b64(iv),data:b64(new Uint8Array(data))},null,2);
}
export function isEncryptedBackup(raw){return raw?.format===format;}
export async function decryptBackup(raw,password){
  if(!isEncryptedBackup(raw)||typeof raw.salt!=='string'||typeof raw.iv!=='string'||typeof raw.data!=='string')throw Error('Verschlüsseltes Backup ungültig.');
  if(raw.data.length>LEGACY_BACKUP_DATA_CHARS)throw Error('Verschlüsseltes Backup ist zu groß.');
  let salt,iv,bytes;try{salt=unb64(raw.salt);iv=unb64(raw.iv);bytes=unb64(raw.data);}catch{throw Error('Verschlüsseltes Backup beschädigt.');}
  if(salt.length!==16||iv.length!==12)throw Error('Ungültiges Verschlüsselungsformat.');
  const key=await keyFromPassword(password,salt);
  try{return decoder.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,bytes));}
  catch{throw Error('Entschlüsselung fehlgeschlagen – Passwort oder Datei prüfen.');}
}
