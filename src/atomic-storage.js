import {backup, safeImport, STORE_KEY,defaultSettings} from './model.js';

// Opt-in transactional storage foundation. Not wired to the live app until the
// async save, restore and reset flows have been migrated and regression-tested.
export const PORTFOLIO_DB = 'foliolab-open-portfolio';
export const PORTFOLIO_DB_VERSION = 1;
const STORE = 'records';
const KEY = 'portfolio';

export function openPortfolioDB(factory = globalThis.indexedDB) {
  if (!factory) return Promise.reject(new Error('IndexedDB ist in diesem Browser nicht verfügbar.'));
  return new Promise((resolve, reject) => {
    const request = factory.open(PORTFOLIO_DB, PORTFOLIO_DB_VERSION);
    let blocked = false;
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onblocked = () => {
      blocked = true;
      reject(new Error('Die Speicheraktualisierung wird durch einen anderen offenen Tab blockiert. Bitte andere FolioLab-Tabs schließen.'));
    };
    request.onerror = () => reject(request.error || new Error('IndexedDB konnte nicht geöffnet werden.'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (blocked) db.close();
      else resolve(db);
    };
  });
}

function portableSettings(settings) {
 if(settings===undefined)return undefined; // old staged records remain readable
 if(settings===null)return null; // deletion tombstone
 const defaults=defaultSettings();
 if(!settings||typeof settings!=='object'||Array.isArray(settings))throw Error('Ungültige Portfoliokonfiguration.');
 const values={};
 for(const [key,reference] of Object.entries(defaults)){
  const value=Object.hasOwn(settings,key)?settings[key]:reference;
  if(typeof value!==typeof reference|| (typeof value==='string'&&value.length>4096))
   throw Error('Ungültige Einstellung: '+key);
  values[key]=value;
 }
 return values;
}

function portablePortfolio(raw) {
  if (typeof raw !== 'string') throw new TypeError('Ein Portfolio muss als JSON-Text vorliegen.');
  // Validation happens before opening a readwrite transaction. Never transfer
  // locally configured API credentials or user-specific private RPC endpoints.
  return backup(safeImport(JSON.parse(raw)));
}

function assertRecord(record) {
  if (record == null) return;
  if (record.schemaVersion !== 1 || !Number.isSafeInteger(record.revision) || record.revision < 1 ||
      (record.raw !== null && typeof record.raw !== 'string') ||
      (record.settings!==undefined && record.settings!==null && (typeof record.settings!=='object'||Array.isArray(record.settings)))) {
    throw new Error('Unbekannte oder beschädigte Speicherrevision. Keine Änderungen vorgenommen.');
  }
  // A structurally plausible but invalid portfolio must not be silently
  // accepted or overwritten. Preserve its original IndexedDB bytes.
  if(record.raw !== null){
    try{safeImport(JSON.parse(record.raw));}
    catch{throw Error('Gespeicherte Portfolio-Daten sind beschädigt. Keine Änderungen vorgenommen.');}
  }
}

export function readPortfolioRecord(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    let record = null;
    const request = tx.objectStore(STORE).get(KEY);
    request.onsuccess = () => { record = request.result ?? null; };
    tx.oncomplete = () => {
      try { assertRecord(record); resolve(record); } catch (error) { reject(error); }
    };
    tx.onabort = () => reject(tx.error || new Error('Lesetransaktion abgebrochen.'));
    tx.onerror = () => {};
  });
}

/**
 * Compare-and-swap within ONE IndexedDB readwrite transaction.
 * expectedRevision=null means the store must be empty. A deletion writes a
 * tombstone, preserving the revision and preventing a stale tab from reviving it.
 * raw=null removes the portfolio without resetting the conflict history.
 */
export function commitPortfolioRecord(db, {expectedRevision, raw,settings}) {
  if (expectedRevision !== null &&
      (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)) {
    return Promise.reject(new TypeError('Ungültige erwartete Speicherrevision.'));
  }
  let portable,portablePrefs;
  try { portable = raw === null ? null : portablePortfolio(raw);portablePrefs=portableSettings(settings); }
  catch (error) { return Promise.reject(error); }
  return new Promise((resolve, reject) => {
    let failure = null;
    let nextRecord = null;
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const request = store.get(KEY);
    request.onsuccess = () => {
      try {
        const current = request.result ?? null;
        assertRecord(current);
        const revision = current?.revision ?? null;
        if (revision !== expectedRevision) {
          throw new Error('Portfolio wurde in einem anderen Tab geändert. Bitte Daten neu laden.');
        }
        if (revision === Number.MAX_SAFE_INTEGER) {
          throw new Error('Speicherrevision kann nicht weiter erhöht werden.');
        }
        nextRecord = {
          schemaVersion: 1,
          revision: (revision ?? 0) + 1,
          raw: portable,
          ...(portablePrefs===undefined?{}:{settings:portablePrefs}),
          deleted: portable === null,
          updatedAt: new Date().toISOString()
        };
        store.put(nextRecord, KEY);
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(nextRecord);
    tx.onabort = () => reject(failure || tx.error || new Error('Speichertransaktion abgebrochen.'));
    tx.onerror = () => {};
  });
}

/**
 * Explicit staging operation only, never called on startup. Keeps the legacy
 * localStorage data byte-identical as rollback material, strips keys from the
 * IDB copy, and reports if the legacy source changed while staging. Adoption
 * must NOT proceed when legacyUnchanged is false.
 */
export async function stageLegacyPortfolio(db, storage, {expectedRevision = null} = {}) {
  const legacyRaw = storage.getItem(STORE_KEY);
  if (legacyRaw === null) throw new Error('Kein bestehendes Portfolio für die Migration gefunden.');
  const record = await commitPortfolioRecord(db, {expectedRevision, raw: legacyRaw});
  return {
    record,
    legacyUnchanged: storage.getItem(STORE_KEY) === legacyRaw,
    legacyPreserved: true
  };
}

/** For explicit disaster recovery downloads only. Bypasses semantic validation;
 * the returned record may contain private API keys under .settings. */
export function readUnverifiedRecord(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly');
  let value=null;
  const req=tx.objectStore(STORE).get(KEY);
  req.onsuccess=()=>{value=req.result??null;};
  tx.oncomplete=()=>resolve(value);
  tx.onabort=()=>reject(tx.error||Error('Wiederherstellungsdaten konnten nicht gelesen werden.'));
 });
}
/**
 * ONLY for explicit user-approved recovery from a damaged IDB record, after
 * downloading original bytes. Compare original record in one readwrite tx, so
 * a concurrently repaired or changed record cannot be overwritten.
 */
export function restoreDamagedRecord(db,{expected,raw,settings}){
 let portable,prefs;
 try{portable=portablePortfolio(raw);prefs=portableSettings(settings);}
 catch(error){return Promise.reject(error);}
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  const storage=tx.objectStore(STORE);
  let failure=null,record=null;
  const read=storage.get(KEY);
  read.onsuccess=()=>{
   try{
    const current=read.result??null;
    if(JSON.stringify(current)!==JSON.stringify(expected))
     throw Error('Speicher wurde zwischen Sicherung und Wiederherstellung verändert. Nichts überschrieben.');
    const revision=current?.revision??0;
    if(!Number.isSafeInteger(revision)||revision<0||revision>=Number.MAX_SAFE_INTEGER)
     throw Error('Beschädigte Versionskennung; automatische Wiederherstellung verweigert.');
    record={schemaVersion:1,revision:revision+1,raw:portable,settings:prefs,deleted:false,updatedAt:new Date().toISOString()};
    storage.put(record,KEY);
   }catch(error){failure=error;tx.abort();}
  };
  tx.oncomplete=()=>resolve(record);
  tx.onabort=()=>reject(failure||tx.error||Error('Wiederherstellung abgebrochen.'));
 });
}
