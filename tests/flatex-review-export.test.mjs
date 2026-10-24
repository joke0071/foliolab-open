import test from 'node:test';
import assert from 'node:assert/strict';
import {exportFlatexAuditCSV} from '../src/flatex-review-export.js';
import {prepareFlatexImport} from '../src/flatex-import.js';
import {parseCSV} from '../src/csv-import.js';

test('generates readable locally reviewable multi-file report without writing the portfolio',()=>{
 const d=['Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Buchungsinformationen;TA-Nr.;Kurs;Depot',
  '20.10.2026;21.10.2026;IE00BK5BQT80;ETF;2;ORDER Kauf;A;100,25;D1'].join('\n');
 const c=['Buchungstag;Valuta;Zahlungspfl.;Buchungsinformationen;TA.Nr.;Betrag',
  '20.10.2026;21.10.2026;AT123;ORDER Kauf IE00BK5BQT80;A;-201,50'].join('\n');
 const prepared=prepareFlatexImport([{name:'depot.csv',text:d},{name:'cash.csv',text:c}]);
 const original=JSON.stringify(prepared);
 const text=exportFlatexAuditCSV(prepared);
 assert.ok(text.startsWith('\uFEFF'));
 assert.match(text,/depot\.csv/);
 assert.match(text,/cash\.csv/);
 const parsed=parseCSV(text);
 assert.equal(parsed.rows.length,3);
 assert.equal(parsed.rows[0].Zeile,'2');
 assert.equal(parsed.rows[0].Bereich,'Depotumsatz');
 assert.equal(parsed.rows[1].Bereich,'Kontoumsatz');
 assert.match(parsed.rows[1].Status,/keine Geldbuchung/);
 assert.equal(JSON.stringify(prepared),original);
});
test('CSV formula injection from a statement memo or filename is neutralized',()=>{
 const prepared={
  parsed:{rows:[]},cashItems:[{file:'=HYPERLINK("bad")',line:2,date:'2026-10-20',
   reference:'A',account:'AT123',kind:'unknown',amount:'-1.25',details:'=1+1'}],
  issues:[{file:'evil.csv',line:2,code:'invalid',message:'@SUM(1,2)'}]
 };
 const out=exportFlatexAuditCSV(prepared);
 assert.match(out,/\x27=HYPERLINK/);
 assert.match(out,/\x27=1\+1/);
 assert.match(out,/\x27@SUM/);
 assert.throws(()=>exportFlatexAuditCSV(null),/Vorschau/);
});
