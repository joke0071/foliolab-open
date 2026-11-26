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

test('four rewards from one transaction retain their event identities across duplicate import and backup',()=>{
 const model=portfolio();
 const position=model.positions[0];
 position.wallet.address='cosmos1tyqmer8ul0l7msewx82wnhu9f0kswd79hxh6ee';
 position.quantity=4.972381;
 position.quantityExact='4.972381';
 const block='34048131';
 const preview=cosmosRewardPreview(model,position.id,block);
 const rewards=preview.events.filter(event=>event.type==='staking_reward');
 assert.deepEqual(rewards.map(event=>[event.locator.index,event.quantityBaseUnits]),
  [['11','614783'],['17','614783'],['23','614783'],['29','614721']]);
 assert.equal(new Set(rewards.map(event=>event.id)).size,4);
 assert.equal(replayWalletHistory(preview).balances[0].quantityBaseUnits,'4972381');
 const accepted=acceptHistory(model,preview);
 const {walletHistory,...finance}=accepted;
 assert.deepEqual(finance,model);
 assert.equal(acceptHistory(accepted,cosmosRewardPreview(accepted,position.id,block)),accepted);
 const serialized=backup(accepted,{includeHistory:true});
 assert.deepEqual(safeImport(JSON.parse(serialized)).walletHistory,walletHistory);
 const missingReward=JSON.parse(serialized);
 missingReward.walletHistory.sessions[0].events.splice(2,1);
 assert.throws(()=>safeImport(missingReward),/Blockhöhe/);
 const otherWallet=JSON.parse(serialized);
 otherWallet.positions[0].wallet.address=address;
 assert.throws(()=>safeImport(otherWallet),/ATOM-Position/);
});
