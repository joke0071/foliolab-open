/** Explicit listing suggestions; never prices, automatic ISIN binding or holdings. */
import {referenceSearch} from './reference-listings.js';
import {alphaVantageSearch} from './alpha-vantage.js';
const trim=(s,max=120)=>String(s??'').trim().slice(0,max),upper=s=>trim(s).toUpperCase();
const tickerPattern=/^[A-Z0-9^._/-]{1,40}$/,currencyPattern=/^[A-Z]{3}$/;
const validIsin=s=>/^[A-Z]{2}[A-Z0-9]{10}$/.test(upper(s));
const cleanTerm=term=>{const t=String(term??'').trim();if(t.length<2||t.length>120||/[<>\\\u0000-\u001f]/.test(t))throw Error('Bitte zwei bis 120 Zeichen des Namens, Tickers oder der ISIN angeben.');return t;};
export async function queryProviderListings(provider,term,settings={},fetcher=globalThis.fetch){
 if(provider!=='alpha')throw Error('Dieser Suchanbieter wurde entfernt. Alpha Vantage oder lokale Referenzen verwenden.');
 const result=await alphaVantageSearch(cleanTerm(term),settings.alphaVantageKey,fetcher);
 return result.results;
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
 const t=cleanTerm(term),local=referenceSearch(t);
 if(local.length)return {results:local,provider:'Lokale Referenzliste',failures:[]};
 if(!settings.alphaVantageKey)throw Error('Kein lokaler Referenztreffer. Für die Xetra-Suche einen eigenen Alpha-Vantage-API-Schlüssel eintragen oder Notierung manuell erfassen.');
 const results=await queryProviderListings('alpha',t,settings,fetcher);
 return {results,provider:'Alpha Vantage',failures:[],warning:'Nur ausdrücklich bestätigte Xetra-Treffer. Alpha Vantage liefert keine ISIN; Identität selbst prüfen. Andere Börsen können manuell erfasst werden.'};
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
  eodhdSymbol:candidate.eodhdSymbol||'',fmpSymbol:candidate.fmpSymbol||''};
}
