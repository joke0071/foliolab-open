import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,nativeBatchDocuments} from './flatex-net-fixture.mjs';
import {contextFixture} from './flatex-context-fixture.mjs';
import {fixture as bpFixture,source} from './bitpanda-import-fixture.mjs';
import {previewBitpandaImport,confirmBitpandaImport} from '../src/bitpanda-import.js';
import {prepareNativeFlatexPreview} from '../src/flatex-backfill.js';
import {prepareFlatexNetPreview,inspectFlatexNetPairs,withdrawFlatexNetGroups} from '../src/flatex-net-settlement.js';
import {importCSV} from '../src/csv-import.js';
import {snapshot,backup,safeImport} from '../src/model.js';
import {executeTransaction,captureOpenings,ledgerQuantityAudit} from '../src/transactions.js';
function setup(make=fixture){const f=make();for(const [id,q]of [['etf','2'],['cash','78.25']])Object.assign(f.model.positions.find(p=>p.id===id),{quantityExact:q,quantity:Number(q)});f.options={...f.options,mode:'net-backfill',openingQuantities:{etf:'0',cash:'100'},expectedClosing:{etf:'2',cash:'78.25'},closingConfirmed:true};return f;}
const preview=f=>prepareNativeFlatexPreview(f.model,f.documents,f.assignments,f.options);
for(const [name,make]of [['Depot12/Konto10',fixture],['Depot13/Konto8',contextFixture]])test(name+': provider order independent with actual snapshot calls and protected balances',()=>{
 const states=[];
 for(const reverse of [false,true]){
  const f=setup(make),bp=bpFixture();for(const k of ['providers','accounts','positions','openingPositions'])f.model[k].push(...structuredClone(bp.m[k]));
  const panda=()=>{const p=previewBitpandaImport(f.model,[source()],bp.assignments,bp.options);assert.deepEqual(p.issues,[]);f.model=confirmBitpandaImport(f.model,[source()],bp.assignments,{...bp.options,baseline:p.baseline,confirmed:true});snapshot(f.model);};
  if(reverse)panda();else snapshot(f.model);
  const before=structuredClone(f.model),p=preview(f);assert.equal(p.eligible,true,p.reason);assert.equal(JSON.stringify(f.model),JSON.stringify(before));assert.equal(p.preview.ready,1);importCSV(f.model,p.preview);
  assert.deepEqual(f.model.positions,before.positions);assert.equal(JSON.stringify(f.model.snapshots),JSON.stringify(before.snapshots));assert.equal(ledgerQuantityAudit(f.model).ok,true);snapshot(f.model);if(!reverse)panda();
  const restored=safeImport(JSON.parse(backup(f.model))),again=prepareNativeFlatexPreview(restored,f.documents,f.assignments,{mode:'net-backfill',selectedIds:f.options.selectedIds});assert.equal(again.eligible,true,again.reason);assert.equal(again.preview.ready,0);assert.equal(again.preview.duplicates,1);
  assert.equal(restored.positions.find(p=>p.id==='etf').quantityExact,'2');assert.equal(restored.positions.find(p=>p.id==='cash').quantityExact,'78.25');assert.equal(restored.positions.find(p=>p.symbol==='ETH').quantityExact,'3.1');
  const net=restored.bookings.find(b=>b.netSettlement);assert.equal(net.feeEUR,null);assert.equal(net.taxEUR,null);assert.equal(net.costsVerified,false);assert.equal(restored.externalCashFlows.length,0);
  const removed=withdrawFlatexNetGroups(restored,f.options.selectedIds);assert.equal(removed.positions.find(p=>p.id==='etf').quantityExact,'0');assert.equal(removed.positions.find(p=>p.id==='cash').quantityExact,'100');assert.deepEqual(removed.bookings.filter(b=>!b.netSettlement),restored.bookings.filter(b=>!b.netSettlement));assert.equal(preview({...f,model:safeImport(JSON.parse(backup(removed)))}).eligible,false);
  states.push({positions:restored.positions.map(p=>[p.id,p.quantityExact,p.costBasisExact,p.realizedPnLExact]).sort(),postings:restored.journalEntries.map(j=>[j.date,j.postings.map(p=>[p.role,p.positionId,p.quantityDeltaExact,p.amountBookEURExact])]).sort(),openings:restored.openingPositions.map(o=>[o.positionId,o.quantityExact,o.asOf]).sort()});
 }
 assert.deepEqual(states[0],states[1]);
});
test('boundary failures are pure; ordinary net guards unchanged',()=>{
 const mutations=[f=>f.options.openingConfirmed=false,f=>f.options.closingConfirmed=false,f=>f.options.openingDate='1999-01-02',f=>f.options.openingQuantities.cash='99',f=>delete f.options.openingQuantities.cash,f=>f.options.expectedClosing.etf='3',f=>f.options.openingQuantities.etf='',f=>f.options.openingQuantities.etf='-1',f=>f.options.openingQuantities.other='0',f=>f.model.positions[0].costBasisEUR=1,f=>f.model.positions[0].wallet={enabled:true},f=>{captureOpenings(f.model);f.model.openingPositions[0].asOf='1999-01-01';},f=>{captureOpenings(f.model);f.model.openingPositions[0].quantityExact='3';},f=>f.model.snapshots.push({date:'1999-01-02',source:'current',byPosition:{etf:'20'}}),f=>f.model.snapshots.push({date:'2000-01-01',source:'manual',byPosition:null}),f=>f.model.snapshots.push({date:'2000-01-01',byPosition:{cash:'78.25'}}),f=>executeTransaction(f.model,{date:'2000-01-01',type:'deposit',positionId:'cash',quantity:1}),f=>f.assignments[Object.keys(f.assignments)[0]].confirmed=false];
 for(const mutate of mutations){const f=setup();mutate(f);const before=JSON.stringify(f.model),p=preview(f);assert.equal(p.eligible,false,mutate.toString());assert.equal(JSON.stringify(f.model),before);}
 const f=setup();captureOpenings(f.model);snapshot(f.model);assert.equal(prepareFlatexNetPreview(f.model,f.documents,f.assignments,f.options).eligible,false);const p=preview(f);assert.equal(p.eligible,true,p.reason);f.model.settings.showSmall=!f.model.settings.showSmall;assert.throws(()=>importCSV(f.model,p.preview),/verändert/);
});
test('whole buy/sell history uses explicit openings and preserves cash/shares',()=>{
 const f=setup();f.documents=nativeBatchDocuments();f.options.selectedIds=inspectFlatexNetPairs(f.documents).pairs.map(p=>p.id);f.options.expectedClosing={etf:'1',cash:'90'};Object.assign(f.model.positions[0],{quantity:1,quantityExact:'1'});Object.assign(f.model.positions[1],{quantity:90,quantityExact:'90'});snapshot(f.model);
 const p=preview(f);assert.equal(p.eligible,true,p.reason);assert.equal(p.preview.ready,2);importCSV(f.model,p.preview);assert.equal(f.model.positions[0].quantityExact,'1');assert.equal(f.model.positions[1].quantityExact,'90');assert.equal(f.model.openingPositions.find(o=>o.positionId==='cash').quantityExact,'100');
});
