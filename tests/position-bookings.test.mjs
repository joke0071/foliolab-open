import test from 'node:test';
import assert from 'node:assert/strict';
import {positionBookingTimeline} from '../src/position-bookings.js';
import {positionDetailMarkup} from '../src/position-detail-ui.js';

const p={id:'f1',name:'Flatex ETF',providerId:'f',accountId:'accountA',kind:'etf',isin:'IE00BK5BQT80',
 quantity:7,quantityExact:'7',price:100,priceExact:'100',currency:'EUR',costBasisEUR:null};
const other={...p,id:'f2',accountId:'accountB',name:'Anderes Depot'};
const model={providers:[{id:'f',name:'Flatex Österreich'}],
 accounts:[{id:'accountA',providerId:'f',name:'Depot A'},{id:'accountB',providerId:'f',name:'Depot B'}],
 positions:[p,other],settings:{},bookings:[
  {id:'a',positionId:'f1',date:'2026-10-20',type:'buy',quantityExact:'10',amountExactEUR:'1000',importFingerprint:'flatex:a'},
  {id:'b',positionId:'f1',date:'2026-10-22',type:'sell',quantityExact:'3',amountExactEUR:'320',importFingerprint:'flatex:b'},
  {id:'c',positionId:'f2',date:'2026-10-23',type:'buy',quantityExact:'100',amountExactEUR:'10000'},
  {id:'d',positionId:'cash',date:'2026-10-24',type:'dividend',quantityExact:'5',amountExactEUR:'5',notes:'Dividendenzahlung Flatex ETF'}
 ]};
test('timeline isolates custody position IDs and does not infer a dividend based on a label',()=>{
 const result=positionBookingTimeline(model,'f1');
 assert.equal(result.total,2);
 assert.deepEqual(result.events.map(e=>e.id),['b','a']);
 assert.equal(result.events[0].type,'sell');
 assert.equal(result.events[0].source,'csv');
 assert.equal(result.hasMore,false);
});
test('length limiting and missing positions do not expose other accounts',()=>{
 const limited=positionBookingTimeline(model,'f1',{limit:1});
 assert.equal(limited.hasMore,true);
 assert.equal(limited.events.length,1);
 assert.equal(positionBookingTimeline(model,'absent').total,0);
 assert.throws(()=>positionBookingTimeline(model,'f1',{limit:0}),/Limit/);
});
test('accessible details show only real position bookings without imaginary profits',()=>{
 const markup=positionDetailMarkup(p,model,{
  esc:x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),
  money:x=>'€'+x,quant:x=>String(x),valueEUR:x=>x.quantity*x.price
 });
 assert.match(markup,/Gebuchte Vorgänge \(2\)/);
 assert.match(markup,/22\.10\.2026 · Verkauf/);
 assert.match(markup,/20\.10\.2026 · Kauf/);
 assert.doesNotMatch(markup,/2026-10-23 · Kauf/);
 assert.doesNotMatch(markup,/Dividendenzahlung Flatex ETF/);
 assert.match(markup,/kein belegter Nettogewinn/);
});
