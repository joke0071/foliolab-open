import test from 'node:test';
import assert from 'node:assert/strict';
import {readCSVRecords} from '../src/csv-records.js';
import {parseCSV} from '../src/csv-import.js';
import {parseFlatexNativeCSV,readFlatexNativeBytes,looksLikeFlatexNativeCSV} from '../src/flatex-native.js';
import {nativeFlatexCSV as csv,syntheticCP1252,depotHeaders,accountHeaders} from './flatex-native-fixture.mjs';

test('native positional schemas retain all blank columns and distinct bank/order/account references',()=>{
 const d=parseFlatexNativeCSV(csv()),c=parseFlatexNativeCSV(csv('account'));
 assert.equal(d.type,'depot');assert.equal(c.type,'account');assert.deepEqual(d.columns.map(x=>x.header),depotHeaders);assert.deepEqual(c.columns.map(x=>x.header),accountHeaders);
 const r=d.rows[0];assert.equal(r.values.number,'0007');assert.equal(r.values.unit,'Stk.');assert.equal(r.values.priceCurrency,'EUR');assert.equal(r.values.transactionReference,'00070000000000000001');assert.equal(r.order.reference,'0009007199254740993');assert.notEqual(r.order.reference,r.values.transactionReference);
 assert.equal(c.rows[0].values.counterpartyAccount,'SYN-COUNTERPARTY');assert.equal(c.rows[0].values.originatorAccount,'SYN-ORIGIN');assert.equal(c.rows[0].values.account,'SYN-ACCOUNT');assert.equal(c.rows[0].numbers.amount,'-3086.25');assert.equal(r.fields.length,12);
 assert.equal(looksLikeFlatexNativeCSV(readCSVRecords(csv(),{delimiter:';'})),true);assert.equal(looksLikeFlatexNativeCSV(readCSVRecords('date;type\n1999-01-01;buy')),false);
 assert.throws(()=>parseCSV(csv()),/Leere oder doppelte/); // Generic contract remains strict.
});
test('actual byte decoding distinguishes UTF-8 and CP1252, including euro, umlauts and BOM',()=>{
 const text=csv('depot',[{4:'Öl, Größe und €'}]);
 for(const [bytes,encoding]of [[new TextEncoder().encode(text),'utf-8'],[syntheticCP1252(text),'windows-1252'],[new TextEncoder().encode('\ufeff'+text),'utf-8']]){
  const r=readFlatexNativeBytes(bytes);assert.equal(r.encoding,encoding);assert.equal(r.rows[0].values.description,'Öl, Größe und €');assert.doesNotMatch(JSON.stringify(r),/\ufffd/);
 }
 for(const bytes of [new Uint8Array([255,254,65,0]),new Uint8Array([254,255]),new Uint8Array([0,0,254,255]),new Uint8Array(2_000_001),null])assert.throws(()=>readFlatexNativeBytes(bytes));
 assert.throws(()=>parseFlatexNativeCSV(text+'\u0000'));assert.throws(()=>parseFlatexNativeCSV(csv('depot',[{4:'broken\ufffd'}])));
});
test('CP1252 C1 bytes have standard euro/punctuation/letter meanings across runtimes',()=>{
 const text=csv('depot',[{4:'SYN-BYTES'}]),[prefix,suffix]=text.split('SYN-BYTES');
 const bytes=new Uint8Array([...syntheticCP1252(prefix),...Array.from({length:32},(_,i)=>128+i),...syntheticCP1252(suffix)]);
 const row=readFlatexNativeBytes(bytes).rows[0];
 assert.equal(row.values.description,'€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ');
 assert.match(row.issues.join(' '),/description: ungewöhnliches/);
});
test('German exact decimal projections retain signs, grouping and unknown versus explicit zero',()=>{
 const d=parseFlatexNativeCSV(csv('depot',[{5:'-9.007.199.254.740.993,000000000000000001',9:'1.234'},{5:'-',9:''},{5:'0',9:'0'},{5:'1,0000000000000000001',9:'1.23'},{5:'1e3',9:'1,2.3'}]));
 assert.equal(d.rows[0].numbers.nominal,'-9007199254740993.000000000000000001');assert.equal(d.rows[0].numbers.rate,'1234');assert.deepEqual(d.rows[1].numbers,{nominal:null,rate:null});assert.deepEqual(d.rows[2].numbers,{nominal:'0',rate:'0'});
 for(const r of d.rows.slice(3)){assert.deepEqual(r.numbers,{nominal:null,rate:null});assert.match(r.issues.join(' '),/nicht exakt/);}assert.equal(d.rows[0].values.nominal,'-9.007.199.254.740.993,000000000000000001');
 const noCurrency=parseFlatexNativeCSV(csv('account',[{7:''}])).rows[0];assert.equal(noCurrency.values.amountCurrency,'');assert.match(noCurrency.issues.join(' '),/keine Annahme/);assert.equal('amountEUR' in noCurrency,false);
});
test('booking and value dates are independently calendar checked, never inferred from each other',()=>{
 const d=parseFlatexNativeCSV(csv('depot',[{1:'29.02.2000',2:'01.03.2000'},{1:'29.02.1900',2:'31.04.1999'},{1:'1999-01-02',2:''}]));
 assert.deepEqual(d.rows[0].dates,{bookingDate:'2000-02-29',valueDate:'2000-03-01'});for(const r of d.rows.slice(1))assert.deepEqual(r.dates,{bookingDate:null,valueDate:null});
});
test('documentary events and cancellations survive without trade or cashflow creation',()=>{
 const events=['ABR ORDER Kauf IE00SYNTH001 0001','ABR ORDER Verkauf IE00SYNTH001 0002','Thesaurierung','Lagerstellenwechsel','Split 1:2','Fusion','Storno Fusion','Storno ORDER Kauf IE00SYNTH001 0003','Future unknown'];
 const d=parseFlatexNativeCSV(csv('depot',events.map(e=>({7:e}))));assert.deepEqual(d.rows.map(r=>r.kind),['order-buy','order-sell','accumulation','custody-change','split','merger','fusion-cancellation','cancellation','unclassified']);
 assert.equal(d.ready,false);assert.equal(d.writeEnabled,false);assert.equal('parsed' in d,false);assert.equal('sourceTrades' in d,false);assert.equal('commit' in d,false);assert.equal(d.rows.length,events.length);
 assert.equal(parseFlatexNativeCSV(csv('depot',[{7:'ORDER Kauf IE00SYNTH002 0001'}])).rows[0].issues.some(s=>s.includes('widerspricht')),true);
 for(const details of ['ORDER Kauf IE00SYNTH001','ORDER Kauf IE00SYNTH001 0001 extra','ORDER Kauf unknown 0001'])assert.equal(parseFlatexNativeCSV(csv('depot',[{7:details}])).rows[0].order,null);
});
test('duplicate/conflicting bank references flag every row and preserve every field',()=>{
 const d=parseFlatexNativeCSV(csv('depot',[{}, {},{8:'OTHER'},{8:'OTHER',5:'2'},{8:''},{8:'-'}]));assert.equal(d.rows.length,6);
 assert.ok(d.rows.slice(0,2).every(r=>r.issues.some(s=>s.includes('Identische'))));assert.ok(d.rows.slice(2,4).every(r=>r.issues.some(s=>s.includes('Widersprüchliche'))));assert.ok(d.rows.slice(4).every(r=>r.issues.some(s=>s.includes('fehlt'))));
});
test('strict header positions, exact widths and repeated headers fail closed',()=>{
 for(const headers of [depotHeaders.slice(1),[...depotHeaders].reverse(),depotHeaders.map((h,i)=>i===6?'Einheit':h),[...depotHeaders,'extra']])assert.throws(()=>parseFlatexNativeCSV(csv('depot',[{}],{headers})));
 const text=csv();for(const input of [text+';extra',text+'\nshort;row',text+'\n'+text,depotHeaders.join(';')])assert.throws(()=>parseFlatexNativeCSV(input));
});
test('bounded rows/size, multiline source provenance, immutable output and hostile strings',()=>{
 const d=parseFlatexNativeCSV('\ufeff'+csv('depot',[{4:'<img onerror=alert(1)>; "source"\r\nnext'},{4:'two'}],{newline:'\r\n'}));assert.deepEqual(d.rows.map(r=>r.line),[2,4]);assert.match(d.rows[0].values.description,/<img/);
 assert.ok(Object.isFrozen(d)&&Object.isFrozen(d.columns)&&Object.isFrozen(d.columns[0])&&Object.isFrozen(d.rows)&&Object.isFrozen(d.rows[0])&&Object.isFrozen(d.rows[0].fields)&&Object.isFrozen(d.rows[0].values)&&Object.isFrozen(d.rows[0].numbers)&&Object.isFrozen(d.rows[0].dates)&&Object.isFrozen(d.rows[0].order)&&Object.isFrozen(d.rows[0].issues));
 assert.throws(()=>{d.rows[0].values.nominal='0';},TypeError);
 assert.equal(parseFlatexNativeCSV(csv('account',Array.from({length:5000},(_,i)=>({5:'SYN-'+i})))).rows.length,5000);assert.throws(()=>parseFlatexNativeCSV(csv('account',Array.from({length:5001},()=>({})))));assert.throws(()=>parseFlatexNativeCSV('é'.repeat(1_000_001)));
});
