/** UI only. Auth, encryption, storage and writes remain in their existing owners. */
export function storagePresentation({checking=false,saving=false,conflict=false,error='',indexedDB=true}={}){
 if(checking)return {state:'checking',label:'Lokaler Speicher wird geprüft',mark:'…'};
 if(conflict)return {state:'conflict',label:'Datenkonflikt mit anderem Tab. Ungespeicherte Eingaben sichern und neu laden.',mark:'!'};
 if(saving)return {state:'saving',label:'Änderungen werden lokal gespeichert',mark:'…'};
 if(error)return {state:'error',label:'Speicherfehler. '+error,mark:'!'};
 return {state:'saved',label:indexedDB?'Lokal in IndexedDB gespeichert':'Im bisherigen Browser-Speicher gespeichert',mark:'✓'};
}
export function drivePresentation(s={}){
 if(!s.configured)return {state:'setup',label:'Google Drive nicht eingerichtet. Einstellungen öffnen.',mark:''};
 if(s.busy)return {state:'busy',label:'Google Drive: Vorgang läuft',mark:'…'};
 if(s.connecting)return {state:'connecting',label:'Google-Drive-Autorisierung läuft',mark:'…'};
 if(s.error)return {state:'error',label:'Google Drive: '+s.message,mark:'!'};
 if(s.offline)return {state:'offline',label:'Google Drive ist offline. Lokaler Speicher bleibt unabhängig.',mark:'−'};
 if(!s.vaultConfigured)return {state:'setup',label:'Google Drive: zuerst Backup-Passwort einrichten.',mark:''};
 if(!s.connected)return {state:'auth',label:'Google Drive: erneut verbinden'+(s.due?' · verschlüsselte Sicherung fällig.':'.'),mark:'↗'};
 if(s.due)return {state:'due',label:'Google Drive verbunden · verschlüsselte Sicherung fällig',mark:'○'};
 return {state:'connected',label:'Google Drive verbunden · '+(s.lastBackupAt?'Letzte erfolgreiche Sicherung: '+new Date(s.lastBackupAt).toLocaleString('de-AT'):'Noch keine erfolgreiche Sicherung'),mark:''};
}

export function installHeaderStatus({readStorage,checkStorageCurrent=async()=>{},onStorageHelp,onDriveSettings}){
 const dialog=document.getElementById('headerStatusDialog'),title=document.getElementById('headerStatusTitle'),body=document.getElementById('headerStatusBody'),actions=document.getElementById('headerStatusActions'),feedback=document.getElementById('headerStatusFeedback');
 let opened='',opener=null,returnFocus=true,openingStorage=false;
 const drive=()=>window.FolioDriveBackup?.getStatus?.()||{};
 function action(label,fn,disabled=false){const b=document.createElement('button');b.type='button';b.className='btn outline';b.textContent=label;b.disabled=disabled;b.onclick=fn;actions.append(b);}
 function contents(){
  const focused=actions.contains(document.activeElement)?document.activeElement.textContent:null;
  actions.replaceChildren();
  feedback.hidden=true;
  if(opened==='storage'){
   const s=readStorage();title.textContent='Lokaler Speicher';body.textContent=storagePresentation(s).label;
   if(s.conflict)action('Neu laden',()=>location.reload());
   else if(s.error)action('Speicherhilfe öffnen',()=>{returnFocus=false;dialog.close();onStorageHelp();});
  }else{
   const s=drive(),presentation=drivePresentation(s);title.textContent='Google Drive';
   body.textContent=presentation.label+(presentation.state==='connected'?'':'\n'+(s.lastBackupAt?'Letzte erfolgreiche Sicherung: '+new Date(s.lastBackupAt).toLocaleString('de-AT'):'Noch keine erfolgreiche Sicherung.'))+'\nDrive-Backup · keine Gerätesynchronisierung.';
   feedback.hidden=!s.message||s.error;
   feedback.querySelector('p').textContent=s.message||'';
   const local=readStorage(),blocked=Boolean(local.error||local.conflict||local.saving||local.checking);
   if(blocked)body.textContent+='\nZuerst den lokalen Speicherstatus prüfen. Aktuell ist keine neue Sicherung freigegeben.';
   action('Jetzt sichern',()=>void window.FolioDriveBackup?.saveNow?.(),blocked||!s.connected||!s.vaultConfigured||s.busy||s.connecting||s.offline);
   action('Drive-Einstellungen',()=>{returnFocus=false;dialog.close();onDriveSettings();});
  }
  if(focused){const next=[...actions.children].find(b=>b.textContent===focused&&!b.disabled);(next||document.getElementById('headerStatusClose')).focus({preventScroll:true});}
 }
 function refresh(){
  for(const b of document.querySelectorAll('[data-header-status]')){
   const kind=b.dataset.headerStatus,p=kind==='storage'?storagePresentation(readStorage()):drivePresentation(drive());
   b.disabled=false;b.dataset.state=p.state;b.setAttribute('aria-label',p.label);b.title=p.label;
   b.querySelector('.header-status-mark').textContent=p.mark;
  }
  if(dialog.open)contents();
 }
 for(const b of document.querySelectorAll('[data-header-status]'))b.addEventListener('click',async()=>{
  if(openingStorage)return;
  opener=b;opened=b.dataset.headerStatus;returnFocus=true;
  if(opened==='drive'){
   const s=drive();
   if(!s.configured||!s.vaultConfigured){onDriveSettings();return;}
   // Call the one existing OAuth entry point directly from this user gesture.
   const local=readStorage();
   if(!s.connected&&!s.busy&&!s.connecting&&!s.offline&&!local.error&&!local.conflict&&!local.saving&&!local.checking){void window.FolioDriveBackup.connect();return;}
  }
  if(opened==='storage'){openingStorage=true;try{await checkStorageCurrent();}finally{openingStorage=false;}}
  contents();dialog.showModal();document.getElementById('headerStatusClose').focus();
 });
 document.getElementById('headerStatusClose').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{const kind=opened;opened='';if(returnFocus){const target=opener?.isConnected&&opener.checkVisibility()?opener:[...document.querySelectorAll('[data-header-status]')].find(b=>b.dataset.headerStatus===kind&&b.checkVisibility());target?.focus({preventScroll:true});}});
 window.addEventListener('foliolab-drive-status',refresh);
 window.addEventListener('online',refresh);window.addEventListener('offline',refresh);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void checkStorageCurrent().then(refresh);});
 refresh();return {refresh};
}
