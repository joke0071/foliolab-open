import test from 'node:test';import assert from 'node:assert/strict';
import {getAdapter,getCapabilities,validateAddress} from '../src/blockchain-adapters.js';
import {xrpBalance,discoverWallet,PUBLIC_EVM_NETWORKS} from '../src/market.js';
const XRP='rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn';
test('Public XRP account_info parses drops safely',async()=>{const f=async(u,o)=>{assert.equal(u,'https://xrplcluster.com');assert.equal(JSON.parse(o.body).method,'account_info');return {ok:true,json:async()=>({result:{account_data:{Balance:'129912576'}}})}};assert.equal(await xrpBalance(XRP,f),129.912576);assert.equal((await discoverWallet('xrp',XRP,{},f))[0].coinId,'ripple');});
test('Unverified adapters are explicitly manual',()=>{for(const id of ['bnb','cardano','cosmos','ton','sui','aptos']){assert.equal(getCapabilities(id).canScan,false);assert.throws(()=>getAdapter(id).validateAddress('test'));}});
test('Avalanche C Chain Blockscout adapter available',()=>{assert.equal(PUBLIC_EVM_NETWORKS[43114].symbol,'AVAX');assert.equal(getCapabilities('43114').canScan,true);assert.equal(validateAddress('43114','0x'+'a'.repeat(40)).length,42);});
test('Seed phrases and private wallet keys rejected',()=>{assert.throws(()=>validateAddress('btc','xprvABCD'),/privaten/);assert.throws(()=>validateAddress('xrp','seed phrase'),/privaten/);});
