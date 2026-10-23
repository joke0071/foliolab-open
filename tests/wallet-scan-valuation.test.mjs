import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,valueEUR,snapshot,backup,safeImport} from '../src/model.js';
import {updateScannedWalletPosition} from '../src/wallet-scan-update.js';

function fixture(){
 const m=blankModel(),p=createProvider({name:'Test Wallet',type:'wallet'});
 m.providers.push(p);
 const account=createAccount({providerId:p.id,name:'Cold wallet',type:'wallet'},m);m.accounts.push(account);
 const position=createPosition({
  providerId:p.id,accountId:account.id,kind:'crypto',name:'Ethereum',symbol:'ETH',
  quantity:'2',price:100,currency:'EUR',
  wallet:{enabled:true,chain:'evm',chainId:1,address:'0x'+'a'.repeat(40)}
 },m);
 m.positions.push(position);
 return {m,position};
}

test('Rescan synchronizes exact and display prices instead of retaining stale exact valuation',()=>{
 const {m,position}=fixture();
 const id=position.id;
 assert.equal(valueEUR(position),200);
 updateScannedWalletPosition(position,{chain:'evm',quantityExact:'3.125',quantity:3.125,price:150},{updatedAt:'2026-10-23T10:00:00.000Z'});
 assert.equal(position.id,id);
 assert.equal(position.quantityExact,'3.125');
 assert.equal(position.quantity,3.125);
 assert.equal(position.price,150);
 assert.equal(position.priceExact,'150');
 assert.equal(position.fxRate,1);
 assert.equal(position.fxRateExact,'1');
 assert.equal(valueEUR(position),468.75);
 assert.equal(m.positions.length,1,'Rescans do not duplicate existing positions');
 const restored=safeImport(JSON.parse(backup(m)));
 assert.equal(valueEUR(restored.positions[0]),468.75);
});

test('Wallet rescan resets previous non-EUR FX metadata with a new EUR price',()=>{
 const {position}=fixture();
 position.currency='USD';position.fxRate=0.8;position.fxRateExact='0.8';
 updateScannedWalletPosition(position,{chain:'evm',quantityExact:'1.5',price:200});
 assert.equal(position.currency,'EUR');
 assert.equal(position.fxRate,1);
 assert.equal(position.fxRateExact,'1');
 assert.equal(position.priceExact,'200');
 assert.equal(valueEUR(position),300);
});

test('Missing or zero quotes retain the last confirmed exact price, changing quantities only',()=>{
 const {position}=fixture();
 position.priceExact='120';position.price=120;
 updateScannedWalletPosition(position,{chain:'evm',quantityExact:'0.5',price:0});
 assert.equal(position.priceExact,'120');
 assert.equal(position.price,120);
 assert.equal(valueEUR(position),60);
});

test('Rescan retains 18-decimal balances and updates legacy BTC HD address type',()=>{
 const {position}=fixture();
 position.wallet={enabled:true,chain:'btc-hd',address:'xpub-demo',addressType:'auto'};
 updateScannedWalletPosition(position,{chain:'btc-hd',addressType:'p2wpkh',
  quantityExact:'0.000000000000000001',price:250000});
 assert.equal(position.quantityExact,'0.000000000000000001');
 assert.equal(position.wallet.addressType,'p2wpkh');
 assert.equal(position.priceExact,'250000');
});

test('Invalid wallet balances cannot partially alter a persisted position',()=>{
 const {position}=fixture();
 const old=structuredClone(position);
 assert.throws(()=>updateScannedWalletPosition(position,{chain:'evm',quantityExact:'-1',price:100}));
 assert.deepEqual(position,old);
 assert.throws(()=>updateScannedWalletPosition(position,{chain:'evm',quantityExact:'not-a-number',price:100}));
 assert.deepEqual(position,old);
});
