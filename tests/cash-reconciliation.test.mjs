import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {executeTransaction,captureOpenings} from '../src/transactions.js';
import {compareCurrentCashBalance} from '../src/cash-reconciliation.js';

function fixture(){
 const model=blankModel(),provider=createProvider({name:'Testbank',type:'bank'});model.providers.push(provider);
 for(const [id,currency,quantity] of [['first','EUR','100'],['second','EUR','250'],['usd','USD','20.1']]){
  const account=createAccount({id,providerId:provider.id,name:id,type:'savings',currency},model);model.accounts.push(account);
  model.positions.push(createPosition({id:id+'-cash',providerId:provider.id,accountId:id,name:id,kind:'cash',quantity,price:1,currency,fxRate:0.9},model));
 }
 return model;
}
const compare=(model,referenceAmount,positionId='first-cash',currency='EUR')=>compareCurrentCashBalance(model,{positionId,referenceAmount,currency});
test('explicit account scope, exact signed difference and zero reference; no mutation',()=>{
 const m=fixture(),before=JSON.stringify(m);
 assert.equal(compare(m,'100').status,'matched');
 assert.equal(compare(m,'100').basis,'recorded-only');
 assert.equal(compare(m,'0').differenceExact,'-100');
 assert.equal(compare(m,'-2,5').differenceExact,'-102.5');
 assert.equal(compare(m,'250','second-cash').differenceExact,'0');
 assert.equal(compare(m,'100.000000000000000001').differenceExact,'0.000000000000000001');
 assert.equal(JSON.stringify(m),before);
});
test('foreign currency uses nominal units without inventing an EUR valuation',()=>{
 const m=fixture();m.positions[2].fxRate=null;m.positions[2].fxRateExact=null;
 const result=compare(m,'21.1','usd-cash','USD');
 assert.equal(result.differenceExact,'1');assert.equal(result.currency,'USD');
 assert.equal(Object.hasOwn(result,'amountEUR'),false);
 assert.throws(()=>compare(m,'21.1','usd-cash','EUR'),/währung/);
});
test('existing journal validates opening plus movements without making bank completeness claims',()=>{
 const m=fixture();executeTransaction(m,{type:'deposit',positionId:'first-cash',date:'2026-10-25',quantity:'5',unitPrice:'1'});
 const before=backup(m),result=compare(m,'106');
 assert.equal(result.recordedExact,'105');assert.equal(result.differenceExact,'1');
 assert.equal(result.basis,'opening-and-journal');assert.equal(backup(m),before);
 const restored=safeImport(JSON.parse(before));assert.deepEqual(compare(restored,'106'),result);
 m.positions[0].quantityExact='106';m.positions[0].quantity=106;
 assert.throws(()=>compare(m,'106'),/widersprechen/);
});
test('missing opening or invalid journal fails closed, no guessed reconstruction',()=>{
 const m=fixture();executeTransaction(m,{type:'deposit',positionId:'first-cash',date:'2026-10-25',quantity:'5',unitPrice:'1'});
 m.openingPositions=[];assert.throws(()=>compare(m,'105'),/Eröffnungsbestand/);
 const n=fixture();captureOpenings(n);n.openingPositions[0].quantityExact='99';
 assert.throws(()=>compare(n,'100'),/widersprechen/);
});
test('missing/malformed reference, wrong position and ambiguous account currency are rejected',()=>{
 const m=fixture();
 for(const value of [null,undefined,'',true,{},NaN,Infinity,'1.2.3','0.0000000000000000001'])assert.throws(()=>compare(m,value));
 assert.throws(()=>compare(m,'100','missing'),/Guthaben/);
 m.positions[0].kind='etf';assert.throws(()=>compare(m,'100'),/Guthaben/);m.positions[0].kind='cash';
 m.accounts[0].currency='USD';assert.throws(()=>compare(m,'100'),/währung/);
});
test('each invocation reads the current model; no stale accepted comparison or cashflow is created',()=>{
 const m=fixture();assert.equal(compare(m,'100').status,'matched');
 m.positions[0].quantity=101;m.positions[0].quantityExact='101';
 const before=JSON.stringify(m);assert.equal(compare(m,'100').differenceExact,'-1');
 assert.equal(JSON.stringify(m),before);assert.equal(m.externalCashFlows.length,0);
 assert.equal(m.bookings.length,0);assert.equal(m.snapshots.length,0);
});
