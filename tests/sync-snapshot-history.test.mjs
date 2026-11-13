import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,backup,createProvider,createPosition,snapshot} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {validateHistorySession} from '../src/wallet-history-state.js';
import {replayWalletHistory} from '../src/wallet-history-core.js';
import {valueHistoryRows} from '../src/wallet-history-valuation.js';
import {createSyncSnapshot,validateSyncSnapshot,SYNC_SNAPSHOT_KIND} from '../src/sync-snapshot.js';
import {event,stream,NOW} from './wallet-history-fixtures.mjs';

const envelope=data=>JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:1,data});
const session=(chain='eth',overrides={})=>{
 const network={btc:'bitcoin',eth:'ethereum',sol:'solana'}[chain];
 const identity={network,chainId:chain==='eth'?'1':chain,assetId:chain,contract:null,mint:null,decimals:18};
 return validateHistorySession({id:'history-'+chain,chain,walletKey:'public-'+chain,acceptedAt:NOW,
  ...(chain==='btc'?{walletScopeDigest:'ab'.repeat(32)}:{}),
  events:[event({...identity,quantityBaseUnits:'9007199254740993000000000000000001'})],streams:[stream(identity)],
  quotes:[{...identity,date:'2026-10-24',currency:'EUR',priceExact:'0.000000000000000001',source:'fixture',binding:'native-network'}],
  issues:[],...overrides});
};
function fixture(){
 const m=blankModel();m.providers.push(createProvider({id:'provider',name:'Synthetic',type:'broker'}));
 m.positions.push(createPosition({id:'cash',providerId:'provider',kind:'cash',name:'EUR',quantity:10,price:1,currency:'EUR'},m));
 m.positions.push(createPosition({id:'unknown',providerId:'provider',kind:'stock',name:'USD unknown',quantityExact:'1.000000000000000001',price:1,currency:'USD',fxRate:null,fxRateExact:null},m));
 executeTransaction(m,{id:'deposit',type:'deposit',date:'2026-10-24',positionId:'cash',quantity:'1',unitPrice:'1'});
 snapshot(m,'2026-10-24','synthetic',{manualTotalEUR:'11'});
 m.walletHistory={schema:1,sessions:['btc','eth','sol'].map(c=>session(c)),pending:[]};return m;
}
const data=()=>{const d=JSON.parse(backup(fixture(),{includeHistory:true}));delete d.settings;return d;};
async function rejectUnchanged(d,pattern){
 const plain=envelope(d),before=structuredClone(d);
 await assert.rejects(()=>validateSyncSnapshot(plain),pattern);
 await assert.rejects(()=>createSyncSnapshot(JSON.stringify({...d,settings:{localOnly:true}})));
 assert.deepEqual(d,before);assert.equal(envelope(d),plain);
}

test('accepted BTC/ETH/SOL facts roundtrip exactly with finance, journal, UNKNOWN, null and provenance',async()=>{
 const d=data(),source=JSON.stringify({...d,settings:{apiKey:'NEVER_COPY'}}),before=source;
 const plain=await createSyncSnapshot(source),r=await validateSyncSnapshot(plain);
 assert.deepEqual(r.data,d);assert.equal(source,before);assert.ok(!plain.includes('NEVER_COPY'));
 assert.equal(r.data.positions[1].fxRate,null);assert.equal(r.data.positions[1].fxRateExact,'UNKNOWN');
 assert.equal(r.data.positions[1].quantityExact,'1.000000000000000001');
 assert.equal(r.data.positions[0].quantityExact,'11');assert.equal(r.data.journalEntries[0].id,'deposit');
 assert.equal(r.data.walletHistory.sessions[0].walletScopeDigest,'ab'.repeat(32));
 assert.ok(Object.isFrozen(r.data.walletHistory.sessions[0].events[0].locator));
 for(const s of r.data.walletHistory.sessions){
  const replay=replayWalletHistory(s);assert.equal(replay.balances[0].quantityBaseUnits,'9007199254740993000000000000000001');
  const row={...replay.balances[0],date:'2026-10-24'};
  assert.equal(valueHistoryRows([row],s.quotes)[0].eurExact,'0.009007199254740993000000000000000001');
 }
});
test('accepted partial/unknown facts preserve null effects, missing opening and missing quotes',async()=>{
 const d=data();d.walletHistory.sessions=[session('eth',{events:[event({quantityBaseUnits:null,type:'unknown',coverage:'unsupported'})],streams:[stream({opening:null})],quotes:[],issues:['missing-opening']})];
 const r=await validateSyncSnapshot(await createSyncSnapshot(JSON.stringify(d)));
 assert.deepEqual(r.data,d);const s=r.data.walletHistory.sessions[0];
 assert.equal(s.events[0].quantityBaseUnits,null);assert.equal(s.streams[0].opening,null);
 assert.equal(replayWalletHistory(s).balances[0].quantityBaseUnits,null);assert.deepEqual(s.quotes,[]);
 const partial=data();partial.walletHistory.sessions[0].streams[0].coverage.status='partial';
 const kept=await validateSyncSnapshot(await createSyncSnapshot(JSON.stringify(partial)));
 assert.deepEqual(kept.data,partial);assert.equal(replayWalletHistory(kept.data.walletHistory.sessions[0]).balances[0].quantityBaseUnits,null);
});
test('v4 archive and accepted history coexist without changing references',async()=>{
 const d=data();d.version=4;d.bookingPresentation={version:2,archivedIds:['deposit'],referenceArchivedIds:[d.snapshots[0].id]};
 assert.deepEqual((await validateSyncSnapshot(await createSyncSnapshot(JSON.stringify(d)))).data,d);
});
test('unknown fields reject at every accepted-history nesting level, including credentials and object payloads',async()=>{
 const picks=[d=>d.walletHistory,d=>d.walletHistory.sessions[0],d=>d.walletHistory.sessions[0].events[0],d=>d.walletHistory.sessions[0].events[0].locator,
  d=>d.walletHistory.sessions[0].streams[0],d=>d.walletHistory.sessions[0].streams[0].opening,d=>d.walletHistory.sessions[0].streams[0].coverage,d=>d.walletHistory.sessions[0].quotes[0]];
 for(const pick of picks){const d=data();pick(d).oauthToken={secret:'SYNTHETIC'};await rejectUnchanged(d,/envelope/);}
 const d=data();d.walletHistory.sessions[0].issues=[{secret:'SYNTHETIC'}];await rejectUnchanged(d,/envelope/);
});
test('normalizing sources, status, timestamps, missing fields or quote decimals rejects instead of repairing',async()=>{
 const changes=[s=>s.events[0].source='https://rpc.invalid/?token=SYNTHETIC',s=>s.streams[0].coverage.source='https://rpc.invalid/?key=SYNTHETIC',
  s=>s.quotes[0].source='https://quotes.invalid/?key=SYNTHETIC',s=>s.quotes[0].priceExact='1.0000',
  s=>s.events[0].timestamp='2026-10-24T12:00:00Z',s=>s.providerCache='cached',s=>s.decision='pending',s=>{delete s.quotes;}];
 for(const change of changes){const d=data();change(d.walletHistory.sessions[0]);await rejectUnchanged(d,/normalization-required/);}
});
test('duplicate facts/sessions and reordered events cannot be silently deduped or sorted',async()=>{
 let d=data();d.walletHistory.sessions[0].events.push(structuredClone(d.walletHistory.sessions[0].events[0]));await rejectUnchanged(d,/normalization-required/);
 d=data();d.walletHistory.sessions.push(structuredClone(d.walletHistory.sessions[0]));await rejectUnchanged(d,/Doppelte Historien-ID/);
 d=data();const s=d.walletHistory.sessions[0];s.events.push({...structuredClone(s.events[0]),quantityBaseUnits:'2'});await rejectUnchanged(d,/Widersprüchliche/);
 d=data();const s2=d.walletHistory.sessions[0];const second={...s2.events[0],id:undefined,txid:'tx-2'};
 s2.events=validateHistorySession({...s2,events:[...s2.events,second]}).events.reverse();await rejectUnchanged(d,/normalization-required/);
});
test('forged event IDs, orphan streams and false quote bindings reject through existing validators',async()=>{
 const changes=[s=>s.events[0].id='forged',s=>s.streams=[],s=>s.quotes[0].assetId='foreign',s=>s.quotes[0].currency='USD',
  s=>s.events[0].quantityBaseUnits='1.2',s=>s.events[0].decimals=256,s=>s.walletScopeDigest='bad',s=>s.streams[0].throughBlock='-1'];
 for(const change of changes){const d=data();change(d.walletHistory.sessions[0]);await rejectUnchanged(d);}
});
test('canonical resume metadata remains unsupported in full; no portable-history projection drops it',async()=>{
 const d=data();d.walletHistory.pending=[{id:'resume',chain:'btc',walletKey:'public',provider:'fixture',filter:'all',tip:null,scope:null,status:'re-fetch-needed',updatedAt:NOW}];
 await rejectUnchanged(d,/envelope/);
});
test('v5/import/evidence/price payloads stay unsupported even when history is accepted',async()=>{
 const changes=[d=>d.version=5,d=>d.flatexNetRemovals=[],d=>d.purchaseEvidence={schema:1,receipts:[],decisions:[]},
  d=>d.priceHistories={cash:{points:[]}},d=>d.bookings[0].importSource={sourcePayload:'SYNTHETIC'}];
 for(const change of changes){const d=data();change(d);await rejectUnchanged(d,/envelope/);}
});
test('history retains existing session/event/byte/node/depth limits with no truncation',async()=>{
 let d=data();d.walletHistory.sessions=Array.from({length:101},(_,i)=>({...structuredClone(d.walletHistory.sessions[0]),id:'s-'+i}));
 await rejectUnchanged(d,/Historienformat/);
 d=data();d.walletHistory.sessions[0].issues=Array(101).fill('issue');await rejectUnchanged(d,/normalization-required/);
 d=data();d.walletHistory.sessions[0].issues=['€'.repeat(1200000)];await rejectUnchanged(d,/byte-budget/);
 d=data();d.walletHistory.sessions[0].events=Array(100001).fill(null);await rejectUnchanged(d,/node-budget/);
 d=data();let nested='x';for(let i=0;i<20;i++)nested={nested};d.walletHistory.sessions[0].extension=nested;await rejectUnchanged(d,/depth-budget/);
});
