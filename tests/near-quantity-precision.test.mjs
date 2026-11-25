import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {units,preciseValue} from '../src/decimal.js';
import {nearAccountBalances} from '../src/native-staking-networks.js';
import {ledgerQuantityAudit,captureOpenings,executeTransaction} from '../src/transactions.js';
import {updateScannedWalletPosition} from '../src/wallet-scan-update.js';
import {grossPositionValueExact} from '../src/fx-state.js';

const exactNEAR='145768.498431409676817125837316';
const oneLess='145768.498431409676817125837315';
function portfolio(){
 const m=blankModel();
 m.providers.push(createProvider({id:'p',name:'Public fixture',type:'wallet'}));
 m.accounts.push(createAccount({id:'a',name:'Scan',type:'wallet',providerId:'p'},m));
 const p=createPosition({id:'near',providerId:'p',accountId:'a',kind:'crypto',name:'NEAR',symbol:'NEAR',coinId:'near',quantityExact:exactNEAR,price:1,currency:'EUR',wallet:{enabled:true,chain:'near',address:'aurora'}},m);
 m.positions.push(p);
 captureOpenings(m);
 return m;
}
test('public final balances of liquid and directly locked NEAR preserve every yocto',async()=>{
 const fetcher=async()=>new Response(JSON.stringify({result:{amount:'2657936191207537505603225697927',locked:'29106556065488580784331702544649'}}));
 assert.deepEqual(await nearAccountBalances('figment.poolv1.near',fetcher),{liquid:'2657936.191207537505603225697927',locked:'29106556.065488580784331702544649'});
 const m=portfolio(),p=m.positions[0];
 assert.equal(grossPositionValueExact(p),'145768.498431409676817126');
 assert.equal(preciseValue('0.000000000000000000000001','1000000','1',p.wallet),'0.000000000000000001');
 assert(ledgerQuantityAudit(m).ok);
 const mixed=structuredClone(m);
 mixed.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',kind:'cash',name:'EUR',quantity:'5',price:1,currency:'EUR'},mixed));
 executeTransaction(mixed,{positionId:'cash',type:'deposit',date:'2026-11-25',quantity:'3',unitPrice:1});
 assert.equal(mixed.positions.find(p=>p.id==='cash').quantityExact,'8');
 assert.equal(mixed.openingPositions.find(o=>o.positionId==='near').quantityExact,exactNEAR);
 assert(ledgerQuantityAudit(mixed).ok);
 const reloaded=safeImport(JSON.parse(backup(mixed)));
 assert.deepEqual(reloaded.journalEntries,mixed.journalEntries);
 assert.equal(reloaded.positions[0].quantityExact,exactNEAR);
 assert.deepEqual(safeImport(JSON.parse(backup(m))).openingPositions,m.openingPositions);
 const wrong=structuredClone(m);wrong.openingPositions[0].quantityExact=oneLess;
 assert.equal(ledgerQuantityAudit(wrong).ok,false);assert.throws(()=>safeImport(JSON.parse(backup(wrong))));
 assert.throws(()=>executeTransaction(m,{positionId:p.id,type:'deposit',date:'2026-11-25',quantity:'1'}),/Wallet/);
 updateScannedWalletPosition(p,{chain:'near',quantityExact:oneLess},{model:m});
 assert.equal(m.openingPositions[0].quantityExact,oneLess);assert(ledgerQuantityAudit(m).ok);
 m.openingPositions[0].asOf='2026-11-25';const snapshot=JSON.stringify(m);
 assert.throws(()=>updateScannedWalletPosition(p,{chain:'near',quantityExact:exactNEAR},{model:m}),/datierten Anfang/);
 assert.equal(JSON.stringify(m),snapshot);
});
test('wallet quantity precision stays separate from money and manual holdings',()=>{
 const m=portfolio(),p=m.positions[0];
 assert.throws(()=>units(exactNEAR),/18 Nachkommastellen/);
 assert.throws(()=>createPosition({...p,kind:'stock',wallet:null},m),/18 Nachkommastellen/);
 assert.throws(()=>createPosition({...p,quantityExact:exactNEAR+'1'},m),/24 Nachkommastellen/);
 assert.throws(()=>createPosition({...p,priceExact:oneLess},m),/18 Nachkommastellen/);
 const legacy={...p,quantityExact:'2.5'};delete legacy.id;
 assert.equal(createPosition({...legacy,wallet:{enabled:true,chain:'near-locked',address:'old.near'}},m).quantityExact,'2.5');
});
