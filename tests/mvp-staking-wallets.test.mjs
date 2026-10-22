import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverWallet,walletBalanceExact,evmContractPrices} from '../src/market.js';
import {walletTokenVisibility,partitionWalletAssets} from '../src/wallet-visibility.js';
import {BNB_CURATED_TOKENS,discoverBnbTokens,bnbBep20BalanceExact} from '../src/bnb-token-scanner.js';
import {solanaRpcRead,solanaRpcEndpoints,DEFAULT_SOL_RPC,SOLANA_PUBLIC_FALLBACK} from '../src/solana-rpc.js';
import {discoverSolanaStakes,SOLANA_STAKE_PROGRAM} from '../src/staking-discovery.js';
import {defaultSettings,backup,blankModel} from '../src/model.js';
const A='0x'+'a'.repeat(40),M='0x'+'f'.repeat(40),SOL='B'.repeat(44),STAKE='C'.repeat(44);
const response=body=>({ok:true,status:200,headers:{get:()=>null},json:async()=>body});
const hex=n=>'0x'+BigInt(n).toString(16);
function bscMock(indexer=null,{badDecimals=false,failIndexer=false,liveAmount='2500000000000000000',rpcBlocked=false}={}){
 const requests=[];
 const fetcher=async (url,opts={})=>{
  requests.push(url);
  if(url.includes('api.binplorer.com')){
   if(failIndexer)throw Error('Indexanbieter 429');
   return response(indexer);
  }
  assert.match(url,/bsc-dataseed/);
  const body=JSON.parse(opts.body);
  if(body.method==='eth_getBalance')return response({result:hex(3n*10n**18n)});
  if(rpcBlocked)throw Error('BSC eth_call 403');
  assert.equal(body.method,'eth_call');
  const to=body.params[0].to.toLowerCase(),data=body.params[0].data;
  if(data==='0x313ce567')return response({result:hex(badDecimals&&to===M?9:18)});
  if(data.startsWith('0x70a08231'))return response({result:to===M?hex(liveAmount):hex(0)});
  throw Error('Unexpected');
 };
 return {requests,fetcher};
}
test('Rocket Pool rETH is contract-trusted even without price, but a symbol spoof is not',()=>{
 const contract='0xae78736cd615f374d3085123a210448e74fc6393';
 assert.equal(walletTokenVisibility({chain:'erc20',chainId:1,contract,name:'Rocket Pool ETH',symbol:'rETH',quantityExact:'0.3'}).show,true);
 assert.equal(walletTokenVisibility({chain:'erc20',chainId:1,contract:M,name:'Rocket Pool ETH',symbol:'rETH',quantityExact:'3'}).show,false);
 assert.equal(walletTokenVisibility({chain:'erc20',chainId:56,contract,name:'Rocket Pool ETH',symbol:'rETH',quantityExact:'2'}).show,false);
});
test('BNB BEP-20 indexer discovers an arbitrary contract, verifies on chain and does not trust indexer amount',async()=>{
 const index={address:A,tokens:[{tokenInfo:{address:M,name:'Unlisted asset',symbol:'UNL',decimals:'18'},rawBalance:'500000000000000000000000'}]};
 const {fetcher,requests}=bscMock(index);
 const result=await discoverWallet('56',A,{},fetcher);
 assert.equal(result.length,2);
 assert.equal(result[0].quantityExact,'3');
 assert.equal(result[1].contract,M);
 assert.equal(result[1].quantityExact,'2.5','Indexer amount is not trusted over eth_call');
 assert.equal(result[1].chainId,56);
 assert.equal(result.partial,true);
 assert.equal(walletTokenVisibility(result[1]).show,false,'Unknown unquoted assets remain hidden');
 assert.ok(requests.some(u=>u.includes('api.binplorer.com')));
 assert.ok(requests.some(u=>u.includes('bsc-dataseed')));
 assert.equal(await walletBalanceExact({enabled:true,chain:'erc20',chainId:56,address:A,contract:M,decimals:18},{},fetcher),'2.5');
});
test('BNB personal indexer key honored and missing indexer produces truthful limited coverage',async()=>{
 const {fetcher,requests}=bscMock(null,{failIndexer:true});
 const result=await discoverWallet('56',A,{binplorerKey:'myUserKey123'},fetcher);
 assert.equal(result.length,1);
 assert.equal(result.partial,true);
 assert.match(result.warning,/Indexer nicht verfügbar/);
 assert.ok(requests.some(u=>u.includes('myUserKey123')));
 assert.equal(BNB_CURATED_TOKENS.length,4);
 assert.equal(defaultSettings().binplorerKey,'');
 assert.doesNotMatch(backup(blankModel()),/myUserKey123/);
});
test('BNB malformed token metadata and decimals mismatch never create an invented holding',async()=>{
 const {fetcher}=bscMock({address:A,tokens:[{tokenInfo:{address:M,symbol:'F',name:'Fake',decimals:18},rawBalance:'999'}]},{badDecimals:true});
 const result=await discoverWallet('56',A,{},fetcher);
 assert.equal(result.length,1);
 assert.equal(result.partial,true);
 assert.match(result.warning,/Contract-Abfragen fehlgeschlagen/);
 await assert.rejects(()=>bnbBep20BalanceExact(M,A,fetcher,18),/Decimals/);
});
test('Binplorer does not get to redirect address identity or silently certify zero',async()=>{
 const mock=bscMock({address:'0x'+'b'.repeat(40),tokens:[]});
 const assets=await discoverBnbTokens(A,{},mock.fetcher);
 assert.equal(assets.partial,true);
 assert.match(assets.warning,/Indexer nicht verfügbar/);
});
test('CoinGecko contract quotes for BNB use its chain platform, not an Ethereum ticker',async()=>{
 const q=await evmContractPrices(56,[M],'',async url=>{
  assert.match(url,/simple\/token_price\/binance-smart-chain/);
  assert.equal(new URL(url).searchParams.get('contract_addresses'),M);
  return response({[M]:{eur:1.75}});
 });
 assert.equal(q[M].eur,1.75);
});
test('Solana default RPC transparently falls back on an error but custom RPC does not leak',async()=>{
 let hits=[];
 const read=await solanaRpcRead(DEFAULT_SOL_RPC,'getBalance',[SOL,{commitment:'confirmed'}],async url=>{
  hits.push(url);
  if(url.includes('publicnode'))throw Error('HTTP 429');
  return response({result:{value:1230000000}});
 });
 assert.equal(read.result.value,1230000000);
 assert.equal(read.fallback,true);
 assert.equal(hits.length,2);
 assert.ok(hits[1].includes('api.mainnet.solana.com'));
 assert.deepEqual(solanaRpcEndpoints('https://my-rpc.example/path?api-key=mykey'),['https://my-rpc.example/path?api-key=mykey']);
 hits=[];
 await assert.rejects(()=>solanaRpcRead('https://my-rpc.example/path?api-key=mykey','getBalance',[SOL],async url=>{hits.push(url);throw Error('Custom provider offline');}),/Custom provider offline/);
 assert.equal(hits.length,1);
 assert.match(hits[0],/my-rpc/);
});
test('Solana malformed first provider is retried; both malformed never become zero',async()=>{
 const good=async url=>response(url.includes('publicnode')?{result:{value:'not raw'}}:{result:{value:1000000000}});
 const wallet={enabled:true,chain:'sol',address:SOL,decimals:9};
 assert.equal(await walletBalanceExact(wallet,{},good),'1');
 const bad=async()=>response({result:{}});
 await assert.rejects(()=>walletBalanceExact(wallet,{},bad),/fehlgeschlagen/);
});
test('Solana staking query also uses safe fallback (no false completed empty delegation)',async()=>{
 const mock=async(url,opts)=>{
  const req=JSON.parse(opts.body);
  assert.equal(req.method,'getProgramAccounts');
  if(url.includes('publicnode'))throw Error('403 blocked');
  return response({result:[{pubkey:STAKE,account:{owner:SOLANA_STAKE_PROGRAM,lamports:2000000000,
   data:{parsed:{info:{meta:{authorized:{withdrawer:SOL}}}}}}}]});
 };
 const rows=await discoverSolanaStakes(SOL,DEFAULT_SOL_RPC,mock);
 assert.equal(rows[0].quantityExact,'2');
});
