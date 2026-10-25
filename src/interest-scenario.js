import {units,exact,SCALE} from './decimal.js';

export const INTEREST_METHODS={unknown:'Nicht bekannt','ACT/365F':'ACT/365 Fixed · echte Tage / 365','ACT/360':'ACT/360 · echte Tage / 360'};
const DAY=86400000;
export function interestDayNumber(value){
 if(typeof value!=='string'||!/^(?:19|20|21)\d\d-\d\d-\d\d$/.test(value))throw Error('Bitte ein gültiges Kalenderdatum angeben.');
 const time=Date.parse(value+'T00:00:00Z');
 if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==value)throw Error('Bitte ein gültiges Kalenderdatum angeben.');
 return time/DAY;
}
export const interestDateAfter=(value,days)=>new Date((interestDayNumber(value)+days)*DAY).toISOString().slice(0,10);
/** Documentary conditions, not balances or a guarantee of future bank terms. */
export function normalizeInterestTerms(raw){
 if(raw==null)return null;
 if(typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||!Object.hasOwn(INTEREST_METHODS,raw.dayCount)||
  !Array.isArray(raw.rates)||!raw.rates.length||raw.rates.length>60)throw Error('Ungültige Zinsinformationen: Methode und 1–60 Zinssätze angeben.');
 const rates=raw.rates.map(r=>{
  if(!r||typeof r!=='object'||Array.isArray(r)||typeof r.annualRateExact!=='string'||!r.annualRateExact.trim())throw Error('Bitte einen Jahreszinssatz in Prozent angeben.');
  interestDayNumber(r.fromDate);
  const value=units(r.annualRateExact);
  if(value< -100n*SCALE||value>100n*SCALE)throw Error('Jahreszinssatz muss zwischen −100 und 100 % liegen.');
  const knownThrough=r.knownThrough==null||r.knownThrough===''?null:r.knownThrough;
  if(knownThrough!==null&&(interestDayNumber(knownThrough)<interestDayNumber(r.fromDate)))throw Error('Bekannt-bis-Datum liegt vor dem Gültig-ab-Datum.');
  return {fromDate:r.fromDate,annualRateExact:exact(value),knownThrough};
 }).sort((a,b)=>a.fromDate.localeCompare(b.fromDate));
 for(let i=1;i<rates.length;i++){
  if(rates[i-1].fromDate===rates[i].fromDate)throw Error('Gültig-ab-Datum ist doppelt vorhanden.');
  if(rates[i-1].knownThrough&&rates[i-1].knownThrough>=rates[i].fromDate)throw Error('Bekannte Zinszeiträume überlappen sich. Bitte die Daten prüfen.');
 }
 return {version:1,dayCount:raw.dayCount,rates};
}
/** ECMA-402 currency digits, only after explicit runtime currency recognition. */
export function currencyInterestDigits(currency){
 if(typeof currency!=='string'||!/^[A-Z]{3}$/.test(currency)||['XXX','XTS','XAU','XAG','XPT','XPD','XBA','XBB','XBC','XBD','XDR','XSU','XUA'].includes(currency)||
  typeof Intl.supportedValuesOf!=='function'||!Intl.supportedValuesOf('currency').includes(currency))
  throw Error('Die Rundung für diese Kontowährung ist nicht bekannt. Keine Prognose möglich.');
 const digits=new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits;
 if(!Number.isInteger(digits)||digits<0||digits>4)throw Error('Unbekannte Währungsrundung.');
 return digits;
}
function roundedMoney(numerator,denominator,digits){
 const scale=10n**BigInt(digits),negative=numerator<0n,magnitude=(negative?-numerator:numerator)*scale;
 const rounded=(magnitude+denominator/2n)/denominator;
 const text=(rounded/scale).toString()+(digits?'.'+(rounded%scale).toString().padStart(digits,'0'):'');
 return (negative&&rounded!==0n?'-':'')+text;
}
/** Pure constant-principal future scenario. All financial arithmetic stays rational BigInt. */
export function calculateInterestScenario({principal,currency,asOf,startDate,endDate,terms,allowScenario=false}={}){
 const asOfDay=interestDayNumber(asOf),start=interestDayNumber(startDate),end=interestDayNumber(endDate);
 if(start<asOfDay)throw Error('Der Start darf nicht vor dem Berechnungsstichtag liegen. Kein historischer Tagesbestand bekannt.');
 if(end<=start||end-start>3660)throw Error('Prognoseende muss nach dem Start liegen; höchstens 3660 Tage.');
 if(typeof allowScenario!=='boolean')throw Error('Szenario benötigt eine ausdrückliche Zustimmung.');
 if(!['string','number'].includes(typeof principal)||String(principal).trim()==='')throw Error('Kapitalbasis ist nicht bekannt.');
 const capital=units(principal);
 if(capital<0n)throw Error('Für negatives Guthaben wird keine Tagesgeldprognose berechnet.');
 const digits=currencyInterestDigits(currency),normalized=normalizeInterestTerms(terms);
 if(!normalized)throw Error('Kein Zinssatz hinterlegt.');
 if(normalized.dayCount==='unknown')throw Error('Bitte die Zinsmethode anhand deiner Kontokonditionen auswählen.');
 const basis=normalized.dayCount==='ACT/360'?360:365,rates=normalized.rates;
 let index=rates.findLastIndex(r=>interestDayNumber(r.fromDate)<=start);
 if(index<0)throw Error('Für den Start ist kein Zinssatz hinterlegt. Keine rückwirkende Auffüllung.');
 const segments=[];let cursor=start,weightedRates=0n;
 while(cursor<end){
  const rate=rates[index],next=index+1<rates.length?interestDayNumber(rates[index+1].fromDate):Infinity;
  const knownEnd=interestDayNumber(rate.knownThrough??rate.fromDate)+1,scenario=cursor>=knownEnd;
  if(scenario&&!allowScenario)throw Error('Zukünftige Konditionen fehlen. Fortschreibung nur mit ausdrücklicher Szenario-Zustimmung.');
  const stop=Math.min(end,next,knownEnd>cursor?knownEnd:Infinity),days=stop-cursor;
  weightedRates+=units(rate.annualRateExact)*BigInt(days);
  segments.push({fromDate:new Date(cursor*DAY).toISOString().slice(0,10),endDate:new Date(stop*DAY).toISOString().slice(0,10),days,annualRateExact:rate.annualRateExact,scenario});
  cursor=stop;if(cursor===next)index++;
 }
 const numerator=capital*weightedRates,denominator=100n*BigInt(basis)*SCALE*SCALE;
 return {asOf,startDate,endDate,currency,principalExact:exact(capital),dayCount:normalized.dayCount,yearBasis:basis,totalDays:end-start,
  grossExact:roundedMoney(numerator,denominator,digits),currencyDigits:digits,segments,usesScenario:segments.some(s=>s.scenario),
  numerator:numerator.toString(),denominator:denominator.toString(),rounding:'half-away-from-zero, end-only'};
}
