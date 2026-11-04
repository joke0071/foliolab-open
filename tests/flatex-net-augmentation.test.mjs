import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,nativeBatchDocuments} from './flatex-net-fixture.mjs';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {prepareNativeFlatexPreview} from '../src/flatex-backfill.js';
import {importCSV} from '../src/csv-import.js';
import {backup,safeImport} from '../src/model.js';
import {prepareFlatexNetPreview,withdrawFlatexNetGroups,inspectFlatexNetPairs} from '../src/flatex-net-settlement.js';
import {sourceUnmodified,bookingOwnership} from '../src/import-identity.js';
import {ledgerQuantityAudit,executeTransaction} from '../src/transactions.js';
function nativePurchase(){
 const f=fixture();
 const shares=prepareNativeFlatexPreview(f.model,[f.documents[0]],f.assignments,{mode:'append'});
 assert.equal(shares.eligible,true,shares.reason);importCSV(f.model,shares.preview);
 f.model=safeImport(JSON.parse(backup(f.model)));
 return f;
}
const preview=f=>prepareNativeFlatexPreview(f.model,f.documents,f.assignments,{...f.options,mode:'net-augment'});
test('explicit cash augmentation preserves one share effect and a durable exact original through restore and removal',()=>{
 const f=nativePurchase(),old=structuredClone(f.model),r=preview(f);
 assert.equal(r.eligible,true,r.reason);assert.equal(JSON.stringify(f.model),JSON.stringify(old));
 assert.deepEqual(importCSV(f.model,r.preview),{imported:0,augmented:1,duplicates:0});
 const b=f.model.bookings[0],j=f.model.journalEntries[0];
 assert.equal(f.model.bookings.length,1);assert.equal(f.model.journalEntries.length,1);
 assert.equal(b.id,old.bookings[0].id);assert.equal(j.id,old.journalEntries[0].id);
 assert.deepEqual(j.postings[0],old.journalEntries[0].postings[0]);
 assert.deepEqual(b.netAugmentation.booking,old.bookings[0]);assert.deepEqual(b.netAugmentation.journal,old.journalEntries[0]);
 assert.equal(f.model.positions[0].quantityExact,'2');assert.equal(f.model.positions[1].quantityExact,'78.25');
 assert.equal(b.feeEUR,null);assert.equal(b.taxEUR,null);assert.equal(b.costsVerified,false);assert.equal(f.model.positions[0].costBasisExact,null);
 assert.deepEqual(j.postings.map(p=>[p.role,p.amountBookEURExact]),[['asset','20'],['cash','-21.75'],['unresolved-net-amount','1.75']]);
 assert.equal(f.model.externalCashFlows.length,0);assert.equal(sourceUnmodified(f.model,b),true);assert.equal(ledgerQuantityAudit(f.model).ok,true);
 const restored=safeImport(JSON.parse(backup(f.model)));
 assert.deepEqual(restored.bookings[0].netAugmentation,b.netAugmentation);
 const repeat=prepareFlatexNetPreview(restored,f.documents,f.assignments,f.options);assert.equal(repeat.eligible,true,repeat.reason);assert.equal(repeat.preview.ready,0);assert.equal(repeat.preview.duplicates,1);
 assert.equal(preview({...f,model:restored}).eligible,false);
 const removed=safeImport(JSON.parse(backup(withdrawFlatexNetGroups(restored,f.options.selectedIds))));
 assert.equal(removed.positions[0].quantityExact,'0');assert.equal(removed.positions[1].quantityExact,'100');
 assert.equal(removed.bookings.length,0);assert.deepEqual(removed.flatexNetRemovals[0].booking.netAugmentation,b.netAugmentation);
 assert.equal(prepareFlatexNetPreview(removed,f.documents,f.assignments,f.options).eligible,false);
});
test('ordinary import cannot acquire the explicit augmentation permission',()=>{
 const f=nativePurchase(),old=JSON.stringify(f.model);
 assert.equal(prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options).eligible,false);
 assert.equal(JSON.stringify(f.model),old);
 const forged=structuredClone(preview(f).preview);delete forged.netAugmentation;
 assert.throws(()=>importCSV(f.model,forged));assert.equal(JSON.stringify(f.model),old);
});
test('entire augmentation delta is rederived, protecting unrelated fields, stale source and baseline',()=>{
 for(const change of [p=>p.simulated.positions[0].quantityExact='3',p=>p.simulated.settings.language='xxx',p=>p.simulated.bookings[0].notes='forged',p=>p.simulated.openingPositions[0].quantityExact='1',p=>p.netAugmentation.openingDate='1999-01-02',p=>p.simulated.bookings[0].netAugmentation.booking.notes='forged',p=>p.ready=2]){
  const f=nativePurchase(),old=JSON.stringify(f.model),p=structuredClone(preview(f).preview);change(p);
  assert.throws(()=>importCSV(f.model,p));assert.equal(JSON.stringify(f.model),old);
 }
 const f=nativePurchase(),p=preview(f).preview;f.model.settings.theme='dark';assert.throws(()=>importCSV(f.model,p),/verändert/);
});
test('missing opening, manual changes, protected costs, references, dependencies and invalid ownership fail without mutation',()=>{
 const changes=[f=>f.options.openingConfirmed=false,f=>f.options.selectedIds=[],f=>f.options.selectedIds.push(f.options.selectedIds[0]),f=>f.options.openingDate='1999-01-02',f=>f.model.openingPositions.find(o=>o.positionId==='cash').asOf='1998-01-01',f=>f.model.bookings[0].notes='manual',f=>f.model.bookings[0].importSource.externalId='changed',f=>f.model.positions[0].costBasisEUR=1,f=>f.model.positions[1].wallet={enabled:true},f=>f.model.snapshots.push({date:'1999-01-03',byPosition:{cash:'100'}}),f=>f.model.positions[0].quantityExact='3',f=>f.assignments[Object.keys(f.assignments)[0]].confirmed=false,f=>executeTransaction(f.model,{type:'deposit',date:'1999-01-03',positionId:'cash',quantity:1}),f=>{f.model.positions[1].quantityExact='0';f.model.positions[1].quantity=0;f.model.openingPositions.find(o=>o.positionId==='cash').quantityExact='0';}];
 for(const change of changes){const f=nativePurchase();change(f);const old=JSON.stringify(f.model),r=preview(f);assert.equal(r.eligible,false);assert.equal(JSON.stringify(f.model),old);}
});
test('v5 restore rejects missing or forged old/new audit even with freshly recomputed ownership',()=>{
 const f=nativePurchase();importCSV(f.model,preview(f).preview);
 for(const change of [m=>delete m.bookings[0].netAugmentation,m=>m.bookings[0].netAugmentation.booking.quantityExact='3',m=>m.bookings[0].netAugmentation.journal.postings[0].quantityDeltaExact='3',m=>m.bookings[0].netAugmentation.version=2,m=>m.bookings[0].netAugmentation.extra=true,m=>m.bookings[0].netAugmentation.booking.cashPositionId='cash',m=>delete m.bookings[0].netSettlement]){
  const m=structuredClone(f.model);change(m);m.bookings[0].importSource.ownedSnapshot=bookingOwnership(m,m.bookings[0]);assert.throws(()=>safeImport(m));
 }
});
test('changed original payload, reference and buy/sell direction cannot reuse a previous approval',()=>{
 for(const changes of [{5:'3'},{8:'OTHER-BANK-TA'},{7:'ORDER Kauf IE00SYNTH001 999'},{5:'-2',7:'ORDER Verkauf IE00SYNTH001 100'}]){
  const f=nativePurchase(),before=JSON.stringify(f.model);
  f.documents[0]=parseFlatexNativeCSV(nativeFlatexCSV('depot',[{5:'2',9:'10',...changes}]));
  assert.equal(preview(f).eligible,false);assert.equal(JSON.stringify(f.model),before);
 }
});

function nativeBatch(){
 const f=fixture();f.documents=nativeBatchDocuments();f.options.selectedIds=inspectFlatexNetPairs(f.documents).pairs.map(p=>p.id);
 const r=prepareNativeFlatexPreview(f.model,[f.documents[0]],f.assignments,{mode:'append'});assert.equal(r.eligible,true,r.reason);importCSV(f.model,r.preview);
 f.model=safeImport(JSON.parse(backup(f.model)));return f;
}
test('complete native buy/sell history adds only net cash, retains every original and restores/withdraws atomically',()=>{
 const f=nativeBatch(),old=structuredClone(f.model),r=preview(f);assert.equal(r.eligible,true,r.reason);assert.equal(r.preview.ready,2);
 assert.deepEqual(importCSV(f.model,r.preview),{imported:0,augmented:2,duplicates:0});
 assert.equal(f.model.positions[0].quantityExact,'1');assert.equal(f.model.positions[1].quantityExact,'90');assert.equal(f.model.externalCashFlows.length,0);
 for(const b of f.model.bookings){
  const ob=old.bookings.find(x=>x.id===b.id),oj=old.journalEntries.find(x=>x.id===ob.journalEntryId),j=f.model.journalEntries.find(x=>x.id===b.journalEntryId);
  assert.deepEqual(b.netAugmentation,{version:1,booking:ob,journal:oj});assert.deepEqual(j.postings[0],oj.postings[0]);assert.equal(j.sequence,oj.sequence);assert.equal(b.feeEUR,null);assert.equal(b.taxEUR,null);assert.equal(b.costsVerified,false);assert.equal(sourceUnmodified(f.model,b),true);
 }
 const sale=f.model.journalEntries.find(j=>j.type==='sell');assert.deepEqual(sale.postings.map(p=>[p.role,p.amountBookEURExact]),[['asset','-12'],['cash','11.75'],['unresolved-net-amount','0.25']]);
 const m=safeImport(JSON.parse(backup(f.model))),repeat=prepareFlatexNetPreview(m,f.documents,f.assignments,f.options);assert.equal(repeat.preview.duplicates,2);assert.equal(repeat.preview.ready,0);
 const removed=safeImport(JSON.parse(backup(withdrawFlatexNetGroups(m,f.options.selectedIds))));assert.equal(removed.positions[0].quantityExact,'0');assert.equal(removed.positions[1].quantityExact,'100');assert.equal(removed.flatexNetRemovals.length,2);assert.equal(prepareFlatexNetPreview(removed,f.documents,f.assignments,f.options).eligible,false);
});
test('partial batch, altered sale original, reference, protected opening and hidden intermediate cash deficit fail closed',()=>{
 for(const change of [f=>f.options.selectedIds.pop(),f=>f.model.bookings[1].notes='changed',f=>f.model.snapshots.push({date:'1999-01-04',byPosition:{cash:'100'}}),f=>f.model.openingPositions.find(o=>o.positionId==='etf').asOf='1999-01-02',f=>{f.model.positions[1].quantityExact='20';f.model.positions[1].quantity=20;f.model.openingPositions.find(o=>o.positionId==='cash').quantityExact='20';}]){
  const f=nativeBatch();change(f);const before=JSON.stringify(f.model);assert.equal(preview(f).eligible,false);assert.equal(JSON.stringify(f.model),before);
 }
});
test('batch approval binds the complete count, unique sorted IDs, audit and all unrelated state',()=>{
 for(const change of [p=>p.ready=1,p=>p.netAugmentation.groupIds.pop(),p=>p.netAugmentation.groupIds.reverse(),p=>p.netAugmentation.groupIds[1]=p.netAugmentation.groupIds[0],p=>p.simulated.settings.language='changed',p=>p.simulated.bookings[1].netAugmentation.journal.sequence=999,p=>delete p.netAugmentation]){
  const f=nativeBatch(),before=JSON.stringify(f.model),p=structuredClone(preview(f).preview);change(p);assert.throws(()=>importCSV(f.model,p));assert.equal(JSON.stringify(f.model),before);
 }
});
test('batch order and repeated documentary observations cannot change economic result',()=>{
 const f=nativeBatch(),g=nativeBatch();g.options.selectedIds.reverse();g.documents=[...g.documents,g.documents[0]];
 assert.deepEqual(preview(f).preview.simulated.positions,preview(g).preview.simulated.positions);
 const m=preview(g).preview.simulated;assert.equal(m.bookings.length,2);assert.equal(ledgerQuantityAudit(m).ok,true);
});

test('a dated existing nonzero security opening is retained; an undated or inconsistent opening is never inferred',()=>{
 const make=()=>{const f=nativeBatch();f.model.positions[0].quantityExact='4';f.model.positions[0].quantity=4;const o=f.model.openingPositions.find(o=>o.positionId==='etf');o.quantityExact='3';o.asOf='1999-01-01';return f;};
 const f=make(),old=structuredClone(f.model.openingPositions[0]),r=preview(f);assert.equal(r.eligible,true,r.reason);importCSV(f.model,r.preview);assert.equal(f.model.positions[0].quantityExact,'4');assert.deepEqual(f.model.openingPositions[0],old);
 for(const change of [f=>delete f.model.openingPositions.find(o=>o.positionId==='etf').asOf,f=>f.model.openingPositions.find(o=>o.positionId==='etf').asOf='1999-01-02',f=>f.model.positions[0].quantityExact='5']){const f=make();change(f);const before=JSON.stringify(f.model);assert.equal(preview(f).eligible,false);assert.equal(JSON.stringify(f.model),before);}
});
