import test from 'node:test';
import assert from 'node:assert/strict';
import {backup,safeImport} from '../src/model.js';
import {ledgerQuantityAudit,executeTransaction} from '../src/transactions.js';
import {previewBitpandaImport,confirmBitpandaImport,prepareBitpandaSourcePlan} from '../src/bitpanda-import.js';
import {source,fixture} from './bitpanda-import-fixture.mjs';
import {bitpandaCSV} from './bitpanda-fixture.mjs';
const confirm=(m,text,assignments,options)=>{const p=previewBitpandaImport(m,[text],assignments,options);assert.deepEqual(p.issues,[]);return confirmBitpandaImport(m,[text],assignments,{...options,confirmed:true,baseline:p.baseline});};
test('Bitpanda exact settled trade and net reward use journal; source market price never sets execution value',()=>{
 const text=source(),{m,assignments,options}=fixture(),before=JSON.stringify(m),p=previewBitpandaImport(m,[text],assignments,options);
 assert.equal(JSON.stringify(m),before);assert.deepEqual(p.issues,[]);assert.equal(p.ready,2);
 const next=confirm(m,text,assignments,options),buy=next.bookings.find(b=>b.type==='buy'),reward=next.bookings.find(b=>b.type==='reward');
 assert.deepEqual(next.positions.map(p=>p.quantityExact),['3.1','99']);assert.equal(buy.amountExactEUR,'100');assert.equal(buy.feeEUR,1);assert.equal(buy.taxEUR,null);
 assert.equal(reward.amountEUR,null);assert.equal(reward.feeEUR,null);assert.equal(reward.taxEUR,null);assert.equal(reward.costsVerified,false);assert.equal(next.positions[0].costBasisExact,null);
 assert.deepEqual(next.externalCashFlows,[]);assert.equal(ledgerQuantityAudit(next).ok,true);assert.equal(JSON.stringify(m),before);
 const restored=safeImport(JSON.parse(backup(next))),repeat=previewBitpandaImport(restored,[text,text],assignments,options);
 assert.deepEqual(repeat.issues,[]);assert.equal(repeat.ready,0);assert.equal(repeat.duplicates,2);assert.equal(JSON.stringify(repeat.simulated),JSON.stringify(restored));
});
test('Bitpanda unknown conventions, end balances, stale model and partial selection block whole batch',()=>{
 const text=source(),{m,assignments,options}=fixture(),before=JSON.stringify(m);
 for(const bad of [{...options,netConfirmed:false},{...options,openingConfirmed:false},{...options,feeModes:{}},{...options,expectedClosing:{}},{...options,expectedClosing:{bp0:'3.2',bp1:'99'}}]){
  assert.ok(previewBitpandaImport(m,[text],assignments,bad).issues.length);assert.throws(()=>confirmBitpandaImport(m,[text],assignments,{...bad,confirmed:true,baseline:before}),/Ungeklärte/);
 }
 assert.throws(()=>confirmBitpandaImport(m,[text],assignments,{...options,baseline:'stale',confirmed:true}),/erneut/);
 const selected=[prepareBitpandaSourcePlan([text]).groups[0].id],partial={...options,selectedGroups:selected,expectedClosing:{bp0:'3',bp1:'99'}};
 assert.throws(()=>confirmBitpandaImport(m,[text],assignments,{...partial,confirmed:true,baseline:before}),/Restvorgänge/);
 assert.equal(confirmBitpandaImport(m,[text],assignments,{...partial,partialConfirmed:true,confirmed:true,baseline:before}).bookings.length,1);assert.equal(JSON.stringify(m),before);
});
test('Bitpanda overlap/order keeps IDs; changed source, correction and orphan journal cannot resurrect',()=>{
 const text=source(),{m,assignments,options}=fixture(),next=confirm(m,text,assignments,options);
 const [preamble,owner,header,...rows]=text.split('\n'),reversed=[preamble,owner,header,...rows.reverse()].join('\n');assert.equal(previewBitpandaImport(next,[reversed],assignments,options).duplicates,2);
 assert.ok(previewBitpandaImport(next,[text.replace('99999','99998')],assignments,options).issues.length);
 const edited=structuredClone(next);edited.bookings[0].notes='Manual correction';assert.ok(previewBitpandaImport(edited,[text],assignments,options).issues.length);
 const orphan=structuredClone(next);orphan.bookings=[];assert.match(previewBitpandaImport(orphan,[text],assignments,options).issues[0].message,/Wiederbelebung/);
 const conflict=previewBitpandaImport(m,[text,text.replace('99999','99998')],assignments,options);assert.match(conflict.issues[0].message,/widersprüchliche/);
});
test('Bitpanda known additional and included fees differ exactly; nonzero tax is not inferred',()=>{
 const text=source(),{m,assignments,options}=fixture(),id=prepareBitpandaSourcePlan([text]).groups[0].id;
 const next=confirm(m,text,assignments,{...options,feeModes:{[id]:'additional'},expectedClosing:{bp0:'3.1',bp1:'98'}});assert.equal(next.positions[1].quantityExact,'98');assert.equal(next.bookings.find(b=>b.type==='buy').amountExactEUR,'101');
 assert.ok(previewBitpandaImport(m,[text.replace(',0\n',',2\n')],assignments,options).issues.length);
});
test('Bitpanda principal transfers stay blocked; foreign bookings and trusted basis stay protected',()=>{
 const text=source(),{m,assignments,options}=fixture();
 const protectedModel=structuredClone(m);protectedModel.positions[0].costBasisExact='1';assert.match(previewBitpandaImport(protectedModel,[text],assignments,options).issues[0].message,/Kostenbasis/);
 const foreign=structuredClone(m);executeTransaction(foreign,{type:'deposit',date:'1999-01-01',positionId:'bp1',quantity:'1'});assert.match(previewBitpandaImport(foreign,[text],assignments,options).issues[0].message,/manuelle/);
 const transfer=bitpandaCSV([{'Transaction Type':'transfer(stake)',omitTax:true,Fee:'-','Fee asset':'-'}]),f=fixture(transfer);assert.match(previewBitpandaImport(f.m,[transfer],f.assignments,f.options).issues[0].message,/Hauptbetrag/);
});
test('Bitpanda external withdrawal and reward fee never become extra external deposits',()=>{
 for(const mode of ['included','additional']){
  const text=bitpandaCSV([{'Transaction Type':'withdrawal','In/Out':'outgoing','Amount Asset':'1',Asset:'ETH',Fee:'0.01','Fee asset':'ETH','Product ID':'SYN-ETH'}]),f=fixture(text),id=prepareBitpandaSourcePlan([text]).groups[0].id;
  f.m.positions[0].quantityExact='2';f.m.positions[0].quantity=2;f.m.openingPositions[0].quantityExact='2';
  assert.match(previewBitpandaImport(f.m,[text],f.assignments,f.options).issues[0].message,/Gegenbereich/);
  const next=confirm(f.m,text,f.assignments,{...f.options,externalReferences:[id],feeModes:{[id]:mode},expectedClosing:{bp0:mode==='included'?'1':'0.99'}});
  assert.equal(next.bookings.filter(b=>b.type==='fee').length,1);assert.deepEqual(next.externalCashFlows,[]);assert.equal(ledgerQuantityAudit(next).ok,true);
 }
});
test('Bitpanda sale settles included EUR fee without treating market price as proceeds',()=>{
 const text=bitpandaCSV([{'Transaction Type':'sell','In/Out':'incoming','Amount Asset':'3','Amount Fiat':'99',Asset:'ETH',Fee:'1','Fee asset':'EUR','Product ID':'SYN-ETH'}]),f=fixture(text);
 f.m.positions[0].quantityExact='3';f.m.positions[0].quantity=3;f.m.openingPositions[0].quantityExact='3';
 const next=confirm(f.m,text,f.assignments,{...f.options,expectedClosing:{bp0:'0',bp1:'299'}});
 assert.equal(next.bookings[0].amountExactEUR,'100');assert.equal(next.bookings[0].feeEUR,1);assert.equal(next.positions[1].quantityExact,'299');assert.deepEqual(next.externalCashFlows,[]);
});
test('Bitpanda Fiat dialect with absent asset quantity uses explicit EUR amount; contradictions block',()=>{
 const text=bitpandaCSV([{'Transaction Type':'deposit','In/Out':'incoming','Amount Asset':'-','Amount Fiat':'10',Asset:'-',Fiat:'EUR','Asset class':'Fiat','Product ID':'-',Fee:'0','Fee asset':'-'}]),f=fixture(text),id=prepareBitpandaSourcePlan([text]).groups[0].id;
 const next=confirm(f.m,text,f.assignments,{...f.options,externalReferences:[id],expectedClosing:{bp0:'210'}});
 assert.equal(next.positions[0].quantityExact,'210');assert.equal(next.externalCashFlows[0].amountExactEUR,'10');
 const bad=text.replace(',-,-,50000',',9,EUR,50000');assert.ok(previewBitpandaImport(f.m,[bad],f.assignments,f.options).issues.length);
});
test('Bitpanda net reward plus separately identified asset fee is exact and unpriced',()=>{
 const text=bitpandaCSV([{'Transaction Type':'reward','In/Out':'incoming','Amount Asset':'1',Asset:'ETH',Fee:'0.01','Fee asset':'ETH','Product ID':'SYN-ETH',omitTax:true}]),f=fixture(text);
 const next=confirm(f.m,text,f.assignments,{...f.options,expectedClosing:{bp0:'1'}});
 assert.equal(next.bookings.find(b=>b.type==='reward').quantityExact,'1.01');assert.equal(next.bookings.find(b=>b.type==='fee').quantityExact,'0.01');assert.ok(next.bookings.every(b=>b.amountExactEUR===null));assert.equal(ledgerQuantityAudit(next).ok,true);
});

test('Bitpanda closing check rejects one atomic unit and unexplained cash instead of rounding',()=>{
 const text=source(),{m,assignments,options}=fixture();
 for(const expectedClosing of [{bp0:'3.100000000000000001',bp1:'99'},{bp0:'3.1',bp1:'99.000000000000000001'}]){
  const p=previewBitpandaImport(m,[text],assignments,{...options,expectedClosing});
  assert.ok(p.issues.some(i=>i.message.includes('Endbestand')));
  assert.throws(()=>confirmBitpandaImport(m,[text],assignments,{...options,expectedClosing,confirmed:true,baseline:p.baseline}),/Endbestände/);
 }
});
