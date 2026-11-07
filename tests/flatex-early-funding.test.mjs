import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fundingFixture} from './flatex-funding-fixture.mjs';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {inspectFlatexFundingGroups,prepareFlatexFundingPreview} from '../src/flatex-net-settlement.js';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
import {backup,safeImport} from '../src/model.js';
import {importCSV} from '../src/csv-import.js';
import {csvUndoReceipt,undoCSV} from '../src/csv-batch.js';
import {units} from '../src/decimal.js';
const oracle=JSON.parse(readFileSync(new URL('../docs/release-evidence/uh05-early-funding-oracle-2026-11-07.json',import.meta.url)));
const de=s=>s.replace('.',','),date=s=>s.split('-').reverse().join('.');
const preview=f=>prepareFlatexFundingPreview(f.model,f.documents,f.assignments,f.options);
function early(){const f=fundingFixture({cash:'0',fundingDate:'01.01.1999'});f.options.openingDate='1998-12-31';return f;}
for(const c of oracle.cases)for(const reverse of [false,true])test('independent earlier funding / '+c.name+' / reverse '+reverse,()=>{
 const f=fundingFixture({cash:c.opening,quantity:de(c.quantity),price:de(c.price),settlement:de(c.cash),funding:de(c.funding),fundingDate:date(c.fundingDate),reverse});f.options.openingDate=c.openingDate;
 const before=JSON.stringify(f.model),sources=JSON.stringify(f.documents),p=preview(f);assert.equal(p.eligible,c.eligible,p.reason);assert.equal(JSON.stringify(f.model),before);assert.equal(JSON.stringify(f.documents),sources);
 if(!c.eligible)return;
 importCSV(f.model,p.preview);const trade=f.model.bookings.find(b=>b.type==='buy'),credit=f.model.bookings.find(b=>b.type==='deposit');
 assert.equal(f.model.positions.find(p=>p.id==='cash').quantityExact,c.closing);assert.equal(trade.amountExactEUR,c.gross);assert.equal(trade.netSettlement.differenceExact,c.difference);assert.equal(trade.date,c.tradeDate);assert.equal(credit.date,c.fundingDate);assert.equal(trade.netSettlement.valueDate,c.valueDate);assert.equal(credit.netFunding.valueDate,c.valueDate);assert.equal(trade.feeEUR,null);assert.equal(trade.taxEUR,null);assert.equal(f.model.positions.find(p=>p.id==='etf').costBasisExact,null);assert.equal(f.model.externalCashFlows.length,1);assert.equal(f.model.externalCashFlows[0].id,credit.id);assert.equal(f.model.externalCashFlows[0].amountExactEUR,c.externalFlow);
 let balance=c.opening;const dec=units;
 // Compare each actual cash posting against the independently dated path.
 let actual=dec(balance);const path=f.model.journalEntries.filter(j=>j.postings.some(p=>p.role==='cash')).map(j=>{actual+=dec(j.postings.find(p=>p.role==='cash').quantityDeltaExact);return {date:j.date,balance:actual};});
 assert.deepEqual(path,c.path.map(p=>({date:p.date,balance:dec(p.balanceExact)})));
 const restored=safeImport(JSON.parse(backup(f.model))),again=preview({...f,model:restored,documents:[...f.documents].reverse()});assert.equal(again.eligible,true,again.reason);assert.equal(again.preview.ready,0);assert.equal(again.preview.duplicates,2);undoCSV(f.model,csvUndoReceipt(before,f.model));assert.equal(JSON.stringify(f.model),before);
});
test('earlier credit needs an opening strictly before its own cash date; selection order cannot bypass it',()=>{
 for(const openingDate of ['1999-01-01','1999-01-02']){const f=early();f.options.openingDate=openingDate;assert.equal(preview(f).eligible,false);}
 const f=early();f.options.fundingRoles={};assert.equal(preview(f).eligible,false);
 const g=early();g.documents.push(parseFlatexNativeCSV(nativeFlatexCSV('depot',[{1:'05.01.1999',2:'07.01.1999',5:'2',9:'10',7:'ORDER Kauf IE00SYNTH001 200',8:'SYN-LATE-DEPOT'}])),parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:'05.01.1999',1:'07.01.1999',4:'ORDER Kauf IE00SYNTH001 200',5:'SYN-LATE-SETTLE',6:'-21,75'},{0:'04.01.1999',1:'07.01.1999',4:'Kauf IE00SYNTH001 200',5:'SYN-LATE-FUND',6:'21,75'}])));
 const ids=inspectFlatexFundingGroups(g.documents).fundingGroups.map(f=>f.settlement.id);for(const selectedIds of [ids,[...ids].reverse()]){g.options={...g.options,selectedIds,fundingRoles:Object.fromEntries(ids.map(id=>[id,{role:'external',confirmed:true}])),openingDate:'1999-01-01'};assert.equal(preview(g).eligible,false);g.options.openingDate='1998-12-31';assert.equal(preview(g).eligible,true);}
});
test('restored cash opening cannot be moved onto or beyond the earlier credit',()=>{
 const f=early();importCSV(f.model,preview(f).preview);
 for(const asOf of ['1999-01-01','1999-01-02']){const m=structuredClone(f.model);m.openingPositions.find(p=>p.positionId==='cash').asOf=asOf;assert.throws(()=>safeImport(m));}
});
test('incremental earlier funding preserves existing journals/openings; cash overlap and reference observations block',()=>{
 const f=early();importCSV(f.model,preview(f).preview);const prior=structuredClone(f.model),docs=[parseFlatexNativeCSV(nativeFlatexCSV('depot',[{1:'05.01.1999',2:'07.01.1999',5:'2',9:'10',7:'ORDER Kauf IE00SYNTH001 200',8:'SYN-APPEND-DEPOT'}])),parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:'05.01.1999',1:'07.01.1999',4:'ORDER Kauf IE00SYNTH001 200',5:'SYN-APPEND-SETTLE',6:'-21,75'},{0:'03.01.1999',1:'07.01.1999',4:'Kauf IE00SYNTH001 200',5:'SYN-APPEND-FUND',6:'21,75'}]))],offers=inspectFlatexFundingGroups(docs),options={...f.options,selectedIds:offers.fundingGroups.map(f=>f.settlement.id),fundingRoles:Object.fromEntries(offers.fundingGroups.map(f=>[f.settlement.id,{role:'external',confirmed:true}]))};
 const p=prepareFlatexFundingPreview(f.model,docs,f.assignments,options);assert.equal(p.eligible,true,p.reason);const appended=structuredClone(f.model);importCSV(appended,p.preview);assert.deepEqual(appended.openingPositions,prior.openingPositions);assert.deepEqual(appended.journalEntries.slice(0,prior.journalEntries.length),prior.journalEntries);assert.deepEqual(prior.bookings.map(b=>appended.bookings.find(x=>x.id===b.id)),prior.bookings);assert.equal(appended.positions.find(p=>p.id==='cash').quantityExact,'0');
 const overlap=[docs[0],parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:'05.01.1999',1:'07.01.1999',4:'ORDER Kauf IE00SYNTH001 200',5:'SYN-APPEND-SETTLE',6:'-21,75'},{0:'02.01.1999',1:'07.01.1999',4:'Kauf IE00SYNTH001 200',5:'SYN-APPEND-FUND',6:'21,75'}]))];assert.equal(prepareFlatexFundingPreview(f.model,overlap,f.assignments,options).eligible,false);
 const referenced=structuredClone(f.model);referenced.snapshots.push({date:'1999-01-04',byPosition:{cash:{quantity:0,quantityExact:'0'}}});assert.equal(prepareFlatexFundingPreview(referenced,docs,f.assignments,options).eligible,false);assert.equal(JSON.stringify(f.model),JSON.stringify(prior));
});
test('earlier documentary credit still rejects wrong value date, payload/scope and withdrawn role',()=>{
 for(const edit of [{1:'03.01.1999'},{1:'05.01.1999'},{7:'USD'},{9:'OTHER'},{6:'21,74'},{0:'05.01.1999'}]){const f=early();f.documents[1]=parseFlatexNativeCSV(nativeFlatexCSV('account',[{6:'-21,75'},{0:'01.01.1999',4:'Kauf IE00SYNTH001 0009007199254740993',5:'SYN-FUND',6:'21,75',...edit}]));assert.equal(preview(f).eligible,false,JSON.stringify(edit));}
});
