/** One direct native SOL source withdrawal -> one finalized own incoming event.
 * The retained proof is portable without optional history. It never certifies history coverage.
 */
import {sourceDigest,sourceUnmodified} from './import-identity.js';
import {parseLedgerLiveCSV} from './ledger-live.js';
import {validateHistoryEvent} from './wallet-history-core.js';
import {validateHistorySession} from './wallet-history-state.js';
import {solanaRpcRead,DEFAULT_SOL_RPC} from './solana-rpc.js';
import {SOL_MAINNET_GENESIS} from './solana-history.js';
import {units,exact} from './decimal.js';
const digest=v=>sourceDigest(JSON.stringify(v));
const fail=()=>{throw Error('Solana-Gegenbeleg unvollständig, widersprüchlich oder nicht mehr eindeutig.');};
const hash=v=>typeof v==='string'&&/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(v);
const sha=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const decode=(v,length)=>{if(typeof v!=='string'||!v||v.length>100)fail();let n=0n;for(const c of v){const i=alphabet.indexOf(c);if(i<0)fail();n=n*58n+BigInt(i);}const bytes=[];while(n){bytes.unshift(Number(n&255n));n>>=8n;}for(const c of v){if(c!=='1')break;bytes.unshift(0);}if(length!==undefined&&bytes.length!==length)fail();return bytes;};
const address=v=>{decode(v,32);return v;};
const integer=v=>{if(!Number.isSafeInteger(v)||v<0)fail();return BigInt(v);};
const lamports=v=>{const n=units(v);if(n%1000000000n)fail();return n/1000000000n;};
const keys=(v,s)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join()!==s.split(' ').sort().join())fail();};
const native=p=>p?.kind==='crypto'&&p.coinId==='solana'&&p.symbol==='SOL'&&p.wallet?.enabled&&p.wallet.chain==='sol'&&!p.wallet.contract&&!p.wallet.mint;
/** Separate SOL bridge scope; do not extend the BTC-only history-session field. */
export function solanaBridgeScope(p){if(!native(p))fail();return digest([p.id,p.accountId,p.kind,p.coinId,p.symbol,p.wallet.chain,'mainnet-beta',address(p.wallet.address)]);}
export const solanaBridgeDigest=proof=>digest(proof);
export const hasKrakenSolanaState=m=>(m?.journalEntries||[]).some(j=>j.krakenSolanaBridge||j.krakenWithdrawal?.originals?.some(o=>o.journal?.krakenSolanaBridge));
export function krakenSolanaBridgeFor(model,group){return model.journalEntries.find(j=>j.id==='uh03:'+group+':0')?.krakenSolanaBridge??model.journalEntries.find(j=>j.id==='uh03:'+group+':undo')?.krakenWithdrawal?.originals?.[0]?.journal?.krakenSolanaBridge??null;}
const eventFacts=e=>digest([e.id,e.network,e.chainId,e.accountId,e.assetId,e.contract,e.mint,e.decimals,e.txid,e.locator,e.blockHeight,e.blockHash,e.txIndex,e.timestamp,e.quantityBaseUnits,e.type,e.status,e.finality,e.coverage,e.qualityCode]);
/** Legacy System transfer only. The accountdelta locator is distinct from the instruction index. */
const SYSTEM='11111111111111111111111111111111',COMPUTE='ComputeBudget111111111111111111111111111111';
function chainProof({transaction:t,block:b,genesis,finalizedSlot},txid){
 if(!t||!b||t.transactionIndex!==undefined&&t.transactionIndex!==b.signatures?.indexOf(txid)||!Array.isArray(b.signatures)||b.signatures.length>10000||b.signatures.filter(x=>x===txid).length!==1)fail();
 const m=t.transaction?.message,meta=t.meta;if(!m||!meta)fail();const transaction={version:t.version,slot:t.slot,blockTime:t.blockTime,transaction:{signatures:t.transaction.signatures,message:{header:m.header,accountKeys:m.accountKeys,recentBlockhash:m.recentBlockhash,instructions:m.instructions?.map(v=>{if(v.stackHeight!=null&&v.stackHeight!==1)fail();return {programIdIndex:v.programIdIndex,accounts:v.accounts,data:v.data};})}},meta:{err:meta.err,fee:meta.fee,preBalances:meta.preBalances,postBalances:meta.postBalances,innerInstructions:meta.innerInstructions??[],preTokenBalances:meta.preTokenBalances??[],postTokenBalances:meta.postTokenBalances??[],rewards:meta.rewards??[],loadedAddresses:meta.loadedAddresses??{writable:[],readonly:[]}}};
 return {genesis,transaction:structuredClone(transaction),block:{blockhash:b.blockhash,blockTime:b.blockTime,signature:txid,txIndex:b.signatures.indexOf(txid)},finalizedSlot};
}
function validateChain(c,e,destination){
 keys(c,'genesis transaction block finalizedSlot');const {transaction:t,block:b}=c;
 keys(b,'blockhash blockTime signature txIndex');if(JSON.stringify(t).length>30000)fail();
 if(c.genesis!==SOL_MAINNET_GENESIS||!t||t.version!=='legacy'||!t.transaction||!t.meta||t.meta.err!==null||!Array.isArray(t.transaction.signatures)||t.transaction.signatures.length!==1||t.transaction.signatures[0]!==e.txid||b.signature!==e.txid)fail();decode(e.txid,64);
 keys(t,'version slot blockTime transaction meta');keys(t.transaction,'signatures message');keys(t.meta,'err fee preBalances postBalances innerInstructions preTokenBalances postTokenBalances rewards loadedAddresses');
 const m=t.transaction.message,meta=t.meta,k=m?.accountKeys,h=m?.header,ins=m?.instructions;keys(m,'header accountKeys recentBlockhash instructions');keys(h,'numRequiredSignatures numReadonlySignedAccounts numReadonlyUnsignedAccounts');keys(meta.loadedAddresses,'writable readonly');if(!Array.isArray(meta.loadedAddresses.writable)||!Array.isArray(meta.loadedAddresses.readonly))fail();
 if(!Array.isArray(k)||k.length<3||k.length>4||new Set(k).size!==k.length||!h||h.numRequiredSignatures!==1||h.numReadonlySignedAccounts!==0||h.numReadonlyUnsignedAccounts!==k.length-2||!Array.isArray(ins)||ins.length<1||ins.length>3||meta.loadedAddresses&&(meta.loadedAddresses.writable?.length||meta.loadedAddresses.readonly?.length)||!Array.isArray(meta.preBalances)||!Array.isArray(meta.postBalances)||meta.preBalances.length!==k.length||meta.postBalances.length!==k.length||[meta.innerInstructions,meta.preTokenBalances,meta.postTokenBalances,meta.rewards].some(x=>x!==undefined&&(!Array.isArray(x)||x.length)))fail();
 k.forEach(address);address(m.recentBlockhash);address(b.blockhash);if(k[1]!==destination||k[0]===destination||!k.slice(2).includes(SYSTEM)||k.slice(2).some(x=>![SYSTEM,COMPUTE].includes(x)))fail();
 let transfer=null,index=null;const compute=new Set();
 for(const [i,v] of ins.entries()){
  keys(v,'programIdIndex accounts data');if(!Number.isInteger(v.programIdIndex)||v.programIdIndex<2||v.programIdIndex>=k.length||!Array.isArray(v.accounts))fail();const data=decode(v.data);
  if(k[v.programIdIndex]===COMPUTE){if(v.accounts.length||!([2,3].includes(data[0]))||data.length!==(data[0]===2?5:9)||compute.has(data[0]))fail();compute.add(data[0]);continue;}
  if(index!==null||v.accounts.length!==2||v.accounts[0]!==0||v.accounts[1]!==1||data.length!==12||data.slice(0,4).join(',')!=='2,0,0,0')fail();
  transfer=data.slice(4).reduceRight((n,v)=>n*256n+BigInt(v),0n);index=i;
 }
 const fee=integer(meta.fee),pre=meta.preBalances.map(integer),post=meta.postBalances.map(integer);
 if(!transfer||fee<=0n||post[1]-pre[1]!==transfer||pre[0]-post[0]!==transfer+fee||pre.slice(2).some((v,i)=>post[i+2]!==v)||transfer.toString()!==e.quantityBaseUnits||e.locator.kind!=='subindex'||e.locator.index!=='1'||e.locator.subindex!=='0'||integer(t.slot).toString()!==e.blockHeight||integer(c.finalizedSlot)<integer(t.slot)||integer(b.txIndex).toString()!==e.txIndex||b.blockhash!==e.blockHash||integer(t.blockTime)!==integer(b.blockTime)||new Date(Number(integer(t.blockTime))*1000).toISOString()!==e.timestamp)fail();
 return {fee,instructionIndex:index,sender:k[0]};
}
export function validateSolanaBridgeProof(model,proof,{requireHistory=false}={}){
 keys(proof,'version group payload positionId walletScopeDigest reference txid destination principalSOL exchangeFeeSOL networkFeeSOL ledgerId ledgerOwnerDigest event instructionIndex chain');
 if(proof.version!==1||![proof.group,proof.payload,proof.walletScopeDigest,proof.ledgerId,proof.ledgerOwnerDigest].every(sha)||!hash(proof.txid)||typeof proof.reference!=='string'||!proof.reference||proof.reference.length>200||/[\u0000-\u001f]/.test(proof.reference)||address(proof.destination)!==proof.destination)fail();
 const p=model.positions.find(p=>p.id===proof.positionId),e=validateHistoryEvent(proof.event);
 if(!native(p)||solanaBridgeScope(p)!==proof.walletScopeDigest||address(p.wallet.address)!==proof.destination||sourceDigest(address(p.wallet.address))!==proof.ledgerOwnerDigest||model.positions.filter(x=>native(x)&&address(x.wallet.address)===proof.destination).length!==1||e.network!=='solana'||e.chainId!=='mainnet-beta'||e.accountId!==p.accountId||e.walletId!==p.accountId||e.assetId!=='solana'||e.contract!==null||e.mint!==null||e.decimals!==9||e.txid!==proof.txid||e.type!=='incoming'||e.locator.kind!=='subindex'||e.locator.index!=='1'||e.locator.subindex!=='0'||e.status!=='confirmed'||e.finality!=='finalized'||e.coverage!=='verified'||e.qualityCode!=='solana-pre-post'||!e.source||!e.timestamp||!e.blockHash||e.blockHeight===null||e.txIndex===null||units(proof.principalSOL)<=0n||lamports(proof.principalSOL)!==BigInt(e.quantityBaseUnits)||units(proof.exchangeFeeSOL)<0n||lamports(proof.networkFeeSOL)!==validateChain(proof.chain,e,proof.destination).fee||proof.instructionIndex!==validateChain(proof.chain,e,proof.destination).instructionIndex||JSON.stringify(e)!==JSON.stringify(proof.event))fail();
 if(model.positions.some(x=>x.wallet?.enabled&&['sol','spl'].includes(x.wallet.chain)&&address(x.wallet.address)===validateChain(proof.chain,e,proof.destination).sender))fail();
 const sessions=(model.walletHistory?.sessions||[]).filter(s=>s.walletKey===p.id);
 if(requireHistory&&sessions.length!==1)fail();
 if(sessions.length){
  if(sessions.length!==1||sessions[0].chain!=='sol')fail();const s=validateHistorySession(sessions[0]),matches=s.events.filter(x=>x.txid===e.txid);
  // Whole-history partial is allowed; conflicting/reorged event evidence is not.
  if(s.issues.some(i=>/reorg|conflict|unfinalized|wrong-chain/.test(i))||matches.length!==1||eventFacts(matches[0])!==eventFacts(e))fail();
 }
 if((model.purchaseEvidence?.receipts||[]).some(r=>r.txid===proof.txid))fail();
 return proof;
}
export function prepareKrakenSolanaBridge(model,group,{positionId,reference,txid,destination,ledgerCSV,...raw}){
 if(group?.kind!=='withdrawal-review'||group.issues.length||group.rows.length!==1)fail();const row=group.rows[0],p=model.positions.find(p=>p.id===positionId);destination=address(destination);
 if(row.values.asset!=='SOL'||row.values.refid!==reference||!hash(txid)||!native(p)||address(p.wallet.address)!==destination)fail();
 const sessions=(model.walletHistory?.sessions||[]).filter(s=>s.walletKey===positionId&&s.chain==='sol');if(sessions.length!==1)fail();
 const s=validateHistorySession(sessions[0]),events=s.events.filter(e=>e.txid===txid);if(events.length!==1)fail();const e=events[0],chain=chainProof(raw,txid);
 const {fee,instructionIndex}=validateChain(chain,e,destination),ledger=parseLedgerLiveCSV(ledgerCSV).operations.filter(r=>r.currency==='SOL'&&r.accountIdentity===destination&&r.type==='IN'&&r.status==='Confirmed'&&r.txid===txid);
 if(ledger.length!==1||ledger[0].issues.length||units(ledger[0].amountExact)!==-units(row.amountExact)||ledger[0].feeExact===null||lamports(ledger[0].feeExact)!==fee||ledger[0].timestamp!==e.timestamp||Date.parse(e.timestamp)<Date.parse(row.values.time.replace(' ','T')+'Z'))fail();
 return validateSolanaBridgeProof(model,{version:1,group:group.id,payload:group.payloadDigest,positionId,walletScopeDigest:solanaBridgeScope(p),reference,txid,destination,principalSOL:exact(-units(row.amountExact)),exchangeFeeSOL:row.feeExact,networkFeeSOL:exact(fee*1000000000n),ledgerId:ledger[0].observationId,ledgerOwnerDigest:sourceDigest(destination),event:validateHistoryEvent(e),instructionIndex,chain},{requireHistory:true});
}
/** Use exactly the configured archive endpoint; retain existing history consent/timeout/abort rules. */
export async function fetchKrakenSolanaTransaction(txid,{configured=DEFAULT_SOL_RPC,fetcher=globalThis.fetch,signal}={}){
 decode(txid,64);const read=async(method,params)=>(await solanaRpcRead(configured,method,params,fetcher,{history:true,signal,retries:0})).result;
 const genesis=await read('getGenesisHash',[]);if(genesis!==SOL_MAINNET_GENESIS)fail();
 const transaction=await read('getTransaction',[txid,{encoding:'json',commitment:'finalized',maxSupportedTransactionVersion:0}]);
 if(!transaction)fail();integer(transaction.slot);
 const block=await read('getBlock',[transaction.slot,{commitment:'finalized',transactionDetails:'signatures',maxSupportedTransactionVersion:0}]),finalizedSlot=await read('getSlot',[{commitment:'finalized'}]);
 return {genesis,transaction,block,finalizedSlot};
}
export function validateKrakenSolanaBridges(model){
 const seen=new Set(),entries=model.journalEntries.flatMap(j=>j.krakenWithdrawal?.originals?.map(o=>({j:o.journal,b:o.booking,removed:true}))||[{j,b:model.bookings.find(b=>b.journalEntryId===j.id),removed:false}]);
 for(const {j,b,removed} of entries){
  if(!j.krakenSolanaBridge)continue;if(j.krakenBitcoinBridge||j.krakenEthereumBridge)fail();const p=validateSolanaBridgeProof(model,j.krakenSolanaBridge);
  if(j.id!=='uh03:'+p.group+':0'||j.source!=='kraken-uh03-v1'||j.type!=='deliver_out'||j.status!=='recorded'||!b||!sourceUnmodified({journalEntries:[j]},b)||b.type!=='deliver_out'||b.accountId===p.event.accountId||b.importSource?.fileId!==p.group||units(b.quantityExact)!==units(p.principalSOL)||model.externalCashFlows.some(f=>f.id===b.id))fail();
  const source=model.positions.find(x=>x.id===b.positionId);if(!source||source.wallet?.enabled||source.symbol!=='SOL'||source.coinId!=='solana')fail();
  let payload;try{payload=JSON.parse(b.importSource.sourcePayload);}catch{fail();}
  if(payload.solanaBridge!==solanaBridgeDigest(p)||payload.group!==p.group||j.postings.length!==1||j.postings[0].positionId!==b.positionId||j.postings[0].accountId!==b.accountId||units(j.postings[0].quantityDeltaExact)!==-units(p.principalSOL)||units(j.postings[0].amountBookEURExact)!==0n||b.external!==false||seen.has(p.event.id))fail();seen.add(p.event.id);
  const siblings=removed?entries.filter(x=>x.removed&&x.b?.importSource?.fileId===p.group).map(x=>x.b):model.bookings.filter(x=>x.importSource?.sourceId==='kraken-uh03-v1'&&x.importSource.fileId===p.group);
  const fees=siblings.filter(x=>x.id!==b.id);
  if(units(p.exchangeFeeSOL)>0n?(fees.length!==1||fees[0].type!=='fee'||fees[0].positionId!==b.positionId||units(fees[0].quantityExact)!==units(p.exchangeFeeSOL)||!sourceUnmodified({journalEntries:entries.map(x=>x.j)},fees[0])):fees.length!==0)fail();
 }
 for(const {j,b} of entries.filter(x=>x.b?.importSource?.sourceId==='kraken-uh03-v1')){let payload;try{payload=JSON.parse(b.importSource.sourcePayload);}catch{continue;}if(payload.solanaBridge&&!entries.some(x=>x.j.id==='uh03:'+payload.group+':0'&&x.j.krakenSolanaBridge&&solanaBridgeDigest(x.j.krakenSolanaBridge)===payload.solanaBridge))fail();}
}
