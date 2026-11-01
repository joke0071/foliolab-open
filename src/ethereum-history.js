/** Ethereum mainnet only. Public read-only facts, no portfolio/storage changes. */
import {PUBLIC_EVM_NETWORKS,walletBalanceExact} from './market.js';
import {ETH_RPC,ETH_LST_CONTRACTS} from './ethereum-fallback.js';
import {validateAddress} from './blockchain-adapters.js';
import {validateHistoryEvent,dedupeHistoryEvents,replayWalletHistory,reconcileWalletHistory} from './wallet-history-core.js';
const TRANSFER='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const addr=v=>validateAddress('1',v).toLowerCase();
const hash=v=>{if(typeof v!=='string'||!/^0x[0-9a-f]{64}$/i.test(v))throw Error('invalid-hash');return v.toLowerCase();};
const raw=v=>{if(typeof v!=='string'||!/^(0|[1-9]\d{0,99})$/.test(v))throw Error('invalid-raw');return BigInt(v);};
const hex=v=>{if(typeof v!=='string'||!/^0x[0-9a-f]{1,64}$/i.test(v))throw Error('invalid-hex');return BigInt(v);};
const index=v=>{if(!Number.isSafeInteger(v)||v<0)throw Error('invalid-index');return String(v);};
const identity=(accountId,token)=>({network:'ethereum',chainId:'1',accountId,assetId:token?token.contract:'ethereum',contract:token?.contract??null,mint:null,decimals:token?.decimals??18});
const time=v=>{if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?Z$/.test(v))throw Error('invalid-time');return new Date(v).toISOString();};
const abort=s=>{if(s?.aborted){const e=Error('aborted');e.name='AbortError';throw e;}};
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
const cursorFields=Object.freeze({
 transactions:['block_number','index','items_count','fee','value','inserted_at','hash'],
 'token-transfers':['block_number','index','items_count','log_index','batch_log_index','batch_block_hash','batch_transaction_hash','index_in_batch'],
 'internal-transactions':['block_number','index','items_count','transaction_index']
});
/** Exact endpoint cursor values, never an arbitrary query map or URL. */
export function validateEthereumCursor(cursor,kind){
 if(cursor===null)return null;
 const allowed=cursorFields[kind],numeric=v=>Number.isSafeInteger(v)&&v>=0||typeof v==='string'&&/^\d{1,100}$/.test(v);
 if(!allowed||!cursor||typeof cursor!=='object'||Array.isArray(cursor)||!Object.keys(cursor).length||Object.keys(cursor).length>12)throw Error('provider-cursor-format-changed');
 for(const [key,value]of Object.entries(cursor)){
  if(!allowed.includes(key))throw Error('provider-cursor-format-changed');
  const nullable=kind==='transactions'&&['fee','value','block_number','index'].includes(key)||kind==='token-transfers'&&key.startsWith('batch_')||key==='index_in_batch';
  if(value===null&&nullable)continue;
  let valid;
  if(key==='hash'||key.endsWith('_hash'))valid=typeof value==='string'&&/^0x[0-9a-f]{64}$/i.test(value);
  else if(key==='inserted_at')valid=typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?Z$/.test(value)&&Number.isFinite(Date.parse(value));
  else if(['fee','value'].includes(key))valid=numeric(value)||typeof value==='string'&&/^\d{1,80}\.\d{1,18}$/.test(value);
  else valid=numeric(value);
  if(!valid)throw Error('provider-cursor-format-changed');
 }
 if(!Object.entries(cursor).some(([k,v])=>v!==null&&['block_number','index','hash','batch_block_hash','batch_transaction_hash','batch_log_index','index_in_batch'].includes(k)))throw Error('provider-cursor-format-changed');
 return cursor;
}
export const ethereumHistoryRestartRequired=code=>!['page-limit','aborted','timeout','network','http-429','http-500','http-502','http-503','http-504','rate-limit-wait-required'].includes(code);
/** Receipt-backed normalization; raw provider payloads are never journal entries. */
export function ethereumHistoryEvents({wallets,tokens=[],transactions=[],transfers=[],internals=[],evidence={},source=PUBLIC_EVM_NETWORKS[1].host,observedAt=new Date().toISOString()}){
 const owners=new Map(),aliases=[];
 for(const w of [...wallets].sort((a,b)=>a.accountId.localeCompare(b.accountId))){const a=addr(w.address);if(owners.has(a)){aliases.push({address:a,accountId:w.accountId,canonicalAccountId:owners.get(a)});}else owners.set(a,w.accountId);}
 const issues=new Set(),events=[],registry=new Map(tokens.map(t=>[addr(t.contract),t]));
 const facts=new Map();
 for(const tx of transactions){const id=hash(tx.hash);if(facts.has(id)&&canonical(facts.get(id))!==canonical(tx))issues.add('conflicting-transaction');else facts.set(id,tx);}
 const provenance=id=>{
  const p=evidence[id];if(!p?.receipt||!p?.transaction||!p?.block)throw Error('missing-provenance');
  const r=p.receipt,t=p.transaction,b=p.block;
  if(hash(r.transactionHash)!==id||hash(t.hash)!==id||hash(r.blockHash)!==hash(b.hash)||hash(t.blockHash)!==hash(b.hash)||hex(r.blockNumber)!==hex(b.number)||hex(t.blockNumber)!==hex(b.number))throw Error('reorg');
  if(!['0x0','0x1'].includes(r.status)||!Array.isArray(r.logs))throw Error('receipt-incomplete');
  const successful=r.status==='0x1';
  return {p,successful,base:{txid:id,blockHeight:hex(b.number).toString(),blockHash:hash(b.hash),timestamp:new Date(Number(hex(b.timestamp))*1000).toISOString(),txIndex:hex(r.transactionIndex).toString(),source,observedAt,status:successful?'confirmed':'failed',finality:'confirmed',coverage:'verified',qualityCode:'receipt-backed'}};
 };
 const legs=(base,from,to,quantity,locator,token)=>{
  const a=from?addr(from):null,b=to?addr(to):null;
  // Distinct self-transfer legs preserve both effects while remaining net zero.
  if(owners.has(a))events.push(validateHistoryEvent({...base,...identity(owners.get(a),token),walletId:owners.get(a),type:owners.has(b)?'internal_transfer':'outgoing',quantityBaseUnits:(-quantity).toString(),locator:{...locator,subindex:'0'}}));
  if(owners.has(b))events.push(validateHistoryEvent({...base,...identity(owners.get(b),token),walletId:owners.get(b),type:owners.has(a)?'internal_transfer':'incoming',quantityBaseUnits:quantity.toString(),locator:{...locator,subindex:'1'}}));
 };
 for(const [id,tx] of facts){
  try{
   const {p,successful,base}=provenance(id),t=p.transaction,r=p.receipt;
   if(addr(tx.from.hash)!==addr(t.from)||(tx.to?.hash?addr(tx.to.hash):null)!==(t.to?addr(t.to):null)||raw(tx.value)!==hex(t.value)||index(tx.block_number)!==base.blockHeight)throw Error('transaction-conflict');
   const payer=owners.get(addr(t.from));
   if(payer){
    if(t.type==='0x3'&&(r.blobGasUsed==null||r.blobGasPrice==null))throw Error('missing-blob-fee');
    const fee=hex(r.gasUsed)*hex(r.effectiveGasPrice??t.gasPrice)+(r.blobGasUsed!=null?hex(r.blobGasUsed)*hex(r.blobGasPrice):0n);
    if(tx.fee?.type!=='actual'||raw(tx.fee.value)!==fee)throw Error('fee-conflict');
    events.push(validateHistoryEvent({...base,...identity(payer),walletId:payer,type:'fee',quantityBaseUnits:(-fee).toString(),locator:{kind:'fee',index:'0',subindex:'0'}}));
   }
   if(successful){
    const plainToken=tx.to?.hash&&registry.get(addr(tx.to.hash))?.balanceModel==='transfer'&&['0xa9059cbb','0x23b872dd'].includes(t.input?.slice(0,10));
    if((t.input!=='0x'||tx.to?.is_contract===true)&&!plainToken||tx.from?.is_contract===true)issues.add('contract-effects-partial');
    if(hex(t.value)>0n)legs(base,t.from,t.to??r.contractAddress,hex(t.value),{kind:'subindex',index:'0'});
   }
  }catch(e){issues.add(e.message);}
 }
 // Embedded transaction transfers and the paginated transfers use the same log IDs.
 for(const transfer of [...transfers,...transactions.flatMap(t=>t.token_transfers??[])]){
  try{
   const id=hash(transfer.transaction_hash),{p,successful,base}=provenance(id);
   if(!successful){issues.add('failed-transfer-suppressed');continue;}
   const contract=addr(transfer.token?.address_hash),token=registry.get(contract);
   if(!token){issues.add('unknown-contract');continue;}
   if(transfer.token.type!=='ERC-20'||(transfer.token_type&&transfer.token_type!=='ERC-20'))throw Error('unsupported-token-type');
   if(String(token.decimals)!==String(transfer.token.decimals)||String(token.decimals)!==String(transfer.total?.decimals))throw Error('decimals-conflict');
   if(token.balanceModel!=='transfer'||ETH_LST_CONTRACTS.some(t=>t.contract===contract))issues.add('unsupported-token-model');
   const logIndex=index(transfer.log_index),log=p.receipt.logs.find(l=>hex(l.logIndex).toString()===logIndex);
   if(!log||log.removed!==false||hash(log.blockHash)!==base.blockHash||hash(log.transactionHash)!==id||addr(log.address)!==contract||log.topics?.length!==3||log.topics[0].toLowerCase()!==TRANSFER)throw Error('log-provenance-conflict');
   if(!/^0x[0-9a-f]{64}$/i.test(log.data)||log.topics.slice(1).some(t=>!/^0x0{24}[0-9a-f]{40}$/i.test(t)))throw Error('invalid-log-encoding');
   const from=addr('0x'+log.topics[1].slice(-40)),to=addr('0x'+log.topics[2].slice(-40));
   if(from!==addr(transfer.from.hash)||to!==addr(transfer.to.hash)||hex(log.data)!==raw(transfer.total.value)||hash(transfer.block_hash)!==base.blockHash)throw Error('log-value-conflict');
   legs(base,from,to,raw(transfer.total.value),{kind:'log',index:logIndex},token);
  }catch(e){issues.add(e.message);}
 }
 for(const internal of internals){
  try{
   const id=hash(internal.transaction_hash),{p,successful,base}=provenance(id);
   if(!successful||internal.success===false||internal.error){if(!successful&&internal.success)issues.add('failed-internal-suppressed');continue;}
   if(internal.success!==true||index(internal.block_number)!==base.blockHeight||time(internal.timestamp)!==base.timestamp)throw Error('internal-provenance-missing');
   const n=index(internal.index),value=raw(internal.value),to=internal.to?.hash??internal.created_contract?.hash;
   // Trace root is the transaction value already represented above, not another transfer.
   if(n==='0'){if(addr(internal.from.hash)!==addr(p.transaction.from)||(to?addr(to):null)!==(p.transaction.to?addr(p.transaction.to):p.receipt.contractAddress?addr(p.receipt.contractAddress):null)||value!==hex(p.transaction.value))throw Error('ambiguous-root-trace');continue;}
   if(!['call','create','create2','selfdestruct'].includes(internal.type))throw Error('unsupported-trace');
   if(value>0n)legs(base,internal.from.hash,to,value,{kind:'instruction',index:n});
  }catch(e){issues.add(e.message);}
 }
 const result=dedupeHistoryEvents(events);if(result.conflicts.length)issues.add('event-conflict');
 return {...result,issues:[...issues].sort(),aliases,accounts:[...new Set(owners.values())].sort()};
}
/** Bounded, uncached Blockscout v2 session, with receipt and pinned RPC evidence. */
export async function fetchEthereumHistory({wallets,tokens=[],openings=[],chainId=1,fetcher=globalThis.fetch,signal,maxPages=1000,timeoutMs=15000,retries=1,retryDelayMs=250,resume=null,onCheckpoint=()=>{},observedAt=new Date().toISOString(),settings={}}={}){
 if(Number(chainId)!==1)throw Error('ethereum-mainnet-only');
 if(!Array.isArray(wallets)||!wallets.length||wallets.length>50)throw Error('wallets-required');
 wallets=wallets.map(w=>{if(typeof w.accountId!=='string'||!w.accountId||w.accountId.length>100)throw Error('invalid-account');return {accountId:w.accountId,address:addr(w.address)};});
 tokens=tokens.map(t=>{if(!Number.isInteger(t.decimals)||t.decimals<0||t.decimals>255)throw Error('invalid-decimals');return {contract:addr(t.contract),decimals:t.decimals,balanceModel:t.balanceModel??'unknown'};});
 if(new Set(tokens.map(t=>t.contract)).size!==tokens.length)throw Error('duplicate-contract');
 if(!Number.isInteger(maxPages)||maxPages<1||maxPages>10000||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000||!Number.isInteger(retries)||retries<0||retries>2||!Number.isInteger(retryDelayMs)||retryDelayMs<0||retryDelayMs>5000)throw Error('invalid-limits');
 const host=PUBLIC_EVM_NETWORKS[1].host,scope=canonical([1,host,wallets,tokens,openings]);
 if(resume?.scope!==undefined&&resume.scope!==scope)throw Error('cursor-scope-mismatch');
 const expected=wallets.flatMap(w=>['transactions','token-transfers','internal-transactions'].map(kind=>({address:w.address,kind})));
 const emptyJobs=()=>expected.map(j=>({...j,cursor:null,done:false,items:[],cursors:[]}));
 let state=resume?structuredClone(resume):{schema:1,scope,tip:null,jobs:emptyJobs(),evidence:{}};let pages=0,section='chain';
 const issues=new Set(),snapshot=()=>structuredClone(state);
 async function read(url,body){
  for(let attempt=0;;attempt++){
   abort(signal);const controller=new AbortController(),listener=()=>controller.abort();let timer;
   signal?.addEventListener('abort',listener,{once:true});
   try{
    const expired=new Promise((_,reject)=>{timer=setTimeout(()=>{reject(Error('timeout'));controller.abort();},timeoutMs);controller.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});});
    const r=await Promise.race([fetcher(url,{method:body?'POST':'GET',...(body?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error'}),expired]);
    if(!r.ok){const e=Error('http-'+r.status);e.retryable=r.status===429||r.status>=500;e.delay=r.headers?.get('Retry-After');throw e;}
    const d=await Promise.race([r.json(),expired]);if(d?.error)throw Error('rpc-error');return d;
   }catch(e){abort(signal);if(e instanceof TypeError&&/fetch|CORS|network|load failed/i.test(e.message))e.network=true;if(!e.retryable||attempt>=retries)throw e;
    const wait=e.delay==null?retryDelayMs:Number(e.delay)*1000;if(!Number.isFinite(wait)||wait>5000)throw Error('rate-limit-wait-required');await new Promise(r=>setTimeout(r,Math.max(0,wait)));
   }finally{clearTimeout(timer);signal?.removeEventListener('abort',listener);}
  }
 }
 const rpc=async(method,params)=>{const d=await read(ETH_RPC,{jsonrpc:'2.0',id:1,method,params});if(d.result===undefined||d.result===null)throw Error('rpc-missing');return d.result;};
 try{
  if(state.schema!==1||state.scope!==scope||!Array.isArray(state.jobs)||!state.evidence||typeof state.evidence!=='object'||Array.isArray(state.evidence))throw Error('invalid-cursor');
  // Older early-network checkpoints had no jobs and no tip/progress. Rebuild
  // only that empty, scope-bound initial state; never discard retained pages.
  if(resume&&!state.jobs.length&&!state.tip&&!Object.keys(state.evidence).length)state.jobs=emptyJobs();
  if(canonical(state.jobs.map(({address,kind})=>({address,kind})))!==canonical(expected))throw Error('invalid-cursor');
  if(hex(await rpc('eth_chainId',[]))!==1n)throw Error('wrong-chain');
  const tip=await rpc('eth_getBlockByNumber',['finalized',false]);hash(tip.hash);hex(tip.number);
  if(state.schema!==1||state.scope!==scope||state.tip&&canonical(state.tip)!==canonical(tip))throw Error('tip-changed-restart-required');state.tip=tip;
  // Re-fetch completed pages to validate untrusted checkpoints, then continue the
  // retained cursor. Validation reads do not consume the NEW-page budget.
  if(resume)for(const job of state.jobs){
   section=job.kind;
   if(!Array.isArray(job.items)||!Array.isArray(job.cursors)||job.cursors.length>10000||typeof job.done!=='boolean')throw Error('invalid-cursor');
   try{validateEthereumCursor(job.cursor,job.kind);}catch{throw Error('invalid-cursor');}
   let cursor=null;const items=[],seen=[];
   const length=job.cursors.length+(job.done?1:0);
   for(let i=0;i<length;i++){
    const query=new URLSearchParams(job.kind==='token-transfers'?{type:'ERC-20'}:{});
    if(cursor)for(const [k,v] of Object.entries(cursor))query.set(k,String(v));
    const page=await read(host+'/api/v2/addresses/'+job.address+'/'+job.kind+'?'+query);
    if(!Array.isArray(page.items)||page.items.length>100||!Object.hasOwn(page,'next_page_params'))throw Error('invalid-page');
    items.push(...page.items);cursor=validateEthereumCursor(page.next_page_params,job.kind);
    if(cursor!==null){const id=canonical(cursor);if(id!==job.cursors[i]||seen.includes(id))throw Error('invalid-cursor');seen.push(id);}
    else if(i!==length-1||!job.done)throw Error('cursor-provider-changed');
   }
   if(canonical(items)!==canonical(job.items)||canonical(cursor)!==canonical(job.cursor))throw Error('cursor-provider-changed');
  }
  state.evidence={};
  for(const job of state.jobs){
   section=job.kind;
   while(!job.done){
    abort(signal);if(pages>=maxPages)throw Error('page-limit');
    const query=new URLSearchParams(job.kind==='token-transfers'?{type:'ERC-20'}:{});
    if(job.cursor)for(const [k,v] of Object.entries(job.cursor))query.set(k,String(v));
    const page=await read(host+'/api/v2/addresses/'+job.address+'/'+job.kind+'?'+query);
    if(!Array.isArray(page.items)||page.items.length>100||!Object.hasOwn(page,'next_page_params'))throw Error('invalid-page');
    const next=validateEthereumCursor(page.next_page_params,job.kind);
    if(next!==null){
     const id=canonical(next);if(job.cursors.includes(id)||!page.items.length)throw Error('nonadvancing-cursor');job.cursors.push(id);
    }
    job.items.push(...page.items);job.cursor=next;job.done=next===null;pages++;onCheckpoint(snapshot());
   }
  }
  section='chain';
  const txs=state.jobs.filter(j=>j.kind==='transactions').flatMap(j=>j.items),transfers=state.jobs.filter(j=>j.kind==='token-transfers').flatMap(j=>j.items),internals=state.jobs.filter(j=>j.kind==='internal-transactions').flatMap(j=>j.items);
  const ids=[...new Set([...txs.map(t=>t.hash),...transfers.map(t=>t.transaction_hash),...internals.map(t=>t.transaction_hash)])];
  for(const id of ids){
   hash(id);const receipt=await rpc('eth_getTransactionReceipt',[id]),transaction=await rpc('eth_getTransactionByHash',[id]);
   if(!receipt.blockNumber||hex(receipt.blockNumber)>hex(tip.number)){issues.add('unfinalized-events');continue;}
   const block=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false]);state.evidence[id]={receipt,transaction,block};
   // Pull parent details when a token/trace endpoint supplies a hash absent from address transactions.
   if(!txs.some(t=>t.hash===id))txs.push(await read(host+'/api/v2/transactions/'+id));
  }
  const normalized=ethereumHistoryEvents({wallets,tokens,transactions:txs,transfers,internals,evidence:state.evidence,source:host,observedAt});normalized.issues.forEach(i=>issues.add(i));
  for(const token of tokens){
   const metadata=await read(host+'/api/v2/tokens/'+token.contract);
   const onchain=hex(await rpc('eth_call',[{to:token.contract,data:'0x313ce567'},tip.number]));
   if(addr(metadata.address_hash)!==token.contract||metadata.type!=='ERC-20'||String(metadata.decimals)!==String(token.decimals)||onchain!==BigInt(token.decimals))issues.add('token-metadata-conflict');
  }
  const observations=[],streams=[];
  for(const accountId of normalized.accounts){
   const addresses=[...new Set(wallets.filter(w=>w.accountId===accountId||normalized.aliases.some(a=>a.accountId===w.accountId&&a.canonicalAccountId===accountId)).map(w=>w.address))];
   for(const token of [null,...tokens]){
    const ident=identity(accountId,token),opening=openings.find(o=>o.accountId===accountId&&(o.contract??null)===(token?.contract??null));
    if(!opening?.source)issues.add('missing-opening');
    let sum=0n;
    for(const address of addresses){
     const value=token?await rpc('eth_call',[{to:token.contract,data:'0x70a08231'+address.slice(2).padStart(64,'0')},tip.number]):await rpc('eth_getBalance',[address,tip.number]);sum+=hex(value);
     // Existing scanner uses latest; compare only with a separately sampled stable latest head.
     const latestBefore=await rpc('eth_getBlockByNumber',['latest',false]);
     try{
      const scanner=await walletBalanceExact({enabled:true,chain:token?'erc20':'evm',chainId:1,address,...(token?{contract:token.contract,decimals:token.decimals}:{})},settings,async(url,options)=>{
       const response=await read(url,options?.body?JSON.parse(options.body):undefined);return {ok:true,status:200,json:async()=>response};
      });
      const latestValue=token?await rpc('eth_call',[{to:token.contract,data:'0x70a08231'+address.slice(2).padStart(64,'0')},latestBefore.number]):await rpc('eth_getBalance',[address,latestBefore.number]);
      const d=token?.decimals??18,parts=scanner.split('.');const scannerRaw=BigInt(parts[0])*10n**BigInt(d)+BigInt((parts[1]??'').padEnd(d,'0')||'0');
      if(scannerRaw!==hex(latestValue))issues.add('scanner-mismatch');
      if(hash((await rpc('eth_getBlockByNumber',['latest',false])).hash)!==hash(latestBefore.hash))issues.add('scanner-head-changed');
     }catch{issues.add('scanner-unavailable');}
    }
    observations.push({...ident,quantityBaseUnits:sum.toString(),blockHeight:hex(tip.number).toString(),blockHash:hash(tip.hash),source:ETH_RPC});
    // Transaction/trace APIs do not enumerate protocol withdrawals, rewards or genesis credits.
    if(!token)issues.add('native-protocol-credits-uncovered');
    if(token&&(token.balanceModel!=='transfer'||ETH_LST_CONTRACTS.some(t=>t.contract===token.contract)))issues.add('unsupported-token-model');
    streams.push({...ident,throughBlock:hex(tip.number).toString(),opening:opening?{quantityBaseUnits:raw(opening.quantityBaseUnits).toString(),beforeBlock:raw(opening.beforeBlock).toString(),source:opening.source}:null,coverage:{status:'partial',fromBlock:'0',toBlock:hex(tip.number).toString(),tipHash:hash(tip.hash),source:host}});
   }
  }
  if(hash((await rpc('eth_getBlockByNumber',[tip.number,false])).hash)!==hash(tip.hash))throw Error('reorg');
  // First reconcile candidate sums; no unmatched balance may become verified.
  const candidates=streams.map(s=>({...s,coverage:{...s.coverage,status:s.contract&&tokens.find(t=>t.contract===s.contract)?.balanceModel==='transfer'&&!issues.has('unsupported-token-model')&&!issues.has('token-metadata-conflict')&&!issues.has('missing-opening')&&!normalized.issues.length&&!issues.has('unfinalized-events')&&!issues.has('scanner-mismatch')&&!issues.has('scanner-unavailable')&&!issues.has('scanner-head-changed')?'verified':'partial'}}));
  let replay=replayWalletHistory({events:normalized.events,streams:candidates});const reconciliation=reconcileWalletHistory(replay,observations);
  for(const s of candidates)if(reconciliation.some(r=>r.accountId===s.accountId&&r.contract===s.contract&&r.status!=='verified'))s.coverage.status='partial';
  replay=replayWalletHistory({events:normalized.events,streams:candidates});
  return {...normalized,issues:[...issues].sort(),coverage:replay.balances.every(b=>b.coverage==='verified')?'verified':'partial',replay,reconciliation,observations,tip:{height:hex(tip.number).toString(),hash:hash(tip.hash),finality:'finalized'},oldestReached:true,resume:null};
 }catch(e){
  const code=e.name==='AbortError'?'aborted':e.network?'network':/^[a-z][a-z0-9-]{1,70}$/.test(e.message)?e.message:'provider-or-schema-error',restartRequired=ethereumHistoryRestartRequired(code);
  return {coverage:'partial',issues:[code],replay:null,oldestReached:false,resume:restartRequired?null:snapshot(),restartRequired,sourceSection:section,pagesRead:pages};
 }
}
