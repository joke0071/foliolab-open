import {backup,safeImport} from '../../src/model.js';
import {decryptPasswordBackup} from '../../src/backup-vault.js';
import {createSyncSnapshot,previewSyncRestore} from './sync-snapshot.js';
import {readPortfolioRecord,syncPreimageText,strictSyncTransaction} from '../../src/atomic-storage.js';
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

function requestSnapshot(store,accept){
 const slots=['portfolio','sync-outbox-v1',archivePinSlot,restoreReceiptSlot].map(key=>store.get(key));
 const anchor=store.count('sync-local-anchor-v1');
 anchor.onsuccess=()=>{
  const [portfolio,sync,pin,receipt]=slots.map(request=>request.result??null);
  accept({portfolio,sync,pin,receipt,anchors:anchor.result});
 };
}

function readSnapshot(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('records','readonly');
  let state;
  requestSnapshot(tx.objectStore('records'),snapshot=>{state=snapshot;});
  tx.oncomplete=()=>resolve(state);
  tx.onabort=()=>reject(tx.error||Error('sync-restore-status-read-aborted'));
 });
}

function rollbackProof(restoreProof,revision,portfolioDigest){
 return archiveDigest(syncPreimageText(['local-rollback-v1',restoreProof,revision,portfolioDigest]));
}

async function commitRollback(db,expected,raw){
 const before=syncPreimageText(expected),revision=expected.portfolio.revision+1;
 const portfolio={...expected.portfolio,raw,revision,updatedAt:new Date().toISOString()};
 const portfolioDigest=await archiveDigest(syncPreimageText(portfolio));
 const rollback={revision,portfolioDigest,proof:await rollbackProof(expected.receipt.proof,revision,portfolioDigest)};
 return new Promise((resolve,reject)=>{
  const tx=strictSyncTransaction(db),store=tx.objectStore('records');
  requestSnapshot(store,current=>{
   try{
    if(syncPreimageText(current)!==before){tx.abort();return;}
    store.put(portfolio,'portfolio');
    store.put({...expected.receipt,rollback},restoreReceiptSlot);
   }catch{tx.abort();}
  });
  tx.oncomplete=()=>resolve({status:'rolled-back-local-copy',localRevision:revision,applyAuthorized:false});
  tx.onabort=()=>reject(tx.error||Error('sync-local-rollback-aborted'));
 });
}

const unknown=()=>({status:'undetermined',applyAuthorized:false});
const boundedFile=value=>typeof value==='string'&&value.length>0&&value.length<=LOCAL_BACKUP_FILE_BYTES&&
 new Blob([value]).size<=LOCAL_BACKUP_FILE_BYTES;

export function inspectPinnedLocalRestore(db,request){
 return inspectRestore(db,request,'inspect');
}

// Read a case using only the user's archived files. The selection comes from
// the same local snapshot as the evidence and is never inferred from filenames.
export function reopenLocalRecoveryCase(db,files){
 return inspectRestore(db,files,'case');
}

export function previewPinnedLocalRollback(db,request){
 return inspectRestore(db,request,'preview');
}

export function rollbackPinnedLocalCopy(db,request){
 return inspectRestore(db,request,'rollback');
}

async function recoveryPhase({portfolio,pin,receipt}){
 const rolledBack=Object.hasOwn(receipt,'rollback');
 let revision=pin.localRevision+1,digest=receipt.portfolioDigest;
 if(rolledBack){
  const mark=receipt.rollback;
  revision++;
  if(!mark||Object.keys(mark).length!==3||!Number.isSafeInteger(mark.revision)||mark.revision!==revision||
     typeof mark.portfolioDigest!=='string'||!/^[a-f0-9]{64}$/.test(mark.portfolioDigest)||
     mark.proof!==await rollbackProof(receipt.proof,revision,mark.portfolioDigest))return 'undetermined';
  digest=mark.portfolioDigest;
 }
 if(portfolio.revision>revision)return rolledBack?'later-local-revision-after-rollback':'later-local-revision';
 if(portfolio.revision!==revision||await archiveDigest(syncPreimageText(portfolio))!==digest)return 'undetermined';
 return rolledBack?'matches-rolled-back-state':'matches-restored-state';
}

async function inspectRestore(db,{text,expectedPinVersion,confirmedHead,localFile,selectedFile,password,
 confirmedRollbackRevision}={},mode){
 if(typeof text!=='string'||text.length>SYNC_OUTBOX_TEXT_LIMIT+SYNC_GRAPH_LIMIT+100||
    !boundedFile(localFile)||!boundedFile(selectedFile))return unknown();
 const state=await readSnapshot(db);
 const {portfolio,sync,pin,receipt,anchors}=state;
 if(mode==='case'){expectedPinVersion=pin?.version;confirmedHead=pin?.selectedHead;}
 if(!Number.isSafeInteger(expectedPinVersion)||expectedPinVersion<1||typeof confirmedHead!=='string')return unknown();
 const hasRollback=receipt!=null&&Object.hasOwn(receipt,'rollback');
 if(anchors||portfolio?.syncEnrollmentRequired!==true||portfolio.deleted!==false||sync?.disabled!=='portfolio-restored'||
    pin?.version!==expectedPinVersion||Object.keys(pin).length!==6||pin.selectedHead!==confirmedHead||!Number.isSafeInteger(pin.localRevision)||
    !Number.isSafeInteger(portfolio.revision)||portfolio.revision<=pin.localRevision||
    !receipt||Object.keys(receipt).length!==(hasRollback?3:2)||typeof receipt.portfolioDigest!=='string'||!/^[0-9a-f]{64}$/.test(receipt.portfolioDigest)||
    pin.digest!==await archiveDigest(text))return unknown();
 try{
  if(await receiptProof(pin,sync,{localFile,selectedFile},receipt.portfolioDigest)!==receipt.proof)return unknown();
  const status=await recoveryPhase(state);
  if(status==='undetermined')return unknown();
  let rollbackPreview;
  if(status==='matches-restored-state'&&(mode==='preview'||mode==='rollback')){
   if(mode==='rollback'&&(confirmedRollbackRevision!==portfolio.revision||
      portfolio.revision===Number.MAX_SAFE_INTEGER))return unknown();
   if(typeof password!=='string'||!password.length)return unknown();
   const raw=await decryptPasswordBackup(JSON.parse(localFile),password);
   rollbackPreview=await previewSyncRestore(portfolio.raw,await createSyncSnapshot(raw));
   if(mode==='rollback'){
    const canonical=backup(safeImport(JSON.parse(raw)),{includeHistory:true});
    return await commitRollback(db,state,canonical);
   }
  }
  if((status==='later-local-revision'||status==='later-local-revision-after-rollback')&&
     syncPreimageText(await readPortfolioRecord(db))!==syncPreimageText(portfolio))return unknown();
  if(syncPreimageText(await readSnapshot(db))!==syncPreimageText(state))return unknown();
  if(mode==='case')return {status,selectedHead:confirmedHead,expectedPinVersion,localRevision:portfolio.revision,
   rollbackAvailable:status==='matches-restored-state'&&portfolio.revision<Number.MAX_SAFE_INTEGER,applyAuthorized:false};
  return rollbackPreview?{status,rollbackPreview,applyAuthorized:false}:{status,applyAuthorized:false};
 }catch{return unknown();}
}
