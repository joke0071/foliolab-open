import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,safeImport,backup} from '../src/model.js';
import {parseCSV,inferMapping,previewCSV,importCSV} from '../src/csv-import.js';
import {prepareBookingChange,prepareBookingUndo} from '../src/booking-management.js';
import {bookingOwnership} from '../src/import-identity.js';
import {setArchivePresentation} from '../src/booking-history.js';
import {ledgerModel,ledgerEvidence,ledgerCSV,at} from './ledger-live-fixture.mjs';
import {readUnifiedBitcoinFiles,previewUnifiedBitcoin,confirmUnifiedBitcoin} from '../src/unified-bitcoin.js';
import {createSyncSnapshot,validateSyncSnapshot,SYNC_SNAPSHOT_KIND} from '../src/sync-snapshot.js';

const types=['deposit','withdraw','dividend','interest','fee','tax'];
const canonical=m=>{const d=JSON.parse(backup(m,{includeHistory:true}));delete d.settings;return d;};
const env=d=>JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:1,data:d});
function fixture(type='deposit',model=null){
 const m=model||blankModel();
 if(!model){m.providers.push(createProvider({id:'p',name:'Synthetic'}));m.accounts.push(createAccount({id:'cash-account',providerId:'p',name:'Synthetic cash',type:'cash'},m));}
 m.positions.push(createPosition({id:'csv-cash',providerId:m.providers[0].id,accountId:model?m.accounts[0].id:'cash-account',name:'Synthetic cash',kind:'cash',quantity:100,price:1},m));
 const csv=parseCSV(`date,type,position,quantity,unitPrice,feeEUR,taxEUR,fxRate,externalId,notes\n2026-01-02,${type},csv-cash,20,1,0,0,1,synthetic-reference,Synthetic receipt`),mapping=inferMapping(csv.headers);
 importCSV(m,previewCSV(m,csv,mapping));return {m,csv,mapping};
}
function remove(m,ids=m.bookings.filter(b=>b.importSource?.sourceId==='generic-csv').map(b=>b.id)){
 return prepareBookingChange(m,{action:'remove',ids,reason:'Synthetic verified receipt'},{expectedModel:JSON.stringify(m),confirmed:true});
}
async function roundtrip(d){
 const raw=JSON.stringify(d),plain=await createSyncSnapshot(raw),r=await validateSyncSnapshot(plain);
 assert.deepEqual(r.data,d);assert.equal(JSON.stringify(d),raw);assert.equal(r.plain,plain);assert.ok(Object.isFrozen(r.data));return r.data;
}
async function rejectBoth(d){
 const raw=JSON.stringify(d);await assert.rejects(()=>createSyncSnapshot(raw));await assert.rejects(()=>validateSyncSnapshot(env(d)));assert.equal(JSON.stringify(d),raw);
}
const payload=(b,edit)=>{const p=JSON.parse(b.importSource.sourcePayload);edit(p);b.importSource.sourcePayload=JSON.stringify(p);};

test('all six generic cash events preserve exact complete provenance and unchanged reimport behavior',async()=>{
 for(const type of types){const {m,csv,mapping}=fixture(type),d=canonical(m),r=await roundtrip(d);
  assert.equal(r.bookings[0].importSource.sourcePayload,d.bookings[0].importSource.sourcePayload);
  const restored=safeImport(r),before=JSON.stringify(restored),p=previewCSV(restored,csv,mapping);
  assert.equal(p.duplicates,1);assert.equal(p.ready,0);assert.deepEqual(p.issues,[]);assert.deepEqual(importCSV(restored,p),{imported:0,duplicates:1});assert.equal(JSON.stringify(restored),before);
 }
});
test('all six durable removal audits retain original booking, journal, flows and deleted-source protection',async()=>{
 for(const type of types){const {m,csv,mapping}=fixture(type),{candidate}=remove(m),d=canonical(candidate),r=await roundtrip(d);
  assert.deepEqual(r.journalEntries.at(-1).managementAudit,d.journalEntries.at(-1).managementAudit);
  assert.equal(r.bookings.length,0);assert.equal(r.positions[0].quantityExact,'100');
  const restored=safeImport(r),p=previewCSV(restored,csv,mapping);assert.equal(p.ready,0);assert.equal(p.issues[0].code,'source-conflict');assert.match(p.issues[0].message,/gelöscht/);assert.throws(()=>importCSV(restored,p));
  const changed=structuredClone(csv);changed.sourceName='renamed.csv';changed.rows[0].quantity='30';assert.equal(previewCSV(restored,changed,mapping).issues[0].code,'source-conflict');
 }
});
test('local undo retains its exact preimage guard; snapshot transport does not port transient undo authority',async()=>{
 const {m,csv,mapping}=fixture(),{candidate,receipt}=remove(m),r=await roundtrip(canonical(candidate));
 const undo=prepareBookingUndo(candidate,receipt);assert.equal(JSON.stringify(undo),JSON.stringify(m));assert.equal(previewCSV(undo,csv,mapping).duplicates,1);
 // safeImport reconstructs the model and settings; no promise of byte-identical
 // receipt.after, and the snapshot must never manufacture a replacement receipt.
 const restored=safeImport(r);assert.notEqual(JSON.stringify(restored),receipt.after);assert.throws(()=>prepareBookingUndo(restored,receipt));
 const later=safeImport(r);later.positions[0].notes='later';assert.throws(()=>prepareBookingUndo(later,receipt));
 assert.ok(!Object.hasOwn(r,'receipt'));
});
test('batched removal retains all originals and separate active imports without dropping audit lineage',async()=>{
 const {m}=fixture();const csv=parseCSV('date,type,position,quantity,unitPrice,feeEUR,taxEUR,fxRate,externalId\n2026-01-03,interest,csv-cash,3,1,0,0,1,second\n2026-01-04,tax,csv-cash,1,1,0,0,1,third');
 importCSV(m,previewCSV(m,csv,inferMapping(csv.headers)));const ids=m.bookings.filter(b=>b.type!=='tax').map(b=>b.id);
 const r=await roundtrip(canonical(remove(m,ids).candidate));assert.equal(r.bookings.length,1);assert.equal(r.journalEntries.at(-1).managementAudit.originals.length,2);assert.deepEqual(r.journalEntries.at(-1).managementAudit.afterBookings,[null,null]);
});
test('v4 archive and current UNKNOWN/18 decimal positions coexist without credentials',async()=>{
 const {m}=fixture();m.positions.push(createPosition({id:'unknown',providerId:'p',accountId:'cash-account',kind:'stock',name:'Unknown',quantityExact:'1.000000000000000001',price:1,currency:'USD',fxRate:null,fxRateExact:null},m));
 const d=canonical(setArchivePresentation(m,{bookingIds:[m.bookings[0].id]}));d.settings={apiKey:'SECRET'};
 const plain=await createSyncSnapshot(JSON.stringify(d)),r=await validateSyncSnapshot(plain);delete d.settings;assert.deepEqual(r.data,d);assert.ok(!plain.includes('SECRET'));assert.equal(r.data.positions[1].fxRateExact,'UNKNOWN');
});
test('complete UH02-v5 and generic cash active/removal chains coexist losslessly',async()=>{
 const m=ledgerEvidence(ledgerModel()),input={receipts:m.purchaseEvidence.receipts,operations:readUnifiedBitcoinFiles([ledgerCSV()]).operations};
 const unified=confirmUnifiedBitcoin(m,input,'wallet',{baseline:previewUnifiedBitcoin(m,input,'wallet').baseline,confirmed:true,externalFunding:true,at});
 const {m:combined}=fixture('deposit',unified);await roundtrip(canonical(combined));const r=await roundtrip(canonical(remove(combined).candidate));assert.equal(r.version,5);assert.equal(r.bookings.length,1);assert.equal(r.bookings[0].importSource.sourceId,'unified-bitcoin-v1');
});
test('generic source and nested JSON extension fields cannot tunnel credentials',async()=>{
 const edits=[b=>b.importSource.apiKey='SECRET',b=>payload(b,p=>p.token='SECRET'),b=>payload(b,p=>p.quantity={value:'20',token:'SECRET'}),b=>b.importSource.ownedSnapshot='{"token":"SECRET"}',b=>b.importSource.ownership='manual',b=>b.importSource.sourceId='flatex-at',b=>b.importSource.sourceId='kraken-uh03-v1',b=>b.importSource.occurrence=2];
 for(const edit of edits){const d=canonical(fixture().m);edit(d.bookings[0]);await rejectBoth(d);}
});
test('noncanonical JSON, types, Unicode, duplicate keys and missing required source fields fail closed',async()=>{
 const edits=[s=>s.sourcePayload=JSON.stringify(JSON.parse(s.sourcePayload),null,2),s=>s.sourcePayload=s.sourcePayload.replace('{','{"type":"deposit",'),s=>s.sourcePayload='{"notes":"\\ud800"}',s=>s.sourcePayload=null,s=>s.ownedSnapshot={},s=>delete s.fileId,s=>s.externalId='',s=>s.version=2];
 for(const edit of edits){const d=canonical(fixture().m);edit(d.bookings[0].importSource);await rejectBoth(d);}
});
test('source payload, fingerprint, ownership and journal discrepancies reject without repairs',async()=>{
 const edits=[d=>payload(d.bookings[0],p=>p.quantity='21'),d=>d.bookings[0].importFingerprint='legacy',d=>d.bookings[0].notes='changed',d=>d.journalEntries[0].recordedAt='changed',d=>d.bookings[0].importSource.accountId='foreign',d=>d.positions[0].currency='USD',d=>d.positions[0].kind='stock',d=>{d.bookings[0].importSource.ownedSnapshot=bookingOwnership(d,d.bookings[0])+' ';}];
 for(const edit of edits){const d=canonical(fixture().m);edit(d);await rejectBoth(d);}
});
test('every retained audit level is closed and incomplete audit/flow/ownership chains reject',async()=>{
 const edits=[(a,j)=>j.apiKey='SECRET',a=>a.apiKey='SECRET',a=>a.originals[0].apiKey='SECRET',a=>a.originals[0].booking.apiKey='SECRET',a=>a.originals[0].journal.apiKey='SECRET',a=>a.originals[0].journal.postings[0].token='SECRET',a=>a.originals[0].flows[0].apiKey='SECRET',a=>payload(a.originals[0].booking,p=>p.token='SECRET'),a=>a.originals[0].flows=[],a=>a.originals[0].flows[0].amountExactEUR='21',a=>a.originals[0].booking.importSource.ownedSnapshot='forged',a=>a.afterBookings=[],a=>a.afterBookings[0]=a.originals[0].booking,a=>a.originals=[],a=>a.version=1,a=>a.action='edit',a=>delete a.originals[0].journal,a=>a.originals[0].journal.managementAudit={}];
 for(const edit of edits){const d=canonical(remove(fixture().m).candidate),j=d.journalEntries.at(-1);edit(j.managementAudit,j);await rejectBoth(d);}
});
test('manual/mixed management and generic trades remain unsupported, including nested source changes',async()=>{
 for(const edit of [a=>delete a.originals[0].booking.importSource,a=>a.originals[0].booking.importSource.sourceId='other',a=>a.originals[0].booking.type='buy']){const d=canonical(remove(fixture().m).candidate);edit(d.journalEntries.at(-1).managementAudit);await rejectBoth(d);}
 const d=canonical(fixture().m);d.bookings[0].type='buy';await rejectBoth(d);
});
