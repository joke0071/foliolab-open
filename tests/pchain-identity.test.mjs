import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodePchainAddress,pchainUTXOIdentity} from '../src/pchain-identity.js';
import {decodePchainUTXO,inspectPchainUTXO} from '../src/pchain-evidence.js';
import {PCHAIN_UTXO,OWNER_A} from './pchain-evidence-fixture.mjs';
import {ADDRESS_VECTORS as V} from './pchain-identity-fixture.mjs';
const P='0'.repeat(64),C='c'.repeat(64),tx='1'.repeat(64);
const context={networkID:'1',sourceChainId:P,destinationChainId:P};
const outpoint={transactionId:tx,outputIndex:3};
const decode=(address,networkID='1')=>decodePchainAddress(address,{networkID});

test('fixed independent synthetic addresses decode to exact 20-byte owners on both networks',()=>{
 for(const [hrp,networkID] of [['avax','1'],['fuji','5']]){
  for(const [name,ownerId] of [['zero','00'.repeat(20)],['aa','aa'.repeat(20)],['ones','ff'.repeat(20)],['sequence','000102030405060708090a0b0c0d0e0f10111213']]){
   const address=V[hrp+'_'+name],decoded=decode(address,networkID);
   assert.deepEqual(decoded,{address,networkID,chainId:P,ownerId,ownerKey:JSON.stringify(['avalanche-owner-v1',networkID,P,ownerId])});
   assert.ok(Object.isFrozen(decoded));
  }
 }
 assert.notEqual(decode(V.avax_zero).ownerKey,decode(V.fuji_zero,'5').ownerKey);
});
test('every single-character Bech32 payload/checksum corruption is rejected',()=>{
 const alphabet='qpzry9x8gf2tvdw0s3jn54khce6mua7l';
 for(const [address,networkID]of [[V.avax_sequence,'1'],[V.fuji_ones,'5']]){
  for(let i=7;i<address.length;i++){
   const changed=address.slice(0,i)+alphabet[(alphabet.indexOf(address[i])+1)%32]+address.slice(i+1);
   assert.throws(()=>decode(changed,networkID),/Prüfsumme/);
  }
 }
});
test('network, chain and canonical representation cannot be silently inferred or normalized',()=>{
 for(const networkID of [undefined,null,1,5,'01','mainnet','43114','12345','__proto__'])assert.throws(()=>decodePchainAddress(V.avax_zero,{networkID}));
 assert.throws(()=>decodePchainAddress(V.avax_zero));
 assert.throws(()=>decode(V.avax_zero,'5'));assert.throws(()=>decode(V.fuji_zero,'1'));
 for(const address of [null,{},42,'',V.avax_zero.toUpperCase(),V.avax_zero.replace('avax','aVax'),V.avax_zero.toLowerCase(),V.avax_zero.replace('P-','X-'),V.avax_zero.replace('P-','C-'),V.avax_zero.slice(2),V.avax_zero+' ',V.avax_zero+'\n',' '+V.avax_zero,V.custom_zero,'0x'+'ab'.repeat(20),V.avax_zero.slice(0,-1)+'b'])assert.throws(()=>decode(address));
});
test('short/long payloads, SegWit-sized extra words and Bech32m never become owners',()=>{
 for(const [hrp,n]of [['avax','1'],['fuji','5']])for(const suffix of ['short','long'])assert.throws(()=>decode(V[hrp+'_'+suffix],n));
 assert.throws(()=>decode(V.avax_bech32m),/Prüfsumme/);
 assert.throws(()=>decode(V.avax_zero.slice(0,7)+'q'+V.avax_zero.slice(7)));
 assert.throws(()=>decode(V.avax_zero.slice(0,7)+V.avax_zero.slice(8)));
});
test('identity uses explicit network, source, destination and exact outpoint, with no financial payload',()=>{
 const expected=['avalanche-utxo-observation-v1','1',P,P,tx,3];
 const value=pchainUTXOIdentity(outpoint,context);
 assert.equal(value.key,JSON.stringify(expected));assert.equal(value.kind,'native');assert.ok(Object.isFrozen(value));
 assert.equal(pchainUTXOIdentity({...outpoint,assetId:C,amountAtomic:'999',ownerIds:['aa'.repeat(20)]},context).key,value.key);
 assert.notEqual(pchainUTXOIdentity(outpoint,{...context,networkID:'5'}).key,value.key);
 const atomic=pchainUTXOIdentity(outpoint,{...context,sourceChainId:C});assert.equal(atomic.kind,'atomic');assert.notEqual(atomic.key,value.key);
 assert.notEqual(pchainUTXOIdentity({...outpoint,outputIndex:4},context).key,value.key);
 assert.notEqual(pchainUTXOIdentity({...outpoint,transactionId:C},context).key,value.key);
 assert.notEqual(pchainUTXOIdentity(outpoint,{...context,sourceChainId:'d'.repeat(64)}).key,atomic.key);
});
test('uint32 limits are exact and cannot collide through coercion or unsafe integers',()=>{
 for(const outputIndex of [0,0xffffffff])assert.equal(pchainUTXOIdentity({...outpoint,outputIndex},context).outputIndex,outputIndex);
 for(const outputIndex of [-0,-1,0.5,0x100000000,Number.MAX_SAFE_INTEGER,NaN,Infinity,'3','0',3n,null,undefined])assert.throws(()=>pchainUTXOIdentity({...outpoint,outputIndex},context),/uint32/);
});
test('missing or malformed context and IDs fail instead of defaulting to local/mainnet',()=>{
 assert.throws(()=>pchainUTXOIdentity(outpoint));
 for(const field of ['networkID','sourceChainId','destinationChainId']){const missing={...context};delete missing[field];assert.throws(()=>pchainUTXOIdentity(outpoint,missing));}
 for(const value of ['',null,42,'P','C','0x'+P,'A'.repeat(64),'g'.repeat(64),P+'\n',P.slice(1),'1'.repeat(65),'a:b']){
  assert.throws(()=>pchainUTXOIdentity(outpoint,{...context,sourceChainId:value}));
  assert.throws(()=>pchainUTXOIdentity({...outpoint,transactionId:value},context));
 }
 assert.throws(()=>pchainUTXOIdentity(outpoint,{...context,destinationChainId:C}),/P-Zielchain/);
 for(const value of [null,[],42,{},'outpoint'])assert.throws(()=>pchainUTXOIdentity(value,context));
});
test('existing checked UTXO decoder and owner inspection compose without changing their originals',async()=>{
 const decoded=await decodePchainUTXO(PCHAIN_UTXO,{encoding:'hex'}),before=JSON.stringify(decoded);
 const owner=decode(V.avax_aa);assert.equal(owner.ownerId,OWNER_A);
 const inspection=await inspectPchainUTXO(PCHAIN_UTXO,{encoding:'hex',watchedPChainOwnerIds:[owner.ownerId],atTimeSeconds:'100'});
 assert.equal(inspection.ownerCoverage,'declared-all');
 const key=pchainUTXOIdentity(decoded,context).key;
 assert.equal(key,pchainUTXOIdentity(inspection.utxo,context).key);assert.equal(JSON.stringify(decoded),before);
 assert.equal(inspection.thresholdCovered,true); // structural declared coverage, not key ownership
});
test('bounded helpers remain outside active app, wallet scanner and model imports',()=>{
 for(const file of ['app.js','model.js','wallet-scan-update.js','blockchain-adapters.js','staking-discovery.js'])assert.doesNotMatch(readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),/pchain-identity\.js/);
});
