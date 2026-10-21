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
    const account={account:{data:{parsed:{info:{mint,tokenAmount:{amount:'2500000',uiAmountString:'2.5',decimals:6}}}}}};
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

test('Solana-Teilfehler bleibt erkennbar',async()=>{const mock=async(_u,opts)=>{const r=JSON.parse(opts.body);if(r.method==='getBalance')return reply({result:{value:1e9}});if(r.params[1].programId==='TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')throw Error('temporär gesperrt');return reply({result:{value:[]}});};const assets=await discoverWallet('sol',SOL,{},mock);assert.equal(assets.length,1);assert.equal(assets.partial,true);});

test('Fehlender Blockscout-Native-Saldo wird nie als Null gespeichert',async()=>{await assert.rejects(()=>walletBalance({enabled:true,chain:'evm',chainId:1,address:A,decimals:18},{},async()=>reply({})),/Unvollständige/);});

test('Solana-SOL bleibt importierbar, auch wenn beide Token-Programme blockiert sind',async()=>{const mock=async(_u,opts)=>{const r=JSON.parse(opts.body);if(r.method==='getBalance')return reply({result:{value:1500000000}});throw Error('Token-Abfrage blockiert');};const assets=await discoverWallet('sol',SOL,{},mock);assert.equal(assets[0].quantity,1.5);assert.equal(assets.partial,true);});

test('EVM: Native Coin bleibt bei ausgefallenem Token-Explorer erhalten, aber nur als Teilerfolg',async()=>{const mock=async url=>{if(url.endsWith('token-balances'))throw Error('Ratenlimit');return reply({coin_balance:'2500000000000000000'});};const a=await discoverWallet('1',A,{},mock);assert.equal(a.length,1);assert.equal(a[0].quantity,2.5);assert.equal(a.partial,true);});
test('EVM: kein Native Coin und ausgefallener Token-Explorer dürfen nicht als leeres Wallet gelten',async()=>{const mock=async url=>{if(url.endsWith('token-balances'))throw Error('Ausfall');return reply({coin_balance:'0'});};await assert.rejects(()=>discoverWallet('1',A,{},mock),/nicht verfügbar/);});

test('Solana sums SPL raw balances exactly beyond JS safe integer',async()=>{
 const mint='D'.repeat(44);let i=0;
 const mock=async(_url,opts)=>{
  const req=JSON.parse(opts.body);
  if(req.method==='getBalance')return reply({result:{value:0}});
  i++;
  return reply({result:{value:[{account:{data:{parsed:{info:{mint,tokenAmount:{amount:i===1?'9007199254740993':'2',decimals:6}}}}}}]}});
 };
 const result=await discoverWallet('sol',SOL,{},mock);
 assert.equal(result[0].quantityExact,'9007199254.740995');
});
test('EVM discovery preserves exact large atomic balances and identifies incomplete scans',async()=>{
 const tokens=Array.from({length:500},(_,i)=>({value:String(9007199254740993n+BigInt(i)),token:{type:'ERC-20',address_hash:'0x'+i.toString(16).padStart(40,'0'),decimals:'6',name:'Token '+i,symbol:'T'+i}}));
 const mock=async url=>reply(url.endsWith('/token-balances')?tokens:{coin_balance:'1'});
 const result=await discoverWallet('1',A,{},mock);
 assert.equal(result[0].quantityExact,'0.000000000000000001');
 assert.equal(result[1].quantityExact,'9007199254.740993');
 assert.equal(result.partial,true);
 assert.match(result.warning,/abgeschnitten/);
});
test('Missing Solana raw account value never means verified zero',async()=>{
 const mock=async(_url,opts)=>reply(JSON.parse(opts.body).method==='getBalance'?{result:{}}:{result:{value:[]}});
 await assert.rejects(()=>discoverWallet('sol',SOL,{},mock),/Rohbetrag/);
});

test('Malformed Solana token-account responses never certify complete empty lists',async()=>{
 const mock=async(_url,opts)=>reply(JSON.parse(opts.body).method==='getBalance'?{result:{value:1000000000}}:{result:{}});
 const result=await discoverWallet('sol',SOL,{},mock);
 assert.equal(result[0].quantityExact,'1');
 assert.equal(result.partial,true);
});
