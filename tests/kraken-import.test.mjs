import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {captureOpenings,ledgerQuantityAudit,executeTransaction} from '../src/transactions.js';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
import {previewKrakenImport,confirmKrakenImport} from '../src/kraken-import.js';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
import {source,fixture} from './kraken-import-fixture.mjs';
const confirm=(m,text,assignments,options={openingConfirmed:true})=>{const plan=previewKrakenImport(m,[text],assignments,options);assert.deepEqual(plan.issues,[]);return confirmKrakenImport(m,[text],assignments,{...options,confirmed:true,baseline:plan.baseline});};
test('authoritative EUR execution value survives a non-terminating display price division',()=>{
 const {m}=fixture();const crypto=m.positions.find(p=>p.symbol==='ETH'),cash=m.positions.find(p=>p.kind==='cash');
 const b=executeTransaction(m,{type:'buy',date:'1999-01-02',positionId:crypto.id,cashPositionId:cash.id,quantity:'3',unitPrice:'33.333333333333333333',tradeAmountEURExact:'100'});
 assert.equal(b.amountExactEUR,'100');assert.equal(m.positions.find(p=>p.id===cash.id).quantityExact,'100');assert.equal(ledgerQuantityAudit(m).ok,true);
 assert.throws(()=>executeTransaction(m,{type:'reward',date:'1999-01-03',positionId:crypto.id,quantity:'1',tradeAmountEURExact:'1'}),/EUR-Kauf/);
});
test('complete three-leg economic group updates cash, bought asset and distinct crypto fee exactly once',()=>{
 const text=source(),{m,assignments}=fixture(),before=JSON.stringify(m),p=previewKrakenImport(m,[text],assignments,{openingConfirmed:true});
 assert.equal(JSON.stringify(m),before);assert.deepEqual(p.issues,[]);assert.equal(p.ready,1);assert.equal(p.simulated.bookings.length,2);
 const next=confirm(m,text,assignments);assert.equal(JSON.stringify(m),before);
 assert.deepEqual(next.positions.map(p=>p.quantityExact),['100','3','0.00000083']);
 assert.equal(next.bookings.find(b=>b.type==='buy').amountExactEUR,'100');assert.equal(next.bookings.find(b=>b.type==='buy').taxEUR,null);
 assert.equal(next.bookings.find(b=>b.notes.startsWith('Kraken-Gebühr')).quantityExact,'0.00000017');
 assert.deepEqual(next.externalCashFlows,[]);assert.equal(next.positions.find(p=>p.symbol==='ETH').costBasisExact,null);assert.equal(ledgerQuantityAudit(next).ok,true);
 const restored=safeImport(JSON.parse(backup(next))),again=previewKrakenImport(restored,[text,text],assignments);
 assert.deepEqual(again.issues,[]);assert.equal(again.ready,0);assert.equal(again.duplicates,1);assert.deepEqual(again.simulated.positions,restored.positions);
 assert.equal(confirmKrakenImport(restored,[text],assignments,{confirmed:true,baseline:again.baseline}),restored);
});
test('all selected groups are atomic; quota/CAS caller receives only a validated detached draft',()=>{
 const text=source(),{m,assignments}=fixture(),before=JSON.stringify(m);
 const edited=structuredClone(m);edited.positions[0].quantityExact='201';edited.positions[0].quantity=201;edited.openingPositions[0].quantityExact='201';
 const p=previewKrakenImport(edited,[text],assignments,{openingConfirmed:true});assert.match(p.issues[0].message,/Quellsaldo/);
 assert.throws(()=>confirmKrakenImport(edited,[text],assignments,{confirmed:true,baseline:JSON.stringify(edited),openingConfirmed:true}),/Ungeklärte/);
 assert.throws(()=>confirmKrakenImport(m,[text],assignments,{confirmed:true,baseline:'stale'}),/erneut/);assert.equal(JSON.stringify(m),before);
});
test('changed source ID payload, manual correction, incomplete group and remapping never silently duplicate',()=>{
 const text=source(),{m,assignments}=fixture(),next=confirm(m,text,assignments),before=JSON.stringify(next);
 const changed=previewKrakenImport(next,[text.replace('0.00000017','0.00000018')],assignments);assert.ok(changed.issues.length);
 const edited=structuredClone(next);edited.bookings[0].notes='User correction';assert.match(previewKrakenImport(edited,[text],assignments,{openingConfirmed:true}).issues[0].message,/geändert/);
 const partial=structuredClone(next);partial.bookings.pop();assert.ok(previewKrakenImport(partial,[text],assignments).issues.length);
 assert.equal(JSON.stringify(next),before);
});
test('external transfers require explicit counterpart classification; selection never authorizes silent partial commit',()=>{
 const text=krakenCSV([{type:'deposit',subtype:'',asset:'EUR',subclass:'fiat',amount:'100',fee:'0',balance:'100',feecurrency:'EUR'}]),{m,assignments}=fixture(text),id=prepareKrakenSourcePlan([text]).groups[0].id;
 assert.match(previewKrakenImport(m,[text],assignments,{openingConfirmed:true}).issues[0].message,/Gegenbereich/);
 const next=confirm(m,text,assignments,{externalReferences:[id],openingConfirmed:true});assert.equal(next.externalCashFlows[0].amountExactEUR,'100');
 const empty=previewKrakenImport(m,[text],assignments,{selectedGroups:[]});assert.equal(empty.excluded,1);
 assert.throws(()=>confirmKrakenImport(m,[text],assignments,{selectedGroups:[],confirmed:true,baseline:empty.baseline}),/Restgruppen/);
 assert.throws(()=>previewKrakenImport(m,[text],assignments,{selectedGroups:['unknown']}),/veraltet/);
});
test('staking principal is an internal transfer, reward a separate event and fee a separate debit',()=>{
 const text=krakenCSV([{type:'earn',subtype:'autoallocation',wallet:'spot',asset:'ETH',amount:'-2',fee:'0',balance:'1',feecurrency:'ETH'},{type:'earn',subtype:'autoallocation',wallet:'earn',asset:'ETH',amount:'2',fee:'0',balance:'2',feecurrency:'ETH'}]),{m,assignments}=fixture(text);
 const next=confirm(m,text,assignments);assert.equal(next.bookings[0].type,'transfer');assert.deepEqual(next.positions.map(p=>p.quantityExact),['1','2']);assert.deepEqual(next.externalCashFlows,[]);
 const reward=krakenCSV([{type:'earn',subtype:'reward',asset:'ETH',amount:'0.1',fee:'0.01',balance:'1.09',feecurrency:'ETH'}]),f=fixture(reward),r=confirm(f.m,reward,f.assignments);
 assert.equal(r.positions[0].quantityExact,'1.09');assert.deepEqual(r.bookings.map(b=>b.type),['fee','reward']);assert.deepEqual(r.externalCashFlows,[]);
});

test('trusted cost basis remains protected and reordered source rows do not change import identity',()=>{
 const text=source(),{m,assignments}=fixture(),protectedModel=structuredClone(m);protectedModel.positions[1].costBasisEUR=50;protectedModel.positions[1].costBasisExact='50';
 const before=JSON.stringify(protectedModel);assert.match(previewKrakenImport(protectedModel,[text],assignments,{openingConfirmed:true}).issues[0].message,/Kostenbasis/);assert.equal(JSON.stringify(protectedModel),before);
 const next=confirm(m,text,assignments),[header,...rows]=text.split('\n'),repeat=previewKrakenImport(next,[[header,...rows.reverse()].join('\n')],assignments);
 assert.deepEqual(repeat.issues,[]);assert.equal(repeat.duplicates,1);
});
