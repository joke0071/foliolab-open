import {CONFLICT_ARCHIVE_LIMIT} from './sync-conflict-source.js';

// Experimental file exchange against the storage adapter for the open profile.
export function showArchiveHandoff(container,api){
 const doc=container.ownerDocument;
 const form=doc.createElement('form'),fieldset=doc.createElement('fieldset');
 const legend=doc.createElement('legend');legend.textContent='Konfliktarchive austauschen';
 fieldset.append(legend);form.append(fieldset);container.replaceChildren(form);
 function input(parent,labelText,type){
  const label=doc.createElement('label'),element=doc.createElement('input');
  element.type=type;label.append(labelText,element);parent.append(label);return element;
 }
 function button(parent,text){
  const element=doc.createElement('button');element.type='button';element.textContent=text;parent.append(element);return element;
 }
 const previous=input(fieldset,'Bisheriges Archiv','file');previous.required=true;
 const source=input(fieldset,'Quellarchiv (bei Übernahme aus einem anderen Profil)','file');
 const details=doc.createElement('details'),summary=doc.createElement('summary');
 summary.textContent='Neue Übernahme vorbereiten';details.append(summary);fieldset.append(details);
 const digest=input(details,'Prüfsumme des Quellarchivs (SHA-256)','text');
 const prepare=button(details,'Zielarchiv vorbereiten');
 const rebuild=button(fieldset,'Zielarchiv erneut erstellen');
 const download=doc.createElement('a'),checksum=doc.createElement('output');
 download.download='FolioLab-Konfliktarchiv.flh';download.textContent='Zielarchiv speichern';download.hidden=true;
 fieldset.append(download,checksum);
 const target=input(fieldset,'Gespeichertes Zielarchiv','file');
 const inspect=button(fieldset,'Dateien prüfen'),confirm=button(fieldset,'Übernahme bestätigen');
 confirm.disabled=true;
 const status=doc.createElement('output');status.setAttribute('role','status');form.append(status);
 let url;
 function clearDownload(){
  if(url)URL.revokeObjectURL(url);
  url=null;download.removeAttribute('href');download.hidden=true;checksum.textContent='';
 }
 function reset(){
  confirm.disabled=true;clearDownload();status.textContent='';
 }
 form.addEventListener('input',reset);form.addEventListener('change',reset);
 form.addEventListener('submit',event=>{event.preventDefault();});
 async function run(action){
  if(fieldset.disabled||(action==='confirm'&&confirm.disabled))return;
  const needsTarget=action==='inspect'||action==='confirm';
  target.required=needsTarget;digest.required=action==='prepare'&&Boolean(source.files[0]);
  if(!form.reportValidity())return;
  const selected=[previous.files[0],needsTarget?target.files[0]:undefined,source.files[0]];
  const sourceDigest=source.files[0]?digest.value.trim():undefined;
  reset();fieldset.disabled=true;status.textContent='Dateien werden geprüft …';
  try{
   if(selected.some(file=>file&&file.size>CONFLICT_ARCHIVE_LIMIT))throw Error('file-limit');
   const decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true});
   const [previousText,text,sourceText]=await Promise.all(selected.map(async file=>
    file?decoder.decode(await file.arrayBuffer()):undefined));
   const files={previousText,text,sourceText};
   let result;
   if(action==='prepare')result=await api.prepareSuccessorFromFiles({previousText,sourceText,sourceDigest});
   else if(action==='regenerate')result=await api.regenerateSuccessorArchive(files);
   else if(action==='confirm')result=await api.confirmSuccessorHandoff(files);
   else result=await api.inspectSuccessorHandoff(files);
   if(!container.contains(form))return;
   if(result.archive){
    url=URL.createObjectURL(new Blob([result.archive.text],{type:'application/octet-stream'}));
    download.href=url;download.hidden=false;checksum.textContent='SHA-256 '+result.archive.digest;
    status.textContent='Zieldatei zum Speichern bereit.';
   }else if(result.status==='pending-confirmation'){
    status.textContent='Dateien geprüft. Die Bestätigung steht aus.';confirm.disabled=false;
   }else if(result.status==='target-bound')status.textContent='Das Zielarchiv ist bestätigt.';
   else throw Error('unrecognized-handoff');
  }catch{
   status.textContent='Die Prüfung ist fehlgeschlagen. Prüfe die gewählten Dateien und den aktuellen Profilstand.';
  }finally{fieldset.disabled=false;}
 }
 prepare.addEventListener('click',()=>void run('prepare'));rebuild.addEventListener('click',()=>void run('regenerate'));
 inspect.addEventListener('click',()=>void run('inspect'));confirm.addEventListener('click',()=>void run('confirm'));
 return ()=>{clearDownload();form.remove();};
}
