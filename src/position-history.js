import {requestJSON,TTL} from './request-cache.js';
import {units,exact,preciseValue} from './decimal.js';
import {valueSign} from './defi.js';

export const POSITION_PERIODS=Object.freeze([[7,'7 T'],[30,'1 M'],[90,'3 M'],[365,'1 J']]);
const allowed=new Set(POSITION_PERIODS.map(([days])=>days));
const isoFromMs=ms=>new Date(ms).toISOString().slice(0,10);
const finitePositive=n=>Number.isFinite(n)&&n>0;
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
 if(!['etf','stock','fund'].includes(p.kind)||!settings.twelveKey)return null;
 const symbol=String(p.symbol||'').trim().toUpperCase(),exchange=String(p.exchange||'').trim(),mic=String(p.mic||'').trim().toUpperCase();
 if(!/^[A-Z0-9./^_-]{1,32}$/.test(symbol)||(!exchange&&!mic)||!/^[A-Z]{3}$/.test(String(p.currency||'')))return null;
 return {kind:'security',symbol,exchange,mic,currency:p.currency};
}
export async function fetchPositionMarketHistory(p,settings={},days=30,fetcher=globalThis.fetch){
 if(!allowed.has(days))throw Error('Ungültiger Kurszeitraum.');
 const capability=marketHistoryCapability(p,settings);
 if(!capability)throw Error('Keine bestätigte historische Kursquelle eingerichtet.');
 let rows=[],currency='EUR',source='';
 if(capability.kind==='crypto'){
  const url=new URL('https://api.coingecko.com/api/v3/coins/'+encodeURIComponent(capability.id)+'/market_chart');
  url.searchParams.set('vs_currency','eur');url.searchParams.set('days',String(days));
  const headers=settings.coinGeckoKey?{'x-cg-demo-api-key':settings.coinGeckoKey}:{};
  const data=await requestJSON(url.toString(),{fetcher,headers,ttlMs:TTL.history});
  if(!Array.isArray(data?.prices)||data.prices.length<2)throw Error('CoinGecko hat keine ausreichenden historischen Kurse geliefert.');
  rows=data.prices.map(([timestamp,price])=>({timestamp:Number(timestamp),price:Number(price)}));
  source='CoinGecko';currency='EUR';
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
 const from=isoFromMs(Date.now()-(days+2)*864e5);
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
