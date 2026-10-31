import assert from 'node:assert/strict';
import test from 'node:test';
import {positionValueLabel,aggregateValuePresentation} from '../src/quote-quality.js';
import {renderProviderAccounts} from '../src/dashboard-ui.js';
import {blankModel,createProvider,createAccount,createPosition,valueEUR,money,escapeHTML} from '../src/model.js';
const missing={kind:'etf',quantityExact:'2.5',priceExact:'0'};
test('missing ETF/crypto quote is not presented as zero, without mutating input',()=>{
 for(const kind of ['etf','stock','fund','crypto']){const p={...missing,kind},before=JSON.stringify(p);assert.equal(positionValueLabel(p,0,money),'Nicht bewertet');assert.equal(JSON.stringify(p),before);}
});
test('real zero holdings and sourced zero quotes remain numeric; stored prices stay visible',()=>{
 assert.equal(positionValueLabel({...missing,quantityExact:'0'},0,money),money(0));
 assert.equal(positionValueLabel({...missing,quoteSource:'Synthetic provider'},0,money),money(0));
 assert.equal(positionValueLabel({...missing,valuationMode:'excluded'},0,money),money(0));
 assert.equal(positionValueLabel({...missing,priceExact:'12',priceStatus:'Gespeicherter Stichtag'},30,money),money(30));
 assert.equal(positionValueLabel({kind:'cash',quantity:0,price:1},0,money),money(0));
});
test('dashboard individual holding repeats the unknown label without changing aggregate calculations',()=>{
 const m=blankModel(),p=createProvider({id:'p',name:'Synthetic'});m.providers.push(p);const a=createAccount({id:'a',providerId:p.id,name:'Synthetic'},m);m.accounts.push(a);m.positions.push(createPosition({id:'missing',providerId:p.id,accountId:a.id,name:'Synthetic missing ETF',kind:'etf',quantity:2.5,price:0},m));const before=JSON.stringify(m);
 const html=renderProviderAccounts(m,money,valueEUR,escapeHTML);assert.match(html,/class="provider-holding-right"><strong>Nicht bewertet<\/strong>/);assert.equal(JSON.stringify(m),before);assert.equal(valueEUR(m.positions[0]),0);
});

test('aggregate missing-value evidence preserves real zeros, excluded aliases, stale values and liabilities',()=>{
 const quoted={...missing,priceExact:'10'},zero={...missing,quoteSource:'Synthetic zero'},excluded={...missing,valuationMode:'excluded'};
 const positions=[missing,{...missing,quantityExact:'-3'},quoted,zero,excluded,{...missing,quantityExact:'0'}];
 const before=structuredClone(positions),view=aggregateValuePresentation(positions,-5,money);
 assert.deepEqual(view,{missing:2,allUnknown:false,value:money(-5),note:'Bekannte Teilsumme · 2 Positionen ohne Kurs'});
 assert.deepEqual(positions,before);
 assert.equal(aggregateValuePresentation([missing,excluded],0,money).value,'Nicht bewertet');
 assert.equal(aggregateValuePresentation([missing],0,money).note,'1 Position ohne Kurs');
 for(const rows of [[],[zero],[excluded],[{...missing,quantityExact:'0'}],[{...quoted,priceStatus:'Abgeleitet'}]]){
  const v=aggregateValuePresentation(rows,0,money);assert.equal(v.value,money(0));assert.equal(v.missing,0);assert.equal(v.note,'');
 }
});
test('provider, account and category aggregates expose unknown totals without altering financial sums',async()=>{
 const {renderSummaryTiles}=await import('../src/dashboard-ui.js');
 const {allocationBreakdown,renderAllocationDonut}=await import('../src/allocation-ui.js');
 const m=blankModel(),provider=createProvider({id:'p',name:'Synthetic'});m.providers.push(provider);
 m.accounts.push(createAccount({id:'a',providerId:'p',name:'Unknown depot'},m),createAccount({id:'b',providerId:'p',name:'Known account'},m));
 m.positions.push(createPosition({id:'u',providerId:'p',accountId:'a',name:'Unknown stock',kind:'stock',quantity:2,price:0},m),createPosition({id:'c',providerId:'p',accountId:'b',name:'Known cash',kind:'cash',quantity:7,price:1},m));
 const before=JSON.stringify(m),html=renderProviderAccounts(m,money,valueEUR,escapeHTML),stats=renderSummaryTiles(m,money,valueEUR,escapeHTML,d=>d);
 assert.match(html,/Bekannte Teilsumme · 1 Position ohne Kurs/);assert.match(html,/aggregate-account-value"><strong>Nicht bewertet/);
 assert.match(stats,/stat-value">Nicht bewertet/);assert.match(stats,/1 Position ohne Kurs/);
 assert.match(html,/7,00/);assert.equal(JSON.stringify(m),before);assert.equal(m.positions.reduce((sum,p)=>sum+valueEUR(p),0),7);
 const valuation=aggregateValuePresentation([m.positions[0]],0,money);
 const donut=renderAllocationDonut({slices:[],gross:0,liabilities:0},{money,esc:escapeHTML,colors:{},netTotal:0,valuation});
 assert.match(donut.donut,/Nicht bewertet/);assert.doesNotMatch(donut.donut,/0,00/);
});
