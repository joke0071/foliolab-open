import test from 'node:test';
import assert from 'node:assert/strict';
import {createMarketstackClient,marketstackListing,parseMarketstackDaily,reserveMarketstackBudget,expectedMarketstackDate} from '../src/marketstack.js';
import {referenceSearch} from '../src/reference-listings.js';
import {blankModel,backup,safeImport} from '../src/model.js';
import {createCompleteBackup,unpackCompleteBackup,hasPortableCredentials} from '../src/complete-backup.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';
import {classifyMarketFailure} from '../src/market-diagnostics.js';
const now=Date.parse('2026-11-01T12:00:00Z'),position=symbol=>referenceSearch(symbol)[0];
const memory=()=>{const values=new Map();return {values,read:async k=>structuredClone(values.get(k)),update:async(k,fn)=>{const result=fn(structuredClone(values.get(k)));values.set(k,structuredClone(result));return structuredClone(result);}};};
function daily(p){const {symbol,reference}=marketstackListing(p);return {pagination:{count:2,total:2},untrustedDiagnostics:{echoedKey:'SYNTHETIC_PRIVATE_MARKETSTACK'},data:['2026-10-29','2026-10-30'].map((date,i)=>({symbol,name:reference.label,exchange:'XETR',price_currency:'EUR',date:date+'T00:00:00+0000',close:100+i,adj_close:9999}))};}
test('Marketstack uses only the four proven exact ISIN/EUR/XETR listings and raw closes',()=>{
 for(const symbol of ['VWCE','XDEM','XDEQ','5MVL']){const p=position(symbol),r=parseMarketstackDaily(daily(p),p,now);assert.equal(r.verifiedSymbol,symbol+'.DE');assert.equal(r.points.at(-1).total,101);}
 for(const change of [{isin:'IE00BG0SKF03'},{currency:'USD'},{mic:'XFRA'},{symbol:'UNKNOWN'},{isin:''}])assert.throws(()=>marketstackListing({...position('VWCE'),...change}));
});
test('Marketstack rejects wrong instruments, currency, MIC, names, dates, malformed prices, partial pages and conflicting bars',()=>{
 const p=position('VWCE');
 for(const change of [{symbol:'VWCE.F'},{exchange:'XFRA'},{price_currency:'USD'},{name:'Unrelated security'},{isin:'IE00BG0SKF03'},{date:'2026-02-31T00:00:00+0000'},{date:'2026-11-02T00:00:00+0000'},{close:true},{close:0},{close:'NaN'}]){const d=daily(p);Object.assign(d.data[0],change);assert.throws(()=>parseMarketstackDaily(d,p,now));}
 const partial=daily(p);partial.pagination.total=3;assert.throws(()=>parseMarketstackDaily(partial,p,now),/vollständig/);
 const conflict=daily(p);conflict.data.push({...conflict.data[0],close:55});delete conflict.pagination;assert.throws(()=>parseMarketstackDaily(conflict,p,now),/Widersprüchliche/);
});
test('100 monthly reservations count attempts, preserve spacing and reset only in a new UTC month',()=>{
 let state;for(let i=0;i<100;i++)state=reserveMarketstackBudget(state,now+i*500);
 assert.equal(state.used,100);assert.throws(()=>reserveMarketstackBudget(state,now+50000),/Monatskontingent/);
 assert.equal(classifyMarketFailure(Error('Marketstack: lokales Monatskontingent von 100 Anfragen erreicht.')).code,'rate');
 assert.equal(reserveMarketstackBudget(state,Date.parse('2026-12-01T00:00:00Z')).used,1);
 for(const bad of [-1,101,1.5,'1'])assert.throws(()=>reserveMarketstackBudget({month:'2026-11',used:bad,nextAt:0,blockedUntil:0},now));
});
test('Quote/history coalesce and a new client reuses public daily cache without retaining echoed credentials',async()=>{
 const store=memory();let time=now,calls=0;
 const deps={store,clock:()=>time,pause:async ms=>{time+=ms;},fetcher:async url=>{calls++;const u=new URL(url);assert.equal(u.hostname,'api.marketstack.com');assert.equal(u.pathname,'/v2/eod');assert.equal(u.searchParams.get('symbols'),'VWCE.DE');assert.equal(u.searchParams.get('access_key'),'SYNTHETIC_PRIVATE_MARKETSTACK');assert.equal(u.searchParams.get('exchange'),'XETR');assert.equal(u.searchParams.get('limit'),'1000');return {ok:true,status:200,json:async()=>daily(position('VWCE'))};}};
 const client=createMarketstackClient(deps);await Promise.all([client.load(position('VWCE'),'SYNTHETIC_PRIVATE_MARKETSTACK'),client.load(position('VWCE'),'SYNTHETIC_PRIVATE_MARKETSTACK')]);
 assert.equal(calls,1);assert.equal((await createMarketstackClient(deps).load(position('VWCE'),'SYNTHETIC_PRIVATE_MARKETSTACK')).cached,true);
 assert.equal(calls,1);assert.ok(!JSON.stringify([...store.values]).includes('SYNTHETIC_PRIVATE_MARKETSTACK'));
});
test('Four symbols consume four units rather than one; Friday closes are reused over weekend and before Monday close',async()=>{
 const store=memory();let time=Date.parse('2026-10-30T23:00:00Z'),calls=0;
 const deps={store,clock:()=>time,pause:async ms=>{time+=ms;},fetcher:async url=>{calls++;const symbol=new URL(url).searchParams.get('symbols').split('.')[0];return {ok:true,status:200,json:async()=>daily(position(symbol))};}};
 const client=createMarketstackClient(deps);for(const symbol of ['VWCE','XDEM','XDEQ','5MVL'])await client.load(position(symbol),'test');assert.equal(calls,4);
 assert.equal([...store.values.entries()].find(([k])=>k.startsWith('budget:'))[1].used,4);
 time=now;await createMarketstackClient(deps).load(position('VWCE'),'test');assert.equal(calls,4);
 time=Date.parse('2026-11-02T20:00:00Z');await createMarketstackClient(deps).load(position('VWCE'),'test');assert.equal(calls,4);
 time=Date.parse('2026-11-02T22:00:00Z');await createMarketstackClient(deps).load(position('VWCE'),'test');assert.equal(calls,5);
 assert.equal(expectedMarketstackDate(Date.parse('2026-11-01T23:00:00Z')),'2026-10-30');
});
test('Rate limits, upstream credential echoes and unavailable IDB cannot cause uncontrolled retries or cached false prices',async()=>{
 const store=memory();let calls=0;
 const client=createMarketstackClient({store,clock:()=>now,fetcher:async()=>{calls++;return {ok:false,status:429};}});
 await assert.rejects(client.load(position('VWCE'),'test'),/Ratenlimit/);await assert.rejects(client.load(position('VWCE'),'test'),/Anfragelimit/);assert.equal(calls,1);
 assert.equal([...store.values.keys()].filter(k=>k.startsWith('daily:')).length,0);
 const blocked=createMarketstackClient({store:{read:async()=>{throw Error('private');}},fetcher:async()=>{calls++;}});
 await assert.rejects(blocked.load(position('VWCE'),'test'),/Lokaler Kurscache/);assert.equal(calls,1);
 const denied={error:{code:'function_access_restricted',message:'SYNTHETIC_PRIVATE_MARKETSTACK'}};
 assert.throws(()=>parseMarketstackDaily(denied,position('VWCE'),now),e=>!e.message.includes('SYNTHETIC_PRIVATE_MARKETSTACK'));
});
test('An initial morning read does not hide the new close after the same-day EOD boundary',async()=>{
 const store=memory();let time=Date.parse('2026-11-02T10:00:00Z'),calls=0;
 const client=createMarketstackClient({store,clock:()=>time,pause:async ms=>{time+=ms;},fetcher:async()=>{calls++;const result=daily(position('VWCE'));if(calls===2)result.data[1].date='2026-11-02T00:00:00+0000';return {ok:true,status:200,json:async()=>result};}});
 await client.load(position('VWCE'),'test');time=Date.parse('2026-11-02T22:00:00Z');
 assert.equal((await client.load(position('VWCE'),'test')).points.at(-1).date,'2026-11-02');assert.equal(calls,2);
 await client.load(position('VWCE'),'test');assert.equal(calls,2);
});
test('Marketstack key is opt-in encrypted configuration, never canonical financial JSON',async()=>{
 const model=blankModel();model.settings.marketstackKey='SYNTHETIC_PRIVATE_MARKETSTACK';
 const raw=backup(model);assert.ok(!raw.includes('SYNTHETIC_PRIVATE_MARKETSTACK'));
 const full=createCompleteBackup(JSON.parse(raw),{settings:model.settings,drive:{}});
 assert.equal(hasPortableCredentials(full.configuration),true);
 const encrypted=await encryptBackup(JSON.stringify(full),'synthetic-password');
 const restored=unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(encrypted),'synthetic-password')));
 assert.equal(restored.configuration.settings.marketstackKey,'SYNTHETIC_PRIVATE_MARKETSTACK');
 assert.equal(safeImport(restored.data).settings.marketstackKey,'');
});
