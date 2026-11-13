import {readPortfolioSyncRecord,commitPortfolioSyncRecord} from './atomic-storage.js';
import {verifySyncOutboxState,readSyncOutboxState,appendSyncOutboxState,advanceSyncOutboxState,syncOutboxSummary} from './sync-outbox-state.js';

/** Isolated local adapter; NOT imported by the app. Metadata in the SAME IDB
 * store as the canonical portfolio. No upload, RemoteApply or key persistence.
 * Native IDB/crash/quota/multitab qualification remains required before use.
 */
export function createSyncOutboxStorage(db,verifyFrame) {
 async function read(expectedLocalRevision,expectedSyncVersion) {
  const current=await readPortfolioSyncRecord(db);
  if(!current.portfolio||current.portfolio.deleted||current.portfolio.revision!==expectedLocalRevision||
   (current.sync?.version??null)!==expectedSyncVersion)throw Error('sync-outbox-stale-preimage');
  const ticket=current.sync===null?null:await verifySyncOutboxState(current.sync,verifyFrame);
  return {...current,ticket};
 }
 async function commit(current,nextState) {
  return commitPortfolioSyncRecord(db,{expectedLocalRevision:current.portfolio.revision,
   expectedState:current.sync,nextState});
 }
 return Object.freeze({
  async recover() {
   const {portfolio,sync}=await readPortfolioSyncRecord(db);
   if(!portfolio||portfolio.deleted)throw Error('sync-outbox-no-local-portfolio');
   if(sync===null)return {state:null,summary:null,localRevision:portfolio.revision};
   const ticket=await verifySyncOutboxState(sync,verifyFrame);
   const after=await readPortfolioSyncRecord(db);
   if(after.portfolio?.revision!==portfolio.revision||JSON.stringify(after.sync)!==JSON.stringify(sync))
    throw Error('sync-outbox-recovery-race');
   return {state:readSyncOutboxState(ticket),summary:syncOutboxSummary(ticket,portfolio.revision),localRevision:portfolio.revision};
  },
  async capture({expectedLocalRevision,expectedSyncVersion,receipt,expectedPortfolioId,expectedEpochId}) {
   const current=await read(expectedLocalRevision,expectedSyncVersion);
   const next=appendSyncOutboxState({ticket:current.ticket,receipt,portfolio:current.portfolio,expectedPortfolioId,expectedEpochId});
   return commit(current,next);
  },
  async begin({expectedLocalRevision,expectedSyncVersion,revisionId}) {
   const current=await read(expectedLocalRevision,expectedSyncVersion);
   const next=advanceSyncOutboxState({ticket:current.ticket,revisionId,currentLocalRevision:current.portfolio.revision});
   const entry=next.entries.find(e=>e.revision.revisionId===revisionId);
   if(entry.status!=='uncertain')throw Error('sync-outbox-not-publishable');
   await commit(current,next); // NEVER expose sendable bytes before commit
   return {state:next,frameText:entry.frameText};
  },
  async confirm({expectedLocalRevision,expectedSyncVersion,revisionId,readback}) {
   if(readback===null||readback===undefined)throw Error('sync-outbox-readback-required');
   const current=await read(expectedLocalRevision,expectedSyncVersion);
   const next=advanceSyncOutboxState({ticket:current.ticket,revisionId,readback,currentLocalRevision:current.portfolio.revision});
   return commit(current,next);
  }
 });
}
