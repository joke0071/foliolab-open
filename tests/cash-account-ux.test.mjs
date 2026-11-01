import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,totalExactEUR,backup,safeImport,money,valueEUR,escapeHTML} from '../src/model.js';
import {buildAssetWizardDraft} from '../src/asset-wizard-core.js';
import {simpleCashHolding} from '../src/cash-terms-ui.js';
import {renderProviderAccounts} from '../src/dashboard-ui.js';
const date=new Date().toISOString().slice(0,10);
const input={kind:'cash',mode:'opening',date,providerId:'__new__',providerName:'Synthetic bank',providerType:'bank',accountId:'__new__',accountName:'Synthetic deposit',accountType:'savings',currency:'EUR',quantity:'1234.000000000000000001'};
test('New simple savings account needs one name; account/holding remain independent exact entities',()=>{
 const source=blankModel(),before=JSON.stringify(source);
 const {draft}=buildAssetWizardDraft(source,{...input,name:''});
 assert.equal(draft.accounts[0].name,input.accountName);assert.equal(draft.positions[0].name,input.accountName);
 assert.notEqual(draft.accounts[0].id,draft.positions[0].id);assert.equal(draft.positions[0].accountId,draft.accounts[0].id);
 assert.equal(draft.positions[0].quantityExact,input.quantity);assert.equal(totalExactEUR(draft),input.quantity);
 assert.deepEqual(draft.bookings,[]);assert.deepEqual(draft.journalEntries,[]);assert.deepEqual(draft.externalCashFlows,[]);
 assert.equal(JSON.stringify(source),before);const restored=safeImport(JSON.parse(backup(draft)));
 for(const key of ['id','name','accountId','providerId','quantityExact','priceExact','currency'])assert.equal(restored.positions[0][key],draft.positions[0][key]);
 assert.deepEqual(restored.bookings,draft.bookings);assert.deepEqual(restored.journalEntries,draft.journalEntries);assert.equal(totalExactEUR(restored),totalExactEUR(draft));
 assert.throws(()=>buildAssetWizardDraft(source,{...input,accountName:''}),/Bezeichnung|Konto/i);
});
test('Single explicit cash currency sets new savings account currency, never silent 1:1 FX',()=>{
 assert.throws(()=>buildAssetWizardDraft(blankModel(),{...input,currency:'USD',accountCurrency:'EUR'}),/Zahl/);
 const {draft}=buildAssetWizardDraft(blankModel(),{...input,currency:'USD',accountCurrency:'EUR',fxRate:'.9'});
 assert.equal(draft.accounts[0].currency,'USD');assert.equal(draft.positions[0].currency,'USD');assert.equal(draft.positions[0].fxRateExact,'0.9');
});
function fixture(){const m=blankModel();m.providers.push(createProvider({id:'b',name:'Synthetic bank',type:'bank'}));m.accounts.push(createAccount({id:'a',providerId:'b',name:'Deposit one',type:'savings'},m));m.positions.push(createPosition({id:'cash',providerId:'b',accountId:'a',name:'Original distinct holding label',kind:'cash',currency:'EUR',quantity:'1000.000000000000000001',price:1},m));return m;}
test('Simple cash dashboard uses one named card and no position count/link; rendering preserves bytes',()=>{
 const m=fixture(),before=JSON.stringify(m),html=renderProviderAccounts(m,money,valueEUR,escapeHTML,new Set(['b']));
 assert.equal((html.match(/simple-cash-account/g)||[]).length,1);assert.equal((html.match(/Deposit one/g)||[]).length,2,'name in visible text and accessible label only');
 assert.doesNotMatch(html,/Original distinct holding label|Positionen →|1 Positionen|provider-account-head/);
 assert.match(html,/Kontostand prüfen/);assert.match(html,/Konditionen bearbeiten/);assert.match(html,/Verfügbarkeit nicht hinterlegt/);
 assert.equal(JSON.stringify(m),before);assert.equal(totalExactEUR(m),'1000.000000000000000001');
});
test('Only exact 1:1 standard savings cash is simplified; complex/multi-currency/multiple holdings stay explicit',()=>{
 const m=fixture(),a=m.accounts[0],p=m.positions[0];assert.equal(simpleCashHolding(a,[p]),p);
 assert.equal(simpleCashHolding(a,[]),null);assert.equal(simpleCashHolding(a,[p,{...p,id:'other'}]),null);
 for(const patch of [{kind:'stock'},{currency:'USD'},{priceExact:'2'},{economicRole:'collateral'},{valuationMode:'excluded'},{representedByPositionId:'other'},{wallet:{enabled:true}},{accountId:'other'}])assert.equal(simpleCashHolding(a,[{...p,...patch}]),null);
 assert.equal(simpleCashHolding({...a,type:'securities'},[p]),null);
 m.positions.push(createPosition({id:'other',providerId:'b',accountId:'a',name:'Second holding',kind:'cash',quantity:10,price:1},m));
 const html=renderProviderAccounts(m,money,valueEUR,escapeHTML);assert.doesNotMatch(html,/simple-cash-account/);assert.match(html,/Positionen →/);assert.match(html,/Second holding/);
});
test('Independent deposits stay separate; new account creation never renames existing data or merges equal holdings',()=>{
 const m=fixture(),before=JSON.stringify(m),old=structuredClone(m);
 const {draft}=buildAssetWizardDraft(m,{...input,providerId:'b',accountName:'Deposit two',name:'Ignored duplicate product name'});
 assert.deepEqual(draft.accounts[0],old.accounts[0]);assert.deepEqual(draft.positions[0],old.positions[0]);
 assert.equal(draft.accounts.length,2);assert.equal(draft.positions.length,2);assert.notEqual(draft.accounts[0].id,draft.accounts[1].id);
 const html=renderProviderAccounts(draft,money,valueEUR,escapeHTML);assert.equal((html.match(/simple-cash-account/g)||[]).length,2);
 assert.equal(JSON.stringify(m),before);
});
