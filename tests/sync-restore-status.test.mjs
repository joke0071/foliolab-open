import test from 'node:test';
import assert from 'node:assert/strict';
import {archiveDigest,archivePinSlot,restoreReceiptSlot,prepareRestore,inspectPinnedLocalRestore,reopenLocalRecoveryCase} from '../experimental/sync/sync-restore-status.js';
import {backup,blankModel} from '../src/model.js';
import {memoryDB} from './transaction-double.mjs';

test('restore status leaves legacy receipts, damaged records and changed fences undetermined',async()=>{
 const db=memoryDB(),raw=backup(blankModel()),sync={version:2};
 const evidence={text:'archive',localFile:'rollback',selectedFile:'selected',confirmedHead:'S',expectedPinVersion:2};
 const pin={version:2,selectedHead:'S',localRevision:2,syncVersion:2,digest:await archiveDigest(evidence.text),
  portfolioDigest:await archiveDigest(raw)};
 const restored=await prepareRestore({portfolio:{schemaVersion:1,revision:2,raw,deleted:false},sync},raw,pin,evidence);
 const records=new Map([['portfolio',restored.portfolio],['sync-outbox-v1',restored.sync],
  [archivePinSlot,pin],[restoreReceiptSlot,restored.receipt]]);
 for(const [key,value] of [[restoreReceiptSlot,undefined],[restoreReceiptSlot,{...restored.receipt,proof:'bad'}],
  ['sync-local-anchor-v1',null],['sync-outbox-v1',{...restored.sync,version:3}],
  ['portfolio',{...restored.portfolio,updatedAt:'changed'}],
  ['portfolio',{...restored.portfolio,revision:4,raw:'broken'}],
  ['portfolio',{...restored.portfolio,syncEnrollmentRequired:false}],
  [archivePinSlot,{...pin,syncVersion:3}]]){
  db.data.clear();
  for(const [k,v] of records)db.data.set(k,v);
  if(value===undefined)db.data.delete(key);else db.data.set(key,value);
  const before=structuredClone(db.data);
  assert.deepEqual(await inspectPinnedLocalRestore(db,evidence),{status:'undetermined',applyAuthorized:false});
  assert.deepEqual(db.data,before);
 }
});

test('case reopening cannot attribute a legacy rollback or use a partial, altered or transplanted receipt',async()=>{
 const db=memoryDB(),raw=backup(blankModel()),sync={version:2};
 const evidence={text:'archive',localFile:'rollback',selectedFile:'selected'};
 const pin={version:2,selectedHead:'S',localRevision:2,syncVersion:2,digest:await archiveDigest(evidence.text),
  portfolioDigest:await archiveDigest(raw)};
 const restored=await prepareRestore({portfolio:{schemaVersion:1,revision:2,raw,deleted:false},sync},raw,pin,evidence);
 const portfolio={...restored.portfolio,revision:4};
 db.data.set('portfolio',portfolio);db.data.set('sync-outbox-v1',restored.sync);db.data.set(archivePinSlot,pin);
 db.data.set(restoreReceiptSlot,restored.receipt);
 const open=()=>reopenLocalRecoveryCase(db,evidence);
 assert.equal((await open()).status,'later-local-revision');
 const portfolioDigest=await archiveDigest(JSON.stringify(portfolio)),revision=portfolio.revision;
 const proof=await archiveDigest(JSON.stringify(['local-rollback-v1',restored.receipt.proof,revision,portfolioDigest]));
 const rollback={portfolioDigest,revision,proof};
 db.data.set(restoreReceiptSlot,{...restored.receipt,rollback});
 assert.equal((await open()).status,'matches-rolled-back-state');
 for(const invalid of [null,{}, {...rollback,revision:5},{...rollback,proof:'a'.repeat(64)},
  {...rollback,portfolioDigest:'b'.repeat(64)}]){
  db.data.set(restoreReceiptSlot,{...restored.receipt,rollback:invalid});
  assert.deepEqual(await open(),{status:'undetermined',applyAuthorized:false});
 }
 db.data.set(restoreReceiptSlot,{...restored.receipt,rollback});
 db.data.set('portfolio',{...portfolio,updatedAt:'different'});
 assert.equal((await open()).status,'undetermined');
 db.data.set('portfolio',{...portfolio,revision:5,raw:'bad'});
 assert.equal((await open()).status,'undetermined');
});
