/** SOL-WH02: public Esplora reads only; no portfolio writes or journal posting. */
import {scanBitcoinAccount} from './bitcoin-hd.js';
import {validateAddress} from './blockchain-adapters.js';
import {btcBalance} from './market.js';
import {validateHistoryEvent,historyEventId,dedupeHistoryEvents,replayWalletHistory,reconcileWalletHistory} from './wallet-history-core.js';
const BASE='https://blockstream.info/api';
const hash=v=>{if(typeof v!=='string'||! /^[a-f0-9]{64}$/.test(v))throw Error('invalid-hash');return v;};
const raw=v=>{if(typeof v==='number'&&Number.isSafeInteger(v)&&v>=0)return BigInt(v);if(typeof v==='string'&&/^(0|[1-9]\d{0,29})$/.test(v))return BigInt(v);throw Error('unsafe-satoshis');};
const count=v=>{if(!Number.isSafeInteger(v)||v<0)throw Error('invalid-count');return v;};
const identity=accountId=>({network:'bitcoin',chainId:'mainnet',accountId,assetId:'bitcoin',contract:null,mint:null,decimals:8});
const abort=signal=>{if(signal?.aborted){const e=Error('aborted');e.name='AbortError';throw e;}};
function ownersFor(wallets){
 const owners=new Map(),aliases=[];
 const parent=new Map(wallets.map(w=>[w.accountId,w.accountId]));
 const root=x=>parent.get(x)===x?x:root(parent.get(x));
 for(const w of wallets)for(const address of w.addresses){const previous=owners.get(address);if(previous){const a=root(previous),b=root(w.accountId);parent.set(a<b?b:a,a<b?a:b);aliases.push({address,accounts:[previous,w.accountId]});}else owners.set(address,w.accountId);}
 for(const [a,id] of owners)owners.set(a,root(id));
 return {owners,aliases,accounts:[...new Set(wallets.map(w=>root(w.accountId)))].sort()};
}
/** Normalize exact raw vin/vout facts; shared inputs never imply a fee allocation. */
export function bitcoinHistoryEvents(transactions,wallets,{source=BASE,observedAt=new Date().toISOString()}={}){
 const {owners,aliases,accounts}=ownersFor(wallets),events=[],issues=[],utxos=new Map(),spent=new Set();
 const txs=new Map();
 for(const tx of transactions){hash(tx.txid);const old=txs.get(tx.txid);if(old&&JSON.stringify(old)!==JSON.stringify(tx))issues.push('conflicting-transaction');else txs.set(tx.txid,tx);}
 for(const tx of txs.values()){
  if(!Array.isArray(tx.vin)||!tx.vin.length||!Array.isArray(tx.vout)||!tx.vout.length||typeof tx.status?.confirmed!=='boolean')throw Error('invalid-transaction');
  const confirmed=tx.status.confirmed;
  const base={network:'bitcoin',chainId:'mainnet',walletId:'btc-canonical',assetId:'bitcoin',contract:null,mint:null,decimals:8,txid:tx.txid,txIndex:null,
   blockHeight:confirmed?String(count(tx.status.block_height)):null,blockHash:confirmed?hash(tx.status.block_hash):null,
   timestamp:confirmed?new Date(count(tx.status.block_time)*1000).toISOString():null,source,observedAt,status:confirmed?'confirmed':'unconfirmed',finality:confirmed?'confirmed':'unconfirmed',coverage:confirmed?'verified':'unconfirmed',qualityCode:confirmed?'esplora':'mempool'};
  const inputOwners=new Set(),outputOwners=new Set();let inputSum=0n,outputSum=0n,missing=false;
  for(const input of tx.vin){
   if(input.is_coinbase===true)continue;
   hash(input.txid);count(input.vout);
   if(!input.prevout){missing=true;continue;}
   inputSum+=raw(input.prevout.value);
   const owner=owners.get(input.prevout.scriptpubkey_address);if(owner)inputOwners.add(owner);
   if(confirmed)spent.add(input.txid+':'+input.vout);
  }
  for(const output of tx.vout){outputSum+=raw(output.value);const owner=owners.get(output.scriptpubkey_address);if(owner)outputOwners.add(owner);}
  if(missing)issues.push('missing-prevout');
  const made=[];
  tx.vin.forEach((input,index)=>{
   const accountId=owners.get(input.prevout?.scriptpubkey_address);if(!accountId)return;
   const quantityBaseUnits=(-raw(input.prevout.value)).toString();
   if(quantityBaseUnits==='0')return;
   made.push(validateHistoryEvent({...base,accountId,walletId:accountId,type:outputOwners.size?'internal_transfer':'outgoing',quantityBaseUnits,locator:{kind:'vin',index:String(index),subindex:'0'}}));
  });
  tx.vout.forEach((output,index)=>{
   const accountId=owners.get(output.scriptpubkey_address);if(!accountId)return;
   made.push(validateHistoryEvent({...base,accountId,walletId:accountId,type:inputOwners.size?'internal_transfer':'incoming',quantityBaseUnits:raw(output.value).toString(),locator:{kind:'vout',index:String(index),subindex:'0'}}));
   if(confirmed)utxos.set(tx.txid+':'+index,{accountId,txid:tx.txid,vout:index,satoshis:raw(output.value).toString()});
  });
  if(!missing&&!tx.vin.some(i=>i.is_coinbase)){
   const fee=inputSum-outputSum;if(fee<0n||fee!==raw(tx.fee))issues.push('invalid-fee');
   else if(inputOwners.size){
    const allOwned=tx.vin.every(i=>owners.has(i.prevout?.scriptpubkey_address));
    const accountId=inputOwners.size===1?[...inputOwners][0]:null;
    const debit=made.find(e=>e.locator.kind==='vin'&&accountId===e.accountId&&-BigInt(e.quantityBaseUnits)>=fee);
    if(allOwned&&debit&&confirmed)made.push(validateHistoryEvent({...base,accountId,walletId:accountId,type:'fee',quantityBaseUnits:(-fee).toString(),locator:{kind:'fee',index:'0',subindex:'0'},includedInEventId:historyEventId(debit)}));
    else issues.push('fee-allocation-unknown');
   }
  }
  events.push(...made);
 }
 return {events:dedupeHistoryEvents(events).events,issues:[...new Set(issues)].sort(),aliases,accounts,utxos:[...utxos].filter(([key])=>!spent.has(key)).map(([,v])=>v)};
}
/**
 * Finite in-memory session. onCheckpoint receives public, JSON-compatible data;
 * caller may resume it explicitly. No persistence is performed here (WH04).
 */
export async function fetchBitcoinHistory({wallets,fetcher=globalThis.fetch,signal,endpoint=BASE,maxPages=1000,timeoutMs=15000,retries=1,retryDelayMs=250,resume=null,onCheckpoint=()=>{},observedAt=new Date().toISOString()}={}){
 if(!Array.isArray(wallets)||!wallets.length||wallets.length>50)throw Error('wallets-required');
 if(!Number.isInteger(maxPages)||maxPages<1||maxPages>10000||!Number.isInteger(retries)||retries<0||retries>2||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000||!Number.isInteger(retryDelayMs)||retryDelayMs<0||retryDelayMs>5000)throw Error('invalid-limits');
 const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('https-endpoint-required');
 endpoint=url.href.replace(/\/$/,'');
 const config=wallets.map(w=>{
  if(typeof w.accountId!=='string'||!w.accountId||w.accountId.length>100||!['btc','btc-hd'].includes(w.chain))throw Error('invalid-wallet');
  return {accountId:w.accountId,chain:w.chain,address:validateAddress(w.chain,w.address),addressType:w.addressType||'auto'};
 });
 const scope=JSON.stringify([1,endpoint,config]);
 if(resume&&(resume.scope!==scope||resume.schema!==1))throw Error('cursor-scope-mismatch');
 let state=resume?structuredClone(resume):{schema:1,scope,tip:null,wallets:[],addresses:[],transactions:[]};
 const issues=[],snapshot=()=>structuredClone(state);let pages=0;
 async function read(path,json=true){
  for(let attempt=0;;attempt++){
   abort(signal);const controller=new AbortController();let timer;
   const listener=()=>controller.abort();signal?.addEventListener('abort',listener,{once:true});
   try{
    const response=await Promise.race([fetcher(endpoint+path,{method:'GET',signal:controller.signal,cache:'no-store',redirect:'error'}),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'));},timeoutMs);}),new Promise((_,reject)=>{controller.signal.addEventListener('abort',()=>{const e=Error(signal?.aborted?'aborted':'timeout');e.name=signal?.aborted?'AbortError':'Error';reject(e);},{once:true});})]);
    if(!response.ok){const e=Error('http-'+response.status);e.retryable=response.status===429||response.status>=500;e.delay=response.headers?.get('retry-after');throw e;}
    // Include response-body consumption in the timeout as well.
    return await Promise.race([json?response.json():response.text(),new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('body-timeout')),{once:true}))]);
   }catch(error){abort(signal);if(!error.retryable||attempt>=retries)throw error;
    const delay=error.delay==null?retryDelayMs:Number(error.delay)*1000;
    if(!Number.isFinite(delay)||delay>5000)throw Error('rate-limit-wait-required');
    await new Promise(resolve=>setTimeout(resolve,Math.max(0,delay)));
   }finally{clearTimeout(timer);signal?.removeEventListener('abort',listener);}
  }
 }
 const tip=async()=>{const h=hash((await read('/blocks/tip/hash',false)).trim());const b=await read('/block/'+h);if(b.id!==h)throw Error('invalid-tip');return {hash:h,height:String(count(b.height))};};
 try{
  const current=await tip();
  if(state.tip&&JSON.stringify(state.tip)!==JSON.stringify(current))throw Error('tip-changed-restart-required');state.tip=current;
  {
   const discovered=[];
   for(const w of config){
    if(w.chain==='btc'){
     if(w.address.startsWith('bc1p'))throw Error('unsupported-taproot');
     discovered.push({...w,addresses:[w.address]});
    }else{
     // Use the existing receive/change/gap20 scanner unchanged, with bounded GETs.
     const scan=await scanBitcoinAccount(w.address,{addressType:w.addressType,fetcher:async original=>{
      const path=new URL(original).pathname.replace(/^\/api/,'');const data=await read(path);return {ok:true,status:200,json:async()=>data};
     }});
     discovered.push({...w,addressType:scan.addressType,addresses:scan.details.map(d=>d.address),scanSatoshis:scan.satoshis});
    }
   }
   if(resume&&state.wallets.length&&JSON.stringify(state.wallets)!==JSON.stringify(discovered))throw Error('invalid-cursor');
   state.wallets=discovered;
   if(!resume||!state.addresses.length)state.addresses=[...new Set(state.wallets.flatMap(w=>w.addresses))].sort().map(address=>({address,last:null,done:false}));onCheckpoint(snapshot());
  }
  const expectedAddresses=[...new Set(state.wallets.flatMap(w=>w.addresses))].sort();
  if(JSON.stringify(state.addresses.map(a=>a.address))!==JSON.stringify(expectedAddresses))throw Error('invalid-cursor');
  if(resume)for(const tx of new Map(state.transactions.map(tx=>[hash(tx.txid),tx])).values()){
   if(JSON.stringify(await read('/tx/'+tx.txid))!==JSON.stringify(tx))throw Error('conflicting-transaction');
  }
  // Resume state is never a trusted opening; counts, hashes and scanner sums are checked again.
  if(!Array.isArray(state.transactions)||!Array.isArray(state.addresses)||state.addresses.some(a=>!state.wallets.some(w=>w.addresses.includes(a.address))||typeof a.done!=='boolean'||(a.last!==null&&!/^[a-f0-9]{64}$/.test(a.last))))throw Error('invalid-cursor');
  for(const a of state.addresses){
   while(!a.done){
    abort(signal);if(pages>=maxPages)throw Error('page-limit');
    const list=await read('/address/'+encodeURIComponent(a.address)+'/txs/chain'+(a.last?'/'+hash(a.last):''));
    if(!Array.isArray(list)||list.length>25||list.some(tx=>tx.status?.confirmed!==true))throw Error('invalid-page');
    const ids=list.map(tx=>hash(tx.txid));if(new Set(ids).size!==ids.length||ids.includes(a.last))throw Error('nonadvancing-page');
    if(list.some(tx=>state.transactions.some(old=>old.txid===tx.txid&&JSON.stringify(old)!==JSON.stringify(tx))))throw Error('conflicting-transaction');
    state.transactions.push(...list);a.done=list.length<25;a.last=ids.at(-1)||a.last;pages++;onCheckpoint(snapshot());
   }
  }
  const summaries=new Map(),mempool=[];
  for(const a of state.addresses){
   const summary=await read('/address/'+encodeURIComponent(a.address));summaries.set(a.address,summary);
   const found=new Set(state.transactions.filter(tx=>tx.vin?.some(v=>v.prevout?.scriptpubkey_address===a.address)||tx.vout?.some(v=>v.scriptpubkey_address===a.address)).map(tx=>tx.txid));
   if(found.size!==count(summary.chain_stats?.tx_count))issues.push('history-count-mismatch');
   const pending=await read('/address/'+encodeURIComponent(a.address)+'/txs/mempool');
   if(!Array.isArray(pending)||pending.length>50||pending.some(tx=>tx.status?.confirmed!==false))throw Error('invalid-mempool');
   if(pending.length>=50||pending.length!==count(summary.mempool_stats?.tx_count))issues.push('mempool-incomplete');mempool.push(...pending);
  }
  // Verify every referenced block is canonical; no old+new reorg facts are merged.
  const blocks=new Map();
  for(const tx of state.transactions){const h=String(count(tx.status.block_height)),b=hash(tx.status.block_hash);if(blocks.has(h)&&blocks.get(h)!==b)throw Error('reorg');blocks.set(h,b);}
  for(const [height,b] of blocks)if(hash((await read('/block-height/'+height,false)).trim())!==b)throw Error('reorg');
  const normalized=bitcoinHistoryEvents(state.transactions,state.wallets,{source:endpoint,observedAt});issues.push(...normalized.issues);
  const pending=bitcoinHistoryEvents(mempool,state.wallets,{source:endpoint,observedAt});
  for(const w of state.wallets)if(w.scanSatoshis!==undefined){
   const total=w.addresses.reduce((sum,address)=>{const s=summaries.get(address);return sum+raw(s.chain_stats.funded_txo_sum)-raw(s.chain_stats.spent_txo_sum)+raw(s.mempool_stats.funded_txo_sum)-raw(s.mempool_stats.spent_txo_sum);},0n);
   if(total.toString()!==w.scanSatoshis)issues.push('hd-scanner-mismatch');
  }
  const observations=[];
  for(const accountId of normalized.accounts){
   let sum=0n;
   for(const [address,summary] of summaries){const owner=ownersFor(state.wallets).owners.get(address);if(owner!==accountId)continue;
    const c=summary.chain_stats,m=summary.mempool_stats;sum+=raw(c.funded_txo_sum)-raw(c.spent_txo_sum);
    // Exercise the current scanner on exactly the same summary; only its API-boundary Number is compared.
    const scanner=await btcBalance(address,async()=>({ok:true,status:200,json:async()=>summary}));
    const expected=raw(c.funded_txo_sum)-raw(c.spent_txo_sum)+raw(m.funded_txo_sum)-raw(m.spent_txo_sum);
    if(scanner!==Number(expected)/1e8)issues.push('scanner-mismatch');
   }
   observations.push({...identity(accountId),quantityBaseUnits:sum.toString(),blockHeight:state.tip.height,blockHash:state.tip.hash,source:endpoint});
  }
  if(JSON.stringify(await tip())!==JSON.stringify(state.tip))throw Error('tip-changed-restart-required');
  const streams=normalized.accounts.map(accountId=>({...identity(accountId),throughBlock:state.tip.height,opening:{quantityBaseUnits:'0',beforeBlock:'0',source:'esplora-terminal-pages-and-counts'},coverage:{status:issues.length?'partial':'verified',fromBlock:'0',toBlock:state.tip.height,tipHash:state.tip.hash,source:endpoint}}));
  let replay=replayWalletHistory({events:normalized.events,streams});
  const reconciliation=reconcileWalletHistory(replay,observations);
  if(reconciliation.some(r=>r.status!=='verified')){
   issues.push('reconciliation-mismatch');for(const s of streams)s.coverage.status='partial';replay=replayWalletHistory({events:normalized.events,streams});
  }
  return {...normalized,coverage:issues.length?'partial':'verified',issues:[...new Set(issues)].sort(),replay,reconciliation,mempool:pending,resume:null,tip:state.tip};
 }catch(error){
  const code=error.name==='AbortError'?'aborted':/kein Verlauf gefunden|Adress.*typ/.test(error.message)?'hd-address-type-unknown':/Gap Limit/.test(error.message)?'hd-gap-incomplete':/^(http-\d+|timeout|body-timeout|page-limit|reorg|tip-changed-restart-required|unsupported-taproot|rate-limit-wait-required|invalid-[a-z-]+|nonadvancing-page|conflicting-transaction|unsafe-satoshis)$/.test(error.message)?error.message:'provider-or-hd-error';
  return {coverage:code==='unsupported-taproot'?'unsupported':'partial',issues:[code],replay:null,resume:snapshot(),tip:state.tip};
 }
}
