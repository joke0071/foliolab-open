import {bookingHistoryRows} from './booking-history.js';
/**
 * Transaction events actually attributed to one portfolio position.
 *
 * No transaction from a matching ISIN in another custody account is included.
 * Cash dividends posted solely to a bank account cannot automatically be
 * assigned to a security. This deliberately avoids inventing allocation.
 */
export function positionBookingTimeline(model,positionId,{limit=12}={}){
 if(typeof positionId!=='string'||!positionId)throw Error('Position für Buchungsverlauf fehlt.');
 if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('Ungültiges Limit für Buchungsverlauf.');
 const position=(model?.positions||[]).find(p=>p.id===positionId);
 if(!position)return {total:0,events:[],hasMore:false};
 const supported=new Set(['buy','sell','deliver_in','deliver_out','split','swap','merger','isin_change','ticker_change','dividend','interest','reward','airdrop','transfer','adjust','correction','fee','tax']);
 const all=bookingHistoryRows(model).filter(b=>supported.has(b.type)&&
  (b.positionId===positionId||b.targetPositionId===positionId))
  .sort((a,b)=>b.date.localeCompare(a.date)||String(b.id||'').localeCompare(String(a.id||'')));
 return {total:all.length,hasMore:all.length>limit,events:all.slice(0,limit).map(b=>({
  id:b.id,
  date:b.date,
  type:b.type,
  isTarget:b.targetPositionId===positionId&&b.positionId!==positionId,
  quantityExact:b.type==='correction'?b.deltaExact:b.quantityExact??(Number.isFinite(b.quantity)?String(b.quantity):null),
  amountExactEUR:b.amountExactEUR??(Number.isFinite(b.amountEUR)?String(b.amountEUR):null),
  // A trade's amount may omit unverified charges. Never use it as net P&L.
  source:b.importFingerprint?'csv':'manual',
  note:String(b.notes||'').slice(0,180)
 }))};
}
