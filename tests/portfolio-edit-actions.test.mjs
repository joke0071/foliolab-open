import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotEditChanges,editSnapshot,deleteSnapshot,deletePosition} from '../src/portfolio-edit-actions.js';

const date='2026-10-21';
const shot=(overrides={})=>({id:'s1',date,total:123.45,totalEURExact:'123.45',note:'Alt',
 recordedAt:'2026-10-21T10:00:00Z',source:'current',valuationStatus:'observed',
 byAccount:{account:123.45},byPosition:{p:'123.45'},
 quoteTimes:[{positionId:'p',quoteSource:'test'}],revisions:[],...overrides});
const fixture=(opts={})=>({snapshots:[shot(),...opts.extra||[]],performanceFlowTrackingSince:opts.tracking||null,
 positions:[{id:'p',name:'ETF'},{id:'q',name:'Child',representedByPositionId:null}],bookings:[],
 journalEntries:[],openingPositions:[{positionId:'p'}],priceHistories:{p:{fake:true}},
 externalCashFlows:[]});

test('Editing just the note preserves observed valuation, exact amount and per-position history',()=>{
 const m=fixture();
 const old=m.snapshots[0].byPosition;
 const changed=editSnapshot(m,'s1',{date,totalEUR:'123,45',note:'Berichtigt'});
 assert.equal(changed.correction,false);
 assert.equal(m.snapshots[0].source,'current');
 assert.equal(m.snapshots[0].valuationStatus,'observed');
 assert.equal(m.snapshots[0].totalEURExact,'123.45');
 assert.deepEqual(m.snapshots[0].byPosition,old);
 assert.equal(m.snapshots[0].note,'Berichtigt');
 assert.equal(m.snapshots[0].revisions.length,1);
});

test('Value correction requires consent, preserves id, records old revision and clears stale attribution',()=>{
 const m=fixture();
 assert.throws(()=>editSnapshot(m,'s1',{date,totalEUR:'200,2500',note:'Korrektur'}),/Bestätigung/);
 assert.equal(m.snapshots[0].total,123.45);
 const out=editSnapshot(m,'s1',{date,totalEUR:'200,2500',note:'Korrektur'},{confirmCorrection:true});
 assert.equal(out.correction,true);
 assert.equal(m.snapshots[0].id,'s1');
 assert.equal(m.snapshots[0].total,200.25);
 assert.equal(m.snapshots[0].totalEURExact,'200.25');
 assert.equal(m.snapshots[0].source,'manual');
 assert.equal(m.snapshots[0].valuationStatus,'manual');
 assert.equal(m.snapshots[0].byPosition,null);
 assert.equal(m.snapshots[0].byAccount,null);
 assert.deepEqual(m.snapshots[0].quoteTimes,[]);
 assert.equal(m.snapshots[0].revisions[0].totalEURExact,'123.45');
});

test('Date changes validate duplicate dates, future dates and calendar validity before mutating',()=>{
 const m=fixture({extra:[shot({id:'s2',date:'2026-10-22'})]});
 assert.throws(()=>snapshotEditChanges(m,'s1',{date:'2026-10-22'}),/bereits/);
 assert.throws(()=>snapshotEditChanges(m,'s1',{date:'2026-02-30'}),/gültigen/);
 assert.throws(()=>snapshotEditChanges(m,'s1',{date:'2999-01-01'}),/gültigen/);
 assert.equal(m.snapshots[0].date,date);
 editSnapshot(m,'s1',{date:'2026-10-20',totalEUR:'123.45'},{confirmCorrection:true});
 assert.equal(m.snapshots[0].date,'2026-10-20');
 assert.equal(m.snapshots[0].source,'manual');
});

test('Performance start can change note but not date or valuation',()=>{
 const m=fixture({tracking:date});
 assert.throws(()=>snapshotEditChanges(m,'s1',{date,totalEUR:'500',note:'Edit'}),/Startstichtag/);
 editSnapshot(m,'s1',{date,totalEUR:'123.45',note:'Start'}); 
 assert.equal(m.snapshots[0].note,'Start');
 deleteSnapshot(m,'s1');
 assert.equal(m.performanceFlowTrackingSince,null);
 assert.equal(m.snapshots.length,0);
});

test('Delete position rejects booked and DeFi-linked positions without mutating balances',()=>{
 const m=fixture();
 m.bookings=[{positionId:'p'}];
 assert.throws(()=>deletePosition(m,'p'),/Buchungen/);
 assert.equal(m.positions.length,2);
 m.bookings=[];
 m.positions[1].representedByPositionId='p';
 assert.throws(()=>deletePosition(m,'p'),/DeFi/);
 assert.equal(m.positions.length,2);
 m.positions[1].representedByPositionId=null;
 const deleted=deletePosition(m,'p');
 assert.equal(deleted.id,'p');
 assert.deepEqual(m.positions.map(p=>p.id),['q']);
 assert.deepEqual(m.openingPositions,[]);
 assert.equal(m.priceHistories.p,undefined);
 assert.equal(m.snapshots[0].byPosition.p,'123.45','Past valuations remain intact');
});
