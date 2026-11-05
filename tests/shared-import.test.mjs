import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,economic} from './shared-import-fixture.mjs';
import {readSharedImportFiles,previewSharedImport,confirmSharedImport} from '../src/shared-import.js';
import {backup,safeImport} from '../src/model.js';
import {csvUndoReceipt,undoCSV} from '../src/csv-batch.js';
const expected={wallet:'0.0248',p0:'100',p1:'3',p2:'0.00000083',bp0:'3.1',bp1:'99',etf:'2',cash:'78.25'};
const perms=a=>a.length?a.flatMap((v,i)=>perms(a.filter((_,j)=>i!==j)).map(p=>[v,...p])):[[]];
test('five native providers: 120 file orders, one complete draft, overlaps, restore, replay and exact undo',()=>{
 let canonical;
 for(const order of perms(['bittr','ledger','kraken','bitpanda','flatex'])){
  const f=fixture(),before=JSON.stringify(f.m),files=order.flatMap(k=>f.files.filter(file=>file.name.includes(k))),sources=readSharedImportFiles(files);
  const plan=previewSharedImport(f.m,sources,f.choices,{at:'2026-11-05T13:00:00Z'});assert.equal(JSON.stringify(f.m),before);assert.equal(plan.changed,true);
  const m=confirmSharedImport(f.m,sources,f.choices,plan,{confirmed:true,backupConfirmed:true});
  assert.deepEqual(Object.fromEntries(m.positions.map(p=>[p.id,p.quantityExact])),expected);assert.equal(m.bookings.length,6);assert.equal(m.externalCashFlows.length,1);assert.equal(m.externalCashFlows[0].amountExactEUR,'1000');
  assert.equal(m.bookings.find(b=>b.notes.startsWith('Kraken-Gebühr')).quantityExact,'0.00000017');assert.equal(m.bookings.find(b=>b.netSettlement).feeEUR,null);assert.equal(m.bookings.find(b=>b.netSettlement).taxEUR,null);
  const state=economic(m);if(canonical)assert.deepEqual(state,canonical);else canonical=state;
  const restored=safeImport(JSON.parse(backup(m,{includeHistory:true})));assert.deepEqual(economic(restored),state);
  const repeat=previewSharedImport(restored,sources,f.choices);assert.equal(repeat.changed,false);assert.throws(()=>confirmSharedImport(restored,sources,f.choices,repeat,{confirmed:true,backupConfirmed:true}),/keine neuen/);
  undoCSV(m,csvUndoReceipt(before,m));assert.equal(JSON.stringify(m),before);
 }
});
test('any blocked provider cancels the whole draft; baseline, choices, source, consent and prepared draft are bound',()=>{
 const f=fixture(),sources=readSharedImportFiles(f.files),before=JSON.stringify(f.m),p=previewSharedImport(f.m,sources,f.choices);
 for(const flags of [{},{confirmed:true},{backupConfirmed:true}])assert.throws(()=>confirmSharedImport(f.m,sources,f.choices,p,flags));
 const c=structuredClone(f.choices);c.bitpanda.expectedClosing.bp0='999';assert.throws(()=>previewSharedImport(f.m,sources,c),/Bitpanda/);assert.equal(JSON.stringify(f.m),before);
 f.m.settings.showSmall=!f.m.settings.showSmall;assert.throws(()=>confirmSharedImport(f.m,sources,f.choices,p,{confirmed:true,backupConfirmed:true}),/erneut/);f.m=JSON.parse(before);
 assert.throws(()=>confirmSharedImport(f.m,sources,c,p,{confirmed:true,backupConfirmed:true}),/erneut/);
 const changed=structuredClone(sources);changed.files[0].name='changed';assert.throws(()=>confirmSharedImport(f.m,changed,f.choices,p,{confirmed:true,backupConfirmed:true}),/erneut/);
 p.simulated.positions[0].quantityExact='0';assert.throws(()=>confirmSharedImport(f.m,sources,f.choices,p,{confirmed:true,backupConfirmed:true}),/Entwurf/);
 assert.equal(JSON.stringify(f.m),before);
});
test('unsupported, oversized, and mixed malformed files never silently drop a source',()=>{
 const f=fixture();assert.throws(()=>readSharedImportFiles([...f.files,{name:'unknown.csv',text:'a,b\n1,2'}]),/Nicht unterstützt/);
 assert.throws(()=>readSharedImportFiles(Array(21).fill(f.files[0])),/20/);
 assert.throws(()=>readSharedImportFiles([{name:'large.csv',text:'x'.repeat(2000001)}]),/2 MB/);
});
