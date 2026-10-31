/* Optional encrypted Google Drive backup with user-owned OAuth (drive.file).
 * Only one user password is needed to restore on a different device.
 * Session credentials and device keys never enter a backup.
 */
(()=>{
'use strict';
const SCOPE='https://www.googleapis.com/auth/drive.file';
const PREF_KEY='foliolab-open-drive-backup-settings-v1';
const FOLDER='FolioLab Backups';
const LABEL='foliolab-open-v1';
const NEW_BACKUP_LABEL='foliolab-open-v3';
const get=id=>document.getElementById(id);
const DEFAULT={mode:'off',clientId:'',retention:3,lastBackupAt:'',folderId:'',folderName:'',cleanupPending:false};
let prefs={...DEFAULT},accessToken='',tokenExpires=0,tokenClient=null,scriptPromise=null;
let backend=null,busy=false,started=false,initialAutoDone=false;
let googleClientId='',clientConfigLoaded=false,clientConfigError='';
let lastKnownBackupCount=null,vaultConfigured=false,connecting=false,tokenTimer=null,statusMessage='',statusError=false;
function getStatus(){return {configured:Boolean(googleClientId),connected:hasToken(),connecting,busy,due:due(),vaultConfigured,lastBackupAt:asDate(prefs.lastBackupAt)?prefs.lastBackupAt:'',offline:window.navigator?.onLine===false,message:statusMessage,error:statusError};}
function announceStatus(){window.dispatchEvent?.(new CustomEvent('foliolab-drive-status'));}
function expireTokenAtDeadline(){clearTimeout(tokenTimer);tokenTimer=setTimeout(()=>{accessToken='';updateUi();updateDueStatus();},Math.max(0,tokenExpires-Date.now()));tokenTimer.unref?.();}
const iso=()=>new Date().toISOString();
const asDate=value=>Number.isFinite(Date.parse(value||''))?new Date(value):null;
const day=value=>value.toLocaleDateString('sv-SE');
function updateBackupOverview(){
 const el=get('driveBackupOverview');if(!el)return;
 const d=asDate(prefs.lastBackupAt);
 const last=d?'Letzte Sicherung: '+d.toLocaleString('de-AT'):'Noch keine Sicherung';
 const count=lastKnownBackupCount===null?'':' · '+lastKnownBackupCount+' Backup'+(lastKnownBackupCount===1?'':'s');
 el.textContent=last+count;
}
function status(message,error=false){
 statusMessage=String(message||'');statusError=error;
 const el=get('driveBackupStatus');
 if(el){el.textContent=message;el.hidden=!message;el.classList.toggle('backup-error',error)}
 updateBackupOverview();announceStatus();
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
 const disconnectButton=get('driveDisconnect');
 if(disconnectButton){disconnectButton.hidden=!connected;disconnectButton.disabled=busy||connecting;}
 const save=get('driveSaveNow');
 if(save)save.disabled=!connected||busy||connecting||!vaultConfigured;
 const connect=get('driveConnect');
 if(connect){connect.disabled=busy||connecting||!googleClientId;connect.textContent=connected?'Drive erneuern':'Drive verbinden';connect.setAttribute?.('aria-label',connected?'Google Drive-Verbindung erneuern':'Mit Google Drive verbinden');connect.title=connected?'Google Drive-Verbindung erneuern':'Mit Google Drive verbinden'}
 const folderButton=get('openDriveFolderDialog');
 if(folderButton)folderButton.disabled=!connected||busy||connecting;
 const folderName=get('driveFolderCurrentName');
 if(folderName)folderName.textContent=prefs.folderName||FOLDER;
 announceStatus();
 for(const id of ['driveRefreshList','driveRestore','driveCheck','driveFolderSelect','driveFolderRefresh','driveFolderCreate','confirmDriveFolder']){const el=get(id);if(el)el.disabled=!connected||busy||connecting;}
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
 if(!googleClientId){status(clientConfigError||'',!!clientConfigError);return}
 if(!vaultConfigured){status('Bitte zuerst ein Backup-Passwort unter „Backup-Verschlüsselung“ einrichten.');return}
 if(prefs.mode!=='off'&&due()&&!hasToken()){status('Sicherung fällig. Drive verbinden; sie erfolgt nur bei geöffneter App und aktiver Verbindung.');return}
 if(prefs.cleanupPending){status('Letztes Backup gespeichert · ältere Sicherungen werden bei nächster Verbindung bereinigt.');return}
 if(prefs.lastBackupAt){const d=asDate(prefs.lastBackupAt);status('Letzte Drive-Sicherung: '+(d?d.toLocaleString('de-AT'):'unbekannt')+'.');return}
 status('');
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
 if(busy||connecting)return;
 connecting=true;updateUi();
 if(!clientConfigLoaded||!googleClientId)await loadPublicConfig();
 if(!googleClientId){connecting=false;updateUi();return updateDueStatus();}
 try{await loadGoogle()}catch(e){connecting=false;updateUi();return status(e.message,true)}
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
   const seconds=Number(response.expires_in??3600);
   if(!Number.isFinite(seconds)||seconds<=0){accessToken='';throw Error('Google hat keine gültige Ablaufzeit geliefert.');}
   tokenExpires=Date.now()+Math.max(0,seconds-90)*1000;expireTokenAtDeadline();
  });
  updateUi();
  await refreshFolders();
  await refreshList();
  if((prefs.mode!=='off'&&due())||prefs.cleanupPending)await maybeAuto();
  else{status(vaultConfigured?'Verbunden. Jetzt sichern erstellt deine verschlüsselte vollständige Sicherung.':'Verbunden. Zuerst ein Backup-Passwort einrichten, danach Jetzt sichern.');const save=get('driveSaveNow');if(save&&!save.disabled)save.focus?.();}
 }catch(e){const message=String(e?.message||e);status(message+(/erneut verbinden/.test(message)?'':' Bitte erneut verbinden.'),true);updateUi()}
 finally{connecting=false;updateUi();}
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
 const folderId=id.replace(/[^A-Za-z0-9_-]/g,'');
 const q="'"+folderId+"' in parents and trashed = false and appProperties has { key='foliolabBackup' and value='"+NEW_BACKUP_LABEL+"' }";
 const items=await listQuery(q,'id,name,createdTime,size,appProperties');
 return items.filter(f=>/^FolioLab-\d{4}-\d{2}-\d{2}T[\d-]+Z\.encrypted\.json$/.test(f.name||''))
  .sort((a,b)=>String(b.createdTime||'').localeCompare(String(a.createdTime||'')));
}
const isCurrentBackup=file=>file.appProperties?.foliolabBackup===NEW_BACKUP_LABEL;
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
  status('');
  updateUi();
  return list;
 }catch(e){status('Drive-Liste: '+e.message,true);return [];}
}
async function createFile(parent,encrypted){
 const stamp=iso().replace(/[:.]/g,'-');
 const name='FolioLab-'+stamp+'.encrypted.json';
 const metadata={name,mimeType:'application/json',parents:[parent],appProperties:{foliolabBackup:NEW_BACKUP_LABEL}};
 const boundary='foliolab'+Math.random().toString(36).slice(2);
 const body=new Blob(['--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',JSON.stringify(metadata),
  '\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n',encrypted,'\r\n--'+boundary+'--'],
  {type:'multipart/related; boundary='+boundary});
 const res=await api('upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime',
  {method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
 const file=await res.json();if(!file.id)throw Error('Drive hat den Upload nicht bestätigt.');
 return file;
}
async function snapshotGuard(){
 if(typeof backend?.backupGuard!=='function')throw Error('Backupprüfung nicht verfügbar. Anwendung bitte neu laden.');
 const verify=await backend.backupGuard();
 if(typeof verify!=='function')throw Error('Backupprüfung nicht verfügbar. Anwendung bitte neu laden.');
 return verify;
}
async function backup(automatic=false){
 if(busy)return;
 if(!hasToken()){updateDueStatus();return}
 if(!vaultConfigured){updateDueStatus();return}
 busy=true;updateUi();status('Verschlüsseltes Backup wird erstellt …');
 let confirmedUpload=false;
 try{
  const verify=await snapshotGuard();
  const data=backend.readData();
  if(!Array.isArray(data.positions)||!Array.isArray(data.snapshots))throw Error('Lokale Bestände sind nicht lesbar.');
  if(data.positions.length===0&&data.providers.length===0&&data.accounts.length===0)throw Error('Portfolio ist leer. Vorhandene Drive-Backups bleiben erhalten.');
  const full=backend.buildCompleteBackup(data,backend.readBackupConfiguration?.()??null);
  const encrypted=await backend.encryptPasswordBackup(JSON.stringify(full));
  await verify();
  const dir=await folder(true);
  await verify();
  const uploaded=await createFile(dir,encrypted);confirmedUpload=true;
  if(prefs.mode==='start')initialAutoDone=true;
  prefs.lastBackupAt=iso();savePrefs();
  try{await verify();}catch{
   // The confirmed snapshot exists, but newer local data is not in it.
   // Never mark those changes backed up or prune another useful snapshot.
   prefs.cleanupPending=false;savePrefs();
   status('Backup gespeichert. Neuere lokale Änderungen sind noch nicht gesichert. Ältere Drive-Sicherungen bleiben erhalten.',true);
   return;
  }
  backend.onBackedUp?.();
  let removed=0,cleanupError='',verified=false;
  try{
   const saved=await filesInFolder(dir);
   if(!saved.some(f=>f.id===uploaded.id))throw Error('Hochgeladenes Backup fehlt in der Dateiliste; ältere Dateien bleiben erhalten.');
   verified=true;
   for(const old of saved.filter(isCurrentBackup).slice(prefs.retention)){
    await verify();
    await api('drive/v3/files/'+encodeURIComponent(old.id),{method:'DELETE'});
    removed++;
   }
  }catch(e){cleanupError=e.message}
  // Keep the upload independently of any cleanup/network failure.
  // Automatic retries of cleanup require a verified newly-uploaded backup.
  prefs.cleanupPending=Boolean(cleanupError&&verified);
  savePrefs();
  await refreshList();
  status((automatic?'Sitzungssicherung':'Backup')+' erfolgreich · '+new Date(prefs.lastBackupAt).toLocaleString('de-AT')+
    (removed?' · '+removed+' alte gelöscht':'')+
    (cleanupError?(verified?' · Weitere alte Backups werden später bereinigt':' · Bereinigung zur Sicherheit ausgesetzt'):''),
    false);
 }catch(e){status((confirmedUpload?'Backup hochgeladen. Abschlussprüfung fehlgeschlagen: ':'Backup fehlgeschlagen: ')+e.message,true)}
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
 backend.assertDriveBackupTextSize(text);
 const envelope=JSON.parse(text);
 if(envelope.format!=='foliolab-open-encrypted-v2')throw Error('Diese Sicherung verwendet ein altes Format. Bitte ein neues Passwort-Backup auswählen.');
 const password=get('driveRecoveryInput').value;
 if(password.length<10)throw Error('Bitte dein Backup-Passwort eingeben.');
 const payload=JSON.parse(await backend.decryptPasswordBackup(envelope,password));
 const unpacked=backend.unpackCompleteBackup(payload);
 const data=backend.validateData(unpacked.data,{strict:true});
 return {data,configuration:unpacked.configuration,password,envelope};
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
 finally{get('driveRecoveryInput').value='';busy=false;updateUi()}
}
async function restore(){
 if(!hasToken())return updateDueStatus();
 if(!get('driveBackupSelect').value)return status('Bitte zuerst ein Drive-Backup auswählen.',true);
 if(busy)return;
 busy=true;updateUi();status('Backup wird heruntergeladen und entschlüsselt …');
 try{
  const {data:next,configuration,password,envelope}=await inspectSelectedDriveBackup();
  if(!confirm('Dieses Backup mit '+next.positions.length+' Positionen und '+next.snapshots.length+' Stichtagen wiederherstellen? Deine aktuellen lokalen Daten werden ersetzt.'))return status('Wiederherstellung abgebrochen.');
  await backend.restoreData(next,configuration);
  await backend.adoptPasswordVault(envelope,password);
  get('restoreBackupDialog')?.close();
  status('Drive-Backup wiederhergestellt. '+next.positions.length+' Positionen geladen. Vorheriger Stand lokal gesichert.');
 }catch(e){status('Wiederherstellung fehlgeschlagen: '+e.message,true)}
 finally{get('driveRecoveryInput').value='';busy=false;updateUi()}
}
async function trimExisting(){
 if(!hasToken()||busy)return;
 busy=true;updateUi();
 try{
  const verify=await snapshotGuard();
  const dir=await folder(false);
  if(!dir){prefs.cleanupPending=false;savePrefs();status('Noch keine Drive-Backups vorhanden.');return}
  const items=await filesInFolder(dir);
  let removed=0;
  for(const item of items.filter(isCurrentBackup).slice(prefs.retention)){
   await verify();
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
 window.addEventListener('online',()=>{updateUi();updateDueStatus();if(backend)void maybeAuto()});
 window.addEventListener('offline',()=>{updateUi();});
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&backend){updateUi();updateDueStatus();void maybeAuto()}
 });
 updateUi();updateDueStatus();
 await loadPublicConfig();
 started=true;
 // No silent browser authorization: Drive is user-initiated.
}
function reloadRestoredConfiguration(){
 const oldId=prefs.clientId;
 loadPrefs();
 if(oldId!==prefs.clientId){accessToken='';tokenExpires=0;tokenClient=null}
 googleClientId=prefs.clientId;
 const id=get('driveClientId');if(id)id.value=prefs.clientId;
 const mode=get('driveAutoMode');if(mode)mode.value=prefs.mode;
 const limit=get('driveRetention');if(limit)limit.value=String(prefs.retention);
 updateUi();updateDueStatus();
}
window.FolioDriveBackup={init,checkDue:maybeAuto,reloadRestoredConfiguration,getStatus,connect,saveNow:()=>backup(false),
 refreshVaultStatus:async()=>{vaultConfigured=await backend.hasPasswordVault();updateUi();updateDueStatus()}
};
})();
