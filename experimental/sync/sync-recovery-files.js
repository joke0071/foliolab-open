// Both files use the ordinary password-backup reader. The caller checks the
// portfolio, queue and selection again after this asynchronous work completes.
import {encryptWithBackupPassword,decryptPasswordBackup} from '../../src/backup-vault.js';
import {assertLocalBackupFileSize} from '../../src/backup-limits.js';
import {archiveDigest} from './sync-restore-status.js';

function envelope(text){
 if(typeof text!=='string')throw Error('sync-recovery-file-missing');
 assertLocalBackupFileSize(text.length);
 assertLocalBackupFileSize(new Blob([text]).size);
 return JSON.parse(text);
}

export async function prepareRecoveryFiles(local,selected,readback){
 const files=readback??{localFile:await encryptWithBackupPassword(local),
  selectedFile:await encryptWithBackupPassword(selected)};
 const first=envelope(files.localFile),second=envelope(files.selectedFile);
 if(first.keyId!==second.keyId||first.iv===second.iv||
    JSON.stringify(first.wrap)!==JSON.stringify(second.wrap))throw Error('sync-recovery-file-pair');
 if(!readback)return {recoveryFiles:files};
 if(await decryptPasswordBackup(first,readback.password)!==local||
    await decryptPasswordBackup(second,readback.password)!==selected)throw Error('sync-recovery-file-content');
 return {recoveryFilesVerified:true};
}

// An ordinary backup remains individually importable. The encrypted index
// binds its exact ciphertext (including its fresh nonce) to one revision/role.
export async function prepareRecoverySet({binding,localHead,heads,readCopy,readback}){
 if(heads.length<3)throw Error('sync-recovery-set-needs-three-heads');
 const slots=[{role:'local',revisionId:localHead},...heads.map(revisionId=>({role:'head',revisionId}))];
 if(readback&&readback.copies.length!==slots.length)throw Error('sync-recovery-set-count');
 let key;
 const nonces=new Set();
 async function openFile(file){
  if(file instanceof Blob){
   assertLocalBackupFileSize(file.size);
   file=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(await file.arrayBuffer());
  }
  const parsed=envelope(file);
  const signature=JSON.stringify([parsed.keyId,parsed.wrap]);
  if((key!==undefined&&key!==signature)||nonces.has(parsed.iv))throw Error('sync-recovery-set-file');
  key=signature;nonces.add(parsed.iv);
  return {text:file,parsed};
 }
 const copies=[],entries=[];
 const indexText=()=>JSON.stringify({format:'FolioLabConflictBackup/1',...binding,entries});
 if(readback){
  const index=await openFile(readback.indexFile);
  const saved=await decryptPasswordBackup(index.parsed,readback.password);
  const digests=JSON.parse(saved).entries;
  if(!Array.isArray(digests)||digests.length!==slots.length)throw Error('sync-recovery-set-index');
  for(const [i,slot] of slots.entries())entries.push({...slot,digest:digests[i]?.digest});
  if(saved!==indexText())throw Error('sync-recovery-set-index');
  for(const [i,slot] of slots.entries()){
   const {text,parsed}=await openFile(readback.copies[i]);
   if(await archiveDigest(text)!==entries[i].digest)throw Error('sync-recovery-set-file');
   if(await decryptPasswordBackup(parsed,readback.password)!==await readCopy(slot))
    throw Error('sync-recovery-set-content');
  }
  return {verifiedCopies:slots};
 }
 for(const slot of slots){
  const {text}=await openFile(await encryptWithBackupPassword(await readCopy(slot)));
  copies.push(text);entries.push({...slot,digest:await archiveDigest(text)});
 }
 const index=await openFile(await encryptWithBackupPassword(indexText()));
 return {recoverySet:{indexFile:index.text,copies}};
}
