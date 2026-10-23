/** Read-only, user-initiated EODHD diagnosis. Never change holdings. */
import {fetchSecurityQuote} from './security-sources.js';
const active=p=>['etf','stock','fund'].includes(p?.kind)&&p.symbol&&Number(p.quantityExact??p.quantity??0)!==0;
export function classifyMarketFailure(error){
 const s=String(error?.message||error||'');
 if(/HTTP 429|Ratenlimit|rate.limited/i.test(s))return {code:'rate',label:'Anfragelimit erreicht',help:'Später erneut prüfen. Weitere Testanfragen wurden vermieden.'};
 if(/HTTP 401|HTTP 402|HTTP 403|provider_denied|unauthorized|forbidden/i.test(s))return {code:'access',label:'Zugriff oder Tarif nicht bestätigt',help:'API-Schlüssel, Börsenrechte und Tarif beim Anbieter prüfen; die Ursache ist im Browser nicht eindeutig feststellbar.'};
 if(/Netzwerk|CORS|Failed to fetch|NetworkError|Load failed|Zeitüberschreitung|temporarily_unavailable|HTTP 502|HTTP 503|HTTP 504/i.test(s))return {code:'network',label:'Netzwerk- oder CORS-Fehler',help:'Netzwerk, Browserfilter und eigenen Worker prüfen.'};
 if(/Kursdatum|nicht aktuell genug|zu alt/i.test(s))return {code:'stale',label:'Nur veraltete Kurse',help:'Es wurde kein neuer Kurs übernommen.'};
 if(/Ticker|Börsencode|Symbol|Handelsplatz|MIC|Zuordnung|Währung|Notierung|konfigurierter Kursanbieter/i.test(s))return {code:'listing',label:'Börsenzuordnung prüfen',help:'Ticker, Handelsplatz, MIC, Währung und EODHD-Symbol überprüfen.'};
 if(/keine Börsenkurse|keine gültigen Schlusskurse|no_prices/i.test(s))return {code:'empty',label:'Keine Kurse',help:'Abdeckung der Notierung im EODHD-Tarif prüfen.'};
 return {code:'other',label:'Abfrage fehlgeschlagen',help:'API-Zugang und Datenquelle prüfen; gespeicherte Kurse bleiben erhalten.'};
}
export async function diagnoseEodhd(settings={},positions=[],fetcher=globalThis.fetch){
 const list=positions.filter(active).slice(0,4);
 if(!(settings.eodhdKey||(settings.eodhdWorkerEndpoint&&settings.eodhdWorkerAccessToken)))
  return {message:'Kein EODHD-Zugang gespeichert. Zuerst API-Schlüssel oder eigenen Worker konfigurieren.',rows:[]};
 if(!list.length)return {message:'Keine vorhandenen ETF-, Fonds- oder Aktienpositionen mit Ticker. Es werden keine Börsencodes geraten.',rows:[]};
 const rows=[];let blocked=false;
 for(const p of list){
  const symbol=String(p.symbol).slice(0,40);
  if(blocked){rows.push({symbol,status:'skipped',label:'Nicht erneut abgefragt',help:'Weitere Anfragen nach einem allgemeinen Verbindungs- oder Zugangsfehler vermieden.'});continue;}
  try{
   const q=await fetchSecurityQuote(p,{...settings,securitySource:'eodhd'},fetcher);
   rows.push({symbol,status:'ok',label:'Kursabruf erfolgreich',help:'Stand '+q.asOf+' · '+q.source});
  }catch(e){
   const failure=classifyMarketFailure(e);
   rows.push({symbol,status:'error',...failure});
   if(['rate','access','network'].includes(failure.code))blocked=true;
  }
 }
 return {message:'Diagnose beendet. Kurse, Bestände und Buchungen blieben unverändert.',rows};
}
