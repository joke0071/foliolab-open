/**
 * Consolidate repeat failures into a small, actionable result without hiding
 * affected assets. Group by message, not by assumed backend taxonomy.
 */
export function refreshFailures(errors){
 const grouped=new Map();
 for(const raw of errors||[]){
  const item=String(raw||'').trim().slice(0,280);
  if(!item)continue;
  const colon=item.indexOf(': ');
  const position=colon>=0?item.slice(0,colon):'Datenquelle';
  const cause=colon>=0?item.slice(colon+2):item;
  const key=cause.replace(/\b\d{3,}\b/g,'[Code]');
  if(!grouped.has(key))grouped.set(key,{cause,positions:[],count:0});
  const row=grouped.get(key);row.count++;if(row.positions.length<50)row.positions.push(position);
 }
 return [...grouped.values()];
}
export function refreshHeadline(successes,errors){
 const count=(errors||[]).length;
 return successes+' Aktualisierungen erfolgreich'+(count?' · '+count+' Position'+(count===1?'':'en')+' prüfen':'');
}
