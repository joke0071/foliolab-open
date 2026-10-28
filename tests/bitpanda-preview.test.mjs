import test from 'node:test';
import assert from 'node:assert/strict';
import {readCSVRecords} from '../src/csv-records.js';
import {parseCSV} from '../src/csv-import.js';
import {parseBitpandaCSV,looksLikeBitpandaCSV,BITPANDA_HEADERS} from '../src/bitpanda-preview.js';
import {bitpandaCSV,bitpandaHeaders} from './bitpanda-fixture.mjs';
test('shared CSV lexer retains physical lines and quoted cells while generic adapter stays strict',()=>{
 const text='\uFEFFDate,Notes,Amount\r\n1999-01-02,"hello, ""world""\r\nnext",1\r\n\r\n1999-01-03,end,2';
 const r=readCSVRecords(text);assert.equal(r.delimiter,',');assert.deepEqual(r.records.map(r=>r.line),[1,2,5]);assert.equal(r.records[1].cells[1],'hello, "world"\r\nnext');
 assert.deepEqual(parseCSV(text,{sourceName:'synthetic'}),{delimiter:',',sourceName:'synthetic',headers:['Date','Notes','Amount'],rows:[{Date:'1999-01-02',Notes:'hello, "world"\r\nnext',Amount:'1'},{Date:'1999-01-03',Notes:'end',Amount:'2'}]});
 for(const text of ['a,a\n1,2',',b\n1,2','a,b\n1','a\n"open','a\n"closed"x','a\nb"x'])assert.throws(()=>parseCSV(text));
 assert.deepEqual(parseCSV('a\tb\n1\t2').rows,[{a:'1',b:'2'}]);assert.equal(parseCSV('a;b\n1;2').delimiter,';');assert.throws(()=>readCSVRecords('a\n1',{maxRecords:5022}));
});
test('native observed schema handles single/multicolumn preambles without leaking private preamble strings',()=>{
 const text='\uFEFF'+bitpandaCSV([{},{}],{preamble:['"SYNTHETIC PRIVATE\nOWNER"','Report,SYNTHETIC PRIVATE'],newline:'\r\n'}),d=parseBitpandaCSV(text);
 assert.deepEqual(BITPANDA_HEADERS,bitpandaHeaders);assert.equal(d.preambleRecords,2);assert.deepEqual(d.rows.map(r=>r.line),[5,6]);assert.equal(d.rows[0].values.Timestamp,'1999-01-02T12:00:00+01:00');assert.doesNotMatch(JSON.stringify(d),/PRIVATE|OWNER/);
 assert.equal(looksLikeBitpandaCSV(readCSVRecords(text,{delimiter:','})),true);assert.equal(looksLikeBitpandaCSV(readCSVRecords('date,type\n1999-01-01,buy')),false);
 assert.equal(parseBitpandaCSV(bitpandaCSV([{}],{preamble:[]})).rows[0].line,2);assert.equal(parseBitpandaCSV(bitpandaCSV([{}],{preamble:['','SYNTHETIC','','Report,SYNTHETIC']})).preambleRecords,2);
});
test('17-field variants preserve absent Tax Fiat distinctly from empty, dash and explicit zero',()=>{
 const d=parseBitpandaCSV(bitpandaCSV([{omitTax:true,'Transaction Type':'reward'},{omitTax:true,'Transaction Type':'transfer (stake)'},{omitTax:true,'Transaction Type':'transfer (unstake)'},{'Tax Fiat':''},{'Tax Fiat':'-'},{'Tax Fiat':'0'}]));
 assert.deepEqual(d.rows.map(r=>r.fieldCount),[17,17,17,18,18,18]);assert.deepEqual(d.rows.map(r=>r.values['Tax Fiat']),[null,null,null,'','-','0']);assert.deepEqual(d.rows.map(r=>r.numbers['Tax Fiat']),[null,null,null,null,null,'0']);assert.match(d.rows[0].issues.join(' '),/fehlt als Quellfeld/);
 for(const type of ['buy','sell','deposit','withdrawal','transfer','future'])assert.throws(()=>parseBitpandaCSV(bitpandaCSV([{omitTax:true,'Transaction Type':type}])));
 assert.throws(()=>parseCSV(bitpandaCSV([{},{omitTax:true,'Transaction Type':'reward'}],{preamble:[]})),/Spaltenanzahl/);
});
test('confirmed header order, exact widths and unique header never become permissive global padding',()=>{
 for(const headers of [bitpandaHeaders.slice(0,-1),[...bitpandaHeaders,'new'],[...bitpandaHeaders].reverse(),bitpandaHeaders.map(h=>h==='Tax Fiat'?'Fee':h)])assert.throws(()=>parseBitpandaCSV(bitpandaCSV([{}],{headers})));
 const csv=bitpandaCSV([{}],{preamble:[]});assert.throws(()=>parseBitpandaCSV(csv+'\n'+csv));assert.throws(()=>parseBitpandaCSV(csv+'\nshort,row'));assert.throws(()=>parseBitpandaCSV(bitpandaCSV([])));
});
test('native byte, preamble and row limits accept the boundary and reject overflow',()=>{
 assert.equal(parseBitpandaCSV(bitpandaCSV([{}],{preamble:Array(20).fill('SYNTHETIC')})).preambleRecords,20);assert.throws(()=>parseBitpandaCSV(bitpandaCSV([{}],{preamble:Array(21).fill('SYNTHETIC')})));
 assert.equal(parseBitpandaCSV(bitpandaCSV(Array.from({length:5000},()=>({})),{preamble:[]})).rows.length,5000);assert.throws(()=>parseBitpandaCSV(bitpandaCSV(Array.from({length:5001},()=>({})),{preamble:[]})));
 assert.throws(()=>parseBitpandaCSV('é'.repeat(1000001)));assert.throws(()=>parseBitpandaCSV(null));assert.throws(()=>parseCSV('a\n'+Array(5001).fill('1').join('\n')));
});
test('exact decimal observations and currencies never become prices, tax confirmations or EUR amounts',()=>{
 const d=parseBitpandaCSV(bitpandaCSV([{'Amount Asset':'9007199254740993.000000000000000001',Fee:'0.000000000000000001','Fee asset':'USD',Asset:'XXBT','Amount Fiat':'-500',Spread:'1.25','Spread Currency':'CHF'}]));const r=d.rows[0];
 assert.equal(r.numbers['Amount Asset'],'9007199254740993.000000000000000001');assert.equal(r.numbers.Fee,'0.000000000000000001');assert.equal(r.values['Fee asset'],'USD');assert.equal(r.values.Asset,'XXBT');assert.equal(r.numbers['Amount Fiat'],'-500');assert.equal(r.values['Spread Currency'],'CHF');assert.equal('feeEUR' in r,false);assert.equal('unitPrice' in r,false);assert.equal('total' in d,false);
});
test('unknown or invalid source numbers remain raw with null projections, never zero-filled',()=>{
 const r=parseBitpandaCSV(bitpandaCSV([{'Amount Fiat':'-','Amount Asset':'','Asset market price':'0.0000000000000000001',Fee:'1e-3','Fee percent':'0.1%',Spread:'NaN','Tax Fiat':'not known','Fee asset':''}])).rows[0];
 assert.ok(Object.values(r.numbers).every(v=>v===null));assert.equal(r.values.Fee,'1e-3');assert.match(r.issues.join(' '),/nicht exakt/);assert.match(r.issues.join(' '),/unbekannt/);
});
test('calendar and offset validation keeps raw timezone context without local date inference',()=>{
 for(const Timestamp of ['2000-02-29T23:59:59+14:00','1999-01-02T00:00:00-03:30','1999-01-02T12:00:00.123Z']){const r=parseBitpandaCSV(bitpandaCSV([{Timestamp}])).rows[0];assert.equal(r.values.Timestamp,Timestamp);assert.doesNotMatch(r.issues.join(' '),/Timestamp:/);}
 for(const Timestamp of ['1900-02-29T00:00:00+01:00','1999-02-30T12:00:00+01:00','1999-01-02T24:00:00+01:00','1999-01-02T12:00:60Z','1999-01-02T12:00:00','1999-01-02T12:00:00+14:01','1999-01-02T12:00:00+01:60'])assert.match(parseBitpandaCSV(bitpandaCSV([{Timestamp}])).rows[0].issues.join(' '),/Timestamp:/);
});
test('unknown source types and directions remain documentary, every original row survives',()=>{
 const types=['buy','sell','deposit','withdrawal','transfer','reward','transfer (stake)','transfer (unstake)','__proto__'];const d=parseBitpandaCSV(bitpandaCSV(types.map(type=>({'Transaction Type':type,'In/Out':'future'}))));
 assert.deepEqual(d.rows.map(r=>r.values['Transaction Type']),types);assert.ok(d.rows.every(r=>r.issues.some(i=>i.includes('Richtung'))));assert.match(d.rows.at(-1).issues.join(' '),/Unbekannter/);
});
test('duplicate/conflicting transaction IDs flag all rows and do not infer a counterleg or deduplicate',()=>{
 const d=parseBitpandaCSV(bitpandaCSV([{'Transaction ID':'SYN-SAME'},{'Transaction ID':'SYN-SAME'},{'Transaction ID':'SYN-CONFLICT'},{'Transaction ID':'SYN-CONFLICT',Fee:'2'},{'Transaction ID':'-'},{'Transaction ID':''}]));
 assert.equal(d.rows.length,6);assert.ok(d.rows.slice(0,2).every(r=>r.issues.some(i=>i.includes('Identische'))));assert.ok(d.rows.slice(2,4).every(r=>r.issues.some(i=>i.includes('Widersprüchliche'))));assert.ok(d.rows.slice(4).every(r=>r.issues.some(i=>i.includes('ID fehlt'))));
});
test('quoted hostile strings and embedded newlines are source data in a deeply immutable result',()=>{
 const csv=bitpandaCSV([{'Product ID':'<img src=x onerror=alert(1)>','Asset class':'Synthetic, "quoted"\nclass'},{}],{preamble:[]}),d=parseBitpandaCSV(csv);assert.deepEqual(d.rows.map(r=>r.line),[2,4]);assert.equal(d.rows[0].values['Product ID'],'<img src=x onerror=alert(1)>');
 assert.ok(Object.isFrozen(d)&&Object.isFrozen(d.rows)&&Object.isFrozen(d.rows[0])&&Object.isFrozen(d.rows[0].values)&&Object.isFrozen(d.rows[0].numbers)&&Object.isFrozen(d.rows[0].issues));assert.throws(()=>{d.rows[0].values.Fee='0';},TypeError);assert.equal(d.writeEnabled,false);assert.equal(d.ready,false);assert.equal('commit' in d,false);
});
