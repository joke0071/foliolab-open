import assert from 'node:assert/strict';
import {test} from 'node:test';
import {modeledWealthSeries} from '../src/wealth-model-history.js';
import {historicalWealthView} from '../src/historical-portfolio-value.js';

const days=['2023-01-02','2023-01-03','2023-01-04','2023-01-05','2023-01-06'];
const history=(totals,currency='EUR',fxPoints=[])=>({source:'CSV (selbst geprüft)',currency,fxPoints,points:totals.flatMap((total,i)=>total===null?[]:[{date:days[i],total}])});
const rates=(values,currency='USD')=>values.flatMap((rate,i)=>rate===null?[]:[{date:days[i],currency,source:'Frankfurter',rate}]);
const position=(id,kind,quantityExact,currency='EUR',extra={})=>({id,kind,currency,quantityExact,accountId:'a',...extra});
const portfolio=(positions,priceHistories,extra={})=>({positions,priceHistories,accounts:[{id:'a'}],bookings:[],snapshots:[],...extra});
const values=result=>result.samples.map(({date,totalEURExact,breakBefore})=>[date,totalEURExact,breakBefore]);

test('uses constant exact holdings and cash, distinct from actual history and without writes',()=>{
 const m=portfolio([position('e','etf','2'),position('b','crypto','0.5'),position('cash','cash','40'),position('old','fund','0')],{
  e:history([10,12,14]),b:history([20,30,40])
 },{snapshots:[{date:days[0],id:'real',totalEURExact:'999'}]});
 const original=structuredClone(m),wealthBefore=historicalWealthView(m);
 assert.deepEqual(values(modeledWealthSeries(m)),[[days[0],'70',false],[days[1],'79',false],[days[2],'88',false]]);
 assert.deepEqual(m,original);
 assert.deepEqual(historicalWealthView(m),wealthBefore);
 assert.equal(wealthBefore.samples[0].totalEURExact,'999');
});

test('requires every dated market and FX value, preserves gaps and signs liabilities',()=>{
 const m=portfolio([position('e','etf','2','USD'),position('g','cash','20','USD'),position('debt','cash','3','EUR',{valuationMode:'liability'}),position('b','crypto','0.5')],{
  e:history([10,12,14,16,18],'USD',rates(['0.8','0.8',null,'0.9','0.8'])),b:history([20,null,40,50,60])
 });
 const result=modeledWealthSeries(m);
 assert.deepEqual(values(result),[[days[0],'39',false],[days[3],'68.8',true],[days[4],'71.8',false]]);
 assert.match(result.reason,/historischer Kurs/);
 assert.match(result.reason,/historischer EUR-Wechselkurs/);
});

test('drops pre-action values and refuses insufficient coverage instead of drawing a trend',()=>{
 const m=portfolio([position('e','etf','4')],{e:history([20,22,12,13,14])},{bookings:[{type:'split',positionId:'e',date:days[2]}]});
 assert.deepEqual(values(modeledWealthSeries(m)),[[days[3],'52',false],[days[4],'56',false]]);
 m.journalEntries=[{type:'merger',date:days[3],postings:[{positionId:'e'}]}];
 assert.equal(modeledWealthSeries(m).samples.length,0);
 assert.match(modeledWealthSeries(m).reason,/Kapitalmaßnahme/);
});

test('requires a confirmed matching representation and refuses duplicate active wallets',()=>{
 const wallet={enabled:true,chain:'evm',chainId:1,address:'0x0000000000000000000000000000000000000001'};
 const m=portfolio([position('a','crypto','1','EUR',{wallet}),position('b','crypto','1','EUR',{wallet,valuationMode:'excluded',representedByPositionId:'a'})],{a:history([10,20])});
 assert.deepEqual(values(modeledWealthSeries(m)),[[days[0],'10',false],[days[1],'20',false]]);
 m.positions[1].quantityExact='2';
 assert.match(modeledWealthSeries(m).reason,/Zuordnung/);
 m.positions[1].valuationMode='included';
 assert.match(modeledWealthSeries(m).reason,/Überlappende Wallet/);
});

test('refuses conflicting FX rates and dates, zero/negative prices, and fictional EUR cash dates',()=>{
 const m=portfolio([position('e','etf','1','USD'),position('s','stock','1','USD')],{
  e:history([2,4,6,8],'USD',rates(['0.8','0.8','0.8','0.8'])),s:history([3,5,7,9],'USD',rates(['0.8','0.9','0.8','0.8']))
 });
 m.priceHistories.s.fxPoints[2].referenceDate=days[1];
 assert.deepEqual(values(modeledWealthSeries(m)),[[days[0],'4',false],[days[3],'13.6',true]]);
 m.priceHistories.s.points[2].total=0;
 assert.equal(modeledWealthSeries(m).samples.length,0);
 const cash=portfolio([position('g','cash','100')],{});
 assert.equal(modeledWealthSeries(cash).samples.length,0);
});
