import test from 'node:test';
import assert from 'node:assert/strict';
import {walletTokenVisibility,partitionWalletAssets} from '../src/wallet-visibility.js';

const a=(overrides={})=>({chain:'erc20',chainId:1,
  contract:'0x'+'a'.repeat(40),symbol:'FAKE',name:'Unknown ERC20',
  quantity:10,quantityExact:'10',price:0,...overrides});

test('native assets are not hidden for missing quotes or tiny balances',()=>{
  assert.equal(walletTokenVisibility(a({chain:'evm',contract:'',symbol:'ETH',quantity:0.00000001})).show,true);
});
test('canonical stETH and LINK appear without available prices, but ticker clones do not',()=>{
  const steth=a({name:'Lido Staked Ether',symbol:'STETH',contract:'0xae7ab96520de3a18e5e111b5eaab095312d7fe84'});
  const link=a({name:'Chainlink',symbol:'LINK',contract:'0x514910771af9ca656af840dff83e8264ecf986ca'});
  assert.equal(walletTokenVisibility(steth).show,true);
  assert.equal(walletTokenVisibility(link).show,true);
  assert.equal(walletTokenVisibility(a({name:'Chainlink',symbol:'LINK'})).show,false);
});
test('confirmed contract quote allows unknown token, not scam-marked tokens',()=>{
  assert.equal(walletTokenVisibility(a({price:2})).show,true);
  assert.equal(walletTokenVisibility(a({price:2,reputation:'scam'})).show,false);
  assert.equal(walletTokenVisibility(a({price:2,reputation:'suspicious'})).show,false);
});
test('promotional URLs, airdrops, and hidden unicode controls are suppressed',()=>{
  for(const name of ['Claim at freebonus.com','AIRDROP Token','www.bad.site','Verify your wallet','ETH\u202eFAKE']){
    assert.equal(walletTokenVisibility(a({name,price:2})).show,false,name);
  }
});
test('unknown no-quote tokens are hidden; Dust WETH is hidden; meaningful WETH remains visible',()=>{
  assert.equal(walletTokenVisibility(a()).show,false);
  const weth='0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  assert.equal(walletTokenVisibility(a({symbol:'WETH',contract:weth,quantity:0.0000001,quantityExact:'0.0000001'})).show,false);
  assert.equal(walletTokenVisibility(a({symbol:'WETH',contract:weth,quantity:0.1,quantityExact:'0.1'})).show,true);
});
test('classification preserves identity and order; hidden assets remain recoverable',()=>{
  const native=a({chain:'evm',contract:'',symbol:'ETH'});
  const unpriced=a(),priced=a({name:'Useful',price:3,contract:'0x'+'b'.repeat(40)});
  const {visible,hidden}=partitionWalletAssets([native,unpriced,priced]);
  assert.deepEqual(visible,[native,priced]);
  assert.deepEqual(hidden,[unpriced]);
});
