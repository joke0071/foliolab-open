import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {parseCSV,inferMapping,previewCSV,importCSV} from '../src/csv-import.js';
import {fixture,csv,preview} from './p0-import-fixture.mjs';
test('Source/account/external ID isolates accounts and preserves distinct IDs',()=>{
 const m=fixture();for(const p of [csv(),csv('tx-1','100','B'),csv('tx-2')])assert.equal(importCSV(m,preview(m,p)).imported,1);
 assert.equal(m.bookings.length,3);assert.notEqual(m.bookings[0].importSource.externalId,m.bookings[2].importSource.externalId);
});
test('Changed payload for an existing source ID conflicts, never inserts or overwrites',()=>{
 const m=fixture();importCSV(m,preview(m,csv()));const before=JSON.stringify(m),p=preview(m,csv('tx-1','101'));
 assert.equal(p.issues.length,1);assert.match(p.issues[0].message,/Quellkonflikt/);assert.throws(()=>importCSV(m,p));assert.equal(JSON.stringify(m),before);
});
test('Manual corrections to an imported booking are protected even on an identical reimport',()=>{
 const m=fixture();importCSV(m,preview(m,csv()));m.bookings[0].notes='Manually verified';
 const p=preview(m,csv());assert.match(p.issues[0].message,/Manuell/);assert.throws(()=>importCSV(m,p));assert.equal(m.bookings[0].notes,'Manually verified');
});
test('Provenance survives validated backup and repeat import; malformed account scope is rejected',()=>{
 const m=fixture();importCSV(m,preview(m,csv()));const restored=safeImport(JSON.parse(backup(m)));
 assert.deepEqual(restored.bookings[0].importSource,m.bookings[0].importSource);
 const again=preview(restored,csv());assert.equal(again.issues.length,0);assert.equal(again.duplicates,1);
 const bad=JSON.parse(backup(m));bad.bookings[0].importSource.accountId='wrong';assert.throws(()=>safeImport(bad),/Importherkunft/);
});
test('Legacy backups do not gain invented provenance',()=>{
 const m=fixture();importCSV(m,preview(m,csv()));delete m.bookings[0].importSource;
 const restored=safeImport(JSON.parse(backup(m)));assert.equal(restored.bookings[0].importSource,undefined);
});
