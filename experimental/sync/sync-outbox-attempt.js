import {readVerifiedSyncFrame} from './sync-frame-verifier.js';
import {isSyncRevisionDescriptor} from './sync-revisions.js';

/** In-memory boundary model only: no persistence, encryption, upload or Apply.
 * Future adapter must atomically persist the frame/snapshot/anchor before send
 * and reverify the actual stored frame after restart. A JSON ticket is invalid.
 */
const attempts = new WeakMap();
const same = (a,b) => isSyncRevisionDescriptor(a) && isSyncRevisionDescriptor(b) &&
 Object.keys(a).every(k=>a[k] === b[k]);
const blocked = reason => ({status:'blocked',reason});

export function prepareSyncOutboxAttempt({receipt,expectedPortfolioId,expectedEpochId,
 expectedRevision,capturedLocalRevision} = {}) {
 const verified = readVerifiedSyncFrame(receipt);
 if(verified.descriptor.portfolioId !== expectedPortfolioId || verified.epochId !== expectedEpochId ||
    !same(verified.descriptor,expectedRevision) || !Number.isSafeInteger(capturedLocalRevision) || capturedLocalRevision < 1)
  throw Error('sync-outbox-binding');
 const attempt = Object.freeze({type:'sync-outbox-attempt'});
 attempts.set(attempt,Object.freeze({portfolioId:expectedPortfolioId,epochId:expectedEpochId,
  revision:verified.descriptor,capturedLocalRevision,frameText:verified.frameText,frameDigest:verified.frameDigest}));
 return attempt;
}

export function readSyncOutboxAttempt(attempt) {
 const entry = attempts.get(attempt);
 if(!entry) throw Error('sync-outbox-unrecognized-attempt');
 return entry;
}

export function classifySyncOutboxAttempt({attempt,outcome,readback = null,currentLocalRevision} = {}) {
 const entry = readSyncOutboxAttempt(attempt);
 if(!Number.isSafeInteger(currentLocalRevision) || currentLocalRevision < entry.capturedLocalRevision)
  return blocked('invalid-local-revision');
 if(!['not-started','failed','unknown','uploaded'].includes(outcome)) return blocked('invalid-outcome');
 let status = outcome === 'not-started' || outcome === 'failed' ? 'pending' : 'uncertain';
 if(readback !== null) {
  const verified = readVerifiedSyncFrame(readback);
  if(verified.frameText !== entry.frameText || verified.frameDigest !== entry.frameDigest ||
     verified.epochId !== entry.epochId || !same(verified.descriptor,entry.revision)) return blocked('readback-mismatch');
  status = 'confirmed';
 }
 return Object.freeze({status,capturedLocalRevision:entry.capturedLocalRevision,currentLocalRevision,
  acknowledgedLocalRevision:status === 'confirmed' ? entry.capturedLocalRevision : null,
  hasNewerLocalChanges:currentLocalRevision > entry.capturedLocalRevision});
}
