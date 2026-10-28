import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {flatexNativeMarkup} from '../src/flatex-native-ui.js';
import {nativeFlatexCSV as csv} from './flatex-native-fixture.mjs';
test('native source UI escapes source/file strings and keeps declared units/currencies/references',()=>{
 const documents=[{name:'<svg onload=alert(1)>',document:parseFlatexNativeCSV(csv('depot',[{4:'<img src=x>',5:'0,000000000000000001'},{5:'-'}]))},{name:'synthetic-cash.csv',document:parseFlatexNativeCSV(csv('account',[{7:'CHF'}]))}];
 const html=flatexNativeMarkup(documents);assert.doesNotMatch(html,/<svg|<img/);assert.match(html,/&lt;svg/);assert.match(html,/&lt;img/);assert.match(html,/0.000000000000000001 Stk/);assert.match(html,/-3086.25 CHF/);assert.match(html,/Nominal laut Export: unbekannt/);assert.match(html,/00070000000000000001/);assert.match(html,/0009007199254740993/);assert.match(html,/2 Depotzeilen · 1 Kontozeilen/);assert.match(html,/ohne Spaltenüberschrift/);
});
test('source UI bounds rows globally across documents, preserves overlaps and rejects unsafe counts',()=>{
 const d=parseFlatexNativeCSV(csv('depot',Array.from({length:30},()=>({}))));const documents=[{name:'synthetic-a.csv',document:d},{name:'synthetic-b.csv',document:d}];
 const html=flatexNativeMarkup(documents);assert.equal((html.match(/class="performance-details"/g)||[]).length,50);assert.match(html,/Weitere 10/);assert.match(html,/Überlappungen bleiben getrennt/);assert.doesNotMatch(flatexNativeMarkup(documents,{limit:100}),/flatexNativeShowMore/);assert.equal(d.rows.length,30);
 for(const limit of [0,5001,1.5,NaN])assert.throws(()=>flatexNativeMarkup(documents,{limit}));assert.throws(()=>flatexNativeMarkup([{name:'bad',document:{...d,writeEnabled:true}}]));assert.throws(()=>flatexNativeMarkup(Array(21).fill(documents[0])));assert.throws(()=>flatexNativeMarkup([]));assert.throws(()=>flatexNativeMarkup([{name:'too-many.csv',document:{...d,rows:Array(5001).fill(d.rows[0])}}]));
});
