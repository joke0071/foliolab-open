import test from 'node:test';
import assert from 'node:assert/strict';
import {handleInstrumentRequest,normalizeOpenFigi} from '../src/index.js';
const origin='https://joke0071.github.io';
const request=(path,options={})=>new Request('https://example.workers.dev'+path,{headers:{origin},...options});
const reply=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:extra});
test('Search uses documented POST /v3/search with sanitized metadata',async()=>{
 let target,options;
 const response=await handleInstrumentRequest(request('/api/instruments/search?q=World%20ETF'),{}, {},async(u,o)=>{
  target=u;options=o;return reply({data:[{figi:'BBG000TEST1',name:'World ETF',ticker:'WLD',currency:'EUR',micCode:'XETR',securityType2:'Exchange Traded Fund',exchCode:'GR'}]});
 });
 assert.equal(target,'https://api.openfigi.com/v3/search');
 assert.deepEqual(JSON.parse(options.body),{query:'World ETF'});
 assert.equal(response.status,200);
 const body=await response.json();
 assert.equal(body.schemaVersion,1);
 assert.equal(body.results[0].mic,'XETR');
 assert.equal(body.results[0].isin,null,'Do not invent an ISIN returned only by mapping');
 assert.equal(body.results[0].price,undefined);
});
test('ISIN lookup uses /v3/mapping and keeps exchange-specific candidates',async()=>{
 const res=await handleInstrumentRequest(request('/api/instruments/resolve?isin=IE00BK5BQT80'),{}, {},async(url,options)=>{
  assert.match(url,/\/v3\/mapping$/);
  assert.deepEqual(JSON.parse(options.body),[{idType:'ID_ISIN',idValue:'IE00BK5BQT80'}]);
  return reply([{data:[{figi:'A',name:'ETF A',micCode:'XETR'},{figi:'B',name:'ETF A',micCode:'XLON'}]}]);
 });
 const body=await res.json();
 assert.equal(body.results.length,2);
 assert.equal(body.results[0].isin,'IE00BK5BQT80');
});
test('No permissive CORS, no invalid identifier, no open proxy',async()=>{
 const badOrigin=new Request('https://example.workers.dev/api/instruments/search?q=hello',{headers:{origin:'https://evil.example'}});
 assert.equal((await handleInstrumentRequest(badOrigin)).status,403);
 assert.equal((await handleInstrumentRequest(request('/api/instruments/resolve?isin=abc'))).status,400);
 assert.equal((await handleInstrumentRequest(request('/api/proxy?url=https://evil.example'))).status,404);
 const preflight=await handleInstrumentRequest(request('/api/instruments/search',{method:'OPTIONS'}));
 assert.equal(preflight.status,204);
 assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
});
test('429 is returned, never retried or disguised as no results',async()=>{
 let calls=0;
 const res=await handleInstrumentRequest(request('/api/instruments/search?q=global'),{}, {},async()=>{
  calls++;return reply({error:'limited'},429,{'retry-after':'40'});
 });
 assert.equal(calls,1);assert.equal(res.status,429);
 assert.equal((await res.json()).status,'rate_limited');
});
test('OpenFIGI does not become a price source; dedup by FIGI',()=>{
 const data=normalizeOpenFigi([{figi:'A',name:'ETF',currency:'EUR',price:100},{figi:'A',name:'dup'},{name:'missing figi'}]);
 assert.equal(data.length,1);
 assert.equal(Object.hasOwn(data[0],'price'),false);
});
