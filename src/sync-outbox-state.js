import {readVerifiedSyncFrame} from './sync-frame-verifier.js';
import {isSyncRevisionDescriptor,planSyncRevisions} from './sync-revisions.js';

// Pure durable-state transitions. No Apply, transport, key storage or enrollment.
export const SYNC_OUTBOX_ENTRY_LIMIT=128;
export const SYNC_OUTBOX_TEXT_LIMIT=30000000;
const same=(a,b)=>isSyncRevisionDescriptor(a)&&isSyncRevisionDescriptor(b)&&Object.keys(a).every(k=>a[k]===b[k]);
const fail=reason=>{throw Error('sync-state-'+reason);};
const integer=n=>Number.isSafeInteger(n)&&n>=1;
const shape=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const verifiedStates=new WeakMap();
const verifiedPayloads=new WeakMap();

/** Re-decrypt EVERY stored frame with an independently locally bound verifier.
 * Copy first: IDB data has no authority and cannot mutate across async work.
 * Returned capability is ephemeral; neither state JSON nor flags authorize use.
 */
export async function verifySyncOutboxState(input,verifyFrame) {
 const state=structuredClone(input);
 if(!shape(state,['format','version','portfolioId','epochId','disabled','entries','anchorIndex'])||
  state.format!==1||!integer(state.version)||state.disabled!==null||
  !Array.isArray(state.entries)||!state.entries.length||state.entries.length>SYNC_OUTBOX_ENTRY_LIMIT||
  !Number.isInteger(state.anchorIndex)||state.anchorIndex< -1||state.anchorIndex>=state.entries.length)fail('format-or-disabled');
 let total=0,previous=null;const payloads=[];
 const ids=new Set();
 for(let i=0;i<state.entries.length;i++) {
  const e=state.entries[i];
  if(!shape(e,['revision','capturedLocalRevision','frameText','frameDigest','status'])||
   !isSyncRevisionDescriptor(e.revision)||!integer(e.capturedLocalRevision)||typeof e.frameText!=='string'||
   !['pending','uncertain','confirmed'].includes(e.status))fail('entry');
  total+=e.frameText.length;if(total>SYNC_OUTBOX_TEXT_LIMIT)fail('capacity');
  if(ids.has(e.revision.revisionId))fail('duplicate-revision');ids.add(e.revision.revisionId);
  if(e.revision.portfolioId!==state.portfolioId)fail('portfolio');
  if(previous ? e.revision.parentId!==previous.revision.revisionId||
    BigInt(e.revision.generation)!==BigInt(previous.revision.generation)+1n||
    e.capturedLocalRevision<=previous.capturedLocalRevision :
    e.revision.parentId!==null||e.revision.generation!=='1')fail('lineage');
  if((i<=state.anchorIndex)!==(e.status==='confirmed'))fail('anchor');
  const v=readVerifiedSyncFrame(await verifyFrame(e.frameText));
  if(v.epochId!==state.epochId||!same(v.descriptor,e.revision)||v.frameText!==e.frameText||v.frameDigest!==e.frameDigest)fail('frame-binding');
  payloads.push(v.plain);previous=e;
 }
 const ticket=Object.freeze({type:'verified-sync-outbox-state'});
 verifiedStates.set(ticket,state);verifiedPayloads.set(ticket,payloads);
 return ticket;
}

export function readSyncOutboxState(ticket) {
 const state=verifiedStates.get(ticket);if(!state)fail('unverified');
 return structuredClone(state);
}

/** Capture only a locally committed byte-identical snapshot. First capture is
 * a LOCAL root, not accepting a remote portfolio/key or applying remote data.
 */
export function appendSyncOutboxState({ticket=null,receipt,portfolio,expectedPortfolioId,expectedEpochId}) {
 const v=readVerifiedSyncFrame(receipt),d=v.descriptor;
 if(!portfolio||portfolio.deleted||!integer(portfolio.revision)||portfolio.raw!==v.plain||
  d.portfolioId!==expectedPortfolioId||v.epochId!==expectedEpochId)fail('capture-binding');
 let state=ticket===null?null:readSyncOutboxState(ticket);
 if(state) {
  if(state.portfolioId!==expectedPortfolioId||state.epochId!==expectedEpochId)fail('identity');
  const last=state.entries.at(-1);
  const existing=state.entries.find(e=>e.revision.revisionId===d.revisionId);
  if(existing) {
   // No re-capture at a later CAS even if payload happened to return to same bytes.
   if(existing.frameText===v.frameText&&same(existing.revision,d)&&existing.capturedLocalRevision===portfolio.revision)return state;
   fail('revision-conflict');
  }
  if(d.parentId!==last.revision.revisionId||BigInt(d.generation)!==BigInt(last.revision.generation)+1n||
   portfolio.revision<=last.capturedLocalRevision)fail('stale-parent-or-cas');
  if(state.version===Number.MAX_SAFE_INTEGER)fail('version');
  state.version++;
 }else {
  if(d.parentId!==null||d.generation!=='1')fail('local-root-required');
  state={format:1,version:1,portfolioId:expectedPortfolioId,epochId:expectedEpochId,disabled:null,entries:[],anchorIndex:-1};
 }
 if(state.entries.length>=SYNC_OUTBOX_ENTRY_LIMIT||
  state.entries.reduce((n,e)=>n+e.frameText.length,0)+v.frameText.length>SYNC_OUTBOX_TEXT_LIMIT)fail('capacity');
 state.entries.push({revision:{...d},capturedLocalRevision:portfolio.revision,frameText:v.frameText,frameDigest:v.frameDigest,status:'pending'});
 return state;
}

/** Pure FRAME-MATCH model only. It proves no actual remote read provenance.
 * The storage adapter must not use this result as a remote acknowledgement.
 * Mark uncertain before send; failures/HTTP never roll status back.
 */
export function advanceSyncOutboxState({ticket,revisionId,readback=null,currentLocalRevision}) {
 const state=readSyncOutboxState(ticket),i=state.entries.findIndex(e=>e.revision.revisionId===revisionId);
 if(i<0||!integer(currentLocalRevision)||currentLocalRevision<state.entries.at(-1).capturedLocalRevision)fail('current-cas');
 const e=state.entries[i];
 if(readback!==null) {
  const v=readVerifiedSyncFrame(readback);
  if(v.frameText!==e.frameText||v.frameDigest!==e.frameDigest||v.epochId!==state.epochId||!same(v.descriptor,e.revision))fail('readback-conflict');
  if(i<=state.anchorIndex)return state;
  if(i!==state.anchorIndex+1)fail('anchor-order');
  e.status='confirmed';state.anchorIndex=i;
 }else {
  if(e.status==='confirmed'||e.status==='uncertain')return state;
  if(i!==state.anchorIndex+1)fail('anchor-order');
  e.status='uncertain';
 }
 if(state.version===Number.MAX_SAFE_INTEGER)fail('version');state.version++;
 return state;
}

export function syncOutboxSummary(ticket,currentLocalRevision) {
 const s=readSyncOutboxState(ticket),last=s.entries.at(-1),anchor=s.entries[s.anchorIndex]??null;
 if(!integer(currentLocalRevision)||currentLocalRevision<last.capturedLocalRevision)fail('current-cas');
 return {portfolioId:s.portfolioId,epochId:s.epochId,version:s.version,head:{...last.revision},
  matchedAnchor:anchor?{...anchor.revision}:null,matchedLocalRevision:anchor?.capturedLocalRevision??null,
  remoteAnchor:null,acknowledgedLocalRevision:null,remoteConfirmation:'unavailable',hasPendingChanges:true};
}

/** A1: pure pre-Apply planning guard, NEVER permission to Apply. All remote
 * descriptors must still come from the future authenticated graph adapter.
 * The local frame/CAS binding is read from persisted state, never supplied by
 * the remote graph. New local saves without a captured successor block first.
 */
export function planSyncOutboxApply({ticket,portfolio,revisions,observationComplete}) {
 const s=readSyncOutboxState(ticket),last=s.entries.at(-1);
 if(!portfolio||portfolio.deleted||!integer(portfolio.revision))return {status:'blocked',reason:'invalid-local-preimage'};
 if(portfolio.revision>last.capturedLocalRevision)return {status:'blocked',reason:'unrepresented-local-changes'};
 if(portfolio.revision!==last.capturedLocalRevision)return {status:'blocked',reason:'local-cas-mismatch'};
 if(portfolio.raw!==verifiedPayloads.get(ticket).at(-1))return {status:'blocked',reason:'local-snapshot-mismatch'};
 if(!Array.isArray(revisions))return {status:'blocked',reason:'invalid-remote-descriptors'};
 // Local offline successors remain heads too; remote B following old A cannot
 // win over a captured local sibling, even when its generation is higher.
 const result=planSyncRevisions({portfolioId:s.portfolioId,localHead:last.revision,localRevision:portfolio.revision,
  revisions:[...s.entries.map(e=>e.revision),...revisions],observationComplete});
 return {...result,expectedSyncVersion:s.version,applyAuthorized:false};
}
