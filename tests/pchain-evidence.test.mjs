import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {decodePchainUTXO,inspectPchainUTXO} from '../src/pchain-evidence.js';
import {PCHAIN_UTXO,PCHAIN_EXPECTED,OWNER_A,OWNER_B} from './pchain-evidence-fixture.mjs';
const uint=(n,bytes)=>BigInt(n).toString(16).padStart(bytes*2,'0');
const checked=raw=>'0x'+raw+createHash('sha256').update(Buffer.from(raw,'hex')).digest('hex').slice(-8);
function wire({version=0,tx='11'.repeat(32),index=3,asset='22'.repeat(32),type=7,amount='9007199254740993',locktime=100,threshold=1,owners=[OWNER_A],count=owners.length,outer,inner=7,trailer=''}={}){
 return uint(version,2)+tx+uint(index,4)+asset+uint(type,4)+(outer===undefined?'':uint(outer,8)+uint(inner,4))+uint(amount,8)+uint(locktime,8)+uint(threshold,4)+uint(count,4)+owners.join('')+trailer;
}
const decode=opts=>decodePchainUTXO(checked(wire(opts)),{encoding:'hex'});
const inspect=(opts={},watch=[OWNER_A],time='100')=>inspectPchainUTXO(checked(wire(opts)),{encoding:'hex',watchedPChainOwnerIds:watch,atTimeSeconds:time});
test('independent fixed RPC hex vector preserves outpoint, asset, amount beyond safe Number and time',async()=>{
 assert.deepEqual(await decodePchainUTXO(PCHAIN_UTXO,{encoding:'hex'}),PCHAIN_EXPECTED);
 assert.equal(checked(wire()),PCHAIN_UTXO,'independent Python checksum and Node encoder agree');
 const r=await decode();assert.equal(JSON.parse(JSON.stringify(r)).amountAtomic,'9007199254740993');
 assert.ok(Object.isFrozen(r));assert.ok(Object.isFrozen(r.ownerIds));assert.throws(()=>r.ownerIds.push(OWNER_B),TypeError);
});
test('encoding is explicit: hex/hexc checksummed, hexnc deliberately raw, no checksum fallback',async()=>{
 assert.deepEqual(await decodePchainUTXO(PCHAIN_UTXO,{encoding:'hexc'}),PCHAIN_EXPECTED);
 assert.deepEqual(await decodePchainUTXO('0x'+wire(),{encoding:'hexnc'}),PCHAIN_EXPECTED);
 await assert.rejects(decodePchainUTXO(PCHAIN_UTXO),/Encoding/);
 for(const encoding of ['json','base58','HEX',null])await assert.rejects(decodePchainUTXO(PCHAIN_UTXO,{encoding}),/Encoding/);
 await assert.rejects(decodePchainUTXO('0x'+wire(),{encoding:'hex'}),/Prüfsumme/);
 await assert.rejects(decodePchainUTXO(PCHAIN_UTXO,{encoding:'hexnc'}),/Zusätzliche Bytes/);
});
test('every altered byte including checksum is rejected without an unchecked retry',async()=>{
 const b=Buffer.from(PCHAIN_UTXO.slice(2),'hex');
 for(let i=0;i<b.length;i++){const changed=Buffer.from(b);changed[i]^=1;await assert.rejects(decodePchainUTXO('0x'+changed.toString('hex'),{encoding:'hex'}),/Prüfsumme/);}
});
test('every truncated raw boundary and extra validly checksummed bytes fail closed',async()=>{
 const raw=wire();
 for(let length=0;length<raw.length;length+=2)await assert.rejects(decodePchainUTXO(checked(raw.slice(0,length)),{encoding:'hex'}),/Unvollständige/);
 await assert.rejects(decode({trailer:'00'}),/Zusätzliche Bytes/);
});
test('reject malformed hex and bounded resource exhaustion before allocation/hash',async()=>{
 for(const value of ['',null,42,'0x','0x1','aa','0xgg','0x00\n','0X00','0x'+'00'.repeat(65537)])await assert.rejects(decodePchainUTXO(value,{encoding:'hex'}),/Hexdaten/);
 await assert.rejects(decodePchainUTXO('0x00',{encoding:'hexc'}),/Prüfsumme fehlt/);
 await assert.rejects(decode({count:1025}),/Ownerbedingungen/);
 await assert.rejects(decode({count:4294967295}),/Ownerbedingungen/);
});
test('codec and output-type boundaries reject unknown types and nested stakeable locks',async()=>{
 await assert.rejects(decode({version:1}),/Codecversion/);
 for(const type of [0,5,6,8,21,23,4294967295])await assert.rejects(decode({type}),/Ausgabetyp/);
 await assert.rejects(decode({type:22,outer:100,inner:22}),/Ausgabetyp/);
 await assert.rejects(decode({type:22,outer:0}),/Äußere Sperrzeit/);
});
test('zero amount and invalid threshold/owner ordering are not accepted financial evidence',async()=>{
 await assert.rejects(decode({amount:0}),/Ausgabebetrag/);
 await assert.rejects(decode({threshold:2}),/Ownerbedingungen/);
 await assert.rejects(decode({threshold:0}),/Ownerbedingungen/);
 await assert.rejects(decode({owners:[OWNER_A,OWNER_A]}),/eindeutig/);
 await assert.rejects(decode({owners:[OWNER_B,OWNER_A]}),/sortiert/);
});
test('full uint64 values and maximum output index remain exact without Number conversion',async()=>{
 const max='18446744073709551615';
 const r=await decode({amount:max,locktime:max,index:4294967295,type:22,outer:max});
 assert.equal(r.amountAtomic,max);assert.equal(r.locktime,max);assert.equal(r.stakeableLocktime,max);assert.equal(r.outputIndex,4294967295);
});
test('the documented 1024-owner support boundary retains every owner and the full threshold',async()=>{
 const owners=Array.from({length:1024},(_,i)=>i.toString(16).padStart(40,'0'));
 const r=await decode({owners,threshold:1024});assert.deepEqual(r.ownerIds,owners);assert.equal(r.threshold,1024);
 const inspected=await inspect({owners,threshold:1024},owners);assert.equal(inspected.ownerCoverage,'declared-all');assert.equal(inspected.thresholdCovered,true);
});
test('local UTXO amount is never called active stake, a reward or an AVAX quantity',async()=>{
 const r=await decode({asset:'33'.repeat(32)});
 assert.equal(r.assetId,'33'.repeat(32));
 assert.deepEqual(Object.keys(r),['transactionId','outputIndex','assetId','amountAtomic','locktime','stakeableLocktime','threshold','ownerIds']);
});
test('equal amounts with distinct source transaction/index remain distinct outpoints',async()=>{
 const a=await decode(),b=await decode({tx:'44'.repeat(32)}),c=await decode({index:4});
 assert.equal(a.amountAtomic,b.amountAtomic);assert.notEqual(a.transactionId,b.transactionId);assert.notEqual(a.outputIndex,c.outputIndex);
});
test('inner lock controls platform lock; outer lock controls stakeability; exact maturity boundary',async()=>{
 assert.equal((await inspect({},[OWNER_A],'99')).lockState,'locked-platform');
 assert.equal((await inspect()).lockState,'unlocked');
 assert.equal((await inspect({type:22,outer:101})).lockState,'locked-stakeable');
 assert.equal((await inspect({type:22,outer:100})).lockState,'unlocked');
 assert.equal((await inspect({type:22,outer:90})).lockState,'unlocked');
 assert.equal((await inspect({type:22,outer:101,locktime:102})).lockState,'locked-platform');
});
test('address intersection, signature threshold and complete declared owner-set coverage differ',async()=>{
 assert.equal((await inspect()).ownerCoverage,'declared-all');
 const shared=await inspect({owners:[OWNER_A,OWNER_B]});assert.equal(shared.ownerCoverage,'shared');assert.equal(shared.thresholdCovered,true);
 const multisig=await inspect({owners:[OWNER_A,OWNER_B],threshold:2});assert.equal(multisig.ownerCoverage,'shared');assert.equal(multisig.thresholdCovered,false);
 const all=await inspect({owners:[OWNER_A,OWNER_B],threshold:2},[OWNER_B,OWNER_A]);assert.equal(all.ownerCoverage,'declared-all');assert.equal(all.thresholdCovered,true);
 const absent=await inspect({},[OWNER_B]);assert.equal(absent.ownerCoverage,'absent');assert.equal(absent.thresholdCovered,false);
 assert.equal((await inspect({},[])).ownerCoverage,'absent');
 const free=await inspect({owners:[],threshold:0});assert.equal(free.ownerCoverage,'unrestricted');assert.notEqual(free.ownerCoverage,'declared-all');
});
test('inspection requires explicit canonical P-Chain owner IDs and bounded exact chain time',async()=>{
 for(const ids of [null,['0x'+OWNER_A],[OWNER_A.toUpperCase()],[OWNER_A,OWNER_A],['aa'],Array(1025).fill(OWNER_A)])await assert.rejects(inspect({},ids),/Owner/);
 for(const time of [null,100,'-1','1.5','01','18446744073709551616','1e9'])await assert.rejects(inspect({},[OWNER_A],time),/Chainzeit/);
 assert.equal((await inspect({},[OWNER_A],'0')).lockState,'locked-platform');
 assert.equal((await inspect({locktime:'18446744073709551615'},[OWNER_A],'18446744073709551615')).lockState,'unlocked');
});
test('pure inspection preserves input owner set and does not call network/storage or invent totals',async()=>{
 const watched=[OWNER_B,OWNER_A],before=JSON.stringify(watched);
 const r=await inspect({owners:[OWNER_A,OWNER_B]},watched);
 assert.equal(JSON.stringify(watched),before);assert.ok(Object.isFrozen(r));
 assert.deepEqual(Object.keys(r),['utxo','ownerCoverage','matchedOwners','thresholdCovered','lockState','atTimeSeconds']);
});
