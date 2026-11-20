// Numbered file slots keep revision IDs that differ only in case portable.
import {assertLocalBackupFileSize} from '../../src/backup-limits.js';

export function showRecoverySet(container,api,request,heads){
 const doc=container.ownerDocument;
 const fieldset=doc.createElement('fieldset'),legend=doc.createElement('legend');
 legend.textContent='Passwortgeschützte Konfliktsicherung';fieldset.append(legend);container.append(fieldset);
 const button=label=>{
  const action=doc.createElement('button');action.type='button';action.textContent=label;fieldset.append(action);return action;
 };
 const generate=button('Alle Stände sichern');
 const downloads=doc.createElement('ul');fieldset.append(downloads);
 const input=(title,type)=>{
  const label=doc.createElement('label'),element=doc.createElement('input');
  element.type=type;label.append(title,element);fieldset.append(label);return element;
 };
 const labels=['Verzeichnis','Lokaler Stand',...heads.map(id=>'Revision '+id)];
 const inputs=labels.map(label=>input(label+' zurücklesen','file'));
 const password=input('Backup-Passwort','password');password.autocomplete='off';
 const verify=button('Sicherungssatz prüfen'),status=doc.createElement('output');
 status.setAttribute('role','status');fieldset.append(status);
 const names=['verzeichnis','lokal',...heads.map((_,i)=>'zweig-'+(i+1))]
  .map(slot=>'foliolab-'+request.expectedPinVersion+'-'+slot+'.json');
 function addDownload(contents,i){
  const li=doc.createElement('li'),link=doc.createElement('a');
  link.download=names[i];link.href='#';link.textContent=labels[i]+' speichern';
  link.addEventListener('click',()=>{
   const url=URL.createObjectURL(new Blob([contents],{type:'application/json'}));link.href=url;
   setTimeout(()=>URL.revokeObjectURL(url),60000);
  });
  li.append(link);downloads.append(li);
 }
 fieldset.addEventListener('change',()=>{status.textContent='';});
 password.addEventListener('input',()=>{status.textContent='';});
 async function run(exporting){
  if(fieldset.disabled)return;
  fieldset.disabled=true;status.textContent='';
  try{
   if(exporting){
    downloads.replaceChildren();
    const {recoverySet}=await api.exportPinnedRecoverySet(request);
    [recoverySet.indexFile,...recoverySet.copies].forEach(addDownload);
    status.textContent='Verzeichnis und alle Finanzkopien zum Speichern bereit.';
   }else{
    const [indexFile,...copies]=inputs.map(input=>{
     const file=input.files[0];
     if(!file)throw Error('Dateiauswahl');
     assertLocalBackupFileSize(file.size);return file;
    });
    const {verifiedCopies}=await api.verifyPinnedRecoverySet({...request,indexFile,copies,password:password.value});
    status.textContent='Lokaler Stand und '+(verifiedCopies.length-1)+' Revisionen geprüft.';
   }
  }catch{status.textContent='Sicherung fehlgeschlagen. Prüfe Dateien, Backup-Passwort und aktuellen Profilstand.';}
  finally{if(!exporting)password.value='';fieldset.disabled=false;}
 }
 generate.addEventListener('click',()=>void run(true));verify.addEventListener('click',()=>void run(false));
}
