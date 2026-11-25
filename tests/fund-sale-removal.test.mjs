import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,snapshot} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {parseCSV,inferMapping,previewCSV,importCSV} from '../src/csv-import.js';
import {previewBookingChange,prepareBookingChange} from '../src/booking-management.js';

function bookedSale(){
 const model=blankModel();
 model.providers.push(createProvider({id:'test-provider',name:'Test broker'}));
 for(const [id,type] of [['test-depot','securities'],['test-cash-account','checking']]){
  model.accounts.push(createAccount({id,providerId:'test-provider',name:id,type,currency:'EUR'},model));
 }
 for(const [id,accountId,kind,quantity,price,costBasisExact] of [
  ['test-fund','test-depot','fund','386','103.16','39303.64'],
  ['test-cash','test-cash-account','cash','0','1',null]
 ])model.positions.push(createPosition({id,providerId:'test-provider',accountId,kind,name:id,quantity,price,costBasisExact},model));
 const parsed=parseCSV('date;type;position;quantity;price;fee;tax;cashPosition;id\n2018-12-31;sell;test-fund;386;103.16;69.90;711.80;test-cash;bfh-test');
 importCSV(model,previewCSV(model,parsed,inferMapping(parsed.headers)));
 const sale=model.bookings[0],journal=model.journalEntries[0];
 return {model,sale,journal,request:{action:'remove',ids:[sale.id],reason:'BFH sale'}};
}

test('fund reversal independently checks source, settlements, basis, later use, and checkpoints',()=>{
 const normal=bookedSale();
 assert.equal(previewBookingChange(normal.model,normal.request).ready,true);
 const checks=[
  [({sale})=>{delete sale.importSource;},/Herkunft/],
  [({sale})=>{sale.feeEUR=null;},/Provision/],
  [({model})=>{model.openingPositions.find(o=>o.positionId==='test-fund').costBasisExact=null;},/Eröffnungsbestand/],
  [({model})=>executeTransaction(model,{type:'withdraw',date:'2019-01-02',positionId:'test-cash',quantity:'1',unitPrice:'1'}),/Verrechnungsvorgänge/],
  [({model})=>snapshot(model,'2019-01-02','Test checkpoint',{manualTotalEUR:'39038.06'}),/Kontrollpunkte/]
 ];
 for(const [change,reason] of checks){
  const state=bookedSale();
  change(state);
  const {model,request}=state,before=JSON.stringify(model);
  const preview=previewBookingChange(model,request);
  assert.equal(preview.ready,false);
  assert.match(preview.blocks.map(b=>b.reason).join(' '),reason);
  assert.throws(()=>prepareBookingChange(model,request,{expectedModel:before,confirmed:true}),reason);
  assert.equal(JSON.stringify(model),before);
 }
});
