import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {cryptoPrices,coinQuoteFreshness} from '../src/market.js';
import {blankModel,createProvider,createAccount,createPosition,totalExactEUR} from '../src/model.js';
import {refreshHeadline,refreshFailures} from '../src/refresh-ui.js';
const ok=data=>({ok:true,status:200,headers:{get:()=>null},json:async()=>data});
const stamp=Math.floor(Date.now()/1000);
test('CoinGecko quotes reject coerced and unsupported price values and ignore unrequested assets',async()=>{
 for(const eur of [true,[123.45],{},'Infinity',null,'',0,-1,1e300,1e-20]){
  const data=await cryptoPrices(['bitcoin'],'',async()=>ok({bitcoin:{eur,last_updated_at:stamp},unexpected:{eur:99}}));
  assert.equal(Object.hasOwn(data,'bitcoin'),false,JSON.stringify(eur));assert.equal(Object.hasOwn(data,'unexpected'),false);
 }
});
test('Valid CoinGecko prices keep numeric value and genuine timestamps; malformed time stays undated',async()=>{
 for(const eur of [123.45,'123.45']){
  const r=await cryptoPrices(['bitcoin'],'',async()=>ok({bitcoin:{eur,last_updated_at:stamp}}));assert.equal(Number(r.bitcoin.eur),123.45);assert.equal(r.bitcoin.last_updated_at,stamp);
 }
 const r=await cryptoPrices(['bitcoin'],'',async()=>ok({bitcoin:{eur:123.45,last_updated_at:[stamp]}}));
 assert.equal(Object.hasOwn(r.bitcoin,'last_updated_at'),false);assert.equal(coinQuoteFreshness(r.bitcoin).dated,false);
});
const source=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
const refreshSource=source.slice(source.indexOf('async function refreshSources('),source.indexOf('const FULL_BACKUP_OPTION='));
async function refresh(data,mixed=false){
 const model=blankModel();model.providers.push(createProvider({id:'p',name:'Synthetic'}));model.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic crypto'},model));
 model.positions.push(createPosition({id:'btc',providerId:'p',accountId:'a',name:'Bitcoin',kind:'crypto',symbol:'BTC',coinId:'bitcoin',currency:'EUR',quantity:1,price:100},model));
 if(mixed)model.positions.push(createPosition({id:'eth',providerId:'p',accountId:'a',name:'Ethereum',kind:'crypto',symbol:'ETH',coinId:'ethereum',currency:'EUR',quantity:1,price:200},model));
 const before=JSON.stringify(model),nodes=new Map(),messages=[];let requests=0,fallbacks=0,saves=0,stored=before;
 const $=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',classList:{remove(){},add(){},toggle(){}}});return nodes.get(id);};
 const context=vm.createContext({model,$,setLoading(){},render(){},snapshot(){},save:async()=>{saves++;stored=JSON.stringify(model);},notify:(text,error)=>messages.push({text,error}),refreshHeadline,refreshFailures,esc:x=>String(x),coinQuoteFreshness,defiLlamaContractKey:()=>null,
  cryptoPrices:ids=>cryptoPrices(ids,'',async()=>{requests++;return ok(data);}),cryptoFallbackQuote:async()=>{fallbacks++;throw Error('SYNTHETIC_FALLBACK_UNAVAILABLE');}});
 await vm.runInContext(refreshSource+'\nrefreshSources()',context);return {model,before,stored,saves,requests,fallbacks,messages};
}
test('Actual crypto refresh retains prior quote and storage on malformed primary and unavailable fallback',async()=>{
 for(const eur of [true,[123.45],1e300,1e-20]){
  const r=await refresh({bitcoin:{eur,last_updated_at:stamp}});assert.equal(r.requests,1);assert.equal(r.fallbacks,1);assert.equal(r.saves,0);
  assert.equal(r.stored,r.before);assert.equal(JSON.stringify(r.model),r.before);assert.equal(r.messages.at(-1).error,true);
 }
});
test('Actual partial crypto refresh saves only the valid quote and keeps invalid asset price intact',async()=>{
 const r=await refresh({bitcoin:{eur:120,last_updated_at:stamp},ethereum:{eur:true,last_updated_at:stamp}},true);
 assert.equal(r.requests,1);assert.equal(r.fallbacks,1);assert.equal(r.saves,1);assert.equal(totalExactEUR(r.model),'320');
 assert.equal(r.model.positions[0].priceExact,'120');assert.deepEqual(r.model.positions[1],JSON.parse(r.before).positions[1]);assert.equal(r.messages.at(-1).error,true);
});
