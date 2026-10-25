import {requestJSON,TTL} from './request-cache.js';

export const DEFAULT_SOL_RPC='https://solana-rpc.publicnode.com';
export const SOLANA_PUBLIC_FALLBACK='https://api.mainnet.solana.com';
const mainnetPublic=new Set([DEFAULT_SOL_RPC,SOLANA_PUBLIC_FALLBACK]);
export function solanaRpcEndpoints(configured=DEFAULT_SOL_RPC){
 const primary=String(configured||DEFAULT_SOL_RPC).trim();
 let url;
 try{url=new URL(primary);}catch{throw Error('Solana-RPC-Adresse ist ungültig.');}
 if(url.protocol!=='https:'||url.username||url.password||url.hash)throw Error('Solana-RPC muss HTTPS ohne Zugangsdaten oder Fragment nutzen.');
 // A deliberately configured private RPC is NEVER silently redirected to a public provider.
 return mainnetPublic.has(url.toString())||mainnetPublic.has(primary)
  ? [url.toString(),...(primary===DEFAULT_SOL_RPC?[SOLANA_PUBLIC_FALLBACK]:[DEFAULT_SOL_RPC])]
  : [url.toString()];
}
/** A failed request is not an observed zero. 403, 429, invalid payloads and timeouts may fail over.
 * Do not use this for sending transactions (only read-only methods are whitelisted).
 */
export async function solanaRpcRead(configured,method,params,fetcher=globalThis.fetch,options={}){
 if(options.history===true)return historyRead(configured,method,params,fetcher,options);
 if(!['getBalance','getTokenAccountsByOwner','getProgramAccounts','getAccountInfo'].includes(method))throw Error('Solana-RPC-Methode nicht für Watch-only freigegeben.');
 const endpoints=solanaRpcEndpoints(configured),issues=[];
 for(const endpoint of endpoints){
  try{
   const data=await requestJSON(endpoint,{fetcher,method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),ttlMs:TTL.wallet,attempts:1,timeoutMs:8500});
   // An upstream JSON-RPC error can echo the configured RPC URL including its API key.
   if(data?.error){const code=Number(data.error.code);throw Error('Solana-RPC meldet einen Fehler'+(Number.isInteger(code)?' (Code '+code+')':'')+'.');}
   if(!data||!Object.hasOwn(data,'result')||data.result===null)throw Error('Unvollständige JSON-RPC-Antwort.');
   const result=data.result;
   if(method==='getBalance'&&(!Number.isSafeInteger(result?.value)||result.value<0))throw Error('Solana-Rohsaldo unvollständig.');
   if(method==='getTokenAccountsByOwner'&&!Array.isArray(result?.value))throw Error('Solana-Tokenkonten unvollständig.');
   if(method==='getProgramAccounts'&&!Array.isArray(result))throw Error('Solana-Stake-Accounts unvollständig.');
   if(method==='getAccountInfo'&&(typeof result!=='object'||!Object.hasOwn(result,'value')))throw Error('Solana-Stake-Kontodaten unvollständig.');
   // Preserve provider attribution, never expose the secret-bearing RPC path/query.
   return {result,provider:new URL(endpoint).hostname,fallback:endpoint!==endpoints[0]};
  }catch(e){issues.push(new URL(endpoint).hostname+': '+String(e.message||e).slice(0,130));}
 }
 throw Error('Solana-RPC-Abfrage fehlgeschlagen ('+method+'): '+issues.join(' / '));
}

/** Historical reads are opt-in and never fall over to a different archive mid-session. */
async function historyRead(configured,method,params,fetcher,{signal,timeoutMs=15000,retries=1}){
 const allowed=['getSignaturesForAddress','getTransaction','getSlot','getBlock','getGenesisHash','getBalance','getTokenAccountsByOwner'];
 if(!allowed.includes(method))throw Error('history-method-denied');
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000||!Number.isInteger(retries)||retries<0||retries>2)throw Error('invalid-history-limits');
 const endpoint=solanaRpcEndpoints(configured)[0];
 for(let attempt=0;;attempt++){
  if(signal?.aborted){const e=Error('aborted');e.name='AbortError';throw e;}
  const controller=new AbortController();const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});let timer;
  try{
   const expired=new Promise((_,reject)=>{timer=setTimeout(()=>{reject(Error('timeout'));controller.abort();},timeoutMs);controller.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});});
   const response=await Promise.race([fetcher(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error'}),expired]);
   if(!response.ok){const e=Error('http-'+response.status);e.retryable=response.status===429||response.status>=500;e.wait=response.headers?.get('Retry-After');throw e;}
   const data=await Promise.race([response.json(),expired]);
   if(data?.error)throw Error('rpc-history-error');if(!data||!Object.hasOwn(data,'result'))throw Error('rpc-history-missing');
   return {result:data.result,provider:new URL(endpoint).hostname,fallback:false};
  }catch(e){if(signal?.aborted){const err=Error('aborted');err.name='AbortError';throw err;}
   if(!e.retryable||attempt>=retries)throw Error(/^(http-\d+|timeout|aborted|rpc-history-[a-z]+)$/.test(e.message)?e.message:'history-provider-error');
   const wait=e.wait==null?250:Number(e.wait)*1000;if(!Number.isFinite(wait)||wait>5000)throw Error('rate-limit-wait-required');await new Promise(r=>setTimeout(r,Math.max(0,wait)));
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 }
}
