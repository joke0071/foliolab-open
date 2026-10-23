import test from 'node:test';
import assert from 'node:assert/strict';
import {positionDetailMarkup,loadPositionDetail,safeHistoryError} from '../src/position-detail-ui.js';

const today=()=>new Date().toISOString().slice(0,10);
const daysAgo=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
const position=()=>({id:'vwce-test',kind:'etf',accountId:'a',symbol:'VWCE',name:'Vanguard FTSE All-World',isin:'IE00BK5BQT80',exchange:'Xetra',mic:'XETR',currency:'EUR',quantity:2,price:100});
const model=p=>({accounts:[{id:'a'}],positions:[p],snapshots:[],priceHistories:{},settings:{securitySource:'auto'}});
const config={esc:x=>String(x),money:x=>'€ '+x,quant:x=>String(x),valueEUR:p=>Number(p.quantity)*Number(p.price),dateLabel:d=>d};
const csvData=()=>({source:'CSV (selbst geprüft)',currency:'EUR',points:[{date:daysAgo(2),total:50},{date:daysAgo(1),total:51}]});
function fakeMount(){
 const target={isConnected:true,innerHTML:'',querySelector:()=>null};
 const mount={isConnected:true,dataset:{},querySelector:selector=>selector==='.position-history-plot'?target:null};
 return {mount,target};
}
test('ETF shows native chart first and hides CSV/TradingView in one native disclosure',()=>{
 const p=position(),m=model(p);m.settings.eodhdKey='SYNTHETIC_KEY';
 const html=positionDetailMarkup(p,m,config);
 assert.match(html,/position-history-plot/);
 assert.match(html,/<details class="position-chart-options"><summary>Weitere Kursoptionen<\/summary>/);
 assert.ok(html.indexOf('position-history-plot')<html.indexOf('position-chart-options'));
 assert.ok(html.indexOf('data-position-range')<html.indexOf('position-chart-options'));
 assert.ok(html.includes('CSV-Kursverlauf importieren'));
 assert.ok(html.includes('Öffentliches Diagramm laden'));
 assert.ok(!html.includes('Gespeicherter Positionswert'));
});
test('Without a provider, ETF never charts snapshot value as if it were a market price',()=>{
 const p=position(),m=model(p);
 m.snapshots=[{date:daysAgo(2),source:'current',byPosition:{'vwce-test':100}},{date:daysAgo(1),source:'current',byPosition:{'vwce-test':150}}];
 const html=positionDetailMarkup(p,m,config);
 assert.doesNotMatch(html,/position-history-plot/);
 assert.match(html,/Kein nativer Kursverlauf/);
 assert.match(html,/Weitere Kursoptionen/);
});
test('Configured EODHD key with missing exchange explains the listing problem',()=>{
 const p=position();p.exchange='';p.mic='';
 const m=model(p);m.settings.eodhdKey='SYNTHETIC_KEY';
 const html=positionDetailMarkup(p,m,config);
 assert.match(html,/Handelsplatz/);
 assert.doesNotMatch(html,/position-history-plot/);
});
test('EODHD market history outranks a valid imported CSV; CSV remains a fallback',async()=>{
 const p=position(),m=model(p);m.settings.eodhdKey='SYNTHETIC_KEY';m.priceHistories[p.id]=csvData();
 const {mount,target}=fakeMount();
 let calls=0;
 const fetcher=async()=>{calls++;return {ok:true,status:200,headers:{get:()=>null},json:async()=>[{date:daysAgo(2),close:99},{date:daysAgo(1),close:103}]};};
 await loadPositionDetail(p,m,mount,{...config,fetcher});
 assert.ok(calls>0);
 assert.match(target.innerHTML,/EODHD/);
 assert.doesNotMatch(target.innerHTML,/CSV-Daten vom Nutzer/);
 const failMount=fakeMount();
 await loadPositionDetail(p,m,failMount.mount,{...config,fetcher:async()=>({ok:false,status:401,headers:{get:()=>null}})});
 assert.match(failMount.target.innerHTML,/CSV-Daten vom Nutzer/);
});

test('Failed EODHD request collapses its chart, hides periods and never exposes the key',async()=>{
 const p=position(),m=model(p);
 const secret='SYNTHETIC_SECRET_TEST_ONLY';
 m.settings.eodhdKey=secret;
 const period={classList:{items:new Set(),add(x){this.items.add(x)},remove(x){this.items.delete(x)}}};
 const target={isConnected:true,innerHTML:''};
 const mount={isConnected:true,dataset:{},querySelector:selector=>selector==='.position-history-plot'?target:selector==='.position-period'?period:null};
 const fetcher=async url=>{throw new TypeError('Failed to fetch '+url)};
 await loadPositionDetail(p,m,mount,{...config,fetcher});
 assert.ok(period.classList.items.has('hidden'));
 assert.match(target.innerHTML,/<details class="position-history-compact"><summary>Kursverlauf nicht verfügbar<\/summary>/);
 assert.match(target.innerHTML,/data-action="retry-price-chart"/);
 assert.match(target.innerHTML,/CORS/);
 assert.doesNotMatch(target.innerHTML,/SYNTHETIC_SECRET/);
});
test('Only specific safe non-truncated failure guidance is shown',()=>{
 assert.match(safeHistoryError(new Error('HTTP 403')),/Tarif/);
 assert.match(safeHistoryError(new Error('Ratenlimit erreicht')),/Abruflimit/);
 assert.match(safeHistoryError(new Error('EODHD im Browser nicht erreichbar (Netzwerk/CORS)'),{security:true}),/nicht überprüft/);
});

test('Klarna savings and term deposits show their provider share instead of 100% each',()=>{
 const positions=[
  {id:'flex',accountId:'flex-account',providerId:'klarna',kind:'cash',name:'Flexkonto',symbol:'EUR',currency:'EUR',quantity:9765.54,price:1},
  {id:'fixed-6',accountId:'fixed-6-account',providerId:'klarna',kind:'cash',name:'Festgeld 6 Monate',symbol:'EUR',currency:'EUR',quantity:5000,price:1},
  {id:'fixed-12',accountId:'fixed-12-account',providerId:'klarna',kind:'cash',name:'Festgeld 12 Monate',symbol:'EUR',currency:'EUR',quantity:5000,price:1},
  {id:'etf',accountId:'flatex-account',providerId:'flatex',kind:'etf',name:'ETF',symbol:'VWCE',currency:'EUR',quantity:50000,price:1}
 ];
 const accounts=[
  {id:'flex-account',providerId:'klarna'},
  {id:'fixed-6-account',providerId:'klarna'},
  {id:'fixed-12-account',providerId:'klarna'},
  {id:'flatex-account',providerId:'flatex'}
 ];
 const m={accounts,positions,priceHistories:{},settings:{}};
 const totals=positions.slice(0,3).map(p=>positionDetailMarkup(p,m,config));
 assert.match(totals[0],/Anteil am Anbieter<\/span><strong>49,4 %/);
 assert.match(totals[1],/Anteil am Anbieter<\/span><strong>25,3 %/);
 assert.match(totals[2],/Anteil am Anbieter<\/span><strong>25,3 %/);
 assert.doesNotMatch(totals.join(''),/Anteil am Konto/);
 const unrelated=positionDetailMarkup(positions[3],m,config);
 assert.match(unrelated,/Anteil am Anbieter<\/span><strong>100 %/);
});
test('Provider allocations exclude separately configured providers and handle liabilities defensively',()=>{
 const p={id:'one',accountId:'a',providerId:'p',kind:'cash',symbol:'EUR',quantity:100,price:1,currency:'EUR'};
 const q={id:'two',accountId:'b',providerId:'q',kind:'cash',symbol:'EUR',quantity:999,price:1,currency:'EUR'};
 const m={accounts:[{id:'a',providerId:'p'},{id:'b',providerId:'q'}],positions:[p,q],settings:{},priceHistories:{}};
 assert.match(positionDetailMarkup(p,m,config),/Anteil am Anbieter<\/span><strong>100 %/);
 const bad={...p,id:'liability'};
 m.positions=[bad,{...p,id:'negative',quantity:-200}];
 assert.match(positionDetailMarkup(bad,m,config),/Anteil am Anbieter nicht sinnvoll bestimmbar/);
});
