import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {exchangeRateQuote,historicalExchangeRate,historicalExchangeRates,evmContractPrices} from '../src/market.js';
import {coinPaprikaCurrentQuote,coinPaprikaHistoricalQuote,defiLlamaCurrentQuote} from '../src/crypto-fallbacks.js';
import {positionFX} from '../src/fx-state.js';
import {blankModel,createProvider,createAccount,createPosition,totalExactEUR} from '../src/model.js';
import {refreshHeadline,refreshFailures} from '../src/refresh-ui.js';
import {fetchSecurityQuote} from '../src/security-sources.js';
const day=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10),stamp=Math.floor(Date.now()/1000);
const ok=data=>({ok:true,status:200,headers:{get:()=>null},json:async()=>data});
const contract='0x'+'b'.repeat(40),address='0x'+'a'.repeat(40),token='ethereum:'+contract;
const wrapped={kind:'crypto',economicRole:'liquid-staking',symbol:'STETH',wallet:{enabled:true,chain:'erc20',chainId:1,contract,address}};
test('Provider FX never grants a value outside the existing portfolio FX range',async()=>{
 for(const rate of [1e-9,1001]){
  await assert.rejects(()=>exchangeRateQuote('USD','',async()=>ok({base:'USD',date:day(1),rates:{EUR:rate}})));
  await assert.rejects(()=>historicalExchangeRate('USD',day(1),async()=>ok({base:'USD',date:day(1),rates:{EUR:rate}})));
  assert.deepEqual(await historicalExchangeRates('USD',day(1),day(1),async()=>ok({base:'USD',rates:{[day(1)]:{EUR:rate}}})),[]);
 }
 for(const rate of [1e-8,1000]){
  const q=await exchangeRateQuote('USD','',async()=>ok({base:'USD',date:day(1),rates:{EUR:rate}}));assert.equal(positionFX({currency:'USD',fxRate:q.rate,fxRateExact:String(q.rate)}).state,'known');
 }
});
test('Token and CoinPaprika fallback prices reject non-price primitive/object coercions',async()=>{
 for(const value of [true,[123.45],1e-20]){
  const q=await evmContractPrices(1,[contract],'',async()=>ok({[contract]:{eur:value}}));assert.equal(Object.hasOwn(q,contract),false);
  await assert.rejects(()=>coinPaprikaCurrentQuote({coinId:'bitcoin',symbol:'BTC'},async()=>ok({id:'btc-bitcoin',symbol:'BTC',last_updated:new Date().toISOString(),quotes:{EUR:{price:value}}})));
 }
 const q=await evmContractPrices(1,[contract],'',async()=>ok({[contract]:{eur:'123.45'},unrequested:{eur:1}}));assert.equal(Number(q[contract].eur),123.45);assert.equal(Object.hasOwn(q,'unrequested'),false);
});
test('Historical CoinPaprika conversion refuses malformed USD prices and FX',async()=>{
 const rows=price=>[2,1].map(n=>({timestamp:day(n)+'T12:00:00Z',price}));
 for(const price of [true,[100]])await assert.rejects(()=>coinPaprikaHistoricalQuote({coinId:'bitcoin',symbol:'BTC'},async url=>ok(url.includes('coinpaprika')?rows(price):{base:'USD',rates:{[day(2)]:{EUR:.9},[day(1)]:{EUR:.9}}})));
 for(const rate of [true,[.9],1001])await assert.rejects(()=>coinPaprikaHistoricalQuote({coinId:'bitcoin',symbol:'BTC'},async url=>ok(url.includes('coinpaprika')?rows(100):{base:'USD',rates:{[day(2)]:{EUR:rate},[day(1)]:{EUR:rate}}})));
 const r=await coinPaprikaHistoricalQuote({coinId:'bitcoin',symbol:'BTC'},async url=>ok(url.includes('coinpaprika')?rows(100):{base:'USD',rates:{[day(2)]:{EUR:.9},[day(1)]:{EUR:.9}}}));assert.deepEqual(r.points.map(p=>p.total),[90,90]);
});
test('DefiLlama requires actual numeric price, confidence and timestamp',async()=>{
 const good={price:100,confidence:.9,timestamp:stamp,symbol:'STETH'};
 for(const patch of [{price:true},{price:[100]},{confidence:true},{confidence:[.9]},{confidence:'Infinity'},{timestamp:[stamp]}])
  await assert.rejects(()=>defiLlamaCurrentQuote(wrapped,async url=>ok(url.includes('llama.fi')?{coins:{[token]:{...good,...patch}}}:{base:'USD',date:day(1),rates:{EUR:.9}})));
 const q=await defiLlamaCurrentQuote(wrapped,async url=>ok(url.includes('llama.fi')?{coins:{[token]:good}}:{base:'USD',date:day(1),rates:{EUR:.9}}));assert.equal(q.price,90);
});
const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');const refreshSource=app.slice(app.indexOf('async function refreshSources('),app.indexOf('const FULL_BACKUP_OPTION='));
async function tokenRefresh(eur){
 const model=blankModel();model.providers.push(createProvider({id:'p',name:'Synthetic'}));model.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic wallet',type:'wallet'},model));
 model.positions.push(createPosition({id:'token',name:'Synthetic Token',providerId:'p',accountId:'a',kind:'crypto',symbol:'TKN',quantity:1,price:100,wallet:{enabled:true,chain:'erc20',chainId:1,address,contract,decimals:18}},model));
 const before=JSON.stringify(model),nodes=new Map();let saves=0,requests=0,stored=before;
 const $=id=>{if(!nodes.has(id))nodes.set(id,{classList:{remove(){},add(){},toggle(){}},textContent:'',innerHTML:''});return nodes.get(id);};
 const ctx=vm.createContext({model,$,setLoading(){},snapshot(){},render(){},notify(){},refreshHeadline,refreshFailures,esc:x=>String(x),save:async()=>{saves++;stored=JSON.stringify(model);},refreshScope:async()=>'',defiLlamaContractKey:()=>null,evmContractPrices:(chain,ids,key)=>evmContractPrices(chain,ids,key,async()=>{requests++;return ok({[contract]:{eur}});})});
 await vm.runInContext(refreshSource+'\nrefreshSources({due:key=>key.startsWith("token:"),success(){},finish(){}})',ctx);
 return {model,before,saves,requests,stored};
}
test('Actual token refresh retains the complete old record for malformed values and saves valid120 once',async()=>{
 for(const price of [true,[120],1e300,1e-20]){
  const r=await tokenRefresh(price);assert.equal(r.requests,1);assert.equal(r.saves,0);assert.equal(r.stored,r.before);assert.equal(JSON.stringify(r.model),r.before);
 }
 const r=await tokenRefresh(120);assert.equal(r.saves,1);assert.equal(totalExactEUR(r.model),'120');assert.equal(r.model.positions[0].quantityExact,'1');
});
async function securityRefresh(price){
 const model=blankModel();model.providers.push(createProvider({id:'p',name:'Synthetic'}));model.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic depot'},model));
 model.positions.push(createPosition({id:'etf',name:'Synthetic ETF',providerId:'p',accountId:'a',kind:'etf',symbol:'VWCE',isin:'IE00BK5BQT80',exchange:'Xetra',mic:'XETR',currency:'EUR',quantity:2,price:100},model));
 Object.assign(model.settings,{securitySource:'eodhd',eodhdWorkerEndpoint:'https://synthetic.workers.dev',eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_123456789'});
 const before=JSON.stringify(model),nodes=new Map();let saves=0,requests=0,stored=before;
 const $=id=>{if(!nodes.has(id))nodes.set(id,{classList:{remove(){},add(){},toggle(){}},textContent:'',innerHTML:''});return nodes.get(id);};
 const ctx=vm.createContext({model,$,setLoading(){},snapshot(){},render(){},notify(){},refreshHeadline,refreshFailures,esc:x=>String(x),save:async()=>{saves++;stored=JSON.stringify(model);},fetchSecurityQuote:(p,settings)=>fetchSecurityQuote(p,settings,async()=>{requests++;return ok({schemaVersion:1,status:'ok',symbol:'VWCE.XETRA',points:[{date:day(1),close:price}]});})});
 await vm.runInContext(refreshSource+'\nrefreshSources()',ctx);return {model,before,stored,saves,requests};
}
test('Actual security quote pipeline rejects prices outside canonical decimal precision before any save',async()=>{
 for(const price of [1e-19,1e-20]){const r=await securityRefresh(price);assert.equal(r.requests,1);assert.equal(r.saves,0);assert.equal(r.stored,r.before);assert.equal(JSON.stringify(r.model),r.before);}
 const r=await securityRefresh(101.25);assert.equal(r.requests,1);assert.equal(r.saves,1);assert.equal(totalExactEUR(r.model),'202.5');
});
