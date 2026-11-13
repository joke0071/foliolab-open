import test from 'node:test';
import assert from 'node:assert/strict';
import {portfolioId,epochId,verify,frame} from './sync-outbox-fixture.mjs';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
import {verifySyncOutboxState,readSyncOutboxState,appendSyncOutboxState,advanceSyncOutboxState,syncOutboxSummary,planSyncOutboxApply} from '../src/sync-outbox-state.js';
const raw='{"quantity":"9007199254740993.00000001","fx":null,"fxState":"UNKNOWN","journal":["J"]}';
export const capture=async(plain=raw,revision=7,extra={})=>appendSyncOutboxState({receipt:await verify(frame(plain)),portfolio:{raw:plain,revision,deleted:false},expectedPortfolioId:portfolioId,expectedEpochId:epochId,...extra});
const ticket=s=>verifySyncOutboxState(s,verify);
const append=async(s,extra={})=>appendSyncOutboxState({ticket:await ticket(s),receipt:await verify(frame(raw+'\n','S','R','2')),portfolio:{raw:raw+'\n',revision:8,deleted:false},expectedPortfolioId:portfolioId,expectedEpochId:epochId,...extra});
test('root captures exact confirmed local bytes, CAS, identity and frame digest; JSON is not proof',async()=>{
 const s=await capture(),t=await ticket(s);assert.equal(s.entries[0].capturedLocalRevision,7);assert.equal(s.anchorIndex,-1);
 assert.equal(s.entries[0].frameDigest,hash(s.entries[0].frameText));assert.equal(s.key,undefined);assert.equal(s.plain,undefined);
 for(const portfolio of [{raw:raw+' ',revision:7},{raw,revision:0},{raw,revision:7,deleted:true}])await assert.rejects(()=>capture(raw,7,{portfolio}),/capture-binding/);
 assert.throws(()=>readSyncOutboxState(JSON.parse(JSON.stringify(t))),/unverified/);
 await assert.rejects(()=>verifySyncOutboxState(s,async()=>({verified:true})),/unverified-receipt/);
});
test('successors require exact parent/generation and newer CAS; same ID cannot be recaptured or reencrypted',async()=>{
 const s=await capture(),t=await ticket(s);assert.equal((await append(s)).entries.length,2);
 for(const [id,parent,gen] of [['R','R','2'],['S','other','2'],['S','R','3']]) {
  const receipt=await verify(frame(raw,id,parent,gen));await assert.rejects(()=>append(s,{receipt,portfolio:{raw,revision:8}}),/conflict|stale-parent/);
 }
 await assert.rejects(()=>append(s,{portfolio:{raw:raw+'\n',revision:7}}),/stale-parent-or-cas/);
 await assert.rejects(async()=>capture(raw,7,{receipt:await verify(frame(raw,'S','R','2'))}),/local-root-required/);
 for(const extra of [{expectedPortfolioId:'B'},{expectedEpochId:'56'.repeat(16)},{portfolio:{raw,revision:8}}])await assert.rejects(()=>capture(raw,7,{ticket:t,...extra}));
 assert.deepEqual(await capture(raw,7,{ticket:t}),s);
});
test('restart re-decrypts actual saved bytes and refuses malformed lineage, disabled state and corrupt frames',async()=>{
 const s=JSON.parse(JSON.stringify(await capture()));let calls=0;
 const t=await verifySyncOutboxState(s,async f=>{calls++;return verify(f);});assert.equal(calls,1);assert.deepEqual(readSyncOutboxState(t),s);
 for(const patch of [{disabled:'explicit-recovery'},{epochId:'56'.repeat(16)},{portfolioId:'B'},{anchorIndex:0},{extra:true},{version:0}])await assert.rejects(()=>verifySyncOutboxState({...s,...patch},verify));
 for(const patch of [{frameDigest:'0'.repeat(64)},{revision:{...s.entries[0].revision,deviceId:'E'}},{capturedLocalRevision:0},{extra:true}]) {
  const bad=structuredClone(s);Object.assign(bad.entries[0],patch);await assert.rejects(()=>verifySyncOutboxState(bad,verify));
 }
 const bad=await append(s);bad.entries[1].capturedLocalRevision=7;await assert.rejects(()=>ticket(bad),/lineage/);
 const full=structuredClone(s);full.entries=Array.from({length:129},()=>s.entries[0]);await assert.rejects(()=>ticket(full),/format-or-disabled/);
 const dupe=structuredClone(s);dupe.entries.push(s.entries[0]);await assert.rejects(()=>ticket(dupe),/duplicate-revision/);
});
test('before-send uncertain persists; only exact readback advances contiguous anchor and protects newer saves',async()=>{
 let s=await append(await capture());s=advanceSyncOutboxState({ticket:await ticket(s),revisionId:'R',currentLocalRevision:8});
 assert.equal(s.entries[0].status,'uncertain');assert.equal(s.anchorIndex,-1);
 assert.equal(syncOutboxSummary(await ticket(s),9).acknowledgedLocalRevision,null);
 await assert.rejects(async()=>advanceSyncOutboxState({ticket:await ticket(s),revisionId:'S',currentLocalRevision:8,readback:await verify(s.entries[1].frameText)}),/anchor-order/);
 s=advanceSyncOutboxState({ticket:await ticket(s),revisionId:'R',currentLocalRevision:9,readback:await verify(s.entries[0].frameText)});
 assert.equal(s.anchorIndex,0);assert.equal(s.entries[1].status,'pending');assert.equal(syncOutboxSummary(await ticket(s),9).matchedLocalRevision,7);
 s=advanceSyncOutboxState({ticket:await ticket(s),revisionId:'S',currentLocalRevision:9,readback:await verify(s.entries[1].frameText)});
 assert.equal(syncOutboxSummary(await ticket(s),8).hasPendingChanges,true);assert.equal(syncOutboxSummary(await ticket(s),9).hasPendingChanges,true);
});
test('fresh valid ciphertext is conflict; copies cannot mutate private state; stale CAS/version overflow block',async()=>{
 const s=await capture(),pending=ticket(s);s.entries[0].capturedLocalRevision=99;const t=await pending;
 const copy=readSyncOutboxState(t);copy.entries[0].capturedLocalRevision=99;assert.equal(readSyncOutboxState(t).entries[0].capturedLocalRevision,7);
 const receipt=await verify(frame(raw,'R',null,'1','45'.repeat(32)));
 assert.throws(()=>advanceSyncOutboxState({ticket:t,revisionId:'R',currentLocalRevision:7,readback:receipt}),/readback-conflict/);
 assert.throws(()=>advanceSyncOutboxState({ticket:t,revisionId:'R',currentLocalRevision:6}),/current-cas/);
 assert.throws(()=>syncOutboxSummary(t,6),/current-cas/);
 const capped=readSyncOutboxState(t);capped.version=Number.MAX_SAFE_INTEGER;
 await assert.rejects(async()=>advanceSyncOutboxState({ticket:await ticket(capped),revisionId:'R',currentLocalRevision:7}),/version/);
});

test('A1: remote B after A cannot overwrite CAS43 local save unrepresented since captured CAS42',async()=>{
 const s=await capture(raw,42),t=await ticket(s);
 const b={...s.entries[0].revision,revisionId:'B',parentId:'R',generation:'2'};
 const args={ticket:t,revisions:[b],observationComplete:true};
 assert.equal(planSyncOutboxApply({...args,portfolio:{raw:raw+'changed',revision:43}}).reason,'unrepresented-local-changes');
 // Even a CAS43 save returning to identical bytes is not retroactively CAS42.
 assert.equal(planSyncOutboxApply({...args,portfolio:{raw,revision:43}}).reason,'unrepresented-local-changes');
 assert.equal(planSyncOutboxApply({...args,portfolio:{raw:'different',revision:42}}).reason,'local-snapshot-mismatch');
 assert.equal(planSyncOutboxApply({...args,portfolio:{raw,revision:41}}).reason,'local-cas-mismatch');
 const clean=planSyncOutboxApply({...args,portfolio:{raw,revision:42}});
 assert.equal(clean.status,'apply-candidate');assert.equal(clean.applyAuthorized,false);assert.equal(clean.expectedLocalRevision,42);
});
test('A1: old frame cannot be rebound to a later CAS or a different local snapshot',async()=>{
 const s=await capture(raw,42),t=await ticket(s),receipt=await verify(frame(raw));
 await assert.rejects(()=>capture(raw,43,{ticket:t,receipt}),/revision-conflict/);
 await assert.rejects(()=>capture(raw,43,{receipt,portfolio:{raw:raw+'changed',revision:43}}),/capture-binding/);
 const local=await append(s,{portfolio:{raw:raw+'\n',revision:43}}),lt=await ticket(local);
 const sibling={...s.entries[0].revision,revisionId:'B',parentId:'R',generation:'2'};
 const plan=planSyncOutboxApply({ticket:lt,portfolio:{raw:raw+'\n',revision:43},revisions:[sibling],observationComplete:true});
 assert.equal(plan.status,'conflict');assert.deepEqual(plan.heads,['B','S']);assert.equal(plan.applyAuthorized,false);
});
test('A2: local frame match exposes no acknowledged remote CAS, anchor or synchronized status',async()=>{
 let s=await capture(raw,42);s=advanceSyncOutboxState({ticket:await ticket(s),revisionId:'R',readback:await verify(s.entries[0].frameText),currentLocalRevision:42});
 const summary=syncOutboxSummary(await ticket(s),42);
 assert.equal(summary.matchedLocalRevision,42);assert.equal(summary.remoteAnchor,null);
 assert.equal(summary.acknowledgedLocalRevision,null);assert.equal(summary.remoteConfirmation,'unavailable');assert.equal(summary.hasPendingChanges,true);
});
