import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {valueDateFixture} from './flatex-value-date-fixture.mjs';
import {fundingFixture} from './flatex-funding-fixture.mjs';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {inspectFlatexFundingGroups,prepareFlatexFundingPreview,validateFlatexFundingProof} from '../src/flatex-net-settlement.js';
import {backup,safeImport} from '../src/model.js';
import {importCSV} from '../src/csv-import.js';
import {csvUndoReceipt,undoCSV} from '../src/csv-batch.js';
import {units} from '../src/decimal.js';
import {previewSharedImport,confirmSharedImport} from '../src/shared-import.js';
const oracle=JSON.parse(readFileSync(new URL('../docs/release-evidence/uh05-value-date-oracle-2026-11-07.json',import.meta.url)));
const de=s=>s.replace('.',','),date=s=>s.split('-').reverse().join('.');
const preview=f=>prepareFlatexFundingPreview(f.model,f.documents,f.assignments,f.options);
for(const c of oracle.cases)for(const reverse of [false,true])test('separate value dates Decimal / '+c.name+' / reverse '+reverse,()=>{
 const f=valueDateFixture({cash:c.opening,tradeDate:date(c.tradeDate),fundingDate:date(c.fundingDate),quantity:de(c.quantity),price:de(c.price),settlement:de(c.cash),funding:de(c.funding),reverse}),before=JSON.stringify(f.model),sources=JSON.stringify(f.documents),p=preview(f);
 assert.equal(f.inspection.fundingGroups.length,1);assert.equal(p.eligible,c.eligible,p.reason);assert.equal(JSON.stringify(f.model),before);assert.equal(JSON.stringify(f.documents),sources);
 if(!c.eligible){assert.match(p.reason,/Guthaben|negativ/);return;}
 importCSV(f.model,p.preview);const trade=f.model.bookings.find(b=>b.type==='buy'),credit=f.model.bookings.find(b=>b.type==='deposit');
 assert.equal(trade.netFunding.version,2);assert.equal(trade.netFunding.chronology,'next-day-value-date');assert.equal(trade.netFunding.valueDate,c.fundingValueDate);assert.equal(trade.netSettlement.valueDate,c.tradeValueDate);assert.equal(trade.date,c.tradeDate);assert.equal(credit.date,c.fundingDate);assert.equal(trade.amountExactEUR,c.gross);assert.equal(trade.netSettlement.differenceExact,c.difference);assert.equal(trade.feeEUR,null);assert.equal(trade.taxEUR,null);assert.equal(f.model.positions.find(p=>p.id==='etf').costBasisExact,null);assert.equal(f.model.externalCashFlows.length,1);assert.equal(f.model.externalCashFlows[0].amountExactEUR,c.funding);assert.equal(f.model.externalCashFlows[0].date,c.fundingDate);assert.equal(f.model.positions.find(p=>p.id==='cash').quantityExact,c.closing);
 let balance=units(c.opening);const path=f.model.journalEntries.map(j=>{const posting=j.postings.find(p=>p.role==='cash');balance+=units(posting.quantityDeltaExact);return {date:j.date,kind:j.type==='buy'?'trade':'funding',delta:units(posting.quantityDeltaExact),balance};});
 assert.deepEqual(path,c.path.map(p=>({date:p.date,kind:p.kind,delta:units(p.deltaExact),balance:units(p.balanceExact)})));
 const restored=safeImport(JSON.parse(backup(f.model))),again=preview({...f,model:restored,documents:[...f.documents].reverse()});assert.equal(again.eligible,true,again.reason);assert.equal(again.preview.ready,0);assert.equal(again.preview.duplicates,2);assert.equal(JSON.stringify(again.preview.simulated),JSON.stringify(restored));
 undoCSV(f.model,csvUndoReceipt(before,f.model));assert.equal(JSON.stringify(f.model),before);
});
test('next-day variant excludes other dates, currencies, reference, source and amount conflicts',()=>{
 for(const options of [{fundingValueDate:'03.01.1999'},{fundingValueDate:'06.01.1999',fundingDate:'06.01.1999'},{fundingDate:'04.01.1999'},{fundingDate:'06.01.1999'},{tradeDate:'06.01.1999'},{funding:'21,74'}]){const f=valueDateFixture(options);assert.equal(preview(f).eligible,false,JSON.stringify(options));}
 for(const edit of [{7:'USD'},{9:'OTHER'},{4:'Kauf IE00SYNTH001 200'},{4:'Storno Kauf IE00SYNTH001 0009007199254740993'}]){const f=valueDateFixture();f.documents[1]=parseFlatexNativeCSV(nativeFlatexCSV('account',[{6:'-21,75'},{0:'05.01.1999',1:'05.01.1999',4:'Kauf IE00SYNTH001 0009007199254740993',5:'SYN-FUND',6:'21,75',...edit}]));assert.equal(preview(f).eligible,false);}
 const f=valueDateFixture();f.documents.push(parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:'05.01.1999',1:'05.01.1999',4:'Kauf IE00SYNTH001 0009007199254740993',5:'OTHER-FUND',6:'21,75'}])));assert.equal(inspectFlatexFundingGroups(f.documents).fundingGroups.length,0);
});
test('strict persisted version, chronology and original dates; existing V1 unchanged',()=>{
 const old=fundingFixture().inspection.fundingGroups[0];assert.equal(old.version,1);assert.equal(Object.hasOwn(old,'chronology'),false);validateFlatexFundingProof(old);
 const f=valueDateFixture();importCSV(f.model,preview(f).preview);
 for(const edit of [m=>{for(const b of m.bookings)b.netFunding.version=1;},m=>{for(const b of m.bookings)delete b.netFunding.chronology;},m=>{for(const b of m.bookings)b.netFunding.chronology='unrestricted';},m=>{for(const b of m.bookings)b.netFunding.valueDate=b.netFunding.settlement.valueDate;},m=>{for(const b of m.bookings)b.netFunding.settlement.valueDate=b.netFunding.valueDate;},m=>m.bookings.pop(),m=>m.externalCashFlows=[],m=>m.openingPositions.find(p=>p.positionId==='cash').quantityExact='0',m=>m.openingPositions.find(p=>p.positionId==='cash').asOf='1999-01-02']){const m=structuredClone(f.model);edit(m);assert.throws(()=>safeImport(m),edit.toString());}
});
test('next-day requires individual role, dated opening and existing reference/cost/history guards',()=>{
 for(const edit of [f=>f.options.fundingRoles={},f=>f.options.fundingRoles[f.options.selectedIds[0]].confirmed=false,f=>f.options.openingConfirmed=false,f=>f.options.openingDate='1999-01-02',f=>f.options.stale=true,f=>f.model.positions[0].costBasisEUR=10,f=>f.model.snapshots.push({date:'1999-01-03',byPosition:{cash:{quantity:100,quantityExact:'100'}}})]){const f=valueDateFixture();edit(f);const before=JSON.stringify(f.model);assert.equal(preview(f).eligible,false,edit.toString());assert.equal(JSON.stringify(f.model),before);}
});
test('next-day shared plan exposes separate original dates, reconfirms and uses existing Undo',()=>{
 const f=valueDateFixture(),before=JSON.stringify(f.model),sources={bitcoin:{receipts:[],operations:[]},kraken:[],bitpanda:[],flatex:f.files,files:f.files.map(f=>({name:f.name,kind:'flatex',rows:f.document.rows.length}))},choices={flatex:{confirmed:true,partialConfirmed:true,assignments:f.assignments,options:{...f.options,mode:'net-funding'}}};
 const p=previewSharedImport(f.model,sources,choices),text=p.reports[0].details.map(d=>d.text).join(' ');assert.match(text,/Valuta 1999-01-04/);assert.match(text,/Valuta 1999-01-05/);assert.equal(JSON.stringify(f.model),before);
 const changed=structuredClone(choices);changed.flatex.options.fundingRoles={};assert.throws(()=>confirmSharedImport(f.model,sources,changed,p,{confirmed:true,backupConfirmed:true}));
 const next=confirmSharedImport(f.model,sources,choices,p,{confirmed:true,backupConfirmed:true});assert.equal(next.bookings.length,2);undoCSV(next,csvUndoReceipt(before,next));assert.equal(JSON.stringify(next),before);
});
test('calendar boundary is exact and does not accept a two-day gap or invalid leap day',()=>{
 for(const [tradeValueDate,fundingDate,eligible]of [['28.02.2000','29.02.2000',true],['28.02.1999','01.03.1999',true],['31.12.1999','01.01.2000',true],['28.02.2000','01.03.2000',false],['28.02.1999','29.02.1999',false]]){const f=valueDateFixture({tradeValueDate,fundingDate,fundingValueDate:fundingDate});assert.equal(preview(f).eligible,eligible);}
});
test('mixed V1 and next-day append protects previous openings, bookings and journals; overlap only adds evidence',()=>{
 const f=fundingFixture();importCSV(f.model,prepareFlatexFundingPreview(f.model,f.documents,f.assignments,f.options).preview);const prior=structuredClone(f.model);
 const docs=[parseFlatexNativeCSV(nativeFlatexCSV('depot',[{1:'10.01.1999',2:'12.01.1999',5:'2',9:'10',7:'ORDER Kauf IE00SYNTH001 200',8:'SYN-NEXT-DEPOT'}])),parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:'10.01.1999',1:'12.01.1999',4:'ORDER Kauf IE00SYNTH001 200',5:'SYN-NEXT-SETTLE',6:'-21,75'},{0:'13.01.1999',1:'13.01.1999',4:'Kauf IE00SYNTH001 200',5:'SYN-NEXT-FUND',6:'21,75'}]))],offers=inspectFlatexFundingGroups(docs),id=offers.fundingGroups[0].settlement.id,options={...f.options,selectedIds:[id],fundingRoles:{[id]:{role:'external',confirmed:true}}};
 const p=prepareFlatexFundingPreview(f.model,docs,f.assignments,options);assert.equal(p.eligible,true,p.reason);importCSV(f.model,p.preview);assert.deepEqual(f.model.openingPositions,prior.openingPositions);assert.deepEqual(f.model.journalEntries.slice(0,prior.journalEntries.length),prior.journalEntries);for(const b of prior.bookings)assert.deepEqual(f.model.bookings.find(x=>x.id===b.id),b);
 const committed=structuredClone(f.model),extra=parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:'13.01.1999',1:'13.01.1999',4:'Kauf IE00SYNTH001 200',5:'SYN-NEXT-FUND',6:'21,75'}])),repeat=prepareFlatexFundingPreview(f.model,[...docs,extra],f.assignments,options);assert.equal(repeat.eligible,true,repeat.reason);assert.equal(repeat.preview.ready,0);assert.equal(repeat.preview.evidenceUpdates,1);importCSV(f.model,repeat.preview);assert.deepEqual(f.model.positions,committed.positions);assert.deepEqual(f.model.journalEntries,committed.journalEntries);assert.deepEqual(f.model.externalCashFlows,committed.externalCashFlows);safeImport(JSON.parse(backup(f.model)));
});
