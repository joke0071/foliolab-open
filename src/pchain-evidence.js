/** Bounded read-only P-Chain UTXO decoding, not a wallet balance or ownership proof.
 * Format/source pin and remaining integration gates: FLH03_PCHAIN_EVIDENCE_CHECKPOINT.md.
 * No RPC, persistence, address derivation, aggregation or financial mutations.
 */
const MAX_BYTES=65536,MAX_OWNERS=1024;
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const fail=message=>{throw Error('P-Chain-Nachweis: '+message);};
async function rpcBytes(value,encoding){
 if(!['hex','hexc','hexnc'].includes(encoding))fail('Encoding nicht unterstützt.');
 if(typeof value!=='string'||value.length>2+MAX_BYTES*2||!/^0x(?:[0-9a-fA-F]{2})+$/.test(value))fail('Hexdaten fehlen, sind ungültig oder zu groß.');
 const bytes=Uint8Array.from(value.slice(2).match(/../g),s=>parseInt(s,16));
 if(encoding==='hexnc')return bytes;
 if(bytes.length<4)fail('Prüfsumme fehlt.');
 const payload=bytes.slice(0,-4),digest=new Uint8Array(await crypto.subtle.digest('SHA-256',payload));
 if(!bytes.slice(-4).every((b,i)=>b===digest[digest.length-4+i]))fail('Prüfsumme stimmt nicht.');
 return payload;
}
/** IDs are raw canonical hex, amounts/timestamps decimal strings; no implied asset units. */
export async function decodePchainUTXO(value,{encoding}={}){
 const bytes=await rpcBytes(value,encoding),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let offset=0;
 const take=n=>{if(offset+n>bytes.length)fail('Unvollständige UTXO.');const start=offset;offset+=n;return start;};
 const u32=()=>view.getUint32(take(4)),u64=()=>view.getBigUint64(take(8)).toString();
 const id=n=>{const start=take(n);return hex(bytes.subarray(start,start+n));};
 if(view.getUint16(take(2))!==0)fail('Codecversion nicht unterstützt.');
 const transactionId=id(32),outputIndex=u32(),assetId=id(32);
 let outputType=u32(),stakeableLocktime=null;
 if(outputType===22){
  stakeableLocktime=u64();
  if(stakeableLocktime==='0')fail('Äußere Sperrzeit ist null.');
  outputType=u32();
 }
 if(outputType!==7)fail('Ausgabetyp nicht unterstützt.');
 const amountAtomic=u64(),locktime=u64(),threshold=u32(),count=u32();
 if(amountAtomic==='0')fail('Ausgabebetrag ist null.');
 if(count>MAX_OWNERS||threshold>count||(threshold===0&&count!==0))fail('Ownerbedingungen ungültig oder nicht unterstützt.');
 const ownerIds=[];
 for(let i=0;i<count;i++){
  const owner=id(20);
  if(i&&owner<=ownerIds[i-1])fail('Owner müssen eindeutig und sortiert sein.');
  ownerIds.push(owner);
 }
 if(offset!==bytes.length)fail('Zusätzliche Bytes nach der UTXO.');
 return Object.freeze({transactionId,outputIndex,assetId,amountAtomic,locktime,stakeableLocktime,threshold,ownerIds:Object.freeze(ownerIds)});
}
/** Only structural coverage of declared P-Chain IDs, never proof of key/economic ownership.
 * atTimeSeconds is an explicit chain-time observation, not the local wall clock.
 */
export async function inspectPchainUTXO(value,{encoding,watchedPChainOwnerIds,atTimeSeconds}={}){
 if(!Array.isArray(watchedPChainOwnerIds)||watchedPChainOwnerIds.length>MAX_OWNERS||watchedPChainOwnerIds.some(x=>typeof x!=='string'||!/^([0-9a-f]{40})$/.test(x)))fail('Deklarierte P-Chain-Owner-IDs ungültig.');
 if(typeof atTimeSeconds!=='string'||!/^(0|[1-9]\d{0,19})$/.test(atTimeSeconds)||BigInt(atTimeSeconds)>18446744073709551615n)fail('Explizite Chainzeit ungültig.');
 const watched=new Set(watchedPChainOwnerIds);
 if(watched.size!==watchedPChainOwnerIds.length)fail('Deklarierte Owner-IDs sind doppelt.');
 const utxo=await decodePchainUTXO(value,{encoding}),now=BigInt(atTimeSeconds);
 const matchedOwners=utxo.ownerIds.filter(id=>watched.has(id)).length;
 const ownerCoverage=utxo.threshold===0?'unrestricted':matchedOwners===0?'absent':matchedOwners===utxo.ownerIds.length?'declared-all':'shared';
 const lockState=BigInt(utxo.locktime)>now?'locked-platform':utxo.stakeableLocktime!==null&&BigInt(utxo.stakeableLocktime)>now?'locked-stakeable':'unlocked';
 return Object.freeze({utxo,ownerCoverage,matchedOwners,thresholdCovered:matchedOwners>=utxo.threshold,lockState,atTimeSeconds});
}
