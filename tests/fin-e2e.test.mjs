import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,steps,advance,financialState,oracle,cashCSV,transferCSV,previewFile,removeRequest,correctRequest,imported,password,fxSteps,advanceFX,financialStateFX,fxOracle,fxCSV,fxSaleCSV} from './fin-e2e-scenario.mjs';
import {safeImport,backup} from '../src/model.js';
import {prepareBookingChange,previewBookingChange,prepareBookingUndo} from '../src/booking-management.js';
import {previewPositionRemoval} from '../src/position-selection.js';
import {previewTransferMatch,confirmTransferMatch} from '../src/transactions.js';
import {importCSV} from '../src/csv-import.js';
import {createCompleteBackup,unpackCompleteBackup} from '../src/complete-backup.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';
import {performanceIssues} from '../src/performance.js';

test('FIN-E2E01 oracle v1: import/correction/transfer/delete/undo/reimport/archive/trade/history/encrypted restore',async()=>{
 let m=seed(),receipt,matched;
 const originalOpenings=structuredClone(m.openingPositions);
 assert.deepEqual(financialState(m),oracle.seed);
 for(const step of steps){
  const before=JSON.stringify(m),result=advance(m,step,receipt);m=result.model;receipt=result.receipt;
  assert.deepEqual(financialState(m),oracle[step],step);
  assert.deepEqual(m.openingPositions,originalOpenings,step+' never rewrites opening evidence');
  const sequences=m.journalEntries.map(e=>e.sequence);assert.equal(new Set(sequences).size,sequences.length,step+' unique journal sequences');
  if(step==='match')matched=structuredClone(m);
  if(step==='undo')assert.deepEqual(m,matched,'undo restores every field, not only rounded totals');
  if(step==='reimport')assert.equal(JSON.stringify(m),before,'exact repeat import is a complete no-op');
  if(['remove','remove-again'].includes(step)){
   const raw=JSON.stringify(m),p=previewFile(m,cashCSV);assert.equal(p.ready,0);assert.equal(p.issues[0].code,'source-conflict');
   assert.throws(()=>importCSV(m,p));assert.equal(JSON.stringify(m),raw,'deleted receipt never resurrects');
   assert.ok(m.journalEntries.at(-1).managementAudit.originals[0].booking.importSource.externalId==='SYN-INTEREST');
  }
  for(const b of m.bookings.filter(b=>b.importSource))assert.ok(['SYN-INTEREST','SYN-OUT','SYN-IN'].includes(b.importSource.externalId));
  assert.deepEqual(financialState(safeImport(JSON.parse(backup(m)))),oracle[step],step+' portable validation');
 }
 assert.equal(previewPositionRemoval(m,['a']).items[0].classification,'blocked','referenced cash cannot be deleted');
 const before=JSON.stringify(m),protectedId=imported(m,'SYN-OUT').id;
 assert.equal(previewBookingChange(m,{ids:[protectedId],action:'remove',reason:'Protected transfer'}).ready,false);
 assert.equal(previewBookingChange(m,{ids:['buy'],action:'remove',reason:'Protected coupled trade'}).ready,false);
 assert.throws(()=>prepareBookingUndo(m,receipt),'later history blocks stale undo');
 assert.equal(JSON.stringify(m),before);
 assert.deepEqual(performanceIssues(m,'2025-12-31','2026-01-07'),[]);
 const plain=JSON.stringify(createCompleteBackup(JSON.parse(backup(m))));
 const encoded=await encryptBackup(plain,password);
 await assert.rejects(()=>decryptBackup(JSON.parse(encoded),'Wrong synthetic password'));
 const decoded=await decryptBackup(JSON.parse(encoded),password);assert.equal(decoded,plain,'authenticated payload bytes exact');
 const restored=safeImport(unpackCompleteBackup(JSON.parse(decoded)).data);
 assert.deepEqual(restored,safeImport(JSON.parse(backup(m))),'encrypted roundtrip includes source tombstones, snapshots, transfers, audits and exact finance');
 assert.equal(previewFile(restored,cashCSV).issues[0].code,'source-conflict');
 const retransfer=previewFile(restored,transferCSV);assert.equal(retransfer.ready,0);assert.ok(retransfer.issues.length>0,'confirmed transfer ownership remains protected');
});

test('FIN-E2E01 cancellation/stale preview/declined transfer preserve the full model',()=>{
 let m=advance(seed(),'import').model,before=JSON.stringify(m);
 assert.equal(previewBookingChange(m,correctRequest).ready,true);assert.equal(JSON.stringify(m),before);
 for(const opts of [{expectedModel:before,confirmed:false},{expectedModel:'stale',confirmed:true}])assert.throws(()=>prepareBookingChange(m,correctRequest,opts));
 const out=imported(m,'SYN-OUT'),inc=imported(m,'SYN-IN'),preview=previewTransferMatch(m,out.id,[inc.id]);
 assert.throws(()=>confirmTransferMatch(m,{...preview,reference:'Synthetic',confirmed:false}));assert.equal(JSON.stringify(m),before);
 m=advance(m,'correct').model;const p=previewBookingChange(m,removeRequest(m));assert.equal(p.ready,true);before=JSON.stringify(m);
 assert.equal(JSON.stringify(m),before);
 // Independent later spending must fail closed, without patching the contract to make the test pass.
 const blocked=structuredClone(m);blocked.snapshots.push({id:'later',date:'2026-01-07',total:1014,totalEURExact:'1014'});
 const raw=JSON.stringify(blocked);assert.equal(previewBookingChange(blocked,removeRequest(blocked)).ready,false);assert.equal(JSON.stringify(blocked),raw);
});


test('FIN-E2E01 precision evidence remains fail-closed rather than granting broader deletion',()=>{
 const m=seed(),csv=cashCSV.replace('interest,a,2,','interest,a,2.000000000000000001,');
 importCSV(m,previewFile(m,csv));const before=JSON.stringify(m);
 assert.equal(imported(m,'SYN-INTEREST').quantityExact,'2.000000000000000001');
 assert.equal(previewBookingChange(m,removeRequest(m)).ready,false,'rounded numeric mirrors do not prove the exact inverse');
 assert.equal(JSON.stringify(m),before);
});

function cashChain(){let m=seed(),receipt;for(const step of steps){const result=advance(m,step,receipt);m=result.model;receipt=result.receipt;}return m;}
test('FIN-E2E01 FX continuation: distinct equal partial fills, historical FX, partial sale, archive and encrypted restore',async()=>{
 let m=cashChain();const history=JSON.stringify(m.snapshots),openings=structuredClone(m.openingPositions);
 for(const step of fxSteps){
  const before=JSON.stringify(m);m=advanceFX(m,step);
  assert.deepEqual(financialStateFX(m),fxOracle[step],step);
  assert.equal(JSON.stringify(m.snapshots),history,'later trades never rewrite historical reference evidence');
  assert.deepEqual(m.openingPositions.filter(p=>p.positionId!=='usd'),openings,'original opening evidence remains exact');
  assert.equal(m.openingPositions.find(p=>p.positionId==='usd').quantityExact,'0');
  assert.equal(new Set(m.journalEntries.map(j=>j.sequence)).size,m.journalEntries.length);
  assert.deepEqual(financialStateFX(safeImport(JSON.parse(backup(m)))),fxOracle[step],step+' portable read');
  if(step==='fx-reimport')assert.equal(JSON.stringify(m),before,'both original files remain complete no-ops');
 }
 const fills=['SYN-FX-FILL-1','SYN-FX-FILL-2'].map(id=>imported(m,id));
 assert.equal(new Set(fills.map(b=>b.id)).size,2);assert.equal(new Set(fills.map(b=>b.journalEntryId)).size,2);
 const before=JSON.stringify(m),plain=JSON.stringify(createCompleteBackup(JSON.parse(backup(m))));
 const decoded=await decryptBackup(JSON.parse(await encryptBackup(plain,password)),password);assert.equal(decoded,plain);
 const restored=safeImport(unpackCompleteBackup(JSON.parse(decoded)).data);
 assert.deepEqual(financialStateFX(restored),fxOracle['fx-reimport']);
 assert.deepEqual(restored,safeImport(JSON.parse(backup(m))));
 assert.equal(previewFile(restored,fxCSV).duplicates,2);assert.equal(previewFile(restored,fxSaleCSV).duplicates,1);
 assert.equal(JSON.stringify(m),before);
});

test('FIN-E2E01 FX continuation: conflicting identity/missing historical FX/guarded removal never mutate',()=>{
 const m=advanceFX(advanceFX(cashChain(),'fx-import'),'fx-sell'),before=JSON.stringify(m);
 for(const csv of [fxCSV.replace('usd,0.5,100','usd,0.6,100'),fxCSV.replaceAll(',0.8,a,',',,a,')]){
  const p=previewFile(m,csv);assert.ok(p.issues.length);assert.throws(()=>importCSV(m,p));assert.equal(JSON.stringify(m),before);
 }
 assert.equal(previewFile(m,fxCSV.replace('usd,0.5,100','usd,0.6,100')).issues[0].code,'source-conflict');
 const p=previewFile(m,fxSaleCSV);assert.throws(()=>importCSV({...structuredClone(m),notes:'Synthetic stale preimage'},p));
 for(const id of ['SYN-FX-FILL-1','SYN-FX-FILL-2','SYN-FX-SALE']){
  const request={ids:[imported(m,id).id],action:'remove',reason:'Unproven coupled FX inverse'};
  assert.equal(previewBookingChange(m,request).ready,false);assert.throws(()=>prepareBookingChange(m,request,{expectedModel:before,confirmed:true}));
 }
 assert.equal(JSON.stringify(m),before);
});
