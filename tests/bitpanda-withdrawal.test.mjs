import test from 'node:test';
import assert from 'node:assert/strict';
import {backup,safeImport} from '../src/model.js';
import {ledgerQuantityAudit,executeTransaction} from '../src/transactions.js';
import {sourceDigest} from '../src/import-identity.js';
import {source,fixture} from './bitpanda-import-fixture.mjs';
import {bitpandaCSV} from './bitpanda-fixture.mjs';
import {prepareBitpandaSourcePlan,previewBitpandaImport,confirmBitpandaImport,previewBitpandaWithdrawal,confirmBitpandaWithdrawal} from '../src/bitpanda-import.js';
const imported=(text=source())=>{const f=fixture(text),p=previewBitpandaImport(f.m,[text],f.assignments,f.options);assert.deepEqual(p.issues,[]);return {...f,text,next:confirmBitpandaImport(f.m,[text],f.assignments,{...f.options,baseline:p.baseline,confirmed:true})};};
const rewardOptions=f=>({...f.options,selectedGroups:[prepareBitpandaSourcePlan([f.text]).groups[1].id],controlsConfirmed:true,expectedClosing:{bp0:'3.1'},expectedRestored:{bp0:'3'},partialConfirmed:true});
const remove=(f,options=rewardOptions(f))=>confirmBitpandaWithdrawal(f.next,[f.text],f.assignments,{...options,baseline:JSON.stringify(f.next),confirmed:true});
test('Bitpanda terminal original reward rollback is exact, pure and persistent through restore/reimport',()=>{
 const f=imported(),before=JSON.stringify(f.next),p=previewBitpandaWithdrawal(f.next,[f.text],f.assignments,rewardOptions(f));
 assert.equal(JSON.stringify(f.next),before);assert.deepEqual(p.changes,[{positionId:'bp0',before:'3.1',after:'3',delta:'-0.1'}]);
 const next=remove(f);assert.equal(next.version,5);assert.deepEqual(next.positions.map(p=>p.quantityExact),['3','99']);assert.equal(next.bookings.length,1);assert.equal(ledgerQuantityAudit(next).ok,true);
 const proof=next.journalEntries.find(j=>j.type==='bitpanda-undo');assert.equal(proof.bitpandaWithdrawal.originals[0].booking.type,'reward');assert.equal(proof.postings[0].quantityDeltaExact,null);
 const restored=safeImport(JSON.parse(backup(next))),repeat=previewBitpandaImport(restored,[f.text,f.text],f.assignments,f.options);assert.equal(repeat.ready,0);assert.equal(repeat.duplicates,1);assert.match(repeat.issues[0].message,/dauerhaft zurückgenommen/);assert.equal(JSON.stringify(f.next),before);
});
test('Bitpanda earlier trade stays protected while a later reward exists; terminal trade then restores both legs',()=>{
 const f=imported(),buyId=prepareBitpandaSourcePlan([f.text]).groups[0].id,opts={...f.options,selectedGroups:[buyId],controlsConfirmed:true,expectedClosing:{bp0:'3.1',bp1:'99'},expectedRestored:{bp0:'0.1',bp1:'200'}};
 assert.throws(()=>previewBitpandaWithdrawal(f.next,[f.text],f.assignments,opts),/Spätere/);
 f.next=remove(f);const next=remove(f,{...opts,expectedClosing:{bp0:'3',bp1:'99'},expectedRestored:{bp0:'0',bp1:'200'},partialConfirmed:true});
 assert.deepEqual(next.positions.map(p=>p.quantityExact),['0','200']);assert.equal(next.bookings.length,0);assert.equal(next.journalEntries.filter(j=>j.type==='bitpanda-undo').length,2);assert.equal(ledgerQuantityAudit(next).ok,true);assert.equal(safeImport(JSON.parse(backup(next))).version,5);
});
test('Both independent control balances and current approval are mandatory down to one atomic unit',()=>{
 const f=imported(),good=rewardOptions(f),baseline=JSON.stringify(f.next);
 for(const bad of [{controlsConfirmed:false},{expectedClosing:{}},{expectedRestored:{}},{expectedClosing:{bp0:'3.100000000000000001'}},{expectedRestored:{bp0:'3.000000000000000001'}}])assert.throws(()=>remove(f,{...good,...bad}));
 assert.throws(()=>confirmBitpandaWithdrawal(f.next,[f.text],f.assignments,{...good,baseline:'old',confirmed:true}),/erneut/);
 assert.throws(()=>confirmBitpandaWithdrawal(f.next,[f.text],f.assignments,{...good,baseline}),/erneut/);
 assert.throws(()=>remove(f,{...good,partialConfirmed:false}),/Restvorgänge/);assert.equal(JSON.stringify(f.next),baseline);
});
test('Changed originals, source bindings, booking ownership and foreign dependencies do not permit rollback',()=>{
 const f=imported(),opts=rewardOptions(f);
 assert.throws(()=>previewBitpandaWithdrawal(f.next,[f.text.replace('22','23')],f.assignments,opts),/Original/);
 for(const change of [m=>m.bookings[0].notes='edited',m=>m.bookings[0].transferMatch={id:'foreign'},m=>m.positions[0].costBasisExact='1',m=>m.openingPositions[0].asOf='2000-01-01',m=>m.snapshots.push({id:'foreign',note:m.bookings[0].id})]){
  const copy=structuredClone(f.next);change(copy);assert.throws(()=>previewBitpandaWithdrawal(copy,[f.text],f.assignments,opts));
 }
 const foreign=structuredClone(f.next);executeTransaction(foreign,{type:'reward',date:'2000-01-01',positionId:'bp0',quantity:'1'});assert.throws(()=>previewBitpandaWithdrawal(foreign,[f.text],f.assignments,opts),/Spätere|fremde/);
});
test('External fiat flows and separate crypto fee legs are reversed once with originals retained',()=>{
 for(const cash of [false,true]){
  const text=bitpandaCSV([cash?{'Transaction Type':'deposit','In/Out':'incoming','Amount Asset':'-','Amount Fiat':'10',Asset:'-',Fiat:'EUR','Asset class':'Fiat','Product ID':'-',Fee:'0','Fee asset':'-'}:{'Transaction Type':'reward','In/Out':'incoming','Amount Asset':'1',Asset:'ETH',Fee:'0.01','Fee asset':'ETH','Product ID':'SYN-ETH',omitTax:true}]);
  const f=fixture(text),id=prepareBitpandaSourcePlan([text]).groups[0].id,options={...f.options,externalReferences:cash?[id]:[],expectedClosing:{bp0:cash?'210':'1'}},p=previewBitpandaImport(f.m,[text],f.assignments,options);assert.deepEqual(p.issues,[]);
  const next=confirmBitpandaImport(f.m,[text],f.assignments,{...options,baseline:p.baseline,confirmed:true});
  const result=confirmBitpandaImport(next,[text],f.assignments,{...options,operation:'withdraw',selectedGroups:[id],controlsConfirmed:true,expectedRestored:{bp0:cash?'200':'0'},baseline:JSON.stringify(next),confirmed:true});
  assert.equal(result.positions[0].quantityExact,cash?'200':'0');assert.equal(result.externalCashFlows.length,0);assert.equal(result.bookings.length,0);assert.equal(result.journalEntries[0].bitpandaWithdrawal.originals.length,cash?1:2);assert.equal(ledgerQuantityAudit(result).ok,true);safeImport(JSON.parse(backup(result)));
 }
});
test('Retained evidence rejects missing proof, recomputed inconsistent controls, resurrection and legacy version downgrade',()=>{
 const f=imported(),next=remove(f),proof=next.journalEntries.find(j=>j.type==='bitpanda-undo');
 for(const change of [m=>delete m.journalEntries.find(j=>j.type==='bitpanda-undo').bitpandaWithdrawal,m=>m.version=3,m=>m.bookings.push(proof.bitpandaWithdrawal.originals[0].booking),m=>{const e=m.journalEntries.find(j=>j.type==='bitpanda-undo').bitpandaWithdrawal;e.checks[0].after='4';e.digest=sourceDigest(JSON.stringify([e.originals,e.checks]));},m=>{const j=m.journalEntries.find(j=>j.type==='bitpanda-undo');j.postings[0].quantityDeltaExact='1';}]){
  const copy=structuredClone(next);change(copy);assert.throws(()=>safeImport(JSON.parse(JSON.stringify(copy))));
 }
});
