import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFlatexNativeCSV,bindNativeFlatexSourceContext,FLATEX_ACCOUNT8_COLUMNS,looksLikeFlatexNativeCSV} from '../src/flatex-native.js';
import {readCSVRecords} from '../src/csv-records.js';
import {inspectNativeFlatexSourceIdentities} from '../src/import-identity.js';
import {inspectFlatexNetPairs,prepareFlatexNetPreview,withdrawFlatexNetGroups} from '../src/flatex-net-settlement.js';
import {importCSV} from '../src/csv-import.js';
import {backup,safeImport} from '../src/model.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
import {fixture,laterDocuments} from './flatex-net-fixture.mjs';
import {contextFixture,contextDocuments,quote} from './flatex-context-fixture.mjs';
test('Konto8 exact positional header and original counterparty fields; no inferred source',()=>{
 const doc=contextDocuments(fixture().documents,{bound:false})[1];
 assert.equal(doc.dialect,'account8');assert.equal(doc.type,'account');assert.equal(doc.rows[0].numbers.amount,'-21.75');
 assert.equal(doc.rows[0].values.recipient,'Synthetic recipient');assert.equal(doc.rows[0].values.payer,'Synthetic payer');
 assert.equal(inspectNativeFlatexSourceIdentities([doc]).rows[0].sourceId,null);
 const csv=[FLATEX_ACCOUNT8_COLUMNS.map(c=>quote(c.header)).join(';'),doc.rows[0].fields.map(quote).join(';')].join('\n');
 assert.equal(looksLikeFlatexNativeCSV(readCSVRecords(csv,{delimiter:';'})),true);
 assert.throws(()=>parseFlatexNativeCSV(csv.replace('Zahlungspfl.','Zahlungspfl')));
});
test('explicit scope is per-document, immutable, independently confirmed and cannot replace native scope',()=>{
 const raw=contextDocuments(fixture().documents,{bound:false});
 for(const scope of ['', '-', ' a ', 'a\n', 'a'.repeat(121)])assert.throws(()=>bindNativeFlatexSourceContext(raw[0],{scope,confirmed:true}));
 assert.throws(()=>bindNativeFlatexSourceContext(raw[0],{scope:'D',confirmed:false}));
 assert.throws(()=>bindNativeFlatexSourceContext(fixture().documents[0],{scope:'D',confirmed:true}));
 const bound=bindNativeFlatexSourceContext(raw[0],{scope:'D',confirmed:true});
 assert.equal(raw[0].sourceContext,undefined);assert.ok(Object.isFrozen(bound.sourceContext));assert.deepEqual(bound.rows,raw[0].rows);
 assert.equal(inspectFlatexNetPairs([bound,raw[1]]).pairs.length,0);
 assert.equal(inspectFlatexNetPairs([...fixture().documents,...raw]).pairs.length,1);
 assert.ok(inspectNativeFlatexSourceIdentities([...fixture().documents,...raw]).rows.slice(2).every(r=>r.sourceId===null));
});
test('Depot13/Konto8 genuine net posting, restore, replay, later pair, durable removal and immutable originals',()=>{
 const f=contextFixture(),initial=JSON.stringify(f.model);assert.equal(f.inspection.pairs.length,1);
 const r=prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);assert.equal(r.eligible,true,r.reason);assert.equal(JSON.stringify(f.model),initial);
 importCSV(f.model,r.preview);assert.equal(f.model.positions[0].quantityExact,'2');assert.equal(f.model.positions[1].quantityExact,'78.25');
 const b=f.model.bookings[0];assert.equal(b.feeEUR,null);assert.equal(b.taxEUR,null);assert.equal(b.costsVerified,false);assert.equal(f.model.externalCashFlows.length,0);
 assert.deepEqual(f.model.journalEntries[0].postings.map(p=>[p.role,p.amountBookEURExact]),[['asset','20'],['cash','-21.75'],['unresolved-net-amount','1.75']]);
 assert.deepEqual(b.netSettlement.depot.fields,f.documents[0].rows[0].fields);assert.equal(b.netSettlement.account.sourceContext.scope,'SYN-DECLARED-CASH');
 const restored=safeImport(JSON.parse(backup(f.model))),repeat=prepareFlatexNetPreview(restored,[...f.documents].reverse(),f.assignments,f.options);
 assert.equal(repeat.eligible,true,repeat.reason);assert.equal(repeat.preview.ready,0);assert.equal(repeat.preview.duplicates,1);
 const later=contextDocuments(laterDocuments()),ids=inspectFlatexNetPairs(later).pairs.map(p=>p.id),next=prepareFlatexNetPreview(restored,later,f.assignments,{selectedIds:ids});
 assert.equal(next.eligible,true,next.reason);importCSV(restored,next.preview);assert.equal(restored.positions[0].quantityExact,'3');assert.equal(restored.positions[1].quantityExact,'66');assert.ok(ledgerQuantityAudit(restored).ok);
 const removed=safeImport(JSON.parse(backup(withdrawFlatexNetGroups(restored,ids))));assert.equal(removed.positions[0].quantityExact,'2');assert.equal(removed.positions[1].quantityExact,'78.25');
 assert.equal(prepareFlatexNetPreview(removed,later,f.assignments,{selectedIds:ids}).eligible,false);
});
test('tampered source declarations, raw fields, unit, FX, amount currency and multiple legs fail closed',()=>{
 for(const mutate of [m=>m.bookings[0].netSettlement.depot.sourceContext.scope='Other',m=>m.bookings[0].netSettlement.account.sourceContext.confirmed=false,m=>delete m.bookings[0].netSettlement.depot.sourceContext,m=>m.bookings[0].netSettlement.account.dialect='depot13',m=>m.bookings[0].netSettlement.depot.fields[10]='2']){
  const f=contextFixture();importCSV(f.model,prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options).preview);const model=structuredClone(f.model);mutate(model);assert.throws(()=>safeImport(model));
 }
 for(const [index,value] of [[5,'Stk.'],[7,'USD'],[10,'2']]){
  const f=contextFixture(),d=f.documents[0],fields=[...d.rows[0].fields];fields[index]=value;
  const doc=bindNativeFlatexSourceContext(parseFlatexNativeCSV([d.columns.map(c=>quote(c.header)).join(';'),fields.map(quote).join(';')].join('\n')),d.sourceContext);
  assert.equal(inspectFlatexNetPairs([doc,f.documents[1]]).pairs.length,0);
 }
 const f=contextFixture();assert.equal(inspectFlatexNetPairs([...f.documents,bindNativeFlatexSourceContext(f.documents[0],{scope:'Other depot',confirmed:true})]).pairs.length,0);
});
test('same declared native source and bank reference cannot double post across different dialect payloads',()=>{
 const f=fixture(),short=contextDocuments(f.documents,{bound:false}).map((d,i)=>bindNativeFlatexSourceContext(d,{scope:i?'SYN-KONTO':'SYN-DEPOT',confirmed:true}));
 const original=inspectNativeFlatexSourceIdentities(f.documents);
 // Use exactly the actual native fixture scopes; this declaration is explicit in the test.
 const matched=short.map((d,i)=>bindNativeFlatexSourceContext(d,{scope:original.rows[i].sourceScope,confirmed:true}));
 assert.equal(inspectFlatexNetPairs([...f.documents,...matched]).pairs.length,0);
 importCSV(f.model,prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options).preview);
 const options={...f.options,selectedIds:inspectFlatexNetPairs(matched).pairs.map(p=>p.id)},before=JSON.stringify(f.model);
 assert.equal(prepareFlatexNetPreview(f.model,matched,f.assignments,options).eligible,false);assert.equal(JSON.stringify(f.model),before);
 const removed=safeImport(JSON.parse(backup(withdrawFlatexNetGroups(f.model,f.options.selectedIds))));
 assert.equal(prepareFlatexNetPreview(removed,matched,f.assignments,options).eligible,false);
});
