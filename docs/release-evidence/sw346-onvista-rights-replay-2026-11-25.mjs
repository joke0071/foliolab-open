import assert from 'node:assert/strict';
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const src=n=>import(pathToFileURL(resolve(process.argv[2],'src',n)));
const {blankModel,createProvider,createAccount,createPosition,backup,safeImport}=await src('model.js');
const {executeTransaction,ledgerQuantityAudit}=await src('transactions.js');
function fixture(positions){
 const model=blankModel();model.providers.push(createProvider({id:'provider',name:'Öffentlicher Referenzfall',type:'broker'}));
 for(const [id,type] of [['depot','securities'],['bank','checking']])model.accounts.push(createAccount({id,type,providerId:'provider',name:id},model));
 for(const [id,isin,q,basis] of positions)model.positions.push(createPosition({id,name:id,kind:id==='cash'?'cash':'stock',providerId:'provider',accountId:id==='cash'?'bank':'depot',quantity:q,isin,currency:'EUR',price:1,costBasisExact:basis},model));
 return model;
}
function check(m){
 assert(ledgerQuantityAudit(m).ok);assert.equal(m.externalCashFlows.length,0);
 const r=safeImport(JSON.parse(backup(m)));assert.deepEqual(r.journalEntries,m.journalEntries);
 assert.deepEqual(r.positions.map(p=>p.quantityExact),m.positions.map(p=>p.quantityExact));
}
const old='DE0008032004',right='DE000CBKTLR7',stock='DE000CBK1001';
const a=fixture([['old',old,'55',null],['rights',right,'0',null],['whole',stock,'0',null]]);
for(const [from,to,quantity,targetQuantity] of [['old','rights','55','5.5'],['rights','whole','5','5']]){
 executeTransaction(a,{type:'merger',date:'2013-04-24',positionId:from,targetPositionId:to,quantity,targetQuantity});
}
const allocations=a.positions.map(p=>p.quantityExact);assert.deepEqual(allocations,['0','0.5','5']);
assert.equal(a.positions[1].costBasisExact,null);assert.equal(a.positions[2].costBasisExact,null);check(a);
const b=fixture([['rights',right,'0.5','16.96'],['cash',null,'0',null]]);
executeTransaction(b,{type:'sell',date:'2013-05-06',positionId:'rights',cashPositionId:'cash',quantity:'0.5',unitPrice:'10.8150',feeEUR:'0',taxEUR:'0',fractionGrossEUR:'5.41',fractionNetEUR:'5.41'});
assert.deepEqual(b.positions.map(p=>p.quantityExact),['0','5.41']);
assert.equal(b.positions[0].realizedPnLExact,'-11.55');check(b);
console.log(JSON.stringify({allocationReceipt:{from:'55',rightsAfterFirstAllocation:'5.5',positionsAfterSecondAllocation:allocations,basis:'unknown',restore:true},separateSettlementReceipt:{shares:'0.5',cashEUR:'5.41',realizedEUR:'-11.55',impliedAllocatedBasisEUR:'16.96',restore:true},isolatedTestPortfolios:2,sameCustomerAccountVerified:false,separateTaxRefundEUR:'3.05',taxRefundPosted:false,combinedSettlementApproved:false},null,2));
