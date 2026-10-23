import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {executeTransaction,ledgerQuantityAudit} from '../src/transactions.js';

function fixture(){
 const m=blankModel(),provider=createProvider({name:'Audit Broker',type:'broker'});
 m.providers.push(provider);
 const depot=createAccount({providerId:provider.id,name:'Depot',type:'securities'},m);
 const cashAccount=createAccount({providerId:provider.id,name:'Verrechnungskonto',type:'checking'},m);
 m.accounts.push(depot,cashAccount);
 const security=createPosition({providerId:provider.id,accountId:depot.id,name:'World ETF',
  kind:'etf',symbol:'WLD',quantity:0,price:100,currency:'EUR'},m);
 const cash=createPosition({providerId:provider.id,accountId:cashAccount.id,name:'Cash',
  kind:'cash',quantity:2000,price:1,currency:'EUR'},m);
 m.positions.push(security,cash);
 executeTransaction(m,{type:'buy',date:'2026-10-21',positionId:security.id,
  cashPositionId:cash.id,quantity:'2.125',unitPrice:'100',feeEUR:'1.25'});
 return {m,security,cash};
}
const restored=m=>safeImport(JSON.parse(backup(m)));
const corrupt=(m,mutate)=>{
 const raw=JSON.parse(backup(m));
 mutate(raw);
 return raw;
};

test('Audited backup with real purchase, cash movement and fees round-trips intact',()=>{
 const {m,security,cash}=fixture(),reloaded=restored(m);
 assert.equal(ledgerQuantityAudit(reloaded).ok,true);
 assert.equal(reloaded.positions.find(p=>p.id===security.id).quantityExact,'2.125');
 assert.equal(reloaded.positions.find(p=>p.id===cash.id).quantityExact,'1786.25');
 assert.equal(reloaded.bookings[0].journalEntryId,reloaded.journalEntries[0].id);
 assert.equal(reloaded.journalEntries[0].postings.reduce((sum,p)=>sum+Number(p.amountBookEURExact),0),0);
});

test('Damaged booking referencing a nonexistent holding is never restored',()=>{
 const {m}=fixture();
 assert.throws(()=>safeImport(corrupt(m,x=>{x.bookings[0].positionId='deleted-security';})),/Buchung|Position|Referenz/);
});

test('Damaged booking referencing a nonexistent settlement account is never restored',()=>{
 const {m}=fixture();
 assert.throws(()=>safeImport(corrupt(m,x=>{x.bookings[0].cashPositionId='deleted-cash';})),/Buchung|Verrechnung|Position|Referenz/);
});

test('Tampered booking journal ID cannot be silently disconnected from balanced journal',()=>{
 const {m}=fixture();
 assert.throws(()=>safeImport(corrupt(m,x=>{x.bookings[0].journalEntryId='missing-journal';})),/Buchung|Journal|Referenz/);
});

test('Balanced but orphaned non-quantity posting cannot refer to a nonexistent holding',()=>{
 const {m}=fixture();
 const raw=corrupt(m,x=>{
  // A fee posting balances without contributing a quantity delta; the historical
  // quantity audit alone cannot discover this broken relationship.
  const fee=x.journalEntries[0].postings.find(p=>p.role==='fee');
  fee.positionId='missing-holding';
 });
 assert.throws(()=>safeImport(raw),/Journal|Position|Referenz/);
});

test('A missing journal link is still allowed for legacy V2 bookings',()=>{
 const {m}=fixture();
 const legacy=JSON.parse(backup(m));legacy.version=2;
 delete legacy.journalEntries;delete legacy.openingPositions;
 delete legacy.bookings[0].journalEntryId;
 const reloaded=safeImport(legacy);
 assert.equal(reloaded.bookings.length,1);
 assert.equal(reloaded.positions.length,2);
});

test('A booking cannot be silently linked to an unrelated but valid journal entry',()=>{
 const {m,security,cash}=fixture();
 executeTransaction(m,{type:'deposit',date:'2026-10-22',positionId:cash.id,quantity:50,unitPrice:1});
 const tampered=corrupt(m,x=>{
  x.bookings.find(b=>b.positionId===security.id).journalEntryId=
   x.journalEntries.find(j=>j.type==='deposit').id;
 });
 assert.throws(()=>safeImport(tampered),/Buchung|Journal|Referenz|Position/);
});

test('Independent cash and security reference amounts remain consistent across repeated trades',()=>{
 const {m,security,cash}=fixture();
 let expectedSecurity=2.125,expectedCash=1786.25;
 for(let i=0;i<8;i++){
  executeTransaction(m,{type:'buy',date:'2026-10-22',positionId:security.id,
   cashPositionId:cash.id,quantity:1,unitPrice:100,feeEUR:'0.5'});
  expectedSecurity+=1;expectedCash-=100.5;
  executeTransaction(m,{type:'sell',date:'2026-10-22',positionId:security.id,
   cashPositionId:cash.id,quantity:1,unitPrice:100,feeEUR:'0.5'});
  expectedSecurity-=1;expectedCash+=99.5;
 }
 const checked=restored(m);
 assert.equal(ledgerQuantityAudit(checked).ok,true);
 assert.equal(checked.positions.find(p=>p.id===security.id).quantityExact,String(expectedSecurity));
 assert.equal(checked.positions.find(p=>p.id===cash.id).quantityExact,String(expectedCash));
 assert.equal(checked.externalCashFlows.length,0,'Internal trading never invents external deposits');
 assert.equal(checked.journalEntries.length,17);
});
