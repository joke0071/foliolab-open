import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,backup,load,purgeLegacySnapshots,purgeLocalAppData,STORE_KEY} from '../src/model.js';
import {createRequestCache} from '../src/request-cache.js';
import {queryPublicInstruments} from '../src/public-instruments-client.js';

const makeStorage=items=>{
 const store=new Map(Object.entries(items));
 return {get length(){return store.size;},key:i=>[...store.keys()][i]??null,
 getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),
 removeItem:k=>store.delete(k),dump:()=>Object.fromEntries(store)};
};

test('Deleting all app data purges portfolio, migration copies and refresh metadata only',()=>{
 const st=makeStorage({[STORE_KEY]:'{"secret":"private-current"}',
  [STORE_KEY+'-premigration-v1']:'{"secret":"private-legacy-1"}',
  [STORE_KEY+'-premigration-v2']:'{"secret":"private-legacy-2"}',
  'foliolab-open-last-auto-refresh':'123','foliolab-open-unbacked-changes':'1',
  'other-app-prefs':'preserve'});
 assert.equal(purgeLocalAppData(st),5);
 assert.deepEqual(st.dump(),{'other-app-prefs':'preserve'});
 assert.equal(load(st).version,3,'Deleting leaves a clean blank application');
});

test('Credential revocation clears old pre-migration snapshots without deleting portfolio',()=>{
 const model=blankModel();model.settings.eodhdKey='KEY_REVOKED';
 const st=makeStorage({[STORE_KEY]:JSON.stringify(model),
  [STORE_KEY+'-premigration-v1']:'KEY_OLD','other-app-prefs':'preserve'});
 purgeLegacySnapshots(st);
 assert.equal(st.getItem(STORE_KEY+'-premigration-v1'),null);
 assert.equal(JSON.parse(st.getItem(STORE_KEY)).settings.eodhdKey,'KEY_REVOKED');
 assert.equal(st.getItem('other-app-prefs'),'preserve');
});

test('Remote API fetches prohibit cookies, referrers and redirect following',async()=>{
 const cache=createRequestCache();let options;
 await cache.request('https://quote.example.test/price?apikey=TEST_ONLY',{
  fetcher:async(url,config)=>{options=config;return {ok:true,status:200,json:async()=>({price:5})};},
  credentials:'include',referrerPolicy:'unsafe-url',redirect:'follow',attempts:1});
 assert.equal(options.credentials,'omit');
 assert.equal(options.referrerPolicy,'no-referrer');
 assert.equal(options.redirect,'error');
 assert.equal(options.cache,'no-store');
});

test('Optional public instrument search does not transmit browser credentials or referrer',async()=>{
 let request;
 await queryPublicInstruments('https://worker.example.test','World ETF',{fetcher:async(url,opts)=>{
  request={url,opts};
  return {ok:true,status:200,json:async()=>({schemaVersion:1,status:'no_results',results:[]})};
 }});
 assert.equal(request.opts.credentials,'omit');
 assert.equal(request.opts.redirect,'error');
 assert.equal(request.opts.referrerPolicy,'no-referrer');
 assert.ok(!request.url.includes('portfolio'),'The query is instrument-only');
});

test('Unencrypted backups do not retain private RPC tokens or API credentials',()=>{
 const model=blankModel();
 model.settings.solanaRpc='https://rpc.example.test/?api-key=SECRET';
 model.settings.eodhdKey='SECRET';
 assert.doesNotMatch(backup(model),/SECRET|rpc.example.test/);
});
