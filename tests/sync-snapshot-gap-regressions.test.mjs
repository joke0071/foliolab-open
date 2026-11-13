// Reject/accept regressions derived from Agent B's pinned gap report65765d3a.
// Test the NEW closed gate, not a repetition of the 41 legacy characterizations.
import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createPosition,backup,snapshot} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {createSyncSnapshot,validateSyncSnapshot,SYNC_SNAPSHOT_KIND} from '../src/sync-snapshot.js';
const marker='SYNTHETIC_CREDENTIAL_NEVER_REAL';
function fixture(){
 const m=blankModel(),p=createProvider({id:'synthetic-provider',name:'Synthetic',type:'broker'});m.providers.push(p);
 m.positions.push(createPosition({id:'synthetic-cash',providerId:p.id,name:'Synthetic cash',kind:'cash',quantity:10,price:1,currency:'EUR'},m));
 executeTransaction(m,{type:'deposit',date:'2026-11-13',positionId:m.positions[0].id,quantity:1,unitPrice:1});snapshot(m,'2026-11-13','',{manualTotalEUR:'11'});return m;
}
const envelope=data=>JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:1,data});
const data=async()=>JSON.parse(await createSyncSnapshot(backup(fixture(),{includeHistory:true}))).data;
test('B regression: full supported journal/snapshot keeps independent amount11 and all source IDs',async()=>{
 const m=fixture(),raw=backup(m,{includeHistory:true}),result=await validateSyncSnapshot(await createSyncSnapshot(raw));
 assert.equal(result.data.positions[0].quantityExact,'11');assert.equal(result.data.openingPositions[0].quantityExact,'10');
 assert.deepEqual(result.data.journalEntries,JSON.parse(raw).journalEntries);assert.deepEqual(result.data.snapshots,JSON.parse(raw).snapshots);
});
test('B regression: unknown root credentials and foreign portfolio identity reject the whole payload',async()=>{
 for(const key of ['apiKey','oauthToken','password','privateDeviceCredential','portfolioId']){
  const d=await data();d[key]=marker;const plain=envelope(d);
  await assert.rejects(()=>validateSyncSnapshot(plain),/envelope/);assert.equal(envelope(d),plain);
 }
});
test('B regression: booking, journal and posting credentials never survive the closed gate',async()=>{
 for(const pick of [d=>d.bookings[0],d=>d.journalEntries[0],d=>d.journalEntries[0].postings[0]]){
  const d=await data();pick(d).privateDeviceCredential=marker;await assert.rejects(()=>validateSyncSnapshot(envelope(d)),/envelope/);
 }
});
test('B regression: historical credential objects reject in revision, quote time and account value',async()=>{
 for(const mutate of [s=>s.revisions=[{password:marker}],s=>s.quoteTimes=[{oauthToken:marker}],s=>s.byAccount={'nonexistent-account':{apiKey:marker}}]){
  const d=await data();mutate(d.snapshots[0]);await assert.rejects(()=>validateSyncSnapshot(envelope(d)),/envelope/);
 }
});
test('B regression: decimal normalization is rejected without changing source bytes or balances',async()=>{
 const d=await data();d.openingPositions[0].quantityExact='10.0000';const plain=envelope(d);
 await assert.rejects(()=>validateSyncSnapshot(plain),/normalization-required/);
 assert.equal(envelope(d),plain);assert.equal(d.openingPositions[0].quantityExact,'10.0000');assert.equal(d.positions[0].quantityExact,'11');
});
test('B regression: complete configuration and wallet resume data are blocked, never dropped or rewritten',async()=>{
 const d=await data();d.walletHistory={schema:1,sessions:[],pending:[{id:'pending',chain:'btc',walletKey:'synthetic',provider:'synthetic',filter:'all',updatedAt:'2026-11-13T00:00:00.000Z',status:'running',oauthToken:marker}]};
 const plain=envelope(d);await assert.rejects(()=>validateSyncSnapshot(plain),/envelope/);assert.equal(envelope(d),plain);
 const raw=JSON.stringify({kind:'FolioLabCompleteBackup',data:await data(),configuration:{settings:{coinGeckoKey:marker}}});
 await assert.rejects(()=>createSyncSnapshot(raw),/unsupported-data-or-field/);
});
test('B regression: oversized historic metadata cannot use importer row limits to bypass byte limits',async()=>{
 const d=await data();d.snapshots[0].revisions=[{opaque:'x'.repeat(10000001)}];
 await assert.rejects(()=>validateSyncSnapshot(envelope(d)),/payload-size-or-type/);
});

test('B budget regression: multibyte bytes, not just character count, bound received plaintext',async()=>{
 const d=await data();d.snapshots[0].note='€'.repeat(1200000);
 await assert.rejects(()=>validateSyncSnapshot(envelope(d)),/byte-budget/);
});
test('B budget regression: deeply nested and excessive-node extensions fail before financial projection',async()=>{
 const deep=await data();let nested='x';for(let i=0;i<20;i++)nested={nested};deep.extension=nested;
 await assert.rejects(()=>validateSyncSnapshot(envelope(deep)),/depth-budget/);
 const wide=await data();wide.extension=Array(100001).fill(null);
 await assert.rejects(()=>validateSyncSnapshot(envelope(wide)),/node-budget/);
});
