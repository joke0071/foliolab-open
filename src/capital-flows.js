/**
 * Capital-only reference line, not investment performance.
 * Anchors the first *verified* snapshot and adds recorded external net flows.
 * Without a known observation start or complete external bookings it returns
 * null rather than displaying a misleading "invested capital" line.
 */
export function capitalReferenceSeries(model,snapshots){
 if(!Array.isArray(snapshots)||snapshots.length<2||
    !model?.performanceFlowTrackingSince||!Array.isArray(model.externalCashFlows))return null;
 const shots=[...snapshots].sort((a,b)=>a.date.localeCompare(b.date));
 const first=shots[0],last=shots.at(-1);
 if(first.date<model.performanceFlowTrackingSince)return null;
 if(shots.some(x=>!['observed','manual'].includes(x.valuationStatus)))return null;
 if(shots.some((x,i)=>i>0&&shots[i-1].date===x.date))return null;
 const startVal=Number(first.totalEURExact??first.total);
 if(!Number.isFinite(startVal))return null;
 const flows=model.externalCashFlows.filter(f=>f.date>first.date&&f.date<=last.date);
 if(flows.some(f=>!/^\d{4}-\d{2}-\d{2}$/.test(String(f.date))||
    !Number.isFinite(Number(f.amountExactEUR??f.amountEUR))))return null;
 const ids=new Set(model.externalCashFlows.map(x=>x.id));
 if((model.bookings||[]).some(b=>b.date>first.date&&b.date<=last.date&&
    ['deposit','withdraw'].includes(b.type)&&!ids.has(b.id)))return null;
 const ordered=[...flows].sort((a,b)=>a.date.localeCompare(b.date));
 let cursor=0,cumulative=0;
 return shots.map(s=>{
  while(cursor<ordered.length&&ordered[cursor].date<=s.date){
   cumulative+=Number(ordered[cursor].amountExactEUR??ordered[cursor].amountEUR);
   cursor++;
  }
  return {date:s.date,total:startVal+cumulative,netExternalFlow:cumulative};
 });
}
