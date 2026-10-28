import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectSonicWithdrawal} from '../src/sonic-staking-evidence.js';
import {sonicObservation} from './sonic-staking-evidence-fixture.mjs';
const max=((1n<<256n)-1n).toString();
test('independent waiting reference retains exact principal, requestID zero and both thresholds',()=>{
 const result=inspectSonicWithdrawal(sonicObservation());
 assert.equal(result.status,'waiting');assert.equal(result.requestAmountAtomic,'9007199254740993');assert.equal(result.locator.requestId,'0');
 assert.deepEqual(result.maturity,{base:'request',releaseTime:'110',releaseEpoch:'12',timeSatisfied:false,epochSatisfied:false});
 assert.equal(result.sourceVersion,'4.0.5');assert.equal(result.paymentEvidence,'not-assessed');
});
test('time alone or epoch alone cannot satisfy both source-contract waiting periods',()=>{
 const time=sonicObservation();time.block.timestamp='110';
 assert.equal(inspectSonicWithdrawal(time).status,'waiting');assert.equal(inspectSonicWithdrawal(time).maturity.timeSatisfied,true);assert.equal(inspectSonicWithdrawal(time).maturity.epochSatisfied,false);
 const epoch=sonicObservation();epoch.epoch.value='12';
 assert.equal(inspectSonicWithdrawal(epoch).status,'waiting');assert.equal(inspectSonicWithdrawal(epoch).maturity.timeSatisfied,false);assert.equal(inspectSonicWithdrawal(epoch).maturity.epochSatisfied,true);
});
test('exact equality of both thresholds means mature-pending, never a payment or guaranteed claim',()=>{
 const o=sonicObservation();o.block.timestamp='110';o.epoch.value='12';
 const r=inspectSonicWithdrawal(o);assert.equal(r.status,'mature-pending');assert.equal(r.requestAmountAtomic,'9007199254740993');assert.equal(r.paymentEvidence,'not-assessed');
 assert.deepEqual(Object.keys(r),['sourceVersion','atBlock','locator','requestAmountAtomic','paymentEvidence','status','maturity']);
});
test('earlier validator deactivation supplies both time and epoch bases',()=>{
 const o=sonicObservation();o.validator.deactivatedTime='90';o.validator.deactivatedEpoch='8';
 const r=inspectSonicWithdrawal(o);assert.equal(r.status,'mature-pending');assert.deepEqual(r.maturity,{base:'earlier-validator-deactivation',releaseTime:'100',releaseEpoch:'10',timeSatisfied:true,epochSatisfied:true});
 o.epoch.value='10';o.block.timestamp='100';assert.equal(inspectSonicWithdrawal(o).status,'mature-pending');
});
test('same deactivation timestamp does not replace request basis; later deactivation does not either',()=>{
 const same=sonicObservation();same.validator.deactivatedTime='100';same.validator.deactivatedEpoch='9';
 assert.deepEqual(inspectSonicWithdrawal(same).maturity,{base:'request',releaseTime:'110',releaseEpoch:'12',timeSatisfied:false,epochSatisfied:false});
 same.validator.deactivatedTime='105';same.validator.deactivatedEpoch='11';assert.equal(inspectSonicWithdrawal(same).maturity.base,'request');
});
test('dynamic zero periods are not replaced with a hardcoded number of days/epochs',()=>{
 const o=sonicObservation();o.periods.seconds='0';o.periods.epochs='0';
 const r=inspectSonicWithdrawal(o);assert.equal(r.status,'mature-pending');assert.equal(r.maturity.releaseTime,'100');assert.equal(r.maturity.releaseEpoch,'10');
});
test('all-zero current mapping proves no current request, without historical payment inference',()=>{
 const o=sonicObservation();o.request.amountAtomic='0';o.request.epoch='0';o.request.time='0';o.request.paid=true;
 const r=inspectSonicWithdrawal(o);assert.equal(r.status,'no-current-request');assert.equal(r.maturity,null);assert.equal(r.paymentEvidence,'not-assessed');assert.equal(Object.hasOwn(r,'paid'),false);
});
test('empty mapping with residual fields and positive requests without temporal evidence fail closed',()=>{
 for(const field of ['epoch','time']){const o=sonicObservation();o.request.amountAtomic='0';o.request.epoch='0';o.request.time='0';o.request[field]='1';assert.throws(()=>inspectSonicWithdrawal(o),/Restfelder/);}
 for(const field of ['epoch','time']){const o=sonicObservation();o.request[field]='0';assert.throws(()=>inspectSonicWithdrawal(o),/Positiver Request/);}
 const time=sonicObservation();time.request.time='110';assert.throws(()=>inspectSonicWithdrawal(time),/Positiver Request/);
 const epoch=sonicObservation();epoch.request.epoch='12';assert.throws(()=>inspectSonicWithdrawal(epoch),/Positiver Request/);
});
test('deactivation pair, chronology and validator identity must be consistent',()=>{
 const changes=[['deactivatedTime','90'],['deactivatedEpoch','8'],['deactivatedTime','110'],['deactivatedEpoch','12']];
 for(const [field,value]of changes){const o=sonicObservation();o.validator[field]=value;assert.throws(()=>inspectSonicWithdrawal(o),/Deaktivierung/);}
 const chronology=sonicObservation();chronology.validator.deactivatedTime='90';chronology.validator.deactivatedEpoch='11';assert.throws(()=>inspectSonicWithdrawal(chronology),/früherer Zeit/);
 const other=sonicObservation();other.validator.validatorId='2';assert.throws(()=>inspectSonicWithdrawal(other),/anderen Zuordnung/);
});
test('every observation shares the exact block hash and its expected contract',()=>{
 for(const field of ['source','request','validator','periods','epoch']){
  const o=sonicObservation();o[field].atBlockHash='0x'+'2'.repeat(64);assert.throws(()=>inspectSonicWithdrawal(o),/selben Block/);
  const c=sonicObservation();c[field].contract='0x'+'b'.repeat(40);assert.throws(()=>inspectSonicWithdrawal(c),/selben Block/);
 }
 const missing=sonicObservation();delete missing.request.atBlockHash;assert.throws(()=>inspectSonicWithdrawal(missing),/selben Block/);
 const constants=sonicObservation();constants.source.constantsAddress='0x'+'d'.repeat(40);assert.throws(()=>inspectSonicWithdrawal(constants),/selben Block/);
});
test('network, SFC, implementation and runtime semantics are explicit rather than inferred',()=>{
 for(const chainId of ['250','14601',146]){const o=sonicObservation();o.chainId=chainId;assert.throws(()=>inspectSonicWithdrawal(o),/Chain/);}
 const c=sonicObservation();c.contract='0x'+'b'.repeat(40);assert.throws(()=>inspectSonicWithdrawal(c),/SFC/);
 const implementation=sonicObservation();implementation.source.implementation='0x'+'d'.repeat(40);assert.throws(()=>inspectSonicWithdrawal(implementation),/Implementierungssemantik/);
 const runtime=sonicObservation();runtime.source.runtimeSHA256='0'.repeat(64);assert.throws(()=>inspectSonicWithdrawal(runtime),/Implementierungssemantik/);
 const missing=sonicObservation();delete missing.source.runtimeSHA256;assert.throws(()=>inspectSonicWithdrawal(missing),/Implementierungssemantik/);
});
test('uint256 values remain exact at maximum while both threshold overflows fail closed',()=>{
 const o=sonicObservation();o.request.amountAtomic=max;o.request.requestId=max;assert.equal(inspectSonicWithdrawal(o).requestAmountAtomic,max);assert.equal(inspectSonicWithdrawal(o).locator.requestId,max);
 const time=sonicObservation();time.block.timestamp=max;time.request.time=(BigInt(max)-1n).toString();time.periods.seconds='2';assert.throws(()=>inspectSonicWithdrawal(time),/überlaufen/);
 const epoch=sonicObservation();epoch.epoch.value=max;epoch.request.epoch=(BigInt(max)-1n).toString();epoch.periods.epochs='2';assert.throws(()=>inspectSonicWithdrawal(epoch),/überlaufen/);
 time.periods.seconds='1';assert.equal(inspectSonicWithdrawal(time).maturity.releaseTime,max);
});
test('no coercion from numbers, hex, signs, exponent, leading zeros, missing or excessive values',()=>{
 for(const bad of [null,undefined,1,'-1','+1','01','1.5','1e9','0x1','9'.repeat(79),(BigInt(max)+1n).toString()]){
  const o=sonicObservation();o.request.amountAtomic=bad;assert.throws(()=>inspectSonicWithdrawal(o),/uint256/);
 }
 for(const field of ['block','source','request','validator','periods','epoch']){const o=sonicObservation();o[field]=null;assert.throws(()=>inspectSonicWithdrawal(o),/Beobachtung/);}
 assert.throws(()=>inspectSonicWithdrawal(null),/Beobachtung/);
});
test('bad header and missing constants or source identities cannot produce a zero/paid state',()=>{
 const hash=sonicObservation();hash.block.hash='latest';assert.throws(()=>inspectSonicWithdrawal(hash),/Blockhash/);
 const constants=sonicObservation();constants.source.constantsAddress='0x'+'0'.repeat(40);assert.throws(()=>inspectSonicWithdrawal(constants),/Konstantenvertrag/);
 const owner=sonicObservation();owner.request.owner='private-key';assert.throws(()=>inspectSonicWithdrawal(owner),/öffentliche|Öffentliche/);
 const zeroOwner=sonicObservation();zeroOwner.request.owner='0x'+'0'.repeat(40);assert.throws(()=>inspectSonicWithdrawal(zeroOwner),/Positiver Request/);
 const validator=sonicObservation();validator.request.validatorId='0';assert.throws(()=>inspectSonicWithdrawal(validator),/Validator-ID/);
 const epoch=sonicObservation();epoch.epoch.value='0';assert.throws(()=>inspectSonicWithdrawal(epoch),/Aktuelle Epoch/);
});
test('read-only result is immutable and exposes no global generation, total, reward or payment value',()=>{
 const o=sonicObservation();o.request.secret='do-not-copy';o.paid=true;const before=JSON.stringify(o),r=inspectSonicWithdrawal(o);
 assert.equal(JSON.stringify(o),before);assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.atBlock)&&Object.isFrozen(r.locator)&&Object.isFrozen(r.maturity));assert.throws(()=>{r.locator.requestId='1';},TypeError);
 assert.ok(!JSON.stringify(r).includes('do-not-copy'));assert.equal(Object.hasOwn(r,'id'),false);assert.equal(Object.hasOwn(r,'total'),false);assert.equal(Object.hasOwn(r,'rewards'),false);
 const second=sonicObservation();second.block.hash='0x'+'2'.repeat(64);for(const key of ['source','request','validator','periods','epoch'])second[key].atBlockHash=second.block.hash;
 const other=inspectSonicWithdrawal(second);assert.deepEqual(other.locator,r.locator);assert.notEqual(other.atBlock.hash,r.atBlock.hash,'reused request locator is not a global generation ID');
});
