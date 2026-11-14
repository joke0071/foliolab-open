import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,safeImport,backup,totalExactEUR} from '../src/model.js';
import {executeTransaction,ledgerQuantityAudit} from '../src/transactions.js';
import {previewBookingChange,prepareBookingChange,prepareBookingUndo,bookingChangePermissions,bookingRowsActionReasons} from '../src/booking-management.js';

function setup(type='deposit'){
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'Cash'},m));m.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',name:'Cash',kind:'cash',quantity:100,price:1},m));
 const b=executeTransaction(m,{id:'booking-a',positionId:'cash',type,quantity:20,date:'2026-01-02',unitPrice:1,fxRate:1});return {m,b};
}
const request=(id,action='remove')=>({ids:[id],action,reason:'Synthetic receipt',...(action==='edit'?{changes:{quantity:'7.25'}}:action==='notes'?{changes:{notes:'Receipt checked'}}:{})});
test('Unknown, empty, coerced and underflowed costs never grant cash editing or removal',()=>{
 for(const type of ['deposit','withdraw','interest','dividend','fee','tax'])for(const field of ['feeEUR','taxEUR'])for(const value of [null,undefined,'',false,[],[0],'1e-999']){
  const {m,b}=setup(type);b[field]=value;const restored=safeImport(JSON.parse(backup(m))),before=JSON.stringify(restored);
  for(const action of ['edit','remove']){
   const p=previewBookingChange(restored,request(b.id,action));assert.equal(p.ready,false,type+'/'+field+'/'+JSON.stringify(value)+'/'+action);
   assert.throws(()=>prepareBookingChange(restored,request(b.id,action),{expectedModel:before,confirmed:true}));
  }
  assert.ok(bookingChangePermissions(restored,b.id).edit.length);assert.ok(bookingChangePermissions(restored,b.id).remove.length);
  assert.ok(bookingRowsActionReasons(restored,[b.id]).get(b.id).remove.length);
  assert.equal(JSON.stringify(restored),before);assert.equal(ledgerQuantityAudit(restored).ok,true);
 }
});
test('Note-only previews preserve and display unknown fees and taxes rather than zero',()=>{
 for(const field of ['feeEUR','taxEUR']){
  const {m,b}=setup();b[field]=null;const before=JSON.stringify(m),p=previewBookingChange(m,request(b.id,'notes'));
  assert.equal(p.ready,true);assert.equal(p.effects[0][field],null);assert.equal(p.effects[0][field==='feeEUR'?'afterFeeEUR':'afterTaxEUR'],null);
  assert.equal(p.candidate.bookings[0][field],null);assert.deepEqual(p.candidate.positions,m.positions);assert.deepEqual(p.candidate.externalCashFlows,m.externalCashFlows);
  assert.deepEqual(p.candidate.journalEntries.slice(0,-1),m.journalEntries);assert.equal(totalExactEUR(p.candidate),'120');
  assert.equal(JSON.stringify(m),before);
 }
});
test('Explicit zero costs retain all six existing independent 100-EUR inverses and exact undo',()=>{
 for(const type of ['deposit','withdraw','interest','dividend','fee','tax'])for(const zero of [0,'0','0.00']){
  const {m,b}=setup(type);b.feeEUR=zero;b.taxEUR=zero;const before=JSON.stringify(m);
  const {candidate,receipt}=prepareBookingChange(m,request(b.id),{expectedModel:before,confirmed:true});
  assert.equal(totalExactEUR(candidate),'100');assert.equal(candidate.positions[0].quantityExact,'100');assert.equal(ledgerQuantityAudit(candidate).ok,true);
  assert.equal(JSON.stringify(prepareBookingUndo(candidate,receipt)),before);
 }
});
