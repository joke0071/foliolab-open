import {requestJSON} from './request-cache.js';
import {knownReferenceListing} from './reference-listings.js';

// Four EUR/XETRA mappings proven with SYMBOL_SEARCH + real daily responses.
// See docs/ETF_266_REAL_PROVIDER_PROOF_2026-11-01.md on the checkpoint branch.
// Never substitute FRK/LON, guess a suffix, or silently use adjusted close.
export function alphaListing(position){
 const listing=knownReferenceListing(position);
 if(!listing||position.currency!=='EUR'||position.mic!=='XETR'||position.isin!==listing.isin)
  throw Error('Alpha Vantage benötigt eine bestätigte ETF-ISIN, EUR und MIC XETR der unterstützten Referenznotierung.');
 return listing.symbol+'.DEX';
}
const DB='foliolab-open-market-cache',STORE='cache';
const day=now=>new Date(now).toISOString().slice(0,10);
const dayEnd=now=>Date.parse(day(now)+'T00:00:00Z')+86400000;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const failure=()=>Error('Lokaler Kurscache nicht verfügbar. Alpha-Vantage-Abfragen wurden zum Schutz des Tageslimits nicht gestartet.');

// Disposable quotes and hashed-key budgets live outside the canonical financial
// record. Read-only diagnostics never change its bytes or CAS revision.
export function alphaCache(factory=globalThis.indexedDB){
 async function open(){
  if(!factory)throw failure();
  return new Promise((resolve,reject)=>{
   let settled=false;const request=factory.open(DB,1);
   const timer=setTimeout(()=>{settled=true;reject(failure());},5000);
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
   request.onblocked=request.onerror=()=>{clearTimeout(timer);settled=true;reject(failure());};
   request.onsuccess=()=>{clearTimeout(timer);if(settled){request.result.close();return;}request.result.onversionchange=()=>request.result.close();resolve(request.result);};
  });
 }
 async function update(key,change){
  const db=await open();
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),request=store.get(key);let result,error;
   request.onsuccess=()=>{try{result=change(request.result);store.put(result,key);}catch(e){error=e;tx.abort();}};
   tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(error||failure());tx.onerror=()=>{};
  });}finally{db.close();}
 }
 async function read(key){
  const db=await open();
  try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).get(key);let result;
   request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(failure());tx.onerror=()=>{};
  });}finally{db.close();}
 }
 async function clear(){
  const db=await open();
  try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=resolve;tx.onabort=()=>reject(failure());tx.onerror=()=>{};});}finally{db.close();}
 }
 return {read,update,clear};
}
export async function clearAlphaCache(){if(globalThis.indexedDB)await alphaCache().clear();}
export async function alphaKeyId(key){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(key)));
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
export function reserveAlphaBudget(old,now){
 const current=old?.day===day(now)?old:{day:day(now),used:0,nextAt:0,blockedUntil:0};
 if(!Number.isInteger(current.used)||current.used<0||current.used>25||!Number.isFinite(current.nextAt)||!Number.isFinite(current.blockedUntil))throw failure();
 if(current.used>=25||current.blockedUntil>now)throw Error('Alpha Vantage: Anfragelimit erreicht. Gespeicherte Kurse bleiben erhalten; später erneut versuchen.');
 const scheduledAt=Math.max(now,current.nextAt);
 if(scheduledAt-now>15000)throw Error('Alpha Vantage ist bereits ausgelastet. Bitte später erneut versuchen.');
 return {...current,used:current.used+1,scheduledAt,nextAt:scheduledAt+2500};
}
export function parseAlphaDaily(data,symbol){
 if(data?.Information||data?.Note){
  const text=String(data.Information||data.Note),error=Error(/premium|subscription/i.test(text)&&!/limit|per second|per day/i.test(text)?
   'Alpha Vantage: Tarif oder Zugang unterstützt diese Abfrage nicht.':'Alpha Vantage: Anfragelimit erreicht. Gespeicherte Kurse bleiben erhalten.');
  error.cooldown=/per second|burst|sparingly/i.test(text)?60000:86400000;throw error;
 }
 if(data?.['Error Message'])throw Error('Alpha Vantage liefert keine Daten der bestätigten Notierung.');
 const meta=data?.['Meta Data'];
 if(meta?.['2. Symbol']!==symbol)throw Error('Alpha-Vantage-Symbol stimmt nicht mit der bestätigten Xetra-Notierung überein.');
 if(meta.currency&&meta.currency!=='EUR')throw Error('Alpha-Vantage-Kurswährung stimmt nicht mit EUR überein.');
 const rows=data['Time Series (Daily)'];
 if(!rows||typeof rows!=='object'||Array.isArray(rows))throw Error('Alpha Vantage liefert keine tägliche Kursreihe.');
 const points=[];
 for(const [date,row]of Object.entries(rows)){
  const total=Number(row?.['4. close']);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||!Number.isFinite(total)||total<=0||total>1e9)
   throw Error('Alpha Vantage liefert ungültige Tageskurse.');
  points.push({date,total});
 }
 points.sort((a,b)=>a.date.localeCompare(b.date));
 if(!points.length||points.length>100||meta['3. Last Refreshed']?.slice(0,10)!==points.at(-1).date)throw Error('Alpha-Vantage-Kursdatum oder kompakte Kursreihe ist ungültig.');
 return {points,source:'Alpha Vantage · Xetra EOD',quality:'configured-listing',verifiedSymbol:symbol};
}
export function createAlphaClient({store=alphaCache(),clock=()=>Date.now(),pause=wait,fetcher=globalThis.fetch}={}){
 const pending=new Map();let tail=Promise.resolve();
 async function load(position,key,search=false){
  const symbol=search?String(position).trim():alphaListing(position);
  if(search&&(symbol.length<2||symbol.length>120||/[<>\\\u0000-\u001f]/.test(symbol)))throw Error('Ungültige Wertpapiersuche.');
  const parse=search?parseAlphaSearch:parseAlphaDaily;
  if(typeof key!=='string'||!key.trim())throw Error('Eigener Alpha-Vantage-Schlüssel fehlt.');
  const id=await alphaKeyId(key),cacheKey=(search?'search:':'daily:')+symbol,budgetKey='budget:'+id;
  const existing=await store.read(cacheKey);
  if(existing?.day===day(clock()))return {...parse(existing.data,symbol),cached:true};
  const activeKey=id+':'+cacheKey;
  if(pending.has(activeKey))return structuredClone(await pending.get(activeKey));
  const job=tail.catch(()=>{}).then(async()=>{
   const saved=await store.read(cacheKey);
   if(saved?.day===day(clock()))return {...parse(saved.data,symbol),cached:true};
   const reservation=await store.update(budgetKey,old=>reserveAlphaBudget(old,clock()));
   const delay=reservation.scheduledAt-clock();if(delay>0)await pause(delay);
   const url=new URL('https://www.alphavantage.co/query');
   url.search=new URLSearchParams(search?{function:'SYMBOL_SEARCH',keywords:symbol,apikey:key}:{function:'TIME_SERIES_DAILY',symbol,outputsize:'compact',apikey:key});
   try{
    const data=await requestJSON(url.toString(),{fetcher,ttlMs:0,attempts:1});
    const result=parse(data,symbol);
    // Never persist arbitrary provider fields (an upstream payload could echo a
    // credential). Retain only validated public symbol/date/raw-close values.
    const cachedData=search?{bestMatches:result.results.map(p=>({'1. symbol':p.symbol+'.DEX','2. name':p.name,'3. type':p.type,'4. region':'XETRA','8. currency':p.currency}))}:{'Meta Data':{'2. Symbol':symbol,'3. Last Refreshed':result.points.at(-1).date},
     'Time Series (Daily)':Object.fromEntries(result.points.map(p=>[p.date,{'4. close':String(p.total)}]))};
    if(JSON.stringify(cachedData).includes(key))throw Error('Unerwartete Zugangsdaten in der Anbieterantwort.');
    await store.update(cacheKey,()=>({day:day(clock()),data:cachedData}));
    return {...result,cached:false};
   }catch(error){
    if(error.cooldown)await store.update(budgetKey,old=>({...old,blockedUntil:Math.min(dayEnd(clock()),clock()+error.cooldown)}));
    throw error;
   }finally{
    // A slow response must not consume the inter-request gap. The next queued
    // request (including after reload) waits from completion, not from start.
    const finishedAt=clock();
    await store.update(budgetKey,old=>{
     if(!old||!Number.isFinite(old.nextAt))throw failure();
     return {...old,nextAt:Math.max(old.nextAt,finishedAt+2500)};
    });
   }
  });
  tail=job;pending.set(activeKey,job);
  try{return structuredClone(await job);}finally{pending.delete(activeKey);}
 }
 return {load:(position,key)=>load(position,key),search:(term,key)=>load(term,key,true)};
}
const clients=new WeakMap();
export async function alphaVantageBars(position,key,fetcher=globalThis.fetch){
 if(!clients.has(fetcher))clients.set(fetcher,createAlphaClient({fetcher}));
 return clients.get(fetcher).load(position,key);
}


/** Only explicit XETRA + .DEX + currency evidence establishes this venue.
 * Other regional hits do not establish a MIC and are not guessed. */
export function parseAlphaSearch(data){
 if(data?.Information||data?.Note||data?.['Error Message'])parseAlphaDaily(data,'');
 if(!Array.isArray(data?.bestMatches)||data.bestMatches.length>100)throw Error('Alpha Vantage liefert keine gültige Suchliste.');
 const seen=new Map();
 for(const row of data.bestMatches){
  const providerSymbol=String(row?.['1. symbol']||'').trim(),name=String(row?.['2. name']||'').trim(),type=String(row?.['3. type']||'').trim();
  const currency=String(row?.['8. currency']||'').trim();
  if(String(row?.['4. region']||'').trim()!=='XETRA'||!/^([A-Z0-9_-]{1,30})\.DEX$/.test(providerSymbol)||!name||name.length>140||/[\u0000-\u001f<>]/.test(name)||!/^[A-Z]{3}$/.test(currency)||!['ETF','Equity','Mutual Fund'].includes(type))continue;
  const p={source:'alpha',symbol:providerSymbol.slice(0,-4),name,type,currency,exchange:'Xetra',mic:'XETR',isin:'',eodhdSymbol:providerSymbol.slice(0,-4)+'.XETRA',fmpSymbol:''};
  const id=p.symbol+'|'+p.currency;
  if(seen.has(id)&&JSON.stringify(seen.get(id))!==JSON.stringify(p))throw Error('Widersprüchliche Alpha-Vantage-Suchtreffer.');
  seen.set(id,p);
 }
 return {results:[...seen.values()]};
}
export async function alphaVantageSearch(term,key,fetcher=globalThis.fetch){
 if(!clients.has(fetcher))clients.set(fetcher,createAlphaClient({fetcher}));
 return clients.get(fetcher).search(term,key);
}
