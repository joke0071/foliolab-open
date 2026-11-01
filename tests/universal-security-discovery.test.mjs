import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAlphaSearch,createAlphaClient,alphaKeyId} from '../src/alpha-vantage.js';
import {discoverSecurityListings,queryProviderListings,rankListings,listingCompatibility,mergeConfirmedListing} from '../src/security-discovery.js';
const hit=(patch={})=>({'1. symbol':'GLBL.DEX','2. name':'Global Dividend ETF','3. type':'ETF','4. region':'XETRA','8. currency':'EUR',...patch});
function memory(){const values=new Map();return {values,read:async k=>structuredClone(values.get(k)),update:async(k,fn)=>{const v=fn(structuredClone(values.get(k)));values.set(k,v);return structuredClone(v);}};}
test('Local name, ISIN and ticker references require neither key nor request',async()=>{
 for(const q of ['VWCE','IE00BK5BQT80','Vanguard FTSE']){const r=await discoverSecurityListings(q,{fmpKey:'OLD'},()=>assert.fail('No request'));assert.equal(r.results[0].isin,'IE00BK5BQT80');}
});
test('Removed search adapters cannot use credentials from old callers',async()=>{
 for(const source of ['fmp','twelve','eodhd'])await assert.rejects(()=>queryProviderListings(source,'GLBL',{[source+'Key']:'OLD'},()=>assert.fail('No retired request')),/entfernt/);
 await assert.rejects(()=>discoverSecurityListings('Unknown',{}),/manuell/);
});
test('Alpha search needs explicit XETRA, DEX suffix, type and currency; no inferred ISIN',()=>{
 const result=parseAlphaSearch({bestMatches:[hit(),hit({'4. region':'Germany'}),hit({'1. symbol':'GLBL.FRK'}),hit({'8. currency':''}),hit({'3. type':'Unknown'})]});
 assert.equal(result.results.length,1);const p=result.results[0];assert.equal(p.symbol,'GLBL');assert.equal(p.mic,'XETR');assert.equal(p.currency,'EUR');assert.equal(p.isin,'');assert.equal(p.eodhdSymbol,'GLBL.XETRA');
 assert.throws(()=>parseAlphaSearch({bestMatches:[hit(),hit({'2. name':'Contradictory identity'})]}),/Widersprüchliche/);
 assert.throws(()=>parseAlphaSearch({Information:'25 requests per day PRIVATE'}),e=>/limit/.test(e.message)&&!e.message.includes('PRIVATE'));
});
test('Search and daily requests share atomic free budget, completion pacing, cache and secrecy',async()=>{
 const store=memory();let time=Date.parse('2026-11-01T12:00:00Z');const calls=[],secret='SYNTHETIC_SEARCH_KEY';
 const deps={store,clock:()=>time,pause:async ms=>{time+=ms;},fetcher:async url=>{const u=new URL(url);calls.push({function:u.searchParams.get('function'),time});time+=3000;return {ok:true,status:200,json:async()=>u.searchParams.get('function')==='TIME_SERIES_DAILY'?{'Meta Data':{'2. Symbol':'VWCE.DEX','3. Last Refreshed':'2026-10-30'},'Time Series (Daily)':{'2026-10-30':{'4. close':'100'}}}:{bestMatches:[{...hit(),echo:secret}],echo:secret}};}};
 const a=createAlphaClient(deps);assert.equal((await a.search('GLBL',secret)).results.length,1);
 await a.search('OTHER',secret);assert.equal(calls.length,2);assert.ok(calls[1].time-calls[0].time>=5500);
 await a.load({kind:'etf',symbol:'VWCE',name:'Vanguard FTSE All-World',isin:'IE00BK5BQT80',currency:'EUR',mic:'XETR',exchange:'Xetra'},secret);assert.equal(calls.length,3);
 await createAlphaClient(deps).search('GLBL',secret);assert.equal(calls.length,3);assert.equal((await store.read('budget:'+await alphaKeyId(secret))).used,3);assert.ok(!JSON.stringify([...store.values]).includes(secret));
 await store.update('budget:'+await alphaKeyId(secret),old=>({...old,used:25}));await assert.rejects(()=>a.search('NEW',secret),/limit/);assert.equal(calls.length,3);
});
test('Listing confirmation changes metadata only, preserves exact financial fields and rejects currency/ISIN conflicts',()=>{
 const candidate=parseAlphaSearch({bestMatches:[hit()]}).results[0];
 const p={isin:'IE00A1234567',currency:'EUR',price:100,quantityExact:'123.456789',costBasisExact:'4567',quoteSource:'Historic source'};
 assert.equal(listingCompatibility(candidate,p).identityConfirmed,false);assert.match(listingCompatibility(candidate,p).warning,/ISIN/);
 const result=mergeConfirmedListing(p,candidate);for(const k of ['quantityExact','costBasisExact','quoteSource','price','isin'])assert.equal(result[k],p[k]);
 assert.equal(listingCompatibility({...candidate,currency:'GBP'},p).ok,false);assert.equal(listingCompatibility({...candidate,isin:'IE00B1234567'},p).ok,false);
 assert.equal(rankListings([{...candidate,symbol:'OTHER'},candidate],'GLBL')[0].symbol,'GLBL');
});
