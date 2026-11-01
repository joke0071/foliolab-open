/** Read-only, user-initiated EODHD diagnosis. Never change holdings. */
import {fetchSecurityQuote,marketSourcePlan} from './security-sources.js';
const active=p=>['etf','stock','fund'].includes(p?.kind)&&p.symbol&&Number(p.quantityExact??p.quantity??0)!==0;
export function classifyMarketFailure(error){
 const s=String(error?.message||error||'');
 if(/Anbietertarif deckt diese Abfrage nicht ab/i.test(s))return {code:'access',label:'Tarif deckt diese Notierung nicht ab',help:'Der Anbieter hat die Abfrage ausdrücklich wegen der Tarifberechtigung abgelehnt. Automatische Wiederholungen sind vorübergehend ausgesetzt; nach einem Tarifwechsel erneut prüfen.'};
 if(/HTTP 404/i.test(s))return {code:'not-found',label:'Anbieter liefert HTTP 404',help:'Die angefragte Notierung ist über diesen Zugang nicht verfügbar. Symbolabdeckung und Tarif beim Anbieter prüfen; ein falscher Schlüssel ist damit nicht bewiesen.'};
 if(/HTTP 429|Ratenlimit|Anfragelimit|Monatskontingent|rate.limited/i.test(s))return {code:'rate',label:'Anfragelimit erreicht',help:'Später erneut prüfen. Weitere Testanfragen wurden vermieden.'};
 if(/HTTP 401|HTTP 402|HTTP 403|Tarif oder Zugang|provider_denied|unauthorized|forbidden/i.test(s))return {code:'access',label:'Zugriff oder Tarif nicht bestätigt',help:'API-Schlüssel, Börsenrechte und Tarif beim Anbieter prüfen; die Ursache ist im Browser nicht eindeutig feststellbar.'};
 if(/Netzwerk|CORS|Failed to fetch|NetworkError|Load failed|Zeitüberschreitung|temporarily_unavailable|HTTP 502|HTTP 503|HTTP 504/i.test(s))return {code:'network',label:'Netzwerk- oder CORS-Fehler',help:'Internetverbindung und Browserfilter prüfen; automatische Kurse benötigen eine browserfähige Quelle.'};
 if(/Kursdatum|nicht aktuell genug|zu alt/i.test(s))return {code:'stale',label:'Nur veraltete Kurse',help:'Es wurde kein neuer Kurs übernommen.'};
 if(/Ticker|Börsencode|Symbol|Handelsplatz|MIC|Zuordnung|Währung|Notierung|konfigurierter Kursanbieter/i.test(s))return {code:'listing',label:'Börsenzuordnung prüfen',help:'Ticker, ISIN, Handelsplatz, MIC, Kurswährung und Anbieterzuordnung überprüfen.'};
 if(/keine Börsenkurse|keine gültigen Schlusskurse|no_prices/i.test(s))return {code:'empty',label:'Keine Kurse',help:'Abdeckung der Notierung im Anbietertarif prüfen.'};
 return {code:'other',label:'Abfrage fehlgeschlagen',help:'API-Zugang und Datenquelle prüfen; gespeicherte Kurse bleiben erhalten.'};
}
/** Saved observations are evidence of a previous fetch, not a connectivity test. */
export function marketSupplySummary(settings={},positions=[]){
 const list=positions.filter(active);
 if(!list.length)return 'Automatische Wertpapierkurse: noch keine Notierungen. Manuelle Kurse und CSV stehen zur Verfügung.';
 const confirmed=list.filter(p=>['verified-listing','configured-listing'].includes(p.quoteQuality)&&p.quoteSource&&/^\d{4}-\d{2}-\d{2}/.test(p.quoteAsOf||''));
 const current=confirmed.filter(p=>{const age=Date.now()-Date.parse(p.quoteAsOf.slice(0,10)+'T12:00:00Z');return age>=-864e5&&age<=8*864e5;});
 const usable=list.filter(p=>{try{return marketSourcePlan(p,settings).some(x=>x.ready);}catch{return false;}});
 const state=current.length===list.length&&usable.length===list.length?'funktioniert (zuletzt bestätigt)':usable.length?'eingeschränkt':'nicht verfügbar';
 const evidence=confirmed.slice(0,4).map(p=>p.symbol+': '+p.quoteSource+' · '+p.quoteAsOf.slice(0,10)).join(' · ');
 return 'Automatische Wertpapierkurse: '+state+'. '+current.length+' von '+list.length+' Notierungen mit aktuellem bestätigtem Kurs. '+
  (evidence?'Gespeicherte Kursstände: '+evidence+'. ':'')+(usable.length?'Verbindung bei Bedarf prüfen; Zugang und Börsenabdeckung hängen vom Tarif ab.':'Alpha Vantage, Marketstack, FMP/Twelve Data oder optionalen EODHD-Worker einrichten. Manuelle Kurse und CSV bleiben verfügbar.');
}
export async function diagnoseMarketSources(settings={},positions=[],fetcher=globalThis.fetch){
 const list=positions.filter(active).slice(0,4);
 if(!list.length)return {message:'Keine vorhandenen ETF-, Fonds- oder Aktienpositionen mit Ticker. Es werden keine Börsencodes geraten.',rows:[]};
 const rows=[],blocked=new Set();
 for(const p of list){
  const symbol=String(p.symbol).slice(0,40);
  let plan;try{plan=marketSourcePlan(p,settings);}catch(e){rows.push({symbol,status:'error',...classifyMarketFailure(e)});continue;}
  if(!plan.length){rows.push({symbol,status:'skipped',label:'Kein Kurszugang gespeichert',help:'Alpha Vantage, Marketstack, FMP/Twelve Data oder optionalen EODHD-Worker einrichten. Eingaben zuerst speichern.'});continue;}
  for(const entry of plan){
   const provider={alpha:'Alpha Vantage',marketstack:'Marketstack',fmp:'FMP',twelve:'Twelve Data',eodhd:'EODHD-Worker'}[entry.source];
   if(!entry.ready||blocked.has(entry.source)){
    rows.push({symbol,provider,status:'skipped',label:'Nicht versucht',help:entry.reason||'Weitere Anfragen nach Verbindungs-, Zugangs- oder Limitfehler für diese Quelle vermieden.'});continue;
   }
   try{
    const q=await fetchSecurityQuote(p,{...settings,securitySource:entry.source,recheckProviderAccess:true},fetcher);
    rows.push({symbol,provider,status:'ok',label:q.cached?'Tageskurs aus lokalem Cache':'Kursabruf erfolgreich',help:'Bestätigte Notierung · '+q.asOf+' · '+q.source+(q.cached?' · Kein neuer Verbindungs- oder Zugangstest.':'')});
   }catch(e){
    const failure=classifyMarketFailure(e);
    rows.push({symbol,provider,status:'error',...failure});
    if(['rate','access','network'].includes(failure.code))blocked.add(entry.source);
   }
  }
 }
 return {message:'Diagnose beendet. Kurse, Bestände und Buchungen blieben unverändert.',rows};
}
