import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBitpandaCSV} from '../src/bitpanda-preview.js';
import {bitpandaMarkup} from '../src/bitpanda-preview-ui.js';
import {bitpandaCSV} from './bitpanda-fixture.mjs';
test('Bitpanda display escapes hostile fields, preserves exact units and unknown tax without leaking preamble',()=>{
 const d=parseBitpandaCSV(bitpandaCSV([{'Product ID':'<img src=x onerror=alert(1)>','Amount Asset':'0.000000000000000001','Fee asset':'USD',Fee:'2.5'},{'Transaction Type':'reward',omitTax:true},{'Tax Fiat':'0'}]));
 const html=bitpandaMarkup(d);assert.doesNotMatch(html,/<img|SYNTHETIC OWNER/);assert.match(html,/&lt;img/);assert.match(html,/0.000000000000000001/);assert.match(html,/2.5 USD/);assert.match(html,/Tax Fiat laut Export: unbekannt \(Quellfeld fehlt\)/);assert.match(html,/Tax Fiat laut Export: 0/);assert.match(html,/kein bestätigter Steuerwert/);
});
test('Bitpanda display bounds DOM rows and offers next page without dropping source rows',()=>{
 const d=parseBitpandaCSV(bitpandaCSV(Array.from({length:75},()=>({}))));const html=bitpandaMarkup(d);
 assert.equal((html.match(/class="performance-details"/g)||[]).length,50);assert.match(html,/bitpandaShowMore/);assert.match(html,/Weitere 25/);assert.doesNotMatch(bitpandaMarkup(d,{limit:100}),/bitpandaShowMore/);assert.equal(d.rows.length,75);
 for(const limit of [0,-1,5001,1.5,NaN])assert.throws(()=>bitpandaMarkup(d,{limit}));assert.throws(()=>bitpandaMarkup({...d,writeEnabled:true}));
});
