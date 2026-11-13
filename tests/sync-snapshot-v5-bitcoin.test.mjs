import test from 'node:test';
import assert from 'node:assert/strict';
import {ledgerModel,ledgerEvidence,ledgerCSV,at} from './ledger-live-fixture.mjs';
import {safeImport,backup,createPosition} from '../src/model.js';
import {readUnifiedBitcoinFiles,previewUnifiedBitcoin,confirmUnifiedBitcoin,undoUnifiedBitcoin} from '../src/unified-bitcoin.js';
import {sourceDigest} from '../src/import-identity.js';
import {setArchivePresentation} from '../src/booking-history.js';
import {createSyncSnapshot,validateSyncSnapshot,SYNC_SNAPSHOT_KIND} from '../src/sync-snapshot.js';

const envelope=d=>JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:1,data:d});
const input=m=>({receipts:m.purchaseEvidence?.receipts||[],operations:readUnifiedBitcoinFiles([ledgerCSV()]).operations});
const commit=(m,i)=>confirmUnifiedBitcoin(m,i,'wallet',{baseline:previewUnifiedBitcoin(m,i,'wallet').baseline,confirmed:true,externalFunding:true,at});
const canonical=m=>{const d=JSON.parse(backup(m,{includeHistory:true}));delete d.settings;return d;};
function fixture({ledger=true,split=false}={}){
 const m=ledgerEvidence(ledgerModel());
 if(split){const e=m.walletHistory.sessions[0].events[0];m.walletHistory.sessions[0].events=[{...e,quantityBaseUnits:'1200000'},{...e,id:undefined,locator:{kind:'vout',index:'1',subindex:'0'},quantityBaseUnits:'1280000'}];}
 const i=input(m);if(!ledger)i.operations=[];
 return canonical(commit(m,i));
}
async function roundtrip(d){
 const raw=JSON.stringify(d),plain=await createSyncSnapshot(raw),r=await validateSyncSnapshot(plain);
 assert.deepEqual(r.data,d);assert.equal(JSON.stringify(d),raw);assert.equal(r.plain,plain);
 assert.ok(Object.isFrozen(r.data)&&Object.isFrozen(r.data.journalEntries[0]));
 return r.data;
}
async function rejectBoth(d,pattern){
 const raw=JSON.stringify(d);
 await assert.rejects(()=>createSyncSnapshot(raw),pattern);
 await assert.rejects(()=>validateSyncSnapshot(envelope(d)),pattern);
 assert.equal(JSON.stringify(d),raw);
}
const payload=(d,edit)=>{const s=d.bookings[0].importSource,p=JSON.parse(s.sourcePayload);edit(p);s.sourcePayload=JSON.stringify(p);};

test('v5 complete N:1 chain preserves independent quantities, fees, financing and exact provenance',async()=>{
 const d=fixture(),r=await roundtrip(d),b=r.bookings[0],j=r.journalEntries[0];
 assert.equal(r.version,5);assert.equal(b.quantityExact,'0.0248');assert.equal(b.amountExactEUR,'982');assert.equal(b.feeEUR,18);
 assert.equal(r.externalCashFlows[0].amountExactEUR,'1000');assert.equal(r.positions[0].quantityExact,'0.0248');assert.equal(r.positions[0].costBasisExact,null);
 assert.deepEqual(j.postings.map(p=>[p.role,p.amountBookEURExact,p.quantityDeltaExact]),[['asset','982',null],['fee','18',null],['external-clearing','-1000',null]]);
 assert.equal(r.purchaseEvidence.bitcoinLedger.length,1);assert.equal(r.purchaseEvidence.receipts.length,2);
 assert.equal(b.importSource.sourcePayload,d.bookings[0].importSource.sourcePayload);assert.equal(b.importSource.ownedSnapshot,d.bookings[0].importSource.ownedSnapshot);
});
test('v5 purchase without optional Ledger observations is a complete economic chain',async()=>{
 const d=fixture({ledger:false});assert.equal(d.purchaseEvidence.bitcoinLedger,undefined);await roundtrip(d);
});
test('N:M source facts retain every own vout and fingerprint, without double quantity effects',async()=>{
 const d=fixture({split:true}),r=await roundtrip(d);
 assert.equal(JSON.parse(r.bookings[0].importSource.sourcePayload).facts.events.length,2);
 assert.equal(r.purchaseEvidence.bitcoinLedger[0].events.length,2);assert.equal(r.positions[0].quantityExact,'0.0248');
});
test('Ledger first, Bittr first and combined imports roundtrip with one unchanged economic effect',async()=>{
 const start=ledgerEvidence(ledgerModel()),all=input(start);delete start.purchaseEvidence;
 const paths=[commit(start,all),commit(commit(start,{receipts:[],operations:all.operations}),{receipts:all.receipts,operations:[]}),commit(commit(start,{receipts:all.receipts,operations:[]}),{receipts:[],operations:all.operations})];
 for(const model of paths){const r=await roundtrip(canonical(model));assert.equal(r.bookings.length,1);assert.equal(r.externalCashFlows.length,1);
  const restored=safeImport(r),reimported=commit(restored,all);assert.deepEqual(reimported,restored);}
});
test('permanent undo tombstone retains documentary Ledger and receipts, prevents reimport',async()=>{
 const d=fixture(),u=undoUnifiedBitcoin(d,d.bookings[0].id,{confirmed:true,baseline:sourceDigest(JSON.stringify(d)),at});
 const r=await roundtrip(canonical(u));assert.equal(r.bookings.length,0);assert.equal(r.externalCashFlows.length,0);assert.equal(r.journalEntries[0].type,'uh02-undo');
 const m=safeImport(r),i=input(m);assert.equal(previewUnifiedBitcoin(m,i,'wallet').groups[0].status,'removed');assert.deepEqual(commit(m,i),m);
});
test('archive coexists with v5 without format downgrade',async()=>{
 const d=fixture(),a=setArchivePresentation(d,{bookingIds:[d.bookings[0].id]});
 const r=await roundtrip(canonical(a));assert.equal(r.version,5);assert.deepEqual(r.bookingPresentation.archivedIds,[d.bookings[0].id]);
});
test('missing optional chain history stays missing; snapshot confers no new import permission',async()=>{
 const d=fixture();delete d.walletHistory;const r=await roundtrip(d);assert.equal(r.walletHistory,undefined);
 assert.throws(()=>previewUnifiedBitcoin(safeImport(r),input(r),'wallet'),/Historie/);
});
test('stale documentary event fingerprints survive exactly and retain existing preview conflict',async()=>{
 const d=fixture();d.walletHistory.sessions[0].events[0].timestamp='2025-01-01T12:00:01.000Z';
 // A changed timestamp keeps valid coverage but invalidates the old fingerprint.
 const r=await roundtrip(d);assert.throws(()=>previewUnifiedBitcoin(safeImport(r),{receipts:[],operations:[]},'wallet'),/Historienänderung/);
});
test('complete chain coexists with UNKNOWN FX, 18 decimals, price history and no local settings',async()=>{
 const d=fixture();d.positions.push(createPosition({id:'unknown',providerId:'p',accountId:'own',kind:'stock',name:'Synthetic unknown',quantityExact:'1.000000000000000001',price:1,currency:'USD',fxRate:null,fxRateExact:null},d));
 const c=safeImport(d);c.priceHistories.wallet={currency:'EUR',source:'CSV (selbst geprüft)',points:[{date:'2025-01-01',total:1},{date:'2025-01-02',total:2}]};
 const raw=JSON.parse(backup(c,{includeHistory:true}));raw.settings={apiKey:'SECRET',oauth:{token:'SECRET'}};
 const plain=await createSyncSnapshot(JSON.stringify(raw)),r=await validateSyncSnapshot(plain);delete raw.settings;
 assert.deepEqual(r.data,raw);assert.equal(r.data.positions[1].fxRateExact,'UNKNOWN');assert.equal(r.data.positions[1].quantityExact,'1.000000000000000001');assert.ok(!plain.includes('SECRET'));
});
test('internal undefined wallet projection keys do not reject canonical persisted JSON; actual defaults do',async()=>{
 const d=fixture();assert.ok(!Object.hasOwn(d.positions[0].wallet,'chainId'));await roundtrip(d);
 for(const edit of [d=>delete d.positions[0].wallet.contract,d=>d.positions[0].wallet.chainId=null,d=>d.positions[0].wallet.addressType=null,d=>d.positions[0].name=' Synthetic BTC ',d=>d.purchaseEvidence.receipts[0].fiatEUR='500.0']){const x=structuredClone(d);edit(x);await rejectBoth(x);}
});
test('empty v5 and isolated populated Ledger remain wholly unsupported',async()=>{
 const m=ledgerEvidence(ledgerModel()),i=input(m);delete m.purchaseEvidence;
 const only=canonical(commit(m,{receipts:[],operations:i.operations}));assert.equal(only.version,5);assert.equal(only.bookings.length,0);assert.equal(only.purchaseEvidence.bitcoinLedger.length,1);
 await rejectBoth(only,/unsupported-data-or-field|envelope/);
 const empty=canonical(ledgerModel());empty.version=5;await rejectBoth(empty,/unsupported-data-or-field|envelope/);
});
test('downgrades and future versions reject full chain without partial output',async()=>{
 for(const version of [3,4,6]){const d=fixture();d.version=version;if(version===4)d.bookingPresentation={version:1,archivedIds:[]};await rejectBoth(d);}
});
test('unknown provenance keys reject at import source, payload, facts and event levels',async()=>{
 const edits=[d=>d.bookings[0].importSource.accessToken='SECRET',d=>payload(d,p=>p.oauth={token:'SECRET'}),d=>payload(d,p=>p.facts.cache='SECRET'),d=>payload(d,p=>p.facts.events[0].apiKey='SECRET'),d=>payload(d,p=>p.ledgerRefs=[{id:'SECRET'}])];
 for(const edit of edits){const d=fixture();edit(d);await rejectBoth(d,/unsupported-data-or-field|envelope/);}
});
test('opaque ownership string cannot tunnel extension keys or altered journal facts',async()=>{
 const d=fixture(),s=d.bookings[0].importSource,own=JSON.parse(s.ownedSnapshot);own.push({token:'SECRET'});s.ownedSnapshot=JSON.stringify(own);await rejectBoth(d);
 const e=fixture();e.bookings[0].importSource.ownedSnapshot='{"oauth":"SECRET"}';await rejectBoth(e);
});
test('JSON encoded provenance rejects duplicate keys, alternate encoding, malformed Unicode and wrong types',async()=>{
 const edits=[s=>s.sourcePayload=s.sourcePayload.replace('{','{"facts":{},'),s=>s.sourcePayload=JSON.stringify(JSON.parse(s.sourcePayload),null,2),s=>s.sourcePayload='{"facts":',s=>s.sourcePayload=JSON.stringify({walletScopeDigest:'\ud800',facts:{receipts:[],events:[]},ledgerRefs:[]}),s=>s.sourcePayload=null,s=>s.ownedSnapshot={},s=>s.occurrence='1',s=>s.version=2];
 for(const edit of edits){const d=fixture();edit(d.bookings[0].importSource);await rejectBoth(d);}
});
test('missing and contradictory provenance/Receipt/Wallet/financing records reject using existing validators',async()=>{
 const edits=[d=>delete d.purchaseEvidence,d=>d.purchaseEvidence.receipts.pop(),d=>d.journalEntries=[],d=>d.externalCashFlows=[],d=>d.externalCashFlows[0].amountExactEUR='999',d=>d.bookings[0].amountExactEUR='900',d=>d.bookings[0].feeEUR=17,d=>payload(d,p=>p.ledgerRefs=['missing']),d=>payload(d,p=>p.walletScopeDigest='a'.repeat(64)),d=>d.positions[0].wallet.address='1BitcoinEaterAddressDontSendf59kuE',d=>d.bookings[0].importSource.accountId='foreign',d=>d.bookings[0].importSource.ownership='manual'];
 for(const edit of edits){const d=fixture();edit(d);await rejectBoth(d);}
});
test('unknown keys across complete chain and unrelated proof families remain rejected',async()=>{
 const edits=[d=>d.journalEntries[0].postings[0].apiKey='SECRET',d=>d.journalEntries[0].krakenWithdrawal={},d=>d.journalEntries[0].managementAudit={},d=>d.purchaseEvidence.bitcoinLedger[0].oauth='SECRET',d=>d.purchaseEvidence.bitcoinLedger[0].events[0].cache='SECRET',d=>d.flatexNetRemovals=[],d=>d.walletHistory.pending=[{id:'pending'}],d=>d.bookings[0].importSource.sourceId='generic-csv',d=>d.bookings[0].importSource.sourceId='kraken-uh03-v1'];
 for(const edit of edits){const d=fixture();edit(d);await rejectBoth(d,/unsupported-data-or-field|envelope/);}
});
