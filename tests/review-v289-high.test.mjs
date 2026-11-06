import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport,totalExactEUR} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {prepareNativeFlatexPreview} from '../src/flatex-backfill.js';
import {importCSV,previewCSV} from '../src/csv-import.js';
import {prepareNativeFlatexImport} from '../src/flatex-import.js';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
import {inspectNativeFlatexSourceIdentities,importSourceKey} from '../src/import-identity.js';
import {updateScannedWalletPosition} from '../src/wallet-scan-update.js';
import {assetKey} from '../src/assets.js';
import {duplicateWalletHoldings,walletHoldingKey} from '../src/wallet-identity.js';
import {positionQualityReview} from '../src/position-quality-review.js';
import {nativeProjectionFixture} from './flatex-native-projection-fixture.mjs';

export function walletFixture(){
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic wallet',type:'wallet'}));
 for(const [id,type]of [['a','wallet'],['b','wallet'],['c','checking']])m.accounts.push(createAccount({id,providerId:'p',name:id,type},m));
 const wallet=createPosition({id:'wallet',providerId:'p',accountId:'a',name:'Synthetic ETH',kind:'crypto',symbol:'ETH',quantity:1,price:100,wallet:{enabled:true,chain:'evm',chainId:1,address:'0x'+'a'.repeat(40)}},m);
 m.positions.push(wallet,createPosition({id:'cash',providerId:'p',accountId:'c',name:'EUR',kind:'cash',quantity:100,price:1},m));
 m.settings.autoRefresh=false;return {m,wallet};
}

test('H1: the same native bank source cannot acquire economic effect under a second local depot',()=>{
 const f=nativeProjectionFixture(),first=prepareNativeFlatexPreview(f.model,f.documents,f.assignments,{mode:'append'});
 assert.equal(first.eligible,true,first.reason);importCSV(f.model,first.preview);
 f.model.accounts.push(createAccount({id:'second',providerId:'provider',name:'Second',type:'securities'},f.model));
 f.model.positions.push(createPosition({id:'asset-second',providerId:'provider',accountId:'second',name:'Same synthetic ETF',isin:'IE00SYNTH001',kind:'etf',quantity:0,price:1},f.model));
 const identities=inspectNativeFlatexSourceIdentities(f.documents),source=identities.rows[0].sourceId,assignments={[source]:{accountId:'second'}};
 const context=reviewNativeFlatexBindings(f.model,identities,assignments).contexts[0];Object.assign(assignments[source],{confirmed:true,accountSnapshot:context.accountSnapshot});
 const before=JSON.stringify(f.model),repeat=prepareNativeFlatexPreview(f.model,f.documents,assignments,{mode:'append'});
 assert.equal(repeat.eligible,false,'same bank source was offered as '+repeat.preview?.ready+' additional trades');
 assert.equal(JSON.stringify(f.model),before);assert.equal(f.model.bookings.length,2);
 const projected=prepareNativeFlatexImport(f.documents),bypass=previewCSV(f.model,projected.parsed,projected.mapping,{allowedAccountId:'second'});
 assert.equal(bypass.ready,0);assert.ok(bypass.issues.every(i=>i.code==='source-conflict'));assert.equal(JSON.stringify(f.model),before);
});

test('H1: general CSV identity remains local-account-scoped',()=>{
 const source={sourceId:'generic-csv',externalId:'SYN-1',accountId:'a'};
 assert.notEqual(importSourceKey(source),importSourceKey({...source,accountId:'b'}));
});

test('H2: wallet refresh after a foreign cash booking preserves journal and restores the new observed balance',()=>{
 const {m,wallet}=walletFixture();executeTransaction(m,{id:'cash-in',date:'1999-01-02',type:'deposit',positionId:'cash',quantity:1});
 const journal=structuredClone(m.journalEntries),cashOpening=structuredClone(m.openingPositions.find(o=>o.positionId==='cash'));
 updateScannedWalletPosition(wallet,{chain:'evm',quantityExact:'2'},{model:m,updatedAt:'2026-11-06T00:00:00Z'});
 const restored=safeImport(JSON.parse(backup(m)));
 assert.equal(restored.positions.find(p=>p.id==='wallet').quantityExact,'2');
 assert.equal(restored.openingPositions.find(o=>o.positionId==='wallet').quantityExact,'2');
 assert.deepEqual(m.journalEntries,journal);assert.deepEqual(m.openingPositions.find(o=>o.positionId==='cash'),cashOpening);
});

test('H2: dated openings and quantity journals reject changed observations before any mutation',()=>{
 for(const kind of ['dated','journal']){
  const {m,wallet}=walletFixture();executeTransaction(m,{id:'cash-in',date:'1999-01-02',type:'deposit',positionId:'cash',quantity:1});
  if(kind==='dated')m.openingPositions.find(o=>o.positionId==='wallet').asOf='1999-01-01';
  else{
   const configured=wallet.wallet;wallet.wallet=null;
   executeTransaction(m,{id:'synthetic-quantity-event',date:'1999-01-03',type:'buy',positionId:'wallet',cashPositionId:'cash',quantity:'0.5',unitPrice:100});wallet.wallet=configured;
  }
  safeImport(JSON.parse(backup(m)));const before=JSON.stringify(m);
  assert.throws(()=>updateScannedWalletPosition(wallet,{chain:'evm',quantityExact:'3',price:999},{model:m}),/datierten|mengenwirksame/);
  assert.equal(JSON.stringify(m),before);
 }
});

test('H3: one concrete EVM wallet cannot be counted again under another local account',()=>{
 const {m,wallet}=walletFixture(),before=JSON.stringify(m);let error;
 try{m.positions.push(createPosition({...wallet,id:'duplicate',accountId:'b',wallet:{...wallet.wallet,address:'0x'+'A'.repeat(40)}},m));}catch(e){error=e;}
 assert.ok(error,'duplicate wallet accepted: total '+totalExactEUR(m)+' instead of 200 EUR');
 assert.equal(JSON.stringify(m),before);
});

test('H3: unused native contract fields cannot manufacture another economic wallet identity',()=>{
 const {m,wallet}=walletFixture(),before=JSON.stringify(m);
 assert.throws(()=>createPosition({...wallet,id:'native-field-bypass',accountId:'b',wallet:{...wallet.wallet,contract:'unused-native-field'}},m),/bereits/);
 assert.equal(JSON.stringify(m),before);
 for(const chain of ['evm','btc','btc-hd','sol','cosmos','hedera','near','near-locked','xrp']){
  const native={...wallet.wallet,chain};
  assert.equal(walletHoldingKey(native),walletHoldingKey({...native,contract:'unused-native-field'}),chain);
 }
 executeTransaction(m,{id:'native-field-cash-in',date:'1999-01-02',type:'deposit',positionId:'cash',quantity:1});
 const legacy={...structuredClone(wallet),id:'legacy-native-field',accountId:'b',wallet:{...wallet.wallet,contract:'unused-native-field'}};
 m.positions.push(legacy);const restored=safeImport(JSON.parse(backup(m)));
 const holdings=positions=>positions.map(({id,providerId,accountId,wallet,quantityExact,costBasisExact,realizedPnLExact})=>({id,providerId,accountId,wallet,quantityExact,costBasisExact,realizedPnLExact}));
 assert.deepEqual(holdings(restored.positions),holdings(m.positions));
 assert.deepEqual(restored.bookings,m.bookings);assert.deepEqual(restored.journalEntries,m.journalEntries);assert.deepEqual(restored.openingPositions,m.openingPositions);
 assert.deepEqual(duplicateWalletHoldings(restored).map(g=>g.map(p=>p.id)),[['wallet','legacy-native-field']]);
});

test('H3: existing duplicates survive restore as separate histories and are exposed for review',()=>{
 const {m,wallet}=walletFixture();executeTransaction(m,{id:'cash-in',date:'1999-01-02',type:'deposit',positionId:'cash',quantity:1});
 m.positions.push({...structuredClone(wallet),id:'legacy-duplicate',accountId:'b'});
 const restored=safeImport(JSON.parse(backup(m))),before=JSON.stringify(restored);
 assert.equal(restored.positions.length,3);assert.deepEqual(restored.journalEntries,m.journalEntries);
 assert.deepEqual(duplicateWalletHoldings(restored).map(g=>g.map(p=>p.id)),[['wallet','legacy-duplicate']]);
 assert.equal(positionQualityReview(restored).filter(g=>g.issues.some(i=>i.key.endsWith(':wallet-identity'))).length,2);
 assert.equal(JSON.stringify(restored),before);
});

test('H3/M1: chain, native/staking roles and case-sensitive addresses identify different concrete holdings',()=>{
 const base={enabled:true,chain:'evm',chainId:1,address:'0x'+'a'.repeat(40)};
 assert.notEqual(walletHoldingKey(base),walletHoldingKey({...base,chainId:56}));
 const sol={enabled:true,chain:'sol',address:'Ab'+'1'.repeat(30)};
 assert.notEqual(walletHoldingKey(sol),walletHoldingKey({...sol,address:'aB'+'1'.repeat(30)}));
 assert.notEqual(walletHoldingKey(sol),walletHoldingKey({...sol,chain:'sol-stake',contract:'B'+'1'.repeat(31)}));
 const {m,wallet}=walletFixture();
 const alias=createPosition({...wallet,id:'explicit-view',accountId:'b',valuationMode:'excluded',representedByPositionId:wallet.id},m);m.positions.push(alias);
 assert.equal(totalExactEUR(m),'200');safeImport(JSON.parse(backup(m)));
 assert.throws(()=>createPosition({...alias,valuationMode:'included'},m),/bereits/);
});

test('M1: case-sensitive SPL mint identities remain distinct, EVM contracts remain case-insensitive',()=>{
 const mint='Ab'+'1'.repeat(30),a={kind:'crypto',wallet:{enabled:true,chain:'spl',contract:mint}},b={kind:'crypto',wallet:{enabled:true,chain:'spl',contract:'aB'+'1'.repeat(30)}};
 assert.notEqual(assetKey(a),assetKey(b));
 const evm={kind:'crypto',wallet:{enabled:true,chain:'erc20',chainId:1,contract:'0x'+'a'.repeat(40)}};
 assert.equal(assetKey(evm),assetKey({...evm,wallet:{...evm.wallet,contract:'0x'+'A'.repeat(40)}}));
});
