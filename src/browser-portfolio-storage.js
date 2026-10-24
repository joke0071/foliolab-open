/**
 * Opt-in canonical IndexedDB portfolio storage with a legacy recovery copy.
 * No background migration. Opt-in storage switching retains local credentials.
 * Encrypted complete backups may optionally include user-approved credentials.
 */
import {blankModel,defaultSettings,load,persist,backup,safeImport,STORE_KEY,purgeLocalAppData} from './model.js';
import {openPortfolioDB,readPortfolioRecord,commitPortfolioRecord,readUnverifiedRecord,restoreDamagedRecord} from './atomic-storage.js';
export const MODE_KEY='foliolab-open-storage-mode';
export const MODE_VALUE='idb-v1';
export const REVERT_INTENT_KEY='foliolab-open-idb-revert-intent';
// This non-secret checksum catches accidental local-copy changes, not attacks.
function localFingerprint(raw){
 let h=2166136261;
 for(let i=0;i<raw.length;i++)h=Math.imul(h^raw.charCodeAt(i),16777619);
 return raw.length+':'+(h>>>0).toString(16);
}
const clone = model => structuredClone(model);
function restored(record){
 if(!record)return null;
 if(record.raw===null)return blankModel(); // revisioned deletion tombstone
 if(!record.settings||typeof record.settings!=='object'||Array.isArray(record.settings))
  throw Error('Die gespeicherten IndexedDB-Einstellungen sind unvollständig. Nichts wird überschrieben.');
 const m=safeImport(JSON.parse(record.raw));
 const allowed=defaultSettings();
 for(const key of Object.keys(allowed))if(Object.hasOwn(record.settings,key))allowed[key]=record.settings[key];
 m.settings=allowed;
 return m;
}
export class PortfolioStorage {
 constructor(storage=globalThis.localStorage){
  this.storage=storage;this.mode='local';this.db=null;this.revision=null;
  // Capture the source bytes without re-importing legacy v1/v2 portfolios.
  // v1 normalization can create fresh internal account IDs on each parse.
  try{this.legacyRaw=storage.getItem(STORE_KEY);}catch{this.legacyRaw=undefined;}
 }
 get isIndexedDB(){return this.mode==='idb';}
 async initialize(){
  if(this.storage.getItem(MODE_KEY)!==MODE_VALUE){
   const m=load(this.storage);
   this.legacyRaw=this.storage.getItem(STORE_KEY);
   return m;
  }
  this.mode='idb'; // marker decides canonical store, even if opening IndexedDB fails
  this.db=await openPortfolioDB(); // never fall back to stale localStorage on error
  const record=await readPortfolioRecord(this.db); // fail closed
  if(!record)throw Error('Aktiver IndexedDB-Speicher nicht gefunden. Bitte eine Sicherung wiederherstellen.');
  this.revision=record.revision;
  // A rollback can be interrupted AFTER the IDB tombstone has committed but
  // BEFORE the storage-mode marker is cleared. Recover only its exact intent.
  if(record.deleted&&record.raw===null){
   const pending=this.storage.getItem(REVERT_INTENT_KEY);
   if(pending!==null){
    let intent;
    try{intent=JSON.parse(pending);}
    catch{throw Error('Rückwechsel-Marker beschädigt. Keine Daten automatisch übernommen.');}
    if(intent?.revision===record.revision){
     const raw=this.storage.getItem(STORE_KEY);
     if(typeof raw!=='string'||localFingerprint(raw)!==intent.fingerprint)
      throw Error('Die lokale Kopie stimmt nicht mit der Rückmigration überein. Kein automatischer Wechsel.');
     const copy=load(this.storage); // validate legacy bytes before switching
     this.storage.removeItem(MODE_KEY);
     try{this.storage.removeItem(REVERT_INTENT_KEY);}catch{}
     this.db.close();this.db=null;this.mode='local';this.revision=null;
     this.legacyRaw=this.storage.getItem(STORE_KEY);
     return copy;
    }
   }
  }
  return restored(record);
 }
 async reload(){
  if(!this.isIndexedDB){const m=load(this.storage);this.legacyRaw=this.storage.getItem(STORE_KEY);return m;}
  const current=await readPortfolioRecord(this.db);
  if(!current)throw Error('Der aktive IndexedDB-Datensatz fehlt.');
  this.revision=current.revision;
  return restored(current);
 }
 async save(model){
  if(!this.isIndexedDB){
   const draft=clone(model);
   return this.withLocalLock(()=>{
    if(this.storage.getItem(MODE_KEY)===MODE_VALUE)throw Error('Speichermodus wurde in einem anderen Tab geändert. Bitte neu laden.');
    if(this.legacyRaw===undefined||this.storage.getItem(STORE_KEY)!==this.legacyRaw)
     throw Error('Portfolio wurde in einem anderen Tab geändert. Bitte Daten neu laden.');
    persist(draft,this.storage);
    this.legacyRaw=this.storage.getItem(STORE_KEY);
   });
  }
  if(!this.db)throw Error('IndexedDB-Verbindung geschlossen. Seite neu laden.');
  const draft=clone(model);
  const current=await commitPortfolioRecord(this.db,{
   expectedRevision:this.revision,raw:backup(draft),settings:draft.settings
  });
  this.revision=current.revision; // only after tx.oncomplete
 }
 async withLocalLock(action){
  if(typeof window!=='undefined'&&globalThis.navigator?.locks)return navigator.locks.request('foliolab-portfolio-write',action);
  if(typeof window!=='undefined')throw Error('Sicheres Speichern benötigt Web Locks. Bitte einen aktuellen Browser verwenden.');
  return action(); // synchronous in-memory adapters in Node tests
 }
 async migrate(model){return this.withLocalLock(()=>this.migrateLocked(model));}
 async migrateLocked(model){
  if(this.isIndexedDB)throw Error('IndexedDB ist bereits aktiv.');
  const original=this.storage.getItem(STORE_KEY);
  if(this.legacyRaw!==undefined&&original!==this.legacyRaw)
   throw Error('Das lokale Portfolio wurde in einem anderen Tab geändert. Bitte neu laden und die Migration erneut starten.');
  if(original!==null)safeImport(JSON.parse(original)); // reject corrupt source without rebuilding ID comparisons
  const db=await openPortfolioDB();
  try{
   const existing=await readPortfolioRecord(db);
   const portable=backup(model),preferences=clone(model.settings);
   let record;
   if(existing?.deleted&&existing.raw===null){
    // A deliberate prior rollback/reset leaves an IDB tombstone. Only a NEW,
    // explicitly consented migration may supersede it at its exact revision.
    record=await commitPortfolioRecord(db,{
     expectedRevision:existing.revision,raw:portable,settings:preferences
    });
   }else if(existing){
    // Interrupted prior migration may be resumed only when its bytes and
    // credentials are exactly the same; never overwrite a different record.
    if(existing.raw!==portable||JSON.stringify(existing.settings)!==JSON.stringify(preferences))
     throw Error('IndexedDB enthält einen abweichenden Datenstand. Automatische Überschreibung verweigert.');
    record=existing;
   }else record=await commitPortfolioRecord(db,{
    expectedRevision:null,raw:portable,settings:preferences
   });
   const check=await readPortfolioRecord(db);
   if(check?.revision!==record.revision||!check.settings||!check.raw)
    throw Error('IndexedDB-Migration konnte nicht vollständig überprüft werden.');
   if(this.storage.getItem(STORE_KEY)!==original)
    throw Error('Das lokale Portfolio wurde während der Migration geändert. Wechsel abgebrochen; Originaldaten bleiben erhalten.');
   // Marker is the final cutover. A failed marker write leaves legacy canonical.
   this.storage.setItem(MODE_KEY,MODE_VALUE);
   this.db=db;this.revision=record.revision;this.mode='idb';
  }catch(error){db.close();throw error;}
 }
 async unverifiedBackup(){
  if(!this.isIndexedDB||!this.db)throw Error('IndexedDB ist nicht geöffnet.');
  return readUnverifiedRecord(this.db);
 }
 async recoverFromBackup(model,expected){
  if(!this.isIndexedDB||!this.db)throw Error('IndexedDB ist nicht verfügbar.');
  const recovered=await restoreDamagedRecord(this.db,{expected,raw:backup(model),settings:clone(model.settings)});
  this.revision=recovered.revision;
  return recovered;
 }
 async removeAll(){return this.withLocalLock(()=>this.removeAllLocked());}
 async removeAllLocked(){
  if(this.isIndexedDB){
   // A failed older rollback may have left a recovery intent. Never allow an
   // intentional delete-all tombstone to accidentally match that old intent.
   if(this.storage.getItem(REVERT_INTENT_KEY)!==null)
    this.storage.removeItem(REVERT_INTENT_KEY);
   if(this.storage.getItem(REVERT_INTENT_KEY)!==null)
    throw Error('Alter Rückwechsel-Marker konnte nicht entfernt werden. Löschung abgebrochen.');
   const record=await commitPortfolioRecord(this.db,{expectedRevision:this.revision,raw:null,settings:null});
   this.revision=record.revision;
  }else{
   if(this.storage.getItem(MODE_KEY)===MODE_VALUE||this.storage.getItem(STORE_KEY)!==this.legacyRaw)
    throw Error('Portfolio wurde in einem anderen Tab geändert. Bitte neu laden.');
  }
  purgeLocalAppData(this.storage,{preserveStorageMode:this.isIndexedDB});
  this.legacyRaw=null;
 }
 async revert(model){return this.withLocalLock(()=>this.revertLocked(model));}
 async revertLocked(model){
  if(!this.isIndexedDB)throw Error('Es ist bereits lokale Speicherung aktiv.');
  const current=await readPortfolioRecord(this.db);
  if(current?.revision!==this.revision)throw Error('Ein anderer Tab hat den IndexedDB-Datensatz geändert. Zuerst neu laden.');
  const before=this.storage.getItem(STORE_KEY);
  const raw=JSON.stringify(clone(model));
  const priorIntent=this.storage.getItem(REVERT_INTENT_KEY);
  this.storage.setItem(STORE_KEY,raw); // failure leaves IndexedDB canonical
  try{
   this.storage.setItem(REVERT_INTENT_KEY,JSON.stringify({
    revision:current.revision+1,fingerprint:localFingerprint(raw)
   }));
   const deleted=await commitPortfolioRecord(this.db,{expectedRevision:this.revision,raw:null,settings:null});
   this.revision=deleted.revision;
  }catch(error){
   // The IDB transaction did not commit, so keep it as the canonical source.
   try{
    if(this.storage.getItem(STORE_KEY)===raw){
     if(before===null)this.storage.removeItem(STORE_KEY);
     else this.storage.setItem(STORE_KEY,before);
    }
    if(priorIntent===null)this.storage.removeItem(REVERT_INTENT_KEY);
    else this.storage.setItem(REVERT_INTENT_KEY,priorIntent);
   }catch{} // never overwrite the original transaction error
   throw error;
  }
  // A crash here leaves MODE_KEY and the exact recovery intent in place. The
  // next startup can finish the switch safely if local bytes still match.
  this.storage.removeItem(MODE_KEY);
  try{this.storage.removeItem(REVERT_INTENT_KEY);}catch{}
  this.mode='local';this.db.close();this.db=null;
  this.legacyRaw=this.storage.getItem(STORE_KEY);
 }
 close(){this.db?.close();this.db=null;}
}
