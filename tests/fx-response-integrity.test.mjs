import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {exchangeRate,exchangeRateQuote,historicalExchangeRate,historicalExchangeRates} from '../src/market.js';
import {blankModel,createProvider,createAccount,createPosition,totalExactEUR} from '../src/model.js';
import {refreshHeadline,refreshFailures} from '../src/refresh-ui.js';

const date='2026-11-13';
const ok=data=>({ok:true,status:200,headers:{get:()=>null},json:async()=>data});
const payload=(rate,extra={})=>({date,base:'USD',rates:{EUR:rate},...extra});
test('Current and legacy FX readers reject nonnumeric, nonfinite and wrong-currency rates',async()=>{
 for(const load of [(f)=>exchangeRate('USD','',f),(f)=>exchangeRateQuote('USD','',f),(f)=>historicalExchangeRate('USD',date,f)]){
  for(const rate of [true,[0.85],'Infinity',Infinity,{},null,'',0,-1])await assert.rejects(()=>load(async()=>ok(payload(rate))));
  await assert.rejects(()=>load(async()=>ok(payload(0.85,{base:'GBP'}))),/Währung|Referenzkurs|Wechselkurs/);
 }
});
test('Dated FX readers reject nonexistent and future publication days',async()=>{
 for(const d of ['2026-02-31','2026-13-01','2099-01-01'])await assert.rejects(()=>exchangeRateQuote('USD','',async()=>ok(payload(0.85,{date:d}))));
 // March 1 is fewer than seven parsed days from the nonexistent Feb 29 in 2026.
 await assert.rejects(()=>historicalExchangeRate('USD','2026-03-01',async()=>ok(payload(0.85,{date:'2026-02-29'}))));
});
test('Valid numeric/string rates and explicit weekend publication dates retain their existing contract',async()=>{
 for(const rate of [0.85,'0.85']){
  assert.equal((await exchangeRateQuote('USD','',async()=>ok(payload(rate)))).rate,0.85);
  assert.equal(await exchangeRate('USD','',async()=>ok({rates:{EUR:rate}})),0.85);
 }
 assert.deepEqual(await historicalExchangeRate('USD','2026-11-08',async()=>ok(payload('0.85',{date:'2026-11-06'}))),{rate:0.85,date:'2026-11-06',requestedDate:'2026-11-08',source:'Frankfurter',reference:true});
 assert.equal((await exchangeRateQuote('EUR','',async()=>{throw Error('No identity request');})).rate,1);
});
test('Batched historical FX never turns malformed observations into a filled daily rate',async()=>{
 for(const rate of [true,[0.85],'Infinity'])assert.deepEqual(await historicalExchangeRates('USD','2026-11-13','2026-11-13',async()=>ok({base:'USD',rates:{'2026-11-13':{EUR:rate}}})),[]);
 assert.deepEqual(await historicalExchangeRates('USD','2026-03-01','2026-03-01',async()=>ok({base:'USD',rates:{'2026-02-29':{EUR:0.85}}})),[]);
 assert.deepEqual(await historicalExchangeRates('USD','2026-11-07','2026-11-08',async()=>ok({base:'USD',rates:{'2026-11-06':{EUR:0.85}}})),[
  {date:'2026-11-07',currency:'USD',rate:'0.85',source:'Frankfurter',referenceDate:'2026-11-06'},
  {date:'2026-11-08',currency:'USD',rate:'0.85',source:'Frankfurter',referenceDate:'2026-11-06'}]);
});

const source=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
const refreshSource=source.slice(source.indexOf('async function refreshSources('),source.indexOf('const FULL_BACKUP_OPTION='));
async function refresh(data){
 const model=blankModel();model.providers.push(createProvider({id:'p',name:'Synthetic'}));model.accounts.push(createAccount({id:'a',providerId:'p',name:'USD cash',currency:'USD'},model));
 model.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',name:'USD cash',kind:'cash',currency:'USD',quantity:100,price:1,fxRate:null,fxRateExact:null},model));
 const before=JSON.stringify(model),nodes=new Map(),messages=[];let requests=0,saves=0,stored=before;
 const $=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',classList:{remove(){},add(){},toggle(){}}});return nodes.get(id);};
 const context=vm.createContext({model,$,setLoading(){},render(){},snapshot(){},save:async()=>{saves++;stored=JSON.stringify(model);},notify:(text,error)=>messages.push({text,error}),refreshHeadline,refreshFailures,esc:x=>String(x),exchangeRateQuote:currency=>exchangeRateQuote(currency,'',async()=>{requests++;return ok(data);})});
 await vm.runInContext(refreshSource+'\nrefreshSources()',context);return {model,before,stored,saves,requests,messages,nodes};
}
test('Actual refresh handler preserves UNKNOWN FX and stored bytes on invalid provider responses',async()=>{
 for(const data of [payload(true),payload('Infinity'),payload(0.85,{base:'GBP'}),payload(0.85,{date:'2026-02-31'})]){
  const r=await refresh(data);assert.equal(r.requests,1);assert.equal(r.saves,0);assert.equal(r.stored,r.before);assert.equal(JSON.stringify(r.model),r.before);
  assert.equal(r.model.positions[0].fxRate,null);assert.equal(r.model.positions[0].fxRateExact,'UNKNOWN');assert.equal(r.messages.at(-1).error,true);
 }
});
test('Actual refresh handler saves a valid current reference rate once without rewriting journal/history',async()=>{
 const r=await refresh(payload(0.85));assert.equal(r.requests,1);assert.equal(r.saves,1);assert.equal(totalExactEUR(r.model),'85');
 assert.equal(r.model.positions[0].fxRateExact,'0.85');assert.equal(r.model.positions[0].fxRateDate,date);
 const before=JSON.parse(r.before);assert.deepEqual(r.model.journalEntries,before.journalEntries);assert.deepEqual(r.model.externalCashFlows,before.externalCashFlows);
});
