import {units,exact} from './decimal.js';

/** Read-only audit. Numbers are compared at their display precision:
 * legitimate 18-decimal detail which rounds to the same JS Number is safe. */
export function legacyQuoteDiscrepancies(model){
 const issues=[];
 for(const p of model?.positions||[]){
  const fields=[];
  if(p.priceExact!=null&&p.price!=null&&Number.isFinite(Number(p.priceExact))&&
     Number.isFinite(Number(p.price))&&Number(p.priceExact)!==Number(p.price))fields.push('price');
  if(p.currency!=='EUR'&&p.fxRateExact!=null&&p.fxRate!=null&&
     Number.isFinite(Number(p.fxRateExact))&&Number.isFinite(Number(p.fxRate))&&
     Number(p.fxRateExact)!==Number(p.fxRate))fields.push('fx');
  if(fields.length)issues.push({id:p.id,name:p.name,symbol:p.symbol||'',currency:p.currency,fields,
   displayPrice:p.price,exactPrice:p.priceExact,displayFx:p.fxRate,exactFx:p.fxRateExact,
   kind:p.kind,hasQuoteSource:Boolean(['etf','fund','stock'].includes(p.kind)||
     (p.kind==='crypto'&&p.coinId))});
 }
 return issues;
}
/** Reject undated/stale provider evidence. The fetched market quote is never
 * generated from an existing portfolio display or from a historical snapshot. */
export function verifiedCurrentQuote(value,{source,date},now=Date.now()){
 const numeric=Number(value);
 const dateString=String(date||'').slice(0,10);
 const timestamp=Date.parse(dateString+'T12:00:00Z');
 if(!Number.isFinite(numeric)||numeric<=0||!String(source||'').trim())
  throw Error('Kein positiver, zuordenbarer Anbieterkurs verfügbar.');
 if(!/^\d{4}-\d\d-\d\d$/.test(dateString)||!Number.isFinite(timestamp)||
    new Date(timestamp).toISOString().slice(0,10)!==dateString||
    timestamp>now+86400000||now-timestamp>8*86400000)
  throw Error('Der Anbieter hat keinen ausreichend aktuellen, datierten Kurs geliefert.');
 return {exactValue:exact(units(String(value))),source:String(source).slice(0,70),date:dateString};
}
/** Call only AFTER an explicit user confirmation of a freshly fetched,
 * independently identified provider quote. Never touch historic bookings or snapshots. */
export function applyVerifiedQuoteRepair(model,positionId,field,verified,{confirmed=false,at=new Date().toISOString()}={}){
 if(!confirmed)throw Error('Kurskorrektur benötigt eine ausdrückliche Bestätigung.');
 const p=model?.positions?.find(x=>x.id===positionId);
 if(!p||!['price','fx'].includes(field))throw Error('Ungültige Kurskorrektur.');
 if(field==='fx'&&p.currency==='EUR')throw Error('EUR benötigt keinen Fremdwährungskurs.');
 if(!(legacyQuoteDiscrepancies({positions:[p]})[0]?.fields.includes(field)))
  throw Error('Keine bestehende Abweichung für diese Position.');
 const v=verifiedCurrentQuote(verified.exactValue,{source:verified.source,date:verified.date},Date.parse(at));
 if(field==='price'){
  p.price=Number(v.exactValue);p.priceExact=v.exactValue;
  p.quoteSource=v.source;p.quoteAsOf=v.date;p.quoteFetchedAt=at;p.quoteQuality='provider-confirmed';
  p.priceStatus=null;
 }else{
  p.fxRate=Number(v.exactValue);p.fxRateExact=v.exactValue;
  p.fxSource=v.source;p.fxRateDate=v.date;p.fxUpdatedAt=at;
 }
 return p;
}
