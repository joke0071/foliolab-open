import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fundingFixture} from './flatex-funding-fixture.mjs';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {inspectFlatexFundingGroups,prepareFlatexFundingPreview,validateFlatexFundingProof,withdrawFlatexNetGroups} from '../src/flatex-net-settlement.js';
import {prepareNativeFlatexPreview} from '../src/flatex-backfill.js';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
import {backup,safeImport,createAccount,createPosition} from '../src/model.js';
import {importCSV} from '../src/csv-import.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
import {csvUndoReceipt,undoCSV} from '../src/csv-batch.js';
import {previewSharedImport,confirmSharedImport} from '../src/shared-import.js';
const oracle=JSON.parse(readFileSync(new URL('../docs/release-evidence/uh05-funding-decimal-oracle-2026-11-07.json',import.meta.url)));
const preview=f=>prepareNativeFlatexPreview(f.model,f.documents,f.assignments,{...f.options,mode:'net-funding'});
const de=s=>s.replace('.',',');
for(const c of oracle.cases)for(const reverse of [false,true])test('independent Decimal chronology / '+c.name+' / reverse '+reverse,()=>{
 const f=fundingFixture({cash:c.opening,quantity:de(c.quantity),price:de(c.price),settlement:de(c.settlement),funding:de(c.funding),fundingDate:c.later?'03.01.1999':'02.01.1999',reverse}),before=JSON.stringify(f.model),sources=JSON.stringify(f.documents),p=preview(f);
 assert.equal(p.eligible,c.eligible,p.reason);assert.equal(JSON.stringify(f.model),before);assert.equal(JSON.stringify(f.documents),sources);
 if(!c.eligible){assert.match(p.reason,/Guthaben|negativ/);return;}
 assert.equal(p.preview.ready,2);importCSV(f.model,p.preview);
 const trade=f.model.bookings.find(b=>b.type==='buy'),credit=f.model.bookings.find(b=>b.type==='deposit');
 assert.equal(f.model.positions.find(p=>p.id==='cash').quantityExact,c.closing);assert.equal(trade.amountExactEUR,c.gross);assert.equal(trade.netSettlement.differenceExact,c.difference);assert.equal(trade.feeEUR,null);assert.equal(trade.taxEUR,null);assert.equal(f.model.positions.find(p=>p.id==='etf').costBasisExact,null);assert.equal(f.model.externalCashFlows.length,1);assert.equal(f.model.externalCashFlows[0].amountExactEUR,c.externalFlow);assert.equal(trade.date,'1999-01-02');assert.equal(credit.date,c.later?'1999-01-03':'1999-01-02');assert.equal(credit.netFunding.valueDate,'1999-01-04');assert.equal(ledgerQuantityAudit(f.model).ok,true);
 const restored=safeImport(JSON.parse(backup(f.model))),again=preview({...f,model:restored,documents:[...f.documents].reverse()});assert.equal(again.eligible,true,again.reason);assert.equal(again.preview.ready,0);assert.equal(again.preview.duplicates,2);assert.equal(JSON.stringify(again.preview.simulated),JSON.stringify(restored));
 undoCSV(f.model,csvUndoReceipt(before,f.model));assert.equal(JSON.stringify(f.model),before);
});
test('only current individually confirmed roles and dated openings, no implicit funding or dates',()=>{
 for(const change of [f=>f.options.fundingRoles={},f=>f.options.fundingRoles[f.options.selectedIds[0]].role='internal',f=>f.options.fundingRoles[f.options.selectedIds[0]].confirmed=false,f=>f.options.fundingRoles.OTHER={role:'external',confirmed:true},f=>f.options.openingConfirmed=false,f=>f.options.openingDate='1999-01-02',f=>f.options.stale=true,f=>f.assignments[Object.keys(f.assignments)[0]].confirmed=false,f=>f.options.selectedIds.push(f.options.selectedIds[0])]){const f=fundingFixture();change(f);const before=JSON.stringify(f.model);assert.equal(preview(f).eligible,false,change.toString());assert.equal(JSON.stringify(f.model),before);}
 assert.throws(()=>prepareNativeFlatexPreview(fundingFixture().model,[],{}, {mode:'net-funding',inventOpening:true}));
});
test('missing, duplicated, changed native funding payload, dates, currency, order and scope remain blocked',()=>{
 const changes=[{6:'22'},{5:'00080000000000000001'},{0:'01.01.1999'},{1:'05.01.1999'},{7:'USD'},{4:'Kauf IE00SYNTH001 0002'},{4:'ORDER Kauf IE00SYNTH001 0009007199254740993'},{4:'Storno Kauf IE00SYNTH001 0009007199254740993'},{9:'OTHER'},{6:'-21,75'},{5:'-'}];
 for(const change of changes){const f=fundingFixture();f.documents=[f.documents[0],parseFlatexNativeCSV(nativeFlatexCSV('account',[{6:'-21,75'},{0:'03.01.1999',4:'Kauf IE00SYNTH001 0009007199254740993',5:'SYN-FUND',6:'21,75',...change}]))];assert.equal(preview(f).eligible,false,JSON.stringify(change));}
 const f=fundingFixture();f.documents.push(parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:'03.01.1999',4:'Kauf IE00SYNTH001 0009007199254740993',5:'SECOND-FUND',6:'21,75'}])));assert.equal(inspectFlatexFundingGroups(f.documents).fundingGroups.length,0);assert.equal(preview(f).eligible,false);
});
test('complete member/flow/source/role contract rejects hostile restore and partial removal',()=>{
 const f=fundingFixture();importCSV(f.model,preview(f).preview);
 const edits=[m=>m.bookings.pop(),m=>m.journalEntries.pop(),m=>m.externalCashFlows=[],m=>m.externalCashFlows[0].date='1999-01-04',m=>m.externalCashFlows.push({...m.externalCashFlows[0],id:m.bookings[0].id}),m=>m.bookings[0].netFunding.role='internal',m=>m.bookings[0].netFunding.date='1999-01-04',m=>m.bookings[0].netFunding.funding.payloadDigest='0'.repeat(64),m=>m.bookings.find(b=>b.type==='buy').netFundingMember='funding',m=>delete m.bookings[0].netFunding,m=>delete m.bookings.find(b=>b.type==='buy').netAugmentation,m=>m.bookings.find(b=>b.type==='deposit').external=false,m=>m.bookings.find(b=>b.type==='deposit').unitPrice=2,m=>m.bookings.find(b=>b.type==='deposit').feeEUR=1,m=>m.bookings.find(b=>b.type==='deposit').date='1999-01-04',m=>m.bookings.find(b=>b.type==='buy').netSettlement.differenceExact='0',m=>m.journalEntries[0].postings[0].quantityDeltaExact='9',m=>m.openingPositions.find(o=>o.positionId==='cash').quantityExact='0'];
 for(const edit of edits){const m=structuredClone(f.model);edit(m);assert.throws(()=>safeImport(m),edit.toString());}
 assert.throws(()=>withdrawFlatexNetGroups(f.model,f.options.selectedIds),/Sitzungs-Undo/);
 const proof=structuredClone(f.inspection.fundingGroups[0]);proof.role='internal';assert.throws(()=>validateFlatexFundingProof(proof));
});
test('repeated exports extend all three source occurrences without another economic effect',()=>{
 const f=fundingFixture();importCSV(f.model,preview(f).preview);const before=structuredClone(f.model);
 const extra=parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:'03.01.1999',4:'Kauf IE00SYNTH001 0009007199254740993',5:'SYN-FUND',6:'21,75'}]));f.documents.push(extra);
 const p=preview(f);assert.equal(p.eligible,true,p.reason);assert.equal(p.preview.ready,0);assert.equal(p.preview.evidenceUpdates,1);importCSV(f.model,p.preview);assert.deepEqual(f.model.positions,before.positions);assert.deepEqual(f.model.journalEntries,before.journalEntries);assert.deepEqual(f.model.externalCashFlows,before.externalCashFlows);safeImport(JSON.parse(backup(f.model)));
 const changed=fundingFixture({funding:'22'});assert.equal(preview({...changed,model:f.model}).eligible,false);
});
test('same bank source cannot acquire another local account or portfolio position',()=>{
 const f=fundingFixture();importCSV(f.model,preview(f).preview);
 f.model.accounts.push(createAccount({id:'other',providerId:'p',name:'other',type:'checking',currency:'EUR'},f.model));f.model.positions.push(createPosition({id:'other-cash',providerId:'p',accountId:'other',name:'EUR other',kind:'cash',quantity:100,price:1,costBasisEUR:null},f.model));
 for(const ctx of Object.values(f.assignments))if(ctx.accountId==='c')ctx.accountId='other';for(const c of reviewNativeFlatexBindings(f.model,f.inspection.identities,f.assignments).contexts)Object.assign(f.assignments[c.sourceId],{confirmed:true,accountSnapshot:c.accountSnapshot});assert.equal(preview(f).eligible,false);
});
test('joint preview exposes both cash roles and one confirmed atomic draft with full Undo',()=>{
 const f=fundingFixture(),before=JSON.stringify(f.model),sources={bitcoin:{receipts:[],operations:[]},kraken:[],bitpanda:[],flatex:f.files,files:f.files.map(f=>({name:f.name,kind:'flatex',rows:f.document.rows.length}))},choices={flatex:{confirmed:true,partialConfirmed:true,assignments:f.assignments,options:{...f.options,mode:'net-funding'}}};
 const plan=previewSharedImport(f.model,sources,choices);assert.match(plan.reports[0].details.map(x=>x.text).join(' '),/Externer Kapitalzufluss/);assert.match(plan.reports[0].details.map(x=>x.text).join(' '),/Interner Kauf/);assert.equal(JSON.stringify(f.model),before);
 assert.throws(()=>confirmSharedImport(f.model,sources,choices,plan,{confirmed:true}));const changed=structuredClone(choices);changed.flatex.options.fundingRoles={};assert.throws(()=>confirmSharedImport(f.model,sources,changed,plan,{confirmed:true,backupConfirmed:true}));
 const m=confirmSharedImport(f.model,sources,choices,plan,{confirmed:true,backupConfirmed:true});assert.equal(m.bookings.length,2);undoCSV(m,csvUndoReceipt(before,m));assert.equal(JSON.stringify(m),before);
});
test('multiple groups and incremental append preserve chronological cash and prior journal bytes',()=>{
 const f=fundingFixture(),later=[parseFlatexNativeCSV(nativeFlatexCSV('depot',[{1:'05.01.1999',2:'07.01.1999',5:'2',9:'10',7:'ABR ORDER Kauf IE00SYNTH001 200',8:'SYN-SECOND-DEPOT'}])),parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:'05.01.1999',1:'07.01.1999',4:'ABR ORDER Kauf IE00SYNTH001 200',5:'SYN-SECOND-SETTLE',6:'-21,75'},{0:'06.01.1999',1:'07.01.1999',4:'Kauf IE00SYNTH001 200',5:'SYN-SECOND-FUND',6:'21,75'}]))];
 const all=[...f.documents,...later],offers=inspectFlatexFundingGroups(all),options={...f.options,selectedIds:offers.fundingGroups.map(f=>f.settlement.id),fundingRoles:Object.fromEntries(offers.fundingGroups.map(f=>[f.settlement.id,{role:'external',confirmed:true}]))};
 const together=prepareFlatexFundingPreview(f.model,all,f.assignments,options);assert.equal(together.eligible,true,together.reason);assert.equal(together.preview.ready,4);assert.equal(together.preview.simulated.positions.find(p=>p.id==='cash').quantityExact,'100');assert.equal(together.preview.simulated.positions.find(p=>p.id==='etf').quantityExact,'4');
 importCSV(f.model,preview(f).preview);const oldJ=structuredClone(f.model.journalEntries),oldOpenings=structuredClone(f.model.openingPositions);
 const incremental=prepareFlatexFundingPreview(f.model,all,f.assignments,options);assert.equal(incremental.eligible,true,incremental.reason);assert.equal(incremental.preview.ready,2);assert.equal(incremental.preview.duplicates,2);importCSV(f.model,incremental.preview);assert.deepEqual(f.model.journalEntries.slice(0,oldJ.length),oldJ);assert.deepEqual(f.model.openingPositions,oldOpenings);assert.equal(f.model.externalCashFlows.length,2);assert.equal(ledgerQuantityAudit(f.model).ok,true);
});
