import test from 'node:test';
import assert from 'node:assert/strict';
import {ledgerModel,ledgerEvidence,ledgerCSV,txid,at} from './ledger-live-fixture.mjs';
import {previewUnifiedBitcoin,confirmUnifiedBitcoin,readUnifiedBitcoinFiles,undoUnifiedBitcoin} from '../src/unified-bitcoin.js';
import {safeImport,backup,addBooking} from '../src/model.js';
import {sourceDigest} from '../src/import-identity.js';
const awaitDigest=m=>sourceDigest(JSON.stringify(m));
import {ledgerQuantityAudit} from '../src/transactions.js';
import {createCompleteBackup,unpackCompleteBackup} from '../src/complete-backup.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';
const model=()=>ledgerEvidence(ledgerModel());
const input=m=>({receipts:m.purchaseEvidence.receipts,operations:readUnifiedBitcoinFiles([ledgerCSV()]).operations});
const confirm=(m,i=input(m),options={})=>confirmUnifiedBitcoin(m,i,'wallet',{baseline:previewUnifiedBitcoin(m,i,'wallet').baseline,confirmed:true,externalFunding:true,...options});
test('UH02 economic N:1 purchase backfill: independent amounts, zero quantity change, pure preview, idempotent sources',()=>{
 const m=model(),i=input(m),before=JSON.stringify(m),p=previewUnifiedBitcoin(m,i,'wallet');assert.equal(JSON.stringify(m),before);assert.equal(p.newCount,1);assert.equal(p.fiatEUR,'1000');
 const d=confirm(m,i);assert.equal(JSON.stringify(m),before);assert.deepEqual(d.positions,m.positions);assert.equal(d.bookings.length,1);assert.equal(d.bookings[0].quantityExact,'0.0248');assert.equal(d.bookings[0].amountExactEUR,'982');assert.equal(d.bookings[0].feeEUR,18);assert.equal(d.externalCashFlows[0].amountExactEUR,'1000');
 assert.deepEqual(d.journalEntries[0].postings.map(p=>[p.role,p.amountBookEURExact,p.quantityDeltaExact]),[['asset','982',null],['fee','18',null],['external-clearing','-1000',null]]);assert.equal(ledgerQuantityAudit(d).ok,true);assert.equal(d.positions[0].costBasisEUR,null);
 assert.deepEqual(confirm(d,i),d);assert.equal(previewUnifiedBitcoin(d,i,'wallet').newCount,0);assert.deepEqual(safeImport(JSON.parse(backup(d,{includeHistory:true}))),safeImport(d));
 assert.throws(()=>addBooking(d,{positionId:'wallet',type:'buy',date:'2025-01-01',quantity:1,unitPrice:1}),/Wallet/);
});
test('UH02 scope, partial history, missing vout, one satoshi, changed revision/funding and unrelated books fail closed',()=>{
 const m=model(),i=input(m),baseline=previewUnifiedBitcoin(m,i,'wallet').baseline;
 assert.throws(()=>confirmUnifiedBitcoin(m,i,'wallet',{baseline,confirmed:true}),/Finanzierung/);
 const changed=structuredClone(m);changed.providers[0].name='changed';assert.throws(()=>confirmUnifiedBitcoin(changed,i,'wallet',{baseline,confirmed:true,externalFunding:true}),/Datenstand/);
 for(const mutate of [m=>m.walletHistory.sessions[0].streams[0].coverage.status='partial',m=>m.positions[0].quantityExact='0.02480001',m=>m.walletHistory.sessions[0].events[0].locator.kind='vin',m=>m.positions.push({...m.positions[0],id:'other'})]){const d=model();mutate(d);assert.throws(()=>confirm(d,i));}
 const d=model();d.bookings.push({id:'other',positionId:'wallet'});assert.throws(()=>confirm(d,i),/Walletbuchungen/);
 const wrong=input(m);wrong.operations[0].amountExact='0.02480001';assert.throws(()=>previewUnifiedBitcoin(m,wrong,'wallet'),/vout/);
});
test('UH02 matching N:M never assigns batch mining fee or Ledger countervalues to cost; other scopes require explicit exclusion',()=>{
 const m=model(),e=m.walletHistory.sessions[0].events[0];m.walletHistory.sessions[0].events=[{...e,quantityBaseUnits:'1200000'},{...e,id:undefined,locator:{kind:'vout',index:'1',subindex:'0'},quantityBaseUnits:'1280000'}];
 const i=input(m),d=confirm(m,i);assert.equal(d.bookings[0].feeEUR,18);assert.equal(d.bookings[0].amountEUR,982);assert.equal(d.externalCashFlows[0].amountEUR,1000);assert.equal(JSON.parse(d.bookings[0].importSource.sourcePayload).facts.events.length,2);
 const mixed={...i,operations:[...i.operations,{...i.operations[0],currency:'ETH',accountIdentity:'foreign'}]};assert.throws(()=>confirm(m,mixed),/Ledger-Bereiche/);assert.equal(confirm(m,mixed,{bitcoinOnly:true}).bookings.length,1);
});
test('UH02 safe economic undo retains independent sources and tombstone; manual edits/dependencies block undo',()=>{
 const m=model(),i=input(m),d=confirm(m,i),id=d.bookings[0].id;
 const u=undoUnifiedBitcoin(d,id,{baseline:previewUnifiedBitcoin(d,i,'wallet').baseline,confirmed:true,at});assert.equal(u.bookings.length,0);assert.equal(u.externalCashFlows.length,0);assert.deepEqual(u.positions,m.positions);assert.deepEqual(u.purchaseEvidence,d.purchaseEvidence);assert.equal(u.journalEntries[0].type,'uh02-undo');assert.equal(previewUnifiedBitcoin(u,i,'wallet').groups[0].status,'removed');assert.deepEqual(confirm(u,i),u);assert.equal(safeImport(u).journalEntries[0].type,'uh02-undo');
 const edited=structuredClone(d);edited.bookings[0].notes='manual';assert.throws(()=>undoUnifiedBitcoin(edited,id,{baseline:previewUnifiedBitcoin(edited,i,'wallet').baseline,confirmed:true}),/geändert/);
 const dependent=structuredClone(d);dependent.bookings.push({...d.bookings[0],id:'dependency',targetPositionId:id});assert.throws(()=>undoUnifiedBitcoin(dependent,id,{baseline:(awaitDigest(dependent)),confirmed:true}),/Abhängige/);
});
test('UH02 encrypted backup/restore reimport retains financial effect once, without history opt-in',async()=>{
 const m=model(),i=input(m),d=confirm(m,i),full=createCompleteBackup(JSON.parse(backup(d)),null,d.walletHistory);
 const encrypted=JSON.parse(await encryptBackup(JSON.stringify(full),'synthetic-passphrase'));
 const restored=safeImport(unpackCompleteBackup(JSON.parse(await decryptBackup(encrypted,'synthetic-passphrase'))).data);
 assert.equal(JSON.stringify(confirm(restored,i)),JSON.stringify(restored));
 const noHistory=safeImport(JSON.parse(backup(d)));assert.equal(noHistory.bookings.length,1);assert.equal(noHistory.externalCashFlows[0].amountEUR,1000);assert.throws(()=>confirm(noHistory,i),/Historie/);
});

test('UH02 source order Ledger first / Bittr first / all together has identical economics and links',()=>{
 const m=model(),all=input(m);delete m.purchaseEvidence;
 const receipts=all.receipts,ledger={receipts:[],operations:all.operations};
 const firstLedger=confirm(m,ledger),ledgerThenBittr=confirm(firstLedger,{receipts,operations:[]});
 const firstBittr=confirm(m,{receipts,operations:[]}),bittrThenLedger=confirm(firstBittr,ledger),together=confirm(m,all);
 const economics=d=>({bookings:d.bookings.map(b=>({...b,importSource:{...b.importSource,ownedSnapshot:undefined}})),postings:d.journalEntries.map(j=>j.postings),flows:d.externalCashFlows,evidence:d.purchaseEvidence.bitcoinLedger});
 assert.deepEqual(economics(ledgerThenBittr),economics(bittrThenLedger));assert.deepEqual(economics(together),economics(bittrThenLedger));assert.equal(firstLedger.bookings.length,0);assert.equal(firstLedger.purchaseEvidence.bitcoinLedger.length,1);
});
test('UH02 observed scan opening remains current through rescan; economic facts stay fixed',async()=>{
 const {updateScannedWalletPosition}=await import('../src/wallet-scan-update.js');
 const m=model();m.openingPositions=[{positionId:'wallet',quantityExact:'0.0248',costBasisExact:null,realizedPnLExact:null,source:'observed-opening',asOf:null}];
 const d=confirm(m),journals=JSON.stringify(d.journalEntries),flows=JSON.stringify(d.externalCashFlows);
 updateScannedWalletPosition(d.positions[0],{quantityExact:'0.01',quantity:0.01,price:2},{model:d});
 assert.equal(ledgerQuantityAudit(d).ok,true);assert.equal(safeImport(d).positions[0].quantity,0.01);assert.equal(JSON.stringify(d.journalEntries),journals);assert.equal(JSON.stringify(d.externalCashFlows),flows);
});
test('UH02 restore rejects missing/changed source, fees, cashflow and orphan economic records',()=>{
 const d=confirm(model());
 for(const mutate of [d=>delete d.purchaseEvidence,d=>d.journalEntries=[],d=>d.externalCashFlows=[],d=>d.externalCashFlows[0].amountExactEUR='999',d=>d.bookings[0].amountExactEUR='900',d=>d.bookings[0].importSource.sourcePayload='{}',d=>d.journalEntries[0].postings[0].quantityDeltaExact='0.0248']){
  const bad=structuredClone(d);mutate(bad);assert.throws(()=>safeImport(bad));assert.throws(()=>backup(bad));
 }
});

test('UH02 rejects stale/unbound wallet ownership even with identical position, account and quantity',()=>{
 const m=model(),i=input(m);
 for(const mutate of [m=>delete m.walletHistory.sessions[0].walletScopeDigest,m=>m.positions[0].wallet.address='1BitcoinEaterAddressDontSendf59kuE',m=>m.walletHistory.sessions[0].walletScopeDigest='a'.repeat(64)]){
  const changed=structuredClone(m);mutate(changed);assert.throws(()=>confirm(changed,i),/Walletkonfiguration/);
 }
 const committed=confirm(m,i),rebound=structuredClone(committed);rebound.positions[0].wallet.address='1BitcoinEaterAddressDontSendf59kuE';assert.throws(()=>safeImport(rebound),/Walletidentität/);assert.throws(()=>backup(rebound),/Walletidentität/);
 const bad=structuredClone(m);bad.walletHistory.sessions[0].walletScopeDigest='not-a-digest';assert.throws(()=>safeImport(bad),/Walletbezug/);
 const normalized=safeImport(JSON.parse(backup(m,{includeHistory:true})));assert.equal(normalized.walletHistory.sessions[0].walletScopeDigest,m.walletHistory.sessions[0].walletScopeDigest);
});

test('UH02 opts into v5 and cannot be silently downgraded by backup, archive, undo or a later wizard operation',async()=>{
 const {setArchivePresentation}=await import('../src/booking-history.js'),{buildAssetWizardDraft}=await import('../src/asset-wizard-core.js');
 const d=confirm(model()),id=d.bookings[0].id;assert.equal(d.version,5);assert.equal(JSON.parse(backup(d)).version,5);
 for(const version of [3,4,6]){const old={...structuredClone(d),version};if(version===4)old.bookingPresentation={version:1,archivedIds:[id]};assert.throws(()=>safeImport(old));assert.throws(()=>backup(old));assert.throws(()=>createCompleteBackup(old));}
 assert.throws(()=>safeImport({...ledgerModel(),version:5}));
 const a=setArchivePresentation(structuredClone(d),{bookingIds:[id]});assert.equal(a.version,5);assert.equal(safeImport(a).version,5);
 setArchivePresentation(a,{bookingIds:[],referenceIds:[]});assert.equal(a.version,5);assert.equal(a.bookingPresentation,undefined);assert.equal(safeImport(a).version,5);
 const u=undoUnifiedBitcoin(d,id,{confirmed:true,baseline:awaitDigest(d),at});assert.equal(u.version,5);assert.equal(safeImport(u).version,5);
 const wizard=buildAssetWizardDraft(d,{kind:'etf',name:'Synthetic new ETF',symbol:'SYN',isin:'IE0000000001',currency:'EUR',quantity:'1',date:'2025-01-02',mode:'opening',currentPrice:'0',providerId:'__new__',providerName:'New synthetic broker',providerType:'broker',accountId:'__new__',accountName:'Depot',accountType:'securities'});
 assert.equal(wizard.draft.version,5);assert.equal(safeImport(wizard.draft).bookings.filter(b=>b.id===id).length,1);
});
