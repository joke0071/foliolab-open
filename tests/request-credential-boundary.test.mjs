import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequestCache} from '../src/request-cache.js';
import {cryptoPrices} from '../src/market.js';

const secret='SYNTHETIC_BOUNDARY_API_KEY_0123456789';
const safeMessage='Failed to fetch (Netzwerk-/CORS-Fehler).';
const headerForms={
 object:value=>({authorization:value}),
 Headers:value=>new Headers({Authorization:value}),
 pairs:value=>[['Authorization',value]]
};
const rejectWith=message=>async()=>{throw Error(message);};

test('query credential is detected before the display boundary can expose a partial key',async()=>{
 for(const offset of [0,170,180,250]){
  const cache=createRequestCache();
  await assert.rejects(cache.request('https://data.example.test/quote?apikey='+secret,{
   attempts:1,fetcher:rejectWith('x'.repeat(offset)+secret)
  }),error=>error.message===safeMessage);
 }
});

for(const [name,form] of Object.entries(headerForms))test(name+' headers protect full authorization, bare bearer token and truncation boundary',async()=>{
 for(const message of ['Rejected Bearer '+secret,'Rejected '+secret,'x'.repeat(170)+secret]){
  await assert.rejects(createRequestCache().request('https://own.example.test/api/market/eodhd',{
   headers:form('Bearer '+secret),attempts:1,fetcher:rejectWith(message)
  }),error=>error.message===safeMessage);
 }
 await assert.rejects(createRequestCache().request('https://data.example.test/quote',{
  headers:form(secret),attempts:1,fetcher:rejectWith('Rejected '+secret)
 }),error=>error.message===safeMessage);
});

test('cache and pending requests separate credentials in every header form and share equivalent headers only',async()=>{
 for(const form of Object.values(headerForms)){
  const cache=createRequestCache();let calls=0;
  const fetcher=async(_url,options)=>{
   calls++;await new Promise(resolve=>setImmediate(resolve));
   return {ok:true,status:200,json:async()=>({authorization:new Headers(options.headers).get('authorization')})};
  };
  const [a,b]=await Promise.all(['A','B'].map(id=>cache.request('https://data.example.test/quote',{
   headers:form('Bearer SYNTHETIC_'+id),ttlMs:10000,fetcher
  })));
  assert.equal(calls,2,'different credentials must not share an in-flight request');
  assert.equal(a.authorization,'Bearer SYNTHETIC_A');assert.equal(b.authorization,'Bearer SYNTHETIC_B');
  for(const equivalent of Object.values(headerForms)){
   const value=await cache.request('https://data.example.test/quote',{headers:equivalent('Bearer SYNTHETIC_A'),ttlMs:10000,fetcher});
   assert.deepEqual(value,a);value.authorization='changed clone';
  }
  assert.equal(calls,2,'equivalent HeadersInit forms retain cache reuse');
  assert.deepEqual(Object.keys(cache.stats()).sort(),['active','entries','pending','queued']);
 }
});

test('actual crypto quote failure does not forward a partial configured API key',async()=>{
 await assert.rejects(cryptoPrices(['bitcoin'],secret,rejectWith('x'.repeat(170)+secret)),error=>error.message===safeMessage);
});

test('queued fetch uses the credential snapshot that identifies its cache entry',async()=>{
 const cache=createRequestCache({maxConcurrent:1});let release,started;
 const began=new Promise(resolve=>{started=resolve;});
 const first=cache.request('https://data.example.test/blocker',{attempts:1,fetcher:async()=>{
  started();await new Promise(resolve=>{release=resolve;});return {ok:true,json:async()=>({})};
 }});
 await began;
 const headers={authorization:'Bearer SYNTHETIC_A'};let calls=0;
 const fetcher=async(_url,options)=>{calls++;return {ok:true,json:async()=>({credential:new Headers(options.headers).get('authorization')})};};
 const queued=cache.request('https://data.example.test/quote',{headers,ttlMs:10000,fetcher});
 headers.authorization='Bearer SYNTHETIC_B';release();await first;
 assert.equal((await queued).credential,'Bearer SYNTHETIC_A');
 assert.equal((await cache.request('https://data.example.test/quote',{headers,ttlMs:10000,fetcher})).credential,'Bearer SYNTHETIC_B');
 assert.equal(calls,2);
});

test('invalid credential header is rejected without reflecting its value or starting a request',async()=>{
 let calls=0;
 for(const headers of [{authorization:secret+'\nInjected: bad'},[['Authorization',secret+'\nInjected: bad']]]){
  await assert.rejects(createRequestCache().request('https://data.example.test/quote',{
   headers,attempts:1,fetcher:async()=>{calls++;}
  }),error=>error.message==='Ungültige HTTP-Header der Datenquelle.');
 }
 assert.equal(calls,0);
});

test('innocuous network diagnostics stay bounded while URLs beyond the display boundary remain private',async()=>{
 const cache=createRequestCache();
 await assert.rejects(cache.request('https://data.example.test/quote',{
  attempts:1,fetcher:rejectWith('NetworkError: '+'x'.repeat(250))
 }),error=>error.message.length===180&&error.message.startsWith('NetworkError: '));
 await assert.rejects(cache.request('https://data.example.test/quote',{
  attempts:1,fetcher:rejectWith('x'.repeat(200)+'https://private.example.test/?token='+secret)
 }),error=>error.message===safeMessage);
});
