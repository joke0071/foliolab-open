import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverWallet,walletBalance,evmContractPrices,PUBLIC_EVM_NETWORKS} from '../src/market.js';
const A='0x'+'a'.repeat(40), C='0x'+'b'.repeat(40), SOL='B'.repeat(44);
const reply=data=>({ok:true,json:async()=>data});
test('Ethereum-Scan entdeckt Native Coin und verschiedene ERC20 ohne User Key',async()=>{
  const urls=[];const mock=async url=>{urls.push(url);return reply(url.endsWith('/token-balances')?[
    {value:'4000000',token:{type:'ERC-20',address_hash:C,name:'Stable Token',symbol:'STB',decimals:'6'}},
    {value:'100',token:{type:'ERC-721',address_hash:C,name:'NFT',symbol:'NFT',decimals:'0'}},
    {value:'0',token:{type:'ERC-20',address_hash:'0x'+'c'.repeat(40),name:'Zero',symbol:'ZER',decimals:'18'}}
  ]:{coin_balance:'1500000000000000000'});};
  const result=await discoverWallet('1',A,{},mock);
  assert.equal(result.length,2);
  assert.deepEqual(result.map(x=>[x.symbol,x.quantity]),[['ETH',1.5],['STB',4]]);
  assert.equal(result[1].contract,C);
  assert.equal(result[1].coinId,'');
  assert.ok(urls.every(x=>x.startsWith('https://eth.blockscout.com/api/v2/')));
  assert.ok(!urls.some(x=>x.includes('apikey')));
});
test('Bitcoin-Import nutzt ausschließlich eine gültige öffentliche Adresse',async()=>{
  const addr='bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
  const list=await discoverWallet('btc',addr,{},async()=>reply({chain_stats:{funded_txo_sum:360000000,spent_txo_sum:100000000},mempool_stats:{funded_txo_sum:0,spent_txo_sum:0}}));
  assert.equal(list[0].quantity,2.6);
  await assert.rejects(()=>discoverWallet('btc','xprvXYZ',{}),/private Schlüssel/);
});
test('Solana erkennt SOL und SPL sowie Token-2022; gleiche Mint wird aggregiert',async()=>{
  const methods=[];
  const mock=async(_url,opts)=>{const req=JSON.parse(opts.body);methods.push(req.method+':'+(req.params[1]?.programId||''));
    if(req.method==='getBalance')return reply({result:{value:3200000000}});
    const mint='D'.repeat(44);
    const account={account:{data:{parsed:{info:{mint,tokenAmount:{uiAmountString:'2.5',decimals:6}}}}}};
    return reply({result:{value:[account]}});
  };
  const results=await discoverWallet('sol',SOL,{},mock);
  assert.equal(results.length,2);assert.equal(results[0].quantity,3.2);assert.equal(results[1].quantity,5);
  assert.equal(methods.length,3);
});
test('Wallet-Abfrage für EVM-Token ohne Etherscan Key',async()=>{
  const mock=async url=>reply(url.endsWith('/token-balances')?[{value:'125000000',token:{type:'ERC-20',address_hash:C,decimals:'6'}}]:{});
  const q=await walletBalance({enabled:true,chain:'erc20',chainId:1,address:A,contract:C,decimals:6},{},mock);
  assert.equal(q,125);
});
test('ERC20-Kursabruf über CoinGecko contract ohne Schlüssel',async()=>{
  const mock=async url=>{assert.equal(new URL(url).searchParams.get('contract_addresses'),C);return reply({[C]:{eur:2.2}});};
  assert.equal((await evmContractPrices(1,[C],'',mock))[C].eur,2.2);
  assert.equal(PUBLIC_EVM_NETWORKS[8453].name,'Base');
});
