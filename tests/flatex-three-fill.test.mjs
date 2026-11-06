import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
import {threeFixture} from './flatex-three-fill-fixture.mjs';
import {inspectFlatexNetPairs,prepareFlatexNetPreview,validateNetSettlement,withdrawFlatexNetGroups} from '../src/flatex-net-settlement.js';
import {importCSV} from '../src/csv-import.js';
import {backup,safeImport,createAccount,createPosition} from '../src/model.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
import {csvUndoReceipt,undoCSV} from '../src/csv-batch.js';
import {previewSharedImport,confirmSharedImport} from '../src/shared-import.js';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
const oracle=JSON.parse(readFileSync(new URL('../docs/release-evidence/uh05-three-fill-oracle-2026-11-06.json',import.meta.url)));
const preview=f=>prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options);
import {assertThreeOracle} from './flatex-three-fill-oracle.mjs';
for(const context of [false,true])test('independent Decimal oracle: ten cases, both file orders, native dialect '+(context?13:12),()=>{
 for(const c of oracle.cases)for(const reverse of [false,true]){
  const f=threeFixture({spec:c,context,reverse}),before=JSON.stringify(f.model),docs=JSON.stringify(f.documents),p=preview(f);assert.equal(f.inspection.pairs.length,1);assert.equal(p.eligible,true,c.name+': '+p.reason);assert.equal(p.preview.ready,4);assert.equal(JSON.stringify(f.model),before);assert.equal(JSON.stringify(f.documents),docs);
  importCSV(f.model,p.preview);assertThreeOracle(f.model,c);
  const restored=safeImport(JSON.parse(backup(f.model))),repeat=preview({...f,model:restored,documents:[...f.documents].reverse()});assert.equal(repeat.eligible,true,repeat.reason);assert.equal(repeat.preview.ready,0);assert.equal(repeat.preview.duplicates,4);assert.equal(JSON.stringify(repeat.preview.simulated),JSON.stringify(restored));
  const receipt=csvUndoReceipt(before,f.model);undoCSV(f.model,receipt);assert.equal(JSON.stringify(f.model),before);
 }
});
test('shared planner requires current complete choice and backup; full session Undo and replay',()=>{
 const f=threeFixture(),before=JSON.stringify(f.model),sources={bitcoin:{receipts:[],operations:[]},kraken:[],bitpanda:[],flatex:f.documents.map(document=>({name:'Synthetic three',document})),files:f.files.map(file=>({name:file.name,kind:'flatex',rows:1}))},choices={flatex:{confirmed:true,partialConfirmed:true,assignments:f.assignments,options:{...f.options,mode:'net'}}};
 const plan=previewSharedImport(f.model,sources,choices);assert.equal(plan.reports[0].ready,4);assert.equal(JSON.stringify(f.model),before);assert.throws(()=>confirmSharedImport(f.model,sources,choices,plan,{confirmed:true,backupConfirmed:false}));
 const changed=structuredClone(choices);changed.flatex.options.openingConfirmed=false;assert.throws(()=>confirmSharedImport(f.model,sources,changed,plan,{confirmed:true,backupConfirmed:true}));
 const m=confirmSharedImport(f.model,sources,choices,plan,{confirmed:true,backupConfirmed:true});assert.equal(m.bookings.length,4);undoCSV(m,csvUndoReceipt(before,m));assert.equal(JSON.stringify(m),before);
});
test('hostile restore rejects each missing member/journal and all proof/payload/sequence mutations',()=>{
 const f=threeFixture(),p=preview(f);importCSV(f.model,p.preview);
 for(let i=0;i<4;i++)for(const key of ['bookings','journalEntries']){const m=structuredClone(f.model);m[key].splice(i,1);assert.throws(()=>safeImport(m));}
 const edits=[m=>m.bookings.find(b=>b.netMember==='fill-2').netMember='fill-1',m=>m.bookings[0].feeEUR=0,m=>m.bookings[0].external=true,m=>delete m.bookings[0].netSettlement,m=>m.bookings.forEach(b=>b.netSettlement.version=2),m=>m.bookings.forEach(b=>b.netSettlement.executions.pop()),m=>m.bookings.forEach(b=>b.netSettlement.executions.reverse()),m=>m.bookings.forEach(b=>b.netSettlement.account.sourceId='OTHER'),m=>m.bookings.forEach(b=>b.netSettlement.executions[2].payloadDigest='0'.repeat(64)),m=>m.bookings.forEach(b=>b.netSettlement.differenceExact='0'),m=>m.bookings[0].importSource.sourcePayload=m.bookings[0].importSource.sourcePayload.replace('"version":3','"version":2'),m=>m.journalEntries[0].postings[0].quantityDeltaExact='9',m=>{const a=m.journalEntries.find(j=>j.id===m.bookings.find(b=>b.netMember==='fill-0').journalEntryId),c=m.journalEntries.find(j=>j.id===m.bookings.find(b=>b.netMember==='cash').journalEntryId);[a.sequence,c.sequence]=[c.sequence,a.sequence];}];
 for(const edit of edits){const m=structuredClone(f.model);edit(m);assert.throws(()=>safeImport(m),edit.toString());}
 assert.throws(()=>withdrawFlatexNetGroups(f.model,[f.options.selectedIds[0]]),/Sitzungs-Undo/);
 for(const b of f.model.bookings){const proof=structuredClone(b.netSettlement);proof.version=2;assert.throws(()=>validateNetSettlement(proof));}
});
test('changed original, fourth fill, second cash, FX, scope, direction, dates and partial groups stay blocked without mutation',()=>{
 const changes=[{5:'4',9:'10',8:'SYN-THREE-FILL-3'},{5:'4',9:'10',8:'SYN-THREE-FILL-2'},{5:'3',9:'10',8:'SYN-THREE-FILL-2',10:'USD'},{5:'-3',9:'10',8:'SYN-THREE-FILL-2'},{5:'3',9:'10',8:'SYN-THREE-FILL-2',11:'OTHER'},{5:'3',9:'10',8:'SYN-THREE-FILL-2',1:'05.01.1999'},{5:'3',9:'10',8:'SYN-THREE-FILL-2',2:'07.01.1999'},{5:'3',9:'10',8:'SYN-THREE-FILL-2',3:'IE00SYNTH002'},{5:'3',9:'10',8:'SYN-THREE-FILL-2',7:'ORDER Kauf IE00SYNTH001 994'}];
 for(const change of changes){const f=threeFixture();f.documents.push(parseFlatexNativeCSV(nativeFlatexCSV('depot',[{1:'04.01.1999',2:'06.01.1999',7:'ORDER Kauf IE00SYNTH001 993',...change}])));const before=JSON.stringify(f.model),docs=JSON.stringify(f.documents);assert.equal(preview(f).eligible,false,JSON.stringify(change));assert.equal(JSON.stringify(f.model),before);assert.equal(JSON.stringify(f.documents),docs);}
 const f=threeFixture();f.documents.push(parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:'04.01.1999',1:'06.01.1999',4:'ORDER Kauf IE00SYNTH001 993',5:'OTHER-CASH',6:'-1'}])));assert.equal(preview(f).eligible,false);
 const original=threeFixture();importCSV(original.model,preview(original).preview);
 for(const index of [0,1,2,3]){const m=structuredClone(original.model);m.bookings.splice(index,1);m.journalEntries.splice(index,1);assert.equal(preview({...original,model:m}).eligible,false);}
});
test('documentary overlaps extend every member only; remapping a bank source cannot create another group',()=>{
 const f=threeFixture();importCSV(f.model,preview(f).preview);const before=structuredClone(f.model);
 f.documents.push(parseFlatexNativeCSV(nativeFlatexCSV('depot',[{0:'8',1:'04.01.1999',2:'06.01.1999',5:'3',9:'10',8:'SYN-THREE-FILL-2',7:'ORDER Kauf IE00SYNTH001 993'}])));
 const p=preview(f);assert.equal(p.eligible,true,p.reason);assert.equal(p.preview.evidenceUpdates,1);importCSV(f.model,p.preview);assert.deepEqual(f.model.positions,before.positions);assert.deepEqual(f.model.journalEntries,before.journalEntries);safeImport(JSON.parse(backup(f.model)));
 f.model.accounts.push(createAccount({id:'other',providerId:'p',name:'Other',type:'securities',currency:'EUR'},f.model));f.model.positions.push(createPosition({id:'other-etf',providerId:'p',accountId:'other',name:'ETF',kind:'etf',isin:'IE00SYNTH001',quantity:20,price:10,costBasisEUR:null},f.model));
 for(const ctx of Object.values(f.assignments))if(ctx.accountId==='d')ctx.accountId='other';for(const c of reviewNativeFlatexBindings(f.model,inspectFlatexNetPairs(f.documents).identities,f.assignments).contexts)Object.assign(f.assignments[c.sourceId],{confirmed:true,accountSnapshot:c.accountSnapshot});const beforeRemap=JSON.stringify(f.model);assert.equal(preview(f).eligible,false);assert.equal(JSON.stringify(f.model),beforeRemap);
});
