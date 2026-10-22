import test from 'node:test';
import assert from 'node:assert/strict';
import {openingCashInput} from '../src/account-opening.js';
import {blankModel,createProvider,createAccount,createPosition,valueEUR} from '../src/model.js';
test('EUR opening is a holding, not a synthetic transaction',()=>{
 const model=blankModel();const provider=createProvider({name:'Example Bank',type:'bank'});model.providers.push(provider);
 const account=createAccount({providerId:provider.id,name:'Cash',type:'savings',currency:'EUR'},model);model.accounts.push(account);
 const position=createPosition({...openingCashInput({amount:'2500,50',currency:'EUR'}),providerId:provider.id,accountId:account.id},model);
 model.positions.push(position);
 assert.equal(valueEUR(position),2500.5);
 assert.equal(model.bookings.length,0);
 assert.equal(model.externalCashFlows.length,0);
});
test('USD opening needs a user supplied rate, with no implicit parity',()=>{
 assert.throws(()=>openingCashInput({amount:'100',currency:'USD'}));
 const fields=openingCashInput({amount:'100',currency:'USD',fxRate:'0.92'});
 assert.equal(fields.fxRate,0.92);
 assert.equal(fields.currency,'USD');
 assert.equal(fields.price,1);
});
test('Empty opening keeps an account without creating a holding',()=>{
 assert.equal(openingCashInput({amount:'',currency:'CHF'}),null);
 assert.equal(openingCashInput({amount:'0',currency:'USD'}),null);
 assert.throws(()=>openingCashInput({amount:'-1',currency:'EUR'}));
});
