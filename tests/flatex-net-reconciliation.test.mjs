import test from 'node:test';
import assert from 'node:assert/strict';
import {reconciliationFixture} from './flatex-net-reconciliation-fixture.mjs';
import {prepareNativeFlatexPreview} from '../src/flatex-backfill.js';
import {importCSV} from '../src/csv-import.js';
import {backup,safeImport} from '../src/model.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
import {previewSharedImport,confirmSharedImport} from '../src/shared-import.js';
import {csvUndoReceipt,undoCSV} from '../src/csv-batch.js';
import {withdrawFlatexNetGroups} from '../src/flatex-net-settlement.js';
const preview=f=>prepareNativeFlatexPreview(f.model,f.documents,f.assignments,f.options);
for(const context of [false,true])for(const earlier of [false,true])test(`dated EUR reconciliation dialect${context?13:12} ${earlier?'earlier insertion':'later addition'} preserves originals and references`,()=>{
 const f=reconciliationFixture({context,earlier}),before=structuredClone(f.model),p=preview(f);assert.equal(p.eligible,true,p.reason);assert.deepEqual(f.model,before);assert.equal(p.preview.ready,1);importCSV(f.model,p.preview);
 for(const b of before.bookings)assert.deepEqual(f.model.bookings.find(n=>n.id===b.id),b);for(const j of before.journalEntries)assert.deepEqual(f.model.journalEntries.find(n=>n.id===j.id),j);
 assert.deepEqual(f.model.openingPositions,before.openingPositions);assert.deepEqual(f.model.snapshots,before.snapshots);assert.equal(ledgerQuantityAudit(f.model).ok,true);
 for(const [id,[q]]of Object.entries(f.expected))assert.equal(f.model.positions.find(p=>p.id===id).quantityExact,q);
 const restored=safeImport(JSON.parse(backup(f.model))),again=preview({...f,model:restored});assert.equal(again.eligible,true,again.reason);assert.equal(again.preview.ready,0);assert.equal(again.preview.duplicates,2);
 const anchor=restored.bookings.find(b=>b.netReconciliation);assert.ok(anchor);assert.equal(anchor.feeEUR,null);assert.equal(anchor.taxEUR,null);assert.equal(anchor.costsVerified,false);
 assert.throws(()=>withdrawFlatexNetGroups(restored,[anchor.netSettlement.id]),/Bestandsabgleich/);
 const corrupt=structuredClone(restored);corrupt.bookings.find(b=>b.id===before.bookings[0].id).notes='changed old evidence';assert.throws(()=>safeImport(JSON.parse(backup(corrupt))));
 const changed=structuredClone(restored);changed.bookings.find(b=>b.netReconciliation).netReconciliation.observations[0].quantityExact='999';assert.throws(()=>safeImport(JSON.parse(backup(changed))));
});
test('shared planner retains dated evidence through one full draft, exact Undo, and source/choice reset',()=>{
 const f=reconciliationFixture(),sources={bitcoin:{receipts:[],operations:[]},kraken:[],bitpanda:[],flatex:f.documents.map(document=>({name:'Synthetic native',document})),files:f.documents.map(d=>({name:'Synthetic native',kind:'flatex',rows:d.rows.length}))},choices={flatex:{confirmed:true,partialConfirmed:true,assignments:f.assignments,options:f.options}},before=JSON.stringify(f.model);
 const plan=previewSharedImport(f.model,sources,choices);assert.equal(JSON.stringify(f.model),before);assert.equal(plan.reports[0].ready,1);assert.ok(plan.changed);
 const committed=confirmSharedImport(f.model,sources,choices,plan,{confirmed:true,backupConfirmed:true});assert.equal(committed.positions.find(p=>p.id==='cash').quantityExact,'90');assert.deepEqual(committed.snapshots,f.model.snapshots);
 const changed=structuredClone(choices);changed.flatex.options.observations[0].sourceReference='changed';assert.throws(()=>confirmSharedImport(f.model,sources,changed,plan,{confirmed:true,backupConfirmed:true}),/erneut/);
 const receipt=csvUndoReceipt(before,committed);undoCSV(committed,receipt);assert.equal(JSON.stringify(committed),before);
});
test('dated evidence failures remain pure and do not reopen ordinary import guards',()=>{
 for(const mutate of [f=>f.options.confirmed=false,f=>f.options.observations.pop(),f=>f.options.observations[0].sourceReference='',f=>f.options.observations[0].sourceId='wrong',f=>f.options.observations[0].accountId='wrong',f=>f.options.observations[0].date='1998-01-01',f=>f.options.observations[2].quantityExact='99',f=>f.options.observations[2].priceExact='0',f=>f.model.positions[0].costBasisEUR=20,f=>f.model.snapshots[0].revisions.push({source:'manual'}),f=>f.model.snapshots[0].byPosition.etf='20']){
  const f=reconciliationFixture();mutate(f);const before=JSON.stringify(f.model),p=preview(f);assert.equal(p.eligible,false,mutate.toString());assert.equal(JSON.stringify(f.model),before);
 }
 const f=reconciliationFixture(),p=prepareNativeFlatexPreview(f.model,f.documents,f.assignments,{mode:'net',selectedIds:f.options.selectedIds});assert.equal(p.eligible,false);assert.match(p.reason,/Referenz/);
});
