import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {inspectFlatexNetPairs,prepareFlatexNetPreview,validateFlatexNetSettlements,withdrawFlatexNetGroups} from '../src/flatex-net-settlement.js';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
import {importCSV} from '../src/csv-import.js';
import {ledgerQuantityAudit,executeTransaction} from '../src/transactions.js';
import {performanceIssues} from '../src/performance.js';
import {fixture,laterDocuments} from './flatex-net-fixture.mjs';
test('independent exact net posting: 2 shares, gross20, cash-21.75, unresolved1.75, unknown costs',()=>{
 const f=fixture(),before=JSON.stringify(f.model),result=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);
 assert.equal(result.eligible,true,result.reason);assert.equal(JSON.stringify(f.model),before);assert.equal(result.preview.ready,1);
 importCSV(f.model,result.preview);const b=f.model.bookings[0],j=f.model.journalEntries[0];
 assert.equal(f.model.positions[0].quantityExact,'2');assert.equal(f.model.positions[1].quantityExact,'78.25');assert.equal(f.model.version,5);
 assert.equal(b.amountExactEUR,'20');assert.equal(b.feeEUR,null);assert.equal(b.taxEUR,null);assert.equal(b.costsVerified,false);assert.equal(f.model.positions[0].costBasisExact,null);
 assert.deepEqual(j.postings.map(p=>[p.role,p.amountBookEURExact]),[['asset','20'],['cash','-21.75'],['unresolved-net-amount','1.75']]);
 assert.equal(f.model.externalCashFlows.length,0);assert.equal(ledgerQuantityAudit(f.model).ok,true);assert.equal(f.model.openingPositions[0].asOf,'1999-01-01');
 const restored=safeImport(JSON.parse(backup(f.model))),again=prepareFlatexNetPreview(restored,f.documents,f.assignments,f.options);
 assert.equal(again.eligible,true,again.reason);assert.equal(again.preview.ready,0);assert.equal(again.preview.duplicates,1);assert.equal(again.preview.evidenceUpdates,0);
 assert.ok(performanceIssues(restored,'1998-12-31','1999-12-31').length);validateFlatexNetSettlements(restored);
});
test('overlaps retain both exact occurrence payloads with one financial effect; changed originals block',()=>{
 const f=fixture();const overlap=parseFlatexNativeCSV(nativeFlatexCSV('depot',[{0:'0008',5:'2',9:'10'}]));
 const r=prepareFlatexNetPreview(f.model,[...f.documents,overlap],f.assignments,f.options);assert.equal(r.eligible,true,r.reason);importCSV(f.model,r.preview);
 assert.equal(f.model.bookings.length,1);assert.equal(f.model.bookings[0].netSettlement.depot.occurrences.length,2);
 const bad=parseFlatexNativeCSV(nativeFlatexCSV('depot',[{5:'3',9:'10'}]));const conflict=prepareFlatexNetPreview(f.model,[...f.documents,bad],f.assignments,f.options);assert.equal(conflict.eligible,false);
});
test('unknown split even when gross equals cash; sale preserves exact net and never invents profit',()=>{
 const f=fixture();f.model.positions[0].quantity=3;f.model.positions[0].quantityExact='3';
 f.documents=[parseFlatexNativeCSV(nativeFlatexCSV('depot',[{5:'-2',9:'10',7:'ORDER Verkauf IE00SYNTH001 100'}])),parseFlatexNativeCSV(nativeFlatexCSV('account',[{6:'20',4:'ORDER Verkauf IE00SYNTH001 100'}]))];
 f.options.selectedIds=inspectFlatexNetPairs(f.documents).pairs.map(p=>p.id);
 const r=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);assert.equal(r.eligible,true,r.reason);importCSV(f.model,r.preview);
 assert.equal(f.model.positions[0].quantityExact,'1');assert.equal(f.model.positions[1].quantityExact,'120');assert.equal(f.model.positions[0].realizedPnLExact,null);assert.equal(f.model.bookings[0].feeEUR,null);assert.equal(f.model.journalEntries[0].postings[2].amountBookEURExact,'0');
});
test('fail closed on missing opening/current binding/protected cost/reference and insufficient cash',()=>{
 for(const mutate of [f=>f.options.openingConfirmed=false,f=>f.options.openingDate='1999-01-02',f=>f.assignments[Object.keys(f.assignments)[0]].confirmed=false,f=>f.model.positions[0].costBasisEUR=2,f=>{f.model.positions[1].quantity=0;f.model.positions[1].quantityExact='0';},f=>f.model.snapshots.push({date:'2000-01-01',byPosition:{etf:'5'}})]){
  const f=fixture();mutate(f);const before=JSON.stringify(f.model),r=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);assert.equal(r.eligible,false);assert.equal(JSON.stringify(f.model),before);
 }
});
test('durable full-group removal retains both source proofs, blocks resurrection and dependent trades',()=>{
 const f=fixture();importCSV(f.model,prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options).preview);
 const restored=safeImport(JSON.parse(backup(f.model))),removed=withdrawFlatexNetGroups(restored,f.options.selectedIds);
 assert.equal(removed.bookings.length,0);assert.equal(removed.positions[0].quantityExact,'0');assert.equal(removed.positions[1].quantityExact,'100');assert.equal(removed.flatexNetRemovals.length,1);
 const reloaded=safeImport(JSON.parse(backup(removed)));assert.equal(prepareFlatexNetPreview(reloaded,f.documents,f.assignments,f.options).eligible,false);
 executeTransaction(restored,{type:'buy',date:'1999-01-10',positionId:'etf',cashPositionId:'cash',quantity:1,unitPrice:2});assert.throws(()=>withdrawFlatexNetGroups(restored,f.options.selectedIds),/abhängig/);
});
test('restores reject altered net postings, source payloads, orphaned groups and missing metadata',()=>{
 const f=fixture();importCSV(f.model,prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options).preview);
 for(const mutate of [m=>m.bookings[0].feeEUR=1,m=>m.bookings[0].netSettlement.cashExact='-20',m=>m.bookings[0].netSettlement.account.fields[6]='-20',m=>m.bookings=[],m=>delete m.bookings[0].netSettlement,m=>m.journalEntries[0].postings[2].role='fee']){
  const m=structuredClone(f.model);mutate(m);assert.throws(()=>safeImport(m));
 }
});
test('later overlapping evidence appends without changing one existing booking, journal or amounts',()=>{
 const f=fixture();importCSV(f.model,prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options).preview);const old=structuredClone(f.model);
 const later=parseFlatexNativeCSV(nativeFlatexCSV('depot',[{0:'0099',5:'2',9:'10'}]));
 const r=prepareFlatexNetPreview(f.model,[later,f.documents[1]],f.assignments,f.options);assert.equal(r.eligible,true,r.reason);assert.equal(r.preview.ready,0);assert.equal(r.preview.evidenceUpdates,1);importCSV(f.model,r.preview);
 assert.equal(f.model.bookings.length,1);assert.equal(f.model.bookings[0].netSettlement.depot.occurrences.length,2);assert.deepEqual(f.model.journalEntries,old.journalEntries);assert.deepEqual(f.model.positions,old.positions);
 const forged=structuredClone(r.preview);forged.baseline=JSON.stringify(old);forged.simulated.bookings[0].notes='changed';assert.throws(()=>importCSV(old,forged));
});
test('pure depot repeat cannot discard the paired cash source or silently create a second trade',async()=>{
 const f=fixture();importCSV(f.model,prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options).preview);
 const {prepareNativeFlatexPreview}=await import('../src/flatex-backfill.js');
 const before=JSON.stringify(f.model),r=prepareNativeFlatexPreview(f.model,[f.documents[0]],f.assignments,{mode:'append'});assert.equal(r.eligible,false);assert.equal(JSON.stringify(f.model),before);
});
test('incremental EUR pairs preserve earlier holdings, openings and source records through restore/replay/removal',()=>{
 for(const type of ['buy','sell']){
  const f=fixture();importCSV(f.model,prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options).preview);
  const old=structuredClone(f.model),docs=laterDocuments({type}),ids=inspectFlatexNetPairs(docs).pairs.map(p=>p.id);
  const options={selectedIds:ids,openingConfirmed:false};
  const r=prepareFlatexNetPreview(f.model,docs,f.assignments,options);assert.equal(r.eligible,true,r.reason);assert.equal(r.preview.ready,1);assert.deepEqual(f.model,old);
  importCSV(f.model,r.preview);assert.equal(f.model.positions[0].quantityExact,type==='buy'?'3':'1');assert.equal(f.model.positions[1].quantityExact,type==='buy'?'66':'90');
  assert.deepEqual(f.model.openingPositions,old.openingPositions);assert.deepEqual(f.model.bookings.find(b=>b.id===old.bookings[0].id),old.bookings[0]);assert.deepEqual(f.model.journalEntries.find(j=>j.id===old.journalEntries[0].id),old.journalEntries[0]);
  assert.equal(f.model.externalCashFlows.length,0);assert.equal(f.model.positions[0].costBasisExact,null);assert.equal(ledgerQuantityAudit(f.model).ok,true);
  const restored=safeImport(JSON.parse(backup(f.model))),again=prepareFlatexNetPreview(restored,[...f.documents,...docs],f.assignments,{selectedIds:[...f.options.selectedIds,...ids]});
  assert.equal(again.eligible,true,again.reason);assert.equal(again.preview.ready,0);assert.equal(again.preview.duplicates,2);
  assert.throws(()=>withdrawFlatexNetGroups(restored,f.options.selectedIds),/abhängig/);
  const removed=safeImport(JSON.parse(backup(withdrawFlatexNetGroups(restored,ids)))),oldRestored=safeImport(JSON.parse(backup(old)));assert.deepEqual(removed.positions,oldRestored.positions);assert.deepEqual(removed.bookings,oldRestored.bookings);
  assert.equal(prepareFlatexNetPreview(removed,docs,f.assignments,options).eligible,false);
 }
});
test('incremental EUR append rejects backdating, manual dependencies, drift, unconfirmed sources and protected reference balances',()=>{
 const mutations=[
  f=>f.docs=laterDocuments({date:'02.01.1999'}),f=>f.docs=laterDocuments({date:'01.01.1999'}),
  f=>{f.model.positions[0].quantityExact='3';f.model.positions[0].quantity=3;},
  f=>{f.model.openingPositions[0].asOf=undefined;},f=>{f.model.positions[0].costBasisExact='1';},
  f=>{f.model.bookings[0].notes='manually changed';},
  f=>{f.assignments[Object.keys(f.assignments)[0]].confirmed=false;},
  f=>{f.model.snapshots.push({date:'1999-01-10',byPosition:{cash:'78.25'}});},
  f=>{executeTransaction(f.model,{type:'buy',date:'1999-01-05',positionId:'etf',cashPositionId:'cash',quantity:1,unitPrice:1});}
 ];
 for(const mutate of mutations){
  const f=fixture();importCSV(f.model,prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options).preview);f.docs=laterDocuments();mutate(f);
  const before=JSON.stringify(f.model),ids=inspectFlatexNetPairs(f.docs).pairs.map(p=>p.id),r=prepareFlatexNetPreview(f.model,f.docs,f.assignments,{selectedIds:ids});
  assert.equal(r.eligible,false);assert.equal(JSON.stringify(f.model),before);
 }
});
