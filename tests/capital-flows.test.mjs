import test from 'node:test';
import assert from 'node:assert/strict';
import {capitalReferenceSeries} from '../src/capital-flows.js';

const snapshots=[
 {date:'2026-01-01',total:10000,valuationStatus:'manual'},
 {date:'2026-02-01',total:12500,valuationStatus:'observed'},
 {date:'2026-03-01',total:13500,valuationStatus:'observed'}
];
test('reference adds only recorded external cashflow, never portfolio market gain',()=>{
 const result=capitalReferenceSeries({
  performanceFlowTrackingSince:'2026-01-01',
  externalCashFlows:[{id:'d1',date:'2026-01-15',amountEUR:2000},{id:'w1',date:'2026-02-15',amountEUR:-500}],
  bookings:[{id:'d1',date:'2026-01-15',type:'deposit'},{id:'w1',date:'2026-02-15',type:'withdraw'}]
 },snapshots);
 assert.deepEqual(result.map(x=>x.total),[10000,12000,11500]);
 assert.deepEqual(result.map(x=>x.netExternalFlow),[0,2000,1500]);
});
test('reference is unavailable without explicit tracking start or reliable valuations',()=>{
 assert.equal(capitalReferenceSeries({externalCashFlows:[],bookings:[]},snapshots),null);
 assert.equal(capitalReferenceSeries({performanceFlowTrackingSince:'2026-01-01',externalCashFlows:[],bookings:[]},[
  snapshots[0],{...snapshots[1],valuationStatus:'legacy-unverified'}
 ]),null);
});
test('legacy missing external flow matching a booked deposit hides reference',()=>{
 const result=capitalReferenceSeries({performanceFlowTrackingSince:'2026-01-01',externalCashFlows:[],
 bookings:[{id:'d1',type:'deposit',date:'2026-02-01'}]},snapshots);
 assert.equal(result,null);
});
test('tracking cannot silently claim a reference before its start',()=>{
 assert.equal(capitalReferenceSeries({performanceFlowTrackingSince:'2026-02-01',externalCashFlows:[],bookings:[]},snapshots),null);
});
