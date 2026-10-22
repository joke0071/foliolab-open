import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {buildAssetWizardDraft} from '../src/asset-wizard-core.js';
const init=()=>({...blankModel()});
const base={kind:'etf',name:'Synthetic ETF',symbol:'SYN',isin:'IE0000000001',currency:'EUR',quantity:'1.25',date:'2026-10-21',mode:'opening',currentPrice:'0'};
test('Opening creates account and holdings without any fictitious transaction or basis',()=>{
 const initial=init();
 const result=buildAssetWizardDraft(initial,{...base,providerId:'__new__',providerName:'Example Broker',providerType:'broker',accountId:'__new__',accountName:'Depot',accountType:'securities'});
 assert.equal(initial.providers.length,0);
 assert.equal(result.draft.positions[0].quantityExact,'1.25');
 assert.equal(result.draft.positions[0].priceExact,'0');
 assert.equal(result.draft.positions[0].costBasisEUR,null);
 assert.equal(result.draft.bookings.length,0);
 assert.equal(result.draft.journalEntries.length,0);
 assert.equal(result.draft.externalCashFlows.length,0);
 assert.equal(result.draft.snapshots.length,1);
 const restored=safeImport(JSON.parse(backup(result.draft)));
 assert.equal(restored.positions[0].quantityExact,'1.25');
});
test('Buy creates a balanced real ledger entry with exact quantity and costs',()=>{
 const result=buildAssetWizardDraft(init(),{...base,mode:'buy',quantity:'3',unitPrice:'100',feeEUR:'5',providerId:'__new__',providerName:'New Broker',accountId:'__new__',accountName:'Depot',accountType:'securities'});
 assert.equal(result.draft.positions[0].quantityExact,'3');
 assert.equal(result.draft.positions[0].costBasisExact,'305');
 assert.equal(result.draft.bookings.length,1);
 assert.equal(result.draft.journalEntries.length,1);
 assert.equal(result.draft.externalCashFlows.length,0);
 assert.equal(result.draft.positions[0].price,0,'Purchase price must not be invented as a live market quote');
 assert.equal(result.draft.journalEntries[0].postings.reduce((n,p)=>n+Number(p.amountBookEURExact),0),0);
});
test('Duplicate account position rejected without modifying source',()=>{
 const model=init(),provider=createProvider({name:'Broker'});model.providers.push(provider);
 const acc=createAccount({providerId:provider.id,name:'Depot'},model);model.accounts.push(acc);
 model.positions.push(createPosition({providerId:provider.id,accountId:acc.id,kind:'etf',name:'ETF',isin:base.isin,symbol:base.symbol,quantity:2,price:50},model));
 const before=JSON.stringify(model);
 assert.throws(()=>buildAssetWizardDraft(model,{...base,providerId:provider.id,accountId:acc.id}),/bereits vorhanden/);
 assert.equal(JSON.stringify(model),before);
});
test('Foreign currency requires explicit rate and no automatic 1:1 assumption',()=>{
 const input={...base,currency:'USD',providerId:'__new__',providerName:'Broker',accountId:'__new__',accountName:'Depot'};
 assert.throws(()=>buildAssetWizardDraft(init(),input),/Zahl/);
 const good=buildAssetWizardDraft(init(),{...input,fxRate:'0.9'});
 assert.equal(good.draft.positions[0].fxRate,0.9);
});
test('Reject future dates, empty names and unsafe cash purchases',()=>{
 const required={...base,providerId:'__new__',providerName:'Broker',accountId:'__new__',accountName:'Depot'};
 assert.throws(()=>buildAssetWizardDraft(init(),{...required,date:'2099-01-01'}),/Datum/);
 assert.throws(()=>buildAssetWizardDraft(init(),{...required,name:''}),/Bezeichnung/);
 assert.throws(()=>buildAssetWizardDraft(init(),{...required,kind:'cash',mode:'buy',currency:'EUR'}),/Guthaben/);
});
