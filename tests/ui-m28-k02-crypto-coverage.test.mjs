import test from 'node:test';
import assert from 'node:assert/strict';
import {availablePositionPeriods,fetchPositionMarketHistory} from '../src/position-history.js';
import {importedHistoryForPeriod} from '../src/historical-csv.js';
import {blankModel,createProvider,createAccount,createPosition,safeImport,backup} from '../src/model.js';

const NOW=Date.parse('2026-10-30T12:00:00Z');
const ago=days=>new Date(NOW-days*864e5).toISOString().slice(0,10);
const STANDARD=[7,30,90,180,365];
const extended=[...STANDARD,1096,1826,'max'];

function cryptoCase(symbol='BTC',coinId='bitcoin'){
 const model=blankModel();
 model.providers.push(createProvider({id:'period-provider',name:'Synthetic period provider',type:'broker'}));
 model.accounts.push(createAccount({id:'period-account',providerId:'period-provider',name:'Synthetic account',type:'wallet'},model));
 const position=createPosition({id:'period-crypto',providerId:'period-provider',accountId:'period-account',name:'Synthetic '+symbol,kind:'crypto',symbol,coinId,currency:'EUR',quantity:1,price:100},model);
 model.positions.push(position);
 return {model,position};
}
function setLocalHistory(model,position,days){
 model.priceHistories[position.id]={source:'CSV (selbst geprüft)',currency:'EUR',points:days.map((d,i)=>({date:ago(d),total:50+i*10})).sort((a,b)=>a.date.localeCompare(b.date))};
}
function validated(model){return safeImport(JSON.parse(backup(model,{includeHistory:true})));}

test('K02: BTC, ETH and SOL cannot offer long periods without actual locally validated historical days',()=>{
 for(const [symbol,coinId] of [['BTC','bitcoin'],['ETH','ethereum'],['SOL','solana']]){
  const {model,position}=cryptoCase(symbol,coinId);
  model.settings.coinGeckoKey='SYNTHETIC';
  assert.deepEqual(availablePositionPeriods(position,model,NOW),STANDARD);
  const clean=validated(model);
  assert.deepEqual(availablePositionPeriods(position,clean,NOW),STANDARD);
  assert.equal(Object.hasOwn(clean.priceHistories,position.id),false);
 }
});

test('K02: 365/366 and 1800/1801 calendar-day gates expose only evidenced options',()=>{
 const {model,position}=cryptoCase();
 for(const [oldDays,expected] of [[365,STANDARD],[366,[...STANDARD,'max']],[1800,[...STANDARD,'max']],[1801,extended]]){
  setLocalHistory(model,position,[oldDays,1]);
  const clean=validated(model),before=JSON.stringify(clean);
  assert.deepEqual(availablePositionPeriods(position,clean,NOW),expected,`${oldDays} days`);
  assert.equal(JSON.stringify(clean),before,'period selection never mutates model');
 }
});

test('K02: 3 years, 5 years and Max select actual local crypto price days after backup/restore',()=>{
 const {model,position}=cryptoCase('ETH','ethereum');
 setLocalHistory(model,position,[2200,1800,1200,900,1]);
 const restored=validated(model),before=JSON.stringify(restored);
 assert.deepEqual(availablePositionPeriods(position,restored,NOW),extended);
 assert.deepEqual(importedHistoryForPeriod(restored,position,1096,NOW).points.map(p=>p.date),[ago(900),ago(1)]);
 assert.deepEqual(importedHistoryForPeriod(restored,position,1826,NOW).points.map(p=>p.date),[ago(1800),ago(1200),ago(900),ago(1)]);
 assert.deepEqual(importedHistoryForPeriod(restored,position,'max',NOW).points.map(p=>p.date),[ago(2200),ago(1800),ago(1200),ago(900),ago(1)]);
 assert.equal(JSON.stringify(restored),before,'no invented interpolation or source mutation');
});

test('K02: unsafe local histories fail closed on restore (unsorted, conflicting dates, invalid calendar, wrong FX currency)',()=>{
 const {model,position}=cryptoCase('SOL','solana');
 setLocalHistory(model,position,[900,1]);
 const valid=JSON.parse(backup(model,{includeHistory:true}));
 const cases=[
  h=>h.points.reverse(),
  h=>{h.points[1].date=h.points[0].date;},
  h=>{h.points[0].date='2026-02-30';},
  h=>{h.currency='USD';}
 ];
 for(const mutate of cases){const altered=structuredClone(valid);mutate(altered.priceHistories[position.id]);assert.throws(()=>safeImport(altered),/historisch|Kurs|Währung|sortiert|Beschädigte|Datum/i);}
});

test('K02: long remote crypto requests remain blocked without a provider call or a mandatory new key',async()=>{
 for(const [symbol,coinId] of [['BTC','bitcoin'],['ETH','ethereum'],['SOL','solana']]){
  const {position}=cryptoCase(symbol,coinId);
  let calls=0;const blocked=async()=>{calls++;throw Error('Remote service must not be contacted');};
  await assert.rejects(()=>fetchPositionMarketHistory(position,{coinGeckoKey:'SYNTHETIC'},1096,blocked),/höchstens 1 Jahr/);
  await assert.rejects(()=>fetchPositionMarketHistory(position,{},1826,blocked),/höchstens 1 Jahr/);
  await assert.rejects(()=>fetchPositionMarketHistory(position,{},'max',blocked),/nur für lokal importierte/);
  assert.equal(calls,0,'never use unsupported remote long-range requests');
 }
});
