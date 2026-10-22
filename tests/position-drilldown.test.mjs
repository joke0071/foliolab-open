import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';globalThis.crypto??=webcrypto;
import {blankModel,createProvider,createAccount,createPosition,snapshot,backup,safeImport,totalExactEUR,valueEUR,money,escapeHTML} from '../src/model.js';
import {currentPositionValues,recordedPositionHistory,marketHistoryCapability,fetchPositionMarketHistory} from '../src/position-history.js';
import {renderProviderAccounts} from '../src/dashboard-ui.js';
import {positionDetailMarkup} from '../src/position-detail-ui.js';
const today=new Date().toISOString().slice(0,10);
const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
function fixture(){
 const m=blankModel(),provider=createProvider({name:'Demo'});m.providers.push(provider);
 const account=createAccount({name:'Depot',type:'securities',providerId:provider.id},m);m.accounts.push(account);
 return {m,account,provider,add:(v)=>{const p=createPosition({providerId:provider.id,accountId:account.id,kind:'etf',name:'Welt ETF',symbol:'XYZ',quantity:'2',price:'100',...v},m);m.positions.push(p);return p;}};
}
const response=body=>({ok:true,status:200,headers:{get:()=>null},json:async()=>body});
test('Exact per-position current snapshot values sum to ledger total including liabilities and exclusion',()=>{
 const {m,add}=fixture();
 const security=add({quantity:'9007199254740993.125',price:'1'});
 const liability=add({name:'Schuld',economicRole:'borrowed',valuationMode:'liability',quantity:'1',price:'80'});
 const excluded=add({name:'Representation',economicRole:'wrapped',valuationMode:'excluded',representedByPositionId:security.id,quantity:'2',price:'10'});
 snapshot(m,today);
 const saved=m.snapshots.at(-1);
 assert.equal(saved.byPosition[security.id],'9007199254740993.125');
 assert.equal(saved.byPosition[liability.id],'-80');
 assert.equal(saved.byPosition[excluded.id],'0');
 assert.equal(saved.totalEURExact,totalExactEUR(m));
 assert.deepEqual(safeImport(JSON.parse(backup(m))).snapshots.at(-1).byPosition[security.id],saved.byPosition[security.id]);
});
test('Backdated manual snapshot cannot invent position history; old backups migrate',()=>{
 const {m,add}=fixture();const p=add({});
 snapshot(m,yesterday,'Older total',{manualTotalEUR:'500'});
 assert.equal(m.snapshots.at(-1).byPosition,null);
 snapshot(m,today);
 assert.equal(recordedPositionHistory(m,p.id,30).length,1);
 const old=JSON.parse(backup(m));for(const item of old.snapshots)delete item.byPosition;
 assert.equal(safeImport(old).snapshots.every(x=>x.byPosition==null),true);
});
test('Historical position values remain valid after a position was removed',()=>{
 const {m,add}=fixture(),p=add({});snapshot(m,today);
 m.positions=[];m.openingPositions=[];
 const restored=safeImport(JSON.parse(backup(m)));
 assert.equal(restored.snapshots.at(-1).byPosition[p.id],'200');
});
test('Malformed byPosition record rejected with no side effects',()=>{
 const {m,add}=fixture(),p=add({});snapshot(m,today);
 for(const v of [['bad','wrong-number'],['__proto__','1']]){
  const input=JSON.parse(backup(m));Object.defineProperty(input.snapshots.at(-1).byPosition,v[0],{value:v[1],enumerable:true,configurable:true});
  assert.throws(()=>safeImport(input),/Ungültiger|Dezimal|Zahl/);
 }
 const input=JSON.parse(backup(m));input.snapshots.at(-1).source='manual';
 assert.throws(()=>safeImport(input),/Ungültige historische/);
});
test('Rendered position drills include exact account context and escape injected names',()=>{
 const {m,add}=fixture(),p=add({name:'ETF <img src=x>',quantity:10,price:100});
 const html=renderProviderAccounts(m,money,valueEUR,escapeHTML,new Set([m.providers[0].id]),new Set([p.id]));
 assert.match(html,/provider-position-accordion/);assert.match(html,/data-position-id=/);
 assert.match(html,/open/);assert.ok(!html.includes('<img src=x>'));
 const detail=positionDetailMarkup(p,m,{esc:escapeHTML,money,quant:String,valueEUR});
 assert.match(detail,/Kurs je Einheit/);assert.match(detail,/Positionswert/);
 assert.match(detail,/Anteil am Konto/);assert.match(detail,/7 T/);assert.match(detail,/1 J/);
 p.valuationMode='excluded';
 assert.match(positionDetailMarkup(p,m,{esc:escapeHTML,money,quant:String,valueEUR}),/Nicht doppelt mitgezählt/);
 p.valuationMode='liability';
 assert.match(positionDetailMarkup(p,m,{esc:escapeHTML,money,quant:String,valueEUR}),/Verbindlichkeit/);
});
test('CoinGecko history only accepts finite positive real market prices and exact source',async()=>{
 const {add}=fixture(),p=add({kind:'crypto',coinId:'bitcoin'});
 const now=Date.now(),calls=[];
 const mock=async(url)=>{calls.push(url);return response({prices:[[now-2*864e5,25],[now-864e5,26],[now,27],[now,NaN],[now+8*864e5,99]]});};
 const result=await fetchPositionMarketHistory(p,{},7,mock);
 assert.equal(result.kind,'market');assert.equal(result.currency,'EUR');
 assert.equal(result.points.at(-1).total,27);assert.equal(result.points.length,3);
 assert.ok(calls[0].includes('/coins/bitcoin/market_chart'));
 assert.ok(!calls[0].includes('apikey='));
});
test('Never fabricate market chart for missing IDs or unavailable API',async()=>{
 const {add}=fixture(),p=add({kind:'crypto',coinId:''});
 assert.equal(marketHistoryCapability(p,{}),null);
 await assert.rejects(()=>fetchPositionMarketHistory(p,{},30),/Keine bestätigte/);
 p.coinId='bitcoin';
 await assert.rejects(()=>fetchPositionMarketHistory(p,{},30,async()=>response({prices:[]})),/keine ausreichenden/);
});
test('Twelve Data time-series checks symbol currency and exchange before displaying',async()=>{
 const {add}=fixture(),p=add({symbol:'VWCE',exchange:'Xetra',currency:'EUR'});
 const settings={twelveKey:'test-only-not-a-real-key'};
 const mk=(meta)=>async()=>response({meta,values:[{datetime:yesterday,close:'100'},{datetime:today,close:'102'}]});
 const expected={symbol:'VWCE',exchange:'Xetra',currency:'EUR'};
 const result=await fetchPositionMarketHistory(p,settings,30,mk(expected));
 assert.equal(result.points.length,2);assert.equal(result.points[1].total,102);
 await assert.rejects(()=>fetchPositionMarketHistory(p,settings,30,mk({...expected,currency:'USD'})),/Währung/);
 await assert.rejects(()=>fetchPositionMarketHistory(p,settings,30,mk({...expected,exchange:'Wrong'})),/Handelsplatz/);
 p.isin='IE00BK5BQT80';
 await assert.rejects(()=>fetchPositionMarketHistory(p,settings,30,mk({...expected,isin:'INVALID'})),/ISIN/);
 assert.equal(marketHistoryCapability({...p,exchange:'',mic:''},settings),null);
});
test('Range and data quality filters reject invalid periods',async()=>{
 const {add}=fixture(),p=add({});
 assert.throws(()=>recordedPositionHistory({snapshots:[]},p.id,366),/Zeitraum/);
 await assert.rejects(()=>fetchPositionMarketHistory(p,{},0),/Kurszeitraum/);
});
