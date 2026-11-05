// Synthetic contract diagnostic on exact v287. Does not relax production guards.
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fixture,nativeBatchDocuments,laterDocuments} from './flatex-net-fixture.mjs';
import {contextDocuments} from './flatex-context-fixture.mjs';
import {inspectFlatexNetPairs} from '../src/flatex-net-settlement.js';
import {prepareNativeFlatexPreview} from '../src/flatex-backfill.js';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
import {importCSV} from '../src/csv-import.js';
import {snapshot,backup,safeImport} from '../src/model.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
const results=[];
for(const dialect of ['Depot12/Konto10','Depot13/Konto8']){
 const convert=docs=>dialect==='Depot13/Konto8'?contextDocuments(docs):docs;
 function prepare(model,documents,extra={}){
  const inspection=inspectFlatexNetPairs(documents),assignments={};
  for(const row of inspection.identities.rows)assignments[row.sourceId]={accountId:row.sourceType==='depot'?'d':'c'};
  for(const c of reviewNativeFlatexBindings(model,inspection.identities,assignments).contexts)Object.assign(assignments[c.sourceId],{confirmed:true,accountSnapshot:c.accountSnapshot});
  return prepareNativeFlatexPreview(model,documents,assignments,{mode:'net',openingDate:'1999-01-01',openingConfirmed:true,selectedIds:inspection.pairs.map(p=>p.id),...extra});
 }
 const f=fixture(),first=convert(f.documents),all=convert(nativeBatchDocuments());
 const initial=prepare(f.model,first);assert.equal(initial.eligible,true,initial.reason);importCSV(f.model,initial.preview);
 assert.equal(ledgerQuantityAudit(f.model).ok,true);
 const original=structuredClone(f.model),openings=JSON.stringify(f.model.openingPositions);
 // Independent signed cents/shares: 10000 - 2175 + 1175 = 9000; 0 + 2 - 1 = 1.
 const oracle={cashCents:10000n-2175n+1175n,shares:0n+2n-1n};
 const appended=prepare(f.model,all);assert.equal(appended.eligible,true,appended.reason);assert.equal(appended.preview.ready,1);assert.equal(appended.preview.duplicates,1);
 const draft=structuredClone(f.model);importCSV(draft,appended.preview);
 assert.equal(draft.positions.find(p=>p.id==='cash').quantityExact,String(oracle.cashCents/100n));assert.equal(draft.positions.find(p=>p.id==='etf').quantityExact,String(oracle.shares));
 const economicBooking=b=>{b=structuredClone(b);delete b.importSource.ownedSnapshot;delete b.netSettlement.depot.occurrences;delete b.netSettlement.account.occurrences;return b;};
 for(const b of original.bookings)assert.deepEqual(economicBooking(draft.bookings.find(n=>n.id===b.id)),economicBooking(b));
 for(const j of original.journalEntries)assert.deepEqual(draft.journalEntries.find(n=>n.id===j.id),j);
 assert.equal(JSON.stringify(draft.openingPositions),openings);
 const restored=safeImport(JSON.parse(backup(draft))),replay=prepare(restored,all);assert.equal(replay.eligible,true,replay.reason);assert.equal(replay.preview.ready,0);assert.equal(replay.preview.duplicates,2);
 results.push({dialect,case:'later pair with intact earlier ledger, no reference',result:'PASS',cash:'90',shares:'1',priorBookingEconomicIdentity:'unchanged; source occurrences legitimately augmented',priorJournalOpeningBytes:'unchanged',restoreReplay:'two duplicates, zero new'});
 snapshot(f.model);
 const before=JSON.stringify(f.model),appendWithReference=prepare(f.model,all);
 assert.equal(appendWithReference.eligible,false);assert.match(appendWithReference.reason,/Referenzstand/);assert.equal(JSON.stringify(f.model),before);
 const backfill=prepare(f.model,all,{mode:'net-backfill',openingQuantities:{etf:'0',cash:'100'},expectedClosing:{etf:'1',cash:'90'},closingConfirmed:true});
 assert.equal(backfill.eligible,false);assert.match(backfill.reason,/Vorhandene und neue Gruppen/);assert.equal(JSON.stringify(f.model),before);
 results.push({dialect,case:'same economically valid continuation after a current reference exists',result:'BLOCKED_AS_DESIGNED',appendReason:appendWithReference.reason,backfillReason:backfill.reason,sourceBytesUnchanged:true,independentContinuation:{shares:'1',cash:'90'},currentLedgerBalance:{shares:'2',cash:'78.25'},missingContract:'Explicit dated later closing observation and existing reference treatment; observed quantities must not silently replace ledger current state'});
 const earlier=fixture(),lateDocs=convert(laterDocuments()),late=prepare(earlier.model,lateDocs);assert.equal(late.eligible,true,late.reason);importCSV(earlier.model,late.preview);
 const lateBefore=JSON.stringify(earlier.model),reordered=prepare(earlier.model,[...first,...lateDocs]);assert.equal(reordered.eligible,false);assert.match(reordered.reason,/früheren Wirtschaftsgruppen|Chronologie/);assert.equal(JSON.stringify(earlier.model),lateBefore);
 results.push({dialect,case:'earlier source arrives after later group has been journaled',result:'BLOCKED_AS_DESIGNED',reason:reordered.reason,sourceBytesUnchanged:true,existingIdentities:'not renumbered or regenerated'});
}
mkdirSync('artifacts/gates',{recursive:true});writeFileSync('artifacts/gates/uh05-incremental-journaled.json',JSON.stringify({main:'315de8c236b8bd05d891ebe159858e6537784edd',scope:'Synthetic executable next-contract diagnostic, not a new product feature or historical balance acceptance',results},null,2)+'\n');
console.log('UH05 incremental journaled diagnostic: both dialects, independent integer oracle, identity/opening preservation, restore/reimport and pure reference/chronology blockers PASS');
