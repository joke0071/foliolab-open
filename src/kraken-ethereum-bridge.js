/** One direct native ETH source withdrawal -> one receipt-backed own incoming event.
 * The retained proof is portable without optional history. It never certifies history coverage.
 */
import {sourceDigest,sourceUnmodified} from './import-identity.js';
import {parseLedgerLiveCSV} from './ledger-live.js';
import {validateHistoryEvent} from './wallet-history-core.js';
import {validateHistorySession} from './wallet-history-state.js';
import {ETH_RPC} from './ethereum-fallback.js';
import {units,exact} from './decimal.js';
const digest=v=>sourceDigest(JSON.stringify(v));
const fail=()=>{throw Error('Ethereum-Gegenbeleg unvollständig, widersprüchlich oder nicht mehr eindeutig.');};
const hash=v=>typeof v==='string'&&/^0x[a-f0-9]{64}$/.test(v);
const sha=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const address=v=>{if(typeof v!=='string'||!/^0x[a-f0-9]{40}$/i.test(v))fail();return v.toLowerCase();};
const hex=v=>{if(typeof v!=='string'||!/^0x(?:0|[1-9a-f][a-f0-9]{0,63})$/.test(v))fail();return BigInt(v);};
const keys=(v,s)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join()!==s.split(' ').sort().join())fail();};
const native=p=>p?.kind==='crypto'&&p.coinId==='ethereum'&&p.symbol==='ETH'&&p.wallet?.enabled&&p.wallet.chain==='evm'&&Number(p.wallet.chainId)===1&&!p.wallet.contract;
/** Separate ETH bridge scope; do not extend the BTC-only history-session field. */
export function ethereumBridgeScope(p){if(!native(p))fail();return digest([p.id,p.accountId,p.kind,p.coinId,p.symbol,p.wallet.chain,String(p.wallet.chainId),address(p.wallet.address)]);}
export const ethereumBridgeDigest=proof=>digest(proof);
export const hasKrakenEthereumState=m=>(m?.journalEntries||[]).some(j=>j.krakenEthereumBridge||j.krakenWithdrawal?.originals?.some(o=>o.journal?.krakenEthereumBridge));
export function krakenEthereumBridgeFor(model,group){return model.journalEntries.find(j=>j.id==='uh03:'+group+':0')?.krakenEthereumBridge??model.journalEntries.find(j=>j.id==='uh03:'+group+':undo')?.krakenWithdrawal?.originals?.[0]?.journal?.krakenEthereumBridge??null;}
const eventFacts=e=>digest([e.id,e.network,e.chainId,e.accountId,e.assetId,e.contract,e.mint,e.decimals,e.txid,e.locator,e.blockHeight,e.blockHash,e.txIndex,e.timestamp,e.quantityBaseUnits,e.type,e.status,e.finality,e.coverage,e.qualityCode]);
/** Reduce RPC data to a bounded immutable direct-transfer proof, including canonical inclusion. */
function chainProof({transaction:t,receipt:r,block:b,finalized:f}){
 if(!t||!r||!b||!f||!Array.isArray(b.transactions)||b.transactions.length>10000||!Array.isArray(r.logs)||r.logs.length||t.input!=='0x'||r.status!=='0x1'||r.contractAddress!=null||!['0x0','0x1','0x2'].includes(t.type))fail();
 const index=hex(r.transactionIndex);if(index>=BigInt(b.transactions.length)||typeof b.transactions[Number(index)]!=='string')fail();
 return {transaction:{hash:t.hash,chainId:t.chainId,from:address(t.from),to:address(t.to),value:t.value,input:t.input,blockHash:t.blockHash,blockNumber:t.blockNumber,transactionIndex:t.transactionIndex,type:t.type},receipt:{transactionHash:r.transactionHash,from:address(r.from),to:address(r.to),blockHash:r.blockHash,blockNumber:r.blockNumber,transactionIndex:r.transactionIndex,status:r.status,gasUsed:r.gasUsed,effectiveGasPrice:r.effectiveGasPrice,logs:[]},block:{hash:b.hash,number:b.number,timestamp:b.timestamp,transactionHash:b.transactions[Number(index)],transactionIndex:r.transactionIndex},finalized:{hash:f.hash,number:f.number}};
}
function validateChain(c,e,destination){
 keys(c,'transaction receipt block finalized');const {transaction:t,receipt:r,block:b,finalized:f}=c;
 keys(t,'hash chainId from to value input blockHash blockNumber transactionIndex type');keys(r,'transactionHash from to blockHash blockNumber transactionIndex status gasUsed effectiveGasPrice logs');keys(b,'hash number timestamp transactionHash transactionIndex');keys(f,'hash number');
 if(!hash(t.hash)||!hash(b.hash)||!hash(f.hash)||t.hash!==r.transactionHash||t.hash!==b.transactionHash||t.hash!==e.txid||t.blockHash!==r.blockHash||t.blockHash!==b.hash||b.hash!==e.blockHash||hex(t.chainId)!==1n||hex(t.blockNumber)!==hex(r.blockNumber)||hex(t.blockNumber)!==hex(b.number)||hex(b.number).toString()!==e.blockHeight||hex(f.number)<hex(b.number)||hex(f.number)===hex(b.number)&&f.hash!==b.hash||hex(t.transactionIndex)!==hex(r.transactionIndex)||hex(t.transactionIndex)!==hex(b.transactionIndex)||hex(t.transactionIndex).toString()!==e.txIndex||hex(t.value).toString()!==e.quantityBaseUnits||t.input!=='0x'||!['0x0','0x1','0x2'].includes(t.type)||r.status!=='0x1'||!Array.isArray(r.logs)||r.logs.length||address(t.to)!==destination||t.to!==r.to||address(t.from)!==r.from||t.from===destination||hex(r.gasUsed)!==21000n||hex(r.effectiveGasPrice)<=0n)fail();
 const timestamp=hex(b.timestamp);if(timestamp>253402300799n||new Date(Number(timestamp)*1000).toISOString()!==e.timestamp)fail();
 return hex(r.gasUsed)*hex(r.effectiveGasPrice);
}
export function validateEthereumBridgeProof(model,proof,{requireHistory=false}={}){
 keys(proof,'version group payload positionId walletScopeDigest reference txid destination principalETH exchangeFeeETH networkFeeETH ledgerId ledgerOwnerDigest event chain');
 if(proof.version!==1||![proof.group,proof.payload,proof.walletScopeDigest,proof.ledgerId,proof.ledgerOwnerDigest].every(sha)||!hash(proof.txid)||typeof proof.reference!=='string'||!proof.reference||proof.reference.length>200||/[\u0000-\u001f]/.test(proof.reference)||address(proof.destination)!==proof.destination)fail();
 const p=model.positions.find(p=>p.id===proof.positionId),e=validateHistoryEvent(proof.event);
 if(!native(p)||ethereumBridgeScope(p)!==proof.walletScopeDigest||address(p.wallet.address)!==proof.destination||sourceDigest(address(p.wallet.address))!==proof.ledgerOwnerDigest||model.positions.filter(x=>native(x)&&address(x.wallet.address)===proof.destination).length!==1||e.network!=='ethereum'||e.chainId!=='1'||e.accountId!==p.accountId||e.walletId!==p.accountId||e.assetId!=='ethereum'||e.contract!==null||e.mint!==null||e.decimals!==18||e.txid!==proof.txid||e.type!=='incoming'||e.locator.kind!=='subindex'||e.locator.index!=='0'||e.locator.subindex!=='1'||e.status!=='confirmed'||!['confirmed','finalized'].includes(e.finality)||e.coverage!=='verified'||e.qualityCode!=='receipt-backed'||!e.source||!e.timestamp||!hash(e.blockHash)||e.blockHeight===null||e.txIndex===null||units(proof.principalETH)<=0n||units(proof.principalETH)!==BigInt(e.quantityBaseUnits)||units(proof.exchangeFeeETH)<0n||units(proof.networkFeeETH)!==validateChain(proof.chain,e,proof.destination)||JSON.stringify(e)!==JSON.stringify(proof.event))fail();
 if(model.positions.some(x=>x.wallet?.enabled&&['evm','erc20'].includes(x.wallet.chain)&&Number(x.wallet.chainId)===1&&address(x.wallet.address)===proof.chain.transaction.from))fail();
 const sessions=(model.walletHistory?.sessions||[]).filter(s=>s.walletKey===p.id);
 if(requireHistory&&sessions.length!==1)fail();
 if(sessions.length){
  if(sessions.length!==1||sessions[0].chain!=='eth')fail();const s=validateHistorySession(sessions[0]),matches=s.events.filter(x=>x.txid===e.txid);
  // Whole-history partial is allowed; conflicting/reorged event evidence is not.
  if(s.issues.some(i=>/reorg|conflict|unfinalized|wrong-chain/.test(i))||matches.length!==1||eventFacts(matches[0])!==eventFacts(e))fail();
 }
 if((model.purchaseEvidence?.receipts||[]).some(r=>r.txid===proof.txid))fail();
 return proof;
}
export function prepareKrakenEthereumBridge(model,group,{positionId,reference,txid,destination,ledgerCSV,...raw}){
 if(group?.kind!=='withdrawal-review'||group.issues.length||group.rows.length!==1)fail();const row=group.rows[0],p=model.positions.find(p=>p.id===positionId);destination=address(destination);
 if(row.values.asset!=='ETH'||row.values.refid!==reference||!hash(txid)||!native(p)||address(p.wallet.address)!==destination)fail();
 const sessions=(model.walletHistory?.sessions||[]).filter(s=>s.walletKey===positionId&&s.chain==='eth');if(sessions.length!==1)fail();
 const s=validateHistorySession(sessions[0]),events=s.events.filter(e=>e.txid===txid);if(events.length!==1)fail();const e=events[0],chain=chainProof(raw);
 const fee=validateChain(chain,e,destination),ledger=parseLedgerLiveCSV(ledgerCSV).operations.filter(r=>r.currency==='ETH'&&r.accountIdentity.toLowerCase()===destination&&r.type==='IN'&&r.status==='Confirmed'&&r.txid.toLowerCase()===txid);
 if(ledger.length!==1||ledger[0].issues.length||units(ledger[0].amountExact)!==-units(row.amountExact)||ledger[0].feeExact===null||units(ledger[0].feeExact)!==fee||ledger[0].timestamp!==e.timestamp||Date.parse(e.timestamp)<Date.parse(row.values.time.replace(' ','T')+'Z'))fail();
 return validateEthereumBridgeProof(model,{version:1,group:group.id,payload:group.payloadDigest,positionId,walletScopeDigest:ethereumBridgeScope(p),reference,txid,destination,principalETH:exact(-units(row.amountExact)),exchangeFeeETH:row.feeExact,networkFeeETH:exact(fee),ledgerId:ledger[0].observationId,ledgerOwnerDigest:sourceDigest(destination),event:validateHistoryEvent(e),chain},{requireHistory:true});
}
/** Existing Ethereum RPC, explicit consent/abort owned by the UI. No new provider or key. */
export async function fetchKrakenEthereumTransaction(txid,{fetcher=globalThis.fetch,signal}={}){
 if(!hash(txid))fail();
 const rpc=async(method,params)=>{
  if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
  const r=await fetcher(ETH_RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',signal});
  if(!r.ok)throw Error('Ethereum-Transaktionsbeleg konnte nicht abgerufen werden.');const text=await r.text();if(text.length>2e6)fail();const d=JSON.parse(text);if(d.error||d.result==null)fail();return d.result;
 };
 if(hex(await rpc('eth_chainId',[]))!==1n)fail();
 const transaction=await rpc('eth_getTransactionByHash',[txid]),receipt=await rpc('eth_getTransactionReceipt',[txid]);hex(receipt.blockNumber);
 const block=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false]),finalized=await rpc('eth_getBlockByNumber',['finalized',false]);
 return {transaction,receipt,block,finalized};
}
export function validateKrakenEthereumBridges(model){
 const seen=new Set(),entries=model.journalEntries.flatMap(j=>j.krakenWithdrawal?.originals?.map(o=>({j:o.journal,b:o.booking,removed:true}))||[{j,b:model.bookings.find(b=>b.journalEntryId===j.id),removed:false}]);
 for(const {j,b,removed} of entries){
  if(!j.krakenEthereumBridge)continue;if(j.krakenBitcoinBridge)fail();const p=validateEthereumBridgeProof(model,j.krakenEthereumBridge);
  if(j.id!=='uh03:'+p.group+':0'||j.source!=='kraken-uh03-v1'||j.type!=='deliver_out'||j.status!=='recorded'||!b||!sourceUnmodified({journalEntries:[j]},b)||b.type!=='deliver_out'||b.accountId===p.event.accountId||b.importSource?.fileId!==p.group||units(b.quantityExact)!==units(p.principalETH)||model.externalCashFlows.some(f=>f.id===b.id))fail();
  const source=model.positions.find(x=>x.id===b.positionId);if(!source||source.wallet?.enabled||source.symbol!=='ETH'||source.coinId!=='ethereum')fail();
  let payload;try{payload=JSON.parse(b.importSource.sourcePayload);}catch{fail();}
  if(payload.ethereumBridge!==ethereumBridgeDigest(p)||payload.group!==p.group||j.postings.length!==1||j.postings[0].positionId!==b.positionId||j.postings[0].accountId!==b.accountId||units(j.postings[0].quantityDeltaExact)!==-units(p.principalETH)||units(j.postings[0].amountBookEURExact)!==0n||b.external!==false||seen.has(p.event.id))fail();seen.add(p.event.id);
  const siblings=removed?entries.filter(x=>x.removed&&x.b?.importSource?.fileId===p.group).map(x=>x.b):model.bookings.filter(x=>x.importSource?.sourceId==='kraken-uh03-v1'&&x.importSource.fileId===p.group);
  const fees=siblings.filter(x=>x.id!==b.id);
  if(units(p.exchangeFeeETH)>0n?(fees.length!==1||fees[0].type!=='fee'||fees[0].positionId!==b.positionId||units(fees[0].quantityExact)!==units(p.exchangeFeeETH)||!sourceUnmodified({journalEntries:entries.map(x=>x.j)},fees[0])):fees.length!==0)fail();
 }
 for(const {j,b} of entries.filter(x=>x.b?.importSource?.sourceId==='kraken-uh03-v1')){let payload;try{payload=JSON.parse(b.importSource.sourcePayload);}catch{continue;}if(payload.ethereumBridge&&!entries.some(x=>x.j.id==='uh03:'+payload.group+':0'&&x.j.krakenEthereumBridge&&ethereumBridgeDigest(x.j.krakenEthereumBridge)===payload.ethereumBridge))fail();}
}
