import {readFileSync} from 'node:fs';
import test from 'node:test';import assert from 'node:assert/strict';
import {usdPrincipalFixture,usdPrincipalRows} from './kraken-usd-principal-fixture.mjs';
import {previewKrakenImport,confirmKrakenImport,previewKrakenWithdrawal,confirmKrakenWithdrawal} from '../src/kraken-import.js';
import {backup,safeImport,totalExactEUR} from '../src/model.js';
import {validateJournalEntry,validateUnpricedUSDTransfers,ledgerQuantityAudit,executeTransaction,UNPRICED_USD_PRINCIPAL} from '../src/transactions.js';
import {readSharedImportFiles,previewSharedImport,confirmSharedImport} from '../src/shared-import.js';
import {csvUndoReceipt,undoCSV} from '../src/csv-batch.js';
import {projectHistoricalPosition} from '../src/historical-position-value.js';
import {createCompleteBackup} from '../src/complete-backup.js';
const oracle=JSON.parse(readFileSync(new URL('../docs/release-evidence/uh05-usd-principal-decimal100.json',import.meta.url)));
const approve=f=>{const p=previewKrakenImport(f.m,[f.text],f.assignments,f.options);assert.equal(p.ready,1,JSON.stringify(p.issues));return confirmKrakenImport(f.m,[f.text],f.assignments,{...f.options,baseline:p.baseline,confirmed:true});};
test('one complete native USD principal preserves amounts and UNKNOWN gross EUR without external effects',()=>{
 const f=usdPrincipalFixture(),before=JSON.stringify(f.m),m=approve(f);assert.equal(JSON.stringify(f.m),before);
 assert.deepEqual(m.positions.map(p=>p.quantityExact),[oracle.sourceAfterExact,oracle.targetAfterExact]);assert.equal(m.bookings.length,1);
 const b=m.bookings[0],j=m.journalEntries[0];assert.equal(b.fxRate,null);assert.equal(b.amountExactEUR,null);assert.equal(b.amountEUR,null);assert.equal(b.taxEUR,null);assert.equal(b.feeEUR,0);assert.equal(b.external,false);assert.equal(b.costsVerified,false);
 assert.equal(j.status,UNPRICED_USD_PRINCIPAL);assert.equal(j.nativeCurrency,'USD');assert.deepEqual(j.postings.map(p=>p.amountBookEURExact),['UNKNOWN','UNKNOWN']);assert.deepEqual(j.postings.map(p=>p.quantityDeltaExact),['-17.000000000000000005','17.000000000000000005']);
 assert.equal(m.externalCashFlows.length,0);assert.ok(m.positions.every(p=>p.costBasisExact===null&&p.realizedPnLExact===null));assert.equal(totalExactEUR(m),null);assert.equal(ledgerQuantityAudit(m).ok,true);validateUnpricedUSDTransfers(m);
 const restored=safeImport(JSON.parse(backup(m)));assert.deepEqual(restored.bookings,m.bookings);assert.deepEqual(restored.journalEntries,m.journalEntries);assert.equal(totalExactEUR(restored),null);
});
test('shared core commit, exact replay and existing Undo preserve the whole baseline',()=>{
 const f=usdPrincipalFixture(),before=JSON.stringify(f.m),sources=readSharedImportFiles([{name:'invented-kraken.csv',text:f.text}]);
 const choices={kraken:{assignments:f.assignments,...f.options,confirmed:true}},plan=previewSharedImport(f.m,sources,choices);assert.equal(plan.changed,true);
 const m=confirmSharedImport(f.m,sources,choices,plan,{confirmed:true,backupConfirmed:true});assert.equal(m.bookings.length,1);
 const repeat=previewKrakenImport(m,[f.text],f.assignments,f.options);assert.equal(repeat.ready,0);assert.equal(repeat.duplicates,1);assert.equal(repeat.issues.length,0);
 const original=JSON.stringify(m);confirmKrakenImport(m,[f.text],f.assignments,{...f.options,baseline:repeat.baseline,confirmed:true});assert.equal(JSON.stringify(m),original);
 undoCSV(m,csvUndoReceipt(before,m));assert.equal(JSON.stringify(m),before);
});
test('documentary withdrawal restores native principal and durably blocks resurrection',()=>{
 const f=usdPrincipalFixture(),m=approve(f),options={...f.options,selectedGroups:[m.bookings[0].importSource.fileId]};
 const p=previewKrakenWithdrawal(m,[f.text],f.assignments,options);assert.equal(p.originals.length,1);const removed=confirmKrakenWithdrawal(m,[f.text],f.assignments,{...options,baseline:p.baseline,confirmed:true});
 assert.deepEqual(removed.positions.map(p=>p.quantityExact),f.m.positions.map(p=>p.quantityExact));assert.equal(removed.bookings.length,0);assert.equal(removed.journalEntries.length,1);assert.equal(removed.journalEntries[0].type,'uh03-undo');
 const restored=safeImport(JSON.parse(backup(removed)));const replay=previewKrakenImport(restored,[f.text],f.assignments,f.options);assert.equal(replay.ready,0);assert.equal(replay.issues.length,1);
});
test('incomplete, overlapping, changed, fee-unknown and wrong-role native groups never partially commit',()=>{
 const variants=[r=>r.slice(0,1),r=>[...r,{...r[0],txid:'OTHER-ASSET',asset:'EUR'}],r=>[r[0],{...r[1],amount:'18'}],r=>[r[0],{...r[1],fee:''}],r=>[r[0],{...r[1],fee:'0.1'}],r=>r.map(x=>({...x,subtype:'reward'})),r=>r.map(x=>({...x,asset:'EUR'})),r=>[r[0],{...r[1],wallet:'spot / main'}],r=>r.map(x=>({...x,wallet:x.wallet==='spot / main'?'earn / liquid':'spot / main'}))];
 for(const variant of variants){const f=usdPrincipalFixture(variant(usdPrincipalRows())),before=JSON.stringify(f.m);let p;try{p=previewKrakenImport(f.m,[f.text],f.assignments,f.options);}catch{assert.equal(JSON.stringify(f.m),before);continue;}assert.equal(p.ready,0);assert.ok(p.issues.length);assert.throws(()=>confirmKrakenImport(f.m,[f.text],f.assignments,{...f.options,baseline:p.baseline,confirmed:true}));assert.equal(JSON.stringify(f.m),before);}
 const f=usdPrincipalFixture(),altered=f.text.replace('17.000000000000000005','18.000000000000000005');const p=previewKrakenImport(f.m,[f.text,altered],f.assignments,f.options);assert.equal(p.ready,0);assert.ok(p.issues.length);
});
test('openings, separate own native USD accounts and unknown costs remain mandatory',()=>{
 for(const mutate of [f=>{f.options.openingConfirmed=false;},f=>{f.m.positions[1].price=2;f.m.positions[1].priceExact='2';},f=>{f.m.accounts[1].currency='EUR';},f=>{f.m.positions[1].accountId=f.m.positions[0].accountId;},f=>{f.m.positions[0].costBasisExact='1';f.m.positions[0].costBasisEUR=1;},f=>{f.m.positions[0].economicRole='borrowed';f.m.positions[0].valuationMode='liability';},f=>{f.m.positions[1].economicRole='borrowed';f.m.positions[1].valuationMode='liability';},f=>{f.m.positions[0].valuationMode='excluded';f.m.positions[0].representedByPositionId='earn';},f=>{f.m.positions[1].valuationMode='excluded';f.m.positions[1].representedByPositionId='spot';},f=>{f.m.positions[0].representedByPositionId='earn';}]){
  const f=usdPrincipalFixture();mutate(f);const before=JSON.stringify(f.m),p=previewKrakenImport(f.m,[f.text],f.assignments,f.options);assert.equal(p.ready,0);assert.ok(p.issues.length);assert.equal(JSON.stringify(f.m),before);
 }
});
test('journal/restore rejects monetary zero substitutions, wrong currencies and inconsistent quantities',()=>{
 const m=approve(usdPrincipalFixture());
 for(const mutate of [m=>{m.journalEntries[0].postings[0].amountBookEURExact='0';},m=>{m.journalEntries[0].nativeCurrency='EUR';},m=>{m.journalEntries[0].postings[1].quantityDeltaExact='1';},m=>{m.positions[1].currency='EUR';},m=>{m.bookings[0].amountEUR=0;},m=>{m.bookings[0].fxRate=1;},m=>{delete m.bookings[0].importSource;},m=>{m.journalEntries[0].source='manual';},m=>{const s=m.bookings[0].importSource,v=JSON.parse(s.sourcePayload);v.action.fxRate='1';s.sourcePayload=JSON.stringify(v);},m=>{const s=m.bookings[0].importSource,v=JSON.parse(s.sourcePayload);v.bindings[0][1]='other-position';s.sourcePayload=JSON.stringify(v);},m=>{m.positions[0].economicRole='borrowed';m.positions[0].valuationMode='liability';},m=>{m.positions[1].valuationMode='excluded';m.positions[1].representedByPositionId='spot';}]){
  const bad=structuredClone(m);mutate(bad);const before=JSON.stringify(bad);assert.throws(()=>safeImport(bad));assert.throws(()=>backup(bad));assert.throws(()=>createCompleteBackup(bad));assert.equal(JSON.stringify(bad),before);
 }
});
test('current FX updates cannot rewrite UNKNOWN journal or grant historical EUR valuation',()=>{
 const m=approve(usdPrincipalFixture()),journal=JSON.stringify(m.journalEntries);for(const p of m.positions){p.fxRate=1;p.fxRateExact='1';}
 assert.equal(totalExactEUR(m),'17.00000000000000001');assert.equal(JSON.stringify(m.journalEntries),journal);const restored=safeImport(JSON.parse(backup(m)));assert.equal(JSON.stringify(restored.journalEntries),journal);
 const h=projectHistoricalPosition(m,'earn',{dates:['1999-02-03']});assert.equal(h.rows[0].valueEURExact,null);
 const f=usdPrincipalFixture();for(const p of f.m.positions){p.fxRate=1;p.fxRateExact='1';}const total=totalExactEUR(f.m),known=approve(f);assert.equal(totalExactEUR(known),total,'Own included USD principal cannot create a current wealth effect');assert.equal(known.bookings[0].fxRate,null);assert.equal(known.bookings[0].amountEUR,null);
});
test('UNKNOWN journal path rejects unqualified callers and other transaction types',()=>{
 const {m}=usdPrincipalFixture(),before=JSON.stringify(m);
 for(const type of ['deposit','withdraw','reward','swap','transfer'])assert.throws(()=>executeTransaction(m,{type,positionId:'spot',targetPositionId:'earn',date:'1999-02-03',quantity:'1',unitPrice:'1',fxRate:'UNKNOWN',feeEUR:'0',taxEUR:'0'}));
 assert.equal(JSON.stringify(m),before);
});
