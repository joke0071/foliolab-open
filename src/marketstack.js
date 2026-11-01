import {requestJSON} from './request-cache.js';
import {alphaCache,alphaKeyId} from './alpha-vantage.js';
import {knownReferenceListing} from './reference-listings.js';

const day=now=>new Date(now).toISOString().slice(0,10);
const month=now=>day(now).slice(0,7);
const failure=message=>Object.assign(Error(message),{marketstack:true});
const cacheFailure=()=>failure('Lokaler Kurscache nicht verfügbar. Marketstack wurde zum Schutz des Monatskontingents nicht angefragt.');
export function marketstackListing(position){
 const reference=knownReferenceListing(position);
 if(!reference||position.currency!=='EUR'||position.mic!=='XETR'||position.isin!==reference.isin)
  throw failure('Marketstack benötigt eine bestätigte ETF-ISIN, EUR und MIC XETR der unterstützten Referenznotierung.');
 return {symbol:reference.symbol+'.DE',reference};
}
/** Conservative EOD refresh boundary; weekends reuse Friday's actual close.
 * Holidays remain actual provider dates, never invented trading observations. */
export function expectedMarketstackDate(now){
 const date=new Date(now);if(date.getUTCHours()<21)date.setUTCDate(date.getUTCDate()-1);
 while([0,6].includes(date.getUTCDay()))date.setUTCDate(date.getUTCDate()-1);
 return day(date.getTime());
}
export function reserveMarketstackBudget(old,now){
 const current=old?.month===month(now)?old:{month:month(now),used:0,nextAt:0,blockedUntil:0};
 if(!Number.isInteger(current.used)||current.used<0||current.used>100||!Number.isFinite(current.nextAt)||!Number.isFinite(current.blockedUntil))throw cacheFailure();
 if(current.used>=100)throw failure('Marketstack: lokales Monatskontingent von 100 Anfragen erreicht. Gespeicherte Kurse bleiben erhalten.');
 if(current.blockedUntil>now)throw failure('Marketstack: Anfragelimit erreicht. Bitte später erneut versuchen.');
 const scheduledAt=Math.max(now,current.nextAt);
 if(scheduledAt-now>10000)throw failure('Marketstack ist bereits ausgelastet. Bitte später erneut versuchen.');
 return {...current,used:current.used+1,scheduledAt,nextAt:scheduledAt+250};
}
export function parseMarketstackDaily(data,position,now=Date.now()){
 const {symbol,reference}=marketstackListing(position);
 if(data?.error){
  const limited=/limit|quota|too_many_requests/.test(String(data.error.code||''));
  throw failure(limited?'Marketstack: Anfragelimit erreicht. Gespeicherte Kurse bleiben erhalten.':'Marketstack: Zugang, Tarif oder Notierungsabdeckung nicht bestätigt.');
 }
 if(!Array.isArray(data?.data)||!data.data.length||data.data.length>1000)throw failure('Marketstack liefert keine gültigen Tageskurse.');
 if(data.pagination&&(Number(data.pagination.count)!==data.data.length||Number(data.pagination.total)!==data.data.length))throw failure('Marketstack-Kursreihe ist nicht vollständig geladen.');
 const dates=new Map();
 for(const row of data.data){
  if(row.symbol!==symbol||row.exchange!=='XETR'||row.price_currency!=='EUR'||typeof row.name!=='string'||row.name.length>250||!reference.name.test(row.name)||row.isin&&row.isin!==reference.isin)
   throw failure('Marketstack-Symbol, Fondsidentität, Handelsplatz oder Kurswährung weicht von der bestätigten Notierung ab.');
  const date=typeof row.date==='string'?row.date.slice(0,10):'',total=Number(row.close);
  if(!/^\d{4}-\d\d-\d\d$/.test(date)||!Number.isFinite(Date.parse(row.date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date>day(now)||!['string','number'].includes(typeof row.close)||!Number.isFinite(total)||total<=0||total>1e9)
   throw failure('Marketstack liefert ungültige Kursdaten.');
  if(dates.has(date)&&dates.get(date)!==total)throw failure('Widersprüchliche Marketstack-Schlusskurse am '+date+'.');
  dates.set(date,total);
 }
 return {points:[...dates].sort(([a],[b])=>a.localeCompare(b)).map(([date,total])=>({date,total})),source:'Marketstack · Xetra EOD',quality:'configured-listing',verifiedSymbol:symbol};
}
export function createMarketstackClient({store=alphaCache(),clock=()=>Date.now(),pause=ms=>new Promise(r=>setTimeout(r,ms)),fetcher=globalThis.fetch}={}){
 const pending=new Map();let tail=Promise.resolve();
 const read=async key=>{try{return await store.read(key);}catch{throw cacheFailure();}};
 const update=async(key,fn)=>{try{return await store.update(key,fn);}catch(e){if(e.marketstack)throw e;throw cacheFailure();}};
 async function cached(position,key){
  const record=await read(key);if(!record?.data)return null;
  let result;try{result=parseMarketstackDaily(record.data,position,clock());}catch{return null;}
  const expected=expectedMarketstackDate(clock());
  return record.target===expected||result.points.at(-1).date>=expected?{...result,cached:true}:null;
 }
 async function load(position,key){
  const {symbol,reference}=marketstackListing(position);
  if(typeof key!=='string'||!key.trim())throw failure('Eigener Marketstack-Schlüssel fehlt.');
  const id=await alphaKeyId(key),cacheKey='daily:marketstack:'+symbol,budgetKey='budget:marketstack:'+id;
  const existing=await cached(position,cacheKey);if(existing)return existing;
  const activeKey=id+':'+symbol;if(pending.has(activeKey))return structuredClone(await pending.get(activeKey));
  const job=tail.catch(()=>{}).then(async()=>{
   const saved=await cached(position,cacheKey);if(saved)return saved;
   const reservation=await update(budgetKey,old=>reserveMarketstackBudget(old,clock()));
   if(reservation.scheduledAt>clock())await pause(reservation.scheduledAt-clock());
   const url=new URL('https://api.marketstack.com/v2/eod');
   const target=expectedMarketstackDate(clock());
   // One symbol consumes one provider unit. A bounded shared daily series serves
   // quotes and history; no separate latest/metadata request or full-year paging.
   url.search=new URLSearchParams({access_key:key,symbols:symbol,exchange:'XETR',date_from:day(clock()-330*864e5),date_to:day(clock()),sort:'ASC',limit:'1000'});
   try{
    const data=await requestJSON(url.toString(),{fetcher,ttlMs:0,attempts:1});
    const result=parseMarketstackDaily(data,position,clock());
    // Retain validated public fields only; never arbitrary echoed credentials.
    const rows=result.points.map(p=>({symbol,exchange:'XETR',price_currency:'EUR',name:reference.label,date:p.date+'T00:00:00+0000',close:p.total}));
    await update(cacheKey,()=>({day:day(clock()),target,data:{data:rows}}));
    return {...result,cached:false};
   }catch(error){
    if(/Ratenlimit|Anfragelimit/.test(error.message))await update(budgetKey,old=>({...old,blockedUntil:clock()+60000}));
    throw error;
   }finally{
    await update(budgetKey,old=>({...old,nextAt:Math.max(old.nextAt,clock()+250)}));
   }
  });
  tail=job;pending.set(activeKey,job);
  try{return structuredClone(await job);}finally{pending.delete(activeKey);}
 }
 return {load};
}
const clients=new WeakMap();
export async function marketstackBars(position,key,fetcher=globalThis.fetch){
 if(!clients.has(fetcher))clients.set(fetcher,createMarketstackClient({fetcher}));
 return clients.get(fetcher).load(position,key);
}
