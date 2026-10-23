import test from 'node:test';
import assert from 'node:assert/strict';
import {handleInstrumentRequest} from '../src/index.js';
import {handleMarketRequest} from '../src/market.js';

const origin='https://joke0071.github.io';
const token='TEST_ONLY_MARKET_TOKEN_ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const eodhdSecret='EODHD_SYNTHETIC_TEST_ONLY';
const env={MARKET_ACCESS_TOKEN:token,EODHD_TOKEN:eodhdSecret};
const path='https://my-owned-worker.workers.dev/api/market/eodhd';
const fields={symbol:'VWCE.XETRA',from:'2026-10-01',to:'2026-10-22'};
const make=(body=fields,access=token,fromOrigin=origin)=>new Request(path,{method:'POST',
 headers:{origin:fromOrigin,authorization:'Bearer '+access,'content-type':'application/json'},
 body:JSON.stringify(body)});
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});

test('Verified EODHD bars are delivered by a fixed-origin, authenticated, no-store proxy',async()=>{
 let upstream='',options;
 const result=await handleInstrumentRequest(make(),env,{},async(url,init)=>{
  upstream=url;options=init;return reply([
   {date:'2026-10-21',close:170.25,open:170,volume:123},
   {date:'2026-10-22',close:171.50,open:171,volume:200}
  ]);
 });
 assert.equal(result.status,200);
 assert.equal(result.headers.get('access-control-allow-origin'),origin);
 assert.match(result.headers.get('cache-control'),/no-store/);
 const body=await result.json();
 assert.equal(body.symbol,fields.symbol);
 assert.equal(body.points.length,2);
 assert.deepEqual(body.points[0],{date:'2026-10-21',close:170.25});
 assert.equal(body.points[0].volume,undefined);
 assert.equal(new URL(upstream).origin,'https://eodhd.com');
 assert.equal(new URL(upstream).searchParams.get('api_token'),eodhdSecret);
 assert.equal(options.redirect,'error');
 assert.doesNotMatch(JSON.stringify(body),/EODHD_SYNTHETIC/);
 assert.doesNotMatch(JSON.stringify(body),/MARKET_TOKEN/);
});

test('Token is mandatory and no call is made on bad, missing or mismatched credentials',async()=>{
 let calls=0;
 const fetcher=()=>{calls++;return reply([])};
 for(const a of ['', 'wrong','TEST_TOKEN_123456789012345678901234567890']){
  assert.equal((await handleInstrumentRequest(make(fields,a),env,{},fetcher)).status,401);
 }
 assert.equal((await handleInstrumentRequest(make(fields,token),{MARKET_ACCESS_TOKEN:token}, {},fetcher)).status,503);
 assert.equal(calls,0);
});
test('Browser origins, preflights and no open proxy are enforced',async()=>{
 assert.equal((await handleInstrumentRequest(make(fields,token,'https://untrusted.example'),env)).status,403);
 const preflight=await handleInstrumentRequest(new Request(path,{method:'OPTIONS',headers:{origin}}),env);
 assert.equal(preflight.status,204);
 assert.match(preflight.headers.get('access-control-allow-headers'),/authorization/);
 assert.equal((await handleInstrumentRequest(new Request(path,{headers:{origin}}),env)).status,405);
 assert.equal((await handleInstrumentRequest(new Request('https://my-owned-worker.workers.dev/api/proxy?url=https://evil.example',{headers:{origin}}),env)).status,404);
});
test('Rejects arbitrary hosts, invalid dates, excessive ranges and malformed payloads before EODHD',async()=>{
 let calls=0;
 const fetcher=()=>{calls++;return reply([])};
 for(const body of [
  {...fields,symbol:'http://127.0.0.1/'},
  {...fields,symbol:'VWCE.XETRA?api_token=evil'},
  {...fields,to:'2026-02-30'},
  {...fields,from:'2022-01-01'},
  {...fields,from:'2026-10-23'},
  {...fields,to:'2999-01-01'}
 ]){
  const result=await handleMarketRequest(make(body),env,fetcher);
  assert.equal(result.status,400);
 }
 assert.equal(calls,0);
});
test('Upstream denial and limits are sanitized, secrets never echoed',async()=>{
 for(const [status,want] of [[401,403],[403,403],[429,429],[500,502]]){
  const result=await handleMarketRequest(make(),env,async()=>reply({message:'api_token='+eodhdSecret},status));
  assert.equal(result.status,want);
  assert.doesNotMatch(await result.text(),/SYNTHETIC_TEST/);
 }
});
