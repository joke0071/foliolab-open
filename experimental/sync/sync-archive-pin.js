import {strictSyncTransaction,syncPreimageText} from '../../src/atomic-storage.js';
import {archivePinSlot,restoreReceiptSlot} from './sync-restore-status.js';

const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const positive=value=>Number.isSafeInteger(value)&&value>0;
function storedPin(value,count){
 if(count===0)return null;
 const selected=value&&Object.hasOwn(value,'selectedHead');
 if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).length!==(selected?6:5)||
    (selected&&(typeof value.selectedHead!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(value.selectedHead)))||!positive(value.version)||!positive(value.localRevision)||
    !positive(value.syncVersion)||!hash(value.digest)||!hash(value.portfolioDigest))throw Error('sync-archive-pin-malformed');
 return value;
}

const handoffSlot='sync-conflict-archive-handoff-v1';
const same=(a,b)=>syncPreimageText(a)===syncPreimageText(b);
const record=value=>value&&Object.getPrototypeOf(value)===Object.prototype;
function storedHandoff(value,count){
 if(count===0)return null;
 if(!record(value)||Object.keys(value).length!==4||value.format!==1||
    !record(value.target)||Object.keys(value.target).length!==4||
    !hash(value.target.digest)||!hash(value.target.portfolioDigest)||!positive(value.target.localRevision)||
    !positive(value.target.syncVersion)||!(value.sourceDigest===null||hash(value.sourceDigest)))
  throw Error('sync-archive-handoff-malformed');
 const previous=storedPin(value.previous,1);
 if(previous.digest===value.target.digest||previous.version===Number.MAX_SAFE_INTEGER)
  throw Error('sync-archive-handoff-malformed');
 return value;
}
function readRecord(db,key,decode){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('records','readonly'),store=tx.objectStore('records');
  const value=store.get(key),count=store.count(key);
  tx.oncomplete=()=>{try{resolve(decode(value.result,count.result));}catch(error){reject(error);}};
  tx.onabort=()=>reject(tx.error||Error('sync-archive-pin-read-aborted'));
 });
}

export const readArchivePin=db=>readRecord(db,archivePinSlot,storedPin);
export const readArchiveHandoff=db=>readRecord(db,handoffSlot,storedHandoff);

// One bounded record per profile. Preparation captures the previous selection and
// both local records before returning the file to save. Concurrent preparations
// compare the record they started with. An identical retry can reuse it.
function finishHandoff(store,pin,binding,options,stored){
 const {handoff,previous}=options;
 if(handoff.mode==='prepare'){
  if(!same(pin,previous))throw Error('sync-archive-successor-pin-changed');
  const next={format:1,previous,target:binding,sourceDigest:handoff.sourceDigest};
  storedHandoff(next,1);
  if(!same(stored,next)){
   if(handoff.preservePending&&stored&&same(stored.previous,pin))throw Error('sync-archive-handoff-active');
   if(!same(stored,handoff.expected))throw Error('sync-archive-handoff-changed');
   store.put(next,handoffSlot);
  }
  return {pin,status:'prepared'};
 }
 if(!stored||!same(stored,handoff.expected))throw Error('sync-archive-handoff-changed');
 if(!same(binding,stored.target))throw Error('sync-archive-handoff-local-changed');
 const matchesTarget=pin&&Object.entries(binding).every(([key,value])=>pin[key]===value);
 if(matchesTarget&&pin.version>stored.previous.version)return {pin,status:'target-bound'};
 if(!same(pin,stored.previous))throw Error('sync-archive-successor-pin-changed');
 if(handoff.mode!=='confirm')return {pin,status:'pending-confirmation'};
 const next={version:pin.version+1,...binding};
 store.put(next,archivePinSlot);
 return {pin:next,status:'target-bound'};
}

// Only the already verified archive path supplies the detached IDB preimage.
// A read after restart checks the pin and both records in one consistent transaction.
export function finishArchivePin(db,current,binding,options,restore){
 const {version:expectedVersion,write,recordSelection,selectedHead}=options;
 return new Promise((resolve,reject)=>{
  const changeHandoff=options.handoff?.mode==='prepare'||options.handoff?.mode==='confirm';
  const tx=(write||recordSelection||restore||changeHandoff)?strictSyncTransaction(db):db.transaction('records','readonly'),store=tx.objectStore('records');
  const portfolio=store.get('portfolio'),sync=store.get('sync-outbox-v1'),anchor=store.count('sync-local-anchor-v1');
  const value=store.get(archivePinSlot),count=store.count(archivePinSlot);
  const handoff=options.handoff&&store.get(handoffSlot);
  const last=(options.handoff||options.requireNoHandoff)?store.count(handoffSlot):count;
  let pin,status,failure;
  last.onsuccess=()=>{
   try{
    if(anchor.result||syncPreimageText(portfolio.result)!==syncPreimageText(current.portfolio)||
       syncPreimageText(sync.result)!==syncPreimageText(current.sync))throw Error('sync-archive-pin-preimage');
    if(options.requireNoHandoff&&last.result!==0)throw Error('sync-archive-handoff-changed');
    pin=storedPin(value.result,count.result);
    if(options.handoff){
     ({pin,status}=finishHandoff(store,pin,binding,options,storedHandoff(handoff.result,last.result)));
     return;
    }
    if(options.previous){
     if(syncPreimageText(pin)!==syncPreimageText(options.previous))throw Error('sync-archive-successor-pin-changed');
     if(!write)return;
    }
    const matches=pin&&Object.entries(binding).every(([key,v])=>pin[key]===v);
    const version=pin?.version??0;
    if(recordSelection){
     if(!matches)throw Error('sync-archive-pin-binding');
     if(pin.selectedHead===selectedHead&&(version===expectedVersion||version===expectedVersion+1))return;
     if(version!==expectedVersion||version===Number.MAX_SAFE_INTEGER)throw Error('sync-archive-pin-version');
     pin={...pin,selectedHead,version:version+1};
     store.put(pin,archivePinSlot);
     return;
    }
    if(options.allHeads&&(pin?.selectedHead??null)!==options.savedSelection)throw Error('sync-archive-selection-changed');
    if(options.readSelection&&pin?.selectedHead!==selectedHead)throw Error('sync-archive-selection-changed');
    if(write&&matches&&(version===expectedVersion||version===expectedVersion+1))return;
    if(version!==expectedVersion)throw Error('sync-archive-pin-version');
    if(!write){
     if(!matches)throw Error('sync-archive-pin-binding');
     if(restore){
      store.put(restore.portfolio,'portfolio');
      store.put(restore.sync,'sync-outbox-v1');
      store.put(restore.receipt,restoreReceiptSlot);
     }
     return;
    }
    if(version===Number.MAX_SAFE_INTEGER)throw Error('sync-archive-pin-version');
    pin={version:version+1,...binding};store.put(pin,archivePinSlot);
   }catch(error){failure=error;tx.abort();}
  };
  tx.oncomplete=()=>resolve({pin,status});
  tx.onabort=()=>reject(failure||tx.error||Error('sync-archive-pin-aborted'));
 });
}
