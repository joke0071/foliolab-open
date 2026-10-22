import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverWallet,walletBalanceExact} from '../src/market.js';
import {getAdapter} from '../src/blockchain-adapters.js';
import {walletTokenVisibility} from '../src/wallet-visibility.js';
import {SAVAX_CONTRACT,STS_CONTRACT,SONIC_SFC,SOLANA_STAKE_PROGRAM,discoverSolanaStakes} from '../src/staking-discovery.js';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';

const EVM='0x'+'a'.repeat(40);
const SOL='B'.repeat(44),STAKE='C'.repeat(44);
const hex=n=>'0x'+BigInt(n).toString(16);
const eth=n=>hex(BigInt(n)*10n**18n);
const reply=body=>({ok:true,status:200,headers:{get:()=>null},json:async()=>body});

test('Sonic Mainnet 146 finds liquid S, Beets stS and direct SFC validator stake separately',async()=>{
 const calls=[];
 const mock=async(_url,opts)=>{
  const {method,params}=JSON.parse(opts.body);calls.push(method);
  if(method==='eth_getBalance')return reply({result:eth(34)});
  if(method!=='eth_call')throw Error('Unexpected RPC');
  const {to,data}=params[0];
  if(to.toLowerCase()===SONIC_SFC.toLowerCase()&&data==='0xc7be95de')return reply({result:hex(2)});
  if(data.startsWith('0xcfd47663')){
   const id=BigInt('0x'+data.slice(-64));
   return reply({result:id===1n?eth(12):eth(0)});
  }
  if(data.startsWith('0x70a08231')){
   if(to.toLowerCase()===STS_CONTRACT)return reply({result:eth(3)});
   return reply({result:hex(0)});
  }
  throw Error('Unexpected calldata');
 };
 const result=await discoverWallet('146',EVM,{},mock);
 assert.deepEqual(result.map(x=>[x.chain,x.symbol,x.quantity]),[['evm','S',34],['erc20','stS',3],['sonic-stake','S',12]]);
 assert.equal(result[1].contract,STS_CONTRACT);
 assert.equal(result[2].contract,'1');
 assert.equal(result.partial,true,'Incomplete withdrawal data is disclosed');
 assert.ok(calls.includes('eth_call'));
 assert.equal(getAdapter('146').getCapabilities().canScan,true);
 assert.equal(walletTokenVisibility(result[1]).show,true);
 assert.equal(walletTokenVisibility(result[2]).show,true);
 assert.equal(await walletBalanceExact({enabled:true,chain:'sonic-stake',address:EVM,contract:'1'}, {},mock),'12');
});

test('Avalanche recovers BENQI sAVAX contract via onchain balance when explorer omits ERC-20',async()=>{
 const calls=[];
 const mock=async(url,opts)=>{
  calls.push(url);
  if(url==='https://api.avax.network/ext/bc/C/rpc'){
   const input=JSON.parse(opts.body);
   assert.equal(input.method,'eth_call');
   assert.equal(input.params[0].to,SAVAX_CONTRACT);
   return reply({result:hex(304067n*10n**14n)});
  }
  if(url.endsWith('/token-balances'))return reply([]);
  return reply({coin_balance:'0'});
 };
 const items=await discoverWallet('43114',EVM,{},mock);
 assert.equal(items.length,1);
 assert.equal(items[0].symbol,'sAVAX');
 assert.equal(items[0].quantityExact,'30.4067');
 assert.equal(items[0].contract,SAVAX_CONTRACT);
 assert.equal(walletTokenVisibility(items[0]).show,true);
 const wallet={enabled:true,chain:'erc20',chainId:43114,address:EVM,contract:SAVAX_CONTRACT,decimals:18};
 assert.equal(await walletBalanceExact(wallet,{},mock),'30.4067');
 assert.ok(calls.some(x=>x.includes('api.avax.network')));
});

test('Solana discovers owned withdraw-authority stake accounts in addition to wallet SOL',async()=>{
 const methods=[];
 const stakeRow={pubkey:STAKE,account:{owner:SOLANA_STAKE_PROGRAM,lamports:5_250_000_000,
  data:{parsed:{type:'delegated',info:{meta:{authorized:{staker:SOL,withdrawer:SOL}},stake:{delegation:{stake:'5247717120'}}}}}}};
 const mock=async(_url,opts)=>{
  const {method,params}=JSON.parse(opts.body);methods.push(method);
  if(method==='getBalance')return reply({result:{value:29_550_100_000}});
  if(method==='getTokenAccountsByOwner')return reply({result:{value:[]}});
  if(method==='getProgramAccounts'){
   assert.equal(params[0],SOLANA_STAKE_PROGRAM);
   assert.deepEqual(params[1].filters,[{dataSize:200},{memcmp:{offset:44,bytes:SOL}}]);
   return reply({result:[stakeRow]});
  }
  if(method==='getAccountInfo')return reply({result:{value:stakeRow.account}});
  throw Error('unexpected');
 };
 const scanned=await discoverWallet('sol',SOL,{},mock);
 assert.equal(scanned.length,2);
 assert.equal(scanned[0].quantityExact,'29.5501');
 assert.equal(scanned[1].quantityExact,'5.25');
 assert.equal(scanned[1].contract,STAKE);
 assert.equal(scanned[1].chain,'sol-stake');
 assert.equal(walletTokenVisibility(scanned[1]).show,true);
 assert.equal(scanned.partial,undefined);
 assert.ok(methods.includes('getProgramAccounts'));
 const exact=await walletBalanceExact({enabled:true,chain:'sol-stake',address:SOL,contract:STAKE}, {solanaRpc:'https://solana-rpc.publicnode.com'},mock);
 assert.equal(exact,'5.25');
});

test('Solana stake owner mismatch is not attributed to a wallet',async()=>{
 const fake={pubkey:STAKE,account:{owner:SOLANA_STAKE_PROGRAM,lamports:1000000000,data:{parsed:{info:{meta:{authorized:{withdrawer:'D'.repeat(44)}}}}}}};
 await assert.rejects(()=>discoverSolanaStakes(SOL,'https://solana-rpc.publicnode.com',async()=>reply({result:[fake]})),/Auszahlungsberechtigung/);
});

test('Blocked Solana staking method produces partial result, not a false empty stake balance',async()=>{
 const mock=async(_url,opts)=>{
  const {method}=JSON.parse(opts.body);
  if(method==='getBalance')return reply({result:{value:1000000000}});
  if(method==='getProgramAccounts')throw Error('RPC 403');
  return reply({result:{value:[]}});
 };
 const result=await discoverWallet('sol',SOL,{},mock);
 assert.equal(result.length,1);
 assert.equal(result[0].quantityExact,'1');
 assert.equal(result.partial,true);
 assert.match(result.warning,/Stake-Accounts/);
});

test('New staking position types survive backup validation without being multiplied with liquid balance',()=>{
 const m=blankModel(),p=createProvider({name:'Watch Wallet',type:'wallet'});m.providers.push(p);
 const acc=createAccount({providerId:p.id,name:'Chain',type:'wallet'},m);m.accounts.push(acc);
 m.positions.push(createPosition({kind:'crypto',providerId:p.id,accountId:acc.id,name:'Staked SOL',symbol:'SOL',
  coinId:'solana',quantity:'5.25',price:10,wallet:{enabled:true,chain:'sol-stake',address:SOL,contract:STAKE}},m));
 m.positions.push(createPosition({kind:'crypto',providerId:p.id,accountId:acc.id,name:'Staked Sonic',symbol:'S',
  coinId:'sonic-3',quantity:'12',price:1,wallet:{enabled:true,chain:'sonic-stake',address:EVM,contract:'1'}},m));
 const restored=safeImport(JSON.parse(backup(m)));
 assert.deepEqual(restored.positions.map(p=>p.wallet.chain),['sol-stake','sonic-stake']);
 assert.equal(restored.positions[0].wallet.decimals,9);
 assert.equal(restored.positions[1].wallet.contract,'1');
 assert.throws(()=>createPosition({kind:'crypto',providerId:p.id,accountId:acc.id,name:'Wrong validator',quantity:1,price:1,
  wallet:{enabled:true,chain:'sonic-stake',address:EVM,contract:'1bad'}},m),/Validator-ID/);
});

test('Sonic USDC balance uses six token decimals rather than 18',async()=>{
 const usdc='0x29219dd400f2bf60e5a23d13be72b486d4038894';
 const mock=async(_u,opts)=>{
  const {method,params}=JSON.parse(opts.body);
  if(method==='eth_getBalance')return reply({result:hex(0)});
  if(params[0].data==='0xc7be95de')return reply({result:hex(0)});
  if(params[0].to.toLowerCase()===usdc)return reply({result:hex(2500000)});
  return reply({result:hex(0)});
 };
 const assets=await discoverWallet('146',EVM,{},mock);
 assert.equal(assets.length,1);
 assert.equal(assets[0].symbol,'USDC');
 assert.equal(assets[0].quantityExact,'2.5');
});
