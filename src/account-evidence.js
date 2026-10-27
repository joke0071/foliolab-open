import {positionQualityReview} from './position-quality-review.js';
/** Read-only inventory of evidence, never a completeness score or a bank balance.
 * Existing quality rules remain the sole source of price/history findings.
 */
export function accountEvidenceRows(model,now=Date.now()){
 const quality=new Map(positionQualityReview(model,now).map(row=>[row.id,row]));
 const positions=new Map(),bookings=new Map(),openings=new Map();
 for(const p of model.positions||[]){const rows=positions.get(p.accountId)||[];rows.push(p);positions.set(p.accountId,rows);}
 for(const b of model.bookings||[]){const rows=bookings.get(b.positionId)||[];rows.push(b);bookings.set(b.positionId,rows);}
 for(const o of model.openingPositions||[])openings.set(o.positionId,o);
 return (model.accounts||[]).map(account=>{
  // A position attached to a different provider is not evidence for this account.
  const owned=(positions.get(account.id)||[]).filter(p=>p.providerId===account.providerId);
  const entries=owned.flatMap(p=>bookings.get(p.id)||[]);
  const findings=owned.map(p=>quality.get(p.id)).filter(Boolean);
  return {accountId:account.id,providerId:account.providerId,positions:owned.length,
   archived:owned.filter(p=>p.archived===true).length,cash:owned.filter(p=>p.kind==='cash').length,
   quoteReview:findings.filter(r=>r.issues.some(i=>i.category==='quote')).length,
   historyReview:findings.filter(r=>r.issues.some(i=>i.category==='history')).length,
   openingUndated:owned.filter(p=>openings.has(p.id)&&!openings.get(p.id).asOf).length,
   openingAbsent:owned.filter(p=>!openings.has(p.id)).length,
   tradeCostsUnknown:entries.filter(b=>['buy','sell'].includes(b.type)&&(b.costsVerified===false||b.feeEUR==null||b.taxEUR==null)).length,
   imported:entries.filter(b=>b.importSource?.version===1&&b.importSource.accountId===account.id).length,
   unmatchedCashMovements:entries.filter(b=>['deposit','withdraw'].includes(b.type)&&!b.transferMatch).length};
 });
}
