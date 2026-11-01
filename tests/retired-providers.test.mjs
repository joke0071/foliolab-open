import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,backup,persist,load,retireLegacyProviderCredentials,STORE_KEY} from '../src/model.js';
import {portableSettings,createCompleteBackup,unpackCompleteBackup,hasPortableCredentials} from '../src/complete-backup.js';
import {withoutRetiredSettings,RETIRED_PROVIDER_KEYS} from '../src/retired-providers.js';
import {marketSourceOptions,fetchSecurityQuote,fetchSecurityHistory} from '../src/security-sources.js';
const old={fmpKey:'SYNTHETIC_REMOVED_FMP',twelveKey:'SYNTHETIC_REMOVED_TWELVE',eodhdKey:'SYNTHETIC_REMOVED_EODHD',securitySource:'fmp'};
const active={alphaVantageKey:'ACTIVE_ALPHA',marketstackKey:'ACTIVE_MARKETSTACK',coinGeckoKey:'ACTIVE_CG',etherscanKey:'ACTIVE_ETH',binplorerKey:'ACTIVE_BNB',eodhdWorkerEndpoint:'https://own.workers.dev',eodhdWorkerAccessToken:'ACTIVE_WORKER_ACCESS_TOKEN_123456789',solanaRpc:'https://rpc.example/?api-key=ACTIVE_RPC'};
const storage=raw=>{const m=new Map(raw?[[STORE_KEY,raw]]:[]);return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
test('Only retired keys and selectors are removed; unknown fields and active access survive',()=>{const input={...old,...active,customPreference:'preserve'},out=withoutRetiredSettings(input);for(const k of RETIRED_PROVIDER_KEYS)assert.ok(!Object.hasOwn(out,k));assert.equal(out.securitySource,'auto');assert.equal(out.customPreference,'preserve');for(const k of Object.keys(active))assert.equal(out[k],active[k]);assert.equal(input.fmpKey,old.fmpKey);});
test('Legacy physical cleanup, save and reload remove retired values without financial changes or deleting original backups',()=>{
 const model=blankModel();model.settings={...model.settings,...old,...active};model.customFutureFinancial={exact:'123456789.000000001'};const original=JSON.stringify(model),s=storage(original);s.setItem(STORE_KEY+'-premigration-v1',original);
 assert.equal(retireLegacyProviderCredentials(s),true);const actual=JSON.parse(s.getItem(STORE_KEY));assert.deepEqual({...actual,settings:{}},{...JSON.parse(original),settings:{}});assert.equal(s.getItem(STORE_KEY+'-premigration-v1'),original);assert.equal(retireLegacyProviderCredentials(s),false);
 const loaded=load(s);loaded.settings={...loaded.settings,...old};persist(loaded,s);for(const key of RETIRED_PROVIDER_KEYS)assert.equal(load(s).settings[key],undefined);assert.ok(!s.getItem(STORE_KEY).includes('SYNTHETIC_REMOVED'));
});
test('Complete new backups and legacy restore/re-export exclude retired keys, preserve opt-in active credentials and historical provenance',()=>{
 const m=blankModel();m.settings={...m.settings,...old,...active};const data=JSON.parse(backup(m));data.legacyHistoricalSource={provider:'fmp',symbol:'VWCE.DE',date:'2025-01-02',price:'100'};
 const oldBackup={kind:'FolioLabCompleteBackup',backupVersion:1,data:{...data,settings:{...old}},configuration:{settings:m.settings,drive:{}}};
 const restored=unpackCompleteBackup(oldBackup),fresh=createCompleteBackup(restored.data,restored.configuration);assert.ok(!JSON.stringify(fresh).includes('SYNTHETIC_REMOVED'));for(const k of RETIRED_PROVIDER_KEYS)assert.ok(!Object.hasOwn(fresh.configuration.settings,k));for(const k of Object.keys(active))assert.equal(fresh.configuration.settings[k],active[k]);assert.deepEqual(fresh.data.legacyHistoricalSource,data.legacyHistoricalSource);assert.ok(JSON.stringify(oldBackup).includes('SYNTHETIC_REMOVED'));assert.equal(hasPortableCredentials({settings:old}),false);assert.equal(hasPortableCredentials({settings:active}),true);assert.equal(portableSettings({...old}).securitySource,'auto');
});
test('Old callers can never issue retired quote or history requests; direct worker access stays independent',async()=>{
 const p={kind:'etf',name:'Vanguard FTSE All-World',symbol:'VWCE',isin:'IE00BK5BQT80',currency:'EUR',exchange:'Xetra',mic:'XETR'};assert.deepEqual(marketSourceOptions(p,{...old,securitySource:'auto'}),[]);for(const source of ['auto','fmp','twelve','eodhd']){const settings={...old,securitySource:source};await assert.rejects(()=>fetchSecurityQuote(p,settings,()=>assert.fail('No retired network')));await assert.rejects(()=>fetchSecurityHistory(p,settings,30,()=>assert.fail('No retired network')));}assert.deepEqual(marketSourceOptions(p,{...active,securitySource:'auto'}),['alpha','marketstack','eodhd']);
});
