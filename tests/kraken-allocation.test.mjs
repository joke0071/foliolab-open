import test from 'node:test';import assert from 'node:assert/strict';
import {allocationFixture,allocationOracle,allocationSource} from './kraken-allocation-fixture.mjs';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
import {previewKrakenImport,confirmKrakenImport,previewKrakenWithdrawal,confirmKrakenWithdrawal} from '../src/kraken-import.js';
import {readSharedImportFiles,previewSharedImport,confirmSharedImport} from '../src/shared-import.js';
import {backup,safeImport} from '../src/model.js';import {ledgerQuantityAudit} from '../src/transactions.js';import {csvUndoReceipt,undoCSV} from '../src/csv-batch.js';
const options={openingConfirmed:true};
const quantities=m=>m.positions.map(p=>p.quantityExact);
test('native reference owns complete exact per-asset Spot/Earn principal pairs; both orders, replay, restore, atomic shared Undo',()=>{
 for(const reverse of [false,true]){
  const f=allocationFixture(),text=reverse?allocationSource([...allocationOracle.rows].reverse()):f.text,before=JSON.stringify(f.m),source=prepareKrakenSourcePlan([text,text]);
  assert.equal(source.repeated,4);assert.equal(source.groups[0].kind,'internal-transfer-batch');assert.deepEqual(source.groups[0].issues,[]);
  const sources=readSharedImportFiles([{name:'SYN.csv',text},{name:'SYN overlap.csv',text}]),p=previewSharedImport(f.m,sources,f.choices);
  assert.equal(JSON.stringify(f.m),before);const next=confirmSharedImport(f.m,sources,f.choices,p,{confirmed:true,backupConfirmed:true});
  assert.deepEqual(quantities(next),allocationOracle.expected.map(r=>r.after));assert.equal(next.bookings.length,allocationOracle.bookings);assert.equal(next.journalEntries.flatMap(j=>j.postings).length,allocationOracle.postings);assert.ok(next.bookings.every(b=>b.type==='transfer'&&b.taxEUR===null&&!b.external));assert.deepEqual(next.externalCashFlows,[]);assert.equal(ledgerQuantityAudit(next).ok,true);
  assert.deepEqual(next.openingPositions,f.m.openingPositions);assert.ok(next.positions.every(p=>p.costBasisExact==null));
  const restored=safeImport(JSON.parse(backup(next))),replay=previewSharedImport(restored,sources,f.choices);assert.equal(replay.changed,false);assert.deepEqual(quantities(restored),quantities(next));
  undoCSV(next,csvUndoReceipt(before,next));assert.equal(JSON.stringify(next),before);
 }
});
test('reverse allocation and EUR principal retain exact same-asset transfer, no income',()=>{
 const rows=allocationOracle.rows.map(r=>({...r,wallet:r.wallet==='spot / main'?'earn / liquid':'spot / main',...(r.asset==='BTC'?{asset:'EUR',subclass:'fiat'}:{})})),f=allocationFixture(rows),p=previewKrakenImport(f.m,[f.text],f.assignments,options);
 assert.deepEqual(p.issues,[]);assert.deepEqual(p.simulated.bookings.map(b=>b.type),['transfer','transfer']);assert.deepEqual(p.simulated.externalCashFlows,[]);assert.equal(ledgerQuantityAudit(p.simulated).ok,true);
});
test('mismatched members, references, time, wallet, fees, subclasses, foreign fiat and mixed direction remain blocked without writes',()=>{
 const mutations=[r=>r.pop(),r=>r.push({...r[0],txid:'SYN-EXTRA'}),r=>{r[1].refid='SYN-OTHER';},r=>{r[1].time='1999-02-03 11:12:14';},r=>{r[1].amount='0.125000000000000002';},r=>{r[1].wallet='earn / unproven';},r=>{r[1].fee='0.000000000000000001';r[1].feecurrency='BTC';},r=>{r[1].subclass='stable_coin';},r=>{for(const x of r.filter(x=>x.asset==='BTC')){x.asset='USD';x.subclass='fiat';}},r=>{for(const x of r.filter(x=>x.asset==='ETH'))x.wallet=x.wallet==='spot / main'?'earn / liquid':'spot / main';},r=>{r[1].type='trade';r[1].subtype='tradespot';},r=>{r[1].txid=r[0].txid;}];
 for(const mutate of mutations){const rows=structuredClone(allocationOracle.rows);mutate(rows);const f=allocationFixture(rows),before=JSON.stringify(f.m),p=previewKrakenImport(f.m,[f.text],f.assignments,options);assert.ok(p.issues.length);assert.throws(()=>confirmKrakenImport(f.m,[f.text],f.assignments,{...options,baseline:p.baseline,confirmed:true}));assert.equal(JSON.stringify(f.m),before);}
});
test('source bindings, openings, known costs, references, consent and prior journals remain protected',()=>{
 const f=allocationFixture(),before=JSON.stringify(f.m);
 assert.ok(previewKrakenImport(f.m,[f.text],f.assignments).issues.length);
 assert.ok(previewKrakenImport(f.m,[f.text],f.assignments,{...options,externalReferences:[f.group]}).issues.length);
 for(const mutate of [m=>{m.positions[0].costBasisExact='1';m.positions[0].costBasisEUR=1;},m=>{m.openingPositions[0].costBasisExact='1';},m=>{m.openingPositions[0].asOf='2000-01-01';},m=>{m.positions[0].quantityExact='0.500000000000000001';m.positions[0].quantity=0.5;m.openingPositions[0].quantityExact='0.500000000000000001';},m=>{m.positions[1].accountId=m.positions[0].accountId;},m=>{m.positions[1].providerId='other';}]){const m=structuredClone(f.m);mutate(m);const raw=JSON.stringify(m);let denied=false;try{denied=previewKrakenImport(m,[f.text],f.assignments,options).issues.length>0;}catch{denied=true;}assert.ok(denied);assert.equal(JSON.stringify(m),raw);}
 const a={...f.assignments};a[Object.keys(a)[1]]=a[Object.keys(a)[0]];assert.throws(()=>previewKrakenImport(f.m,[f.text],a,options),/Assetbereiche/);
 const p=previewKrakenImport(f.m,[f.text],f.assignments,options);assert.throws(()=>confirmKrakenImport(f.m,[f.text],f.assignments,{...options,baseline:'stale',confirmed:true}));assert.throws(()=>confirmKrakenImport(f.m,[f.text],f.assignments,{...options,baseline:p.baseline}));assert.equal(JSON.stringify(f.m),before);
});
test('whole terminal allocation group withdrawal preserves original proof and blocks partial reimport',()=>{
 const f=allocationFixture(),p=previewKrakenImport(f.m,[f.text],f.assignments,options),next=confirmKrakenImport(f.m,[f.text],f.assignments,{...options,confirmed:true,baseline:p.baseline}),o={...options,selectedGroups:[f.group]},inverse=previewKrakenWithdrawal(next,[f.text],f.assignments,o),end=confirmKrakenWithdrawal(next,[f.text],f.assignments,{...o,baseline:inverse.baseline,confirmed:true,at:'1999-02-04T12:00:00Z'});
 assert.deepEqual(quantities(end),allocationOracle.expected.map(r=>r.before));assert.deepEqual(end.externalCashFlows,[]);assert.equal(end.bookings.length,0);assert.equal(end.journalEntries[0].krakenWithdrawal.count,2);assert.equal(ledgerQuantityAudit(end).ok,true);const restored=safeImport(JSON.parse(backup(end)));assert.ok(previewKrakenImport(restored,[f.text],f.assignments,options).issues.length);
 const edited=structuredClone(next);edited.bookings.pop();assert.ok(previewKrakenImport(edited,[f.text],f.assignments,options).issues.length);const changed=allocationSource(allocationOracle.rows.map((r,i)=>i? r:{...r,balance:'0.374999999999999998'}));assert.ok(previewKrakenImport(next,[changed],f.assignments,options).issues.length);
});
