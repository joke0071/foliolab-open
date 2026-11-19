import test from 'node:test';
import assert from 'node:assert/strict';
import {availablePositionPeriods,fetchPositionMarketHistory,observedPositionPeriods} from '../src/position-history.js';
import {positionDetailMarkup,loadPositionDetail} from '../src/position-detail-ui.js';
import {blankModel,createProvider,createAccount,createPosition,escapeHTML,money,valueEUR} from '../src/model.js';
const ago=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
const security={id:'etf',kind:'etf',symbol:'VWCE',exchange:'Xetra',mic:'XETR',currency:'EUR'};
const crypto={id:'btc',kind:'crypto',coinId:'bitcoin',symbol:'BTC'};
test('Free crypto histories stay capped at one year even when keys are configured',async()=>{
 assert.deepEqual(availablePositionPeriods(crypto,{settings:{coinGeckoKey:'DEMO_KEY'}}),[7,30,90,180,365]);
 await assert.rejects(()=>fetchPositionMarketHistory(crypto,{},1826,async()=>{throw Error('Must not request');}),/höchstens 1 Jahr/);
});
test('Long periods are conditional on a verified listing and actual CSV history',()=>{
 assert.deepEqual(availablePositionPeriods(security,{settings:{}}),[7,30,90,180,365]);
 assert.deepEqual(availablePositionPeriods(security,{settings:{eodhdWorkerEndpoint:'https://own.workers.dev',eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_12345'}}),[7,30,90,180,365,1096,1826]);
 const csv={points:[{date:ago(2200),total:50},{date:ago(1600),total:80},{date:ago(1),total:100}]};
 assert.deepEqual(availablePositionPeriods(security,{settings:{},priceHistories:{etf:csv}}),[7,30,90,180,365,1096,1826,'max']);
 const shorter={points:[{date:ago(700),total:50},{date:ago(1),total:100}]};
 assert.deepEqual(availablePositionPeriods(security,{settings:{},priceHistories:{etf:shorter}}),[7,30,90,180,365,'max']);
 assert.deepEqual(availablePositionPeriods({...security,exchange:'',mic:''},{settings:{eodhdWorkerEndpoint:'https://own.workers.dev',eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_12345'}}),[7,30,90,180,365]);
});
test('Max cannot be fabricated from a partial remote feed',async()=>{
 await assert.rejects(()=>fetchPositionMarketHistory(security,{eodhdWorkerEndpoint:'https://own.workers.dev',eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_12345'},'max',async()=>{throw Error('Never called');}),/nur für lokal importierte/);
});

function detailModel(kind='etf'){
 const m=blankModel();m.settings.autoRefresh=false;
 m.providers.push(createProvider({id:'p',name:'Synthetic period broker'}));
 m.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic period depot',type:'securities'},m));
 const p=createPosition({id:'asset',providerId:'p',accountId:'a',name:'Synthetic period asset',kind,symbol:kind==='crypto'?'BTC':'VWCE',coinId:kind==='crypto'?'bitcoin':'',exchange:'Xetra',mic:'XETR',quantity:2,price:100},m);
 m.positions.push(p);return {m,p};
}
const display={esc:escapeHTML,money,quant:String,valueEUR,dateLabel:d=>d};
const longCSV=()=>({source:'CSV (selbst geprüft)',currency:'EUR',points:[{date:ago(2200),total:50},{date:ago(1650),total:80},{date:ago(5),total:95},{date:ago(2),total:100}]});
test('Observed windows require coverage at both ends and through the interval',()=>{
 const now=Date.UTC(2026,10,19,12);
 const point=offset=>({date:new Date(now-offset*86400000).toISOString().slice(0,10),total:100});
 const periods=[7,30,90,180,365,1096,1826,'max'];
 const sparse=[point(365),point(8),point(5),point(2)];
 assert.deepEqual(observedPositionPeriods(sparse,periods,{now}),[7,'max']);
 assert.deepEqual(observedPositionPeriods(sparse,periods,{now,crypto:true}),['max']);
 const fiveYears=Array.from({length:1826},(_,offset)=>point(offset));
 assert.deepEqual(observedPositionPeriods(fiveYears,periods,{now}),periods);
 const holiday=fiveYears.filter((_,offset)=>offset<10||offset>14);
 assert.ok(observedPositionPeriods(holiday,periods,{now}).includes(30));
 const missingWeek=fiveYears.filter((_,offset)=>offset<10||offset>17);
 assert.deepEqual(observedPositionPeriods(missingWeek,periods,{now}),[7,'max']);
});
test('Detail markup offers only the actions valid before price observations arrive',()=>{
 for(const kind of ['etf','crypto']){
  const {m,p}=detailModel(kind);
  if(kind==='etf')Object.assign(m.settings,{eodhdWorkerEndpoint:'https://own.workers.dev',eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_12345'});
  m.priceHistories[p.id]=longCSV();
  const before=JSON.stringify(m),html=positionDetailMarkup(p,m,display);
  assert.doesNotMatch(html,/data-position-range/,'no range is advertised before actual coverage is known');
  if(kind==='etf')assert.match(html,/<details class="position-period-more">.*data-action="remove-price-history"/);
  else assert.doesNotMatch(html,/data-action="import-price-history"/,'legacy history does not expose unsupported crypto CSV import');
  assert.equal(JSON.stringify(m),before,'render leaves canonical data unchanged');
 }
});
test('Uncovered three-year request displays actual CSV extent with gaps and no network',async()=>{
 const {m,p}=detailModel();m.priceHistories[p.id]=longCSV();const before=JSON.stringify(m);
 const target={isConnected:true,innerHTML:'',querySelector:()=>null};
 const mount={isConnected:true,dataset:{},querySelector:s=>s==='.position-history-plot'?target:null};
 let calls=0;
 await loadPositionDetail(p,m,mount,{...display,days:1096,fetcher:async()=>{calls++;throw Error('Local history must not fetch');}});
 assert.match(target.innerHTML,new RegExp('Tatsächlich verfügbare Kurse: '+ago(2200)+' bis '+ago(2)));
 assert.match(target.innerHTML,/Fehlende Kurse werden nicht ergänzt/);
 assert.match(target.innerHTML,/<path d="M[\d. ]+M/,'multi-year gaps are not connected');
 assert.equal(calls,0);
 assert.equal(JSON.stringify(m),before,'history observations and financial data unchanged');
});
