import test from 'node:test';
import assert from 'node:assert/strict';
import {queryPublicInstruments,validatedPublicEndpoint} from '../src/public-instruments-client.js';
test('Public instrument lookup is opt-in and does not require any key',async()=>{
 assert.equal(validatedPublicEndpoint(''),null);
 assert.deepEqual(await queryPublicInstruments('','VWCE'),[]);
 let called;
 const results=await queryPublicInstruments('https://example.workers.dev','VWCE',{fetcher:async(url,options)=>{
  called={url,options};return {ok:true,json:async()=>({schemaVersion:1,status:'ok',results:[{figi:'BBG0001',name:'Example ETF',ticker:'ETF',mic:'XETR',currency:'EUR'}]})};
 }});
 assert.equal(new URL(called.url).pathname,'/api/instruments/search');
 assert.equal(new URL(called.url).searchParams.get('q'),'VWCE');
 assert.equal(called.options.method,'GET');
 assert.ok(!called.url.includes('key='));
 assert.equal(results[0].symbol,'ETF');
});
test('Public ISIN resolution and broken/fake servers fail without injecting data',async()=>{
 let url;
 await queryPublicInstruments('https://example.workers.dev','IE00BK5BQT80',{fetcher:async(x)=>{url=x;return {ok:true,json:async()=>({schemaVersion:1,status:'no_results',results:[]})};}});
 assert.equal(new URL(url).pathname,'/api/instruments/resolve');
 assert.throws(()=>validatedPublicEndpoint('http://example.com'));
 assert.throws(()=>validatedPublicEndpoint('https://user:secret@example.com'));
 await assert.rejects(()=>queryPublicInstruments('https://example.workers.dev','world',{fetcher:async()=>({ok:true,json:async()=>({status:'ok',results:[{figi:'fake',price:100}]})})}),/Antwortformat/);
 await assert.rejects(()=>queryPublicInstruments('https://example.workers.dev','world',{fetcher:async()=>({status:429,ok:false})}),/ausgelastet/);
});
