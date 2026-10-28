/** Pure, bounded withdrawal-period assessment for the verified Sonic SFC4.0.5.
 * No RPC, balances, event replay, payment inference, storage or financial integration.
 * Source proof and limitations: docs/FLH03_SONIC_EVIDENCE_CHECKPOINT.md.
 */
const SFC='0xfc00face00000000000000000000000000000000';
const IMPLEMENTATION='0xf46ab7507088cc9d3f58bb85ae2c36c86103447d';
const RUNTIME_SHA256='4dedff7aee0b55c1764a6885d24443e52358583b06aa81cf78673aeae7374290';
const MAX_UINT256=(1n<<256n)-1n;
const fail=message=>{throw Error('Sonic-Nachweis: '+message);};
function record(value){if(!value||typeof value!=='object'||Array.isArray(value))fail('Beobachtung unvollständig.');return value;}
function uint(value){
 if(typeof value!=='string'||!/^(0|[1-9]\d{0,77})$/.test(value))fail('Kanonischer uint256-Dezimalwert fehlt.');
 const n=BigInt(value);if(n>MAX_UINT256)fail('uint256-Grenze überschritten.');return n;
}
function address(value){if(typeof value!=='string'||!/^0x[0-9a-fA-F]{40}$/.test(value))fail('Öffentliche EVM-Adresse ungültig.');return value.toLowerCase();}
function sum(a,b){const n=a+b;if(n>MAX_UINT256)fail('Wartefrist würde uint256 überlaufen.');return n.toString();}
/** Input records are declared observations; their block/source linkage must be verified by
 * a future reader. Matching declared metadata alone is not a cryptographic chain proof.
 */
export function inspectSonicWithdrawal(observation){
 const o=record(observation),block=record(o.block);
 if(o.chainId!=='146'||address(o.contract)!==SFC)fail('Chain oder SFC nicht unterstützt.');
 if(typeof block.hash!=='string'||!/^0x[0-9a-f]{64}$/.test(block.hash))fail('Expliziter Blockhash fehlt.');
 uint(block.number);const now=uint(block.timestamp);
 const pinned=(value,expectedContract)=>{
  const r=record(value);
  if(r.atBlockHash!==block.hash||address(r.contract)!==expectedContract)fail('Belege gehören nicht zum selben Block und Vertrag.');
  return r;
 };
 const source=pinned(o.source,SFC);
 if(address(source.implementation)!==IMPLEMENTATION||source.runtimeSHA256!==RUNTIME_SHA256)fail('Implementierungssemantik nicht belegt.');
 const constantsAddress=address(source.constantsAddress);
 if(constantsAddress==='0x'+'0'.repeat(40))fail('Konstantenvertrag fehlt.');
 const request=pinned(o.request,SFC),validator=pinned(o.validator,SFC),periods=pinned(o.periods,constantsAddress),epoch=pinned(o.epoch,SFC);
 const owner=address(request.owner),validatorId=uint(request.validatorId),requestId=uint(request.requestId);
 if(validatorId===0n)fail('Validator-ID ist null.');
 if(uint(validator.validatorId)!==validatorId)fail('Validator-Beleg gehört zu einer anderen Zuordnung.');
 const amount=uint(request.amountAtomic),requestEpoch=uint(request.epoch),requestTime=uint(request.time);
 const deactivatedTime=uint(validator.deactivatedTime),deactivatedEpoch=uint(validator.deactivatedEpoch);
 const periodTime=uint(periods.seconds),periodEpochs=uint(periods.epochs),currentEpoch=uint(epoch.value);
 if(currentEpoch===0n)fail('Aktuelle Epoch ist null.');
 if((deactivatedTime===0n)!==(deactivatedEpoch===0n)||deactivatedTime>now||deactivatedEpoch>currentEpoch)fail('Validator-Deaktivierung inkonsistent.');
 const atBlock=Object.freeze({number:block.number,hash:block.hash,timestamp:block.timestamp});
 const locator=Object.freeze({owner,validatorId:validatorId.toString(),requestId:requestId.toString()});
 const result={sourceVersion:'4.0.5',atBlock,locator,requestAmountAtomic:amount.toString(),paymentEvidence:'not-assessed'};
 if(amount===0n){
  if(requestEpoch!==0n||requestTime!==0n)fail('Leerer Request enthält widersprüchliche Restfelder.');
  return Object.freeze({...result,status:'no-current-request',maturity:null});
 }
 if(owner==='0x'+'0'.repeat(40)||requestEpoch===0n||requestTime===0n||requestTime>now||requestEpoch>currentEpoch)fail('Positiver Request nicht zeitlich belegt.');
 const earlier=deactivatedTime!==0n&&deactivatedTime<requestTime;
 if(earlier&&deactivatedEpoch>requestEpoch)fail('Deaktivierungs-Epoch widerspricht früherer Zeit.');
 const releaseTime=sum(earlier?deactivatedTime:requestTime,periodTime),releaseEpoch=sum(earlier?deactivatedEpoch:requestEpoch,periodEpochs);
 const timeSatisfied=now>=BigInt(releaseTime),epochSatisfied=currentEpoch>=BigInt(releaseEpoch);
 const maturity=Object.freeze({base:earlier?'earlier-validator-deactivation':'request',releaseTime,releaseEpoch,timeSatisfied,epochSatisfied});
 return Object.freeze({...result,status:timeSatisfied&&epochSatisfied?'mature-pending':'waiting',maturity});
}
