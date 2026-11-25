import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

const checkout = process.argv[2];
const from = path => import(pathToFileURL(resolve(checkout, path)).href);
const {blankModel,createProvider,createAccount,createPosition} = await from('src/model.js');
const {executeTransaction,ledgerQuantityAudit} = await from('src/transactions.js');

const model=blankModel();
model.providers.push(createProvider({id:'ing',name:'ING test',type:'broker'}));
for(const [id,type] of [['securities','securities'],['euros','checking']]){
 model.accounts.push(createAccount({id,type,name:id,providerId:'ing'},model));
}
model.positions.push(createPosition({id:'kenvue',name:'Kenvue',kind:'stock',quantity:'0.0648',currency:'USD',price:'21.0032',
 accountId:'securities',providerId:'ing',costBasisExact:'1.38'},model));
model.positions.push(createPosition({id:'cash',name:'Cash EUR',kind:'cash',quantity:'0',price:'1',currency:'EUR',
 accountId:'euros',providerId:'ing'},model));

const sale={type:'sell',date:'2023-09-01',positionId:'kenvue',cashPositionId:'cash',quantity:'0.0648',
 unitPrice:'21.0032',fxRate:'0.917668607841661788',fxRateDate:'2023-09-01',fxSource:'ING receipt 1.089718 USD per EUR',
 feeEUR:'0',taxEUR:'0'};
const start=JSON.stringify(model);
for(const unsupported of [
 {...sale,fractionGrossEUR:'1.25',fractionNetEUR:'1.25'},
 {...sale,tradeAmountEURExact:'1.25'}
]){
 assert.throws(()=>executeTransaction(model,unsupported));
 assert.equal(JSON.stringify(model),start);
}
const comparative=structuredClone(model);
executeTransaction(comparative,sale);
assert.equal(comparative.positions[0].quantityExact,'0');
assert.equal(comparative.externalCashFlows.length,0);
assert(ledgerQuantityAudit(comparative).ok);
assert.notEqual(comparative.positions[1].quantityExact,'1.25');
console.log(JSON.stringify({
 model: execFileSync('git',['-C',checkout,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 brokerCashEUR:'1.25',
 bookingCashWithDisplayedUnitPriceEUR:comparative.positions[1].quantityExact,
 realizedWithDisplayedUnitPriceEUR:comparative.positions[0].realizedPnLExact,
 explicitCashRejects:2,
 rejectedInputUnchanged:true
}));
