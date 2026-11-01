import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture,csv,preview} from './p0-import-fixture.mjs';
import {prepareCSVBatch,csvPreviewSummary,csvUndoReceipt,canUndoCSV,undoCSV} from '../src/csv-batch.js';
import {previewCSV,inferMapping,importCSV} from '../src/csv-import.js';
import {backup,safeImport,snapshot} from '../src/model.js';
const file=name=>({name,text:readFileSync(new URL('./fixtures/flh03/'+name,import.meta.url),'utf8')});
const batch=(m,files,options={})=>{const b=prepareCSVBatch(files);return previewCSV(m,b.parsed,inferMapping(b.parsed.headers),options);};
const row=(name,id='',qty='100')=>({name,text:`date;type;position;quantity;price;id\n2025-01-01;deposit;A;${qty};1;${id}`});
test('Multi-file overlap is chronological, exact, side-effect free and replay/restore idempotent',()=>{
 const m=fixture(),before=JSON.stringify(m),p=batch(m,[file('overlap.csv'),file('january.csv')]);
 assert.equal(p.ready,3);assert.equal(p.duplicates,1);assert.deepEqual(p.issues,[]);assert.equal(JSON.stringify(m),before);
 const summary=csvPreviewSummary(m,p);assert.equal(summary.impacts[0].afterExact,'90.123456789012345678');
 assert.equal(summary.coverage.from,'2025-01-01');assert.equal(summary.coverage.to,'2025-02-01');assert.equal(summary.coverage.complete,false);
 importCSV(m,p);const restored=safeImport(JSON.parse(backup(m)));
 const again=batch(restored,[file('january.csv'),file('overlap.csv')]);assert.equal(again.ready,0);assert.equal(again.duplicates,4);assert.deepEqual(again.issues,[]);
 assert.equal(m.journalEntries.length,3);assert.equal(m.positions[0].quantityExact,'90.123456789012345678');
});
test('No-ID original-file identity survives single file to batch, subset, order and restore',()=>{
 const m=fixture(),a=row('a.csv'),b={name:'b.csv',text:row('b.csv','','20').text.replaceAll(';A;',';B;')};
 const parsed=csv('');parsed.sourceName='a.csv';importCSV(m,preview(m,parsed));
 const p=batch(m,[b,a]);assert.equal(p.ready,1);assert.equal(p.duplicates,1);assert.deepEqual(p.issues,[]);importCSV(m,p);
 assert.equal(batch(safeImport(JSON.parse(backup(m))),[a]).duplicates,1);
});
test('Equal no-ID rows within a document remain distinct; other documents require review',()=>{
 const m=fixture(),a=row('a.csv');a.text+='\n2025-01-01;deposit;A;100;1;';
 const p=batch(m,[a]);assert.equal(p.ready,2);importCSV(m,p);assert.equal(m.positions[0].quantityExact,'200');
 const repeat=batch(m,[a]);assert.equal(repeat.duplicates,2);assert.equal(repeat.ready,0);
 const other=batch(fixture(),[row('a.csv'),row('b.csv')]);assert.equal(other.ready,1);assert.equal(other.duplicates,0);assert.equal(other.issues[0].code,'source-conflict');
 assert.equal(csvPreviewSummary(fixture(),other).conflicts,1);assert.throws(()=>importCSV(fixture(),other));
});
test('Repeated selection of the identical document does not create extra no-ID events',()=>{
 const m=fixture(),a=row('a.csv'),p=batch(m,[a,a,a]);assert.equal(p.ready,1);assert.equal(p.duplicates,2);assert.deepEqual(p.issues,[]);
});
test('Independent explicit equal purchases retain IDs; same ID in another account stays separate',()=>{
 const m=fixture(),p=batch(m,[row('a.csv','one'),row('b.csv','two'),{name:'c.csv',text:row('c.csv','one').text.replaceAll(';A;',';B;')}]);
 assert.equal(p.ready,3);assert.equal(p.duplicates,0);importCSV(m,p);assert.equal(m.positions[0].quantityExact,'200');assert.equal(m.positions[1].quantityExact,'100');
});
test('Conflicting IDs and manual changes block whole batch and preserve original',()=>{
 const m=fixture(),before=JSON.stringify(m),p=batch(m,[row('a.csv','one'),row('b.csv','one','101')]);
 assert.equal(p.issues[0].code,'source-conflict');assert.throws(()=>importCSV(m,p));assert.equal(JSON.stringify(m),before);
 importCSV(m,batch(m,[row('a.csv','one')]));m.bookings[0].notes='User correction';const corrected=JSON.stringify(m),again=batch(m,[row('a.csv','one')]);
 assert.equal(again.ready,0);assert.equal(again.issues[0].code,'source-conflict');assert.throws(()=>importCSV(m,again));assert.equal(JSON.stringify(m),corrected);
});
test('Mismatched formats, limits and malformed files fail before preview',()=>{
 assert.throws(()=>prepareCSVBatch([{name:'utf8.csv',text:'a;b\n'+ '€'.repeat(700000)+';x'}]),/2 MB/);
 assert.throws(()=>prepareCSVBatch([]));assert.throws(()=>prepareCSVBatch(Array(21).fill(row('a'))));
 assert.throws(()=>prepareCSVBatch([row('a'),{name:'b',text:'other;headers\na;b'}]),/dieselben Spalten/);
 assert.throws(()=>prepareCSVBatch([{name:'a',text:'a;b\n"unterminated'}]));
 const huge={name:'many',text:'date;type;position;quantity;price;id\n'+Array(3000).fill('2025-01-01;deposit;A;1;1;').join('\n')};
 assert.throws(()=>prepareCSVBatch([huge,huge]),/5.000/);
});
test('A later bad document, stale model and explicit skip cannot partially commit',()=>{
 const m=fixture(),p=batch(m,[row('a','one'),row('b','two','oops')]),before=JSON.stringify(m);
 assert.equal(p.ready,1);assert.throws(()=>importCSV(m,p));assert.equal(JSON.stringify(m),before);
 const skipped=batch(m,[row('a','one'),row('b','two','oops')],{skippedLines:[3]});assert.equal(skipped.skipped,1);assert.equal(skipped.ready,1);
 m.settings.autoRefresh=false;assert.throws(()=>importCSV(m,skipped),/Vorschau/);assert.equal(m.bookings.length,0);
});
test('Session undo restores exact pre-import data including snapshots and blocks every later mutation',()=>{
 const m=fixture(),before=JSON.stringify(m);importCSV(m,batch(m,[file('january.csv')]));snapshot(m);
 const receipt=csvUndoReceipt(before,m);assert.ok(canUndoCSV(m,receipt));
 for(const mutate of [n=>n.settings.alphaVantageKey='SYNTHETIC',n=>n.positions[0].price=22,n=>n.bookings[0].notes='edited']){
  const changed=structuredClone(m);mutate(changed);const state=JSON.stringify(changed);assert.throws(()=>undoCSV(changed,receipt),/gesperrt/);assert.equal(JSON.stringify(changed),state);
 }
 undoCSV(m,receipt);assert.equal(JSON.stringify(m),before);assert.equal(canUndoCSV(m,receipt),false);
});

test('Two documents settle trades exactly once and feed the existing FLH02 projection; encrypted restore retains identities',async()=>{
 const {blankModel,createProvider,createPosition}=await import('../src/model.js');
 const {projectHistoricalPortfolio}=await import('../src/historical-portfolio-value.js');
 const {createCompleteBackup,unpackCompleteBackup}=await import('../src/complete-backup.js');
 const {encryptBackup,decryptBackup}=await import('../src/crypto-backup.js');
 const m=blankModel();m.providers.push(createProvider({id:'provider',name:'Synthetic',type:'broker'}));
 m.positions.push(createPosition({id:'cash',providerId:'provider',name:'Cash',symbol:'EUR',kind:'cash',currency:'EUR',quantity:1000,price:1},m));
 m.positions.push(createPosition({id:'etf',providerId:'provider',name:'ETF',symbol:'ETF',kind:'etf',quantity:0,price:100},m));
 const head='date;type;position;quantity;price;fee;tax;cashPosition;id\n';
 const files=[{name:'sell.csv',text:head+'2023-01-03;sell;ETF;2;110;1;0;EUR;sell-1'},{name:'buy.csv',text:head+'2023-01-02;buy;ETF;6;100;1;0;EUR;buy-1'}];
 const p=batch(m,files);assert.deepEqual(p.issues,[]);assert.equal(p.ready,2);importCSV(m,p);
 assert.equal(m.positions.find(p=>p.id==='cash').quantityExact,'618');assert.equal(m.positions.find(p=>p.id==='etf').quantityExact,'4');
 assert.equal(m.bookings.length,2);assert.equal(m.journalEntries.length,2);
 m.openingPositions.find(p=>p.positionId==='cash').asOf='2023-01-01';
 m.priceHistories.etf={currency:'EUR',source:'CSV (selbst geprüft)',points:[{date:'2023-01-02',total:100},{date:'2023-01-03',total:110}]};
 const projected=projectHistoricalPortfolio(m);assert.equal(projected.days.find(d=>d.date==='2023-01-02').totalEURExact,'999');assert.equal(projected.days.find(d=>d.date==='2023-01-03').totalEURExact,'1058');
 m.settings.alphaVantageKey='SYNTHETIC_SECRET_CANARY';const plain=backup(m);assert.ok(!plain.includes('SYNTHETIC_SECRET_CANARY'));
 const payload=createCompleteBackup(JSON.parse(plain),{settings:m.settings,drive:{}});
 const encrypted=await encryptBackup(JSON.stringify(payload),'synthetic-test-password');assert.ok(!encrypted.includes('SYNTHETIC_SECRET_CANARY'));
 const recovered=unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(encrypted),'synthetic-test-password'))),restored=safeImport(recovered.data);
 assert.equal(recovered.configuration.settings.alphaVantageKey,'SYNTHETIC_SECRET_CANARY');assert.deepEqual(restored.bookings,m.bookings);
 assert.equal(batch(restored,files.reverse()).duplicates,2);assert.equal(batch(restored,files).ready,0);
});
