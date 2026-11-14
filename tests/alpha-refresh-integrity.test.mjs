import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parseAlphaDaily,createAlphaClient} from '../src/alpha-vantage.js';
import {referenceSearch} from '../src/reference-listings.js';
import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {refreshHeadline,refreshFailures} from '../src/refresh-ui.js';

const at=Date.parse('2026-11-14T12:00:00Z');
const response=close=>({'Meta Data':{'2. Symbol':'VWCE.DEX','3. Last Refreshed':'2026-11-13'},'Time Series (Daily)':{'2026-11-13':{'4. close':close,'5. adjusted close':'999'}}});
const position={...referenceSearch('VWCE').find(p=>p.symbol==='VWCE'),kind:'etf'};
function memory(){const records=new Map();return {records,read:async key=>structuredClone(records.get(key)),update:async(key,change)=>{const value=change(structuredClone(records.get(key)));records.set(key,structuredClone(value));return structuredClone(value);}};}
test('Non-price JSON types cannot become a confirmed Alpha close',()=>{
 for(const value of [true,false,[123.45],[],{},null,undefined,'',' ',NaN,Infinity])
  assert.throws(()=>parseAlphaDaily(response(value),'VWCE.DEX'),/ungültige Tageskurse/,'reject '+JSON.stringify(value));
 for(const value of [123.45,'123.45'])assert.equal(parseAlphaDaily(response(value),'VWCE.DEX').points[0].total,123.45);
});
test('Malformed Alpha responses consume one request but preserve the prior quote cache',async()=>{
 for(const value of [true,[123.45]]){
  const store=memory(),old={day:'2026-11-12',data:response('110.25')};store.records.set('daily:VWCE.DEX',structuredClone(old));let requests=0;
  const client=createAlphaClient({store,clock:()=>at,fetcher:async()=>{requests++;return {ok:true,status:200,json:async()=>response(value)};}});
  await assert.rejects(()=>client.load(position,'SYNTHETIC_ALPHA_KEY'),/ungültige Tageskurse/);
  assert.equal(requests,1);assert.deepEqual(await store.read('daily:VWCE.DEX'),old);
  assert.equal(JSON.stringify([...store.records]).includes('SYNTHETIC_ALPHA_KEY'),false);
 }
});

const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
const refreshSource=app.slice(app.indexOf('async function refreshSources('),app.indexOf("const FULL_BACKUP_OPTION="));
async function refresh(close){
 const model=blankModel(),provider=createProvider({name:'Synthetic broker'});model.providers.push(provider);
 const account=createAccount({name:'Synthetic depot',providerId:provider.id},model);model.accounts.push(account);
 model.positions.push(createPosition({...position,name:'Synthetic ETF',providerId:provider.id,accountId:account.id,quantity:'2',price:'110.25'},model));
 model.settings.alphaVantageKey='SYNTHETIC_ALPHA_KEY';model.settings.autoRefresh='off';
 const before=JSON.stringify(model),nodes=new Map(),messages=[];let saves=0,snapshots=0,requests=0;
 const client=createAlphaClient({store:memory(),clock:()=>at,fetcher:async()=>{requests++;return {ok:true,status:200,json:async()=>response(close)};}});
 const $=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',classList:{remove(){},add(){},toggle(){}}});return nodes.get(id);};
 // Execute the actual app function with DOM/save adapters and the real Alpha client.
 // This adapter binds only the already tested provider-result-to-quote boundary;
 // it is not a browser, IDB or full fetchSecurityQuote acceptance test.
 const context=vm.createContext({model,$,setLoading(){},render(){},snapshot(){snapshots++;},save:async()=>{saves++;},notify:(text,error)=>messages.push({text,error}),refreshHeadline,refreshFailures,esc:x=>String(x),fetchSecurityQuote:async p=>{
  const r=await client.load(p,'SYNTHETIC_ALPHA_KEY'),last=r.points.at(-1);
  return {price:last.total,source:r.source,quality:r.quality,asOf:last.date};
 }});
 await vm.runInContext(refreshSource+'\nrefreshSources()',context);
 return {model,before,saves,snapshots,requests,messages,nodes};
}
test('Actual refresh handler retains model and stored price when Alpha returns non-price JSON',async()=>{
 for(const close of [true,[123.45]]){
  const r=await refresh(close);assert.equal(r.requests,1);assert.equal(r.saves,0);assert.equal(r.snapshots,0);
  assert.equal(JSON.stringify(r.model),r.before);assert.equal(r.model.positions[0].priceExact,'110.25');
  assert.match(r.nodes.get('refreshErrorDetails').innerHTML,/ungültige Tageskurse/);
  assert.equal(r.messages.at(-1).error,true);
 }
});
test('Actual refresh handler still adopts a valid raw close once',async()=>{
 const r=await refresh('123.45');assert.equal(r.requests,1);assert.equal(r.saves,1);assert.equal(r.snapshots,1);
 assert.equal(r.model.positions[0].priceExact,'123.45');assert.equal(r.model.positions[0].quantityExact,'2');
 assert.equal(r.model.positions[0].quoteAsOf,'2026-11-13');assert.equal(r.messages.at(-1).error,undefined);
});
