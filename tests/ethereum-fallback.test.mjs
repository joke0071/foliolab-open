import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverWallet,walletBalanceExact} from '../src/market.js';
import {ethereumNativeExact,ethereumTokenExact,discoverEthereumLsts,ETH_RPC} from '../src/ethereum-fallback.js';

const A='0x'+'a'.repeat(40),RETH='0xae78736cd615f374d3085123a210448e74fc6393';
const reply=data=>({ok:true,status:200,headers:{get:()=>null},json:async()=>data});
const wei=n=>'0x'+(BigInt(n)*10n**18n).toString(16);
function fixture({eth=2n,reth=3n,failRpc=false,explorerFail=true}={}){
 const calls=[];
 const fetcher=async (url,options={})=>{
  calls.push({url,method:options.body?JSON.parse(options.body).method:'GET'});
  if(url===ETH_RPC){
   if(failRpc)throw Error('Public RPC down');
   const req=JSON.parse(options.body);
   if(req.method==='eth_getBalance')return reply({result:wei(eth)});
   if(req.method==='eth_call'){
    const addr=req.params[0].to.toLowerCase();
    return reply({result:addr===RETH?wei(reth):'0x0'});
   }
   throw Error('unexpected RPC '+req.method);
  }
  if(explorerFail)throw Error('Blockscout timed out');
  if(url.endsWith('/token-balances'))return reply([]);
  return reply({coin_balance:'0'});
 };
 return {fetcher,calls};
}
test('Ethereum wallet import still finds ETH and real rETH when Blockscout is slow',async()=>{
 const {fetcher,calls}=fixture();
 const assets=await discoverWallet('1',A,{},fetcher);
 assert.deepEqual(assets.map(x=>[x.chain,x.symbol,x.quantityExact]),[['evm','ETH','2'],['erc20','rETH','3']]);
 assert.equal(assets.partial,true);
 assert.match(assets.warning,/Token-Abfrage fehlgeschlagen/);
 assert.ok(calls.some(x=>x.url===ETH_RPC&&x.method==='eth_call'));
});
test('Ethereum native and token refresh recover exact amounts from public RPC',async()=>{
 const {fetcher}=fixture({reth:5n});
 const w={enabled:true,chain:'evm',chainId:1,address:A,decimals:18};
 const t={enabled:true,chain:'erc20',chainId:1,address:A,contract:RETH,decimals:18};
 assert.equal(await walletBalanceExact(w,{},fetcher),'2');
 assert.equal(await walletBalanceExact(t,{},fetcher),'5');
});
test('No fake zeros when both explorer and Ethereum RPC cannot be reached',async()=>{
 const {fetcher}=fixture({failRpc:true});
 await assert.rejects(()=>discoverWallet('1',A,{},fetcher),/RPC down/);
 await assert.rejects(()=>walletBalanceExact({enabled:true,chain:'erc20',chainId:1,address:A,contract:RETH,decimals:18},{},fetcher),/RPC down/);
});
test('Explorer success remains the fast path without extra provider calls',async()=>{
 const {fetcher,calls}=fixture({explorerFail:false});
 const assets=await discoverWallet('1',A,{},fetcher);
 assert.equal(assets.length,0);
 assert.equal(calls.some(x=>x.url===ETH_RPC),false);
});
test('Hard-coded Ethereum LST whitelist does not infer non-whitelisted token holdings',async()=>{
 const {fetcher}=fixture();
 const list=await discoverEthereumLsts(A,fetcher);
 assert.equal(list.assets.length,1);
 assert.equal(list.assets[0].contract,RETH);
 assert.equal(list.assets[0].coinId,'');
 assert.equal(list.errors.length,0);
 assert.equal(await ethereumNativeExact(A,fetcher),'2');
 assert.equal(await ethereumTokenExact(A,RETH,18,fetcher),'3');
});

test('Ethereum token omitted by nominally successful explorer is verified via balanceOf, not assumed zero',async()=>{
 const {fetcher}=fixture({explorerFail:false,reth:8n});
 const wallet={enabled:true,chain:'erc20',chainId:1,address:A,contract:RETH,decimals:18};
 assert.equal(await walletBalanceExact(wallet,{},fetcher),'8');
});
test('Other EVM explorers omitting an already imported contract fail closed',async()=>{
 const token={enabled:true,chain:'erc20',chainId:137,address:A,contract:RETH,decimals:18};
 const fake=async(url)=>reply(url.endsWith('/token-balances')?[]:{coin_balance:'0'});
 await assert.rejects(()=>walletBalanceExact(token,{},fake),/Nullbestand ist nicht bestätigt/);
});
