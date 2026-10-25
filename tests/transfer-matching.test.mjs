import test from 'node:test';import assert from 'node:assert/strict';
import {transferFixture} from './transfer-matching-fixture.mjs';
import {previewTransferMatch,confirmTransferMatch,undoTransferMatch,validateTransferMatches,executeTransaction} from '../src/transactions.js';
import {backup,safeImport} from '../src/model.js';
import {bookingOwnership,sourceUnmodified} from '../src/import-identity.js';
const preview=m=>previewTransferMatch(m,'out',m.bookings.filter(b=>b.type==='deposit').map(b=>b.id).sort());
const accept=(m,p=preview(m))=>confirmTransferMatch(m,{...p,reference:'Beleg SYN-001: eigene Konten geprüft',confirmed:true});
test('split transfers: pure preview, explicit confirmation, no double balance/journal booking',()=>{
 const m=transferFixture(),before=structuredClone(m),p=preview(m);assert.equal(p.ready,true);assert.deepEqual(m,before);
 accept(m,p);assert.deepEqual(m.positions,before.positions);assert.deepEqual(m.openingPositions,before.openingPositions);assert.deepEqual(m.snapshots,before.snapshots);
 assert.equal(m.journalEntries.length,3);assert.equal(m.bookings.length,3);assert.equal(m.externalCashFlows.length,0);
 for(let i=0;i<3;i++)assert.deepEqual(m.journalEntries[i].postings.map(p=>[p.id,p.positionId,p.quantityDeltaExact,p.amountBookEURExact]),before.journalEntries[i].postings.map(p=>[p.id,p.positionId,p.quantityDeltaExact,p.amountBookEURExact]));
 assert.equal(validateTransferMatches(m),m);
});
test('no explicit consent/reference or stale user edits: zero mutation',()=>{
 const m=transferFixture(),p=preview(m),before=JSON.stringify(m);
 assert.throws(()=>confirmTransferMatch(m,{...p,reference:'test',confirmed:false}),/Bestätigung/);assert.equal(JSON.stringify(m),before);
 m.bookings[0].notes='Manuell geändert';assert.throws(()=>accept(m,p),/Vorschau geändert/);
});
test('idempotent same confirmation and exact explicit undo',()=>{
 const m=transferFixture(),before=structuredClone(m),p=preview(m),result=accept(m,p),matched=JSON.stringify(m);
 assert.equal(accept(m,p).changed,false);assert.equal(JSON.stringify(m),matched);
 undoTransferMatch(m,result.id);assert.deepEqual(m,before);assert.equal(undoTransferMatch(m,result.id).changed,false);
});
test('missing counterpart and quantity differences remain blocked',()=>{
 const m=transferFixture();assert.equal(previewTransferMatch(m,'out',['in']).ready,false);
 assert.equal(previewTransferMatch(m,'out',[]).ready,false);assert.equal(previewTransferMatch(m,'out',['in','in']).ready,false);
});
test('fees, FX and time windows cannot silently zero an external movement',()=>{
 for(const change of ['fee','currency','date']){const m=transferFixture({split:false});const incoming=m.bookings.find(b=>b.id==='in');
  if(change==='fee')incoming.feeEUR=1;if(change==='currency')m.positions[1].currency='USD';if(change==='date'){incoming.date='2026-02-01';m.journalEntries.find(e=>e.id===incoming.journalEntryId).date=incoming.date;}
  const before=JSON.stringify(m);assert.equal(preview(m).ready,false);assert.throws(()=>accept(m));assert.equal(JSON.stringify(m),before);
 }
});
test('same foreign currency keeps different historical EUR book values, no fabricated FX or fee',()=>{
 const m=transferFixture({currency:'USD'}),before=structuredClone(m),p=preview(m);assert.equal(p.ready,true);assert.equal(p.quantityExact,'100');
 accept(m,p);assert.deepEqual(m.positions,before.positions);assert.deepEqual(m.journalEntries.map(e=>e.postings.map(p=>p.amountBookEURExact)),before.journalEntries.map(e=>e.postings.map(p=>p.amountBookEURExact)));
});
test('duplicate candidates require explicit selection, not automatic amount evidence',()=>{
 const m=transferFixture({split:false});executeTransaction(m,{id:'ambiguous',type:'deposit',date:'2026-01-03',positionId:m.positions[2].id,quantity:'100'});
 assert.equal(preview(m).ready,false);assert.equal(previewTransferMatch(m,'out',['in']).ready,true);assert.equal(m.externalCashFlows.length,3);
});
test('same account, missing journal or inconsistent external flow is blocked',()=>{
 for(const change of ['account','journal','flow']){const m=transferFixture({split:false});if(change==='account'){m.positions[1].accountId=m.positions[0].accountId;m.bookings.find(b=>b.id==='in').accountId=m.positions[0].accountId;}if(change==='journal')m.journalEntries=[];if(change==='flow')m.externalCashFlows[0].amountExactEUR='999';assert.equal(preview(m).ready,false);}
});
test('matched portable v3 backup roundtrips; partial or forged group fails closed',()=>{
 const m=transferFixture();accept(m);const restored=safeImport(JSON.parse(backup(m)));assert.deepEqual(restored.bookings,m.bookings);assert.equal(restored.externalCashFlows.length,0);
 const bad=JSON.parse(backup(m));delete bad.bookings[0].transferMatch;assert.throws(()=>safeImport(bad),/Transfer/);
 const forged=JSON.parse(backup(m));forged.bookings[0].transferMatch.originalFlow.amountEUR=123;assert.throws(()=>safeImport(forged),/Geldfluss/);
});
test('preserved import identity becomes user-owned; undo restores provenance; later edits block undo',()=>{
 const m=transferFixture({split:false}),b=m.bookings.find(b=>b.id==='out');b.importSource={version:1,sourceId:'synthetic-csv',accountId:b.accountId,externalId:'original-out',sourcePayload:'synthetic-row',ownedSnapshot:'',fileId:'synthetic',occurrence:1,ownership:'imported'};b.importSource.ownedSnapshot=bookingOwnership(m,b);
 assert.equal(sourceUnmodified(m,b),true);const result=accept(m);const updated=m.bookings.find(b=>b.id==='out');assert.equal(updated.importSource.externalId,'original-out');assert.equal(sourceUnmodified(m,updated),false);
 const restored=safeImport(JSON.parse(backup(m)));undoTransferMatch(restored,result.id);assert.equal(sourceUnmodified(restored,restored.bookings.find(b=>b.id==='out')),true);
 updated.notes='Nachträglich korrigiert';assert.throws(()=>undoTransferMatch(m,result.id),/nachträglich/);
});
test('completed transfers are not missing external flows; unsettled snapshot boundaries block returns',async()=>{
 const {performanceIssues,portfolioTwr,portfolioXirr}=await import('../src/performance.js');const {capitalReferenceSeries}=await import('../src/capital-flows.js');
 const m=transferFixture();accept(m);m.performanceFlowTrackingSince='2025-12-31';m.snapshots=[{date:'2025-12-31',total:1000,valuationStatus:'manual'},{date:'2026-01-04',total:1000,valuationStatus:'manual'}];
 assert.deepEqual(performanceIssues(m,'2025-12-31','2026-01-04'),[]);assert.equal(portfolioTwr(m,'2025-12-31','2026-01-04'),0);assert.ok(Math.abs(portfolioXirr(m,'2025-12-31','2026-01-04'))<1e-5);assert.equal(capitalReferenceSeries(m,m.snapshots).at(-1).total,1000);
 m.snapshots.splice(1,0,{date:'2026-01-02',total:960,valuationStatus:'manual'});
 assert.match(performanceIssues(m,'2025-12-31','2026-01-04').join(' '),/noch nicht abgeschlossen/);assert.equal(portfolioTwr(m,'2025-12-31','2026-01-04'),null);assert.equal(capitalReferenceSeries(m,m.snapshots),null);
});
test('18-place nominal splits are compared exactly, never rounded into an accepted mismatch',()=>{
 const m=transferFixture();m.bookings=[];m.journalEntries=[];m.openingPositions=[];m.externalCashFlows=[];m.positions.forEach((p,i)=>{p.quantity=i===0?1000:0;p.quantityExact=String(p.quantity);});
 executeTransaction(m,{id:'out',type:'withdraw',date:'2026-01-01',positionId:m.positions[0].id,quantity:'100.000000000000000001'});
 executeTransaction(m,{id:'in',type:'deposit',date:'2026-01-02',positionId:m.positions[1].id,quantity:'60'});
 executeTransaction(m,{id:'in2',type:'deposit',date:'2026-01-03',positionId:m.positions[2].id,quantity:'40.000000000000000001'});
 assert.equal(preview(m).ready,true);assert.equal(preview(m).quantityExact,'100.000000000000000001');accept(m);assert.equal(m.externalCashFlows.length,0);
});
test('unknown costs block matching; real CSV reimport preserves confirmed ownership and IDs',async()=>{
 const unknown=transferFixture({split:false});unknown.bookings[0].feeEUR=null;assert.equal(preview(unknown).ready,false);
 const {fixture}=await import('./p0-import-fixture.mjs');const {parseCSV,inferMapping,previewCSV,importCSV}=await import('../src/csv-import.js');
 const m=fixture();m.positions[0].quantity=1000;m.positions[0].quantityExact='1000';
 const data=parseCSV('date;type;position;quantity;price;fee;tax;id\n2026-01-01;withdraw;A;100;1;0;0;original-out\n2026-01-02;deposit;B;100;1;0;0;original-in');
 const mapping=inferMapping(data.headers);importCSV(m,previewCSV(m,data,mapping));const out=m.bookings.find(b=>b.type==='withdraw'),incoming=m.bookings.find(b=>b.type==='deposit');
 const p=previewTransferMatch(m,out.id,[incoming.id]);assert.equal(p.ready,true);confirmTransferMatch(m,{...p,confirmed:true,reference:'Authenticity represented by synthetic test fixture'});
 const before=JSON.stringify(m),again=previewCSV(m,data,mapping);assert.ok(again.issues.length>0);assert.throws(()=>importCSV(m,again));assert.equal(JSON.stringify(m),before);assert.equal(m.bookings.length,2);
});
