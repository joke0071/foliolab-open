import test from 'node:test';
import assert from 'node:assert/strict';
import {coinQuoteFreshness} from '../src/market.js';
import {fetchPositionMarketHistory,coinGeckoHistoricalResponse} from '../src/position-history.js';
const date=n=>Date.now()-n*86400000;
const market=body=>({ok:true,status:200,headers:{get:()=>null},json:async()=>body});
const position=id=>({kind:'crypto',coinId:id});
test('Historic 2022 CoinGecko quote is rejected as current in Oct 2026',()=>{
 const now=Date.parse('2026-10-22T09:00:00Z');
 assert.equal(coinQuoteFreshness({last_updated_at:Math.floor(Date.parse('2022-03-04T09:00:00Z')/1000)},now).ok,false);
 assert.match(coinQuoteFreshness({last_updated_at:Math.floor(Date.parse('2022-03-04T09:00:00Z')/1000)},now).reason,/2022-03-04/);
 assert.equal(coinQuoteFreshness({last_updated_at:Math.floor((now-86400000)/1000)},now).ok,true);
 assert.equal(coinQuoteFreshness({last_updated_at:Math.floor((now+2*86400000)/1000)},now).ok,false);
 assert.equal(coinQuoteFreshness({eur:1},now).dated,false);
});
test('All chart date ranges reuse one annual CoinGecko API response',async()=>{
 let calls=0,requested='';
 const mock=async url=>{calls++;requested=url;return market({prices:[[date(6),10],[date(4),12],[date(2),14],[date(1),16],[date(0),18]]});};
 const p=position('chainlink');
 const a=await fetchPositionMarketHistory(p,{},7,mock),b=await fetchPositionMarketHistory(p,{},30,mock),c=await fetchPositionMarketHistory(p,{},365,mock);
 assert.equal(a.points.length,5);assert.equal(b.points.length,5);assert.equal(c.points.length,5);
 assert.equal(calls,1,'No repeat calls for 7D 30D 365D');
 assert.match(requested,/days=365/);
});
test('Several positions using the same coin ID deduplicate simultaneous history requests',async()=>{
 let calls=0;
 const mock=async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,20));return market({prices:[[date(2),100],[date(1),101],[date(0),102]]});};
 const results=await Promise.all([
 fetchPositionMarketHistory(position('ethereum'),{},7,mock),
 fetchPositionMarketHistory(position('ethereum'),{},30,mock),
 fetchPositionMarketHistory(position('ethereum'),{},90,mock)
 ]);
 assert.equal(results.length,3);assert.equal(calls,1);
});
test('Browser network failures show actionable German explanation, never fictitious chart',async()=>{
 const mock=async()=>{throw TypeError('Failed to fetch');};
 await assert.rejects(()=>fetchPositionMarketHistory(position('ripple'),{},30,mock),/Netzwerk, CORS oder Sperre/);
});
test('429 gives specific hint for rate limit and optional free demo key',async()=>{
 let calls=0;
 const mock=async()=>{calls++;return {ok:false,status:429,headers:{get:()=>null},json:async()=>({})};};
 await assert.rejects(()=>fetchPositionMarketHistory(position('bitcoin'),{},7,mock),/CoinGecko-Limit erreicht/);
 assert.equal(calls,1,'Do not automatically retry rate-limited chart requests');
});
test('Self-provided CoinGecko key is passed as demo auth header only',async()=>{
 const mock=async(_url,opts)=>{assert.equal(opts.headers['x-cg-demo-api-key'],'only-for-test');return market({prices:[[date(2),100],[date(1),102],[date(0),103]]});};
 const response=await coinGeckoHistoricalResponse('sonic-3',{coinGeckoKey:'only-for-test'},mock);
 assert.equal(response.prices.length,3);
});
