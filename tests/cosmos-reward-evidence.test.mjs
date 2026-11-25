import assert from 'node:assert/strict';
import test from 'node:test';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {cosmosRewardPreview} from '../src/cosmos-reward-evidence.js';
import {acceptHistory} from '../src/wallet-history-state.js';
import {replayWalletHistory} from '../src/wallet-history-core.js';
import {projectHistoricalPortfolio} from '../src/historical-portfolio-value.js';

const address='cosmos1nx3yrqs5v5wz9yygplleswu5tn9e4r8zcgncar';
const height='34044337';
function portfolio(){
 const model=blankModel();
 model.providers.push(createProvider({id:'wallet',name:'Cosmos public reference',type:'wallet'}));
 model.accounts.push(createAccount({id:'account',providerId:'wallet',name:'Wallet',type:'wallet'},model));
 model.positions.push(createPosition({id:'atom',providerId:'wallet',accountId:'account',kind:'crypto',name:'Cosmos Hub',
  coinId:'cosmos',symbol:'ATOM',quantity:'0.811172',price:'0',wallet:{enabled:true,chain:'cosmos',address}},model));
 return model;
}

test('the paid reward is one historical event and never increases the scanned balance',()=>{
 const model=portfolio();
 const session=cosmosRewardPreview(model,'atom',height);
 const draft=acceptHistory(model,session);
 const {walletHistory,...finance}=draft;
 assert.deepEqual(finance,model);
 assert.equal(draft.positions[0].quantityExact,'0.811172');
 assert.deepEqual(session.events.map(e=>[e.type,e.quantityBaseUnits]),[['fee','-6823'],['staking_reward','536836']]);
 assert.equal(replayWalletHistory(session).balances[0].quantityBaseUnits,'811172');
 assert.deepEqual(projectHistoricalPortfolio(draft),projectHistoricalPortfolio(model),'one block is not a UTC day-end valuation');
 assert.equal(acceptHistory(draft,cosmosRewardPreview(draft,'atom',height)),draft);
 const restored=safeImport(JSON.parse(backup(draft,{includeHistory:true})));
 assert.deepEqual(restored.walletHistory,walletHistory);
 assert.equal(restored.positions[0].quantityExact,'0.811172');
 assert.equal(safeImport(JSON.parse(backup(draft))).walletHistory,undefined);
 assert.equal(acceptHistory(restored,cosmosRewardPreview(restored,'atom',height)),restored);
});

test('height and wallet binding are checked both before saving and on restore',()=>{
 const model=portfolio();
 const session=cosmosRewardPreview(model,'atom',height);
 assert.throws(()=>cosmosRewardPreview(model,'atom','34044338'),/Blockhöhe/);
 assert.throws(()=>cosmosRewardPreview(model,'absent',height),/ATOM-Position/);
 for(const wallet of [{...model.positions[0].wallet,address:address.slice(0,-1)+'x'},
                       {...model.positions[0].wallet,chain:'cosmos-stake'},
                       null]){
  const invalid=structuredClone(model);
  invalid.positions[0].wallet=wallet;
  assert.throws(()=>acceptHistory(invalid,session),/ATOM-Position/);
 }
 const serialized=backup(acceptHistory(model,session),{includeHistory:true});
 const wrongPosition=JSON.parse(serialized);
 wrongPosition.positions[0].wallet.address=address.slice(0,-1)+'x';
 assert.throws(()=>safeImport(wrongPosition),/ATOM-Position/);
 const wrongTime=JSON.parse(serialized);
 wrongTime.walletHistory.sessions[0].streams[0].coverage.tipHash='a'.repeat(64);
 assert.throws(()=>safeImport(wrongTime),/Blockhöhe/);
 const wrongChain=JSON.parse(serialized);
 wrongChain.walletHistory.sessions[0].chain='eth';
 delete wrongChain.walletHistory.sessions[0].walletScopeDigest;
 assert.throws(()=>safeImport(wrongChain),/Wallet-Zuordnung/);
});
