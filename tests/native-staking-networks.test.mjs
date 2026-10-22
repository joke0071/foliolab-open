import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverWallet,walletBalanceExact} from '../src/market.js';
import {STAKING_ASSETS,STAKING_MODES,stakingCoverageSummary} from '../src/staking-catalog.js';
import {validateNativeStakingAddress} from '../src/native-staking-networks.js';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {walletTokenVisibility} from '../src/wallet-visibility.js';
const reply=data=>({ok:true,status:200,headers:{get:()=>null},json:async()=>data});
const cosmos='cosmos1'+'a'.repeat(38), validator='cosmosvaloper1'+'a'.repeat(38);
const EVM='0x'+'a'.repeat(40);
test('catalog covers all 50 supplied instruments without claiming automatic staking for token holdings',()=>{
 assert.equal(STAKING_ASSETS.length,50);
 assert.equal(new Set(STAKING_ASSETS.map(a=>a.id)).size,50);
 assert.equal(Object.values(stakingCoverageSummary()).reduce((a,b)=>a+b,0),50);
 assert.equal(STAKING_ASSETS.find(a=>a.ticker==='LDO').mode,'token');
 assert.equal(STAKING_ASSETS.find(a=>a.ticker==='FTM').mode,'legacy');
 assert.equal(STAKING_ASSETS.find(a=>a.ticker==='SUI').scannerNetwork,'');
 assert.equal(STAKING_ASSETS.find(a=>a.ticker==='ATOM').scannerNetwork,'cosmos');
 for(const asset of STAKING_ASSETS){
  assert.ok(STAKING_MODES[asset.mode]);assert.ok(asset.note.length>15);
  if(['manual','legacy'].includes(asset.mode))assert.equal(asset.scannerNetwork,'');
 }
});
test('Cosmos liquid/delegation/unbonding are disjoint, exact amounts and validators persisted',async()=>{
 const mock=async u=>{
  if(u.includes('/by_denom'))return reply({balance:{denom:'uatom',amount:'2000000'}});
  if(u.includes('/unbonding_delegations'))return reply({unbonding_responses:[{validator_address:validator,entries:[{balance:'500000'}]}],pagination:{next_key:null}});
  if(u.includes('/delegations/'))return reply({delegation_responses:[{delegation:{validator_address:validator},balance:{denom:'uatom',amount:'1250000'}}],pagination:{next_key:null}});
  throw Error('unexpected endpoint '+u);
 };
 const a=await discoverWallet('cosmos',cosmos,{},mock);
 assert.deepEqual(a.map(x=>[x.chain,x.quantityExact]),[['cosmos','2'],['cosmos-stake','1.25'],['cosmos-unbonding','0.5']]);
 assert.ok(a.partial);assert.equal(a[1].contract,validator);
 assert.equal(walletTokenVisibility(a[1]).show,true);
 for(const asset of a)assert.equal(await walletBalanceExact({enabled:true,chain:asset.chain,address:cosmos,contract:asset.contract}, {},mock),asset.quantityExact);
});
test('Cosmos pagination follows next_key and refuses missing verification instead of using zero',async()=>{
 let num=0;
 const mock=async u=>{
  if(u.includes('by_denom'))return reply({balance:{denom:'uatom',amount:'0'}});
  if(u.includes('unbonding_delegations'))return reply({unbonding_responses:[],pagination:{}});
  if(u.includes('delegations/')){
   ++num;
   return reply(num===1?{delegation_responses:[],pagination:{next_key:'NEXT'}}:{delegation_responses:[{delegation:{validator_address:validator},balance:{denom:'uatom',amount:'1000000'}}],pagination:{}});
  }
  throw Error('unexpected');
 };
 const a=await discoverWallet('cosmos',cosmos,{},mock);
 assert.equal(num,2);assert.equal(a.length,1);assert.equal(a[0].quantityExact,'1');
 const broken=async u=>u.includes('by_denom')?reply({balance:{denom:'uatom',amount:'100'}}):reply({delegation_responses:{},unbonding_responses:{},pagination:{}});
 const partial=await discoverWallet('cosmos',cosmos,{},broken);
 assert.equal(partial.partial,true);assert.match(partial.warning,/unvollständig/);
});
test('Hedera Staking never doubles the account balance or adds pending rewards',async()=>{
 const addr='0.0.12345';
 const mock=async()=>reply({account:addr,balance:{balance:3450000000},staked_node_id:4,pending_reward:50000000,deleted:false});
 const a=await discoverWallet('hedera',addr,{},mock);
 assert.equal(a.length,1);assert.equal(a[0].quantityExact,'34.5');assert.match(a[0].name,/Staking aktiviert/);
 assert.equal(await walletBalanceExact({enabled:true,chain:'hedera',address:addr},{},mock),'34.5');
 assert.match(a.warning,/nicht als verfügbarer Bestand/);
});
test('NEAR separate liquid and locked amounts but no fictitious external pool delegation',async()=>{
 const mock=async(_u,opts)=>{
  const req=JSON.parse(opts.body);assert.equal(req.method,'query');
  assert.equal(req.params.request_type,'view_account');
  return reply({result:{amount:'2500000000000000000000000',locked:'1250000000000000000000000'}});
 };
 const a=await discoverWallet('near','alice.near',{},mock);
 assert.deepEqual(a.map(x=>[x.chain,x.quantityExact]),[['near','2.5'],['near-locked','1.25']]);
 assert.equal(a.partial,true);
 assert.equal(await walletBalanceExact({enabled:true,chain:'near-locked',address:'alice.near'},{},mock),'1.25');
});
test('BNB native coin read correctly; no BEP20 or staking positions fabricated',async()=>{
 const mock=async(_u,opts)=>{assert.equal(JSON.parse(opts.body).method,'eth_getBalance');return reply({result:'0xde0b6b3a7640000'});};
 const a=await discoverWallet('56',EVM,{},mock);
 assert.equal(a.length,1);assert.equal(a[0].symbol,'BNB');assert.equal(a[0].chainId,56);
 assert.equal(a[0].quantityExact,'1');assert.equal(a.partial,true);
 assert.equal(await walletBalanceExact({enabled:true,chain:'evm',chainId:56,address:EVM},{},mock),'1');
});
test('New staking positions survive backup without losing exact identifiers',()=>{
 const m=blankModel(),provider=createProvider({name:'Wallet',type:'wallet'});m.providers.push(provider);
 const acc=createAccount({providerId:provider.id,name:'Konto',type:'wallet'},m);m.accounts.push(acc);
 const arr=[{chain:'cosmos-stake',address:cosmos,contract:validator,decimals:6},{chain:'cosmos-unbonding',address:cosmos,contract:validator,decimals:6},{chain:'near-locked',address:'alice.near',decimals:24},{chain:'hedera',address:'0.0.12345',decimals:8}];
 for(const wallet of arr)m.positions.push(createPosition({kind:'crypto',providerId:provider.id,accountId:acc.id,name:'Token',symbol:'ATOM',quantity:'1.23',price:10,wallet:{...wallet,enabled:true}},m));
 const restored=safeImport(JSON.parse(backup(m)));
 assert.deepEqual(restored.positions.map(x=>x.wallet.chain),arr.map(x=>x.chain));
 assert.equal(restored.positions[0].wallet.contract,validator);
});
test('Network validation rejects another chain or secret and malformed account IDs',()=>{
 assert.equal(validateNativeStakingAddress('hedera','0.0.1234'),'0.0.1234');
 assert.throws(()=>validateNativeStakingAddress('hedera','0.0.12;evil'),/passt nicht/);
 assert.throws(()=>validateNativeStakingAddress('near','alice .near'),/passt nicht/);
 assert.throws(()=>validateNativeStakingAddress('cosmos',EVM),/passt nicht/);
});
