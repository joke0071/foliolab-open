/** Actual quote provenance must not be confused with a successful refresh attempt. */
import {positionFX,positionValuation} from './fx-state.js';
const proven=new Set(['configured-listing','verified-listing','provider-timestamp']);
/** Read-only display evidence. Legacy/default zeroes have no recorded source,
 * so they cannot be distinguished from an absent quote. Never change valuation. */
export function displayQuotePrice(p){
 const raw=p.priceExact??p.price;
 if(!['number','string'].includes(typeof raw)||String(raw).trim()==='')return null;
 const value=Number(raw);
 if(!Number.isFinite(value)||value<0)return null;
 if(value===0&&['etf','stock','fund','crypto'].includes(p.kind)&&!String(p.quoteSource||'').trim())return null;
 return value;
}
export function priceQuality(p,now=Date.now()){
 if(!['etf','stock','fund','crypto'].includes(p?.kind)||p.valuationMode==='excluded'||
    Number(p.quantityExact??p.quantity??0)===0)return {state:'ignored',label:'Nicht relevant'};
 if(displayQuotePrice(p)===null)return {state:'missing',label:'Kein Kurs'};
 if(/stichtag|abgeleit/i.test(String(p.priceStatus||'')))return {state:'derived',label:'Aus Stichtag abgeleitet'};
 if(p.priceStatus)return {state:'review',label:'Kurs prüfen'};
 const day=String(p.quoteAsOf||'').slice(0,10);
 const timestamp=/^\d{4}-\d{2}-\d{2}$/.test(day)?Date.parse(day+'T12:00:00Z'):NaN;
 if(!Number.isFinite(timestamp)||new Date(timestamp).toISOString().slice(0,10)!==day)
  return {state:'undated',label:'Ohne bestätigtes Kursdatum'};
 if(timestamp>now+864e5)return {state:'review',label:'Kursdatum prüfen'};
 if(now-timestamp>7*864e5)return {state:'stale',label:'Kurs älter als 7 Tage'};
 if(!proven.has(p.quoteQuality))return {state:'unverified',label:'Kursquelle nicht bestätigt'};
 return {state:'confirmed',label:'Datierter Anbieterkurs'};
}
/** Current automatic portfolio valuations need both price and FX provenance. */
export function automaticValuationConfirmed(p,now=Date.now()){
 if(p.valuationMode==='excluded'||Number(p.quantityExact??p.quantity??0)===0)return true;
 const quality=priceQuality(p,now).state;
 if(!['confirmed','ignored'].includes(quality))return false;
 if(quality==='ignored'&&(!(Number(p.priceExact??p.price)>0)||p.priceStatus))return false;
 if(p.currency!=='EUR'){
  if(positionFX(p).state!=='known')return false;
  const day=String(p.fxRateDate||''),time=/^\d{4}-\d{2}-\d{2}$/.test(day)?Date.parse(day+'T12:00:00Z'):NaN;
  if(!String(p.fxSource||'').trim()||!(Number(p.fxRateExact??p.fxRate)>0)||!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==day||time>now+864e5||now-time>7*864e5)return false;
 }
 return true;
}
export function quoteQualitySummary(positions,now=Date.now()){
 const counts={confirmed:0,stale:0,derived:0,missing:0,review:0,undated:0,unverified:0};
 for(const p of positions||[]){const s=priceQuality(p,now).state;if(Object.hasOwn(counts,s))counts[s]++;}
 const total=Object.values(counts).reduce((a,b)=>a+b,0);
 return {counts,total,label:total===0?'Kursqualität: Noch keine bewerteten Wertpapier- oder Kryptopositionen':
  'Kursqualität: '+counts.confirmed+' datiert und bestätigt · '+(total-counts.confirmed)+' nicht verlässlich aktuell'+
  (counts.stale?' · '+counts.stale+' veraltet':'')+(counts.derived?' · '+counts.derived+' aus Stichtag':'')+
  (counts.missing?' · '+counts.missing+' ohne Kurs':'')};
}

/** Display-only: an absent quote is not evidence of a zero position value.
 * Keep genuine zero holdings, sourced zero quotes and excluded contributions. */
export function positionValueLabel(position,value,formatMoney){
 return hasMissingPositionValue(position)?'Nicht bewertet':formatMoney(value);
}

/** Same missing-value rule for individual and aggregate presentation. No valuation math. */
export function hasMissingPositionValue(position){
 return (displayQuotePrice(position)===null||positionFX(position).state!=='known')&&Number(position.quantityExact??position.quantity)!==0&&position.valuationMode!=='excluded';
}
export function aggregateValuePresentation(positions,value,formatMoney){
 const included=positions.filter(p=>p.valuationMode!=='excluded');
 const missing=included.filter(hasMissingPositionValue).length;
 const allUnknown=missing>0&&missing===included.length;
 const fxMissing=included.some(p=>Number(p.quantityExact??p.quantity)!==0&&positionFX(p).state!=='known');
 const knownTotalEUR=fxMissing?Number(positionValuation(included).knownTotalExactEUR):value;
 return {missing,allUnknown,...(fxMissing?{knownTotalEUR}:{}),value:allUnknown?'Nicht bewertet':formatMoney(knownTotalEUR),
  note:missing?(allUnknown?'':'Bekannte Teilsumme · ')+missing+' Position'+(missing===1?'':'en')+(fxMissing?' ohne belegte EUR-Bewertung':' ohne Kurs'):''};
}
