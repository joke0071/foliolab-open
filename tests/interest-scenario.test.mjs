import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateInterestScenario,normalizeInterestTerms,interestDayNumber,currencyInterestDigits} from '../src/interest-scenario.js';
const references=JSON.parse(readFileSync(new URL('./fixtures/interest-reference.json',import.meta.url),'utf8'));
const rate=(fromDate='2026-01-01',annualRateExact='2.5',knownThrough=null)=>({fromDate,annualRateExact,knownThrough});
const terms=(rates=[rate()],dayCount='ACT/365F')=>({version:1,dayCount,rates});
const input=extra=>({principal:'10000',currency:'EUR',asOf:'2026-01-01',startDate:'2026-01-01',endDate:'2027-01-01',terms:terms(),allowScenario:true,...extra});
for(const row of references)test('independent Python Fraction reference: '+row.name,()=>{
 const before=JSON.stringify(row);
 const result=calculateInterestScenario({...row,terms:terms(row.rates,row.dayCount),allowScenario:true});
 assert.equal(result.grossExact,row.expectedGrossExact);assert.equal(result.totalDays,row.expectedDays);
 // Compare the complete unrounded rational, not just the rounded money.
 assert.equal(BigInt(result.numerator)*BigInt(row.expectedRational.denominator),BigInt(row.expectedRational.numerator)*BigInt(result.denominator));
 assert.equal(JSON.stringify(row),before);
});
test('rates normalized chronologically, decimal strings canonical and duplicate/overlap refused',()=>{
 const raw=terms([rate('2026-05-01','2,00'),rate('2026-01-01','2.5','2026-04-30')]);
 assert.deepEqual(normalizeInterestTerms(raw),terms([rate('2026-01-01','2.5','2026-04-30'),rate('2026-05-01','2')]));
 assert.throws(()=>normalizeInterestTerms(terms([rate(),rate()])),/doppelt/i);
 assert.throws(()=>normalizeInterestTerms(terms([rate('2026-01-01','2.5','2026-05-01'),rate('2026-05-01')])),/überlapp/i);
 for(const bad of [[],true,{version:2},terms([]),terms([rate('2026-02-29')]),terms([rate('2026-01-01','101')]),terms([rate('2026-01-01','-101')]),terms([rate('2026-01-01','')]),terms([rate('2026-01-01',true)]),terms([rate('2026-01-01','2.5','2025-12-31')])])assert.throws(()=>normalizeInterestTerms(bad));
 assert.equal(normalizeInterestTerms(null),null);
});
test('no unknown convention, missing rate, reverse fill or unconfirmed carry without explicit consent',()=>{
 assert.throws(()=>calculateInterestScenario(input({terms:null})),/Zinssatz/);
 assert.throws(()=>calculateInterestScenario(input({terms:terms([rate()],'unknown')})),/Zinsmethode/);
 assert.throws(()=>calculateInterestScenario(input({terms:terms([rate('2026-01-02')])})),/Start/);
 assert.throws(()=>calculateInterestScenario(input({allowScenario:false})),/Szenario/);
 assert.throws(()=>calculateInterestScenario(input({allowScenario:'false'})),/Zustimmung/);
 const result=calculateInterestScenario(input());
 assert.equal(result.segments.length,2);assert.equal(result.segments[0].scenario,false);assert.equal(result.segments[0].days,1);
 assert.equal(result.segments[1].scenario,true);assert.equal(result.usesScenario,true);
});
test('inclusive known-through and later change produce explicit future gaps and no guaranteed rates',()=>{
 const t=terms([rate('2026-01-01','2.5','2026-01-05'),rate('2026-01-10','2','2026-01-31')]);
 const result=calculateInterestScenario(input({terms:t,endDate:'2026-02-01'}));
 assert.deepEqual(result.segments.map(x=>[x.fromDate,x.endDate,x.days,x.scenario]),[
  ['2026-01-01','2026-01-06',5,false],['2026-01-06','2026-01-10',4,true],['2026-01-10','2026-02-01',22,false]]);
 assert.throws(()=>calculateInterestScenario(input({terms:t,endDate:'2026-02-01',allowScenario:false})),/Szenario/);
 const complete=calculateInterestScenario(input({terms:terms([rate('2026-01-01','2.5','2026-12-31')]),allowScenario:false}));
 assert.equal(complete.usesScenario,false);assert.equal(complete.grossExact,'250.00');
});
test('real dates, DST, leap and boundaries never turn current capital into a historical balance',()=>{
 assert.equal(interestDayNumber('2026-03-30')-interestDayNumber('2026-03-28'),2);
 assert.equal(interestDayNumber('2024-03-01')-interestDayNumber('2024-02-28'),2);
 for(const extra of [{asOf:'2026-02-30'},{startDate:'2025-12-31'},{endDate:'2026-01-01'},{endDate:'2025-12-31'},{endDate:'2037-01-01'}])assert.throws(()=>calculateInterestScenario(input(extra)));
 for(const principal of ['-1',null,'',true,NaN,'1.2.3'])assert.throws(()=>calculateInterestScenario(input({principal})));
});
test('currency minor units explicit, unsupported codes fail closed without an EUR conversion',()=>{
 assert.equal(currencyInterestDigits('EUR'),2);assert.equal(currencyInterestDigits('PLN'),2);assert.equal(currencyInterestDigits('JPY'),0);assert.equal(currencyInterestDigits('KWD'),3);
 for(const currency of ['ZZZ','XXX','XAU','eur',null])assert.throws(()=>calculateInterestScenario(input({currency})));
 const result=calculateInterestScenario(input({currency:'USD'}));assert.equal(result.currency,'USD');assert.equal(Object.hasOwn(result,'amountEUR'),false);
});
