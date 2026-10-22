/** Quote provenance and quote freshness are separate concepts. */
const QUOTE_MAX_AGE_MS=7*864e5;
export function oldProviderQuote(position,now=Date.now()){
 const timestamp=Date.parse(String(position.quoteAsOf||''));
 return Number.isFinite(timestamp)&&now-timestamp>QUOTE_MAX_AGE_MS;
}
/** Every warning represents one concrete position, enabling an exact drill-down. */
export function valuationIssues(model,now=Date.now()){
 const result=[];
 for(const p of model.positions||[]){
  if(p.valuationMode==='excluded'||Number(p.quantityExact??p.quantity)===0)continue;
  let type=null;
  if(!(Number(p.priceExact??p.price)>0))type='missing';
  else if(p.priceStatus)type=/stichtag|abgeleit/i.test(String(p.priceStatus))?'derived':'review';
  else if(oldProviderQuote(p,now))type='outdated';
  if(type)result.push({id:p.id,type});
 }
 return result;
}
export function valuationWarnings(model,now=Date.now()){
 const counts={missing:0,derived:0,review:0,outdated:0};
 for(const issue of valuationIssues(model,now))counts[issue.type]++;
 return counts;
}
export function valuationHeadline(flags){
 const parts=[];
 if(flags.missing)parts.push(flags.missing+' ohne Kurs');
 if(flags.derived)parts.push(flags.derived+' mit zuletzt gespeichertem Wert');
 if(flags.review)parts.push(flags.review+' mit unklarem Kursstatus');
 if(flags.outdated)parts.push(flags.outdated+' Kurs'+(flags.outdated===1?'':'e')+' älter als 7 Tage');
 return parts.length?'⚠ Bewertung eingeschränkt: '+parts.join(' · '):null;
}
