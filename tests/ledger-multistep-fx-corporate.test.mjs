import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {executeTransaction,ledgerQuantityAudit} from '../src/transactions.js';

function fixture({currency='EUR',shares='7',basis='700',cashQuantity='3000',fx=1}={}){
 const m=blankModel(),p=createProvider({name:'Unabhängige Referenz',type:'broker'});
 m.providers.push(p);
 const depot=createAccount({providerId:p.id,name:'Depot',type:'securities'},m);
 const bank=createAccount({providerId:p.id,name:'Geldkonto',type:'checking',currency},m);
 m.accounts.push(depot,bank);
 const stock=createPosition({providerId:p.id,accountId:depot.id,name:'Aktie A',kind:'stock',
  quantity:shares,price:100,currency,fxRate:fx,costBasisExact:basis},m);
 const cash=createPosition({providerId:p.id,accountId:bank.id,name:'Liquidität',kind:'cash',
  quantity:cashQuantity,price:1,currency,fxRate:fx},m);
 const other=createPosition({providerId:p.id,accountId:depot.id,name:'Token B',kind:'crypto',
  symbol:'TOKENB',quantity:0,price:10,currency:'EUR',costBasisExact:'0'},m);
 m.positions.push(stock,cash,other);
 return {m,stock,cash,other};
}
const trade=(m,p,type,values={})=>executeTransaction(m,{
 type,date:'2026-10-23',positionId:p.id,quantity:0,unitPrice:100,...values
});
const unchanged=(m,fn)=>{const before=JSON.stringify(m);assert.throws(fn,/Geld|Barabfindung|Barausgleich|Split|Umtausch/);assert.equal(JSON.stringify(m),before);};

test('Independent EUR reference: 3 trades produce EUR 389.2 basis, 42.2 realized profit and 3353 cash',()=>{
 const {m,stock,cash}=fixture();
 trade(m,stock,'buy',{quantity:3,unitPrice:90,feeEUR:3,cashPositionId:cash.id});
 assert.equal(stock.quantityExact,'10');assert.equal(stock.costBasisExact,'973');assert.equal(cash.quantityExact,'2727');
 trade(m,stock,'sell',{quantity:4,unitPrice:110,feeEUR:2,taxEUR:1,cashPositionId:cash.id});
 assert.equal(stock.quantityExact,'6');assert.equal(stock.costBasisExact,'583.8');
 assert.equal(stock.realizedPnLExact,'47.8');assert.equal(cash.quantityExact,'3164');
 trade(m,stock,'sell',{quantity:2,unitPrice:95,feeEUR:1,cashPositionId:cash.id});
 assert.equal(stock.quantityExact,'4');assert.equal(stock.costBasisExact,'389.2');
 assert.equal(stock.realizedPnLExact,'42.2');assert.equal(cash.quantityExact,'3353');
 assert.equal(ledgerQuantityAudit(m).ok,true);assert.equal(m.externalCashFlows.length,0);
 const restored=safeImport(JSON.parse(backup(m)));
 assert.equal(restored.positions.find(x=>x.id===stock.id).realizedPnLExact,'42.2');
 assert.equal(restored.journalEntries.length,3);
});

test('Independent USD reference: successive historical 0.8/0.9/0.95 EUR-per-USD with EUR fees',()=>{
 const {m,stock,cash}=fixture({currency:'USD',shares:'3',basis:'255',cashQuantity:'2000',fx:0.85});
 trade(m,stock,'buy',{quantity:1,unitPrice:100,fxRate:'0.8',feeEUR:'1.6',cashPositionId:cash.id});
 assert.equal(stock.costBasisExact,'336.6');assert.equal(cash.quantityExact,'1898');
 assert.deepEqual(m.journalEntries[0].postings.map(x=>x.amountBookEURExact),['80','-81.6','1.6']);
 trade(m,stock,'sell',{quantity:2,unitPrice:110,fxRate:'0.9',feeEUR:'1',taxEUR:'0.8',cashPositionId:cash.id});
 assert.equal(stock.quantityExact,'2');assert.equal(stock.costBasisExact,'168.3');
 assert.equal(stock.realizedPnLExact,'27.9');assert.equal(cash.quantityExact,'2116');
 assert.deepEqual(m.journalEntries[1].postings.map(x=>x.amountBookEURExact),['-198','196.2','1','0.8']);
 trade(m,stock,'sell',{quantity:1,unitPrice:120,fxRate:'0.95',feeEUR:'0.5',cashPositionId:cash.id});
 assert.equal(stock.quantityExact,'1');assert.equal(stock.costBasisExact,'84.15');
 assert.equal(stock.realizedPnLExact,'57.25');
 assert.equal(cash.quantityExact,'2235.473684210526315789');
 assert.equal(ledgerQuantityAudit(m).ok,true);
 assert.equal(m.externalCashFlows.length,0);
 const restored=safeImport(JSON.parse(backup(m)));
 assert.equal(restored.positions.find(x=>x.id===cash.id).quantityExact,cash.quantityExact);
});

test('Cash-bearing swaps and mergers are rejected rather than silently adding cash',()=>{
 for(const kind of ['swap','merger']){
  const {m,stock,cash,other}=fixture();
  unchanged(m,()=>trade(m,stock,kind,{quantity:2,targetPositionId:cash.id,targetQuantity:200}));
  unchanged(m,()=>trade(m,cash,kind,{quantity:200,targetPositionId:other.id,targetQuantity:2}));
 }
});

test('Cash-in-lieu field is not silently ignored in a split, swap or merger',()=>{
 const {m,stock,other}=fixture();
 unchanged(m,()=>trade(m,stock,'split',{ratioNumerator:1,ratioDenominator:3,cashInLieuEUR:'12.34'}));
 unchanged(m,()=>trade(m,stock,'swap',{quantity:1,targetPositionId:other.id,targetQuantity:1,cashInLieuEUR:'2'}));
 unchanged(m,()=>trade(m,stock,'merger',{quantity:1,targetPositionId:other.id,targetQuantity:1,cashInLieuEUR:'0.01'}));
});

test('Unrepresentable reverse split must not silently erase an 18-decimal holding',()=>{
 const {m,stock}=fixture({shares:'0.000000000000000001',basis:'0.01'});
 unchanged(m,()=>trade(m,stock,'split',{ratioNumerator:1,ratioDenominator:3}));
});
