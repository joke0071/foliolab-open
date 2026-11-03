/** One source-bound BTC withdrawal -> one verified own output. No quantity replay. */
import {sourceDigest,sourceUnmodified} from './import-identity.js';
import {parseLedgerLiveCSV} from './ledger-live.js';
import {validateHistoryEvent} from './wallet-history-core.js';
import {validateHistorySession,bitcoinHistoryScope} from './wallet-history-state.js';
import {units,exact} from './decimal.js';
const digest=v=>sourceDigest(JSON.stringify(v));
const fail=()=>{throw Error('Bitcoin-Gegenbeleg unvollständig, widersprüchlich oder nicht mehr eindeutig.');};
const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const sat=v=>{if(!Number.isSafeInteger(v)||v<0)fail();return BigInt(v);};
const coin=n=>exact(n*10n**10n);
const eventFacts=e=>digest([e.id,e.network,e.chainId,e.accountId,e.assetId,e.contract,e.mint,e.decimals,e.txid,e.locator,e.blockHeight,e.blockHash,e.timestamp,e.quantityBaseUnits,e.type,e.status,e.finality,e.coverage]);
const fields='version group payload positionId walletScopeDigest reference txid destination principalBTC exchangeFeeBTC transactionFeeBTC ledgerId ledgerOwnerDigest event'.split(' ');
export const bitcoinBridgeDigest=proof=>digest(proof);
export function krakenBridgeFor(model,group){
 const live=model.journalEntries.find(j=>j.id==='uh03:'+group+':0')?.krakenBitcoinBridge;
 const removed=model.journalEntries.find(j=>j.id==='uh03:'+group+':undo')?.krakenWithdrawal?.originals?.[0]?.journal?.krakenBitcoinBridge;
 return live??removed??null;
}
/** Static restore contract: optional history may be absent; retained exact proof may not. */
export function validateBitcoinBridgeProof(model,proof,{requireHistory=false}={}){
 if(!proof||Object.keys(proof).sort().join()!==[...fields].sort().join()||proof.version!==1||!hash(proof.group)||!hash(proof.payload)||!hash(proof.walletScopeDigest)||!hash(proof.txid)||!hash(proof.ledgerId)||!hash(proof.ledgerOwnerDigest)||typeof proof.reference!=='string'||!proof.reference||proof.reference.length>200||/[\u0000-\u001f]/.test(proof.reference)||typeof proof.destination!=='string'||!/^bc1[ac-hj-np-z02-9]{11,87}$/.test(proof.destination))fail();
 const p=model.positions.find(p=>p.id===proof.positionId),e=validateHistoryEvent(proof.event);
 if(!p?.wallet?.enabled||!['btc','btc-hd'].includes(p.wallet.chain)||p.kind!=='crypto'||p.coinId!=='bitcoin'||p.symbol!=='BTC'||bitcoinHistoryScope(p.wallet)!==proof.walletScopeDigest||sourceDigest(p.wallet.address)!==proof.ledgerOwnerDigest||e.network!=='bitcoin'||e.chainId!=='mainnet'||e.accountId!==p.accountId||e.assetId!=='bitcoin'||e.contract!==null||e.mint!==null||e.decimals!==8||e.txid!==proof.txid||e.type!=='incoming'||e.locator.kind!=='vout'||e.status!=='confirmed'||e.finality!=='confirmed'||e.coverage!=='verified'||!hash(e.blockHash)||!e.timestamp||units(proof.principalBTC)<=0n||units(proof.principalBTC)!==BigInt(e.quantityBaseUnits)*10n**10n||units(proof.exchangeFeeBTC)<0n||units(proof.exchangeFeeBTC)%10n**10n!==0n||units(proof.transactionFeeBTC)<0n||units(proof.transactionFeeBTC)%10n**10n!==0n)fail();
 // Receipt and event must be preserved canonically; event identity includes the output index.
 if(JSON.stringify(e)!==JSON.stringify(proof.event))fail();
 const sessions=(model.walletHistory?.sessions||[]).filter(s=>s.walletKey===p.id);
 if(requireHistory&&sessions.length!==1)fail();
 if(sessions.length){
  if(sessions.length!==1||sessions[0].walletScopeDigest!==proof.walletScopeDigest)fail();
  const match=sessions[0].events.filter(x=>x.id===e.id);
  if(match.length!==1||eventFacts(validateHistoryEvent(match[0]))!==eventFacts(e))fail();
 }
 if((model.purchaseEvidence?.receipts||[]).some(r=>r.txid===proof.txid))throw Error('Weitere Kaufbelege für denselben Bitcoin-Eingang zuerst fachlich abgleichen.');
 return proof;
}
/** Checked at user-requested lookup, never infer a hash from amount/time or exchange IDs. */
export function prepareKrakenBitcoinBridge(model,group,{positionId,reference,txid,destination,ledgerCSV,transaction}){
 if(group?.kind!=='withdrawal-review'||group.issues.length||group.rows.length!==1)fail();
 const row=group.rows[0],p=model.positions.find(p=>p.id===positionId);
 if(row.values.asset!=='BTC'||row.values.refid!==reference||!hash(txid)||!p?.wallet?.enabled||!['btc','btc-hd'].includes(p.wallet.chain)||p.coinId!=='bitcoin'||p.symbol!=='BTC'||model.positions.filter(p=>p.wallet?.enabled&&['btc','btc-hd'].includes(p.wallet.chain)).length!==1)fail();
 const sessions=(model.walletHistory?.sessions||[]).filter(s=>s.walletKey===positionId&&s.chain==='btc');
 if(sessions.length!==1)fail();const session=validateHistorySession(sessions[0]);
 if(session.walletScopeDigest!==bitcoinHistoryScope(p.wallet)||session.issues.length||session.streams.length!==1||session.streams[0].accountId!==p.accountId||session.streams[0].coverage.status!=='verified')fail();
 const tx=transaction;
 if(tx?.txid!==txid||tx.status?.confirmed!==true||!Array.isArray(tx.vin)||!tx.vin.length||tx.vin.length>10000||!Array.isArray(tx.vout)||!tx.vout.length||tx.vout.length>10000||tx.vin.some(v=>v.is_coinbase||!v.prevout))fail();
 const input=tx.vin.reduce((n,v)=>n+sat(v.prevout.value),0n),output=tx.vout.reduce((n,v)=>n+sat(v.value),0n),fee=sat(tx.fee);
 if(input-output!==fee)fail();
 const outputs=tx.vout.map((v,index)=>({...v,index})).filter(v=>v.scriptpubkey_address===destination);
 if(outputs.length!==1)fail();const out=outputs[0];
 const events=session.events.filter(e=>e.txid===txid&&e.type==='incoming'&&e.locator.kind==='vout');
 // One bounded event; other own outputs must be accounted for in a later N:M contract.
 if(events.length!==1)fail();const e=events[0];
 if(String(out.index)!==e.locator.index||String(out.value)!==e.quantityBaseUnits||e.blockHash!==tx.status.block_hash||e.blockHeight!==String(tx.status.block_height)||e.timestamp!==new Date(tx.status.block_time*1000).toISOString()||Date.parse(e.timestamp)<Date.parse(row.values.time.replace(' ','T')+'Z'))fail();
 const ledger=parseLedgerLiveCSV(ledgerCSV).operations.filter(r=>r.currency==='BTC'&&r.accountIdentity===p.wallet.address&&r.type==='IN'&&r.status==='Confirmed'&&r.txid.toLowerCase()===txid);
 if(ledger.length!==1||ledger[0].issues.length||units(ledger[0].amountExact)!==-units(row.amountExact)||ledger[0].timestamp!==e.timestamp||units(ledger[0].feeExact)!==fee*10n**10n||-units(row.amountExact)!==sat(out.value)*10n**10n)fail();
 return validateBitcoinBridgeProof(model,{version:1,group:group.id,payload:group.payloadDigest,positionId,walletScopeDigest:session.walletScopeDigest,reference,txid,destination,principalBTC:exact(-units(row.amountExact)),exchangeFeeBTC:row.feeExact,transactionFeeBTC:coin(fee),ledgerId:ledger[0].observationId,ledgerOwnerDigest:sourceDigest(ledger[0].accountIdentity),event:validateHistoryEvent(e)});
}
/** Explicit public lookup; caller owns cancellation, consent and subsequent CAS. */
export async function fetchKrakenBitcoinTransaction(txid,{fetcher=globalThis.fetch,signal}={}){
 if(!hash(txid))fail();
 const response=await fetcher('https://blockstream.info/api/tx/'+txid,{method:'GET',cache:'no-store',redirect:'error',signal});
 if(!response.ok)throw Error('Bitcoin-Transaktionsbeleg konnte nicht abgerufen werden.');
 const text=await response.text();if(text.length>2e6)fail();return JSON.parse(text);
}
export function validateKrakenBitcoinBridges(model){
 const seen=new Set();
 const entries=model.journalEntries.flatMap(j=>j.krakenWithdrawal?.originals?.map(o=>({j:o.journal,b:o.booking,removed:true}))||[{j,b:model.bookings.find(b=>b.journalEntryId===j.id),removed:false}]);
 for(const {j,b,removed} of entries){
  if(!j.krakenBitcoinBridge)continue;const p=validateBitcoinBridgeProof(model,j.krakenBitcoinBridge);
  if(j.id!=='uh03:'+p.group+':0'||j.source!=='kraken-uh03-v1'||j.type!=='deliver_out'||j.status!=='recorded'||!b||!sourceUnmodified({journalEntries:[j]},b)||b.type!=='deliver_out'||b.accountId===p.event.accountId||b.importSource?.fileId!==p.group||units(b.quantityExact)!==units(p.principalBTC)||model.externalCashFlows.some(f=>f.id===b.id))fail();
  const source=model.positions.find(x=>x.id===b.positionId);if(!source||source.wallet?.enabled||source.symbol!=='BTC'||source.coinId!=='bitcoin')fail();
  let payload;try{payload=JSON.parse(b.importSource.sourcePayload);}catch{fail();}
  if(payload.bitcoinBridge!==bitcoinBridgeDigest(p)||payload.group!==p.group||j.postings.length!==1||j.postings[0].positionId!==b.positionId||j.postings[0].accountId!==b.accountId||units(j.postings[0].quantityDeltaExact)!==-units(p.principalBTC)||units(j.postings[0].amountBookEURExact)!==0n||b.external!==false)fail();
  const id=p.event.id;if(seen.has(id))fail();seen.add(id);
  if(!removed){
   const fee=model.bookings.filter(x=>x.importSource?.sourceId==='kraken-uh03-v1'&&x.importSource.fileId===p.group&&x.id!==b.id);
   if(units(p.exchangeFeeBTC)>0n?(fee.length!==1||fee[0].type!=='fee'||fee[0].positionId!==b.positionId||units(fee[0].quantityExact)!==units(p.exchangeFeeBTC)||!sourceUnmodified(model,fee[0])):fee.length!==0)fail();
  }
 }
 // Losing the retained journal proof must not silently downgrade an internal source binding.
 for(const b of model.bookings.filter(b=>b.importSource?.sourceId==='kraken-uh03-v1')){
  let payload;try{payload=JSON.parse(b.importSource.sourcePayload);}catch{continue;}
  if(payload.bitcoinBridge&&!model.journalEntries.some(j=>j.id==='uh03:'+payload.group+':0'&&bitcoinBridgeDigest(j.krakenBitcoinBridge)===payload.bitcoinBridge))fail();
 }
}
