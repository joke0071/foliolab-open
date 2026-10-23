import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,snapshot,backup,safeImport} from '../src/model.js';
import {legacyQuoteDiscrepancies,verifiedCurrentQuote,applyVerifiedQuoteRepair} from '../src/legacy-quote-audit.js';

function fixture(){
 const m=blankModel(),provider=createProvider({name:'Audit Anbieter',type:'broker'});
 m.providers.push(provider);const account=createAccount({name:'Depot',providerId:provider.id,type:'securities'},m);
 m.accounts.push(account);
 const add=(name,kind,currency='EUR',quantity='1')=>{
  const p=createPosition({name,kind,currency,quantity,providerId:provider.id,accountId:account.id,price:100,fxRate:currency==='EUR'?1:0.9},m);
  m.positions.push(p);return p;
 };
 return {m,add};
}
const today=new Date().toISOString().slice(0,10);
const checked=(value,date=today)=>verifiedCurrentQuote(value,{source:'Verified Market',date});

test('Local audit flags mismatched displayed/precise quotes and non-EUR FX without mutating bytes',()=>{
 const {m,add}=fixture();const p=add('Alter Bitcoin','crypto'),fx=add('USD ETF','etf','USD');
 p.priceExact='90';fx.fxRateExact='0.8';
 const original=JSON.stringify(m),rows=legacyQuoteDiscrepancies(m);
 assert.equal(rows.length,2);
 assert.deepEqual(rows.find(x=>x.id===p.id).fields,['price']);
 assert.deepEqual(rows.find(x=>x.id===fx.id).fields,['fx']);
 assert.equal(JSON.stringify(m),original);
});
test('Legitimate 18-decimal dust rounding, zero quotes and EUR identity FX are not false positives',()=>{
 const {m,add}=fixture();
 const high=add('Rounded precision','crypto','EUR','0.000000000000000001');
 high.priceExact='100.000000000000000001';
 const zero=add('Zero price','crypto');zero.price=0;zero.priceExact='0';
 const eur=add('EUR ignoring FX','etf');eur.fxRateExact='3';
 assert.deepEqual(legacyQuoteDiscrepancies(m),[]);
});
test('Old v3 backup remains read-only under audit and preserves original economic history',()=>{
 const {m,add}=fixture();const p=add('Altkurs','etf');p.priceExact='70';
 snapshot(m,today,'Audit snapshot');const raw=backup(m);
 const restored=safeImport(JSON.parse(raw));
 const beforeAudit=JSON.stringify(restored);
 assert.equal(legacyQuoteDiscrepancies(restored).length,1);
 assert.equal(JSON.stringify(restored),beforeAudit,'Audit must never mutate the validated imported model');
 assert.equal(restored.positions[0].priceExact,'70');
 assert.equal(restored.snapshots[0].totalEURExact,'70','Historical snapshot value must remain preserved');
});
test('Provider evidence must be dated, positive, non-future and sufficiently recent',()=>{
 assert.equal(checked('101.25').exactValue,'101.25');
 assert.throws(()=>verifiedCurrentQuote(100,{source:'',date:today}),/Anbieterkurs/);
 assert.throws(()=>verifiedCurrentQuote(0,{source:'Provider',date:today}),/Anbieterkurs/);
 assert.throws(()=>verifiedCurrentQuote(100,{source:'Provider',date:'2010-01-01'}),/aktuellen/);
 assert.throws(()=>verifiedCurrentQuote(100,{source:'Provider',date:'invalid'}),/aktuellen/);
 const future=new Date(Date.now()+12*864e5).toISOString().slice(0,10);
 assert.throws(()=>verifiedCurrentQuote(100,{source:'Provider',date:future}),/aktuellen/);
});
test('Only explicit confirmed provider repair changes the current quote; journals and snapshots remain unchanged',()=>{
 const {m,add}=fixture();const p=add('Legacy Euro ETF','etf');p.priceExact='92';
 snapshot(m,today,'Unveränderte Historie');
 const previousSnapshots=structuredClone(m.snapshots),previousBookings=structuredClone(m.bookings);
 const verified=checked('103.75');
 assert.throws(()=>applyVerifiedQuoteRepair(m,p.id,'price',verified),/Bestätigung/);
 assert.equal(p.priceExact,'92');
 applyVerifiedQuoteRepair(m,p.id,'price',verified,{confirmed:true});
 assert.equal(p.price,103.75);assert.equal(p.priceExact,'103.75');
 assert.equal(p.quoteSource,'Verified Market');
 assert.equal(p.quoteAsOf,today);
 assert.equal(JSON.stringify(m.snapshots),JSON.stringify(previousSnapshots));
 assert.deepEqual(m.bookings,previousBookings);
 assert.deepEqual(legacyQuoteDiscrepancies(m),[]);
 assert.equal(safeImport(JSON.parse(backup(m))).positions[0].priceExact,'103.75');
});
test('FX repair corrects only current USD/EUR quote; any remaining price discrepancy stays visible',()=>{
 const {m,add}=fixture();const p=add('Two mismatches','etf','USD');
 p.priceExact='80';p.fxRateExact='0.7';
 assert.deepEqual(legacyQuoteDiscrepancies(m)[0].fields,['price','fx']);
 const repair=checked('0.94');
 applyVerifiedQuoteRepair(m,p.id,'fx',repair,{confirmed:true});
 assert.equal(p.fxRate,0.94);assert.equal(p.fxRateExact,'0.94');
 assert.equal(p.fxSource,'Verified Market');assert.equal(p.fxRateDate,today);
 assert.equal(p.priceExact,'80');
 assert.deepEqual(legacyQuoteDiscrepancies(m)[0].fields,['price']);
});
