/**
 * Shared in-memory HTTP response cache. No persistent API tokens or wallet information.
 * Each fetch implementation gets its own cache (also isolates mocks in tests).
 */
export const TTL=Object.freeze({security:180000,crypto:120000,fx:21600000,history:86400000,catalog:86400000,wallet:15000});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const parseRetryAfter=(value,now)=>{if(value==null)return 0;const seconds=Number(value);if(Number.isFinite(seconds))return Math.max(0,seconds*1000);const stamp=Date.parse(value);return Number.isFinite(stamp)?Math.max(0,stamp-now):0;};
const safeNetworkDiagnostic=(error,url,headers)=>{
 const message=String(error?.message||'').slice(0,180);
 const credentials=[];
 try{
  const address=new URL(String(url));
  for(const [name,value] of address.searchParams){
   if(/key|token|secret|password|auth|credential/i.test(name))credentials.push(value);
  }
 }catch{}
 for(const [name,value] of Object.entries(headers||{})){
  if(/key|token|secret|password|auth|credential/i.test(name))credentials.push(String(value));
 }
 // Do not forward URLs, query parameters or recognized credentials in an exception.
 // Keep innocuous provider diagnostics to preserve meaningful fallback behavior.
 if(!message||message.includes('://')||credentials.some(v=>v&&message.includes(v)))
  return 'Failed to fetch (Netzwerk-/CORS-Fehler).';
 return message;
};
export function createRequestCache({maxEntries=300,maxConcurrent=4,clock=()=>Date.now(),pause=delay,random=Math.random}={}){
 const entries=new Map(),pending=new Map();let active=0;const queue=[];
 const acquire=async()=>{if(active<maxConcurrent){active++;return;}await new Promise(resolve=>queue.push(resolve));};
 const release=()=>{active--;if(queue.length){active++;queue.shift()();}};
 const stats=()=>({entries:entries.size,pending:pending.size,active,queued:queue.length});
 function clear(){entries.clear();pending.clear();}
 async function request(url,{fetcher=globalThis.fetch,ttlMs=0,attempts=2,timeoutMs=13000,...options}={}){
   if(!/^https:\/\//.test(String(url)))throw Error('Nur sichere HTTPS-Datenquellen sind erlaubt.');
   const method=String(options.method||'GET').toUpperCase();
   const headers=options.headers||{};
   // In-memory only: the key may contain user credentials; never log or persist it.
   const key=JSON.stringify([String(url),method,options.body||'',Object.entries(headers).sort()]);
   const existing=entries.get(key);
   if(existing&&existing.expires>clock()){entries.delete(key);entries.set(key,existing);return structuredClone(existing.data);}
   if(existing)entries.delete(key);
   if(pending.has(key))return structuredClone(await pending.get(key));
   const job=(async()=>{
     await acquire();
     try{
       for(let attempt=0;attempt<attempts;attempt++){
         const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
         let response,requestError;
         try{response=await fetcher(url,{...options,signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error'});}
         catch(error){requestError=error;}
         finally{clearTimeout(timer);}
         if(requestError?.name==='AbortError')requestError=Error('Zeitüberschreitung beim Abruf.');
         const status=Number(response?.status??(response?.ok?200:0));
         const retryable=Boolean(requestError)||[408,429,500,502,503,504].includes(status);
         if(retryable&&attempt<attempts-1){
           const retryAfter=response?.headers?.get?.('Retry-After');
           const serverDelay=parseRetryAfter(retryAfter,clock());
           const wait=Math.max(serverDelay,Math.min(2000,250*2**attempt+random()*150));
           // Never violate a provider's Retry-After by silently truncating it.
           // A long cooldown should fail fast, not keep the interface busy for minutes.
           if(wait<=3500){await pause(wait);continue;}
         }
         // A browser/provider exception can include a full key-bearing request URL.
         // Never forward that untrusted diagnostic to UI, error history or logs.
         if(requestError)throw Error(safeNetworkDiagnostic(requestError,url,headers));
         if(!response?.ok)throw Error(status===429?'Ratenlimit erreicht – später erneut versuchen.':`Abruf fehlgeschlagen (HTTP ${status||'unbekannt'})`);
         let data;
         try{data=await response.json();}catch{throw Error('API lieferte keine gültigen JSON-Daten.');}
         // Upstream messages sometimes echo credentials. Provide a stable, safe status.
         if(data?.status==='error'||data?.status==='ERROR')throw Error('Datenanbieter meldet einen Fehler. API-Zugang und Tarif prüfen.');
         if(ttlMs>0){entries.set(key,{data:structuredClone(data),expires:clock()+ttlMs});while(entries.size>maxEntries)entries.delete(entries.keys().next().value);}
         return data;
       }
       throw Error('Datenquelle nicht erreichbar.');
     }finally{release();}
   })();
   pending.set(key,job);
   try{return structuredClone(await job);}finally{pending.delete(key);}
 }
 return {request,stats,clear};
}
const pools=new WeakMap();
export async function requestJSON(url,{fetcher=globalThis.fetch,...options}={}){
 if(typeof fetcher!=='function')throw Error('Ungültige Datenquelle.');
 if(!pools.has(fetcher))pools.set(fetcher,createRequestCache());
 return pools.get(fetcher).request(url,{fetcher,...options});
}
