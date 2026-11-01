import test from 'node:test';
import assert from 'node:assert/strict';
import {availablePositionPeriods,fetchPositionMarketHistory} from '../src/position-history.js';
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
test('Actual supported presets remain reachable in detail controls, including three years',()=>{
 for(const kind of ['etf','crypto']){
  const {m,p}=detailModel(kind);
  const rendered=(selected,controlsExpected=true)=>{
   const before=JSON.stringify(m),html=positionDetailMarkup(p,m,{...display,days:selected});
   assert.equal(JSON.stringify(m),before,'render leaves canonical data unchanged');
   const values=new Set([...html.matchAll(/data-position-range="([^"]+)"/g)].map(x=>x[1]));
   assert.deepEqual(values,new Set(controlsExpected?availablePositionPeriods(p,m).map(String):[]),'no allowed preset dropped and no unsupported preset invented; no empty chart controls');
   return html;
  };
  assert.doesNotMatch(rendered(30,kind==='crypto'),/data-position-range="1096"/);
  m.priceHistories[p.id]=longCSV();
  for(const selected of [30,1096,1826,'max']){
   const html=rendered(selected);
   assert.match(html,/data-position-range="1096"[^>]*>3 J<\/button>/);
   if(selected===1096)assert.match(html,/data-position-range="1096" aria-pressed="true" class="selected">3 J/);
   if(selected===1096)assert.match(html,/<summary aria-label="Ausgewählter Zeitraum 3 J\. Weitere Zeiträume auswählen" title="Weitere Zeiträume">3 J<\/summary>/);
   if(selected===1826)assert.match(html,/<summary aria-label="Ausgewählter Zeitraum 5 J\. Weitere Zeiträume auswählen" title="Weitere Zeiträume">5 J<\/summary>/);
   if(kind==='crypto')assert.doesNotMatch(html,/data-action="import-price-history"/,'legacy history does not expose unsupported crypto CSV import');
  }
  m.priceHistories[p.id]={source:'CSV (selbst geprüft)',currency:'EUR',points:[{date:ago(700),total:80},{date:ago(2),total:100}]};
  assert.doesNotMatch(rendered(30),/data-position-range="1096"/);
  if(kind==='etf'){
   m.priceHistories={};Object.assign(m.settings,{eodhdWorkerEndpoint:'https://own.workers.dev',eodhdWorkerAccessToken:'SYNTHETIC_WORKER_ACCESS_TOKEN_12345'});
   assert.match(rendered(1096),/data-position-range="1096" aria-pressed="true"/);
  }
 }
});
test('Three-year local view reports actual coverage and never requests or invents older prices',async()=>{
 const {m,p}=detailModel();m.priceHistories[p.id]=longCSV();const before=JSON.stringify(m);
 const target={isConnected:true,innerHTML:'',querySelector:()=>null};
 const mount={isConnected:true,dataset:{},querySelector:s=>s==='.position-history-plot'?target:null};
 await loadPositionDetail(p,m,mount,{...display,days:1096,fetcher:async()=>{throw Error('Local three-year view must not fetch');}});
 assert.match(target.innerHTML,new RegExp('Tatsächlich verfügbare Kurse: '+ago(5)+' bis '+ago(2)));
 assert.match(target.innerHTML,/Fehlende frühere Kurse werden nicht ergänzt/);
 assert.equal(JSON.stringify(m),before,'history observations and financial data unchanged');
});
