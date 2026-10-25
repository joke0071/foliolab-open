import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,totalExactEUR,backup,safeImport} from '../src/model.js';
import {forecastAccountInterest} from '../src/interest-account.js';
import {localToday,accountLiquidity} from '../src/cash-terms.js';
import {interestDateAfter} from '../src/interest-scenario.js';
import {executeTransaction} from '../src/transactions.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';
const today=localToday(),end=interestDateAfter(today,365);
const terms=rate=>({version:1,dayCount:'ACT/365F',rates:[{fromDate:today,annualRateExact:rate,knownThrough:null}]});
function fixture(){
 const m=blankModel();m.providers.push(createProvider({id:'bank',name:'Testbank',type:'bank'}));
 for(const [id,currency,amount,rate] of [['one','EUR','10000','2.5'],['two','EUR','2500','2'],['usd','USD','10000','3'],['pln','PLN','10000','4']]){
  m.accounts.push(createAccount({id,providerId:'bank',name:id,type:'savings',currency,interestTerms:terms(rate)},m));
  m.positions.push(createPosition({id:id+'-cash',providerId:'bank',accountId:id,kind:'cash',name:id,quantity:amount,price:1,currency,fxRate:1},m));
 }
 return m;
}
const forecast=(m,id='one',extra={})=>forecastAccountInterest(m,{accountId:id,asOf:today,startDate:today,endDate:end,allowScenario:true,...extra});
test('same-provider accounts remain independent and all forecast work is read-only',()=>{
 const m=fixture(),before=backup(m),wealth=totalExactEUR(m);
 assert.equal(forecast(m).grossExact,'250.00');assert.equal(forecast(m,'two').grossExact,'50.00');
 m.positions[2].fxRate=null;m.positions[2].fxRateExact=null;
 const noFX=backup(m);assert.equal(forecast(m,'usd').grossExact,'300.00');assert.equal(forecast(m,'usd').currency,'USD');
 assert.equal(backup(m),noFX);m.positions[2].fxRate=1;m.positions[2].fxRateExact='1';
 assert.equal(backup(m),before);assert.equal(totalExactEUR(m),wealth);
 assert.equal(m.journalEntries.length,0);assert.equal(m.bookings.length,0);assert.equal(m.externalCashFlows.length,0);assert.equal(m.snapshots.length,0);
});
test('metadata editing preserves AT02-A, holdings, journal, cashflows, returns inputs and wealth',()=>{
 const m=fixture();const old={version:1,status:'bound',fixedTerm:false,startDate:null,maturityDate:null,outcome:'unconfirmed',outcomeDate:null,evidence:null,renewalMaturityDate:null};
 m.accounts[0]=createAccount({...m.accounts[0],cashTerms:old},m);
 const finances=JSON.stringify({...m,accounts:[]}),wealth=totalExactEUR(m),state=accountLiquidity(m.accounts[0]);
 m.accounts[0]=createAccount({...m.accounts[0],interestTerms:terms('1.75')},m);
 assert.equal(JSON.stringify({...m,accounts:[]}),finances);assert.equal(totalExactEUR(m),wealth);assert.deepEqual(accountLiquidity(m.accounts[0]),state);
 assert.equal(forecast(m).grossExact,'175.00');
});
test('no backdated current balance, invalid basis, mismatched currency or fixed-deposit forecast',()=>{
 const m=fixture();assert.throws(()=>forecast(m,'one',{asOf:'2020-01-01'}),/Berechnungsstichtag/);
 assert.throws(()=>forecast(m,'one',{startDate:interestDateAfter(today,-1)}),/Start/);
 m.accounts[0].cashTerms={fixedTerm:true};assert.throws(()=>forecast(m),/Festgeld/);delete m.accounts[0].cashTerms;
 m.positions[0].currency='USD';assert.throws(()=>forecast(m),/Kapitalbasis/);m.positions[0].currency='EUR';
 m.positions[0].quantityExact='-1';assert.throws(()=>forecast(m),/negatives/);m.positions[0].quantityExact='10000';
 m.positions[0].economicRole='collateral';assert.throws(()=>forecast(m),/Kapitalbasis/);delete m.positions[0].economicRole;
 m.positions[0].providerId='wrong';assert.throws(()=>forecast(m),/Anbieter/);m.positions[0].providerId='bank';
 m.positions=m.positions.filter(p=>p.accountId!=='one');assert.throws(()=>forecast(m),/Kapitalbasis/);
});
test('canonical journal audit blocks disagreement and no guessed corrections are created',()=>{
 const m=fixture();executeTransaction(m,{type:'deposit',positionId:'one-cash',date:today,quantity:'5',unitPrice:'1'});
 const before=backup(m);assert.equal(forecast(m).principalExact,'10005');assert.equal(backup(m),before);
 m.positions[0].quantityExact='10006';const conflict=backup(m);assert.throws(()=>forecast(m),/widersprechen/);assert.equal(backup(m),conflict);
});
test('optional rate metadata roundtrips open/current complete data and legacy encryption',async()=>{
 const m=fixture(),raw=backup(m);assert.equal(backup(safeImport(JSON.parse(raw))),raw);
 const encrypted=await encryptBackup(raw,'test-password-only');const decrypted=await decryptBackup(JSON.parse(encrypted),'test-password-only');
 assert.equal(backup(safeImport(JSON.parse(decrypted))),raw);
 const old=JSON.parse(raw);old.accounts.forEach(a=>delete a.interestTerms);
 for(const version of [1,2,3]){const data=structuredClone(old);data.version=version;if(version===1){delete data.accounts;data.positions.forEach(p=>delete p.accountId);}
  const restored=safeImport(data);assert.equal(restored.positions.length,4);assert.ok(restored.accounts.every(a=>!Object.hasOwn(a,'interestTerms')));
 }
 const unchanged=backup(m);for(const invalid of [{version:2},{version:1,dayCount:'unknown',rates:[]},terms('abc')]){
  const bad=JSON.parse(raw);bad.accounts[0].interestTerms=invalid;assert.throws(()=>safeImport(bad));assert.equal(backup(m),unchanged);
 }
});
