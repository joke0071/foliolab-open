import {createSyncSnapshot,validateSyncSnapshot,compareSyncSnapshotSections} from './sync-snapshot.js';
import {SYNC_GRAPH_LIMIT} from './sync-revisions.js';
import {SYNC_FRAME_TEXT_LIMIT,readVerifiedSyncFrame} from './sync-frame-verifier.js';
import {readPortfolioSyncRecord,commitPortfolioSyncRecord,syncPreimageText} from '../../src/atomic-storage.js';
import {SYNC_OUTBOX_TEXT_LIMIT,verifySyncOutboxState,readSyncOutboxState,appendSyncOutboxState,advanceSyncOutboxState,syncOutboxHeadMatches,syncOutboxSummary,planSyncOutboxApply} from './sync-outbox-state.js';

/** Isolated local adapter; NOT imported by the app. Metadata in the SAME IDB
 * store as the canonical portfolio. No upload, RemoteApply or key persistence.
 * Native IDB/crash/quota/multitab qualification remains required before use.
 */
export function createSyncOutboxStorage(db,verifyFrame) {
 async function verifySnapshotFrame(text) {
  const receipt=await verifyFrame(text);
  await validateSyncSnapshot(readVerifiedSyncFrame(receipt).plain);
  return receipt;
 }
 async function read(expectedLocalRevision,expectedSyncVersion) {
  const current=await readPortfolioSyncRecord(db,{forOutbox:true});
  if(!current.portfolio||current.portfolio.deleted||current.portfolio.revision!==expectedLocalRevision||
   (current.sync?.version??null)!==expectedSyncVersion)throw Error('sync-outbox-stale-preimage');
  if(current.portfolio.syncEnrollmentRequired)throw Error('sync-outbox-enrollment-required');
  const ticket=current.sync===null?null:await verifySyncOutboxState(current.sync,verifySnapshotFrame);
  return {...current,ticket};
 }
 // The state machine compares payload bytes. The transaction compares the complete original IDB record.
 async function snapshotPreimage(portfolio) {
  return {revision:portfolio.revision,deleted:portfolio.deleted,raw:await createSyncSnapshot(portfolio.raw)};
 }
 async function checkCurrentHead(portfolio,sync,ticket) {
  if(sync?.entries.at(-1)?.capturedLocalRevision!==portfolio.revision)return;
  const plain=await createSyncSnapshot(portfolio.raw);
  if(!syncOutboxHeadMatches(ticket,plain))throw Error('sync-outbox-local-snapshot-mismatch');
 }
 async function commit(current,nextState) {
  return commitPortfolioSyncRecord(db,{expectedLocalRevision:current.portfolio.revision,
   expectedPortfolio:current.portfolio,expectedState:current.sync,nextState});
 }
 async function compareBranches(current,revisions,plan,frames,[leftId,rightId]){
  if(plan.status!=='conflict'||!plan.heads.includes(leftId)||!plan.heads.includes(rightId))
   throw Error('sync-outbox-comparison-needs-conflicting-heads');
  const parents=new Map([...current.sync.entries.map(e=>e.revision),...revisions].map(r=>[r.revisionId,r.parentId]));
  const ancestors=new Set();
  for(let id=leftId;id!==null;id=parents.get(id))ancestors.add(id);
  let baseId=rightId;
  while(baseId!==null&&!ancestors.has(baseId))baseId=parents.get(baseId);
  if(baseId===null)return {status:'no-common-ancestor',leftId,rightId};
  const plain=[];
  for(const id of [baseId,leftId,rightId]){
   const text=frames.get(id);
   const frame=readVerifiedSyncFrame(await verifyFrame(text));
   if(frame.frameText!==text||frame.descriptor.revisionId!==id||frame.epochId!==current.sync.epochId||
      frame.descriptor.portfolioId!==current.sync.portfolioId)throw Error('sync-outbox-frame-binding');
   plain.push(frame.plain);
  }
  return {status:'compared',baseId,leftId,rightId,sections:await compareSyncSnapshotSections(...plain)};
 }
 async function finishPlan(current,revisions,observationComplete,frames,comparisonHeads){
  if(current.ticket===null)return {status:'blocked',reason:'no-local-sync-preimage',applyAuthorized:false};
  const last=current.sync.entries.at(-1);
  const portfolio=last.capturedLocalRevision===current.portfolio.revision?await snapshotPreimage(current.portfolio):current.portfolio;
  const result=planSyncOutboxApply({ticket:current.ticket,portfolio,revisions,observationComplete});
  if(comparisonHeads)result.comparison=await compareBranches(current,revisions,result,frames,comparisonHeads);
  const after=await readPortfolioSyncRecord(db,{forOutbox:true});
  if(syncPreimageText(after.portfolio)!==syncPreimageText(current.portfolio)||syncPreimageText(after.sync)!==syncPreimageText(current.sync))
   throw Error('sync-outbox-apply-plan-race');
  return {...result,applyAuthorized:false}; // Actual Apply must repeat this preimage/CAS in its OWN tx.
 }
 return Object.freeze({
  async recover() {
   const {portfolio,sync}=await readPortfolioSyncRecord(db,{forOutbox:true});
   if(!portfolio||portfolio.deleted)throw Error('sync-outbox-no-local-portfolio');
   if(portfolio.syncEnrollmentRequired)throw Error('sync-outbox-enrollment-required');
   if(sync===null)return {state:null,summary:null,localRevision:portfolio.revision};
   const ticket=await verifySyncOutboxState(sync,verifySnapshotFrame);
   await checkCurrentHead(portfolio,sync,ticket);
   const after=await readPortfolioSyncRecord(db,{forOutbox:true});
   if(syncPreimageText(after.portfolio)!==syncPreimageText(portfolio)||syncPreimageText(after.sync)!==syncPreimageText(sync))
    throw Error('sync-outbox-recovery-race');
   return {state:readSyncOutboxState(ticket),summary:syncOutboxSummary(ticket,portfolio.revision),localRevision:portfolio.revision};
  },
  async capture({expectedLocalRevision,expectedSyncVersion,receipt,expectedPortfolioId,expectedEpochId}) {
   const current=await read(expectedLocalRevision,expectedSyncVersion);
   const local=await snapshotPreimage(current.portfolio);
   // A caller's receipt may originate from another verifier with the same IDs.
   const bound=await verifyFrame(readVerifiedSyncFrame(receipt).frameText);
   const next=appendSyncOutboxState({ticket:current.ticket,receipt:bound,portfolio:local,
    expectedPortfolioId,expectedEpochId});
   return commit(current,next);
  },
  async begin({expectedLocalRevision,expectedSyncVersion,revisionId}) {
   const current=await read(expectedLocalRevision,expectedSyncVersion);
   await checkCurrentHead(current.portfolio,current.sync,current.ticket);
   const next=advanceSyncOutboxState({ticket:current.ticket,revisionId,currentLocalRevision:current.portfolio.revision});
   const entry=next.entries.find(e=>e.revision.revisionId===revisionId);
   if(entry.status!=='uncertain')throw Error('sync-outbox-not-publishable');
   await commit(current,next); // NEVER expose sendable bytes before commit
   return {state:next,frameText:entry.frameText};
  },
  async planApply({expectedLocalRevision,expectedSyncVersion,revisions,observationComplete}) {
   const remoteDescriptors=structuredClone(revisions); // detach before crypto awaits
   const current=await read(expectedLocalRevision,expectedSyncVersion);
   return finishPlan(current,remoteDescriptors,observationComplete);
  },
  // Read-only group-frame preview. The caller still supplies listing completeness.
  // Group authentication is insufficient for individual writer or transport authority.
  async planFrameApply({expectedLocalRevision,expectedSyncVersion,frameTexts,observationComplete,comparisonHeads}) {
   let pair;
   if(comparisonHeads!==undefined){
    if(!Array.isArray(comparisonHeads)||comparisonHeads.length!==2||comparisonHeads[0]===comparisonHeads[1]||
       !comparisonHeads.every(id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(id)))
     throw Error('sync-outbox-invalid-comparison-heads');
    pair=[comparisonHeads[0],comparisonHeads[1]];
   }
   if(!Array.isArray(frameTexts)||frameTexts.length>SYNC_GRAPH_LIMIT)throw Error('sync-outbox-frame-batch-limit');
   const frames=[];let total=0;
   for(const text of frameTexts){
    if(typeof text!=='string'||text.length>SYNC_FRAME_TEXT_LIMIT||(total+=text.length)>SYNC_OUTBOX_TEXT_LIMIT)
     throw Error('sync-outbox-frame-batch-limit');
    frames.push(text);
   }
   const current=await read(expectedLocalRevision,expectedSyncVersion);
   if(!current.ticket)return finishPlan(current,[],observationComplete);
   const known=new Map(current.sync.entries.map(e=>[e.revision.revisionId,e.frameText]));
   const seen=new Set(known.values()),revisions=[];
   for(const text of frames){
    if(seen.has(text))continue;
    const frame=readVerifiedSyncFrame(await verifySnapshotFrame(text));
    if(frame.frameText!==text||frame.epochId!==current.sync.epochId||frame.descriptor.portfolioId!==current.sync.portfolioId)
     throw Error('sync-outbox-frame-binding');
    if(known.has(frame.descriptor.revisionId))throw Error('sync-outbox-frame-identity-collision');
    if(known.size>=SYNC_GRAPH_LIMIT)throw Error('sync-outbox-frame-batch-limit');
    known.set(frame.descriptor.revisionId,text);
    seen.add(text);revisions.push(frame.descriptor);
   }
   return finishPlan(current,revisions,observationComplete,known,pair);
  },
  async confirm() {
   // A2: a verifier receipt authenticates bytes, NOT where they were obtained.
   // No remote transport/provenance issuer exists yet. Fail closed, including
   // caller-supplied URLs, object IDs, HTTP flags or a locally reverified frame.
   throw Error('sync-outbox-remote-provenance-unavailable');
  }
 });
}
