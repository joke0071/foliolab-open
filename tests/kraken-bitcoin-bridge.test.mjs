import {parseLedgerLiveCSV} from '../src/ledger-live.js';
import {previewUnifiedBitcoin,confirmUnifiedBitcoin} from '../src/unified-bitcoin.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {bridgeFixture} from './kraken-bitcoin-bridge-fixture.mjs';
import {prepareKrakenBitcoinBridge,validateKrakenBitcoinBridges} from '../src/kraken-bitcoin-bridge.js';
import {previewKrakenImport,confirmKrakenImport,previewKrakenWithdrawal,confirmKrakenWithdrawal} from '../src/kraken-import.js';
import {backup,safeImport} from '../src/model.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
const plan=f=>{const bitcoinBridge=prepareKrakenBitcoinBridge(f.m,f.group,f.proofInput);return {bitcoinBridge,...previewKrakenImport(f.m,[f.text],f.assignments,{bitcoinBridge,openingConfirmed:true})};};
function confirm(f){const p=plan(f);assert.deepEqual(p.issues,[]);return confirmKrakenImport(f.m,[f.text],f.assignments,{bitcoinBridge:p.bitcoinBridge,openingConfirmed:true,confirmed:true,baseline:p.baseline});}
test('Kraken -> already scanned own BTC debits principal and exchange fee once; Ledger mining fee is documentary',()=>{
 const f=bridgeFixture(),before=JSON.stringify(f.m),d=confirm(f);
 assert.equal(JSON.stringify(f.m),before);assert.equal(d.version,5);assert.equal(d.positions[0].quantityExact,'0');assert.deepEqual(d.positions.at(-1),f.m.positions.at(-1));assert.equal(d.bookings.length,2);assert.equal(d.externalCashFlows.length,0);assert.equal(ledgerQuantityAudit(d).ok,true);
 const proof=d.journalEntries[0].krakenBitcoinBridge;assert.equal(proof.principalBTC,'0.02');assert.equal(proof.exchangeFeeBTC,'0.00003');assert.equal(proof.transactionFeeBTC,'0.000004');assert.equal(d.bookings.find(b=>b.type==='fee').quantityExact,'0.00003');
 assert.deepEqual(d.walletHistory,f.m.walletHistory);validateKrakenBitcoinBridges(d);
});
test('proof absent cannot authorize internal transfer; wrong source, network event, amount and ownership are blocked',()=>{
 const f=bridgeFixture();assert.ok(previewKrakenImport(f.m,[f.text],f.assignments,{openingConfirmed:true}).issues.length);
 for(const mutate of [x=>x.proofInput.reference='wrong',x=>x.proofInput.txid='f'.repeat(64),x=>x.proofInput.destination='foreign',x=>x.proofInput.transaction.fee++,x=>x.proofInput.transaction.vout[0].value++,x=>x.m.positions.at(-1).wallet.address='1BitcoinEaterAddressDontSendf59kuE',x=>x.proofInput.ledgerCSV=x.ledger.replace('0.02','0.02000001'),x=>x.m.walletHistory.sessions[0].events[0].coverage='partial',x=>x.m.walletHistory.sessions[0].events.push({...x.m.walletHistory.sessions[0].events[0],id:undefined,locator:{kind:'vout',index:'1',subindex:'0'}})]){
  const x=bridgeFixture();mutate(x);assert.throws(()=>prepareKrakenBitcoinBridge(x.m,x.group,x.proofInput));
 }
});
test('reload, no-history backup and reimport preserve one source effect',()=>{
 const f=bridgeFixture(),d=confirm(f),r=safeImport(JSON.parse(backup(d))),p=previewKrakenImport(r,[f.text],f.assignments,{openingConfirmed:true});
 assert.equal(p.duplicates,1);assert.deepEqual(p.issues,[]);assert.equal(confirmKrakenImport(r,[f.text],f.assignments,{baseline:p.baseline,confirmed:true}),r);
 const full=safeImport(JSON.parse(backup(d,{includeHistory:true})));assert.equal(full.bookings.length,2);assert.deepEqual(full.walletHistory,d.walletHistory);
 const x=bridgeFixture(),proof=prepareKrakenBitcoinBridge(x.m,x.group,x.proofInput);x.m.walletHistory.sessions=[];assert.throws(()=>prepareKrakenBitcoinBridge(x.m,x.group,x.proofInput));
 // A checked immutable proof remains portable; a new proof always requires accepted own history.
 assert.ok(previewKrakenImport(x.m,[x.text],x.assignments,{bitcoinBridge:proof,openingConfirmed:true}).issues.length);
 assert.ok(proof.event.id);assert.equal(backup(r).includes('krakenBitcoinBridge'),true);
});
test('CAS baseline and changed opening protections remain; selection cannot apply another group proof',()=>{
 const f=bridgeFixture(),p=plan(f);assert.throws(()=>confirmKrakenImport(f.m,[f.text],f.assignments,{bitcoinBridge:p.bitcoinBridge,confirmed:true,openingConfirmed:true,baseline:'stale'}),/erneut/);
 const changed=structuredClone(f.m);changed.positions[0].quantityExact='2';changed.positions[0].quantity=2;changed.openingPositions[0].quantityExact='2';assert.ok(previewKrakenImport(changed,[f.text],f.assignments,{bitcoinBridge:p.bitcoinBridge,openingConfirmed:true}).issues.length);
 assert.ok(previewKrakenImport(f.m,[f.text],f.assignments,{bitcoinBridge:{...p.bitcoinBridge,group:'0'.repeat(64)},openingConfirmed:true}).issues.length);
});
test('source, event and wallet evidence changes cannot silently survive reload/restore or v5 downgrade',()=>{
 const d=confirm(bridgeFixture());
 for(const mutate of [x=>delete x.journalEntries[0].krakenBitcoinBridge,x=>x.journalEntries[0].krakenBitcoinBridge.principalBTC='0.02000001',x=>x.journalEntries[0].krakenBitcoinBridge.destination='foreign',x=>x.positions.at(-1).wallet.address='1BitcoinEaterAddressDontSendf59kuE',x=>x.bookings.find(b=>b.type==='fee').quantityExact='0.00004',x=>x.version=3]){
  const x=structuredClone(d);mutate(x);assert.throws(()=>safeImport(x));assert.throws(()=>backup(x));
 }
});
test('terminal economic removal retains Ledger/chain proof, restores exchange only and permanently blocks replay',()=>{
 const f=bridgeFixture(),d=confirm(f),options={selectedGroups:[f.group.id]},p=previewKrakenWithdrawal(d,[f.text],f.assignments,options);
 const removed=confirmKrakenWithdrawal(d,[f.text],f.assignments,{...options,baseline:p.baseline,confirmed:true});
 assert.equal(removed.positions[0].quantityExact,'0.02003');assert.deepEqual(removed.positions.at(-1),f.m.positions.at(-1));assert.equal(removed.bookings.length,0);assert.equal(removed.version,5);assert.deepEqual(removed.walletHistory,d.walletHistory);assert.ok(removed.journalEntries[0].krakenWithdrawal.originals[0].journal.krakenBitcoinBridge);
 assert.ok(previewKrakenImport(removed,[f.text],f.assignments,{openingConfirmed:true}).issues.length);assert.equal(safeImport(JSON.parse(backup(removed))).bookings.length,0);
});

test('Ledger first / exchange first preserve quantities, source bindings and independent Ledger observations',()=>{
 const ledger=f=>{const input={receipts:[],operations:parseLedgerLiveCSV(f.ledger).operations},p=previewUnifiedBitcoin(f.m,input,'own-btc');return confirmUnifiedBitcoin(f.m,input,'own-btc',{confirmed:true,externalFunding:true,baseline:p.baseline});};
 const a=bridgeFixture();a.m=ledger(a);const firstLedger=confirm(a);
 const b=bridgeFixture();b.m=confirm(b);const firstKraken=ledger(b);
 const economics=m=>({positions:m.positions,flows:m.externalCashFlows,quantities:m.bookings.map(b=>[b.type,b.quantityExact]),evidence:m.purchaseEvidence.bitcoinLedger,proof:m.journalEntries.find(j=>j.krakenBitcoinBridge).krakenBitcoinBridge});
 assert.deepEqual(economics(firstLedger),economics(firstKraken));
});
test('an incoming transfer cannot also become a separately financed Bittr acquisition',()=>{
 const d=confirm(bridgeFixture());d.purchaseEvidence={schema:1,decisions:[],receipts:[{txid:d.journalEntries[0].krakenBitcoinBridge.txid}]};assert.throws(()=>validateKrakenBitcoinBridges(d),/Kaufbelege/);
});
