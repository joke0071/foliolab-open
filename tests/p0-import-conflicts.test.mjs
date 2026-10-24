import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sourceDigest} from '../src/import-identity.js';
import {parseCSV,inferMapping,previewCSV,importCSV} from '../src/csv-import.js';
import {backup,safeImport,createPosition} from '../src/model.js';
import {fixture,csv,preview} from './p0-import-fixture.mjs';
test('Source digest agrees with independent Node SHA-256 for padding, Unicode and large inputs',()=>{
 for(const input of ['', 'abc', 'ä € 🧪', ...[55,56,63,64,65,1000,100000].map(n=>'a'.repeat(n))])assert.equal(sourceDigest(input),createHash('sha256').update(input).digest('hex'));
});
test('Same file with two indistinguishable rows retains both and repeats with zero additions after restore',()=>{
 const m=fixture(),p=csv('');p.rows.push({...p.rows[0]});const first=preview(m,p);
 assert.equal(first.ready,2);importCSV(m,first);assert.equal(m.bookings.length,2);
 assert.notEqual(m.bookings[0].importSource.fileId,m.bookings[1].importSource.fileId);
 const restored=safeImport(JSON.parse(backup(m))),again=preview(restored,p);
 assert.equal(again.issues.length,0);assert.equal(again.duplicates,2);assert.equal(importCSV(restored,again).imported,0);
});
test('An equal row in another file without an external ID is a conflict, not a silent duplicate',()=>{
 const m=fixture();importCSV(m,preview(m,csv('')));
 const other=parseCSV('date;type;position;quantity;price;notes\n2025-01-01;deposit;A;100;1;second export');
 const p=preview(m,other);assert.equal(p.duplicates,0);assert.equal(p.issues.length,1);assert.throws(()=>importCSV(m,p));assert.equal(m.bookings.length,1);
});
test('Legacy fingerprint alone cannot silently discard an independent booking',()=>{
 const m=fixture();importCSV(m,preview(m,csv('')));delete m.bookings[0].importSource;
 const p=preview(m,csv(''));assert.equal(p.duplicates,0);assert.equal(p.issues.length,1);
});
test('Manual no-ID correction survives an identical-file reimport',()=>{
 const m=fixture(),data=csv('');importCSV(m,preview(m,data));m.bookings[0].notes='Corrected';
 const p=preview(m,data);assert.equal(p.issues.length,1);assert.equal(p.duplicates,0);assert.equal(m.bookings[0].notes,'Corrected');
});
test('Invalid simulated quantities cannot bypass final journal reconciliation or partially commit',()=>{
 const m=fixture(),p=preview(m,csv()),before=JSON.stringify(m);
 p.simulated.positions[0].quantity=999;p.simulated.positions[0].quantityExact='999';
 assert.throws(()=>importCSV(m,p));assert.equal(JSON.stringify(m),before);
});
test('Stale preview and one bad row retain the whole original model',()=>{
 const m=fixture(),p=preview(m,csv());m.settings.autoRefresh=false;
 assert.throws(()=>importCSV(m,p),/Vorschau/);assert.equal(m.bookings.length,0);
 const data=csv();data.rows.push({...data.rows[0],id:'bad',quantity:'oops'});const invalid=preview(m,data),before=JSON.stringify(m);
 assert.equal(invalid.ready,1);assert.equal(invalid.issues.length,1);assert.throws(()=>importCSV(m,invalid));assert.equal(JSON.stringify(m),before);
});
test('Missing historical trade price is never substituted by the current quote',()=>{
 const m=fixture(),p=csv();p.rows[0].type='buy';p.rows[0].price='';
 const result=preview(m,p);assert.equal(result.ready,0);assert.match(result.issues[0].message,/Ausführungskurs fehlt/);
});
test('Unknown CSV costs stay null, cannot fabricate basis or debit real cash',()=>{
 const m=fixture();m.positions[0]=createPosition({providerId:m.providers[0].id,accountId:m.accounts[0].id,name:'Security',symbol:'A',kind:'etf',quantity:0,price:1},m);const data=csv('trade');data.rows[0].type='buy';
 const p=preview(m,data);assert.equal(p.ready,1);importCSV(m,p);
 assert.equal(m.bookings[0].feeEUR,null);assert.equal(m.bookings[0].taxEUR,null);
 assert.equal(m.positions[0].costBasisExact,null);assert.equal(m.positions[0].realizedPnLExact,null);
 const fresh=fixture();const blocked=previewCSV(fresh,data,inferMapping(data.headers),{cashPositionId:fresh.positions[1].id});
 assert.equal(blocked.ready,0);assert.match(blocked.issues[0].message,/Gebühren oder Steuern fehlen/);
 const restored=safeImport(JSON.parse(backup(m)));assert.equal(restored.bookings[0].feeEUR,null);
});
