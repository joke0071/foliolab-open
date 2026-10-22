import test from 'node:test';
import assert from 'node:assert/strict';
import {oldProviderQuote,valuationWarnings,valuationHeadline,valuationIssues} from '../src/valuation-status.js';
const now=Date.parse('2026-10-22T08:00:00Z');
const p=(props={})=>({quantityExact:'1',quantity:1,priceExact:'100',price:100,kind:'etf',valuationMode:'included',...props});
test('Derived snapshot price is not a stale market quote',()=>{
 const m={positions:[p({priceStatus:'Preis aus gesichertem Stichtagswert abgeleitet',updatedAt:'2026-10-01T00:00:00Z'})]};
 const info=valuationWarnings(m,now);
 assert.deepEqual(info,{missing:0,derived:1,review:0,outdated:0});
 assert.match(valuationHeadline(info),/1 mit zuletzt gespeichertem Wert/);
 assert.doesNotMatch(valuationHeadline(info),/veraltet/);
});
test('Provider quote ages only by quoteAsOf, not manual update timestamp',()=>{
 const m={positions:[
  p({quoteAsOf:'2026-10-01',updatedAt:'2026-10-22T07:00:00Z'}),
  p({updatedAt:'2026-09-01T00:00:00Z'}),
  p({quoteAsOf:'2026-10-21',updatedAt:'2026-10-01T00:00:00Z'})
 ]};
 const info=valuationWarnings(m,now);
 assert.equal(info.outdated,1);
 assert.equal(oldProviderQuote(m.positions[1],now),false);
 assert.match(valuationHeadline(info),/älter als 7 Tage/);
});
test('Missing prices, review and derived statuses have separate counts',()=>{
 const model={positions:[
  p({price:0,priceExact:'0'}),
  p({priceStatus:'Split geprüft'}),
  p({priceStatus:'Stichtagskurs abgeleitet'}),
  p({valuationMode:'excluded',price:0,priceExact:'0'}),
  p({quantity:0,quantityExact:'0',price:0,priceExact:'0'})
 ]};
 assert.deepEqual(valuationWarnings(model,now),{missing:1,derived:1,review:1,outdated:0});
 assert.match(valuationHeadline(valuationWarnings(model,now)),/1 ohne Kurs/);
 assert.equal(valuationHeadline(valuationWarnings({positions:[]},now)),null);
});

test('Warning drill-down identifies only affected position IDs',()=>{
 const model={positions:[
  p({id:'healthy',quoteAsOf:'2026-10-21'}),
  p({id:'missing',price:0,priceExact:'0'}),
  p({id:'old',quoteAsOf:'2026-10-01'}),
  p({id:'excluded',valuationMode:'excluded',price:0,priceExact:'0'})
 ]};
 assert.deepEqual(valuationIssues(model,now),[{id:'missing',type:'missing'},{id:'old',type:'outdated'}]);
 assert.deepEqual(valuationWarnings(model,now),{missing:1,derived:0,review:0,outdated:1});
});
