/** Actual quote provenance must not be confused with a successful refresh attempt. */
const proven=new Set(['configured-listing','verified-listing','provider-timestamp']);
export function priceQuality(p,now=Date.now()){
 if(!['etf','stock','fund','crypto'].includes(p?.kind)||p.valuationMode==='excluded'||
    Number(p.quantityExact??p.quantity??0)===0)return {state:'ignored',label:'Nicht relevant'};
 if(!(Number(p.priceExact??p.price)>0))return {state:'missing',label:'Kein Kurs'};
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
export function quoteQualitySummary(positions,now=Date.now()){
 const counts={confirmed:0,stale:0,derived:0,missing:0,review:0,undated:0,unverified:0};
 for(const p of positions||[]){const s=priceQuality(p,now).state;if(Object.hasOwn(counts,s))counts[s]++;}
 const total=Object.values(counts).reduce((a,b)=>a+b,0);
 return {counts,total,label:total===0?'Kursqualität: Noch keine bewerteten Wertpapier- oder Kryptopositionen':
  'Kursqualität: '+counts.confirmed+' datiert und bestätigt · '+(total-counts.confirmed)+' nicht verlässlich aktuell'+
  (counts.stale?' · '+counts.stale+' veraltet':'')+(counts.derived?' · '+counts.derived+' aus Stichtag':'')+
  (counts.missing?' · '+counts.missing+' ohne Kurs':'')};
}
