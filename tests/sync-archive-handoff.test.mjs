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
