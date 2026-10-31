import test from 'node:test';import assert from 'node:assert/strict';
import {blankModel,createProvider,createPosition} from '../src/model.js';
import {positionQualityReview,structuredQualityReview} from '../src/position-quality-review.js';
const now=Date.parse('2026-10-31T12:00:00Z');
function fixture(){const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic scopes'}));const add=(id,values)=>{const p=createPosition({id,providerId:'p',name:id,kind:'etf',quantity:1,price:10,...values},m);m.positions.push(p);return p;};return {m,add};}
test('hero valuation and market provenance retain different scopes, including archived cash',()=>{
 const {m,add}=fixture();const cash=add('cash',{kind:'cash',price:0});cash.archived=true;
 const stale=add('stale');stale.quoteAsOf='2026-10-01';stale.quoteQuality='provider-timestamp';stale.quoteSource='Synthetic';
 const source=add('source-only');source.quoteAsOf='2026-10-30';
 add('zero',{quantity:0,price:0});const excluded=add('excluded',{price:0});excluded.valuationMode='excluded';
 const before=JSON.stringify(m),r=structuredQualityReview(m,now);
 assert.deepEqual(r.valuation.map(i=>i.id),['cash','stale']);assert.deepEqual(r.counts,{missing:1,derived:0,review:0,outdated:1});
 assert.equal(r.quoteSummary.total,2);assert.equal(r.quoteSummary.counts.stale,1);assert.equal(r.quoteSummary.counts.unverified,1);
 assert.equal(r.affectedCount,3);assert.equal(r.groups.find(g=>g.id==='source-only').issues[0].source,'Kursquellenprüfung');
 assert.equal(positionQualityReview(m,now).length,2,'existing financial review membership is not rewritten');assert.equal(JSON.stringify(m),before);
});
test('healthy, excluded and zero holdings do not create an empty hero warning',()=>{
 const {m,add}=fixture(),p=add('healthy');p.quoteAsOf='2026-10-30';p.quoteQuality='provider-timestamp';p.quoteSource='Synthetic';
 add('zero',{quantity:0,price:0});const x=add('alias',{price:0});x.valuationMode='excluded';
 const before=JSON.stringify(m),r=structuredQualityReview(m,now);assert.equal(r.valuation.length,0);assert.equal(r.groups.length,0);assert.equal(r.quoteSummary.counts.confirmed,1);assert.equal(JSON.stringify(m),before);
});
test('derived, unclear, undated and future quotes keep their evidence and deduplicate identities',()=>{
 const {m,add}=fixture(),derived=add('derived'),unclear=add('unclear'),undated=add('undated'),future=add('future');
 derived.priceStatus='Aus Stichtag abgeleitet';unclear.priceStatus='Neue Börsenzuordnung: Kurs prüfen';undated.quoteAsOf=null;future.quoteAsOf='2026-11-04';
 const before=JSON.stringify(m),r=structuredQualityReview(m,now);
 assert.deepEqual(r.counts,{missing:0,derived:1,review:1,outdated:0});assert.equal(r.affectedCount,4);assert.equal(new Set(r.groups.map(g=>g.id)).size,4);
 assert.equal(r.quoteSummary.counts.derived,1);assert.equal(r.quoteSummary.counts.review,2);assert.equal(r.quoteSummary.counts.undated,1);
 assert.match(r.groups.find(g=>g.id==='undated').issues[0].label,/Kursdatum/);assert.match(r.groups.find(g=>g.id==='future').issues[0].label,/Kursdatum prüfen/);assert.equal(JSON.stringify(m),before);
});
