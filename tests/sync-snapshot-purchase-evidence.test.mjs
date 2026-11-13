import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,backup,createProvider,createPosition,safeImport} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {validateHistorySession} from '../src/wallet-history-state.js';
import {validateImportedPriceHistory} from '../src/historical-csv.js';
import {validatePurchaseReceipt,validatePurchaseEvidence,confirmPurchaseEvidence,unlinkPurchaseEvidence,previewPurchaseEvidence} from '../src/purchase-evidence.js';
import {createSyncSnapshot,validateSyncSnapshot,SYNC_SNAPSHOT_KIND} from '../src/sync-snapshot.js';

const at='2025-01-01T12:00:00.000Z',txid='a'.repeat(64);
const receipt=(v={})=>validatePurchaseReceipt({provider:'bittr',currency:'EUR',timestamp:at,txid,fiatEUR:'500',serviceFeeEUR:'9',grossBTC:'0.0125',miningFeeBTC:'0.0001',netBTC:'0.0124',...v});
const event=(index,amount)=>({network:'bitcoin',chainId:'mainnet',accountId:'own',walletId:'own',assetId:'bitcoin',contract:null,mint:null,txid,locator:{kind:'vout',index,subindex:'0'},blockHeight:'10',blockHash:'b'.repeat(64),txIndex:null,timestamp:at,decimals:8,quantityBaseUnits:amount,includedInEventId:null,type:'incoming',source:'synthetic',status:'confirmed',finality:'confirmed',observedAt:at,coverage:'verified',qualityCode:'synthetic'});
const session=()=>validateHistorySession({id:'synthetic',chain:'btc',walletKey:'wallet',acceptedAt:at,events:[event('0','1200000'),event('1','1280000')],streams:[{network:'bitcoin',chainId:'mainnet',accountId:'own',assetId:'bitcoin',contract:null,mint:null,decimals:8,throughBlock:'10',opening:{quantityBaseUnits:'0',beforeBlock:'0',source:'synthetic'},coverage:{status:'verified',fromBlock:'0',toBlock:'10',tipHash:'b'.repeat(64),source:'synthetic'}}],quotes:[],issues:[]});
function fixture(link=true){
 let m=blankModel();m.providers.push(createProvider({id:'provider',name:'Synthetic',type:'broker'}));
 m.positions.push(createPosition({id:'cash',providerId:'provider',kind:'cash',name:'EUR',quantity:10,price:1,currency:'EUR'},m));
 m.positions.push(createPosition({id:'unknown',providerId:'provider',kind:'stock',name:'USD unknown',quantityExact:'1.000000000000000001',price:100,currency:'USD',fxRate:null,fxRateExact:'UNKNOWN'},m));
 executeTransaction(m,{id:'deposit',type:'deposit',date:'2025-01-01',positionId:'cash',quantity:'1',unitPrice:'1'});
 m.priceHistories.unknown=validateImportedPriceHistory({currency:'USD',source:'CSV (selbst geprüft)',points:[{date:'2025-01-02',total:100},{date:'2025-01-03',total:101}],fxPoints:[{date:'2025-01-03',currency:'USD',rate:'1.123456789012345678',source:'Frankfurter',referenceDate:'2025-01-02'}]},m.positions[1]);
 const s=session();m.walletHistory={schema:1,sessions:[s],pending:[]};
 m=confirmPurchaseEvidence(m,{receipts:[receipt({fiatEUR:'501'}),receipt()],confirmed:true,at,...(link?{receiptIds:[receipt().id,receipt({fiatEUR:'501'}).id],eventIds:s.events.map(e=>e.id),session:s,accountId:'own'}:{})});
 const d=JSON.parse(backup(m,{includeHistory:true}));delete d.settings;return d;
}
const envelope=data=>JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:1,data});
async function roundtrip(data){
 const raw=JSON.stringify(data),expected=structuredClone(data);delete expected.settings;
 const plain=await createSyncSnapshot(raw),r=await validateSyncSnapshot(plain);
 assert.equal(JSON.stringify(data),raw);assert.equal(plain,envelope(expected));assert.deepEqual(r.data,expected);
 assert.deepEqual(JSON.parse(JSON.stringify(safeImport(r.data))).purchaseEvidence,expected.purchaseEvidence);return r.data;
}
async function rejectBoth(data,reason){
 const raw=JSON.stringify(data),received=structuredClone(data);delete received.settings;
 await assert.rejects(()=>createSyncSnapshot(raw),reason);
 await assert.rejects(()=>validateSyncSnapshot(envelope(received)),reason);
 assert.equal(JSON.stringify(data),raw);
}

test('N:M split receipt provenance roundtrips with exact finance, journal, FX and history',async()=>{
 const d=fixture(),out=await roundtrip(d);
 assert.equal(out.positions[1].fxRateExact,'UNKNOWN');assert.equal(out.positions[1].fxRate,null);
 assert.equal(out.positions[1].quantityExact,'1.000000000000000001');
 assert.equal(out.priceHistories.unknown.fxPoints[0].rate,'1.123456789012345678');
 assert.deepEqual(out.journalEntries,d.journalEntries);assert.deepEqual(out.bookings,d.bookings);
 assert.equal(previewPurchaseEvidence(out,[],out.walletHistory.sessions[0],'own')[0].status,'linked');
 assert.ok(Object.isFrozen(out.purchaseEvidence.decisions[0].events[0]));
});
test('unlinked receipts, absent evidence, empty evidence and optional empty ledger retain shape',async()=>{
 for(const edit of [d=>{},d=>delete d.purchaseEvidence,d=>d.purchaseEvidence={schema:1,receipts:[],decisions:[]},d=>d.purchaseEvidence.bitcoinLedger=[]]){
  const d=fixture(false);edit(d);await roundtrip(d);
 }
});
test('link unlink relink chronology and receipt/event order stay exact in v4',async()=>{
 let d=fixture();d=unlinkPurchaseEvidence(d,receipt().id,at);
 const s=d.walletHistory.sessions[0];d=confirmPurchaseEvidence(d,{receipts:[],receiptIds:d.purchaseEvidence.receipts.map(r=>r.id),eventIds:s.events.map(e=>e.id).reverse(),session:s,accountId:'own',confirmed:true,at});
 d.version=4;d.bookingPresentation={version:1,archivedIds:['deposit']};
 const out=await roundtrip(d);assert.deepEqual(out.purchaseEvidence.decisions.map(x=>x.action),['link','unlink','link']);
});
test('stale session wallet or fingerprints remain conflicts, never new authority',async()=>{
 for(const edit of [d=>d.purchaseEvidence.decisions[0].sessionId='old-session',d=>d.purchaseEvidence.decisions[0].walletKey='old-wallet',d=>d.purchaseEvidence.decisions[0].events[0].fingerprint='f'.repeat(64),d=>d.walletHistory.sessions=[]]){
  const d=fixture();edit(d);const s=d.walletHistory.sessions[0]??null;
  assert.equal(previewPurchaseEvidence(d,[],s,'own')[0].status,'conflict');
  const out=await roundtrip(d);assert.equal(previewPurchaseEvidence(out,[],out.walletHistory.sessions[0]??null,'own')[0].status,'conflict');
 }
});
test('settings excluded and all unknown fields reject at every purchase level',async()=>{
 const d=fixture();d.settings={apiKey:'SETTINGS_SECRET'};assert.ok(!JSON.stringify(await roundtrip(d)).includes('SETTINGS_SECRET'));
 for(const get of [d=>d.purchaseEvidence,d=>d.purchaseEvidence.receipts[0],d=>d.purchaseEvidence.decisions[0],d=>d.purchaseEvidence.decisions[0].events[0]]){
  const d=fixture();get(d).accessToken='SECRET';await rejectBoth(d,/unsupported-data-or-field|envelope/);
 }
 for(const get of [d=>d.purchaseEvidence.bitcoinLedger[0],d=>d.purchaseEvidence.bitcoinLedger[0].events[0]]){
  const d=fixture();d.purchaseEvidence.bitcoinLedger=[ledger()];get(d).apiKey='SECRET';await rejectBoth(d,/unsupported-data-or-field|envelope/);
 }
});
test('known purchase fields reject wrong types and arbitrary config objects',async()=>{
 for(const edit of [d=>d.purchaseEvidence.schema=2,d=>d.purchaseEvidence.receipts={},d=>d.purchaseEvidence.decisions=null,d=>d.purchaseEvidence.receipts[0].fiatEUR=501,d=>d.purchaseEvidence.receipts[0].txid={key:'SECRET'},d=>d.purchaseEvidence.decisions[0].at=0,d=>d.purchaseEvidence.decisions[0].receiptIds=[1],d=>d.purchaseEvidence.decisions[0].events[0].fingerprint=null,d=>d.purchaseEvidence.bitcoinLedger=null]){
  const d=fixture();edit(d);await rejectBoth(d,/unsupported-data-or-field|envelope/);
 }
});
test('corrupt receipts, arithmetic, IDs and duplicate receipts fail the existing validator',async()=>{
 for(const edit of [e=>e.receipts[0].fiatEUR='502',e=>e.receipts[0].netBTC='0.0123',e=>e.receipts[0].serviceFeeEUR='999',e=>e.receipts[0].id='f'.repeat(64),e=>e.receipts.push({...e.receipts[0]}),e=>e.receipts[0].currency='USD',e=>e.receipts[0].timestamp='2025-02-30T12:00:00.000Z']){
  const d=fixture();edit(d.purchaseEvidence);await rejectBoth(d,/Kaufbeleg/);
 }
});
test('orphan receipt, invalid decisions, duplicated active events and invalid unlink fail',async()=>{
 for(const edit of [e=>e.decisions[0].receiptIds[0]='f'.repeat(64),e=>e.decisions[0].receiptIds.push(e.decisions[0].receiptIds[0]),e=>e.decisions[0].events.push({...e.decisions[0].events[0]}),e=>e.decisions[0].events=[],e=>e.decisions[0].events[0].fingerprint='bad',e=>e.decisions[0].action='auto',e=>e.decisions[0].action='unlink',e=>e.decisions.push(structuredClone(e.decisions[0])),e=>e.decisions.push({...structuredClone(e.decisions[0]),action:'unlink'}),e=>e.decisions.push({...structuredClone(e.decisions[0]),action:'unlink',events:[],walletKey:'other'})]){
  const d=fixture();edit(d.purchaseEvidence);await rejectBoth(d,/Kaufbeleg/);
 }
});
test('validator projections timestamps decimals and missing receipt IDs cannot normalize silently',async()=>{
 for(const edit of [e=>e.receipts[0].fiatEUR+='.0',e=>e.receipts[0].timestamp=at.replace('.000Z','Z'),e=>e.decisions[0].at=at.replace('.000Z','Z'),e=>delete e.receipts[0].id]){
  const d=fixture();edit(d.purchaseEvidence);await rejectBoth(d,/normalization-required|Kaufbeleg/);
 }
});
const ledger=()=>({id:'c'.repeat(64),ownerDigest:'d'.repeat(64),txid,timestamp:at,amountBTC:'0.0248',events:[{id:'old-observation',fingerprint:'e'.repeat(64)}]});
test('populated bitcoin ledger stays v5-gated and is never silently pruned or downgraded',async()=>{
 const d=fixture();d.purchaseEvidence.bitcoinLedger=[ledger()];
 assert.deepEqual(validatePurchaseEvidence(d.purchaseEvidence),d.purchaseEvidence);
 for(const version of [3,4,5]){
  const copy=structuredClone(d);copy.version=version;if(version===4)copy.bookingPresentation={version:1,archivedIds:['deposit']};
  await rejectBoth(copy,version===5?/unsupported-data-or-field|envelope/:/Datenversion/);
 }
});
test('oversized decision references and malformed ledger block the entire portfolio',async()=>{
 const d=fixture();d.purchaseEvidence.decisions[0].events[0].id='x'.repeat(16385);await rejectBoth(d,/Kaufbeleg/);
 for(const edit of [e=>e.bitcoinLedger[0].amountBTC='-1',e=>e.bitcoinLedger[0].ownerDigest='bad',e=>e.bitcoinLedger[0].events=[],e=>e.bitcoinLedger.push({...e.bitcoinLedger[0]})]){
  const d=fixture();d.purchaseEvidence.bitcoinLedger=[ledger()];edit(d.purchaseEvidence);
  assert.throws(()=>validatePurchaseEvidence(d.purchaseEvidence),/Kaufbeleg/);await rejectBoth(d,/Datenversion/);
 }
});
test('other evidence, pending history and v5 still reject supported purchase receipts',async()=>{
 for(const edit of [d=>d.version=5,d=>d.flatexNetRemovals=[],d=>d.walletHistory.pending=[{id:'pending'}],d=>d.bookings[0].importSource={sourcePayload:'SECRET'}]){
  const d=fixture();edit(d);await rejectBoth(d,/unsupported-data-or-field|envelope/);
 }
});
