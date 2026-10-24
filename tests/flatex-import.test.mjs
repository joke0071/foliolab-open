import test from 'node:test';
import assert from 'node:assert/strict';
import {detectFlatexCSV,prepareFlatexImport,FLATEX_MAPPING} from '../src/flatex-import.js';
import {parseCSV} from '../src/csv-import.js';

const classicDepot=(rows=[])=>[
 'Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Buchungsinformationen;TA-Nr.;Kurs;Depot',
 ...rows
].join('\n');
const nextDepot=(rows=[])=>[
 'Buchungstag;Valuta;ISIN;Bezeichnung;Nominal (Stk.);Buchungsinformation;TA.-Nr.;Kurs',
 ...rows
].join('\n');
const nextAccount=(rows=[])=>[
 'Buchungstag;Valuta;Zahlungspfl.;Buchungsinformationen;TA.Nr.;Betrag',
 ...rows
].join('\n');
const upload=(text,name='flatex.csv')=>({text,name});
const B='IE00BK5BQT80';

test('detects supported classic and next Flatex exports without a filename heuristic',()=>{
 const classic=parseCSV(classicDepot(['20.10.2026;21.10.2026;'+B+';ETF;2;ORDER Kauf;4711;100,25;123']));
 const next=parseCSV(nextDepot(['20.10.2026;21.10.2026;'+B+';ETF;2;ORDER Kauf;4711;100,25']));
 const account=parseCSV(nextAccount(['20.10.2026;21.10.2026;AT0000;Dividendenzahlung;4999;15,25']));
 assert.equal(detectFlatexCSV(classic).variant,'classic');
 assert.equal(detectFlatexCSV(next).variant,'next');
 assert.equal(detectFlatexCSV(account).type,'account');
 assert.equal(detectFlatexCSV({headers:['whatever','Datum']}),null);
});
test('maps purchase and sale with strict decimal/date normalization',()=>{
 const r=prepareFlatexImport([upload(classicDepot([
  '20.10.2026;21.10.2026;'+B+';ETF;1.234,5;ORDER Kauf;11;123,456;A',
  '22.10.2026;23.10.2026;'+B+';ETF;-2,5;ORDER Verkauf;12;129,99;A'
 ]))]);
 assert.equal(r.parsed.rows.length,2);
 assert.deepEqual(r.parsed.rows.map(x=>x.type),['buy','sell']);
 assert.equal(r.parsed.rows[0].date,'2026-10-20');
 assert.equal(r.parsed.rows[0].quantity,'1234.5');
 assert.equal(r.parsed.rows[0].unitPrice,'123.456');
 assert.equal(r.parsed.rows[1].quantity,'2.5');
 assert.equal(r.parsed.rows[1].position,B);
 assert.equal(r.mapping.type,FLATEX_MAPPING.type);
 assert.equal(r.issues.length,0);
});
test('deduplicates referenced orders across different CSV exports',()=>{
 const row='20.10.2026;21.10.2026;'+B+';ETF;2;ORDER Kauf;4711;100,25;A';
 const r=prepareFlatexImport([upload(classicDepot([row]),'one.csv'),upload(classicDepot([row]),'two.csv')]);
 assert.equal(r.parsed.rows.length,1);
 assert.equal(r.duplicates,1);
 assert.equal(r.reports[1].duplicates,1);
});
test('identical rows without transaction ID require review, never silent merging',()=>{
 const row='20.10.2026;21.10.2026;'+B+';ETF;2;ORDER Kauf;;100,25;A';
 const r=prepareFlatexImport([upload(classicDepot([row,row]))]);
 assert.equal(r.parsed.rows.length,1);
 assert.equal(r.issues[0].code,'ambiguous-duplicate');
});
test('nontrade depot movements cannot become invented purchases',()=>{
 const r=prepareFlatexImport([upload(nextDepot([
  '20.10.2026;21.10.2026;'+B+';ETF;5;WP-Eingang;99;100',
  '22.10.2026;23.10.2026;'+B+';ETF;2;Split 1:2;100;0'
 ]))]);
 assert.equal(r.parsed.rows.length,0);
 assert.equal(r.issues.length,2);
 assert.equal(r.issues[0].code,'unsupported');
});
test('account settlements and income remain read-only until reconciled to a real cash account',()=>{
 const r=prepareFlatexImport([upload(nextAccount([
  '20.10.2026;21.10.2026;AT123;ORDER Kauf;80;-202,00',
  '23.10.2026;23.10.2026;AT123;Dividendenzahlung '+B+';81;12,35',
  '24.10.2026;24.10.2026;AT123;Kapitalertragsteuer;82;-3,39'
 ]))]);
 assert.equal(r.parsed.rows.length,0);
 assert.deepEqual(r.cashItems.map(x=>x.kind),['settlement','dividend','tax']);
 assert.equal(r.requiresCashReview,true);
});
test('rejects unknown formats instead of inferring a broker',()=>{
 assert.throws(()=>prepareFlatexImport([upload('date;amount\n2026-01-01;100')]),/kein unterstützter Flatex/);
});
test('invalid dates, quantities and ISINs are quarantined for review',()=>{
 const r=prepareFlatexImport([upload(classicDepot([
  '31.02.2026;01.03.2026;'+B+';ETF;2;ORDER Kauf;81;50;A',
  '20.10.2026;21.10.2026;INVALID;ETF;2;ORDER Kauf;82;50;A',
  '20.10.2026;21.10.2026;'+B+';ETF;abc;ORDER Kauf;83;50;A'
 ]))]);
 assert.equal(r.parsed.rows.length,0);
 assert.equal(r.issues.length,3);
 assert.ok(r.issues.every(x=>x.code==='invalid'));
});
test('cash exports never increase external cash flows implicitly',()=>{
 const r=prepareFlatexImport([upload(nextAccount([
  '20.10.2026;21.10.2026;AT123;Gutschrift;9;150,00'
 ]))]);
 assert.equal(r.parsed.rows.length,0);
 assert.equal(r.cashItems[0].kind,'unknown');
});

test('Flatex treats lone German dot-grouped amounts as thousands',()=>{
 const r=prepareFlatexImport([upload(classicDepot([
  '20.10.2026;21.10.2026;'+B+';ETF;1.234;ORDER Kauf;TX-1;1.234;A'
 ]))]);
 assert.equal(r.parsed.rows[0].quantity,'1234');
 assert.equal(r.parsed.rows[0].unitPrice,'1234');
});

test('overlapping account exports deduplicate only reference-identical movements',()=>{
 const line='20.10.2026;21.10.2026;AT123;Dividendenzahlung IE00BK5BQT80;TA-1;15,50';
 const r=prepareFlatexImport([upload(nextAccount([line]),'first.csv'),upload(nextAccount([line]),'second.csv')]);
 assert.equal(r.cashItems.length,1);
 assert.equal(r.duplicates,1);
 assert.equal(r.issues.length,0);
});
test('duplicate cash rows without an identifier trigger explicit review',()=>{
 const line='20.10.2026;21.10.2026;AT123;Dividendenzahlung IE00BK5BQT80;;15,50';
 const r=prepareFlatexImport([upload(nextAccount([line,line]))]);
 assert.equal(r.cashItems.length,1);
 assert.equal(r.duplicates,0);
 assert.equal(r.issues[0].code,'ambiguous-duplicate');
});
test('zero execution price is quarantined rather than treated as a free buy',()=>{
 const r=prepareFlatexImport([upload(classicDepot([
  '20.10.2026;21.10.2026;'+B+';ETF;2;ORDER Kauf;XYZ;0;123'
 ]))]);
 assert.equal(r.parsed.rows.length,0);
 assert.equal(r.issues[0].code,'invalid');
});

test('same broker reference with differing quantities cannot be silently imported twice',()=>{
 const r=prepareFlatexImport([upload(classicDepot([
  '20.10.2026;21.10.2026;'+B+';ETF;2;ORDER Kauf;TX-COLLIDE;100,25;A',
  '20.10.2026;21.10.2026;'+B+';ETF;3;ORDER Kauf;TX-COLLIDE;100,25;A'
 ]))]);
 assert.equal(r.parsed.rows.length,1);
 assert.equal(r.issues.length,1);
 assert.equal(r.issues[0].code,'ambiguous-duplicate');
 assert.match(r.issues[0].message,/abweichende Stückzahlen/);
});
test('same cash booking reference with altered amount is always quarantined',()=>{
 const r=prepareFlatexImport([upload(nextAccount([
  '20.10.2026;21.10.2026;AT123;ORDER Kauf '+B+';TX-COLLIDE;-200,50',
  '20.10.2026;21.10.2026;AT123;ORDER Kauf '+B+';TX-COLLIDE;-202,50'
 ]))]);
 assert.equal(r.cashItems.length,1);
 assert.equal(r.issues.length,1);
 assert.equal(r.issues[0].code,'ambiguous-duplicate');
 assert.match(r.issues[0].message,/widersprüchliche Beträge/);
});
