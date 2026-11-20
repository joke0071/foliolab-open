import {readPortfolioRecord,syncPreimageText} from '../../src/atomic-storage.js';
import {LOCAL_BACKUP_FILE_BYTES} from '../../src/backup-limits.js';
import {SYNC_GRAPH_LIMIT} from './sync-revisions.js';
import {SYNC_OUTBOX_TEXT_LIMIT} from './sync-outbox-state.js';

export const archivePinSlot='sync-conflict-archive-pin-v1';
export const restoreReceiptSlot='sync-local-restore-receipt-v1';

export async function archiveDigest(text){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
}

// Bind the ordered, password-verified file pair to the exact committed records.
// Only the resulting hashes travel into IndexedDB, in the restore transaction.
async function receiptProof(pin,sync,files,portfolioDigest){
 const local=await archiveDigest(files.localFile),selected=await archiveDigest(files.selectedFile);
 const outbox=await archiveDigest(syncPreimageText(sync));
 return archiveDigest(syncPreimageText([pin.version,pin.localRevision,pin.syncVersion,pin.digest,
  pin.portfolioDigest,pin.selectedHead,local,selected,outbox,portfolioDigest]));
}

export async function prepareRestore(current,raw,pin,files){
 if(current.portfolio.revision===Number.MAX_SAFE_INTEGER)throw Error('sync-restore-revision-limit');
 const portfolio={...current.portfolio,raw,revision:current.portfolio.revision+1,
  syncEnrollmentRequired:true,updatedAt:new Date().toISOString()};
 const sync={...current.sync,disabled:'portfolio-restored'};
 const portfolioDigest=await archiveDigest(syncPreimageText(portfolio));
 const proof=await receiptProof(pin,sync,files,portfolioDigest);
 return {portfolio,sync,receipt:{portfolioDigest,proof}};
}

function readSnapshot(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('records','readonly'),store=tx.objectStore('records');
  const slots=['portfolio','sync-outbox-v1',archivePinSlot,restoreReceiptSlot].map(key=>store.get(key));
  const anchor=store.count('sync-local-anchor-v1');
  tx.oncomplete=()=>{
   const [portfolio,sync,pin,receipt]=slots.map(request=>request.result??null);
   resolve({portfolio,sync,pin,receipt,anchors:anchor.result});
  };
  tx.onabort=()=>reject(tx.error||Error('sync-restore-status-read-aborted'));
 });
}

const unknown=()=>({status:'undetermined',applyAuthorized:false});
const boundedFile=value=>typeof value==='string'&&value.length>0&&value.length<=LOCAL_BACKUP_FILE_BYTES&&
 new Blob([value]).size<=LOCAL_BACKUP_FILE_BYTES;

export async function inspectPinnedLocalRestore(db,{text,expectedPinVersion,confirmedHead,localFile,selectedFile}={}){
 if(typeof text!=='string'||text.length>SYNC_OUTBOX_TEXT_LIMIT+SYNC_GRAPH_LIMIT+100||
    !Number.isSafeInteger(expectedPinVersion)||expectedPinVersion<1||typeof confirmedHead!=='string'||
    !boundedFile(localFile)||!boundedFile(selectedFile))return unknown();
 const state=await readSnapshot(db);
 const {portfolio,sync,pin,receipt,anchors}=state;
 if(anchors||portfolio?.syncEnrollmentRequired!==true||portfolio.deleted!==false||sync?.disabled!=='portfolio-restored'||
    pin?.version!==expectedPinVersion||Object.keys(pin).length!==6||pin.selectedHead!==confirmedHead||!Number.isSafeInteger(pin.localRevision)||
    !Number.isSafeInteger(portfolio.revision)||portfolio.revision<=pin.localRevision||
    !receipt||Object.keys(receipt).length!==2||typeof receipt.portfolioDigest!=='string'||!/^[0-9a-f]{64}$/.test(receipt.portfolioDigest)||
    pin.digest!==await archiveDigest(text))return unknown();
 try{
  if(await receiptProof(pin,sync,{localFile,selectedFile},receipt.portfolioDigest)!==receipt.proof)return unknown();
  let status='matches-restored-state';
  if(portfolio.revision===pin.localRevision+1){
   if(await archiveDigest(syncPreimageText(portfolio))!==receipt.portfolioDigest)return unknown();
  }else{
   // The normal storage reader validates the later financial model and local settings.
   if(syncPreimageText(await readPortfolioRecord(db))!==syncPreimageText(portfolio))return unknown();
   status='later-local-revision';
  }
  if(syncPreimageText(await readSnapshot(db))!==syncPreimageText(state))return unknown();
  return {status,applyAuthorized:false};
 }catch{return unknown();}
}
