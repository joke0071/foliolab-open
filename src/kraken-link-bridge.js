/** One bounded LINK withdrawal. Shares the existing UH03 commit/rollback, never native ETH evidence. */
import {sourceDigest} from './import-identity.js';
import {parseLedgerLiveCSV} from './ledger-live.js';
import {validateHistoryEvent} from './wallet-history-core.js';
import {validateHistorySession} from './wallet-history-state.js';
import {parseLinkEvidence,validateLinkExecution,linkWallet,linkWalletScope,linkHistoryEvent} from './link-explorer-evidence.js';
import {units,exact} from './decimal.js';
const fail=()=>{throw Error('LINK-Gegenbeleg passt nicht zur aktuellen Wallet, Historie oder Kraken-Gruppe.');};
const digest=v=>sourceDigest(JSON.stringify(v));
const facts=e=>digest([e.id,e.network,e.chainId,e.accountId,e.walletId,e.assetId,e.contract,e.mint,e.decimals,e.txid,e.locator,e.blockHeight,e.blockHash,e.txIndex,e.timestamp,e.quantityBaseUnits,e.type,e.status]);
export function validateLinkBridgeProof(model,p,{requireHistory=false}={}){
 if(!p||Object.keys(p).sort().join()!=='kind version group payload positionId walletScopeDigest reference txid destination principalLINK exchangeFeeLINK networkFeeETH ledgerId ledgerOwnerDigest event chain'.split(' ').sort().join()||p.kind!=='link-explorer-beacon'||p.version!==1||![p.group,p.payload,p.walletScopeDigest,p.ledgerId,p.ledgerOwnerDigest].every(x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x))||typeof p.reference!=='string'||!p.reference||p.reference.length>200||/[\u0000-\u001f]/.test(p.reference))fail();
 const position=model.positions.find(x=>x.id===p.positionId),v=validateLinkExecution(p.chain),e=validateHistoryEvent(p.event);
 if(!linkWallet(position)||linkWalletScope(position)!==p.walletScopeDigest||position.wallet.address.toLowerCase()!==p.destination||p.destination!==v.destination||p.txid!==v.txid||p.ledgerOwnerDigest!==sourceDigest(p.destination)||model.positions.filter(x=>linkWallet(x)&&x.wallet.address.toLowerCase()===p.destination).length!==1||model.positions.some(x=>x.wallet?.enabled&&['evm','erc20'].includes(x.wallet.chain)&&Number(x.wallet.chainId)===1&&x.wallet.address?.toLowerCase()===v.from)||facts(e)!==facts(linkHistoryEvent(position,v,{observedAt:e.observedAt}))||e.coverage!=='verified'||!['confirmed','finalized'].includes(e.finality)||!['receipt-backed','explorer-execution-beacon-finality'].includes(e.qualityCode)||!e.source||JSON.stringify(e)!==JSON.stringify(p.event)||units(p.principalLINK)!==BigInt(v.quantityRaw)||units(p.exchangeFeeLINK)<0n||units(p.networkFeeETH)!==BigInt(v.feeWei))fail();
 const sessions=(model.walletHistory?.sessions||[]).filter(s=>s.walletKey===p.positionId);if(requireHistory&&sessions.length!==1)fail();
 if(sessions.length){if(sessions.length!==1||sessions[0].chain!=='eth')fail();const s=validateHistorySession(sessions[0]);const events=s.events.filter(x=>x.txid===p.txid&&x.contract===v.contract);if(s.issues.some(i=>/reorg|conflict|unfinalized|wrong-chain/.test(i))||events.length!==1||facts(events[0])!==facts(e)||events[0].coverage!=='verified')fail();}
 if((model.purchaseEvidence?.receipts||[]).some(r=>r.txid===p.txid))fail();return p;
}
export function prepareKrakenLinkBridge(model,group,{positionId,reference,txid,destination,ledgerCSV,evidenceJSON}){
 if(group?.kind!=='withdrawal-review'||group.rows.length!==1||group.issues.length)fail();const row=group.rows[0],position=model.positions.find(x=>x.id===positionId),v=parseLinkEvidence(evidenceJSON);
 if(row.values.asset!=='LINK'||row.values.refid!==reference||txid!==v.txid||destination.toLowerCase()!==v.destination||!linkWallet(position))fail();
 const sessions=(model.walletHistory?.sessions||[]).filter(s=>s.walletKey===positionId&&s.chain==='eth');if(sessions.length!==1)fail();const events=validateHistorySession(sessions[0]).events.filter(e=>e.txid===txid&&e.contract===v.contract);if(events.length!==1)fail();
 const ledger=parseLedgerLiveCSV(ledgerCSV).operations.filter(o=>o.currency==='LINK'&&o.type==='IN'&&o.status==='Confirmed'&&o.accountIdentity.toLowerCase()===v.destination&&o.txid.toLowerCase()===txid);
 if(ledger.length!==1||ledger[0].issues.length||units(ledger[0].amountExact)!==BigInt(v.quantityRaw)||ledger[0].feeExact!==null&&units(ledger[0].feeExact)!==0n||ledger[0].timestamp!==v.timestamp||Date.parse(v.timestamp)<Date.parse(row.values.time.replace(' ','T')+'Z')||-units(row.amountExact)!==BigInt(v.quantityRaw))fail();
 return validateLinkBridgeProof(model,{kind:'link-explorer-beacon',version:1,group:group.id,payload:group.payloadDigest,positionId,walletScopeDigest:linkWalletScope(position),reference,txid,destination:v.destination,principalLINK:exact(BigInt(v.quantityRaw)),exchangeFeeLINK:row.feeExact,networkFeeETH:exact(BigInt(v.feeWei)),ledgerId:ledger[0].observationId,ledgerOwnerDigest:sourceDigest(v.destination),event:events[0],chain:v},{requireHistory:true});
}
