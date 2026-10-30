import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createPosition} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {projectHistoricalPortfolio} from '../src/historical-portfolio-value.js';

function fixture(){
 const m=blankModel();
 m.providers.push(createProvider({id:'perf-provider',name:'Synthetic PERF01',type:'broker'}));
 m.positions.push(createPosition({id:'cash',providerId:'perf-provider',name:'Cash',kind:'cash',currency:'EUR',quantity:1000,price:1},m));
 m.positions.push(createPosition({id:'etf',providerId:'perf-provider',name:'ETF',kind:'etf',quantity:0,price:100},m));
 executeTransaction(m,{positionId:'etf',cashPositionId:'cash',date:'2023-01-02',type:'buy',quantity:6,unitPrice:100,feeEUR:1});
 m.openingPositions.find(p=>p.positionId==='cash').asOf='2023-01-01';
 m.priceHistories.etf={currency:'EUR',source:'CSV (selbst geprüft)',points:[{date:'2023-01-02',total:100},{date:'2023-01-03',total:110}]};
 return m;
}
const snapshot=(id,date,total)=>({id,date,total,totalEURExact:String(total),note:'Synthetic',revisions:[{date:'2023-01-01',total:900}]});

test('PERF01 snapshot reconciliation retains duplicate same-day order and exact discrepancies',()=>{
 const m=fixture();
 m.snapshots=[snapshot('late-03','2023-01-03',1059),snapshot('different-02','2023-01-02',1000),snapshot('match-02','2023-01-02',999),snapshot('late-unproven','2023-01-04',999),snapshot('older-01','2023-01-01',1000)];
 const before=JSON.stringify(m);
 const result=projectHistoricalPortfolio(m);
 assert.deepEqual(result.reconciliation.map(r=>[r.date,r.snapshotId,r.reconstructedEURExact,r.observedEURExact,r.differenceEURExact,r.status]),[
  ['2023-01-02','different-02','999','1000','-1','review'],
  ['2023-01-02','match-02','999','999','0','agrees'],
  ['2023-01-03','late-03','1059','1059','0','agrees'],
 ]);
 assert.ok(result.days.find(r=>r.date==='2023-01-04')?.totalEURExact===null,'a dated observation must never invent missing market pricing');
 assert.ok(result.days.find(r=>r.date==='2023-01-01')?.totalEURExact===null,'opening without ETF pricing never creates a full-portfolio reconciliation');
 assert.deepEqual(result.observations.map(r=>r.snapshotId),['late-03','different-02','match-02','late-unproven','older-01'],'unaltered observation insertion order');
 assert.equal(JSON.stringify(m),before,'read-only calculation must not mutate portfolio or references');
});

test('PERF01 incomplete history leaves all observations intact but creates no reconstructed comparison',()=>{
 const m=fixture();
 m.openingPositions.find(p=>p.positionId==='cash').asOf=null;
 m.snapshots=[snapshot('first','2023-01-02',1000),snapshot('second','2023-01-02',999),snapshot('third','2023-01-03',1059)];
 const before=JSON.stringify(m),r=projectHistoricalPortfolio(m);
 assert.deepEqual(r.reconciliation,[]);
 assert.deepEqual(r.observations.map(x=>x.snapshotId),['first','second','third']);
 assert.ok(r.days.every(day=>day.totalEURExact===null));
 assert.equal(JSON.stringify(m),before);
});

test('PERF01 no snapshots and no matched price dates do not manufacture reconciliation data',()=>{
 const m=fixture();m.snapshots=[];
 const before=JSON.stringify(m),r=projectHistoricalPortfolio(m);
 assert.deepEqual(r.observations,[]);
 assert.deepEqual(r.reconciliation,[]);
 assert.equal(JSON.stringify(m),before);
});
