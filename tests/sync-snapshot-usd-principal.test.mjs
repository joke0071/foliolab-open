import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {usdPrincipalFixture} from './kraken-usd-principal-fixture.mjs';
import {previewKrakenImport,confirmKrakenImport,previewKrakenWithdrawal,confirmKrakenWithdrawal} from '../src/kraken-import.js';
import {safeImport,backup,totalExactEUR,createAccount,createPosition} from '../src/model.js';
import {validateUnpricedUSDTransfers,ledgerQuantityAudit,executeTransaction} from '../src/transactions.js';
import {bookingOwnership} from '../src/import-identity.js';
import {withdrawalDigest,validateKrakenWithdrawals} from '../src/kraken-withdrawal-evidence.js';
import {csvUndoReceipt,undoCSV} from '../src/csv-batch.js';
import {setArchivePresentation} from '../src/booking-history.js';
import {prepareBookingChange} from '../src/booking-management.js';
import {parseCSV,inferMapping,previewCSV,importCSV} from '../src/csv-import.js';
import {ledgerModel,ledgerEvidence,ledgerCSV,at} from './ledger-live-fixture.mjs';
import {readUnifiedBitcoinFiles,previewUnifiedBitcoin,confirmUnifiedBitcoin} from '../src/unified-bitcoin.js';
import {projectHistoricalPosition} from '../src/historical-position-value.js';
import {createSyncSnapshot,validateSyncSnapshot,SYNC_SNAPSHOT_KIND} from '../src/sync-snapshot.js';
const oracle=JSON.parse(readFileSync(new URL('../docs/release-evidence/uh05-usd-principal-decimal100.json',import.meta.url)));
const canonical=m=>{const d=JSON.parse(backup(m,{includeHistory:true}));delete d.settings;return d;};
function fixture(){const f=usdPrincipalFixture(),p=previewKrakenImport(f.m,[f.text],f.assignments,f.options);assert.equal(p.ready,1);return {...f,active:confirmKrakenImport(f.m,[f.text],f.assignments,{...f.options,baseline:p.baseline,confirmed:true})};}
function withdraw(m,f){const options={...f.options,selectedGroups:[m.bookings.find(b=>b.importSource?.sourceId==='kraken-uh03-v1').importSource.fileId]},p=previewKrakenWithdrawal(m,[f.text],f.assignments,options);return confirmKrakenWithdrawal(m,[f.text],f.assignments,{...options,baseline:p.baseline,confirmed:true});}
async function roundtrip(m){const d=canonical(m),raw=JSON.stringify(d),plain=await createSyncSnapshot(raw),r=await validateSyncSnapshot(plain);assert.deepEqual(r.data,d);assert.equal(JSON.stringify(d),raw);assert.equal(r.plain,plain);assert.ok(Object.isFrozen(r.data)&&Object.isFrozen(r.data.journalEntries));return safeImport(r.data);}
async function rejectBoth(d){const raw=JSON.stringify(d);await assert.rejects(()=>createSyncSnapshot(raw));await assert.rejects(()=>validateSyncSnapshot(JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:1,data:d})));assert.equal(JSON.stringify(d),raw);}
const payload=(b,edit)=>{const v=JSON.parse(b.importSource.sourcePayload);edit(v);b.importSource.sourcePayload=JSON.stringify(v);};
const pair=d=>d.bookings.length?{b:d.bookings[0],j:d.journalEntries[0]}:{b:d.journalEntries[0].krakenWithdrawal.originals[0].booking,j:d.journalEntries[0].krakenWithdrawal.originals[0].journal};
const reseal=d=>{const {b,j}=pair(d);b.importSource.ownedSnapshot=bookingOwnership({journalEntries:[j]},b);if(d.journalEntries[0].krakenWithdrawal){const e=d.journalEntries[0].krakenWithdrawal;e.digest=withdrawalDigest(e.originals);}};

test('full active principal provenance and empty v5 marker survive without any monetary substitution',async()=>{
 const f=fixture(),d=canonical(f.active),r=await roundtrip(f.active),b=r.bookings[0],j=r.journalEntries[0];
 assert.equal(r.version,5);assert.deepEqual(r.flatexNetRemovals,[]);assert.deepEqual(r.positions.map(p=>p.quantityExact),[oracle.sourceAfterExact,oracle.targetAfterExact]);
 assert.deepEqual(b,d.bookings[0]);assert.deepEqual(j,d.journalEntries[0]);assert.deepEqual(r.openingPositions,d.openingPositions);assert.equal(b.fxRate,null);assert.equal(b.amountExactEUR,null);assert.equal(b.taxEUR,null);assert.equal(b.costsVerified,false);
 assert.deepEqual(j.postings.map(p=>p.amountBookEURExact),['UNKNOWN','UNKNOWN']);assert.equal(totalExactEUR(r),null);assert.deepEqual(r.externalCashFlows,[]);assert.equal(ledgerQuantityAudit(r).ok,true);validateUnpricedUSDTransfers(r);
});
test('active snapshot restore retains duplicate replay, complete withdrawal and permanent replay protection',async()=>{
 const f=fixture(),m=await roundtrip(f.active),p=previewKrakenImport(m,[f.text],f.assignments,f.options),before=JSON.stringify(m);assert.equal(p.duplicates,1);assert.equal(p.ready,0);
 confirmKrakenImport(m,[f.text],f.assignments,{...f.options,baseline:p.baseline,confirmed:true});assert.equal(JSON.stringify(m),before);
 const removed=withdraw(m,f),e=removed.journalEntries[0].krakenWithdrawal;assert.deepEqual(e.originals,[{booking:m.bookings[0],journal:m.journalEntries[0],flows:[]}]);
 const restored=await roundtrip(removed);assert.deepEqual(restored.journalEntries,removed.journalEntries);assert.equal(withdrawalDigest(e.originals),e.digest);validateKrakenWithdrawals(restored);
 assert.deepEqual(restored.positions.map(p=>p.quantityExact),f.m.positions.map(p=>p.quantityExact));assert.equal(restored.bookings.length,0);assert.equal(restored.journalEntries[0].type,'uh03-undo');
 const replay=previewKrakenImport(restored,[f.text],f.assignments,f.options);assert.equal(replay.ready,0);assert.equal(replay.issues.length,1);assert.throws(()=>confirmKrakenImport(restored,[f.text],f.assignments,{...f.options,baseline:replay.baseline,confirmed:true}));
 await roundtrip(restored);
});
test('local exact-preimage Undo stays local and gains no authority from snapshot restoration',async()=>{
 const f=fixture(),receipt=csvUndoReceipt(JSON.stringify(f.m),f.active),local=structuredClone(f.active);undoCSV(local,receipt);assert.equal(JSON.stringify(local),JSON.stringify(f.m));
 const restored=await roundtrip(f.active);assert.throws(()=>undoCSV(restored,receipt));
});
test('archived principal remains v5 and keeps the full documentary withdrawal path',async()=>{
 const f=fixture(),m=setArchivePresentation(f.active,{bookingIds:[f.active.bookings[0].id]}),r=await roundtrip(m);assert.equal(r.version,5);assert.deepEqual(r.bookingPresentation,m.bookingPresentation);await roundtrip(withdraw(r,f));
});
test('known current FX cannot replace historical UNKNOWN or grant historical EUR valuation',async()=>{
 const f=fixture(),j=JSON.stringify(f.active.journalEntries);for(const p of f.active.positions){p.fxRate=1;p.fxRateExact='1';}
 const r=await roundtrip(f.active);assert.equal(totalExactEUR(r),'17.00000000000000001');assert.equal(JSON.stringify(r.journalEntries),j);assert.equal(projectHistoricalPosition(r,'earn',{dates:['1999-02-03']}).rows[0].valueEURExact,null);await roundtrip(withdraw(r,f));
});
test('UH02 purchase provenance coexists with the complete USD v5 chain and marker',async()=>{
 const f=fixture(),btc=ledgerEvidence(ledgerModel()),m=f.active;
 for(const key of ['providers','accounts','positions'])m[key].push(...btc[key]);m.walletHistory=btc.walletHistory;m.purchaseEvidence=btc.purchaseEvidence;
 const input={receipts:m.purchaseEvidence.receipts,operations:readUnifiedBitcoinFiles([ledgerCSV()]).operations},plan=previewUnifiedBitcoin(m,input,'wallet'),b=confirmUnifiedBitcoin(m,input,'wallet',{baseline:plan.baseline,confirmed:true,externalFunding:true,at});
 const r=await roundtrip(b);assert.equal(r.bookings.length,2);assert.equal(r.purchaseEvidence.bitcoinLedger.length,1);assert.deepEqual(r.flatexNetRemovals,[]);assert.equal(r.bookings.find(b=>b.importSource.sourceId==='kraken-uh03-v1').fxRate,null);
});
test('generic CSV removal and manual management history coexist without altering principal provenance',async()=>{
 const f=fixture(),m=f.active;m.accounts.push(createAccount({id:'eur',providerId:m.providers[0].id,name:'Synthetic EUR',currency:'EUR',type:'cash'},m));m.positions.push(createPosition({id:'eur-cash',providerId:m.providers[0].id,accountId:'eur',name:'EUR',kind:'cash',quantity:100,price:1},m));
 const manual=executeTransaction(m,{positionId:'eur-cash',type:'deposit',quantity:2,date:'2026-01-02',unitPrice:1,fxRate:1});let current=prepareBookingChange(m,{ids:[manual.id],action:'notes',changes:{notes:'Verified'},reason:'Synthetic'},{expectedModel:JSON.stringify(m),confirmed:true}).candidate;
 const csv=parseCSV('date,type,position,quantity,unitPrice,feeEUR,taxEUR,fxRate,externalId\n2026-01-03,interest,eur-cash,3,1,0,0,1,synthetic'),mapping=inferMapping(csv.headers);importCSV(current,previewCSV(current,csv,mapping));current=prepareBookingChange(current,{ids:[current.bookings.find(b=>b.importSource?.sourceId==='generic-csv').id],action:'remove',reason:'Synthetic'},{expectedModel:JSON.stringify(current),confirmed:true}).candidate;
 const r=await roundtrip(current);assert.deepEqual(r.journalEntries.filter(j=>j.managementAudit).map(j=>j.managementAudit.version),[1,2]);assert.equal(r.bookings.find(b=>b.importSource?.sourceId==='kraken-uh03-v1').importSource.sourcePayload,f.active.bookings.find(b=>b.importSource?.sourceId==='kraken-uh03-v1').importSource.sourcePayload);assert.equal(previewCSV(r,csv,mapping).issues[0].code,'source-conflict');
});
test('missing/downgraded/filled marker and marker-only portfolios reject without version bypass',async()=>{
 const f=fixture();for(const m of [f.active,withdraw(f.active,f)])for(const edit of [d=>delete d.flatexNetRemovals,d=>d.version=3,d=>d.version=4,d=>d.flatexNetRemovals=[{}],d=>d.flatexNetRemovals=null,d=>{d.bookings=[];d.journalEntries=[];}]){const d=canonical(m);edit(d);await rejectBoth(d);}
 await rejectBoth(canonical(f.m));
});
test('active and withdrawn JSON payload extensions and noncanonical encodings cannot hide credentials',async()=>{
 const f=fixture();for(const m of [f.active,withdraw(f.active,f)])for(const edit of [b=>payload(b,v=>v.token='SECRET'),b=>payload(b,v=>v.action.token='SECRET'),b=>payload(b,v=>v.bindings[0].push('SECRET')),b=>payload(b,v=>v.bitcoinBridge='SECRET'),b=>{b.importSource.sourcePayload=JSON.stringify(JSON.parse(b.importSource.sourcePayload),null,2);},b=>{b.importSource.token='SECRET';},b=>{b.importSource.ownedSnapshot=b.importSource.ownedSnapshot.slice(0,-1)+',"SECRET"]';}]){const d=canonical(m);edit(pair(d).b);if(d.journalEntries[0].krakenWithdrawal)d.journalEntries[0].krakenWithdrawal.digest=withdrawalDigest(d.journalEntries[0].krakenWithdrawal.originals);await rejectBoth(d);}
});
test('unknown fields at every permanent-original layer reject even with a matching digest',async()=>{
 const f=fixture(),m=withdraw(f.active,f);for(const edit of [d=>d.journalEntries[0].token='SECRET',d=>d.journalEntries[0].krakenWithdrawal.token='SECRET',d=>d.journalEntries[0].krakenWithdrawal.originals[0].token='SECRET',d=>pair(d).b.token='SECRET',d=>pair(d).j.token='SECRET',d=>pair(d).j.postings[0].token='SECRET',d=>d.journalEntries[0].postings[0].token='SECRET',d=>d.journalEntries[0].krakenWithdrawal.originals[0].flows.push({token:'SECRET'})]){const d=canonical(m);edit(d);const e=d.journalEntries[0].krakenWithdrawal;e.digest=withdrawalDigest(e.originals);await rejectBoth(d);}
});
test('existing validators still reject altered UNKNOWN amounts, bindings, ownership and source roles',async()=>{
 const f=fixture();for(const m of [f.active,withdraw(f.active,f)])for(const edit of [(b,j)=>b.fxRate=1,(b,j)=>b.amountEUR=0,(b,j)=>j.postings[0].amountBookEURExact='0',(b,j)=>j.nativeCurrency='EUR',(b,j)=>j.postings[1].quantityDeltaExact='1',(b,j)=>payload(b,v=>v.bindings[0][1]='wrong'),(b,j)=>payload(b,v=>v.action.quantity='1'),(b,j)=>payload(b,v=>v.action.fxRate='1'),(b,j)=>delete b.importSource,(b,j)=>b.importSource.fileId='0'.repeat(64)]){const d=canonical(m),{b,j}=pair(d);edit(b,j);if(b.importSource)reseal(d);await rejectBoth(d);}
});
test('permanent proof cannot lose originals, digest, ownership, identity or nonresurrection checks',async()=>{
 const f=fixture(),removed=withdraw(f.active,f);for(const edit of [e=>delete e.digest,e=>e.digest='0'.repeat(64),e=>e.originals=[],e=>e.originals.push(structuredClone(e.originals[0])),e=>e.count=2,e=>delete e.originals[0].journal,e=>delete e.originals[0].flows,e=>e.originals[0].booking.importSource.ownedSnapshot='[]',e=>e.group='0'.repeat(64)]){const d=canonical(removed);edit(d.journalEntries[0].krakenWithdrawal);await rejectBoth(d);}
 const d=canonical(removed);d.bookings.push(structuredClone(d.journalEntries[0].krakenWithdrawal.originals[0].booking));await rejectBoth(d);
});
test('other Kraken journal roles and incompatible USD ownership stay outside this scope',async()=>{
 const f=fixture();for(const m of [f.active,withdraw(f.active,f)])for(const edit of [d=>pair(d).j.status='balanced',d=>pair(d).b.type='deposit',d=>pair(d).j.source='manual',d=>pair(d).b.importSource.sourceId='other',d=>d.positions[1].currency='EUR',d=>d.positions[1].accountId=d.positions[0].accountId,d=>{d.positions[0].economicRole='borrowed';d.positions[0].valuationMode='liability';},d=>{d.positions[1].costBasisExact='1';d.positions[1].costBasisEUR=1;}]){const d=canonical(m);edit(d);reseal(d);await rejectBoth(d);}
});
