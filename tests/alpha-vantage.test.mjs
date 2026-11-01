import test from 'node:test';
import assert from 'node:assert/strict';
import {alphaListing,parseAlphaDaily,reserveAlphaBudget,createAlphaClient,alphaKeyId,withProviderAccess} from '../src/alpha-vantage.js';
import {referenceSearch} from '../src/reference-listings.js';
import {marketSourceOptions,fetchSecurityQuote} from '../src/security-sources.js';
import {blankModel,backup} from '../src/model.js';
import {createCompleteBackup,unpackCompleteBackup,hasPortableCredentials} from '../src/complete-backup.js';
const now=Date.parse('2026-11-01T12:00:00Z');
const position=symbol=>({...referenceSearch(symbol).find(p=>p.symbol===symbol),kind:'etf',quantityExact:'1'});
const daily=(symbol='VWCE.DEX',value='123.4567')=>({'Meta Data':{'2. Symbol':symbol,'3. Last Refreshed':'2026-10-30'},'Time Series (Daily)':{'2026-10-29':{'4. close':'121','5. adjusted close':'900'},'2026-10-30':{'4. close':value,'5. adjusted close':'999'}}});
function memory(){const values=new Map();let tail=Promise.resolve();return {values,read:async key=>structuredClone(values.get(key)),update(key,change){const job=tail.then(()=>{const next=change(structuredClone(values.get(key)));values.set(key,structuredClone(next));return structuredClone(next);});tail=job.catch(()=>{});return job;}};}
test('Only four proven ETF ISIN/EUR/XETR identities map to DEX; contradictory venues never substitute',()=>{
 for(const s of ['VWCE','XDEM','XDEQ','5MVL'])assert.equal(alphaListing(position(s)),s+'.DEX');
 for(const patch of [{isin:'IE00WRONG000'},{isin:''},{currency:'USD'},{mic:'XFRA'},{exchange:'Frankfurt'},{kind:'stock'},{symbol:'OTHER'},{fmpSymbol:'VWCE.L'}])
  assert.throws(()=>alphaListing({...position('VWCE'),...patch}));
 assert.deepEqual(marketSourceOptions(position('VWCE'),{alphaVantageKey:'test',fmpKey:'test',twelveKey:'test'}),['alpha','fmp','twelve']);
 assert.deepEqual(marketSourceOptions(position('VWCE'),{alphaVantageKey:'test',securitySource:'alpha'}),['alpha']);
});
test('Daily raw close is used; exact symbol, currency, calendar, finite price and provider date are checked',()=>{
 const result=parseAlphaDaily(daily(),'VWCE.DEX');assert.equal(result.points.at(-1).total,123.4567);
 for(const data of [daily('VWCE.FRK'),{...daily(),'Meta Data':{'2. Symbol':'VWCE.DEX','3. Last Refreshed':'2026-10-29'}},{...daily(),'Time Series (Daily)':{'2026-02-30':{'4. close':'1'}}},daily('VWCE.DEX','0'),daily('VWCE.DEX','NaN'),{...daily(),'Meta Data':{...daily()['Meta Data'],currency:'USD'}}])assert.throws(()=>parseAlphaDaily(data,'VWCE.DEX'));
 for(const data of [{Information:'premium endpoint SECRET'},{Note:'25 requests per day SECRET'},{'Error Message':'SECRET https://bad.invalid/?apikey=SECRET'}])assert.throws(()=>parseAlphaDaily(data,'VWCE.DEX'),e=>!e.message.includes('SECRET')&&!e.message.includes('https://'));
});
test('Budget reservations are bounded at 25/day, spaced 2.5 seconds and reset on UTC day rollover',()=>{
 let record;
 for(let i=0;i<6;i++){record=reserveAlphaBudget(record,now+i*2500);assert.equal(record.used,i+1);assert.equal(record.scheduledAt,now+i*2500);}
 assert.throws(()=>reserveAlphaBudget({day:'2026-11-01',used:25,nextAt:0,blockedUntil:0},now),/limit/);
 assert.throws(()=>reserveAlphaBudget({day:'2026-11-01',used:1,nextAt:now+20000,blockedUntil:0},now),/ausgelastet/);
 assert.equal(reserveAlphaBudget({day:'2026-10-31',used:25},now).used,1);
 assert.throws(()=>reserveAlphaBudget({day:'2026-11-01',used:-1,nextAt:0,blockedUntil:0},now));
});
test('Concurrent quote/history reads coalesce; new client reuses IDB-shaped daily cache without storing the key',async()=>{
 const store=memory();let calls=0,time=now;const key='SYNTHETIC_PRIVATE_KEY';
 const fetcher=async url=>{calls++;const u=new URL(url);assert.equal(u.searchParams.get('function'),'TIME_SERIES_DAILY');assert.equal(u.searchParams.get('outputsize'),'compact');assert.equal(u.searchParams.get('apikey'),key);return {ok:true,status:200,json:async()=>daily(u.searchParams.get('symbol'))};};
 const deps={store,clock:()=>time,pause:async ms=>{time+=ms;},fetcher},a=createAlphaClient(deps);
 const result=await Promise.all([a.load(position('VWCE'),key),a.load(position('VWCE'),key),a.load(position('XDEM'),key)]);
 assert.equal(calls,2);assert.ok(time>=now+2500);assert.equal(result[0].points.at(-1).total,123.4567);
 result[0].points[0].total=9999;
 assert.equal((await createAlphaClient(deps).load(position('VWCE'),key)).points[0].total,121);
 assert.equal(calls,2);assert.ok(!JSON.stringify([...store.values]).includes(key));
 assert.equal(store.values.get('budget:'+await alphaKeyId(key)).used,2);
});
test('Provider limit response is not cached as a price; cooldown prevents repeated probes and keeps quota charged',async()=>{
 const store=memory();let calls=0;
 const a=createAlphaClient({store,clock:()=>now,fetcher:async()=>{calls++;return {ok:true,status:200,json:async()=>({Information:'Please spread requests sparingly, 1 request per second'})};}});
 await assert.rejects(()=>a.load(position('VWCE'),'test'),/limit/);
 await assert.rejects(()=>a.load(position('VWCE'),'test'),/limit/);
 assert.equal(calls,1);assert.equal(await store.read('daily:VWCE.DEX'),undefined);
});
test('Confirmed FMP402 and Twelve plan404 suppress repeated automatic requests but allow explicit recheck',async()=>{
 for(const source of ['fmp','twelve']){
  let calls=0;const key='SYNTHETIC_SECRET',settings={[source==='fmp'?'fmpKey':'twelveKey']:key,securitySource:source};
  const fetcher=async()=>{calls++;return {ok:false,status:source==='fmp'?402:404,json:async()=>({code:404,message:'This symbol is available starting with the Grow or Venture plan. SECRET'})};};
  await assert.rejects(()=>fetchSecurityQuote(position('VWCE'),settings,fetcher),e=>/Tarif|tarif/.test(e.message)&&!e.message.includes(key)&&!e.message.includes('SECRET'));
  await assert.rejects(()=>fetchSecurityQuote(position('VWCE'),settings,fetcher));assert.equal(calls,1);
  await assert.rejects(()=>fetchSecurityQuote(position('VWCE'),{...settings,recheckProviderAccess:true},fetcher));assert.equal(calls,2);
 }
});
test('A generic 404 is not guessed to be a tariff denial or permanently suppressed',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return {ok:false,status:404,json:async()=>({code:404,message:'No such symbol'})};};
 for(let i=0;i<2;i++)await assert.rejects(()=>fetchSecurityQuote(position('VWCE'),{twelveKey:'test'},fetcher));
 assert.equal(calls,2);
});
test('Alpha key is retained only in opted-in complete configuration and never in plain portfolio export',()=>{
 const m=blankModel();m.settings.alphaVantageKey='SYNTHETIC_ALPHA_SECRET';m.settings.securitySource='alpha';
 assert.ok(!backup(m).includes('SYNTHETIC_ALPHA_SECRET'));
 const full=createCompleteBackup(m,{settings:m.settings,drive:{}});
 const restored=unpackCompleteBackup(full);assert.equal(restored.configuration.settings.alphaVantageKey,'SYNTHETIC_ALPHA_SECRET');
 assert.ok(hasPortableCredentials(restored.configuration));
});
