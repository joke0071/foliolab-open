/**
 * Opt-in canonical IndexedDB portfolio storage with a legacy recovery copy.
 * No background migration. Keys remain on this device, and downloaded backups
 * always exclude credentials. Switching modes requires explicit user consent.
 */
import {blankModel,defaultSettings,load,persist,backup,safeImport,STORE_KEY} from './model.js';
import {openPortfolioDB,readPortfolioRecord,commitPortfolioRecord,readUnverifiedRecord,restoreDamagedRecord} from './atomic-storage.js';
export const MODE_KEY='foliolab-open-storage-mode';
export const MODE_VALUE='idb-v1';
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
  return restored(record);
 }
 async reload(){
  if(!this.isIndexedDB)return load(this.storage);
  const current=await readPortfolioRecord(this.db);
  if(!current)throw Error('Der aktive IndexedDB-Datensatz fehlt.');
  this.revision=current.revision;
  return restored(current);
 }
 async save(model){
  if(!this.isIndexedDB){
   persist(model,this.storage);
   this.legacyRaw=this.storage.getItem(STORE_KEY);
   return;
  }
  if(!this.db)throw Error('IndexedDB-Verbindung geschlossen. Seite neu laden.');
  const draft=clone(model);
  const current=await commitPortfolioRecord(this.db,{
   expectedRevision:this.revision,raw:backup(draft),settings:draft.settings
  });
  this.revision=current.revision; // only after tx.oncomplete
 }
 async migrate(model){
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
 async removeAll(){
  if(this.isIndexedDB){
   const record=await commitPortfolioRecord(this.db,{expectedRevision:this.revision,raw:null,settings:null});
   this.revision=record.revision;
   return;
  }
  // localStorage only: the caller will purge owned keys.
 }
 async revert(model){
  if(!this.isIndexedDB)throw Error('Es ist bereits lokale Speicherung aktiv.');
  const current=await readPortfolioRecord(this.db);
  if(current?.revision!==this.revision)throw Error('Ein anderer Tab hat den IndexedDB-Datensatz geändert. Zuerst neu laden.');
  const before=this.storage.getItem(STORE_KEY);
  const raw=JSON.stringify(clone(model));
  this.storage.setItem(STORE_KEY,raw); // failure leaves IndexedDB canonical
  try{
   const deleted=await commitPortfolioRecord(this.db,{expectedRevision:this.revision,raw:null,settings:null});
   this.revision=deleted.revision;
  }catch(error){
   // Restore recovery bytes only if this write is still ours.
   if(this.storage.getItem(STORE_KEY)===raw){
    if(before===null)this.storage.removeItem(STORE_KEY);
    else this.storage.setItem(STORE_KEY,before);
   }
   throw error;
  }
  this.storage.removeItem(MODE_KEY); // final marker switch
  this.mode='local';this.db.close();this.db=null;
 }
 close(){this.db?.close();this.db=null;}
}
