import test from 'node:test';
import assert from 'node:assert/strict';
import {historicalNumber} from '../src/booking-history-ui.js';
import {annualOverviewMarkup} from '../src/booking-insights-ui.js';
import {bookedAnnualOverview} from '../src/booking-insights.js';
import {blankModel} from '../src/model.js';
test('490 documentary income rows retain400 unknowns,90EUR evidence and exact model identity in compact display',()=>{
 const m=blankModel();m.bookings=Array.from({length:490},(_,i)=>({id:'synthetic-income-'+i,date:'2026-01-02',type:'dividend',...(i<90?{amountEUR:1,amountExactEUR:'1'}:{})}));
 const before=JSON.stringify(m),report=bookedAnnualOverview(m),html=annualOverviewMarkup(m);
 assert.equal(report.records.length,490);assert.equal(report.unavailable,400);assert.equal(report.netExactEUR,'90');
 assert.match(html,/400 Einzelposten ohne eindeutigen EUR-Betrag bleiben offen/);assert.match(html,/Einzelposten \(490\)/);assert.match(html,/<dl class="income-totals">/);assert.equal(JSON.stringify(m),before);
 assert.match(html,/unvollständig/);assert.match(html,/Betrag unbekannt/);
});

test('Historical display rounds only for reading, preserves nonzero tiny values and locale grouping',()=>{
 assert.equal(historicalNumber('2.123456789'),'2,1234568');
 assert.equal(historicalNumber('0.000000000001'),'1E-12');
 assert.equal(historicalNumber('-0.000000000001'),'-1E-12');
 assert.match(historicalNumber('123456789.123456789'),/^123[.\u00a0\u202f]456[.\u00a0\u202f]790$/);
 assert.equal(historicalNumber('0'),'0');
});
