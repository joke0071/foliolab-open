import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport,totalExactEUR} from '../src/model.js';
import {executeTransaction,ledgerQuantityAudit} from '../src/transactions.js';

const date='2026-10-23';
const tx=(m,p,type,extra={})=>executeTransaction(m,{type,positionId:p.id,date,quantity:0,unitPrice:100,...extra});

function fixture({sourceQuantity='3',sourceBasis='300',sourcePrice=100,currency='EUR',cashAmount='2000',fxRate=1}={}){
 const m=blankModel(),broker=createProvider({name:'Independent reference',type:'broker'});m.providers.push(broker);
 const ac=createAccount({providerId:broker.id,name:'Main',type:'securities'},m);
 const ac2=createAccount({providerId:broker.id,name:'Other',type:'securities'},m);
 const cashAcc=createAccount({providerId:broker.id,name:'Settlement',type:'checking',currency},m);
 m.accounts.push(ac,ac2,cashAcc);
 const source=createPosition({providerId:broker.id,accountId:ac.id,name:'World ETF',kind:'etf',
  isin:'IE00BK5BQT80',quantity:sourceQuantity,price:sourcePrice,currency,fxRate,
  costBasisExact:sourceBasis},m);
 const target=createPosition({providerId:broker.id,accountId:ac2.id,name:'World ETF',kind:'etf',
  isin:'IE00BK5BQT80',quantity:0,price:sourcePrice,currency,fxRate,costBasisExact:'0'},m);
 const swapTarget=createPosition({providerId:broker.id,accountId:ac2.id,name:'Token B',kind:'crypto',
  symbol:'TOKB',quantity:0,price:25,currency:'EUR',costBasisExact:'0'},m);
 const cash=createPosition({providerId:broker.id,accountId:cashAcc.id,name:'Cash',kind:'cash',
  quantity:cashAmount,price:1,currency,fxRate},m);
 m.positions.push(source,target,swapTarget,cash);
 return {m,source,target,swapTarget,cash};
}

test('Three identical lots: selling two realizes exactly zero profit and leaves exactly one lot',()=>{
 const {m,source,cash}=fixture();
 tx(m,source,'sell',{quantity:2,unitPrice:100,cashPositionId:cash.id});
 assert.equal(source.quantityExact,'1');
 assert.equal(source.costBasisExact,'100');
 assert.equal(source.realizedPnLExact,'0');
 assert.equal(cash.quantityExact,'2200');
 assert.equal(m.externalCashFlows.length,0);
 assert.equal(ledgerQuantityAudit(m).ok,true);
 assert.equal(safeImport(JSON.parse(backup(m))).positions[0].costBasisExact,'100');
});

test('Reference cost-basis allocation: transfer 2/3 moves exactly EUR 200 of EUR 300',()=>{
 const {m,source,target}=fixture();
 const start=totalExactEUR(m);
 tx(m,source,'transfer',{quantity:'2',targetPositionId:target.id});
 assert.equal(source.quantityExact,'1');
 assert.equal(target.quantityExact,'2');
 assert.equal(source.costBasisExact,'100');
 assert.equal(target.costBasisExact,'200');
 assert.equal(totalExactEUR(m),start);
 assert.equal(m.externalCashFlows.length,0);
 assert.equal(ledgerQuantityAudit(m).ok,true);
});

test('Token swap 2/3 of 3 tokens transfers exactly 200 basis into 7 output tokens',()=>{
 const {m,source,swapTarget}=fixture();
 tx(m,source,'swap',{quantity:'2',targetPositionId:swapTarget.id,targetQuantity:'7'});
 assert.equal(source.quantityExact,'1');
 assert.equal(swapTarget.quantityExact,'7');
 assert.equal(source.costBasisExact,'100');
 assert.equal(swapTarget.costBasisExact,'200');
 assert.equal(source.realizedPnLExact,null);
 assert.equal(m.externalCashFlows.length,0);
 assert.equal(ledgerQuantityAudit(m).ok,true);
});

test('3-for-2 split and 2-for-3 reverse split roundtrip exact shares and price',()=>{
 const {m,source}=fixture({sourceQuantity:'8',sourceBasis:'700',sourcePrice:90});
 const original=totalExactEUR(m);
 tx(m,source,'split',{ratioNumerator:3,ratioDenominator:2});
 assert.equal(source.quantityExact,'12');
 assert.equal(source.priceExact,'60');
 assert.equal(source.costBasisExact,'700');
 tx(m,source,'split',{ratioNumerator:2,ratioDenominator:3});
 assert.equal(source.quantityExact,'8');
 assert.equal(source.priceExact,'90');
 assert.equal(source.costBasisExact,'700');
 assert.equal(totalExactEUR(m),original);
 assert.equal(ledgerQuantityAudit(m).ok,true);
});

test('Reverse split 1-for-3 calculates exact 4 shares from 12',()=>{
 const {m,source}=fixture({sourceQuantity:'12',sourceBasis:'1200',sourcePrice:50});
 tx(m,source,'split',{ratioNumerator:1,ratioDenominator:3});
 assert.equal(source.quantityExact,'4');
 assert.equal(source.priceExact,'150');
 assert.equal(source.costBasisExact,'1200');
});

test('Monetary cash account cannot undergo a share split and failed edit is atomic',()=>{
 const {m,cash}=fixture();
 const previous=JSON.stringify(m);
 assert.throws(()=>tx(m,cash,'split',{ratioNumerator:2,ratioDenominator:1}),/Geldkonto|Aktiensplit|Split/);
 assert.equal(JSON.stringify(m),previous);
});

test('Repeated sales preserve an exact 1-wei historical profit even if its UI number rounds',()=>{
 const {m,source}=fixture({sourceQuantity:'2',sourceBasis:'200'});
 source.realizedPnLExact='100000000000000.000000000000000001';
 source.realizedPnLEUR=100000000000000;
 tx(m,source,'sell',{quantity:1,unitPrice:100});
 assert.equal(source.realizedPnLExact,'100000000000000.000000000000000001');
 tx(m,source,'sell',{quantity:1,unitPrice:100});
 assert.equal(source.realizedPnLExact,'100000000000000.000000000000000001');
 assert.equal(ledgerQuantityAudit(m).ok,true);
});

test('USD cash settlement with fees uses exact historical FX and never invents external flows',()=>{
 const {m,source,cash}=fixture({sourceQuantity:'3',sourceBasis:'240',sourcePrice:100,currency:'USD',cashAmount:'2000',fxRate:0.8});
 tx(m,source,'buy',{quantity:'1',unitPrice:'100',fxRate:'0.8',feeEUR:'1.6',cashPositionId:cash.id});
 assert.equal(source.quantityExact,'4');
 assert.equal(source.costBasisExact,'321.6');
 assert.equal(cash.quantityExact,'1898');
 assert.deepEqual(m.journalEntries[0].postings.map(x=>x.amountBookEURExact),['80','-81.6','1.6']);
 assert.equal(m.externalCashFlows.length,0);
 assert.equal(ledgerQuantityAudit(m).ok,true);
});
