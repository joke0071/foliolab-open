import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,safeImport,backup,totalExactEUR} from '../src/model.js';
import {parseCSV,inferMapping,previewCSV,importCSV} from '../src/csv-import.js';
import {previewBookingChange,prepareBookingChange,prepareBookingUndo,bookingChangePermissions} from '../src/booking-management.js';
import {executeTransaction,ledgerQuantityAudit} from '../src/transactions.js';
import {provenCashImport} from '../src/import-identity.js';
function fixture(type='deposit'){
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic',type:'cash'},m));m.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',name:'Cash',kind:'cash',quantity:100,price:1},m));
 const csv=parseCSV(`date,type,position,quantity,unitPrice,feeEUR,taxEUR,fxRate,externalId\n2026-01-02,${type},cash,20,1,0,0,1,synthetic-reference`),mapping=inferMapping(csv.headers);
 importCSV(m,previewCSV(m,csv,mapping));return {m,csv,mapping,b:m.bookings[0]};
}
const request=b=>({action:'remove',ids:[b.id],reason:'Synthetic verified receipt'});
test('all six exact imported cash events reverse, retain source audit, restore and undo byte-for-byte',()=>{
 for(const type of ['deposit','withdraw','dividend','interest','fee','tax']){
  const {m,b,csv,mapping}=fixture(type),before=JSON.stringify(m),permissions=bookingChangePermissions(m,b.id);
  assert.equal(permissions.remove.length===0,true,type);assert.equal(permissions.edit.length===0,false);assert.equal(permissions.notes.length===0,false);
  const {candidate,receipt}=prepareBookingChange(m,request(b),{expectedModel:before,confirmed:true});
  assert.equal(totalExactEUR(candidate),'100');assert.equal(candidate.positions[0].quantityExact,'100');assert.equal(ledgerQuantityAudit(candidate).ok,true);assert.equal(candidate.bookings.length,0);assert.equal(candidate.externalCashFlows.length,0);
  assert.deepEqual(candidate.openingPositions,m.openingPositions);assert.deepEqual(candidate.positions[0].costBasisExact,m.positions[0].costBasisExact);
  const audit=candidate.journalEntries.at(-1);assert.equal(audit.managementAudit.version,2);assert.deepEqual(audit.managementAudit.originals[0].booking,b);
  const restored=safeImport(JSON.parse(backup(candidate)));assert.equal(ledgerQuantityAudit(restored).ok,true);
  const repeat=previewCSV(restored,csv,mapping);assert.equal(repeat.ready,0);assert.equal(repeat.issues[0].code,'source-conflict');assert.match(repeat.issues[0].message,/gelöscht/);assert.throws(()=>importCSV(restored,repeat));
  const undo=prepareBookingUndo(candidate,receipt);assert.equal(JSON.stringify(undo),before);assert.equal(previewCSV(undo,csv,mapping).duplicates,1);assert.equal(JSON.stringify(m),before);
 }
});
test('identity, ownership, original payload and journal changes fail closed without touching model',()=>{
 const mutations=[b=>b.importSource.ownership='manual',b=>b.importSource.externalId='',b=>b.importSource.sourceId='flatex-at',b=>b.importSource.occurrence=2,b=>b.importFingerprint='legacy',b=>b.notes='changed',b=>b.importSource.sourcePayload=b.importSource.sourcePayload.replace('"quantity":"20"','"quantity":"21"'),b=>b.importSource.fileId='',b=>delete b.importSource];
 for(const mutate of mutations){const {m,b}=fixture();mutate(b);const before=JSON.stringify(m);try{assert.equal(previewBookingChange(m,request(b)).ready,false);}catch(e){assert.match(e.message,/Import|herkunft|Backup/);}assert.equal(JSON.stringify(m),before);}
 const {m,b}=fixture();m.journalEntries[0].recordedAt='changed';assert.equal(previewBookingChange(m,request(b)).ready,false);
});
test('later dependent spending, snapshots, references, linked transfers, FX and coupled costs remain blocked',()=>{
 const cases=[(m,b)=>executeTransaction(m,{positionId:'cash',type:'withdraw',quantity:110,date:'2026-01-03'}),(m,b)=>m.snapshots.push({id:'s',date:'2026-01-03',total:120,totalEURExact:'120'}),(m,b)=>m.positions[0].notes=b.id,(m,b)=>b.feeEUR=1,(m,b)=>b.fxRate=2,(m,b)=>b.cashPositionId='cash'];
 for(const mutate of cases){const {m,b}=fixture();mutate(m,b);const before=JSON.stringify(m);let blocked=false;try{blocked=!previewBookingChange(m,request(b)).ready;}catch{blocked=true;}assert.equal(blocked,true);assert.equal(JSON.stringify(m),before);}
});
test('stale preimage, absent consent and a later mutation prevent apply or undo',()=>{
 const {m,b}=fixture();assert.throws(()=>prepareBookingChange(m,request(b),{expectedModel:'stale',confirmed:true}));assert.throws(()=>prepareBookingChange(m,request(b),{expectedModel:JSON.stringify(m),confirmed:false}));const {candidate,receipt}=prepareBookingChange(m,request(b),{expectedModel:JSON.stringify(m),confirmed:true});candidate.positions[0].notes='later';assert.throws(()=>prepareBookingUndo(candidate,receipt));
});
test('audit version cannot be downgraded or used for imported edits; source evidence survives backup validation',()=>{
 const {m,b}=fixture(),next=previewBookingChange(m,request(b)).candidate;
 for(const mutate of [a=>a.version=1,a=>a.action='edit',a=>a.originals[0].booking.importSource.ownedSnapshot='forged']){const invalid=structuredClone(next);mutate(invalid.journalEntries.at(-1).managementAudit);assert.throws(()=>safeImport(invalid));}
 assert.equal(provenCashImport(b,m.journalEntries[0]),true);
});
test('changed source payload and renamed file cannot bypass deleted external identity',()=>{
 const {m,b,csv,mapping}=fixture(),next=previewBookingChange(m,request(b)).candidate;const changed=structuredClone(csv);changed.sourceName='new-file.csv';changed.rows[0].quantity='30';const p=previewCSV(next,changed,mapping);assert.equal(p.ready,0);assert.equal(p.issues[0].code,'source-conflict');
});
test('retained imported journal and cash-flow amounts cannot be tampered on restore',()=>{
 const {m,b}=fixture(),next=previewBookingChange(m,request(b)).candidate;
 for(const mutate of [o=>o.flows[0].amountExactEUR='21',o=>o.flows=[],o=>o.journal.postings[0].accountId='wrong',o=>o.journal.status='other',o=>o.booking.external=false,o=>o.booking.importSource.futureReference='unknown']){
  const invalid=structuredClone(next);mutate(invalid.journalEntries.at(-1).managementAudit.originals[0]);assert.throws(()=>safeImport(invalid));
 }
});
test('reimport protection also marks changed namespace and ambiguous same-day source for review',()=>{
 const {m,b,csv,mapping}=fixture(),next=previewBookingChange(m,request(b)).candidate;
 const changed=structuredClone(csv);changed.rows[0].quantity='30';changed.sourceName='changed.csv';const p=previewCSV(next,changed,mapping,{sourceId:'other-source'});assert.equal(p.ready,0);assert.equal(p.issues[0].code,'source-conflict');changed.rows[0].externalId='';const unproven=previewCSV(next,changed,mapping);assert.equal(unproven.ready,0);changed.rows[0].externalId='independent-new-reference';const independent=previewCSV(next,changed,mapping);assert.equal(independent.ready,1);assert.deepEqual(independent.issues,[]);
});
