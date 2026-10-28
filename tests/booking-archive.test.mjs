import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,safeImport,backup,totalExactEUR} from '../src/model.js';
import {executeTransaction,ledgerQuantityAudit} from '../src/transactions.js';
import {prepareBookingArchive,previewBookingArchive,previewBookingChange,prepareBookingUndo,bookingEditRequest} from '../src/booking-management.js';
import {bookingHistoryRows,positionHistory} from '../src/booking-history.js';
import {historicalWealthView} from '../src/historical-portfolio-value.js';
import {bookedAnnualOverview} from '../src/booking-insights.js';
import {prepareCSVBatch} from '../src/csv-batch.js';
import {createCompleteBackup,unpackCompleteBackup} from '../src/complete-backup.js';
import {buildAssetWizardDraft} from '../src/asset-wizard-core.js';
import {legacyV190Header} from './fixtures/booking-ui/legacy-v190-header.mjs';
import {previewCSV,inferMapping,importCSV} from '../src/csv-import.js';
function fixture(){const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'Cash'},m));m.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',name:'Cash',kind:'cash',quantity:100,price:1},m));executeTransaction(m,{id:'manual-deposit',type:'deposit',date:'2025-01-01',positionId:'cash',quantity:20,unitPrice:1});m.openingPositions[0].asOf='2024-12-31';return m;}
const archive=(m,ids,archived=true)=>prepareBookingArchive(m,{ids,archived},{expectedModel:JSON.stringify(m),confirmed:true});
test('archive is presentation-only: exact values, journal, flows, sources and histories unchanged; undo exact',()=>{
 const m=fixture(),before=JSON.stringify(m),p=previewBookingArchive(m,['manual-deposit'],true);assert.equal(p.changed,1);assert.equal(JSON.stringify(m),before);
 const {candidate,receipt}=archive(m,['manual-deposit']);assert.equal(totalExactEUR(candidate),totalExactEUR(m));assert.deepEqual(candidate.bookings,m.bookings);assert.deepEqual(candidate.journalEntries,m.journalEntries);assert.deepEqual(candidate.externalCashFlows,m.externalCashFlows);assert.deepEqual(candidate.openingPositions,m.openingPositions);assert.deepEqual(bookedAnnualOverview(candidate),bookedAnnualOverview(m));assert.deepEqual(positionHistory(candidate,'cash'),positionHistory(m,'cash'));assert.deepEqual(historicalWealthView(candidate),historicalWealthView(m));assert.deepEqual(bookingHistoryRows(candidate),bookingHistoryRows(m));assert.equal(ledgerQuantityAudit(candidate).ok,true);assert.deepEqual(prepareBookingUndo(candidate,receipt),m);assert.equal(JSON.stringify(m),before);
 assert.deepEqual(archive(candidate,['manual-deposit'],false).candidate,m);
});
test('archive round-trips through the actual portable model and preserves old backups with no new field',()=>{
 const m=fixture(),candidate=archive(m,['manual-deposit']).candidate,restored=safeImport(JSON.parse(backup(candidate)));
 assert.deepEqual(restored.bookingPresentation,{version:1,archivedIds:['manual-deposit']});assert.deepEqual(restored.bookings,candidate.bookings);assert.equal('bookingPresentation' in safeImport(JSON.parse(backup(m))),false);
});
test('malformed archive identity/version/extra fields fail closed; no silent dropping or partial operation',()=>{
 const m=fixture(),before=JSON.stringify(m);
 for(const value of [null,[],{version:1,archivedIds:[]},{version:2,archivedIds:[]},{version:1,archivedIds:['missing']},{version:1,archivedIds:['manual-deposit','manual-deposit']},{version:1,archivedIds:[],ignore:true},{version:1,archivedIds:[{}]}])assert.throws(()=>safeImport({...m,version:4,bookingPresentation:value}),/Buchungsarchiv/);
 assert.throws(()=>archive(m,['manual-deposit','missing']));assert.throws(()=>archive(m,['manual-deposit','manual-deposit']));assert.throws(()=>prepareBookingArchive(m,{ids:['manual-deposit'],archived:true},{expectedModel:'stale',confirmed:true}));assert.throws(()=>prepareBookingArchive(m,{ids:['manual-deposit'],archived:true},{expectedModel:before,confirmed:false}));assert.equal(JSON.stringify(m),before);
});
test('archived imported booking remains an exact repeat-import duplicate and its original is untouched',()=>{
 const m=fixture(),batch=prepareCSVBatch([{name:'synthetic.csv',text:'date,type,position,quantity,price,id\n2025-01-02,deposit,cash,5,1,source-1'}]),mapping=inferMapping(batch.parsed.headers);
 importCSV(m,previewCSV(m,batch.parsed,mapping));const imported=m.bookings.find(b=>b.importSource),candidate=archive(m,[imported.id]).candidate;
 assert.deepEqual(candidate.bookings,m.bookings);const replay=previewCSV(candidate,batch.parsed,mapping);assert.equal(replay.duplicates,1);assert.equal(replay.ready,0);assert.deepEqual(replay.simulated.bookingPresentation,candidate.bookingPresentation);
 assert.equal(previewBookingChange(candidate,{ids:[imported.id],action:'remove',reason:'Not allowed'}).ready,false);
});
test('known display references do not block existing safe corrections; removal cleans display IDs and undo restores them',()=>{
 const m=archive(fixture(),['manual-deposit']).candidate;
 const correction=previewBookingChange(m,{ids:['manual-deposit'],action:'edit',changes:{quantity:'7'},reason:'Receipt'});assert.equal(correction.ready,true);assert.deepEqual(correction.candidate.bookingPresentation,m.bookingPresentation);
 const removal=previewBookingChange(m,{ids:['manual-deposit'],action:'remove',reason:'Receipt'});assert.equal(removal.ready,true);assert.equal('bookingPresentation' in removal.candidate,false);assert.equal(removal.candidate.journalEntries.at(-1).managementAudit.originals[0].booking.id,'manual-deposit');
 m.futureReference={id:'manual-deposit'};assert.equal(previewBookingChange(m,{ids:['manual-deposit'],action:'remove',reason:'Receipt'}).ready,false);
});
test('technical generated rows can be hidden without removing or ignoring their financial evidence',()=>{
 const m=fixture();executeTransaction(m,{id:'technical',type:'correction',date:'2025-01-02',positionId:'cash',quantity:130,unitPrice:1});
 const row=bookingHistoryRows(m).find(b=>b.technical);assert.ok(row);const candidate=archive(m,[row.id]).candidate;
 assert.deepEqual(candidate.journalEntries,m.journalEntries);assert.deepEqual(positionHistory(candidate,'cash'),positionHistory(m,'cash'));assert.equal(totalExactEUR(candidate),'130');
});
test('note-only unified edits preserve economic classification and no-op requests produce no fake audit',()=>{
 const m=fixture(),b=m.bookings[0],request=bookingEditRequest(b,{quantity:'20.00',date:b.date,notes:'Checked',reason:'Receipt'});assert.equal(request.action,'notes');
 const p=previewBookingChange(m,request);assert.deepEqual(p.candidate.positions,m.positions);assert.deepEqual(p.candidate.journalEntries.slice(0,-1),m.journalEntries);assert.deepEqual(p.candidate.externalCashFlows,m.externalCashFlows);
 assert.throws(()=>previewBookingChange(m,bookingEditRequest(b,{quantity:'20',date:b.date,notes:b.notes,reason:'Receipt'})),/Keine Änderung/);
});
test('explicit archival alone opts into reader-gated format4; old readers reject before losing metadata',()=>{
 const m=fixture();assert.equal(m.version,3);legacyV190Header(m);
 const {candidate}=archive(m,['manual-deposit']);assert.equal(candidate.version,4);assert.equal(m.version,3);
 const plain=JSON.parse(backup(candidate));assert.equal(plain.version,4);assert.throws(()=>legacyV190Header(plain),/unterstütztes/);
 assert.equal(safeImport(plain).version,4);const full=createCompleteBackup(candidate);assert.equal(unpackCompleteBackup(full).data.version,4);assert.deepEqual(safeImport(unpackCompleteBackup(full).data).bookingPresentation,candidate.bookingPresentation);
 assert.throws(()=>safeImport({...candidate,version:3}),/neue Datenversion/);const missing={...candidate};delete missing.bookingPresentation;assert.throws(()=>safeImport(missing),/Archivformat/);
 assert.equal(archive(candidate,['manual-deposit'],false).candidate.version,3);
});
test('the existing asset wizard retains archive metadata and finance history in a format4 portfolio',()=>{
 const m=archive(fixture(),['manual-deposit']).candidate;
 const next=buildAssetWizardDraft(m,{kind:'cash',name:'New cash',providerId:'p',accountId:'__new__',accountName:'New account',accountType:'checking',mode:'opening',date:'2025-02-01',quantity:'5',currency:'EUR',currentPrice:'1'}).draft;
 assert.equal(next.version,4);assert.deepEqual(next.bookingPresentation,m.bookingPresentation);assert.deepEqual(next.bookings,m.bookings);assert.deepEqual(next.journalEntries,m.journalEntries);assert.deepEqual(safeImport(next).bookingPresentation,m.bookingPresentation);
});
