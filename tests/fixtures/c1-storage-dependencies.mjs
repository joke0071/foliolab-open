// Explicit dependency doubles for adapter control-flow regression, NOT IndexedDB.
export const PORTFOLIO_DB='foliolab-open-portfolio';
export const STORE_KEY='foliolab-open-v1';
export const state={};
export function reset(){Object.assign(state,{calls:[],record:{schemaVersion:1,revision:1,raw:JSON.stringify(blankModel()),settings:{},deleted:false},beforeCommit:null,beforeRead:null});}
export function blankModel(){return {version:5,providers:[],settings:{}};}
export const defaultSettings=()=>({});
export const portableSettings=value=>structuredClone(value);
export const safeImport=value=>structuredClone(value);
export const backup=value=>JSON.stringify(value);
export function load(storage){state.calls.push('load');return JSON.parse(storage.getItem(STORE_KEY));}
export function persist(value,storage){state.calls.push('persist');storage.setItem(STORE_KEY,JSON.stringify(value));}
export function purgeLocalAppData(storage){state.calls.push('purge');storage.removeItem(STORE_KEY);}
export function retireLegacyProviderCredentials(){state.calls.push('retire-legacy');}
export async function openPortfolioDB(){
 state.calls.push('open-v1');
 return new Promise((resolve,reject)=>{const r=globalThis.indexedDB.open(PORTFOLIO_DB,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
export async function readPortfolioRecord(){state.calls.push('read');state.beforeRead?.();return structuredClone(state.record);}
export async function readUnverifiedRecord(){state.calls.push('unverified');return structuredClone(state.record);}
export async function readPortfolioSyncRecord(){state.calls.push('read-sync');return {portfolio:structuredClone(state.record),sync:null};}
export async function retirePortfolioCredentials(){state.calls.push('retire-idb');return structuredClone(state.record);}
export async function commitPortfolioRecord(db,{raw,settings}){
 state.calls.push('commit');state.beforeCommit?.();
 state.record={...state.record,raw,settings,deleted:raw===null,revision:state.record.revision+1};return structuredClone(state.record);
}
export async function adoptPortfolioRecord(db,{raw,settings}){
 state.calls.push('adopt');state.record={schemaVersion:1,raw,settings,deleted:false,revision:1};return structuredClone(state.record);
}
export async function restoreDamagedRecord(db,{expected,raw,settings}){
 state.calls.push('restore');if(expected.revision!==state.record.revision)throw Error('stale');
 state.record={...state.record,raw,settings,revision:state.record.revision+1};return structuredClone(state.record);
}
