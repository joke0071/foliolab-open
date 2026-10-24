import test from 'node:test';
import assert from 'node:assert/strict';
import {flatexCashAccountChoices,auditFlatexCashStatements} from '../src/flatex-cash-audit.js';

function fixture(){
 const model={providers:[{id:'f',name:'Flatex Österreich'},{id:'o',name:'Anderer Broker'}],
 accounts:[
  {id:'dep',providerId:'f',type:'securities',currency:'EUR',name:'Flatex Depot'},
  {id:'cash',providerId:'f',type:'checking',currency:'EUR',name:'Flatex Verrechnung'},
  {id:'usd',providerId:'f',type:'checking',currency:'USD',name:'US-Konto'},
  {id:'other',providerId:'o',type:'checking',currency:'EUR',name:'Fremde Bank'}
 ],
 positions:[
  {id:'cash-eur',accountId:'cash',kind:'cash',currency:'EUR',name:'EUR Guthaben'},
  {id:'cash-usd',accountId:'usd',kind:'cash',currency:'USD',name:'USD Guthaben'},
  {id:'cash-other',accountId:'other',kind:'cash',currency:'EUR',name:'Fremdes Guthaben'}
 ]};
 const prepared={cashItems:[
  {account:'AT-ONE',date:'2026-10-18',amount:'1000',kind:'deposit'},
  {account:'AT-ONE',date:'2026-10-19',amount:'-250.75',kind:'settlement'},
  {account:'AT-TWO',date:'2026-10-19',amount:'55.3',kind:'dividend'},
  {account:'AT-TWO',date:'2026-10-20',amount:'-12.34',kind:'tax'}
 ]};
 return {model,prepared};
}
test('requires explicit EUR confirmation before statement totals are displayed',()=>{
 const {prepared}=fixture();
 const r=auditFlatexCashStatements(prepared);
 assert.equal(r.currencyConfirmed,false);
 assert.equal(r.groups.length,2);
 assert.equal(r.groups[0].count,2);
 assert.equal(r.groups[0].netExact,null);
 assert.match(r.note,/Weder Kontovollständigkeit/);
});
test('separates all account references and exact signed totals without classifying external flows',()=>{
 const {prepared}=fixture(),original=JSON.stringify(prepared);
 const r=auditFlatexCashStatements(prepared,{accountAmountsEUR:true});
 assert.deepEqual(r.groups.map(g=>g.reference),['AT-ONE','AT-TWO']);
 assert.equal(r.groups[0].inflowsExact,'1000');
 assert.equal(r.groups[0].outflowsExact,'250.75');
 assert.equal(r.groups[0].netExact,'749.25');
 assert.equal(r.groups[1].inflowsExact,'55.3');
 assert.equal(r.groups[1].outflowsExact,'12.34');
 assert.equal(r.groups[1].netExact,'42.96');
 assert.equal(r.groups[0].kinds.deposit,1);
 assert.equal(JSON.stringify(prepared),original);
});
test("never assumes counterpart IBAN is the user's account; only same-provider manual EUR cash options",()=>{
 const {model}=fixture(),before=JSON.stringify(model);
 const choices=flatexCashAccountChoices(model,'dep');
 assert.deepEqual(choices,[{
  accountId:'cash',positionId:'cash-eur',accountName:'Flatex Verrechnung',positionName:'EUR Guthaben'
 }]);
 assert.deepEqual(flatexCashAccountChoices(model,'other'),[]);
 assert.equal(JSON.stringify(model),before);
});
test('missing references and corrupt dates or numbers are isolated instead of silently merged',()=>{
 const p={cashItems:[
  {account:'',date:'2026-10-20',amount:'10',kind:'deposit'},
  {account:'A',date:'2026-02-30',amount:'10',kind:'deposit'},
  {account:'B',date:'2026-10-20',amount:'nan',kind:'unknown'},
  {account:'C',date:'2026-10-20',amount:'-0.000000000000000001',kind:'fee'}
 ]};
 const r=auditFlatexCashStatements(p,{accountAmountsEUR:true});
 assert.equal(r.issues.length,3);
 assert.deepEqual(r.groups.map(g=>g.reference),['C']);
 assert.equal(r.groups[0].outflowsExact,'0.000000000000000001');
 assert.equal(r.groups[0].netExact,'-0.000000000000000001');
});
