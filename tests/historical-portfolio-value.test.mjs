import test from 'node:test';import assert from 'node:assert/strict';
import {blankModel,createProvider,createPosition} from '../src/model.js';import {executeTransaction} from '../src/transactions.js';import {projectHistoricalPortfolio} from '../src/historical-portfolio-value.js';
function fixture(){const m=blankModel();m.providers.push(createProvider({id:'provider',name:'Synthetic',type:'broker'}));m.positions.push(createPosition({id:'cash',providerId:'provider',name:'Cash',kind:'cash',currency:'EUR',quantity:1000,price:1},m));m.positions.push(createPosition({id:'etf',providerId:'provider',name:'ETF',kind:'etf',quantity:0,price:100},m));executeTransaction(m,{positionId:'etf',cashPositionId:'cash',date:'2023-01-02',type:'buy',quantity:6,unitPrice:100,feeEUR:1});m.openingPositions.find(p=>p.positionId==='cash').asOf='2023-01-01';m.priceHistories.etf={currency:'EUR',source:'CSV (selbst geprüft)',points:[{date:'2023-01-02',total:100},{date:'2023-01-03',total:110}]};return m;}
test('internally financed ETF conserves 1000 -> 399 cash + 600 ETF = 999, no mutation',()=>{const m=fixture(),before=JSON.stringify(m),r=projectHistoricalPortfolio(m);const day=r.days.find(d=>d.date==='2023-01-02');assert.equal(day.totalEURExact,'999');assert.deepEqual(day.components.map(c=>c.valueEURExact),['399','600']);assert.equal(JSON.stringify(m),before);});
test('missing cash opening, orphaned historic positions and unknown accounts forbid complete total',()=>{for(const mutate of [m=>{m.openingPositions.find(p=>p.positionId==='cash').asOf=null;},m=>{m.positions=m.positions.filter(p=>p.id!=='etf');},m=>{m.accounts.push({id:'unknown'});}]){const m=fixture();mutate(m);assert.ok(projectHistoricalPortfolio(m).days.every(d=>d.totalEURExact===null));}});
test('observed snapshots/revisions never overwritten; discrepancies are independent',()=>{const m=fixture();m.snapshots=[{id:'observed',date:'2023-01-02',total:1000,totalEURExact:'1000',note:'synthetic',revisions:[{date:'2023-01-01',total:900}]}];const before=JSON.stringify(m),r=projectHistoricalPortfolio(m);assert.equal(r.reconciliation[0].differenceEURExact,'-1');assert.equal(r.reconciliation[0].status,'review');assert.equal(JSON.stringify(m),before);});
test('full disposal retains historic position and known zero without a current price',()=>{const m=fixture();executeTransaction(m,{type:'sell',date:'2023-01-04',positionId:'etf',cashPositionId:'cash',quantity:6,unitPrice:100,feeEUR:0});const day=projectHistoricalPortfolio(m).days.find(d=>d.date==='2023-01-04');assert.equal(day.totalEURExact,'999');assert.equal(day.components.find(p=>p.positionId==='etf').valueEURExact,'0');});

test('unresolved clearing is dated, reported once and cannot rewrite earlier verified totals',()=>{
 const m=fixture();
 executeTransaction(m,{positionId:'etf',date:'2023-01-04',type:'buy',quantity:1,unitPrice:10});
 executeTransaction(m,{positionId:'etf',date:'2023-01-05',type:'buy',quantity:1,unitPrice:10});
 assert.equal(m.journalEntries.filter(e=>e.status==='unresolved-clearing').length,2);
 const before=JSON.stringify(m),r=projectHistoricalPortfolio(m,{dates:['2023-01-05','2023-01-02','2023-01-03','2023-01-04']});
 const clearing=d=>d.missing.filter(x=>x.reason==='Historisches Verrechnungskonto fehlt.');
 assert.deepEqual(r.days.map(d=>d.date),['2023-01-02','2023-01-03','2023-01-04','2023-01-05']);
 assert.equal(r.days[0].totalEURExact,'999');assert.equal(clearing(r.days[0]).length,0);assert.equal(clearing(r.days[1]).length,0);
 assert.equal(clearing(r.days[2]).length,1);assert.equal(clearing(r.days[3]).length,1);assert.equal(r.days[2].totalEURExact,null);assert.equal(r.days[3].totalEURExact,null);
 assert.equal(JSON.stringify(m),before);
});
