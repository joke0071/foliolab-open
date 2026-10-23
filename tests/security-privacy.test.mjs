import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequestCache} from '../src/request-cache.js';
import {solanaRpcRead} from '../src/solana-rpc.js';
import {queryPublicInstruments} from '../src/public-instruments-client.js';
import {blankModel,backup} from '../src/model.js';
import {readFileSync} from 'node:fs';

const secret='MY_PRIVATE_API_KEY_91828';
const rpcUrl='https://rpc.example.test/?api-key='+secret;
const ok=body=>({ok:true,status:200,headers:{get:()=>null},json:async()=>body});

test('Upstream error responses never expose user-provided API tokens',async()=>{
 const cache=createRequestCache();
 let message='';
 try{
  await cache.request('https://data.example.test/prices?apikey='+secret,{
   fetcher:async()=>ok({status:'error',message:'Invalid '+secret+' at /prices?apikey='+secret}),
   attempts:1
  });
 }catch(error){message=error.message;}
 assert.ok(message,'An API error should still be surfaced');
 assert.doesNotMatch(message,new RegExp(secret),'Provider response must not echo the secret');
});

test('Network errors cannot reflect credential-bearing URLs to the UI',async()=>{
 const cache=createRequestCache();
 let message='';
 try{
  await cache.request('https://data.example.test/prices?apikey='+secret,{
   fetcher:async()=>{throw Error('Fetch failed for '+rpcUrl);},
   attempts:1
  });
 }catch(error){message=error.message;}
 assert.ok(message);
 assert.doesNotMatch(message,new RegExp(secret),'Network diagnostic must not reveal a configured RPC token');
});

test('Solana response metadata never contains API credentials from configured RPC',async()=>{
 const response=await solanaRpcRead(rpcUrl,'getBalance',['11111111111111111111111111111111'],async()=>ok({jsonrpc:'2.0',result:{value:4}}));
 assert.equal(response.result.value,4);
 assert.equal(response.fallback,false);
 assert.ok(!JSON.stringify(response).includes(secret),'RPC URL must not be returned with secret query parameters');
});

test('Solana RPC provider errors cannot echo confidential configured URL',async()=>{
 const bad=async()=>ok({jsonrpc:'2.0',error:{code:-32602,message:'Invalid params: '+rpcUrl}});
 let message='';
 try{await solanaRpcRead(rpcUrl,'getBalance',['11111111111111111111111111111111'],bad);}
 catch(error){message=error.message;}
 assert.ok(message);
 assert.doesNotMatch(message,new RegExp(secret));
 assert.match(message,/Solana-RPC/);
});

test('Public instrument metadata only retains documented instrument properties',async()=>{
 const records=[{figi:'BBG123',name:'World ETF',ticker:'WRLD',currency:'EUR',mic:'XETR',
   vendorSecret:secret,html:'<img src=x onerror=alert(1)>',url:'javascript:alert(1)'}];
 const rows=await queryPublicInstruments('https://search.example.test','World ETF',{
  fetcher:async()=>ok({schemaVersion:1,status:'ok',results:records})
 });
 assert.equal(rows.length,1);
 assert.equal(rows[0].figi,'BBG123');
 assert.equal(rows[0].name,'World ETF');
 assert.equal(rows[0].symbol,'WRLD');
 assert.equal(rows[0].vendorSecret,undefined);
 assert.equal(rows[0].html,undefined);
 assert.equal(rows[0].url,undefined);
});

test('Unencrypted backup always omits configured provider secrets and private RPC URL',()=>{
 const model=blankModel();
 model.settings.eodhdKey=secret;
 model.settings.coinGeckoKey=secret;
 model.settings.solanaRpc=rpcUrl;
 const json=backup(model);
 assert.doesNotMatch(json,new RegExp(secret));
 assert.ok(!json.includes('rpc.example.test'),'Backup must not reveal a private RPC provider URL');
});

test('Only same-origin JavaScript is permitted by the portfolio CSP',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(html,/script-src 'self';/);
 assert.equal(html.match(/script-src\s+([^;]+);/)?.[1]?.trim(),"'self'",'CSP must not grant third-party scripts access to locally stored keys');
 assert.doesNotMatch(app,/external-embedding\/embed-widget-advanced-chart/,'No vendor script must run in portfolio origin');
 assert.match(app,/https:\/\/s\.tradingview\.com\/widgetembed\//,'Charts must be isolated in a cross-origin iframe');
 assert.match(app,/allow-scripts allow-same-origin allow-popups/,'iframe must be explicitly sandboxed');
});
