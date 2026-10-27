import {portableWalletHistory} from './wallet-history-state.js';
/**
 * A portable, encrypted FolioLab backup contains all financial data and,
 * strictly opt-in, app preferences + user-supplied API/RPC credentials.
 * OAuth access/refresh tokens, device vault keys and transient runtime state
 * are NEVER part of this format.
 */
import {defaultSettings} from './model.js';
export const COMPLETE_BACKUP_KIND='FolioLabCompleteBackup';
export const COMPLETE_BACKUP_VERSION=1;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function plain(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)}
function checkedString(v,label,max=8192){
 if(typeof v!=='string'||v.length>max)throw Error(label+' enthält ungültige oder zu lange Werte.');
 return v;
}
export function portableSettings(input){
 if(!plain(input))throw Error('Backup-Einstellungen haben ein ungültiges Format.');
 const defaults=defaultSettings(),result={...defaults};
 for(const [key,value] of Object.entries(defaults)){
  if(!own(input,key))continue;
  const candidate=input[key];
  if(typeof value==='boolean'){
   if(typeof candidate!=='boolean')throw Error('Einstellung '+key+' muss ein Wahrheitswert sein.');
  }else if(typeof value==='string')checkedString(candidate,'Einstellung '+key);
  else throw Error('Unbekannter Einstellungstyp '+key);
  result[key]=candidate;
 }
 return result;
}
export function portableDrivePreferences(input){
 if(!plain(input))throw Error('Drive-Einstellungen sind beschädigt.');
 const id=checkedString(input.clientId??'','OAuth-Client-ID',220).trim();
 if(id&&!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(id))throw Error('Backup enthält eine ungültige OAuth-Client-ID.');
 const mode=input.mode??'off';
 if(!['off','start','daily','weekly','monthly'].includes(mode))throw Error('Backup enthält ungültige Backup-Intervalle.');
 const retention=input.retention??3;
 if(!Number.isInteger(retention)||retention<1||retention>30)throw Error('Backup enthält ungültige Backup-Aufbewahrung.');
 // Deliberately omit last run, folder IDs, access tokens and credentials tied
 // to a specific session / Google account. Folder may be reselected manually.
 return {clientId:id,mode,retention};
}
export function createCompleteBackup(data,configuration=null,history=null){
 if(!plain(data)||(![3,4].includes(data.version)||(data.version===4)!==(data.bookingPresentation!==undefined))||!Array.isArray(data.positions)||!Array.isArray(data.snapshots))throw Error('Ungültige Portfoliodaten.');
 const copy={kind:COMPLETE_BACKUP_KIND,backupVersion:COMPLETE_BACKUP_VERSION,createdAt:new Date().toISOString(),data};
 if(configuration!==null){
  if(!plain(configuration))throw Error('Backup-Konfiguration ungültig.');
  copy.configuration={
   settings:portableSettings(configuration.settings),
   drive:portableDrivePreferences(configuration.drive)
  };
 }
 if(history!==null)copy.walletHistory=portableWalletHistory(history);
 return copy;
}
export function unpackCompleteBackup(raw){
 if(!plain(raw)||raw.kind!==COMPLETE_BACKUP_KIND||raw.backupVersion!==COMPLETE_BACKUP_VERSION||!plain(raw.data))
  throw Error('Unbekanntes vollständiges Backupformat.');
 const configuration=raw.configuration===undefined?null:raw.configuration;
 let validated=null;
 if(configuration!==null){
  if(!plain(configuration))throw Error('Backup-Konfiguration beschädigt.');
  validated={settings:portableSettings(configuration.settings),drive:portableDrivePreferences(configuration.drive)};
 }
 return {data:raw.walletHistory?{...raw.data,walletHistory:portableWalletHistory(raw.walletHistory)}:raw.data,configuration:validated};
}
/** Local unencrypted JSON exports remain intentionally credential-free. */
export function hasPortableCredentials(config){
 if(!config?.settings)return false;
 return ['twelveKey','eodhdKey','fmpKey','coinGeckoKey','etherscanKey','binplorerKey',
 'eodhdWorkerAccessToken'].some(k=>Boolean(config.settings[k]))
 || /(?:[?&](?:api[_-]?key|token|secret)=|\/api\/)/i.test(config.settings.solanaRpc||'');
}
