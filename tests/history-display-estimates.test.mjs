import assert from 'node:assert/strict';
import {test} from 'node:test';
import {historyDisplayEstimates} from '../src/history-display-estimates.js';
import {historicalWealthView} from '../src/historical-portfolio-value.js';

const days=['2023-01-02','2023-01-03','2023-01-04'];
function setup(){
 const positions=[{id:'A',accountId:'p',kind:'etf',currency:'EUR',quantityExact:'2'},{id:'B',accountId:'p',kind:'etf',currency:'EUR',quantityExact:'3'}];
 const model={positions,accounts:[{id:'p'}],openingPositions:positions.map(p=>({positionId:p.id,quantityExact:p.quantityExact,asOf:days[0]})),bookings:[],journalEntries:[],externalCashFlows:[],snapshots:[],priceHistories:{
  A:{source:'CSV (selbst geprüft)',currency:'EUR',points:[{date:days[0],total:10},{date:days[2],total:16}]},
  B:{source:'CSV (selbst geprüft)',currency:'EUR',points:days.map(date=>({date,total:4}))}
 }};
 return {model,wealth:historicalWealthView(model)};
}

test('estimates one isolated missing close with unchanged exact books and independent real anchors',()=>{
 const {model,wealth}=setup(),before=structuredClone({model,wealth});
 assert.equal(wealth.basis,'reconstructed');
 assert.deepEqual(wealth.samples.map(row=>row.totalEURExact),['32','44']);
 assert.equal(wealth.projection.days[1].totalEURExact,null);
 assert.deepEqual(historyDisplayEstimates(wealth,model),[{date:days[1],before:days[0],after:days[2],totalEURExact:'38'}]);
 assert.deepEqual({model,wealth},before);
});

test('rejects cashflows, capital actions, changed holdings, and days with a recorded observation',()=>{
 const changes=[
  ({model})=>{model.externalCashFlows.push({date:days[1]});},
  ({model})=>{model.bookings.push({date:days[2],type:'split'});},
  ({model})=>{model.journalEntries.push({date:days[1]});},
  ({wealth})=>{wealth.projection.days.at(-1).components[0].quantityExact='3';},
  ({wealth})=>{wealth.projection.observations.push({date:days[1]});}
 ];
 for(const change of changes){const draft=setup();change(draft);assert.deepEqual(historyDisplayEstimates(draft.wealth,draft.model),[]);}
});

test('never estimates money conversion, unsupported scope, unpriced holdings, or longer gaps',()=>{
 const changes=[
  ({model})=>{model.positions[0].currency='USD';},
  ({model})=>{model.positions[0].wallet={enabled:true};},
  ({model})=>{model.positions[0].valuationMode='excluded';},
  ({wealth})=>{wealth.basis='partial';},
  ({wealth})=>{wealth.projection.days[1].missing[0].reason='Historischer EUR-Wechselkurs fehlt';},
  ({wealth})=>{wealth.projection.days.at(-1).date='2023-01-05';}
 ];
 for(const change of changes){const draft=setup();change(draft);assert.deepEqual(historyDisplayEstimates(draft.wealth,draft.model),[]);}
});
