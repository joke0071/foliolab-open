/**
 * General on-demand security lookup. Results are EXCHANGE LISTINGS, not holdings
 * or valuations. No symbol-only guessing, auto-selection, built-in keys or proxy.
 *
 * EODHD search supports ISIN, fund name, ticker. FMP has separate name/symbol
 * and ISIN endpoints. Twelve symbol_search supports ticker/name; ISIN access
 * may require a separate paid data add-on.
 */
import {requestJSON,TTL} from './request-cache.js';
import {requestEodhdJSON} from './eodhd-transport.js';
const isinPattern=/^[A-Z]{2}[A-Z0-9]{10}$/;
const currencyPattern=/^[A-Z]{3}$/;
const tickerPattern=/^[A-Z0-9^._/-]{1,40}$/;
const marketMappings=Object.freeze({
 XETRA:['Xetra','XETR','XETR','XETRA'],
 XETR:['Xetra','XETR','XETR','XETRA'],
 NASDAQ:['NASDAQ','XNAS','NASDAQ','US'],
 XNAS:['NASDAQ','XNAS','NASDAQ','US'],
 NYSE:['NYSE','XNYS','NYSE','US'],
 XNYS:['NYSE','XNYS','NYSE','US'],
 FRANKFURT:['Frankfurt','XFRA','FWB','F'],XFRA:['Frankfurt','XFRA','FWB','F'],
 XAMS:['Euronext Amsterdam','XAMS','EURONEXT','AS'],AMSTERDAM:['Euronext Amsterdam','XAMS','EURONEXT','AS'],
 XPAR:['Euronext Paris','XPAR','EURONEXT','PA'],PARIS:['Euronext Paris','XPAR','EURONEXT','PA'],
 XLON:['London Stock Exchange','XLON','LSE','LSE'],LSE:['London Stock Exchange','XLON','LSE','LSE']
});
const trim=(s,max=120)=>String(s??'').trim().slice(0,max);
const upper=s=>trim(s).toUpperCase();
const validIsin=s=>isinPattern.test(upper(s));
export function normalizeListing(row,source){
 const providerSymbol=upper(row.symbol||row.Code),rawExchange=upper(row.exchange||row.Exchange),
  symbol=source==='fmp'&&/^[A-Z0-9_-]+\.(DE|F|AS|PA|L|MI)$/.test(providerSymbol)&&['XETRA','FRANKFURT','AMSTERDAM','PARIS','LSE'].includes(rawExchange)?providerSymbol.split('.')[0]:providerSymbol,
  currency=upper(row.currency||row.Currency),
  name=trim(row.name||row.Name||row.instrument_name||row.companyName,140),
  isin=upper(row.isin||row.ISIN),exchange=trim(row.exchangeFullName||row.exchange||row.Exchange,65),
  mic=upper(row.mic_code||row.mic);
 if(!tickerPattern.test(symbol)||!currencyPattern.test(currency)||!name)return null;
 if(isin&&!validIsin(isin))return null;
 if(mic&&!/^[A-Z0-9]{4}$/.test(mic))return null;
 const suffix=source==='eodhd'?upper(row.Exchange):'';
 const mapping=marketMappings[mic]||marketMappings[upper(row.exchange||row.Exchange)]||marketMappings[upper(exchange)]||null;
 // Provider-specific identifiers must be returned or uniquely known by mapping.
 // Never derive an EODHD exchange from an unverified place name or a ticker.
 const eodhdSymbol=source==='eodhd'&&suffix&&/^[A-Z0-9]{1,12}$/.test(suffix)?
   symbol+'.'+suffix:source==='twelve'&&mapping?symbol+'.'+mapping[3]:'';
 const fmpSymbol=source==='fmp'?providerSymbol:'';
 const tradingViewSymbol=mapping?mapping[2]+':'+symbol:'';
 return {source,name,symbol,isin,currency,exchange:mapping?mapping[0]:exchange,mic:mic||mapping?.[1]||'',
   eodhdSymbol,fmpSymbol,tradingViewSymbol,
   type:trim(row.instrument_type||row.type||row.Type,40)};
}
const cleanTerm=term=>{
 const t=trim(term,120);
 if(t.length<2||/[<>\\]/.test(t))throw Error('Bitte mindestens zwei Zeichen des Namens, Tickers oder der ISIN angeben.');
 return t;
};
const urlWith=(base,params)=>{const u=new URL(base);for(const [k,v] of Object.entries(params))u.searchParams.set(k,String(v));return u.toString();};
export async function queryProviderListings(provider,term,settings,fetcher=globalThis.fetch){
 const t=cleanTerm(term),key=trim(settings?.[provider==='eodhd'?'eodhdKey':provider==='fmp'?'fmpKey':'twelveKey'],250);
 if(!key)throw Error('Kein eigener '+provider.toUpperCase()+'-API-Schlüssel hinterlegt.');
 let url;
 if(provider==='eodhd')url=urlWith('https://eodhd.com/api/search/'+encodeURIComponent(t),{api_token:key,fmt:'json',limit:50});
 else if(provider==='fmp')url=urlWith('https://financialmodelingprep.com/stable/'+(validIsin(t)?'search-isin':/^[A-Z0-9.^/-]{1,12}$/i.test(t)?'search-symbol':'search-name'),
  validIsin(t)?{isin:t,apikey:key}:{query:t,limit:50,apikey:key});
 else if(provider==='twelve')url=urlWith('https://api.twelvedata.com/symbol_search',{symbol:t,outputsize:50,apikey:key});
 else throw Error('Unbekannter Suchanbieter.');
 const raw=await (provider==='eodhd'?requestEodhdJSON(url,{fetcher,ttlMs:TTL.catalog,attempts:1}):requestJSON(url,{fetcher,ttlMs:TTL.catalog,attempts:1}));
 if(raw?.status==='error'||raw?.['Error Message'])throw Error(trim(raw.message||raw['Error Message'],150));
 const list=provider==='twelve'?raw?.data:raw;
 if(!Array.isArray(list))throw Error('Suchanbieter liefert keine gültige Trefferliste.');
 const clean=list.map(item=>normalizeListing(item,provider)).filter(Boolean);
 // Providers may return several listings for the same ETF. Preserve each venue.
 const seen=new Set();
 return clean.filter(p=>{
  const id=[p.source,p.symbol,p.currency,p.mic||p.exchange,p.isin].join('|');
  if(seen.has(id))return false;seen.add(id);return true;
 }).slice(0,50);
}
export function rankListings(results,term,existing={}){
 const t=upper(term),isin=upper(existing.isin),currency=upper(existing.currency);
 return results.slice().sort((a,b)=>{
  const score=x=>{
   let n=0;
   if(isin&&x.isin===isin)n+=100;
   else if(isin&&x.isin&&x.isin!==isin)n-=300;
   if(validIsin(t)&&x.isin===t)n+=100;
   if(x.symbol===t)n+=45;
   if(x.name.toUpperCase().includes(t))n+=15;
   if(currency&&x.currency===currency)n+=9;
   if(x.mic==='XETR')n+=3;
   return n;
  };
  return score(b)-score(a);
 });
}
export async function discoverSecurityListings(term,settings={},fetcher=globalThis.fetch){
 const t=cleanTerm(term),order=['eodhd','fmp','twelve'];
 const available=order.filter(p=>settings[p==='eodhd'?'eodhdKey':p==='fmp'?'fmpKey':'twelveKey']);
 if(!available.length)throw Error('Für die universelle Wertpapiersuche bitte einen eigenen EODHD-, FMP- oder Twelve-Data-API-Schlüssel unter „Mehr“ eintragen.');
 const errors=[];
 for(const provider of available){
  try{
   const hits=await queryProviderListings(provider,t,settings,fetcher);
   if(hits.length)return {results:hits,provider,failures:errors};
   errors.push(provider+': Keine Treffer');
  }catch(error){errors.push(provider+': '+trim(error.message,125));}
 }
 throw Error('Keine verifizierbaren Börsennotierungen gefunden. '+errors.join(' · ').slice(0,280));
}
/** A source listing must not overwrite an existing instrument with a different ISIN.
 * A missing provider ISIN is explicitly unverified, never treated as a match. */
export function listingCompatibility(candidate,position){
 const c=candidate||{},p=position||{};
 if(!tickerPattern.test(upper(c.symbol))||!currencyPattern.test(upper(c.currency))||!trim(c.exchange)&&!trim(c.mic))
  return {ok:false,reason:'Treffer hat keine vollständige Börsennotierung (Ticker, Börse, Währung).'};
 if(p.isin&&c.isin&&upper(p.isin)!==upper(c.isin))return {ok:false,reason:'ISIN weicht von der vorhandenen Position ab.'};
 if(p.currency&&upper(p.currency)!==upper(c.currency)&&Number(p.price||0)>0)
  return {ok:false,reason:'Andere Kurswährung. Erst bestehenden Kurs und FX-Wert manuell anpassen.'};
 return {ok:true,identityConfirmed:!!c.isin,warning:p.isin&&!c.isin?'Die Datenquelle liefert keine ISIN: Identität vor Übernahme selbst prüfen.':null};
}
/** Apply only listing metadata, never price, quantity, holdings, ledger, wallets, cost or existing quotes. */
export function mergeConfirmedListing(position,candidate){
 const status=listingCompatibility(candidate,position);
 if(!status.ok)throw Error(status.reason);
 const oldIsin=upper(position.isin),isin=upper(candidate.isin);
 return {...position,symbol:upper(candidate.symbol),isin:oldIsin||isin,currency:upper(candidate.currency),
  exchange:candidate.exchange,mic:candidate.mic||'',
  eodhdSymbol:candidate.eodhdSymbol||'',fmpSymbol:candidate.fmpSymbol||'',
  tradingViewSymbol:candidate.tradingViewSymbol||''};
}
