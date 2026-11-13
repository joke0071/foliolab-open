import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,safeImport,backup} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {prepareBookingChange,prepareBookingUndo,previewBookingChange} from '../src/booking-management.js';
import {parseCSV,inferMapping,previewCSV,importCSV} from '../src/csv-import.js';
import {setArchivePresentation} from '../src/booking-history.js';
import {createSyncSnapshot,validateSyncSnapshot,SYNC_SNAPSHOT_KIND} from '../src/sync-snapshot.js';
const kinds=['deposit','withdraw','dividend','interest','fee','tax'];
const canonical=m=>{const d=JSON.parse(backup(m,{includeHistory:true}));delete d.settings;return d;};
function fixture(type='deposit'){
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic'}));
 for(const id of ['a','b']){m.accounts.push(createAccount({id:'account-'+id,providerId:'p',name:'Synthetic '+id,type:'cash'},m));m.positions.push(createPosition({id,providerId:'p',accountId:'account-'+id,name:'Synthetic cash',kind:'cash',quantity:100,price:1},m));}
 executeTransaction(m,{positionId:'a',type,quantity:20,date:'2026-01-02',unitPrice:1,fxRate:1});return m;
}
const request=(id,action='remove',changes)=>({ids:[id],action,changes,reason:'Synthetic verified receipt'});
const change=(m,r)=>prepareBookingChange(m,r,{expectedModel:JSON.stringify(m),confirmed:true});
async function roundtrip(m){const d=canonical(m),raw=JSON.stringify(d),plain=await createSyncSnapshot(raw),r=await validateSyncSnapshot(plain);assert.deepEqual(r.data,d);assert.equal(JSON.stringify(d),raw);assert.ok(Object.isFrozen(r.data));return safeImport(r.data);}
async function rejectBoth(d){const raw=JSON.stringify(d);await assert.rejects(()=>createSyncSnapshot(raw));await assert.rejects(()=>validateSyncSnapshot(JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:1,data:d})));assert.equal(JSON.stringify(d),raw);}

test('all six manual cash types retain complete notes/edit/remove originals, afterbookings and cash flows',async()=>{
 for(const type of kinds)for(const action of ['notes','edit','remove']){
  const m=fixture(type),id=m.bookings[0].id,changes=action==='notes'?{notes:'Verified note'}:action==='edit'?{quantity:'7.25',date:'2026-01-03',notes:'Verified correction'}:undefined;
  const {candidate,receipt}=change(m,request(id,action,changes)),r=await roundtrip(candidate);
  assert.deepEqual(r.journalEntries,candidate.journalEntries);assert.deepEqual(r.externalCashFlows,candidate.externalCashFlows);assert.deepEqual(r.bookings,candidate.bookings);assert.deepEqual(r.openingPositions,candidate.openingPositions);
  assert.equal(JSON.stringify(prepareBookingUndo(candidate,receipt)),JSON.stringify(m));assert.throws(()=>prepareBookingUndo(r,receipt));
 }
});
test('edit then notes then remove continues through repeated snapshot/restore without cutting historical lineage',async()=>{
 let m=fixture(),id=m.bookings[0].id;
 for(const r of [request(id,'edit',{quantity:'7.25'}),request(id,'edit',{quantity:'8'}),request(id,'notes',{notes:'Checked again'}),request(id)])m=await roundtrip(change(m,r).candidate);
 assert.equal(m.bookings.length,0);assert.equal(m.positions[0].quantityExact,'100');assert.equal(m.journalEntries.filter(j=>j.type==='booking-management-audit').length,4);
 assert.deepEqual(m.journalEntries.map(j=>j.managementAudit.action),['edit','edit','notes','remove']);
});
test('multi-account batch removal preserves separate original identities and sequence for later transactions',async()=>{
 const m=fixture();executeTransaction(m,{positionId:'b',type:'withdraw',quantity:30,date:'2026-01-02',unitPrice:1,fxRate:1});
 const r=await roundtrip(change(m,{ids:m.bookings.map(b=>b.id),action:'remove',reason:'Both receipts'}).candidate);
 assert.deepEqual(r.positions.map(p=>p.quantityExact),['100','100']);assert.equal(r.journalEntries[0].managementAudit.originals.length,2);
 const sequence=r.journalEntries[0].sequence;executeTransaction(r,{positionId:'a',type:'deposit',quantity:1,date:'2026-01-03',unitPrice:1,fxRate:1});assert.ok(r.journalEntries.at(-1).sequence>sequence);await roundtrip(r);
});
test('v4 archive and UNKNOWN/large-decimal position coexist with manual cash audit history',async()=>{
 const m=fixture(),n=change(m,request(m.bookings[0].id,'notes',{notes:'Verified'})).candidate;
 n.positions.push(createPosition({id:'unknown',providerId:'p',accountId:'account-a',kind:'stock',name:'Unknown',quantityExact:'1.000000000000000001',price:1,currency:'USD',fxRate:null,fxRateExact:null},n));
 const a=setArchivePresentation(n,{bookingIds:[n.bookings[0].id]}),r=await roundtrip(a);assert.equal(r.version,4);assert.equal(r.positions[2].fxRateExact,'UNKNOWN');assert.equal(r.positions[2].quantityExact,'1.000000000000000001');
});
test('pure generic CSV removal and manual audit families coexist while repeat-import protection remains',async()=>{
 let m=fixture(),id=m.bookings[0].id;m=change(m,request(id,'notes',{notes:'Manual note'})).candidate;
 const csv=parseCSV('date,type,position,quantity,unitPrice,feeEUR,taxEUR,fxRate,externalId\n2026-01-03,interest,b,3,1,0,0,1,source'),mapping=inferMapping(csv.headers);importCSV(m,previewCSV(m,csv,mapping));
 const imported=m.bookings.find(b=>b.importSource);m=change(m,request(imported.id)).candidate;
 const r=await roundtrip(m);assert.deepEqual(r.journalEntries.filter(j=>j.managementAudit).map(j=>j.managementAudit.version),[1,2]);assert.equal(previewCSV(r,csv,mapping).issues[0].code,'source-conflict');assert.equal(previewBookingChange(r,request(id)).ready,true);
});
test('stale current booking and documentary afterbookings stay distinct and never grant a follow-up edit',async()=>{
 const m=fixture(),id=m.bookings[0].id,n=change(m,request(id,'notes',{notes:'Checked'})).candidate;n.bookings[0].notes='Changed outside trail';
 const r=await roundtrip(n);assert.equal(r.bookings[0].notes,'Changed outside trail');assert.equal(r.journalEntries.at(-1).managementAudit.afterBookings[0].notes,'Checked');assert.equal(previewBookingChange(r,request(id)).ready,false);
});
test('extensions at every original/after/audit level reject whole snapshot without source mutation',async()=>{
 const edits=[(a,j)=>j.token='SECRET',a=>a.token='SECRET',a=>a.originals[0].token='SECRET',a=>a.originals[0].booking.token='SECRET',a=>a.originals[0].journal.token='SECRET',a=>a.originals[0].journal.postings[0].token='SECRET',a=>a.originals[0].flows[0].token='SECRET',a=>a.afterBookings[0].token='SECRET'];
 for(const edit of edits){const m=fixture(),d=canonical(change(m,request(m.bookings[0].id,'notes',{notes:'Verified'})).candidate),j=d.journalEntries.at(-1);edit(j.managementAudit,j);await rejectBoth(d);}
});
test('wrong scope, audit forms, original journals and artificial financial audit postings reject',async()=>{
 const edits=[(a,j)=>j.postings[0].quantityDeltaExact='1',(a,j)=>j.postings[0].role='cash',a=>a.version=2,a=>a.action='unknown',a=>a.originals=[],a=>a.afterBookings=[null],a=>a.originals[0].booking.importFingerprint='source',a=>a.originals[0].booking.importSource={},a=>a.originals[0].journal.source='csv',a=>a.originals[0].journal.managementAudit={},a=>a.originals[0].booking.type='buy',a=>a.afterBookings[0].type='transfer',a=>a.originals[0].journal.postings=[]];
 for(const edit of edits){const m=fixture(),d=canonical(change(m,request(m.bookings[0].id,'notes',{notes:'Verified'})).candidate),j=d.journalEntries.at(-1);edit(j.managementAudit,j);await rejectBoth(d);}
 for(const edit of [d=>d.positions[0].currency='USD',d=>d.positions[0].kind='stock',d=>d.positions.splice(0,1)]){const m=fixture(),d=canonical(change(m,request(m.bookings[0].id)).candidate);edit(d);await rejectBoth(d);}
});
test('manual removal requires null afterbookings and does not admit mixed imported originals',async()=>{
 for(const edit of [a=>a.afterBookings[0]=a.originals[0].booking,a=>a.afterBookings=[],a=>delete a.originals[0].flows,a=>a.originals[0].booking.importSource={sourceId:'generic-csv'}]){const m=fixture(),d=canonical(change(m,request(m.bookings[0].id)).candidate);edit(d.journalEntries.at(-1).managementAudit);await rejectBoth(d);}
});
