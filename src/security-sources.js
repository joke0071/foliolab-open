/**
 * Privacy-first, provider-specific market data. No silent ticker guessing, no
 * cross-currency substitution, no proxy scraping or third-party shared keys.
 * EODHD: confirmed SYMBOL.EXCHANGE, EOD close; FMP: explicit feed symbol and
 * matching exchange; Twelve Data: existing strict listing verification.
 */
import {requestJSON,TTL} from './request-cache.js';
import {enhanceKnownReferenceListing,referenceSearch} from './reference-listings.js';
import {configuredMarketWorker,fetchWorkerEodhdBars} from './eodhd-worker-client.js';
import {securityQuote} from './market.js';
import {alphaVantageBars,alphaListing,withProviderAccess} from './alpha-vantage.js';

const symbolPattern=/^[A-Z0-9^._/-]{1,45}$/i;
const dayPattern=/^\d{4}-\d{2}-\d{2}$/;
const micForExchange=Object.freeze({XETR:'XETRA',XETRA:'XETRA',XFRA:'F',FRANKFURT:'F',XNAS:'US',XNYS:'US'});
const futureLimitMs=864e5;
function cleanSymbol(value){const s=String(value||'').trim().toUpperCase();return symbolPattern.test(s)?s:null;}
function dateString(value){
 if(typeof value==='number'&&Number.isFinite(value)){const ms=value<1e12?value*1000:value;return new Date(ms).toISOString().slice(0,10);}
 const text=String(value||'');
 const valueDate=/^\d{4}-\d{2}-\d{2}/.test(text)?text.slice(0,10):null;
 return valueDate&&dayPattern.test(valueDate)&&!Number.isNaN(Date.parse(valueDate))&&new Date(valueDate+'T12:00:00Z').toISOString().slice(0,10)===valueDate?valueDate:null;
}
function verifiedDate(value,now=Date.now()){
 const date=dateString(value);
 if(!date)throw Error('Kursquelle lieferte kein verwertbares Kursdatum.');
 const ts=Date.parse(date+'T12:00:00Z');
 if(ts>now+futureLimitMs||now-ts>8*864e5)throw Error('Kursdatum '+date+' ist nicht aktuell genug – Bestand unverändert.');
 return date;
}
function priceNumber(v){const n=Number(v);if(!Number.isFinite(n)||n<=0||n>1e9)throw Error('Ungültiger oder unplausibler Börsenkurs.');return n;}
function listingInfo(p){
 const symbol=cleanSymbol(p?.symbol),currency=String(p?.currency||'').trim().toUpperCase();
 const exchange=String(p?.exchange||'').trim().toUpperCase(),mic=String(p?.mic||'').trim().toUpperCase();
 if(!symbol||!/^[A-Z]{3}$/.test(currency)||(!exchange&&!mic))throw Error('Ticker, bestätigter Handelsplatz und Kurswährung fehlen.');
 const xetra=value=>['XETR','XETRA'].includes(value);
 if(mic&&exchange&&xetra(mic)!==xetra(exchange))throw Error('Handelsplatz und Börsen-MIC widersprechen sich.');
 const reference=currency==='EUR'&&(xetra(mic)||xetra(exchange))&&p.kind==='etf'?referenceSearch(symbol).find(x=>x.symbol===symbol):null;
 if(reference&&p.isin&&String(p.isin).trim().toUpperCase()!==reference.isin)throw Error('ISIN widerspricht der bestätigten Xetra-Referenznotierung.');
 return {symbol,currency,exchange,mic};
}
function configuredEodhd(p){
 const l=listingInfo(p),manual=cleanSymbol(p.eodhdSymbol);
 if(p.eodhdSymbol&&!manual)throw Error('EODHD-Symbol ungültig.');
 if(manual&&!manual.includes('.'))throw Error('EODHD benötigt SYMBOL.BÖRSE (z. B. VWCE.XETRA).');
 if(manual&&manual.split('.')[0]!==l.symbol)throw Error('EODHD-Ticker weicht vom Positionsticker ab.');
 if(manual)return manual;
 const exchangeSuffix=micForExchange[l.mic]||micForExchange[l.exchange];
 return exchangeSuffix?l.symbol+'.'+exchangeSuffix:null;
}
function configuredFmp(p){
 const l=listingInfo(p);
 if(!p.fmpSymbol)return null;
 const symbol=cleanSymbol(p.fmpSymbol);
 if(!symbol)throw Error('FMP-Ticker ungültig.');
 if(symbol!==l.symbol&&!symbol.startsWith(l.symbol+'.'))throw Error('FMP-Ticker gehört nicht zum Positionssymbol.');
 return symbol;
}
/** Read-only provider plan: every configured source has an explicit outcome. */
export function marketSourcePlan(position,settings={}){
 const p=enhanceKnownReferenceListing(position);listingInfo(p);
 const plan=[];
 if(settings.alphaVantageKey){
  let reason='';try{alphaListing(p);}catch(e){reason=e.message;}
  plan.push({source:'alpha',ready:!reason,reason});
 }
 if(settings.fmpKey){
  let reason='';try{if(!configuredFmp(p))reason='FMP-Börsenticker fehlt. Notierung in der Position bestätigen.';}catch(e){reason=e.message;}
  plan.push({source:'fmp',ready:!reason,reason});
 }
 if(settings.twelveKey)plan.push({source:'twelve',ready:true,reason:''});
 if(settings.eodhdKey||settings.eodhdWorkerEndpoint||settings.eodhdWorkerAccessToken){
  let reason='';try{
   if(!configuredMarketWorker(settings))reason='Direkter EODHD-Abruf deaktiviert (Browser/CORS). Optional eigenen Worker einrichten oder FMP/Twelve Data verwenden.';
   else if(!configuredEodhd(p))reason='EODHD-Börsenzuordnung fehlt.';
  }catch(e){reason=e.message;}
  plan.push({source:'eodhd',ready:!reason,reason});
 }
 const preferred=String(settings.securitySource||'auto');
 if(preferred==='auto')return plan;
 if(!['alpha','eodhd','fmp','twelve'].includes(preferred))throw Error('Ungültige Wertpapier-Datenquelle.');
 return plan.filter(x=>x.source===preferred);
}
export function marketSourceOptions(p,settings={}){return marketSourcePlan(p,settings).filter(x=>x.ready).map(x=>x.source);}
function initialFailures(p,settings){return marketSourcePlan(p,settings).filter(x=>!x.ready).map(x=>x.source+': nicht versucht – '+x.reason);}
const exchangeIdentity=value=>{const text=String(value||'').trim().toUpperCase();return ['XETR','XETRA'].includes(text)?'XETR':text;};
function validateCurrency(data,expected){
 if(data?.currency&&String(data.currency).toUpperCase()!==expected)throw Error('Währung des Kurses stimmt nicht mit der Position überein.');
}
function validateIdentity(symbol,requested){if(String(symbol||'').toUpperCase()!==requested)throw Error('API-Symbol stimmt nicht mit der gewählten Notierung überein.');}
async function eodhdBars(p,settings,days,fetcher){
 const sym=configuredEodhd(p);
 if(!sym)throw Error('EODHD-Börsencode fehlt; bitte Xetra/MIC bestätigen oder EODHD-Symbol eintragen.');
 const to=new Date().toISOString().slice(0,10);
 const from=new Date(Date.now()-(days+12)*864e5).toISOString().slice(0,10);
 // No direct browser fallback: a configured, user-owned worker is optional.
 if(!configuredMarketWorker(settings))throw Error('EODHD benötigt den optionalen eigenen Worker.');
 const res=await fetchWorkerEodhdBars(sym,from,to,settings,fetcher);
 const source='EODHD · eigener Worker';
 if(!Array.isArray(res)||res.length===0)throw Error('EODHD liefert keine Börsenkurse für '+sym+'.');
 const points=parseBars(res,p.currency);
 return {points,source,verifiedSymbol:sym,quality:'configured-listing'};
}
async function fmpBars(p,settings,days,fetcher){
 const l=listingInfo(p),sym=configuredFmp(p);
 if(!sym)throw Error('Bitte den FMP-Börsenticker in der Position ausdrücklich zuordnen.');
 const url=new URL('https://financialmodelingprep.com/stable/historical-price-eod/non-split-adjusted');
 url.searchParams.set('symbol',sym);url.searchParams.set('from',new Date(Date.now()-(days+12)*864e5).toISOString().slice(0,10));url.searchParams.set('to',new Date().toISOString().slice(0,10));url.searchParams.set('apikey',settings.fmpKey);
 const data=await requestJSON(url.toString(),{fetcher,ttlMs:TTL.history,attempts:1});
 if(!Array.isArray(data)||!data.length)throw Error('FMP liefert keine historischen Kurse. Tarif und Notierungsabdeckung prüfen.');
 const points=parseBars(data,p.currency,sym);
 return {points,source:'Financial Modeling Prep · unadjusted EOD',verifiedSymbol:sym,quality:'configured-listing'};
}
function parseBars(input,currency,expectedSymbol=null){
 const dates=new Map();
 for(const row of input){
  if(expectedSymbol&&row?.symbol)validateIdentity(row.symbol,expectedSymbol);
  validateCurrency(row,currency);
  const date=dateString(row?.date),price=Number(row?.close);
  if(!date||!Number.isFinite(price)||price<=0||price>1e9)continue;
  if(dates.has(date)&&dates.get(date)!==price)throw Error('Widersprüchliche Schlusskurse am '+date+'.');
  dates.set(date,price);
 }
 const points=[...dates].sort(([a],[b])=>a.localeCompare(b)).map(([date,total])=>({date,total}));
 if(!points.length)throw Error('Keine gültigen Schlusskurse der konfigurierten Notierung.');
 return points;
}
async function twelveBars(p,settings,days,fetcher){
 const l=listingInfo(p),url=new URL('https://api.twelvedata.com/time_series');
 const params={symbol:l.symbol,exchange:l.mic?'':p.exchange||'',mic_code:p.mic||'',interval:'1day',adjust:'none',apikey:settings.twelveKey};
 if(days>365){
  params.start_date=new Date(Date.now()-(days+12)*864e5).toISOString().slice(0,10);
  params.end_date=new Date().toISOString().slice(0,10);
 }else params.outputsize=String(Math.min(500,days+12));
 for(const [key,val] of Object.entries(params))if(val)url.searchParams.set(key,val);
 const data=await requestJSON(url.toString(),{fetcher,ttlMs:TTL.history,attempts:1});
 if(data?.status==='error'||data?.code)throw Error(String(data.message||'Twelve Data nicht verfügbar.'));
 const meta=data?.meta||{};
 validateIdentity(meta.symbol,l.symbol);validateCurrency(meta,l.currency);
 if(l.exchange&&exchangeIdentity(meta.exchange)!==exchangeIdentity(l.exchange))throw Error('Twelve-Data-Handelsplatz stimmt nicht überein.');
 if(l.mic&&String(meta.mic_code||meta.mic||'').toUpperCase()!==l.mic)throw Error('Twelve-Data-Börsen-MIC stimmt nicht überein.');
 if(p.isin&&meta.isin&&String(meta.isin).toUpperCase()!==p.isin)throw Error('Twelve-Data-ISIN stimmt nicht überein.');
 if(!Array.isArray(data.values))throw Error('Keine Twelve-Data-Kursreihe.');
 const points=parseBars(data.values.map(v=>({date:v.datetime,close:v.close})),l.currency);
 return {points,source:'Twelve Data · verifizierte Notierung',quality:'verified-listing'};
}
export async function fetchSecurityHistory(p,settings={},days=30,fetcher=globalThis.fetch){
 if(![7,30,90,180,365,1096,1826].includes(days))throw Error('Ungültiger Börsenkurszeitraum.');
 p=enhanceKnownReferenceListing(p);
 const providers=marketSourceOptions(p,settings);
 if(!providers.length)throw Error('Keine konfigurierte historische Kurs-API. Lokaler CSV-Kursverlauf kann importiert werden. '+initialFailures(p,settings).join(' · '));
 const failures=[];
 for(const source of providers){
  try{
   return await withProviderAccess(source,p,settings,fetcher,'history',async()=>{
   let r;
   if(source==='alpha')r=await alphaVantageBars(p,settings.alphaVantageKey,fetcher);
   else if(source==='eodhd')r=await eodhdBars(p,settings,days,fetcher);
   else if(source==='fmp')r=await fmpBars(p,settings,days,fetcher);
   else r=await twelveBars(p,settings,days,fetcher);
   const from=new Date(Date.now()-(days+5)*864e5).toISOString().slice(0,10);
   const points=r.points.filter(item=>item.date>=from&&item.date<=new Date().toISOString().slice(0,10));
   if(points.length<2)throw Error('Zu wenige historische Kursdaten.');
   return {...r,kind:'market',currency:p.currency,priceType:'close',points,coverage:{from:points[0].date,to:points.at(-1).date,requestedDays:days}};
   });
  }catch(e){failures.push(source+': '+String(e.message).slice(0,100));}
 }
 throw Error('Historische Börsenkurse nicht abrufbar: '+failures.concat(initialFailures(p,settings)).join(' · '));
}
export async function fetchSecurityQuote(p,settings={},fetcher=globalThis.fetch){
 p=enhanceKnownReferenceListing(p);
 const providers=marketSourceOptions(p,settings);
 if(!providers.length)throw Error('Kein konfigurierter Kursanbieter mit gültiger Börsenzuordnung. '+initialFailures(p,settings).join(' · '));
 const failures=[];
 for(const source of providers){
  try{
   return await withProviderAccess(source,p,settings,fetcher,'quote',async()=>{
   const l=listingInfo(p);
   if(source==='alpha'){
    const result=await alphaVantageBars(p,settings.alphaVantageKey,fetcher),last=result.points.at(-1);
    return {price:priceNumber(last.total),asOf:verifiedDate(last.date),source:result.source,quality:result.quality,cached:result.cached};
   }
   if(source==='twelve'){
    const q=await securityQuote({symbol:l.symbol,exchange:p.exchange,mic:p.mic,currency:l.currency,isin:p.isin},settings.twelveKey,fetcher);
    return {...q,asOf:verifiedDate(q.asOf),source:'Twelve Data',quality:'verified-listing'};
   }
   if(source==='eodhd'){
    const result=await eodhdBars(p,settings,12,fetcher),last=result.points.at(-1);
    return {price:priceNumber(last.total),asOf:verifiedDate(last.date),source:result.source,quality:'configured-listing'};
   }
   const sym=configuredFmp(p);
   if(!sym)throw Error('FMP-Symbol nicht bestätigt.');
   const url=new URL('https://financialmodelingprep.com/stable/quote');url.searchParams.set('symbol',sym);url.searchParams.set('apikey',settings.fmpKey);
   const res=await requestJSON(url.toString(),{fetcher,ttlMs:TTL.security,attempts:1});
   if(!Array.isArray(res)||res.length!==1)throw Error('Mehrdeutige FMP-Kursantwort.');
   const item=res[0];
   validateIdentity(item.symbol,sym);validateCurrency(item,l.currency);
   if(!item.exchange||![l.exchange,l.mic].some(expected=>expected&&exchangeIdentity(item.exchange)===exchangeIdentity(expected)))throw Error('FMP-Handelsplatz weicht von der Position ab.');
   if(item.isin&&p.isin&&String(item.isin).toUpperCase()!==p.isin)throw Error('FMP-ISIN weicht ab.');
   return {price:priceNumber(item.price),asOf:verifiedDate(item.timestamp||item.date),source:'FMP',quality:'configured-listing'};
   });
  }catch(e){failures.push(source+': '+String(e.message).slice(0,120));}
 }
 throw Error('Kein sicher zuordenbarer aktueller Börsenkurs: '+failures.concat(initialFailures(p,settings)).join(' · '));
}
