import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileFlatexPositions,flatexCustodyAccounts} from '../src/flatex-reconciliation.js';

const isin='IE00BK5BQT80';
const model={
 providers:[{id:'f',name:'Flatex Österreich'},{id:'o',name:'Anderer Broker'}],
 accounts:[{id:'a',providerId:'f',type:'securities',name:'Depot A'},{id:'b',providerId:'f',type:'securities',name:'Depot B'},
  {id:'c',providerId:'o',type:'securities',name:'Fremdbroker'}],
 positions:[{id:'a1',accountId:'a',isin,quantityExact:'7',name:'ETF A'},
 {id:'b1',accountId:'b',isin,quantityExact:'10',name:'ETF B'},
 {id:'c1',accountId:'c',isin,quantityExact:'100',name:'ETF C'}]
};
const prepared={parsed:{rows:[
 {position:isin,type:'buy',date:'2026-01-03',quantity:'10',externalId:'tx-a'},
 {position:isin,type:'sell',date:'2026-02-01',quantity:'3',externalId:'tx-b'}
]}};
test('reconciliation scopes identical ISIN to expressly chosen Flatex account',()=>{
 assert.deepEqual(flatexCustodyAccounts(model).map(x=>x.id),['a','b']);
 const r=reconcileFlatexPositions(prepared,model,'a');
 assert.equal(r.results[0].status,'arithmetically-aligned');
 assert.equal(r.results[0].netQuantityExact,'7');
 assert.equal(r.results[0].currentQuantityExact,'7');
 assert.equal(r.results[0].impliedOpeningExact,'0');
 const other=reconcileFlatexPositions(prepared,model,'b');
 assert.equal(other.results[0].status,'opening-review');
 assert.equal(other.results[0].impliedOpeningExact,'3');
 assert.equal(model.positions[0].quantityExact,'7');
});
test('partial history with sells exceeding buys requires an opening, not a false negative holding',()=>{
 const r=reconcileFlatexPositions({parsed:{rows:[
  {position:isin,type:'sell',date:'2025-01-01',quantity:'5',externalId:'x'},
  {position:isin,type:'buy',date:'2025-02-01',quantity:'2',externalId:'y'}
 ]}},model,'a');
 assert.equal(r.results[0].hasNegativeInterim,true);
 assert.equal(r.results[0].status,'opening-review');
 assert.equal(r.results[0].impliedOpeningExact,'10');
});
test('missing account, missing ISIN and impossible history are explicitly distinguished',()=>{
 assert.throws(()=>reconcileFlatexPositions(prepared,model,'nonexistent'),/Depotabgleich/);
 assert.equal(reconcileFlatexPositions(prepared,{...model,positions:[]},'a').results[0].status,'unmatched');
 const impossible={...model,positions:model.positions.map(p=>p.id==='a1'?{...p,quantityExact:'1'}:p)};
 assert.equal(reconcileFlatexPositions(prepared,impossible,'a').results[0].status,'inconsistent');
});
test('all matches in a chosen account are checked without ever changing the portfolio',()=>{
 const clone=structuredClone(model);
 const result=reconcileFlatexPositions(prepared,clone,'a');
 assert.deepEqual(clone,model);
 assert.equal(result.results.length,1);
 assert.equal(result.accountId,'a');
});
