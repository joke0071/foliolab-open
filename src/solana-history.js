import {solanaRpcRead,solanaRpcEndpoints,DEFAULT_SOL_RPC} from './solana-rpc.js';
import {validateHistoryEvent,dedupeHistoryEvents,replayWalletHistory,reconcileWalletHistory} from './wallet-history-core.js';
export const SOL_MAINNET_GENESIS='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';
const TOKEN='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',TOKEN2022='TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const address=v=>{if(typeof v!=='string'||! /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v))throw Error('invalid-sol-address');return v;};
const signature=v=>{if(typeof v!=='string'||! /^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(v))throw Error('invalid-signature');return v;};
const integer=v=>{if(typeof v==='number'&&Number.isSafeInteger(v)&&v>=0)return BigInt(v);if(typeof v==='string'&&/^(0|[1-9]\d{0,99})$/.test(v))return BigInt(v);throw Error('unsafe-sol-raw');};
const ident=(accountId,mint=null,decimals=9)=>({network:'solana',chainId:'mainnet-beta',accountId,assetId:mint?'spl:'+mint:'solana',contract:null,mint,decimals});
/** Exact pre/post net account facts; never invented instruction-level swaps/rewards. */
export function solanaHistoryEvents(transactions,wallets,{source='solana-rpc',observedAt=new Date().toISOString()}={}){
 const owners=new Map(),aliases=[],issues=new Set(),events=[],openings=new Map(),learned=new Set(),tokens=new Map();
 for(const w of [...wallets].sort((a,b)=>a.accountId.localeCompare(b.accountId))){address(w.address);if(owners.has(w.address))aliases.push({accountId:w.accountId,canonicalAccountId:owners.get(w.address)});else owners.set(w.address,w.accountId);}
 const bySignature=new Map();for(const tx of transactions){const sig=signature(tx.transaction?.signatures?.[0]);if(bySignature.has(sig)&&JSON.stringify(bySignature.get(sig))!==JSON.stringify(tx))issues.add('conflicting-solana-transaction');else bySignature.set(sig,tx);}
 const closing=new Map();
 const ordered=[...bySignature.values()].sort((a,b)=>Number(integer(a.slot)-integer(b.slot))||(a.txIndex??0)-(b.txIndex??0));
 for(const tx of ordered){
  const sig=signature(tx.transaction?.signatures?.[0]),meta=tx.meta,message=tx.transaction?.message;
  if(!meta||!Object.hasOwn(meta,'err')||!Array.isArray(message?.accountKeys)||!Array.isArray(meta.preBalances)||!Array.isArray(meta.postBalances))throw Error('missing-transaction-meta');
  const keys=[...message.accountKeys.map(k=>typeof k==='string'?k:k.pubkey),...(meta.loadedAddresses?.writable??[]),...(meta.loadedAddresses?.readonly??[])];
  if(keys.length!==meta.preBalances.length||keys.length!==meta.postBalances.length)throw Error('loaded-address-mismatch');
  const failed=meta.err!==null;
  const base={txid:sig,blockHeight:integer(tx.slot).toString(),blockHash:tx.blockhash?address(tx.blockhash):null,timestamp:tx.blockTime==null?null:new Date(Number(integer(tx.blockTime))*1000).toISOString(),txIndex:tx.txIndex==null?null:integer(tx.txIndex).toString(),source,observedAt,status:failed?'failed':'confirmed',finality:'finalized',coverage:tx.blockhash&&tx.blockTime!==null?'verified':'partial',qualityCode:'solana-pre-post'};
  keys.forEach((key,index)=>{
   const accountId=owners.get(key);if(!accountId)return;const before=integer(meta.preBalances[index]),after=integer(meta.postBalances[index]),fee=index===0?integer(meta.fee):0n;
   const delta=after-before;
   if(closing.has(key)&&closing.get(key)!==before)issues.add('noncontiguous-native-balances');closing.set(key,after);
   if(!openings.has(accountId))openings.set(accountId,{...ident(accountId),quantityBaseUnits:before.toString(),beforeBlock:base.blockHeight,source:'solana-prebalance'});
   if(failed){if(delta!==-fee)issues.add('failed-state-conflict');}
   else{const movement=delta+fee;if(movement!==0n)events.push(validateHistoryEvent({...base,...ident(accountId),walletId:accountId,type:movement>0n?'incoming':'outgoing',quantityBaseUnits:movement.toString(),locator:{kind:'subindex',index:String(index),subindex:'0'}}));}
   if(fee!==0n)events.push(validateHistoryEvent({...base,...ident(accountId),walletId:accountId,type:'fee',quantityBaseUnits:(-fee).toString(),locator:{kind:'fee',index:'0',subindex:'0'}}));
  });
  if(failed){if(JSON.stringify(meta.preTokenBalances??[])!==JSON.stringify(meta.postTokenBalances??[]))issues.add('failed-token-state-conflict');continue;}
  const pre=new Map((meta.preTokenBalances??[]).map(b=>[b.accountIndex,b])),post=new Map((meta.postTokenBalances??[]).map(b=>[b.accountIndex,b]));
  for(const index of new Set([...pre.keys(),...post.keys()])){
   if(!Number.isSafeInteger(index)||index<0||index>=keys.length)throw Error('invalid-token-account-index');
   const a=pre.get(index),b=post.get(index),record=b??a,owner=record.owner;
   if(!owner){issues.add('unknown-token-owner');continue;}const accountId=owners.get(owner);if(!accountId)continue;
   const mint=address(record.mint),decimals=record.uiTokenAmount?.decimals;
   if(!Number.isInteger(decimals)||decimals<0||decimals>255)throw Error('invalid-token-decimals');
   tokens.set(mint,{mint,decimals});learned.add(address(keys[index]));issues.add('closed-token-accounts-may-be-missing');
   if(record.programId===TOKEN2022||!record.programId)issues.add('token-program-or-extension-unknown');
   if(!a||!b){issues.add('token-account-open-close-unknown');continue;}
   if(a.owner!==b.owner||a.mint!==b.mint||a.uiTokenAmount.decimals!==b.uiTokenAmount.decimals){issues.add('token-metadata-conflict');continue;}
   const delta=integer(b.uiTokenAmount.amount)-integer(a.uiTokenAmount.amount);
   if(delta!==0n)events.push(validateHistoryEvent({...base,...ident(accountId,mint,decimals),walletId:accountId,type:delta>0n?'incoming':'outgoing',coverage:'partial',qualityCode:'token-account-history-partial',quantityBaseUnits:delta.toString(),locator:{kind:'subindex',index:String(index),subindex:'0'}}));
  }
 }
 const normalized=dedupeHistoryEvents(events);if(normalized.conflicts.length)issues.add('solana-event-conflict');
 return {...normalized,accounts:[...new Set(owners.values())],aliases,openings:[...openings.values()],tokens:[...tokens.values()],learned:[...learned],issues:[...issues].sort()};
}
export async function fetchSolanaHistory({wallets,configured=DEFAULT_SOL_RPC,fetcher=globalThis.fetch,signal,maxPages=100,pageSize=100,timeoutMs=15000,retries=1,resume=null,onCheckpoint=()=>{},observedAt=new Date().toISOString()}={}){
 if(!Array.isArray(wallets)||!wallets.length||wallets.length>50||!Number.isInteger(maxPages)||maxPages<1||maxPages>10000||!Number.isInteger(pageSize)||pageSize<1||pageSize>1000)throw Error('invalid-sol-history-request');
 wallets=wallets.map(w=>{if(typeof w.accountId!=='string'||!w.accountId)throw Error('invalid-account');return {accountId:w.accountId,address:address(w.address)};});
 if(new Set(wallets.map(w=>w.accountId)).size!==wallets.length&&wallets.some((w,i)=>wallets.some((v,j)=>i!==j&&w.accountId===v.accountId&&w.address!==v.address)))throw Error('distinct-sol-wallet-accounts-required');
 const discovered=new Set(wallets.map(w=>w.address));
 const endpoint=solanaRpcEndpoints(configured)[0],scope=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([endpoint,wallets,pageSize]))))).map(n=>n.toString(16).padStart(2,'0')).join('');
 if(resume&&resume.scope!==scope)throw Error('sol-cursor-scope-mismatch');
 let state=resume?structuredClone(resume):{schema:1,scope,tip:null,queue:[],transactions:[]},pages=0;const issues=new Set(resume?.issues??[]);
 const read=async(method,params)=>(await solanaRpcRead(configured,method,params,fetcher,{history:true,signal,timeoutMs,retries})).result;
 try{
  if(await read('getGenesisHash',[])!==SOL_MAINNET_GENESIS)throw Error('wrong-solana-network');
  const headSlot=integer(await read('getSlot',[{commitment:'finalized'}]));
  // Capture an actual finalized scanner observation BEFORE a long pagination run.
  // getBalance has minContextSlot, not a historical exact-slot selector.
  const scanned=new Map();for(const w of wallets)scanned.set(w.accountId,await read('getBalance',[w.address,{commitment:'finalized',minContextSlot:Number(headSlot)}]));
  const slot=Number(integer(state.tip?.slot??scanned.get(wallets[0].accountId)?.context?.slot));
  if(!Number.isSafeInteger(slot)||state.tip&&headSlot<BigInt(slot))throw Error('invalid-finalized-snapshot');
  const tip=await read('getBlock',[slot,{commitment:'finalized',transactionDetails:'signatures',maxSupportedTransactionVersion:0}]);
  if(!tip?.blockhash)throw Error('archive-tip-missing');
  if(state.tip&&state.tip.blockhash!==tip.blockhash)throw Error('sol-tip-changed-restart-required');state.tip={slot,blockhash:tip.blockhash};
  {
   const all=discovered;
   for(const w of wallets)for(const programId of [TOKEN,TOKEN2022]){
    const accounts=await read('getTokenAccountsByOwner',[w.address,{programId},{encoding:'jsonParsed',commitment:'finalized',minContextSlot:slot}]);
    if(!Array.isArray(accounts?.value))throw Error('token-discovery-incomplete');
    for(const a of accounts.value){if(a.account?.data?.parsed?.info?.owner!==w.address){issues.add('token-account-owner-unverified');continue;}all.add(address(a.pubkey));}
   }
   if(resume){if(!Array.isArray(state.queue)||[...all].some(a=>!state.queue.some(j=>j.address===a)))throw Error('invalid-sol-cursor');}
   else state.queue=[...all].map(a=>({address:a,before:null,done:false,seen:[]}));
  }
  if(state.schema!==1||!Array.isArray(state.queue)||state.queue.length>150||!Array.isArray(state.transactions))throw Error('invalid-sol-cursor');
  // Re-fetch retained transactions rather than trusting provider payloads from an old cursor.
  if(resume){
   for(const retained of state.transactions){
    const sig=signature(retained.transaction.signatures[0]),latest=await read('getTransaction',[sig,{encoding:'json',commitment:'finalized',maxSupportedTransactionVersion:0}]);
    if(!latest||JSON.stringify(latest.transaction)!==JSON.stringify(retained.transaction)||JSON.stringify(latest.meta)!==JSON.stringify(retained.meta))throw Error('sol-resume-conflict');
    const block=await read('getBlock',[Number(integer(latest.slot)),{commitment:'finalized',transactionDetails:'signatures',maxSupportedTransactionVersion:0}]);
    if(block?.blockhash!==retained.blockhash||block.signatures?.indexOf(sig)!==retained.txIndex)throw Error('sol-resume-reorg');
   }
   for(const a of solanaHistoryEvents(state.transactions,wallets,{source:new URL(endpoint).hostname,observedAt}).learned)discovered.add(a);
   if(state.queue.some(j=>!discovered.has(j.address)))throw Error('unowned-sol-cursor-address');
   for(const job of state.queue){
    if(!Array.isArray(job.seen)||typeof job.done!=='boolean')throw Error('invalid-sol-cursor');let before=null,offset=0;
    while(offset<job.seen.length||job.done&&offset===0){
     const page=await read('getSignaturesForAddress',[address(job.address),{limit:pageSize,commitment:'finalized',...(before?{before}: {})}]);
     if(!Array.isArray(page)||page.length>pageSize||page.some((r,i)=>r.signature!==job.seen[offset+i]))throw Error('sol-cursor-provider-changed');
     offset+=page.length;before=page.at(-1)?.signature??before;
     if(page.length<pageSize)break;
    }
    if(offset!==job.seen.length||before!==job.before)throw Error('invalid-sol-cursor');
   }
  }
  const blocks=new Map();const transactions=new Map(state.transactions.map(t=>[t.transaction.signatures[0],t]));
  for(let q=0;q<state.queue.length;q++){
   const job=state.queue[q];address(job.address);
   while(!job.done){
    if(pages>=maxPages)throw Error('page-limit');
    const list=await read('getSignaturesForAddress',[job.address,{limit:pageSize,commitment:'finalized',...(job.before?{before:signature(job.before)}:{})}]);
    if(!Array.isArray(list)||list.length>pageSize||new Set(list.map(r=>r.signature)).size!==list.length)throw Error('invalid-signature-page');
    for(const row of list){signature(row.signature);if(job.seen.includes(row.signature))throw Error('nonadvancing-signature-cursor');}
    for(const row of list){
     if(transactions.has(row.signature))continue;
     const tx=await read('getTransaction',[row.signature,{encoding:'json',commitment:'finalized',maxSupportedTransactionVersion:0}]);
     if(!tx){issues.add('archive-gap');continue;}
     if(tx.version!==undefined&&tx.version!=='legacy'&&tx.version!==0){issues.add('unsupported-tx-version');continue;}
     if(integer(tx.slot)>BigInt(slot))continue; // after the fixed, observed snapshot, not a historical gap
     if(tx.transaction?.signatures?.[0]!==row.signature||row.confirmationStatus&&row.confirmationStatus!=='finalized'){issues.add('unfinalized-or-conflicting-transaction');continue;}
     const txSlot=Number(integer(tx.slot));if(!blocks.has(txSlot))blocks.set(txSlot,await read('getBlock',[txSlot,{commitment:'finalized',transactionDetails:'signatures',maxSupportedTransactionVersion:0}]));
     const block=blocks.get(txSlot);if(!block?.blockhash||!Array.isArray(block.signatures)||!block.signatures.includes(row.signature)){issues.add('archive-block-gap');continue;}
     const full={...tx,blockhash:block.blockhash,txIndex:block.signatures.indexOf(row.signature)};transactions.set(row.signature,full);
     const normalized=solanaHistoryEvents([full],wallets,{source:new URL(endpoint).hostname,observedAt});
     for(const a of normalized.learned)if(!state.queue.some(j=>j.address===a)){if(state.queue.length>=150)throw Error('account-limit');state.queue.push({address:a,before:null,done:false,seen:[]});}
    }
    job.seen.push(...list.map(r=>r.signature));job.before=list.at(-1)?.signature??job.before;job.done=list.length<pageSize;pages++;
    state.transactions=[...transactions.values()];state.issues=[...issues];onCheckpoint(structuredClone(state));
   }
  }
  const normalized=solanaHistoryEvents([...transactions.values()],wallets,{source:new URL(endpoint).hostname,observedAt});normalized.issues.forEach(i=>issues.add(i));
  const streams=[],observations=[];
  for(const accountId of normalized.accounts){
   const balance=scanned.get(accountId);
   if(balance?.context?.slot!==slot)issues.add('sol-scanner-slot-mismatch');
   const opening=normalized.openings.find(o=>o.accountId===accountId);
   streams.push({...ident(accountId),throughBlock:String(slot),opening:opening?{quantityBaseUnits:opening.quantityBaseUnits,beforeBlock:opening.beforeBlock,source:opening.source}:null,coverage:{status:issues.size?'partial':'verified',fromBlock:opening?.beforeBlock??'0',toBlock:String(slot),tipHash:tip.blockhash,source:new URL(endpoint).hostname}});
   if(balance.context.slot===slot)observations.push({...ident(accountId),quantityBaseUnits:integer(balance.value).toString(),blockHeight:String(slot),blockHash:tip.blockhash,source:new URL(endpoint).hostname});
   for(const token of normalized.tokens)streams.push({...ident(accountId,token.mint,token.decimals),throughBlock:String(slot),opening:null,coverage:{status:'partial',fromBlock:'0',toBlock:String(slot),tipHash:tip.blockhash,source:new URL(endpoint).hostname}});
  }
  if(integer(await read('getSlot',[{commitment:'finalized'}]))<BigInt(slot)||(await read('getBlock',[slot,{commitment:'finalized',transactionDetails:'signatures',maxSupportedTransactionVersion:0}]))?.blockhash!==tip.blockhash)throw Error('sol-reorg-or-tip-changed');
  let replay=replayWalletHistory({events:normalized.events,streams}),reconciliation=reconcileWalletHistory(replay,observations);
  if(reconciliation.some(r=>r.status!=='verified')){issues.add('sol-reconciliation-partial');for(const s of streams)s.coverage.status='partial';replay=replayWalletHistory({events:normalized.events,streams});}
  return {...normalized,replay,reconciliation,issues:[...issues].sort(),coverage:issues.size?'partial':'verified',resume:null,tip:state.tip,oldestReached:true};
 }catch(e){return {coverage:'partial',issues:[e.name==='AbortError'?'aborted':/^[a-z][a-z0-9-]+$/.test(e.message)?e.message:'sol-provider-or-schema-error'],replay:null,resume:state,oldestReached:false};}
}
