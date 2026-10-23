import test from 'node:test';
import assert from 'node:assert/strict';
import {positionDetailMarkup,loadPositionDetail} from '../src/position-detail-ui.js';

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
