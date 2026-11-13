import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture as krakenFixture,source as tradeSource} from './kraken-import-fixture.mjs';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
import {previewKrakenImport,confirmKrakenImport,previewKrakenWithdrawal,confirmKrakenWithdrawal} from '../src/kraken-import.js';
import {backup,safeImport,createAccount,createPosition} from '../src/model.js';
import {ledgerQuantityAudit,executeTransaction} from '../src/transactions.js';
import {bookingOwnership} from '../src/import-identity.js';
import {withdrawalDigest,validateKrakenWithdrawals} from '../src/kraken-withdrawal-evidence.js';
import {setArchivePresentation} from '../src/booking-history.js';
import {csvUndoReceipt,undoCSV} from '../src/csv-batch.js';
import {usdPrincipalFixture} from './kraken-usd-principal-fixture.mjs';
import {createSyncSnapshot,validateSyncSnapshot,SYNC_SNAPSHOT_KIND} from '../src/sync-snapshot.js';

const at='1999-02-01T12:00:00.000Z';
const rows=[
 {txid:'SYN-STAKING-OUT',refid:'SYN-STAKING-P',type:'earn',subtype:'autoallocation',wallet:'spot',asset:'ETH',amount:'-2.000000000000000001',fee:'0',balance:'1',feecurrency:'ETH'},
 {txid:'SYN-STAKING-IN',refid:'SYN-STAKING-P',type:'earn',subtype:'autoallocation',wallet:'earn',asset:'ETH',amount:'2.000000000000000001',fee:'0',balance:'2.000000000000000001',feecurrency:'ETH'},
 {txid:'SYN-STAKING-REWARD',refid:'SYN-STAKING-R',time:'1999-01-03 12:00:00',type:'earn',subtype:'reward',wallet:'earn',asset:'ETH',amount:'0.100000000000000001',fee:'0.010000000000000001',balance:'2.090000000000000001',feecurrency:'ETH'}
];
const canonical=m=>{const d=JSON.parse(backup(m,{includeHistory:true}));delete d.settings;return d;};
function imported(text=krakenCSV(rows)){
 const f=krakenFixture(text),p=previewKrakenImport(f.m,[text],f.assignments,{openingConfirmed:true});assert.deepEqual(p.issues,[]);
 return {...f,text,ids:p.groups.map(g=>g.id),active:confirmKrakenImport(f.m,[text],f.assignments,{openingConfirmed:true,confirmed:true,baseline:p.baseline})};
}
function remove(m,f,id=f.ids.at(-1)){
 const o={selectedGroups:[id],openingConfirmed:true,partialConfirmed:true},p=previewKrakenWithdrawal(m,[f.text],f.assignments,o);
 return confirmKrakenWithdrawal(m,[f.text],f.assignments,{...o,confirmed:true,baseline:p.baseline,at});
}
async function roundtrip(m){
 const d=canonical(m),raw=JSON.stringify(d),plain=await createSyncSnapshot(raw),r=await validateSyncSnapshot(plain);
 assert.equal(JSON.stringify(d),raw);assert.equal(r.plain,plain);assert.deepEqual(r.data,d);assert.ok(Object.isFrozen(r.data.journalEntries));
 const restored=safeImport(r.data);assert.equal(ledgerQuantityAudit(restored).ok,true);return restored;
}
async function rejectBoth(d){
 const raw=JSON.stringify(d);await assert.rejects(()=>createSyncSnapshot(raw));await assert.rejects(()=>validateSyncSnapshot(JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:1,data:d})));assert.equal(JSON.stringify(d),raw);
}
const editPayload=(b,fn)=>{const p=JSON.parse(b.importSource.sourcePayload);fn(p);b.importSource.sourcePayload=JSON.stringify(p);};
const original=d=>{const audit=d.journalEntries.find(j=>j.krakenWithdrawal);return audit?audit.krakenWithdrawal.originals[0]:{booking:d.bookings.find(b=>b.type==='transfer'),journal:d.journalEntries.find(j=>j.type==='transfer'),flows:[]};};
function reseal(d){for(const j of d.journalEntries){if(j.krakenWithdrawal){for(const o of j.krakenWithdrawal.originals)o.booking.importSource.ownedSnapshot=bookingOwnership({journalEntries:[o.journal]},o.booking);j.krakenWithdrawal.digest=withdrawalDigest(j.krakenWithdrawal.originals);}}for(const b of d.bookings)b.importSource.ownedSnapshot=bookingOwnership(d,b);}

test('full principal/reward/fee provenance survives, exact quantities and unknown costs are unchanged',async()=>{
 const f=imported(),d=canonical(f.active),r=await roundtrip(f.active);
 assert.deepEqual(r.positions.map(p=>p.quantityExact),['1','2.090000000000000001']);assert.deepEqual(r.bookings,d.bookings);assert.deepEqual(r.journalEntries,d.journalEntries);
 assert.deepEqual(r.externalCashFlows,[]);assert.ok(r.positions.every(p=>p.costBasisExact===null&&p.realizedPnLExact===null));
 const fee=r.bookings.find(b=>b.type==='fee');assert.equal(fee.quantityExact,'0.010000000000000001');assert.equal(fee.amountExactEUR,null);assert.equal(fee.unitPrice,null);assert.equal(fee.feeEUR,null);assert.equal(fee.taxEUR,null);
 assert.equal(r.bookings.find(b=>b.type==='reward').quantityExact,'0.100000000000000001');assert.equal(r.version,3);
});
test('complete restore/reimport/terminal removal chain keeps both permanent replay barriers',async()=>{
 const f=imported();let r=await roundtrip(f.active),p=previewKrakenImport(r,[f.text,f.text],f.assignments,{openingConfirmed:true});assert.equal(p.duplicates,2);assert.equal(p.ready,0);assert.deepEqual(p.issues,[]);
 assert.throws(()=>remove(r,f,f.ids[0]),/Spätere/);
 const originals=structuredClone(r);r=await roundtrip(remove(r,f));assert.deepEqual(r.positions.map(p=>p.quantityExact),['1','2.000000000000000001']);
 const audit=r.journalEntries.find(j=>j.krakenWithdrawal);assert.equal(audit.krakenWithdrawal.count,2);assert.deepEqual(audit.krakenWithdrawal.originals.map(o=>o.booking.id),[originals.bookings.find(b=>b.type==='reward').id,originals.bookings.find(b=>b.type==='fee').id]);
 r=await roundtrip(remove(r,f,f.ids[0]));assert.equal(r.bookings.length,0);assert.deepEqual(r.positions.map(p=>p.quantityExact),['3.000000000000000001','0']);assert.equal(r.journalEntries.length,2);validateKrakenWithdrawals(r);
 const [header,...lines]=f.text.split('\n');for(const input of [[f.text],[[header,...lines.reverse()].join('\n')]]){
  p=previewKrakenImport(r,input,f.assignments,{openingConfirmed:true});assert.equal(p.ready,0);assert.equal(p.issues.length,2);assert.ok(p.issues.every(i=>/dauerhaft/.test(i.message)));assert.throws(()=>confirmKrakenImport(r,input,f.assignments,{openingConfirmed:true,confirmed:true,baseline:p.baseline}));
 }
 await roundtrip(r);
});
test('archived chain retains provenance and withdrawal cleans only its original booking IDs',async()=>{
 const f=imported(),m=setArchivePresentation(f.active,{bookingIds:f.active.bookings.map(b=>b.id)}),r=await roundtrip(m);assert.deepEqual(r.bookingPresentation,m.bookingPresentation);
 const end=await roundtrip(remove(r,f));assert.deepEqual(end.bookingPresentation.archivedIds,[f.active.bookings.find(b=>b.type==='transfer').id]);
 await roundtrip(remove(end,f,f.ids[0]));
});
test('local CSV Undo keeps exact model preimage, snapshot supplies no new undo receipt',async()=>{
 const f=imported(),receipt=csvUndoReceipt(JSON.stringify(f.m),f.active),local=structuredClone(f.active);undoCSV(local,receipt);assert.equal(JSON.stringify(local),JSON.stringify(f.m));
 const restored=await roundtrip(f.active);assert.throws(()=>undoCSV(restored,receipt));
});
test('existing full USD UNKNOWN chain coexists without broadening the v5 marker rule',async()=>{
 const f=imported(),u=usdPrincipalFixture(),m=f.active;
 // Compose before the existing import API assigns the next global journal sequence.
 for(const k of ['providers','accounts','positions','openingPositions'])m[k].push(...u.m[k]);m.version=5;m.flatexNetRemovals=[];
 const p=previewKrakenImport(m,[u.text],u.assignments,u.options);assert.deepEqual(p.issues,[]);
 const active=confirmKrakenImport(m,[u.text],u.assignments,{...u.options,confirmed:true,baseline:p.baseline}),r=await roundtrip(active);
 assert.equal(r.version,5);assert.deepEqual(r.flatexNetRemovals,[]);assert.equal(r.bookings.find(b=>b.reconciliationStatus==='unpriced-native-usd-principal').fxRate,null);
 await roundtrip(remove(r,f));
});
test('manual cash history coexists through snapshot and independent group removal',async()=>{
 const f=imported(),m=f.active;m.accounts.push(createAccount({id:'cash-a',providerId:'kraken',name:'EUR',currency:'EUR',type:'cash'},m));m.positions.push(createPosition({id:'cash-p',accountId:'cash-a',providerId:'kraken',name:'EUR',kind:'cash',quantity:0,price:1},m));executeTransaction(m,{type:'deposit',date:'1999-01-01',positionId:'cash-p',quantity:'10',unitPrice:'1'});
 const r=await roundtrip(m);assert.equal(r.externalCashFlows[0].amountExactEUR,'10');await roundtrip(remove(r,f));
});
test('all nested active and permanent evidence branches reject unknown credentials',async()=>{
 const f=imported(),states=[canonical(f.active),canonical(remove(f.active,f,f.ids.at(-1)))];
 for(const d0 of states)for(const mutate of [
  d=>{original(d).booking.apiKey='forbidden';},d=>{original(d).journal.apiKey='forbidden';},d=>{original(d).journal.postings[0].apiKey='forbidden';},
  d=>{original(d).booking.importSource.apiKey='forbidden';},d=>editPayload(original(d).booking,p=>{p.apiKey='forbidden';}),
  d=>editPayload(original(d).booking,p=>{p.action.apiKey='forbidden';}),d=>editPayload(original(d).booking,p=>{p.bindings[0].push('forbidden');}),
  d=>{original(d).booking.importSource.ownedSnapshot='["forbidden"]';}
 ]){const d=structuredClone(d0);mutate(d);await rejectBoth(d);}
});
test('full permanent original/digest/count/documentation tamper never normalizes or prunes',async()=>{
 const f=imported(),base=canonical(remove(f.active,f));
 for(const mutate of [
  d=>{d.journalEntries.find(j=>j.krakenWithdrawal).krakenWithdrawal.digest='f'.repeat(64);},
  d=>{d.journalEntries.find(j=>j.krakenWithdrawal).krakenWithdrawal.originals.pop();},
  d=>{original(d).booking.quantityExact='999';},d=>{original(d).flows.push({id:'unknown',date:'1999-01-01',amountEUR:1,amountExactEUR:'1'});},
  d=>{d.journalEntries.find(j=>j.krakenWithdrawal).postings[0].amountBookEURExact='1';},
  d=>{d.journalEntries.find(j=>j.krakenWithdrawal).krakenWithdrawal.extra=true;}
 ]){const d=structuredClone(base);mutate(d);await rejectBoth(d);}
});
test('partial active reward/fee group remains unsupported even after coherent ledger removal',async()=>{
 const f=imported(),d=canonical(f.active),fee=d.bookings.find(b=>b.type==='fee');d.bookings=d.bookings.filter(b=>b.id!==fee.id);d.journalEntries=d.journalEntries.filter(j=>j.id!==fee.id);
 const p=d.positions.find(p=>p.id===fee.positionId);p.quantityExact='2.100000000000000002';p.quantity=Number(p.quantityExact);assert.equal(ledgerQuantityAudit(d).ok,true);await rejectBoth(d);
});
test('source action and binding edits stay rejected after ownership is recomputed',async()=>{
 const base=canonical(imported().active);
 for(const mutate of [
  p=>{p.action.quantity='9';},p=>{p.action.date='1999-01-01';},p=>{p.action.type='buy';},p=>{p.action.fxRate='2';},
  p=>{p.action.targetPositionId='foreign';},p=>{p.bindings[1][1]='foreign';},p=>{p.bindings[1][0]=p.bindings[0][0];},p=>{p.payload='unknown';},p=>{p.group='f'.repeat(64);}
 ]){const d=structuredClone(base);editPayload(original(d).booking,mutate);reseal(d);await rejectBoth(d);}
});
test('same group reward/fee differing payloads and detached journals cannot pass the complete group gate',async()=>{
 const base=canonical(imported().active);
 for(const mutate of [
  d=>editPayload(d.bookings.find(b=>b.type==='fee'),p=>{p.payload='f'.repeat(64);}),
  d=>{d.bookings=d.bookings.filter(b=>b.type!=='transfer');},
  d=>{d.journalEntries.find(j=>j.type==='transfer').nativeCurrency='ETH';}
 ]){const d=structuredClone(base);mutate(d);reseal(d);await rejectBoth(d);}
});
test('ETH alone grants neither v5 nor empty/filled Flatex marker support',async()=>{
 for(const mutate of [d=>{d.version=5;},d=>{d.flatexNetRemovals=[];},d=>{d.version=5;d.flatexNetRemovals=[{}];}]){const d=canonical(imported().active);mutate(d);await rejectBoth(d);}
});
test('other native coin families and ordinary trade groups remain unsupported in full',async()=>{
 for(const text of [krakenCSV(rows.map(r=>({...r,asset:'SOL',feecurrency:'SOL'}))),tradeSource()]){const f=imported(text);await rejectBoth(canonical(f.active));}
});
test('noncanonical source payload and source ownership extensions are never stripped',async()=>{
 const base=canonical(imported().active);
 for(const mutate of [
  b=>{b.importSource.sourcePayload=JSON.stringify(JSON.parse(b.importSource.sourcePayload),null,2);},
  b=>{b.importSource.sourcePayload=b.importSource.sourcePayload.replace('{','{"group":"duplicate",');},
  b=>{b.importSource.occurrence=2;},b=>{b.importSource.sourceId='other';}
 ]){const d=structuredClone(base);mutate(original(d).booking);await rejectBoth(d);}
});
test('unsupported extra payload beside an otherwise complete valid chain blocks the whole snapshot',async()=>{
 const f=imported();for(const key of ['pendingResume','privateConfig','unknownEvidence']){const d=canonical(f.active);d[key]={secret:'forbidden'};await rejectBoth(d);}
});
test('resealed ownership cannot conceal changed economic leg relations in active or permanent groups',async()=>{
 const f=imported();
 for(const base of [canonical(f.active),canonical(remove(f.active,f))])for(const mutate of [
  o=>{o.booking.quantityExact='9';editPayload(o.booking,p=>{p.action.quantity='9';});},
  o=>{o.booking.amountEUR=1;o.booking.amountExactEUR='1';},
  o=>{o.journal.postings[0].role='other';},
  o=>{o.booking.fxSource='current';},
  o=>{o.booking.quantity=999;}
 ]){const d=structuredClone(base);mutate(original(d));reseal(d);await rejectBoth(d);}
});
