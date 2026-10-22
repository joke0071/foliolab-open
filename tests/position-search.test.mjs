import test from 'node:test';
import assert from 'node:assert/strict';
import {searchAndSortPositions} from '../src/position-search.js';
const model={providers:[{id:'a',name:'Flatex'},{id:'b',name:'Bank'}],accounts:[{id:'x',name:'Depot'},{id:'y',name:'Cash'}]};
const rows=[{id:'1',name:'Welt ETF',isin:'IE0000000001',kind:'etf',symbol:'WORLD',providerId:'a',accountId:'x',value:200,quoteAsOf:'2026-10-20'},{id:'2',name:'Bitcoin',symbol:'BTC',kind:'crypto',providerId:'b',accountId:'y',value:100,quoteAsOf:'2026-10-21'},{id:'3',name:'Aktie',symbol:'ACT',kind:'stock',providerId:'a',accountId:'x',value:400}];
test('Search includes name, ticker, ISIN, provider and account',()=>{
 for(const q of ['Welt','WORLD','IE0000000001'])assert.deepEqual(searchAndSortPositions(rows,model,q,'value',p=>p.value).map(p=>p.id),['1']);
 assert.deepEqual(searchAndSortPositions(rows,model,'Flatex','value',p=>p.value).map(p=>p.id),['3','1']);
 assert.deepEqual(searchAndSortPositions(rows,model,'Cash','value',p=>p.value).map(p=>p.id),['2']);
});
test('Sorting does not mutate underlying portfolio order',()=>{
 assert.deepEqual(searchAndSortPositions(rows,model,'','freshness',p=>p.value).map(p=>p.id),['2','1','3']);
 assert.deepEqual(searchAndSortPositions(rows,model,'','name',p=>p.value).map(p=>p.id),['3','2','1']);
 assert.deepEqual(rows.map(p=>p.id),['1','2','3']);
});
