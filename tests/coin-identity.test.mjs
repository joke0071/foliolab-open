import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLegacyCoinId,COIN_ID_MIGRATION} from '../src/coin-identity.js';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
test('Verified legacy Sonic native token migrates without symbol-only matching',()=>{
 assert.deepEqual(normalizeLegacyCoinId({kind:'crypto',coinId:'sonic',name:'Sonic',symbol:'S'}),{id:'sonic-3',migration:COIN_ID_MIGRATION});
 assert.equal(normalizeLegacyCoinId({kind:'crypto',coinId:'some-other-asset',name:'Sonic',symbol:'S'}).id,'some-other-asset');
 assert.equal(normalizeLegacyCoinId({kind:'crypto',coinId:'sonic',name:'Different Sonic Token',symbol:'S'}).id,'sonic');
 assert.equal(normalizeLegacyCoinId({kind:'crypto',coinId:'sonic',name:'Sonic',symbol:'STAKED-S'}).id,'sonic');
});
test('Sonic backup migration is idempotent and preserves holdings and historical snapshots',()=>{
 const m=blankModel();const provider=createProvider({name:'Example Wallet',type:'wallet'});m.providers.push(provider);
 const account=createAccount({providerId:provider.id,name:'Wallet',type:'wallet'},m);m.accounts.push(account);
 const original=createPosition({kind:'crypto',providerId:provider.id,accountId:account.id,name:'Sonic',symbol:'S',coinId:'sonic',quantity:'123.4567',price:0.07},m);
 m.positions.push(original);m.snapshots.push({id:'old',date:'2026-10-01',total:8.64,source:'manual'});
 const imported=safeImport(JSON.parse(backup(m)));
 assert.equal(imported.positions[0].coinId,'sonic-3');
 assert.equal(imported.positions[0].coinIdMigration,COIN_ID_MIGRATION);
 assert.equal(imported.positions[0].quantityExact,'123.4567');
 assert.equal(imported.snapshots[0].total,8.64);
 const second=safeImport(JSON.parse(backup(imported)));
 assert.equal(second.positions[0].coinId,'sonic-3');
 assert.equal(second.positions[0].coinIdMigration,COIN_ID_MIGRATION);
 assert.deepEqual(second.snapshots,imported.snapshots);
});
