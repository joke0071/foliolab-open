/** Price provenance and quote freshness are separate concepts. */
const QUOTE_MAX_AGE_MS=7*864e5;
export function oldProviderQuote(position,now=Date.now()){
 const timestamp=Date.parse(String(position.quoteAsOf||''));
 return Number.isFinite(timestamp)&&now-timestamp>QUOTE_MAX_AGE_MS;
}
export function valuationWarnings(model,now=Date.now()){
 const result={missing:0,derived:0,review:0,outdated:0};
 for(const p of model.positions||[]){
  if(p.valuationMode==='excluded'||Number(p.quantityExact??p.quantity)===0)continue;
  if(!(Number(p.priceExact??p.price)>0)){result.missing++;continue;}
  if(p.priceStatus){
   if(/stichtag|abgeleit/i.test(String(p.priceStatus)))result.derived++;
   else result.review++;
  }else if(oldProviderQuote(p,now))result.outdated++;
 }
 return result;
}
export function valuationHeadline(flags){
 const parts=[];
 if(flags.missing)parts.push(flags.missing+' ohne Kurs');
 if(flags.derived)parts.push(flags.derived+' aus Stichtag abgeleitet');
 if(flags.review)parts.push(flags.review+' zur Prüfung');
 if(flags.outdated)parts.push(flags.outdated+' Kurs'+(flags.outdated===1?'':'e')+' älter als 7 Tage');
 return parts.length?'⚠ Bewertung eingeschränkt: '+parts.join(' · '):null;
}
