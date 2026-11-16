import test from 'node:test';
import assert from 'node:assert/strict';
import {searchAndSortPositions,positionValueThreshold,filterSmallPositionValues,positionListScope} from '../src/position-search.js';
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

const holding=(id,value,extra={})=>({id,kind:'etf',quantity:1,quantityExact:'1',price:Number(value),priceExact:value,currency:'EUR',fxRate:1,fxRateExact:'1',quoteSource:'Synthetic exact quote',...extra});
test('UI-R4 threshold defaults to all, accepts German decimals and rejects ambiguous/negative values',()=>{
 for(const v of ['', ' ', '0','0,00'])assert.equal(positionValueThreshold(v),'0');
 assert.equal(positionValueThreshold(' 1,2300 '),'1.23');
 for(const v of ['-1','1,000.00','NaN','Infinity','1e2','0.0000000000000000001','1'.repeat(61)])assert.throws(()=>positionValueThreshold(v));
});
test('UI-R4 exact boundary, zero and UNKNOWN remain separate with no model mutation',()=>{
 const ps=[holding('below','0.999999999999999999'),holding('equal','1'),holding('above','1.000000000000000001'),holding('zero','0'),holding('noquote','0',{quoteSource:''}),holding('unknownfx','0.01',{currency:'USD',fxRate:null,fxRateExact:'UNKNOWN'}),holding('excluded','0.01',{valuationMode:'excluded'}),holding('liability','0.01',{valuationMode:'liability'})];
 const before=JSON.stringify(ps);
 assert.deepEqual(filterSmallPositionValues(ps).map(p=>p.id),ps.map(p=>p.id));
 assert.deepEqual(filterSmallPositionValues(ps,'1').map(p=>p.id),['equal','above','noquote','unknownfx','excluded','liability']);
 assert.equal(JSON.stringify(ps),before);
 assert.notEqual(filterSmallPositionValues(ps),ps);
});
test('UI-R4 selection sees only filtered list; archive scope and paging inputs stay explicit',async()=>{
 const {updatePositionSelection,positionSelectionSummary}=await import('../src/position-selection.js');
 const ps=Array.from({length:205},(_,i)=>holding('p'+i,i%2?'2':'0.01',{archived:i===204}));
 const m={positions:ps,providers:[],accounts:[],bookings:[],snapshots:[],journalEntries:[],openingPositions:[],externalCashFlows:[],settings:{}};
 const before=JSON.stringify(m),allIds=ps.map(p=>p.id),active=positionListScope(ps),shown=filterSmallPositionValues(active,'1').map(p=>p.id);
 const selected=updatePositionSelection(m,[],{type:'filtered',matchingIds:shown});
 assert.equal(selected.length,102);assert.equal(selected.includes('p204'),false);
 const summary=positionSelectionSummary(m,allIds,shown);assert.equal(summary.selectedCount,205);assert.equal(summary.inFilterCount,102);assert.equal(summary.hiddenCount,103);
 assert.deepEqual(filterSmallPositionValues(positionListScope(ps,{view:'archived'}),'1'),[]);
 assert.equal(JSON.stringify(m),before);
});
