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

test('CSP allows only the Google OAuth script alongside same-origin JavaScript',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 const drive=readFileSync(new URL('../src/drive-backup.js',import.meta.url),'utf8');
 assert.equal(html.match(/script-src\s+([^;]+);/)?.[1]?.trim(),"'self' https://accounts.google.com/gsi/client",'No general third-party script execution allowed');
 assert.match(drive,/script\.src='https:\/\/accounts\.google\.com\/gsi\/client'/,'Only Google Identity Services loads on demand');
 assert.doesNotMatch(app,/external-embedding\/embed-widget-advanced-chart/,'No vendor script must run in portfolio origin');
 assert.ok(!app.toLowerCase().includes('tradingview.com')&&!app.includes('load-tradingview')&&!app.includes('openPublicTradingView')&&!app.includes('data-tv-slot'),'No active third-party chart path remains');
 assert.ok(!html.toLowerCase().includes('tradingview.com'),'CSP must not allow vendor chart framing');
 assert.ok(html.includes('frame-src https://accounts.google.com/gsi/;'),'Google OAuth framing remains available');
});
