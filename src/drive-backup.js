/* FolioLab Google Drive backup (opt-in, no backend, no refresh tokens).
 * OAuth: Google Identity Services token client; scope drive.file.
 * Encrypted: AES-GCM key in this browser's IndexedDB. A separate recovery
 * key must be downloaded to restore data after browser/device loss.
 */
(()=>{
'use strict';
const SCOPE='https://www.googleapis.com/auth/drive.file';
const PREF_KEY='foliolab-open-drive-backup-settings-v1';
const KEY_DB='foliolab-open-drive-recovery-keys-v1';
const FOLDER='FolioLab Backups';
const LABEL='foliolab-open-v1';
const FORMATS=['foliolab-drive-encrypted-v1'];
const get=id=>document.getElementById(id);
const DEFAULT={mode:'off',clientId:'',retention:3,lastBackupAt:'',recoverySaved:false,folderId:'',folderName:'',cleanupPending:false};
let prefs={...DEFAULT},accessToken='',tokenExpires=0,tokenClient=null,scriptPromise=null;
let backend=null,keyCache=null,busy=false,started=false,initialAutoDone=false;
let googleClientId='',clientConfigLoaded=false,clientConfigError='';
let recoveryRevealTimer=null;
let lastKnownBackupCount=null,vaultConfigured=false;
const iso=()=>new Date().toISOString();
const asDate=value=>Number.isFinite(Date.parse(value||''))?new Date(value):null;
const day=value=>value.toLocaleDateString('sv-SE');
const toHex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const fromHex=hex=>new Uint8Array((hex.match(/.{2}/g)||[]).map(pair=>parseInt(pair,16)));
const encodeBytes=bytes=>{let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str)};
const decodeBytes=text=>Uint8Array.from(atob(text),s=>s.charCodeAt(0));
function updateBackupOverview(){
 const el=get('driveBackupOverview');if(!el)return;
 const d=asDate(prefs.lastBackupAt);
 el.textContent='Letzte erfolgreiche Sicherung: '+(d?d.toLocaleString('de-AT'):'noch keine')
  +' · Drive-Backups: '+(lastKnownBackupCount===null?'nicht abgefragt':lastKnownBackupCount);
}
function status(message,error=false){
 const el=get('driveBackupStatus');
 if(el){el.textContent=message;el.classList.toggle('backup-error',error)}
 updateBackupOverview();
}
function loadPrefs(){
 try{
  const raw=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');
  prefs={...DEFAULT,
   mode:['off','start','daily','weekly','monthly'].includes(raw.mode)?raw.mode:'off',
   clientId:typeof raw.clientId==='string'&&validClientId(raw.clientId.trim())?raw.clientId.trim():'',
   cleanupPending:raw.cleanupPending===true,
   retention:Number.isInteger(raw.retention)&&raw.retention>=1&&raw.retention<=30?raw.retention:3,
   lastBackupAt:typeof raw.lastBackupAt==='string'?raw.lastBackupAt:'',
   recoverySaved:raw.recoverySaved===true,
   folderId:typeof raw.folderId==='string'&&/^[A-Za-z0-9_-]{10,160}$/.test(raw.folderId)?raw.folderId:'',
   folderName:typeof raw.folderName==='string'?raw.folderName.slice(0,80):''
  };
 }catch{prefs={...DEFAULT};}
}
function savePrefs(){localStorage.setItem(PREF_KEY,JSON.stringify(prefs));}
function hasToken(){return !!accessToken&&Date.now()<tokenExpires}
function updateUi(){
 const connected=hasToken();
 const connectionBadge=get('driveConnectionBadge');
 if(connectionBadge){connectionBadge.textContent=connected?'Verbunden':'Nicht verbunden';connectionBadge.dataset.connected=String(connected)}
 const save=get('driveSaveNow');
 if(save)save.disabled=!connected||busy||!vaultConfigured;
 const connect=get('driveConnect');
 if(connect){connect.disabled=busy||!googleClientId;connect.textContent=connected?'Drive erneuern':'Drive verbinden';connect.setAttribute?.('aria-label',connected?'Google Drive-Verbindung erneuern':'Mit Google Drive verbinden');connect.title=connected?'Google Drive-Verbindung erneuern':'Mit Google Drive verbinden'}
 const folderButton=get('openDriveFolderDialog');
 if(folderButton)folderButton.disabled=!connected||busy;
 const folderName=get('driveFolderCurrentName');
 if(folderName)folderName.textContent=prefs.folderName||FOLDER;
 for(const id of ['driveRefreshList','driveRestore','driveCheck','driveFolderSelect','driveFolderRefresh','driveFolderCreate']){const el=get(id);if(el)el.disabled=!connected||busy;}
}
function due(){
 if(prefs.mode==='off')return false;
 if(prefs.mode==='start')return !initialAutoDone;
 const last=asDate(prefs.lastBackupAt);if(!last)return true;
 if(prefs.mode==='daily')return day(last)!==day(new Date());
 if(prefs.mode==='weekly')return Date.now()-last.getTime()>=7*86400000;
 if(prefs.mode==='monthly')return Date.now()-last.getTime()>=30*86400000;
 return false;
}
function updateDueStatus(){
 if(!clientConfigLoaded){status('Google-Drive-Konfiguration wird geladen …');return}
 if(!googleClientId){status(clientConfigError||'Google Drive ist noch nicht eingerichtet. FolioLab funktioniert weiterhin lokal.',!!clientConfigError);return}
 if(!vaultConfigured){status('Bitte zuerst ein Backup-Passwort unter „Backup-Verschlüsselung“ einrichten.');return}
 if(prefs.mode!=='off'&&due()&&!hasToken()){status('Automatisches Backup fällig. Bitte Google Drive verbinden.');return}
 if(prefs.cleanupPending){status('Letztes Backup gespeichert · ältere Sicherungen werden bei nächster Verbindung bereinigt.');return}
 if(prefs.lastBackupAt){const d=asDate(prefs.lastBackupAt);status('Letzte Drive-Sicherung: '+(d?d.toLocaleString('de-AT'):'unbekannt')+'.');return}
 status('Bereit für die erste verschlüsselte Drive-Sicherung.');
}
function storage(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(KEY_DB,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('keys');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('Lokaler Schlüsselspeicher nicht verfügbar'));
 });
}
async function keyAction(mode,value){
 const db=await storage();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction('keys',mode==='get'?'readonly':'readwrite');
  const op=tx.objectStore('keys')[mode](...(mode==='get'?['aes']: [value,'aes']));
  op.onerror=()=>reject(op.error||Error('Schlüsselspeicher fehlgeschlagen'));
  tx.oncomplete=()=>resolve(op.result);
  tx.onabort=()=>reject(tx.error||Error('Schlüsselspeicher abgebrochen'));
 })}finally{db.close()}
}
async function getKey(create=false){
 if(keyCache)return keyCache;
 const previous=await keyAction('get');
 if(previous){keyCache=previous;return previous}
 if(!create)return null;
 const fresh=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
 await keyAction('put',fresh);
 keyCache=fresh;
 return fresh;
}
async function downloadFile(name,text){
 const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;document.body.appendChild(link);
 try{link.click()}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return {native:false};
}
function recoveryMessage(message){
 const el=get('recoveryKeyStatus');if(el)el.textContent=message;
}
function hideRecoveryKey(){
 if(recoveryRevealTimer){clearTimeout(recoveryRevealTimer);recoveryRevealTimer=null}
 const field=get('recoveryKeyDisplay');
 if(field){field.value='';field.type='password';field.setAttribute('aria-label','Verborgener Wiederherstellungsschlüssel')}
 const button=get('recoveryKeyReveal');
 if(button){button.classList.remove('is-visible');button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Wiederherstellungsschlüssel anzeigen');button.title='Schlüssel 30 Sekunden anzeigen'}
}
async function recoveryString(create=true){
 if(!window.crypto?.subtle||!window.indexedDB)throw Error('Schlüsselverwaltung erfordert HTTPS, WebCrypto und IndexedDB.');
 const key=await getKey(create);
 if(!key)throw Error('Noch kein Wiederherstellungsschlüssel vorhanden.');
 const raw=new Uint8Array(await crypto.subtle.exportKey('raw',key));
 return 'FLBK1-'+toHex(raw);
}
async function revealRecoveryKey(){
 try{
  const field=get('recoveryKeyDisplay');
  if(field.type==='text'){hideRecoveryKey();return}
  const key=await recoveryString(true);
  field.type='text';field.value=key;
  field.setAttribute('aria-label','Wiederherstellungsschlüssel sichtbar – nach 30 Sekunden automatisch verborgen');
  const button=get('recoveryKeyReveal');button.classList.add('is-visible');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','Wiederherstellungsschlüssel verbergen');button.title='Schlüssel verbergen';
  
  if(recoveryRevealTimer)clearTimeout(recoveryRevealTimer);
  recoveryRevealTimer=setTimeout(()=>{
   hideRecoveryKey();
   
  },30000);
 }catch(e){hideRecoveryKey();recoveryMessage('Schlüssel konnte nicht angezeigt werden: '+e.message)}
}
async function copyRecoveryKey(){
 try{
  const value=await recoveryString(true);
  if(!navigator.clipboard?.writeText)throw Error('Zwischenablage nicht verfügbar');
  await navigator.clipboard.writeText(value);
  recoveryMessage('Schlüssel kopiert. Im Passwortmanager speichern und unten bestätigen. Zwischenablage anschließend überschreiben.');
 }catch(e){
  recoveryMessage('Kopieren nicht möglich. „Kurz anzeigen“ wählen und den Schlüssel manuell kopieren.');
 }
}
async function confirmRecoverySaved(checked){
 if(!checked){prefs.recoverySaved=false;savePrefs();updateUi();updateDueStatus();return}
 try{
  await recoveryString(false);
  prefs.recoverySaved=true;
  savePrefs();updateUi();updateDueStatus();
  recoveryMessage('Sichere Aufbewahrung bestätigt. Verschlüsselte Backups sind freigeschaltet.');
 }catch(e){
  prefs.recoverySaved=false;
  get('recoveryKeyConfirmed').checked=false;
  savePrefs();updateUi();
  recoveryMessage('Bitte zuerst den Schlüssel anzeigen oder kopieren.');
 }
}
async function exportRecovery(){
 try{
  const key=await recoveryString(true);
  const exported=await downloadFile('FolioLab-Wiederherstellungsschluessel.txt',
   'FolioLab · Wiederherstellungsschlüssel\n\n'+key+'\n\nSicher getrennt von Google Drive aufbewahren. Nicht veröffentlichen.\n');
  // A download trigger is not proof that the browser saved the key: require the user's explicit confirmation.
  recoveryMessage('Schlüsseldatei-Download gestartet. Bitte Ablage prüfen und anschließend die sichere Aufbewahrung bestätigen.');
 }catch(e){recoveryMessage('Schlüsseldatei fehlgeschlagen: '+e.message)}
}
async function importRecovery(secret){
 const normalized=String(secret||'').trim().replace(/\s/g,'');
 if(!/^FLBK1-[0-9a-fA-F]{64}$/.test(normalized))throw Error('Ungültiger Wiederherstellungsschlüssel.');
 const fresh=await crypto.subtle.importKey('raw',fromHex(normalized.slice(6)),{name:'AES-GCM'},true,['encrypt','decrypt']);
 // Importing a backup must never destroy a different existing AES key:
 // otherwise older Drive backups could become permanently unreadable.
 const existing=await getKey(false);
 if(!existing){
  await keyAction('put',fresh);keyCache=fresh;
 }
 prefs.recoverySaved=true;savePrefs();
 const confirm=get('recoveryKeyConfirmed');if(confirm)confirm.checked=true;
 updateUi();updateDueStatus();
 const input=get('driveRecoveryInput');if(input)input.value='';
 return fresh;
}
async function encrypt(payload){
 const key=await getKey(false);if(!key)throw Error('Wiederherstellungsschlüssel zuerst sichern.');
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const plaintext=new TextEncoder().encode(JSON.stringify(payload));
 const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('FolioLab Backup v1')},key,plaintext));
 return JSON.stringify({format:FORMATS[0],createdAt:iso(),iv:encodeBytes(iv),ciphertext:encodeBytes(ciphertext)});
}
async function decrypt(json,secret){
 if(!json||!FORMATS.includes(json.format)||typeof json.iv!=='string'||typeof json.ciphertext!=='string')throw Error('Unbekanntes oder ungültiges Backupformat.');
 let key=secret?await crypto.subtle.importKey('raw',fromHex(String(secret).replace(/\s/g,'').replace(/^FLBK1-/i,'')),{name:'AES-GCM'},true,['encrypt','decrypt']):await getKey(false);
 if(!key)throw Error('Auf diesem Gerät fehlt der Schlüssel. Bitte unten den Wiederherstellungsschlüssel eingeben.');
 try{
  const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:decodeBytes(json.iv),additionalData:new TextEncoder().encode('FolioLab Backup v1')},key,decodeBytes(json.ciphertext));
  return JSON.parse(new TextDecoder().decode(bytes));
 }catch{throw Error('Backup konnte nicht entschlüsselt werden. Prüfe den Wiederherstellungsschlüssel.')}
}
async function loadGoogle(){
 if(window.google?.accounts?.oauth2)return;
 if(scriptPromise)return scriptPromise;
 scriptPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://accounts.google.com/gsi/client';script.async=true;
  script.onload=()=>window.google?.accounts?.oauth2?resolve():reject(Error('Google-Anmeldung wurde nicht geladen.'));
  script.onerror=()=>reject(Error('Google-Anmeldung blockiert oder offline.'));
  document.head.appendChild(script);
 }).catch(e=>{scriptPromise=null;throw e});
 return scriptPromise;
}
function validClientId(id){return /^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(id)}
async function loadPublicConfig(){
 googleClientId=prefs.clientId||'';
 clientConfigLoaded=true;clientConfigError='';
 if(googleClientId)void loadGoogle().catch(()=>{});
 updateUi();updateDueStatus();
}
async function disconnect(){
 if(accessToken&&window.google?.accounts?.oauth2?.revoke){
  try{google.accounts.oauth2.revoke(accessToken,()=>{})}catch{}
 }
 accessToken='';tokenExpires=0;prefs.mode='off';savePrefs();
 const mode=get('driveAutoMode');if(mode)mode.value='off';
 updateUi();status('Drive getrennt. Vorhandene Backups bleiben in deinem Google Drive.');
}
async function connect(){
 if(busy)return;
 if(!clientConfigLoaded||!googleClientId)await loadPublicConfig();
 if(!googleClientId)return updateDueStatus();
 try{await loadGoogle()}catch(e){return status(e.message,true)}
 try{
  if(!tokenClient){
   tokenClient=google.accounts.oauth2.initTokenClient({
    client_id:googleClientId,scope:SCOPE,callback:()=>{},error_callback:()=>{}
   });
  }
  status('Google-Kontofreigabe wird angefragt …');
  await new Promise((resolve,reject)=>{
   let settled=false;
   const timeout=setTimeout(()=>finish(Error('Anmeldung nicht abgeschlossen. Bitte erneut verbinden.')),90000);
   function finish(error,response){
    if(settled)return;settled=true;clearTimeout(timeout);
    if(error)reject(error);else resolve(response);
   }
   tokenClient.callback=resp=>resp?.access_token?finish(null,resp):finish(Error('Google hat die Freigabe nicht erteilt.'));
   tokenClient.error_callback=err=>finish(Error(err?.type==='popup_closed'?'Anmeldefenster geschlossen.':'Google-Anmeldung fehlgeschlagen. Browser-Popups prüfen.'));
   try{tokenClient.requestAccessToken({prompt:prefs.lastBackupAt?'':'consent'});}catch(e){finish(e)}
  }).then(response=>{
   accessToken=response.access_token;
   tokenExpires=Date.now()+Math.max(30,Number(response.expires_in||3600)-90)*1000;
  });
  updateUi();
  await refreshFolders();
  await refreshList();
  if((prefs.mode!=='off'&&due())||prefs.cleanupPending)await maybeAuto();
  else updateDueStatus();
 }catch(e){status(e.message,true);updateUi()}
}
async function api(path,options={}){
 if(!hasToken()){accessToken='';updateUi();throw Error('Google-Anmeldung abgelaufen. Bitte erneut verbinden.')}
 const method=String(options.method||'GET').toUpperCase();
 // Retry only idempotent requests. Never repeat a POST upload after an
 // uncertain response: that could create a duplicate backup.
 const maxAttempts=(method==='GET'||method==='DELETE')?3:1;
 for(let attempt=0;attempt<maxAttempts;attempt++){
  let res;
  try{
   res=await fetch('https://www.googleapis.com/'+path,{...options,headers:{...(options.headers||{}),Authorization:'Bearer '+accessToken}});
  }catch(error){
   if(attempt+1<maxAttempts&&hasToken()){
    await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));
    continue;
   }
   throw error;
  }
  if(res.status===401){accessToken='';updateUi();throw Error('Google-Anmeldung abgelaufen. Bitte erneut verbinden.')}
  // Deletion may have succeeded even if the network dropped its response.
  if(method==='DELETE'&&res.status===404)return res;
  if(res.ok)return res;
  if(attempt+1<maxAttempts&&(res.status===429||(res.status>=500&&res.status<600))){
   await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));
   continue;
  }
  let reason='';try{const e=await res.json();reason=String(e.error?.message||'').slice(0,160)}catch{}
  throw Error('Google Drive HTTP '+res.status+(reason?': '+reason:''));
 }
}
async function listQuery(q,fields,limit=1000){
 const result=[];let pageToken='';
 do{
  const params=new URLSearchParams({q,fields:'nextPageToken,files('+fields+')',pageSize:String(Math.min(1000,limit)),orderBy:'createdTime desc',spaces:'drive'});
  if(pageToken)params.set('pageToken',pageToken);
  const json=await (await api('drive/v3/files?'+params.toString())).json();
  result.push(...(json.files||[]));pageToken=json.nextPageToken||'';
 }while(pageToken&&result.length<5000);
 if(pageToken)throw Error('Zu viele Backups für eine sichere automatische Bereinigung.');
 return result;
}
// Only folders explicitly created by FolioLab are offered here. The narrow
// drive.file scope does not permit enumerating arbitrary folders in Drive.
async function managedFolders(){
 const q="mimeType = 'application/vnd.google-apps.folder' and trashed = false";
 const rows=await listQuery(q,'id,name,createdTime,appProperties');
 return rows.filter(f=>/^[A-Za-z0-9_-]{10,160}$/.test(f.id||'') &&
  (f.appProperties?.foliolabFolder===LABEL||f.name===FOLDER))
  .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'de'));
}
async function createManagedFolder(name){
 const clean=String(name||'').trim();
 if(!clean||clean.length>80||/[\\/]/.test(clean))throw Error('Bitte einen Ordnernamen bis 80 Zeichen ohne Schrägstriche eingeben.');
 const res=await api('drive/v3/files?fields=id,name,mimeType',{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({name:clean,mimeType:'application/vnd.google-apps.folder',appProperties:{foliolabFolder:LABEL}})
 });
 const created=await res.json();
 if(!created.id||!(/^[A-Za-z0-9_-]{10,160}$/.test(created.id)))throw Error('Drive hat die Ordnererstellung nicht bestätigt.');
 return created;
}
async function folder(create=false){
 if(prefs.folderId){
  // Never silently fall back to a different folder: this would hide backups.
  const response=await api('drive/v3/files/'+encodeURIComponent(prefs.folderId)+'?fields=id,name,mimeType,trashed');
  const chosen=await response.json();
  if(chosen.trashed||chosen.mimeType!=='application/vnd.google-apps.folder')throw Error('Ausgewählter Backup-Ordner nicht verfügbar.');
  return chosen.id;
 }
 const available=await managedFolders();
 const existing=available.find(f=>f.name===FOLDER);
 if(existing)return existing.id;
 if(!create)return null;
 const created=await createManagedFolder(FOLDER);
 return created.id;
}
async function refreshFolders(){
 if(!hasToken())return;
 const rows=await managedFolders();
 const select=get('driveFolderSelect'),value=prefs.folderId||'';
 select.replaceChildren();
 select.add(new Option('Standard · '+FOLDER,''));
 for(const row of rows)select.add(new Option(row.name,row.id));
 if(value&&!rows.some(f=>f.id===value)){
  select.add(new Option('Nicht verfügbar · '+(prefs.folderName||'früherer Ordner'),value));
 }
 select.value=value;
 updateUi();
 return rows;
}
async function onFolderChanged(){
 if(busy||!hasToken())return;
 const select=get('driveFolderSelect');
 const next=select.value;
 if(next===prefs.folderId)return;
 const selected=Array.from(select.options).find(option=>option.value===next);
 if(next&&(!selected||selected.text.startsWith('Nicht verfügbar'))){
  select.value=prefs.folderId;return status('Bitte einen verfügbaren FolioLab-Ordner auswählen.',true);
 }
 prefs.folderId=next;prefs.folderName=next?selected.text:FOLDER;
 lastKnownBackupCount=null;
 prefs.cleanupPending=false;prefs.lastBackupAt='';
 savePrefs();
 await refreshList();
 updateDueStatus();
 if(due())await maybeAuto();
}
async function createFolderFromInput(){
 if(busy||!hasToken())return;
 busy=true;updateUi();status('Ordner wird in Google Drive erstellt …');
 try{
  const name=get('driveFolderNewName').value.trim();
  const created=await createManagedFolder(name);
  prefs.folderId=created.id;prefs.folderName=created.name;lastKnownBackupCount=null;prefs.cleanupPending=false;prefs.lastBackupAt='';
  savePrefs();
  get('driveFolderNewName').value='';
  await refreshFolders();
  await refreshList();
  status('Backup-Ordner „'+created.name+'“ erstellt und ausgewählt.');
  get('driveFolderDialog')?.close();
 }catch(e){status('Ordner konnte nicht erstellt werden: '+e.message,true)}
 finally{busy=false;updateUi()}
}
async function reloadFolders(){
 if(!hasToken()||busy)return;
 busy=true;updateUi();
 try{await refreshFolders();await refreshList()}
 catch(e){status('Ordnerliste: '+e.message,true)}
 finally{busy=false;updateUi()}
}
async function filesInFolder(id){
 if(!id)return [];
 const q="'"+id.replace(/[^A-Za-z0-9_-]/g,'')+"' in parents and trashed = false and appProperties has { key='foliolabBackup' and value='"+LABEL+"' }";
 const items=await listQuery(q,'id,name,createdTime,size');
 return items.filter(f=>/^FolioLab-\d{4}-\d{2}-\d{2}T[\d-]+Z\.encrypted\.json$/.test(f.name||'')).sort((a,b)=>String(b.createdTime||'').localeCompare(String(a.createdTime||'')));
}
async function refreshList(){
 if(!hasToken())return;
 try{
  const dir=await folder(false);
  const list=await filesInFolder(dir);
  const select=get('driveBackupSelect');select.replaceChildren();
  if(!list.length){
   const empty=new Option('Noch keine Drive-Backups','');
   select.add(empty);
  }else for(const file of list){
   const d=asDate(file.createdTime);
   select.add(new Option((d?d.toLocaleString('de-AT'):file.name)+' · '+file.name,file.id));
  }
  lastKnownBackupCount=list.length;
  const message=list.length+' verschlüsselte Backups in „'+(prefs.folderName||FOLDER)+'“.';
  status(message);
  updateUi();
  return list;
 }catch(e){status('Drive-Liste: '+e.message,true);return [];}
}
async function createFile(parent,encrypted){
 const stamp=iso().replace(/[:.]/g,'-');
 const name='FolioLab-'+stamp+'.encrypted.json';
 const metadata={name,mimeType:'application/json',parents:[parent],appProperties:{foliolabBackup:LABEL}};
 const boundary='foliolab'+Math.random().toString(36).slice(2);
 const body=new Blob(['--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',JSON.stringify(metadata),
  '\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n',encrypted,'\r\n--'+boundary+'--'],
  {type:'multipart/related; boundary='+boundary});
 const res=await api('upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime',
  {method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
 const file=await res.json();if(!file.id)throw Error('Drive hat den Upload nicht bestätigt.');
 return file;
}
async function backup(automatic=false){
 if(busy)return;
 if(!hasToken()){updateDueStatus();return}
 if(!vaultConfigured){updateDueStatus();return}
 busy=true;updateUi();status('Verschlüsseltes Backup wird erstellt …');
 try{
  const data=backend.readData();
  if(!Array.isArray(data.positions)||!Array.isArray(data.snapshots))throw Error('Lokale Bestände sind nicht lesbar.');
  if(data.positions.length===0&&data.providers.length===0&&data.accounts.length===0)throw Error('Portfolio ist leer. Vorhandene Drive-Backups bleiben erhalten.');
  const encrypted=await backend.encryptPasswordBackup(JSON.stringify({kind:'FolioLab',data,exportedAt:iso()}));
  const dir=await folder(true);
  const uploaded=await createFile(dir,encrypted);
  prefs.lastBackupAt=iso();savePrefs();
  backend.onBackedUp?.();
  if(prefs.mode==='start')initialAutoDone=true;
  let removed=0,cleanupError='',verified=false;
  try{
   const saved=await filesInFolder(dir);
   if(!saved.some(f=>f.id===uploaded.id))throw Error('Hochgeladenes Backup fehlt in der Dateiliste; ältere Dateien bleiben erhalten.');
   verified=true;
   for(const old of saved.slice(prefs.retention)){
    await api('drive/v3/files/'+encodeURIComponent(old.id),{method:'DELETE'});
    removed++;
   }
  }catch(e){cleanupError=e.message}
  // Keep the upload independently of any cleanup/network failure.
  // Automatic retries of cleanup require a verified newly-uploaded backup.
  prefs.cleanupPending=Boolean(cleanupError&&verified);
  savePrefs();
  await refreshList();
  status((automatic?'Automatische Sicherung':'Backup')+' erfolgreich · '+new Date(prefs.lastBackupAt).toLocaleString('de-AT')+
    (removed?' · '+removed+' alte gelöscht':'')+
    (cleanupError?(verified?' · Weitere alte Backups werden später bereinigt':' · Bereinigung zur Sicherheit ausgesetzt'):''),
    false);
 }catch(e){status('Backup fehlgeschlagen: '+e.message,true)}
 finally{busy=false;updateUi()}
}
async function maybeAuto(){
 if(!backend||(!due()&&!prefs.cleanupPending))return;
 if(!hasToken()){updateDueStatus();return}
 // If the last cleanup failed, retry without uploading a duplicate backup.
 if(prefs.cleanupPending&&!busy)await trimExisting();
 if(!due()||(prefs.mode==='start'&&initialAutoDone))return;
 await backup(true);
}
async function inspectSelectedDriveBackup(){
 const id=get('driveBackupSelect').value;
 if(!id)throw Error('Bitte zuerst ein Drive-Backup auswählen.');
 const res=await api('drive/v3/files/'+encodeURIComponent(id)+'?alt=media');
 const text=await res.text();
 if(text.length>15000000)throw Error('Backup zu groß.');
 const envelope=JSON.parse(text),secret=get('driveRecoveryInput').value.trim();
 let payload,legacy=false;
 if(envelope.format==='foliolab-open-encrypted-v2'){
  if(secret.length<10)throw Error('Bitte das Backup-Passwort eingeben.');
  payload=JSON.parse(await backend.decryptPasswordBackup(envelope,secret));
 }else if(FORMATS.includes(envelope.format)){
  legacy=true;
  if(secret&&!/^FLBK1-[a-fA-F0-9]{64}$/.test(secret.replace(/\\s/g,'')))throw Error('Für ältere Backups ist der FLBK1-Schlüssel erforderlich.');
  payload=await decrypt(envelope,secret||null);
 }else throw Error('Unbekanntes Drive-Backupformat.');
 if(payload.kind!=='FolioLab'||!payload.data)throw Error('Backupinhalt ungültig.');
 const data=backend.validateData(payload.data,{strict:true});
 return {data,secret,legacy,envelope};
}
function backupDescription(data){
 const dates=data.snapshots.map(s=>s.date).sort();
 return data.positions.length+' Positionen · '+data.snapshots.length+' Stichtage'+(dates.length?' · '+dates[0]+' bis '+dates.at(-1):'');
}
async function checkSelectedDriveBackup(){
 if(!hasToken())return updateDueStatus();
 if(busy)return;
 busy=true;updateUi();status('Ausgewähltes Backup wird geprüft …');
 try{
  const {data}=await inspectSelectedDriveBackup();
  status('✓ Drive-Backup geprüft (keine Daten verändert): '+backupDescription(data)+'.');
 }catch(e){status('Backup-Prüfung fehlgeschlagen: '+e.message,true)}
 finally{get('driveRecoveryInput').value='';const proxy=get('restoreKeyProxy');if(proxy)proxy.value='';busy=false;updateUi()}
}
async function restore(){
 if(!hasToken())return updateDueStatus();
 if(!get('driveBackupSelect').value)return status('Bitte zuerst ein Drive-Backup auswählen.',true);
 if(busy)return;
 busy=true;updateUi();status('Backup wird heruntergeladen und entschlüsselt …');
 try{
  const {data:next,secret,legacy,envelope}=await inspectSelectedDriveBackup();
  if(!confirm('Dieses Backup mit '+next.positions.length+' Positionen und '+next.snapshots.length+' Stichtagen wiederherstellen? Deine aktuellen lokalen Daten werden ersetzt.'))return status('Wiederherstellung abgebrochen.');
  await backend.restoreData(next);
  if(legacy&&secret)await importRecovery(secret);
  if(!legacy)await backend.adoptPasswordVault(envelope,secret);
  get('restoreBackupDialog')?.close();
  status('Drive-Backup wiederhergestellt. '+next.positions.length+' Positionen geladen. Vorheriger Stand lokal gesichert.');
 }catch(e){status('Wiederherstellung fehlgeschlagen: '+e.message,true)}
 finally{get('driveRecoveryInput').value='';const proxy=get('restoreKeyProxy');if(proxy)proxy.value='';busy=false;updateUi()}
}
async function trimExisting(){
 if(!hasToken()||busy)return;
 busy=true;updateUi();
 try{
  const dir=await folder(false);
  if(!dir){prefs.cleanupPending=false;savePrefs();status('Noch keine Drive-Backups vorhanden.');return}
  const items=await filesInFolder(dir);
  let removed=0;
  for(const item of items.slice(prefs.retention)){
   await api('drive/v3/files/'+encodeURIComponent(item.id),{method:'DELETE'});
   removed++;
  }
  prefs.cleanupPending=false;savePrefs();
  await refreshList();
  status(removed?removed+' ältere Drive-Backups entfernt. '+prefs.retention+' neueste bleiben erhalten.':'Aufbewahrungslimit eingehalten · maximal '+prefs.retention+' Backups.');
 }catch(e){
  prefs.cleanupPending=true;savePrefs();
  status('Bereinigung noch nicht abgeschlossen · wird bei nächster Verbindung erneut versucht.');
 }finally{busy=false;updateUi()}
}
function persistControls(){
 const oldRetention=prefs.retention;
 const mode=get('driveAutoMode').value;
 const number=Number(get('driveRetention').value);
 if(!['off','start','daily','weekly','monthly'].includes(mode))return status('Ungültiges Sicherungsintervall.',true);
 if(!Number.isInteger(number)||number<1||number>30){get('driveRetention').value=String(prefs.retention);return status('Bitte 1 bis 30 Drive-Backups wählen.',true)}
 prefs.mode=mode;prefs.retention=number;
 savePrefs();updateUi();updateDueStatus();
 if(hasToken()){
  if(number<oldRetention)trimExisting().then(()=>maybeAuto());
  else maybeAuto();
 }
}
async function init(app){
 backend=app;loadPrefs();
 try{vaultConfigured=await backend.hasPasswordVault()}catch{vaultConfigured=false}
 const idInput=get('driveClientId');
 if(idInput){
  idInput.value=prefs.clientId;
  idInput.onchange=()=>{
   const id=idInput.value.trim();
   if(id&&!validClientId(id)){status('Ungültige Client-ID. Kopiere die vollständige OAuth-Client-ID aus Google Cloud.',true);return}
   if(id===prefs.clientId)return;
   prefs.clientId=id;prefs.folderId='';prefs.folderName='';prefs.lastBackupAt='';prefs.cleanupPending=false;lastKnownBackupCount=null;
   savePrefs();googleClientId=id;tokenClient=null;accessToken='';tokenExpires=0;
   if(id)void loadGoogle().catch(()=>{});
   updateUi();updateDueStatus();
  };
 }
 const disconnectButton=get('driveDisconnect');if(disconnectButton)disconnectButton.onclick=disconnect;
 get('driveAutoMode').value=prefs.mode;
 get('driveRetention').value=String(prefs.retention);
 get('driveAutoMode').onchange=persistControls;
 get('driveRetention').onchange=persistControls;
 get('driveConnect').onclick=connect;
 get('driveSaveNow').onclick=()=>backup(false);
 get('driveRefreshList').onclick=refreshList;
 const confirmFolder=get('confirmDriveFolder');
 if(confirmFolder)confirmFolder.onclick=async()=>{await onFolderChanged();get('driveFolderDialog')?.close();};
 const openFolderDialog=get('openDriveFolderDialog');
 if(openFolderDialog)openFolderDialog.onclick=async()=>{
  if(!hasToken()||busy)return;
  get('driveFolderDialog')?.showModal();
  await reloadFolders();
 };
 get('driveFolderRefresh').onclick=reloadFolders;
 get('driveFolderCreate').onclick=createFolderFromInput;
 get('driveRestore').onclick=restore;
 const checkButton=get('driveCheck');if(checkButton)checkButton.onclick=checkSelectedDriveBackup;
 window.addEventListener('online',()=>{if(backend)void maybeAuto()});
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&backend){void maybeAuto()}
 });
 updateUi();updateDueStatus();
 await loadPublicConfig();
 started=true;
 // No silent browser authorization: Drive is user-initiated.
}
// The local download uses the exact same authenticated-encryption format as
// Google Drive. No OAuth or Drive connection is required for local backups.
async function encryptLocal(data){
 if(!prefs.recoverySaved)throw Error('Bitte den Wiederherstellungsschlüssel sicher ablegen und bestätigen.');
 if(!data||!Array.isArray(data.positions)||!Array.isArray(data.snapshots))throw Error('Lokale Portfoliodaten sind ungültig.');
 return JSON.parse(await encrypt({kind:'FolioLab',data,exportedAt:iso()}));
}
async function decryptLocal(envelope,secret=''){
 const normalized=String(secret||'').trim().replace(/\s/g,'');
 if(normalized&&!/^FLBK1-[a-fA-F0-9]{64}$/.test(normalized))throw Error('Ungültiger Wiederherstellungsschlüssel.');
 const payload=await decrypt(envelope,normalized||null);
 if(payload.kind!=='FolioLab'||!payload.data)throw Error('Die verschlüsselte Datei enthält kein gültiges FolioLab-Backup.');
 return payload.data;
}
window.FolioDriveBackup={init,checkDue:maybeAuto,refreshVaultStatus:async()=>{
  vaultConfigured=await backend.hasPasswordVault();updateUi();updateDueStatus();
},decryptLegacyLocal:decryptLocal,installRecovery:importRecovery};
})();
