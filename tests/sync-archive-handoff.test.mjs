import assert from 'node:assert/strict';
import test from 'node:test';
import {backup,blankModel} from '../src/model.js';
import {commitPortfolioRecord,readPortfolioSyncRecord} from '../src/atomic-storage.js';
import {createSyncOutboxStorage} from '../experimental/sync/sync-outbox-storage.js';
import {memoryDB} from './transaction-double.mjs';
import {verify,snapshotFrame,portfolioId,epochId} from './sync-outbox-fixture.mjs';

const slot='sync-conflict-archive-handoff-v1';
async function setup(){
 const db=memoryDB(),api=createSyncOutboxStorage(db,verify),model=blankModel();
 const local=await commitPortfolioRecord(db,{expectedRevision:null,raw:backup(model,{includeHistory:true}),settings:model.settings});
 const frame=(id,parent,generation,salt)=>snapshotFrame(local.raw,id,parent,generation,salt.repeat(32));
 await api.capture({expectedLocalRevision:1,expectedSyncVersion:null,expectedPortfolioId:portfolioId,expectedEpochId:epochId,
  receipt:await verify(snapshotFrame(local.raw))});
 const cas={expectedLocalRevision:1,expectedSyncVersion:1};
 const b=frame('B','R','2','81'),c=frame('C','R','2','82');
 const make=async frames=>(await api.createConflictArchive({...cas,frameTexts:frames,observationComplete:true})).archive;
 const old=await make([b,c]),source=await make([b,frame('B2','B','3','83'),c]);
 await api.pinConflictArchive({...cas,text:old.text,expectedDigest:old.digest,expectedPinVersion:0});
 await api.recordPinnedSelection({text:old.text,selectedHead:'B',expectedPinVersion:1});
 const request={...cas,previousText:old.text,expectedPinVersion:2,sourceArchive:{text:source.text,expectedDigest:source.digest}};
 const raw={...cas,previousText:old.text,expectedPinVersion:2,frameTexts:[frame('C2','C','3','84')]};
 const files=result=>({previousText:old.text,sourceText:source.text,text:result.archive.text});
 return {db,api,local,request,raw,files};
}

test('preparation survives a new adapter, abort and lost response; repeated confirmations preserve subsequent selection',async()=>{
 const {db,api,request,files}=await setup();
 const before=await readPortfolioSyncRecord(db),preview=await api.createSuccessorConflictArchive(request);
 await assert.rejects(()=>api.inspectSuccessorHandoff(files(preview)),/handoff-missing/);
 db.fault='abort-after-put';await assert.rejects(()=>api.prepareSuccessorConflictArchive(request));
 assert.equal(db.data.has(slot),false);
 const prepared=await api.prepareSuccessorConflictArchive(request);
 assert.equal(prepared.handoffStatus,'prepared');assert.deepEqual(prepared.archive,preview.archive);
 assert.deepEqual(await api.prepareSuccessorConflictArchive(request),prepared);
 const evidence=files(prepared),fresh=createSyncOutboxStorage(db,verify);
 const pending={status:'pending-confirmation',pinVersion:2,heads:['B2','C'],applyAuthorized:false};
 assert.deepEqual(await fresh.inspectSuccessorHandoff(evidence),pending);
 for(const key of Object.keys(evidence)){
  for(const invalid of [undefined,evidence[key].slice(0,-1)]){
   const changed={...evidence,[key]:invalid};
   await assert.rejects(()=>fresh.inspectSuccessorHandoff(changed));
   await assert.rejects(()=>fresh.confirmSuccessorHandoff(changed));
  }
 }
 db.fault='quota';await assert.rejects(()=>fresh.confirmSuccessorHandoff(evidence),/quota/);
 assert.deepEqual(await fresh.inspectSuccessorHandoff(evidence),pending);
 const done={...pending,status:'target-bound',pinVersion:3};
 assert.deepEqual(await Promise.all([fresh.confirmSuccessorHandoff(evidence),api.confirmSuccessorHandoff(evidence)]),[done,done]);
 await fresh.recordPinnedSelection({text:evidence.text,selectedHead:'C',expectedPinVersion:3});
 const restarted=createSyncOutboxStorage(db,verify);
 assert.deepEqual(await restarted.confirmSuccessorHandoff(evidence),{...done,pinVersion:4});
 assert.equal((await restarted.reopenPinnedSelection({text:evidence.text})).restorePreview.selectedHead,'C');
 assert.deepEqual(await readPortfolioSyncRecord(db),before);
});

test('replacement, selection and same-counter financial edits fence a stale handoff',async()=>{
 const {db,api,request,raw,files,local}=await setup();
 const old=files(await api.prepareSuccessorConflictArchive(request));
 const replacement=await api.prepareSuccessorConflictArchive(raw);
 const latest={previousText:raw.previousText,text:replacement.archive.text};
 await assert.rejects(()=>api.confirmSuccessorHandoff(old),/handoff-file/);
 const pending=await api.inspectSuccessorHandoff(latest);
 db.data.set('portfolio',{...local,updatedAt:'new record'});
 await assert.rejects(()=>api.confirmSuccessorHandoff(latest),/portfolio-changed|handoff-local-changed/);
 db.data.set('portfolio',local);
 assert.deepEqual(await api.inspectSuccessorHandoff(latest),pending);
 await api.recordPinnedSelection({text:raw.previousText,selectedHead:'C',expectedPinVersion:2});
 await assert.rejects(()=>api.confirmSuccessorHandoff(latest),/successor-pin-changed/);
 assert.equal((await api.reopenPinnedSelection({text:raw.previousText})).restorePreview.selectedHead,'C');
});

test('a competing preparation during verification wins once; present malformed handoff records fail closed',async()=>{
 const {db,api,request,raw,files}=await setup();
 let first=true;
 const rival=createSyncOutboxStorage(db,async ciphertext=>{
  if(first){first=false;await api.prepareSuccessorConflictArchive(raw);}
  return verify(ciphertext);
 });
 await assert.rejects(()=>rival.prepareSuccessorConflictArchive(request),/handoff-changed/);
 const latest=await api.prepareSuccessorConflictArchive(raw),evidence={previousText:raw.previousText,text:latest.archive.text};
 assert.equal((await api.inspectSuccessorHandoff(evidence)).status,'pending-confirmation');
 const saved=structuredClone(db.data.get(slot));
 for(const malformed of [null,{...saved,format:2},{...saved,target:{...saved.target,digest:'bad'}},{...saved,previous:null}]){
  db.data.set(slot,malformed);
  await assert.rejects(()=>api.prepareSuccessorConflictArchive(request));
  await assert.rejects(()=>api.confirmSuccessorHandoff(files(latest)));
  assert.deepEqual(db.data.get(slot),malformed);assert.equal(await api.archivePinVersion(),2);
 }
});

test('a concurrent change after reading recovery evidence invalidates the final transaction',async()=>{
 const {db,api,request,raw,files}=await setup();
 const evidence=files(await api.prepareSuccessorConflictArchive(request));
 let first=true;
 const stale=createSyncOutboxStorage(db,async ciphertext=>{
  if(first){first=false;await api.prepareSuccessorConflictArchive(raw);}
  return verify(ciphertext);
 });
 await assert.rejects(()=>stale.confirmSuccessorHandoff(evidence),/handoff-changed/);
 assert.equal(await api.archivePinVersion(),2);
});

test('regeneration recovers a lost target byte-for-byte without binding it; raw inputs must match the original preparation',async()=>{
 const {db,api,request,raw,files}=await setup();
 const original=await api.prepareSuccessorConflictArchive(request);
 const fresh=createSyncOutboxStorage(db,verify),evidence=files(original);
 const rebuilt=await fresh.regenerateSuccessorArchive({previousText:evidence.previousText,sourceText:evidence.sourceText});
 assert.deepEqual(rebuilt.archive,original.archive);assert.equal(rebuilt.status,'pending-confirmation');assert.equal(rebuilt.pinVersion,2);
 await assert.rejects(()=>fresh.confirmSuccessorHandoff({...evidence,text:undefined}),/handoff-file/);
 const standalone=await api.prepareSuccessorConflictArchive(raw);
 await assert.rejects(()=>fresh.regenerateSuccessorArchive({previousText:raw.previousText}),/no-new-frames/);
 const recovered=await fresh.regenerateSuccessorArchive({previousText:raw.previousText,frameTexts:raw.frameTexts});
 assert.deepEqual(recovered.archive,standalone.archive);
 const restoredFiles={previousText:raw.previousText,text:recovered.archive.text};
 await fresh.confirmSuccessorHandoff(restoredFiles);
 const bound=await api.regenerateSuccessorArchive({previousText:raw.previousText,frameTexts:raw.frameTexts});
 assert.equal(bound.status,'target-bound');assert.equal(bound.pinVersion,3);assert.deepEqual(bound.archive,standalone.archive);
});

async function bookAndCapture(db,api,local,id,parent,generation,salt){
 const saved=await commitPortfolioRecord(db,{expectedRevision:local.revision,raw:local.raw,settings:local.settings});
 await api.capture({expectedLocalRevision:saved.revision,expectedSyncVersion:local.revision,expectedPortfolioId:portfolioId,
  expectedEpochId:epochId,receipt:await verify(snapshotFrame(saved.raw,id,parent,generation,salt.repeat(32)))});
 return saved;
}

test('refresh carries a pending remote branch across later local captures; its saved candidate becomes the next source',async()=>{
 const {db,api,raw,local}=await setup();
 const first=await api.prepareSuccessorConflictArchive(raw);
 const intermediate={previousText:raw.previousText,text:first.archive.text};
 await assert.rejects(()=>api.refreshPreparedSuccessorArchive(intermediate),/refresh-needs-capture/);
 const second=await bookAndCapture(db,api,local,'L','R','2','85');
 await assert.rejects(()=>api.confirmSuccessorHandoff(intermediate),/stale-preimage/);
 await assert.rejects(()=>api.refreshPreparedSuccessorArchive({...intermediate,text:intermediate.text.slice(0,-1)}),/source-digest/);
 const renewed=await api.refreshPreparedSuccessorArchive(intermediate);
 assert.equal(renewed.pinVersion,2);assert.deepEqual(renewed.heads,['B','C2','L']);
 assert.deepEqual(renewed.preparedTransition.branches,[{previousHead:'B',currentHeads:['B']},
  {previousHead:'C2',currentHeads:['C2']}]);assert.deepEqual(renewed.preparedTransition.additionalHeads,['L']);
 const third=await bookAndCapture(db,api,second,'L2','L','3','86');
 await assert.rejects(()=>api.refreshPreparedSuccessorArchive(intermediate),/source-digest/);
 const latest=await api.refreshPreparedSuccessorArchive({previousText:raw.previousText,text:renewed.archive.text});
 const files={previousText:raw.previousText,text:latest.archive.text,sourceText:renewed.archive.text};
 const fresh=createSyncOutboxStorage(db,verify);
 assert.deepEqual((await fresh.regenerateSuccessorArchive(files)).archive,latest.archive);
 await assert.rejects(()=>fresh.confirmSuccessorHandoff({...files,sourceText:first.archive.text}),/source-digest/);
 const bound=await fresh.confirmSuccessorHandoff(files);
 assert.equal(bound.pinVersion,3);assert.deepEqual(bound.heads,['B','C2','L2']);
 assert.equal((await readPortfolioSyncRecord(db)).portfolio.raw,third.raw);
});

test('refresh checks the intermediate queue prefix even when the original queue prefix is intact',async()=>{
 const {db,api,request,local}=await setup();
 const gap=await commitPortfolioRecord(db,{expectedRevision:local.revision,raw:local.raw,settings:local.settings});
 const middleLocal=await commitPortfolioRecord(db,{expectedRevision:gap.revision,raw:local.raw,settings:local.settings});
 await api.capture({expectedLocalRevision:3,expectedSyncVersion:1,expectedPortfolioId:portfolioId,expectedEpochId:epochId,
  receipt:await verify(snapshotFrame(local.raw,'L','R','2','87'.repeat(32)))});
 const middle=await api.prepareSuccessorConflictArchive({...request,expectedLocalRevision:3,expectedSyncVersion:2});
 const files={previousText:request.previousText,text:middle.archive.text};
 await commitPortfolioRecord(db,{expectedRevision:middleLocal.revision,raw:local.raw,settings:local.settings});
 await assert.rejects(()=>api.refreshPreparedSuccessorArchive(files),/refresh-needs-capture/);
 await api.capture({expectedLocalRevision:4,expectedSyncVersion:2,expectedPortfolioId:portfolioId,expectedEpochId:epochId,
  receipt:await verify(snapshotFrame(local.raw,'L2','L','3','88'.repeat(32)))});
 const key='sync-outbox-v1',saved=structuredClone(db.data.get(key)),handoff=structuredClone(db.data.get(slot));
 // Both graphs and all ciphertext still agree; only the intermediate capture
 // has moved to another valid CAS between the original and current captures.
 const changed=structuredClone(saved);changed.entries[1].capturedLocalRevision=gap.revision;
 db.data.set(key,changed);
 await assert.rejects(()=>api.refreshPreparedSuccessorArchive(files),/successor-lineage/);
 assert.deepEqual(db.data.get(slot),handoff);db.data.set(key,saved);
 db.fault='abort-after-put';await assert.rejects(()=>api.refreshPreparedSuccessorArchive(files));
 assert.deepEqual(db.data.get(slot),handoff);
 assert.equal((await api.refreshPreparedSuccessorArchive(files)).handoffStatus,'prepared');
});
