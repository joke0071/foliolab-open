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
test('Confirmed local history precedes remote providers without unnecessary requests',async()=>{
 const p=position(),m=model(p);m.settings.eodhdKey='SYNTHETIC_KEY';m.priceHistories[p.id]=csvData();
 const {mount,target}=fakeMount();
 let calls=0;
 const fetcher=async()=>{calls++;return {ok:true,status:200,headers:{get:()=>null},json:async()=>[{date:daysAgo(2),close:99},{date:daysAgo(1),close:103}]};};
 await loadPositionDetail(p,m,mount,{...config,fetcher});
 assert.equal(calls,0);
 assert.match(target.innerHTML,/CSV-Daten vom Nutzer/);
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

test('Generic provider allocation spans multiple single-position accounts',()=>{
 const positions=[
  {id:'a',accountId:'cash-a',providerId:'provider-alpha',kind:'cash',name:'Savings A',symbol:'EUR',currency:'EUR',quantity:120,price:1},
  {id:'b',accountId:'cash-b',providerId:'provider-alpha',kind:'cash',name:'Savings B',symbol:'EUR',currency:'EUR',quantity:80,price:1},
  {id:'c',accountId:'cash-c',providerId:'provider-alpha',kind:'cash',name:'Savings C',symbol:'EUR',currency:'EUR',quantity:200,price:1},
  {id:'d',accountId:'asset-d',providerId:'provider-beta',kind:'cash',name:'Other provider',symbol:'EUR',currency:'EUR',quantity:1000,price:1}
 ];
 const accounts=[
  {id:'cash-a',providerId:'provider-alpha'},
  {id:'cash-b',providerId:'provider-alpha'},
  {id:'cash-c',providerId:'provider-alpha'},
  {id:'asset-d',providerId:'provider-beta'}
 ];
 const m={accounts,positions,priceHistories:{},settings:{}};
 const details=positions.slice(0,3).map(p=>positionDetailMarkup(p,m,config));
 assert.match(details[0],/Anteil am Anbieter<\/span><strong>30 %/);
 assert.match(details[1],/Anteil am Anbieter<\/span><strong>20 %/);
 assert.match(details[2],/Anteil am Anbieter<\/span><strong>50 %/);
 assert.doesNotMatch(details.join(''),/Anteil am Konto/);
 assert.match(positionDetailMarkup(positions[3],m,config),/Anteil am Anbieter<\/span><strong>100 %/);
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

test('Provider share handles multiple holdings within the same account across providers',()=>{
 const holdings=[
  {id:'a',accountId:'wallet-a',providerId:'provider-one',kind:'cash',name:'Daily account',symbol:'EUR',currency:'EUR',quantity:100,price:1},
  {id:'b',accountId:'wallet-a',providerId:'provider-one',kind:'cash',name:'Reserve 1',symbol:'EUR',currency:'EUR',quantity:100,price:1},
  {id:'c',accountId:'wallet-b',providerId:'provider-one',kind:'cash',name:'Reserve 2',symbol:'EUR',currency:'EUR',quantity:200,price:1},
  {id:'d',accountId:'wallet-c',providerId:'provider-two',kind:'cash',name:'Other provider',symbol:'EUR',currency:'EUR',quantity:1000,price:1}
 ];
 const m={positions:holdings,accounts:[
  {id:'wallet-a',providerId:'provider-one'},{id:'wallet-b',providerId:'provider-one'},
  {id:'wallet-c',providerId:'provider-two'}],settings:{},priceHistories:{}};
 const details=holdings.map(h=>positionDetailMarkup(h,m,config));
 assert.match(details[0],/Anteil am Anbieter<\/span><strong>25 %/);
 assert.match(details[1],/Anteil am Anbieter<\/span><strong>25 %/);
 assert.match(details[2],/Anteil am Anbieter<\/span><strong>50 %/);
 assert.match(details[3],/Anteil am Anbieter<\/span><strong>100 %/);
});
