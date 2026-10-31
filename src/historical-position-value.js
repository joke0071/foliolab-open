import {historyDays,rawQuantity} from './wallet-history-days.js';
import {validateHistorySession} from './wallet-history-state.js';
/** Read-only EOD projection. Journal dates are trade dates, not settlement or UTC guesses. */
import {units,exact,mul} from './decimal.js';
import {ledgerQuantityAudit,validateJournalEntry,validCalendarDate as validDate} from './transactions.js';
import {validateImportedPriceHistory} from './historical-csv.js';
const daysBetween=(a,b)=>(Date.parse(b)-Date.parse(a))/864e5;
/** Pure capability. Unknown entitlements/CORS are not a positive live capability. */
export function historicalProviderCapability({provider,currency,listingConfirmed=false,browserTransport=false,licenseState='unknown',quotaStatus='unknown',rangeDays=365,availableDays=365,symbolAllowed=false}={}){
 const reasons=[];
 if(!['csv','eodhd','twelve','fmp','coingecko','coinpaprika'].includes(provider))reasons.push('Quelle nicht freigegeben');
 if(!/^[A-Z]{3}$/.test(currency||''))reasons.push('Kurswährung fehlt');
 if(provider!=='csv'){
  if(!browserTransport)reasons.push('Browserzugriff nicht bestätigt');
  if(!symbolAllowed||!listingConfirmed)reasons.push('Instrument oder Börsennotierung nicht bestätigt');
  if(licenseState!=='confirmed')reasons.push('Nutzungsrecht nicht bestätigt');
  if(quotaStatus!=='available')reasons.push('Anbieterlimit nicht bestätigt');
  if(rangeDays>availableDays)reasons.push('Zeitraum außerhalb verfügbarer Historie');
 }
 return {canFetchSymbol:!reasons.length,canFetchRange:!reasons.length,hasBrowserTransportOrUserWorker:provider==='csv'||browserTransport,currency,coverage:reasons.length?'unconfirmed':'available',licenseState,quotaStatus,reasons};
}
export function historicalQuantityRows(model,positionId,dates){
 const p=model.positions.find(p=>p.id===positionId),opening=model.openingPositions?.find(o=>o.positionId===positionId);
 let reason='Datierter Anfangsbestand fehlt – Eröffnung oder Transfers prüfen.';
 const journals=(model.journalEntries||[]).filter(e=>e.postings.some(x=>x.positionId===positionId&&x.quantityDeltaExact!=null)).sort((a,b)=>a.date.localeCompare(b.date)||(a.sequence||0)-(b.sequence||0)||a.id.localeCompare(b.id));
 let known=Boolean(p&&opening);try{known&&=ledgerQuantityAudit(model).ok;for(const e of journals)validateJournalEntry(e);}catch{known=false;reason='Journal widersprüchlich – Buchungen prüfen.';}
 if((model.bookings||[]).some(b=>(b.positionId===positionId||b.targetPositionId===positionId)&&!journals.some(e=>e.id===(b.journalEntryId??b.id)))){known=false;reason='Journalhistorie unvollständig – Buchungen prüfen.';}
 // An undated non-zero baseline is never back-extrapolated. A zero baseline
 // starts only at the first evidenced journal movement, never before it.
 const start=opening?.asOf||(opening&&units(opening.quantityExact)===0n?journals[0]?.date:null);
 if(!validDate(start))known=false;
 let q=opening?units(opening.quantityExact):0n,index=0;
 if(opening?.asOf&&journals.some(e=>e.date<opening.asOf)){known=false;reason='Eröffnungsdatum und Journal widersprechen sich.';}
 const ordered=[...new Set(dates)].sort();
 return ordered.map(date=>{
  if(!validDate(date))throw Error('Ungültiger Bewertungstag.');
  while(index<journals.length&&journals[index].date<=date){
   const e=journals[index++];for(const x of e.postings)if(x.positionId===positionId&&x.quantityDeltaExact!=null)q+=units(x.quantityDeltaExact);
  }
  const valid=known&&date>=start&&q>=0n;
  return {date,positionId,accountId:p?.accountId??null,quantityExact:valid?exact(q):null,coverage:valid?'verified':'unknown',reason:valid?'':reason,quantitySource:'journal-trade-day-EOD'};
 });
}

export function walletStreamMatches(stream,p){
 const w=p.wallet;if(!w||stream.accountId!==p.accountId)return false;
 return ['btc','btc-hd'].includes(w.chain)?stream.network==='bitcoin'&&stream.assetId==='bitcoin'&&!stream.contract&&!stream.mint:
 ['evm','erc20'].includes(w.chain)?stream.network==='ethereum'&&String(w.chainId||1)===stream.chainId&&(w.chain==='erc20'?stream.contract?.toLowerCase()===w.contract?.toLowerCase():!stream.contract):
 ['sol','spl'].includes(w.chain)?stream.network==='solana'&&(w.chain==='spl'?stream.mint===w.contract:!stream.mint):false;
}
export function positionWalletSession(model,p){
 const candidates=(model.walletHistory?.sessions||[]).filter(s=>s.streams.some(t=>walletStreamMatches(t,p)));
 const exact=candidates.filter(s=>s.walletKey===p.id);if(exact.length===1)return exact[0];
 return candidates.length===1?candidates[0]:null;
}
function walletQuantities(model,p,dates,cache){
 const session=positionWalletSession(model,p),unknown=reason=>dates.map(date=>({date,positionId:p.id,accountId:p.accountId,quantityExact:null,coverage:'unknown',reason,quantitySource:'blockchain-UTC-EOD'}));
 if(!session)return unknown('Wallet-Historie fehlt oder mehrere Wallet-Ansichten widersprechen sich. Historie rekonstruieren.');
 const span=(Date.parse(session.events.filter(e=>e.timestamp).map(e=>e.timestamp.slice(0,10)).sort().at(-1))-Date.parse(session.events.filter(e=>e.timestamp).map(e=>e.timestamp.slice(0,10)).sort()[0]))/864e5;
 if(session.events.length*Math.max(1,span)>2000000)return unknown('Große Wallet-Historie: Tagesberechnung im Wallet-Dialog eingrenzen.');
 let days=cache.get(session);if(!days){const checked=validateHistorySession(session);days=historyDays(checked,{limit:6500});cache.set(session,days);}
 const rows=days.filter(r=>walletStreamMatches(r,p)),byDate=new Map();
 for(const r of rows){if(byDate.has(r.date))return unknown('Mehrere Blockchain-Streams für dieselbe Position. Kontozuordnung prüfen.');byDate.set(r.date,r);}
 return dates.map(date=>{const r=byDate.get(date),known=r?.coverage==='verified'&&r.quantityBaseUnits!==null;return {date,positionId:p.id,accountId:p.accountId,quantityExact:known?rawQuantity(r.quantityBaseUnits,r.decimals):null,coverage:known?'verified':'unknown',reason:known?'':'Wallet-Bestand an diesem UTC-Tagesende nicht vollständig belegt.',quantitySource:'blockchain-UTC-EOD'};});
}

export function localHistoricalPrices(model,p){
 const h=model.priceHistories?.[p.id];return h?{...validateImportedPriceHistory(h,p),priceType:h.priceType??'close'}:null;
}
/** marketHistory must describe one compatible series; no automatic provider fusion. */
export function projectHistoricalPosition(model,positionId,{marketHistory=null,fxPoints=null,dates=null,walletDaysCache=new Map()}={}){
 const p=model.positions.find(p=>p.id===positionId);if(!p)return {rows:[],segments:[],reason:'Positionsidentität fehlt.'};
 let history=marketHistory??localHistoricalPrices(model,p);
 const session=p.wallet?.enabled?positionWalletSession(model,p):null;
 if(!history&&session){const qs=session.quotes.filter(q=>walletStreamMatches({...q,accountId:p.accountId},p));if(qs.length)history={source:qs[0].source,currency:'EUR',priceType:'crypto-daily',points:qs.map(q=>({date:q.date,total:q.priceExact}))};}
 const valuationCurrency=history?.currency??p.currency;
 const quotes=new Map();
 if(history){
  if(history.currency!==p.currency&&!(p.kind==='crypto'&&history.currency==='EUR')||!['close','crypto-daily'].includes(history.priceType??'close'))throw Error('Kurswährung oder Kursart nicht mit der Position vereinbar.');
  for(const point of history.points??[]){
   if(Object.hasOwn(point,'valuationDate')&&point.valuationDate===null)continue;
   const valuationDate=point.valuationDate??point.date;
   if(!validDate(valuationDate)||units(point.total)<=0n)throw Error('Historischer Kurs ungültig.');
   if(quotes.has(valuationDate)&&quotes.get(valuationDate)!==exact(units(point.total)))throw Error('Widersprüchliche Tageskurse.');quotes.set(valuationDate,exact(units(point.total)));
  }
 }
 const calendar=[...new Set(dates??[...quotes.keys(),...(model.journalEntries||[]).filter(e=>e.postings.some(x=>x.positionId===positionId)).map(e=>e.date),...(session?.events||[]).filter(e=>e.timestamp).map(e=>e.timestamp.slice(0,10))])].sort();
 const quantities=p.wallet?.enabled?walletQuantities(model,p,calendar,walletDaysCache):historicalQuantityRows(model,positionId,calendar);
 const fxDates=new Map(),fx=new Map();for(const point of fxPoints??history?.fxPoints??[]){if(!validDate(point.date)||point.currency!==p.currency||point.source!=='Frankfurter'||units(point.rate)<=0n)throw Error('Historischer FX-Nachweis ungültig.');if(fx.has(point.date)&&fx.get(point.date)!==exact(units(point.rate)))throw Error('Widersprüchlicher FX.');fx.set(point.date,exact(units(point.rate)));fxDates.set(point.date,point.referenceDate??point.date);}
 const rows=quantities.map(row=>{
  const price=p.kind==='cash'?'1':quotes.get(row.date)??null,fxExact=valuationCurrency==='EUR'?'1':fx.get(row.date)??null;
  let reason=row.reason;if(row.quantityExact!==null&&row.quantityExact!=='0'&&price===null)reason='Historischer Schlusskurs fehlt – Kurs-CSV importieren oder bestätigte API-Quelle laden.';
  if(row.quantityExact!==null&&row.quantityExact!=='0'&&price!==null&&fxExact===null)reason='Historischer EUR-Wechselkurs fehlt – datierten FX-Nachweis laden.';
  let valueEURExact=null;try{valueEURExact=row.quantityExact==='0'?'0':row.quantityExact!==null&&price!==null&&fxExact!==null?exact(mul(mul(units(row.quantityExact),units(price)),units(fxExact))):null;}catch{reason='Menge oder Bewertung überschreitet die sichere Dezimalpräzision. Rohmenge bleibt erhalten; kein gerundeter Gesamtwert.';}
  return {...row,priceExact:price,priceDate:price===null?null:row.date,fxExact,fxDate:valuationCurrency==='EUR'?row.date:fxDates.get(row.date)??null,valueEURExact,source:history?.source??(p.kind==='cash'?'Journal':'Keine Kursquelle'),priceType:history?.priceType??'close',coverage:valueEURExact===null?'unknown':'verified',reason};
 });
 const segments=[];let segment=[];for(const row of rows){
  if(row.valueEURExact===null){if(segment.length)segments.push(segment);segment=[];continue;}
  if(segment.length&&daysBetween(segment.at(-1).date,row.date)>(p.kind==='crypto'?1:4)){segments.push(segment);segment=[];}
  segment.push(row);
 }if(segment.length)segments.push(segment);
 return {rows,segments,reason:rows.find(r=>r.reason)?.reason??(!rows.length?'Historische Kurse fehlen – Kurs-CSV importieren oder API-Schlüssel unter Mehr → Datenquellen eintragen.':''),source:history?.source??'Journal',partial:rows.some(r=>r.valueEURExact===null)||segments.length>1};
}
