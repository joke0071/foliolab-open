import {requestJSON,TTL} from './request-cache.js';
import {marketSourceOptions,fetchSecurityHistory} from './security-sources.js';
import {coinPaprikaHistoricalQuote,coinPaprikaMapping} from './crypto-fallbacks.js';
import {units,exact,preciseValue} from './decimal.js';
import {valueSign} from './defi.js';

export const POSITION_PERIODS=Object.freeze([[7,'7 T'],[30,'1 M'],[90,'3 M'],[365,'1 J']]);
const allowed=new Set(POSITION_PERIODS.map(([days])=>days));
const isoFromMs=ms=>new Date(ms).toISOString().slice(0,10);
const finitePositive=n=>Number.isFinite(n)&&n>0;
/**
 * The public CoinGecko limit is shared between quote and chart requests.
 * Use a single 365-day series per coin across UI time-range changes and pace
 * simultaneous on-demand history requests. A throttle does not bypass CORS,
 * provider quotas or blocked networks.
 */
const chartCoordinators=new WeakMap();
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function historyCoordinator(fetcher){
 let c=chartCoordinators.get(fetcher);
 if(!c){c={tail:Promise.resolve(),earliest:0,pending:new Map(),completed:new Map()};chartCoordinators.set(fetcher,c);}
 return c;
}
export async function coinGeckoHistoricalResponse(coinId,settings={},fetcher=globalThis.fetch){
 if(!/^[a-z0-9-]{2,100}$/.test(coinId))throw Error('CoinGecko-ID der Position ist ungültig.');
 const url=new URL('https://api.coingecko.com/api/v3/coins/'+encodeURIComponent(coinId)+'/market_chart');
 url.searchParams.set('vs_currency','eur');url.searchParams.set('days','365');
 const headers=settings.coinGeckoKey?{'x-cg-demo-api-key':settings.coinGeckoKey}:{};
 const id=url.toString()+'|'+(settings.coinGeckoKey||'');
 const c=historyCoordinator(fetcher);
 const cached=c.completed.get(id);
 if(cached?.expires>Date.now())return structuredClone(cached.data);
 if(cached)c.completed.delete(id);
 if(c.pending.has(id))return c.pending.get(id);
 const result=c.tail.then(async()=>{
  // Mocks are not throttled. Production history calls from all expanded
  // positions share a deliberately conservative rate limit.
  const spacing=fetcher===globalThis.fetch?(settings.coinGeckoKey?2500:8500):0;
  if(spacing)await wait(Math.max(0,c.earliest-Date.now()));
  c.earliest=Date.now()+spacing;
  try{
   const data=await requestJSON(url.toString(),{fetcher,headers,ttlMs:TTL.history,attempts:1});
   if(Array.isArray(data?.prices)&&data.prices.length>=2){
    c.completed.set(id,{data:structuredClone(data),expires:Date.now()+TTL.history});
    if(c.completed.size>80)c.completed.delete(c.completed.keys().next().value);
   }
   return data;
  }catch(error){
   if(/Ratenlimit|429|quota|rate limit/i.test(String(error?.message||'')))c.earliest=Math.max(c.earliest,Date.now()+30000);
   throw error;
  }
 });
 c.pending.set(id,result);
 c.tail=result.catch(()=>{});
 try{return await result;}
 finally{c.pending.delete(id);}
}

export function currentPositionValues(model){
 const values=Object.create(null);
 for(const p of model.positions){
  const q=p.quantityExact??p.quantity,price=p.priceExact??p.price;
  const fx=p.currency==='EUR'?'1':(p.fxRateExact??p.fxRate);
  values[p.id]=exact(units(preciseValue(q,price,fx))*BigInt(valueSign(p)));
 }
 return values;
}
export function recordedPositionHistory(model,positionId,days=30,now=Date.now()){
 if(!allowed.has(days))throw Error('Ungültiger Zeitraum.');
 const from=isoFromMs(now-(days-1)*864e5);
 return model.snapshots.filter(s=>s.date>=from&&s.date<=isoFromMs(now)&&s.source==='current'&&s.byPosition&&Object.hasOwn(s.byPosition,positionId))
   .map(s=>({date:s.date,total:Number(s.byPosition[positionId])}))
   .filter(p=>Number.isFinite(p.total)).sort((a,b)=>a.date.localeCompare(b.date));
}
export function marketHistoryCapability(p,settings={}){
 if(p.kind==='crypto'){
  return p.coinId&&/^[a-z0-9-]{2,100}$/.test(p.coinId)?{kind:'crypto',id:p.coinId}:null;
 }
 if(!['etf','stock','fund'].includes(p.kind))return null;
 try{
  return marketSourceOptions(p,settings).length?{kind:'security',symbol:p.symbol,currency:p.currency}:null;
 }catch{return null;}
}
export async function fetchPositionMarketHistory(p,settings={},days=30,fetcher=globalThis.fetch){
 if(!allowed.has(days))throw Error('Ungültiger Kurszeitraum.');
 const capability=marketHistoryCapability(p,settings);
 if(!capability)throw Error('Keine bestätigte historische Kursquelle eingerichtet.');
 if(capability.kind==='security')return fetchSecurityHistory(p,settings,days,fetcher);
 let rows=[],currency='EUR',source='';
 if(capability.kind==='crypto'){
  let primaryError=null;
  try{
   const data=await coinGeckoHistoricalResponse(capability.id,settings,fetcher);
   if(!Array.isArray(data?.prices)||data.prices.length<2)throw Error('CoinGecko hat keine ausreichenden historischen Kurse geliefert.');
   rows=data.prices.map(([timestamp,price])=>({timestamp:Number(timestamp),price:Number(price)}));
   if(rows.filter(x=>Number.isFinite(x.timestamp)&&finitePositive(x.price)).length<2)
    throw Error('CoinGecko-Historie enthält nicht genügend gültige Kurse.');
   source='CoinGecko';currency='EUR';
  }catch(e){primaryError=e;}
  if(primaryError){
   try{
    const pap=await coinPaprikaHistoricalQuote(p,fetcher);
    const from=isoFromMs(Date.now()-(days-1)*864e5),to=isoFromMs(Date.now());
    const points=pap.points.filter(x=>x.date>=from&&x.date<=to);
    if(points.length<2)throw Error('Im gewählten Zeitraum fehlen CoinPaprika-Kurstage.');
    return {...pap,points};
   }catch(fallbackError){
    const message=String(primaryError?.message||'');
    let cause=message;
    if(/Ratenlimit|429|quota|rate limit/i.test(message))cause='CoinGecko-Limit erreicht';
    else if(/401|403|Zugriff verweigert/i.test(message))cause='CoinGecko-Zugriff verweigert';
    else if(/Failed to fetch|NetworkError|Load failed|Zeitüberschreitung|fetch failed/i.test(message))cause='CoinGecko aus diesem Browser gerade nicht erreichbar (Netzwerk, CORS oder Sperre)';
    throw Error(cause+'. CoinPaprika-Fallback: '+String(fallbackError.message||fallbackError).slice(0,105));
   }
  }
 }else{
  const url=new URL('https://api.twelvedata.com/time_series');
  url.searchParams.set('symbol',capability.symbol);
  if(capability.exchange)url.searchParams.set('exchange',capability.exchange);
  if(capability.mic)url.searchParams.set('mic_code',capability.mic);
  url.searchParams.set('interval','1day');
  url.searchParams.set('outputsize',String(Math.min(500,days+12)));
  url.searchParams.set('apikey',settings.twelveKey);
  const data=await requestJSON(url.toString(),{fetcher,ttlMs:TTL.history});
  if(data?.status==='error'||data?.code)throw Error(String(data.message||'Twelve Data nicht verfügbar.').slice(0,140));
  const meta=data?.meta||{};
  if(String(meta.symbol||'').trim().toUpperCase()!==capability.symbol)throw Error('Ticker der historischen Kurse stimmt nicht überein.');
  if(String(meta.currency||'').trim().toUpperCase()!==capability.currency)throw Error('Währung der historischen Kurse stimmt nicht überein.');
  if(capability.exchange&&String(meta.exchange||'').trim().toUpperCase()!==capability.exchange.toUpperCase())throw Error('Handelsplatz der historischen Kurse nicht bestätigt.');
  if(capability.mic&&String(meta.mic_code||meta.mic||'').trim().toUpperCase()!==capability.mic)throw Error('Börsen-MIC der historischen Kurse nicht bestätigt.');
  if(p.isin&&meta.isin&&String(meta.isin).trim().toUpperCase()!==String(p.isin).trim().toUpperCase())throw Error('ISIN der historischen Kurse weicht von der Position ab.');
  if(!Array.isArray(data.values)||data.values.length<2)throw Error('Keine historischen Schlusskurse geliefert.');
  rows=data.values.map(v=>({timestamp:Date.parse(String(v.datetime)+'T12:00:00Z'),price:Number(v.close)}));
  source='Twelve Data · bestätigter Handelsplatz';currency=capability.currency;
 }
 const from=isoFromMs(Date.now()-((capability.kind==='crypto'?days-1:days+2))*864e5);
 const today=isoFromMs(Date.now());
 const byDay=new Map();
 for(const row of rows){
  if(!Number.isFinite(row.timestamp)||!finitePositive(row.price))continue;
  const date=isoFromMs(row.timestamp);
  if(date<from||date>today)continue;
  byDay.set(date,row.price);
 }
 const points=[...byDay].sort(([a],[b])=>a.localeCompare(b)).map(([date,total])=>({date,total}));
 if(points.length<2)throw Error('Nicht genügend verifizierte Kursdaten im gewählten Zeitraum.');
 return {points,currency,source,kind:'market'};
}
export function filterHistoryByDays(points,days,now=Date.now()){
 if(!allowed.has(days))throw Error('Ungültiger Zeitraum.');
 const from=isoFromMs(now-(days-1)*864e5),today=isoFromMs(now);
 return points.filter(p=>p.date>=from&&p.date<=today).sort((a,b)=>a.date.localeCompare(b.date));
}
