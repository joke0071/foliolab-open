import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequestCache} from '../src/request-cache.js';
import {securityQuote,historicalExchangeRate,exchangeRateQuote} from '../src/market.js';
import {assetKey,listingId,rebuildAssets} from '../src/assets.js';
import {portfolioTwr,performanceIssues,portfolioXirr} from '../src/performance.js';
import {blankModel,createProvider,createAccount,createPosition,snapshot,safeImport,backup} from '../src/model.js';
const ok=payload=>({ok:true,status:200,headers:{get:()=>null},json:async()=>payload});
const fxPayload=(date,rate)=>({date,base:'USD',rates:{EUR:rate}});
test('Cache deduplicates overlapping requests, isolates returned objects and respects TTL',async()=>{
 let now=1000,calls=0;const cache=createRequestCache({clock:()=>now});
 const mock=async()=>{calls++;return ok({price:100,seen:calls});};
 const [a,b]=await Promise.all([cache.request('https://api.example.test/v1',{fetcher:mock,ttlMs:100}),
 cache.request('https://api.example.test/v1',{fetcher:mock,ttlMs:100})]);
 assert.equal(calls,1);a.price=999;assert.equal(b.price,100);
 assert.equal((await cache.request('https://api.example.test/v1',{fetcher:mock,ttlMs:100})).price,100);
 assert.equal(calls,1);now+=101;
 assert.equal((await cache.request('https://api.example.test/v1',{fetcher:mock,ttlMs:100})).seen,2);
 assert.equal(calls,2);
});
test('429 Retry-After is respected without an unbounded retry loop',async()=>{
 let attempts=0;const waits=[];const cache=createRequestCache({pause:async t=>waits.push(t),random:()=>0});
 const mock=async()=>++attempts===1?{ok:false,status:429,headers:{get:k=>k==='Retry-After'?'2':null}}:ok({result:'recovered'});
 assert.deepEqual(await cache.request('https://api.example.test/rate',{fetcher:mock,ttlMs:1}),{result:'recovered'});
 assert.equal(attempts,2);assert.deepEqual(waits,[2000]);
});
test('Persistent token secrecy: only memory cache, separated by key and fetch function',async()=>{
 const cache=createRequestCache();let calls=0;const f=async()=>{calls++;return ok({ok:true});};
 await cache.request('https://api.example.test/quote',{fetcher:f,headers:{authorization:'my-key-1'},ttlMs:10000});
 await cache.request('https://api.example.test/quote',{fetcher:f,headers:{authorization:'my-key-2'},ttlMs:10000});
 assert.equal(calls,2);assert.deepEqual(Object.keys(cache.stats()).sort(),['active','entries','pending','queued']);
 cache.clear();assert.equal(cache.stats().entries,0);
});
test('Security quotes require confirmed exchange, ticker, currency and MIC',async()=>{
 const good=()=>ok({symbol:'VWCE',exchange:'Xetra',mic_code:'XETR',currency:'EUR',close:'125.25',datetime:'2026-10-21'});
 const listing={symbol:'VWCE',exchange:'Xetra',mic:'XETR',currency:'EUR',isin:'IE00BK5BQT80'};
 const quote=await securityQuote(listing,'USER',async url=>{const q=new URL(url);assert.equal(q.pathname,'/quote');assert.equal(q.searchParams.get('exchange'),'Xetra');return good();});
 assert.equal(quote.price,125.25);assert.equal(quote.quality,'verified-listing');
 await assert.rejects(()=>securityQuote({...listing,exchange:'',mic:''},'USER',async()=>good()),/Handelsplatz/);
 for(const wrong of [{currency:'USD'},{symbol:'VWRL'},{exchange:'NYSE'},{mic_code:'XNYS'},{isin:'US1234567890'}]){
  const f=async()=>ok({...await good().json(),...wrong});
  await assert.rejects(()=>securityQuote(listing,'USER',f),/abweicht|weicht ab|Ticker|Handelsplatz|MIC|ISIN/);
 }
});
test('Historical reference FX uses exact request date and reports prior working day',async()=>{
 const f=async url=>{const u=new URL(url);assert.equal(u.pathname,'/v1/2026-10-18');assert.equal(u.searchParams.get('base'),'USD');return ok(fxPayload('2026-10-16',0.86));};
 assert.deepEqual(await historicalExchangeRate('USD','2026-10-18',f),{rate:.86,date:'2026-10-16',requestedDate:'2026-10-18',source:'Frankfurter',reference:true});
 await assert.rejects(()=>historicalExchangeRate('USD','2027-01-01',f),/Zukunft/);
 await assert.rejects(()=>historicalExchangeRate('USD','2026-10-18',async()=>ok(fxPayload('2026-10-01',.9))),/gültiger/);
});
test('Daily reference quote records publication date and source',async()=>{
 const result=await exchangeRateQuote('USD','',async url=>{assert.ok(url.includes('/v1/latest'));return ok(fxPayload('2026-10-21',.89));});
 assert.deepEqual(result,{rate:.89,date:'2026-10-21',source:'Frankfurter',reference:true});
});
function sample(){
 const m=blankModel(),provider=createProvider({name:'Broker'});m.providers.push(provider);
 const a=createAccount({name:'Depot',type:'securities',providerId:provider.id},m);m.accounts.push(a);
 const p=createPosition({providerId:provider.id,accountId:a.id,name:'ETF',kind:'etf',quantity:2,price:100,isin:'IE00BK5BQT80',symbol:'VWCE',exchange:'Xetra',mic:'XETR',currency:'EUR',quoteSource:'Twelve Data',quoteAsOf:'2026-10-21',quoteFetchedAt:'2026-10-21T10:00:00Z',quoteQuality:'verified-listing'},m);
 m.positions.push(p);return {m,p};
}
test('Security ISIN is stable while listings at different exchanges have distinct IDs',()=>{
 const {m,p}=sample();const other=createPosition({...p,id:undefined,symbol:'VWRL',exchange:'Euronext',mic:'XAMS',currency:'EUR'},m);m.positions.push(other);rebuildAssets(m);
 assert.equal(assetKey(p),assetKey(other));assert.notEqual(listingId(p),listingId(other));
 assert.equal(m.assets.length,1);assert.equal(m.assets[0].listings.length,2);
});
test('Position quote source, exact conversion, listing identity survives backup roundtrip',()=>{
 const {m,p}=sample();p.fxRateExact='1';rebuildAssets(m);
 const first=JSON.parse(backup(m)),second=JSON.parse(backup(safeImport(first)));
 assert.deepEqual(second,first);
 assert.equal(second.positions[0].mic,'XETR');
 assert.equal(second.positions[0].quoteSource,'Twelve Data');
 assert.equal(second.positions[0].quoteAsOf,'2026-10-21');
 assert.equal(second.positions[0].listingId,first.positions[0].listingId);
});
test('TWR is exact on verified cashflow-free endpoints and refuses any unvalued flow',()=>{
 const {m}=sample();
 snapshot(m,'2025-01-01','confirmed',{manualTotalEUR:'1000'});
 snapshot(m,'2026-01-01','confirmed',{manualTotalEUR:'1100'});
 assert.ok(Math.abs(portfolioTwr(m,'2025-01-01','2026-01-01')-.10)<1e-9);
 m.externalCashFlows=[{id:'external',date:'2025-07-01',amountEUR:200}];
 assert.equal(portfolioTwr(m,'2025-01-01','2026-01-01'),null);
 assert.notEqual(portfolioXirr(m,'2025-01-01','2026-01-01'),null);
 m.externalCashFlows=[];m.snapshots[0].valuationStatus='partial';
 assert.equal(portfolioTwr(m,'2025-01-01','2026-01-01'),null);
 assert.ok(performanceIssues(m,'2025-01-01','2026-01-01').some(x=>x.includes('Stichtage')));
});
