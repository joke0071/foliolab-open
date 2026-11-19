import {div,exact,units} from './decimal.js';

const utcDay=86400000;
const isMissingClose=reason=>reason.startsWith('Historischer Schlusskurs fehlt');

/** An opt-in chart overlay from complete, adjacent, same-scope EUR endpoints.
 * The returned midpoint is a display value and must not enter the wealth view. */
export function historyDisplayEstimates(wealth,model){
 if(wealth.basis!=='reconstructed')return [];
 const daily=wealth.projection.days;
 const positions=new Map(model.positions.map(p=>[p.id,p]));
 const activity=new Set([...(model.journalEntries??[]),...(model.bookings??[]),...(model.externalCashFlows??[])].map(row=>row.date));
 const observed=new Set(wealth.projection.observations.map(row=>row.date));
 const eligible=[...positions.values()].every(p=>p.currency==='EUR'&&!p.wallet?.enabled&&(!p.economicRole||p.economicRole==='standard')&&(!p.valuationMode||p.valuationMode==='included'));
 if(!eligible)return [];
 const estimates=[];
 for(let i=1;i<daily.length-1;i++){
  const before=daily[i-1],missing=daily[i],after=daily[i+1];
  const a=Date.parse(before.date),g=Date.parse(missing.date),b=Date.parse(after.date);
  if(g-a!==utcDay||b-g!==utcDay||before.totalEURExact===null||missing.totalEURExact!==null||after.totalEURExact===null)continue;
  if(activity.has(missing.date)||activity.has(after.date)||observed.has(missing.date))continue;
  if(!missing.missing.length||missing.missing.some(item=>!positions.has(item.positionId)||!isMissingClose(item.reason)))continue;
  const ending=new Map(after.components.map(row=>[row.positionId,row]));
  if(before.components.length!==positions.size||ending.size!==positions.size)continue;
  if(before.components.some(row=>{
   const last=ending.get(row.positionId),position=positions.get(row.positionId);
   return !last||!position||row.quantityExact!==last.quantityExact||row.source!==last.source||row.priceType!==last.priceType||row.fxExact!=='1'||last.fxExact!=='1';
  }))continue;
  estimates.push({date:missing.date,before:before.date,after:after.date,totalEURExact:exact(div(units(before.totalEURExact)+units(after.totalEURExact),units('2')))});
 }
 return estimates;
}
