import {units,exact} from './decimal.js';
import {ledgerQuantityAudit,validateJournalEntry} from './transactions.js';

const signed=(type,q,target=false)=>['sell','withdraw','deliver_out','fee','tax'].includes(type)||(['transfer','swap','merger'].includes(type)&&!target)?-q:q;
const decimal=v=>{try{return v==null?null:units(v);}catch{return null;}};
/** Read-only projection. Journal deltas take precedence over input quantities
 * (a correction input is a replacement balance, never a movement). */
export function bookingHistoryRows(model){
 const journals=new Map((model.journalEntries||[]).map(e=>[e.id,e]));
 const bookings=[...(model.bookings||[])];
 const linked=new Set(bookings.map(b=>b.journalEntryId??b.id));
 for(const e of model.journalEntries||[])if(!linked.has(e.id)&&['correction','adjust'].includes(e.type)){
  for(const positionId of new Set(e.postings.filter(p=>p.positionId&&p.quantityDeltaExact!=null).map(p=>p.positionId)))
   bookings.push({id:e.id+':'+positionId,journalEntryId:e.id,type:e.type,date:e.date,positionId,notes:'Technischer Journalabgleich'});
 }
 return bookings.map(b=>{
  const entry=journals.get(b.journalEntryId??b.id);
  let delta=null;
  if(entry){
   try{validateJournalEntry(entry);const postings=entry.postings.filter(p=>p.positionId===b.positionId&&p.quantityDeltaExact!=null);
    if(postings.length)delta=postings.reduce((n,p)=>n+units(p.quantityDeltaExact),0n);
   }catch{/* Invalid journal never becomes a guessed correction. */}
  }else if(['buy','sell','deposit','withdraw','deliver_in','deliver_out','adjust','reward','airdrop','dividend','interest','fee','tax','transfer'].includes(b.type)){
   const q=decimal(b.quantityExact??b.quantity);if(q!==null)delta=signed(b.type,q);
  }
  const technical=['correction','adjust'].includes(b.type);
  const trade=['buy','sell'].includes(b.type)?decimal(b.amountExactEUR??b.amountEUR):null;
  return {...b,technical,deltaExact:delta===null?null:exact(delta),tradeExactEUR:trade===null?null:exact(trade)};
 }).sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
}
export function historyAction(model,p){
 if(p.wallet?.enabled){
  const supported=['btc','btc-hd','sol','spl'].includes(p.wallet.chain)||['evm','erc20'].includes(p.wallet.chain)&&Number(p.wallet.chainId||1)===1;
  if(!supported)return null;
  const exists=model.walletHistory?.sessions?.some(s=>s.id==='wallet-history:'+p.id);
  return {action:'wallet-history',label:exists?'Historie anzeigen':'Historie rekonstruieren'};
 }
 return (model.bookings||[]).some(b=>b.positionId===p.id||b.targetPositionId===p.id)||
  (model.journalEntries||[]).some(e=>['correction','adjust'].includes(e.type)&&e.postings.some(x=>x.positionId===p.id))?{action:'booking-history',label:'Historie anzeigen'}:null;
}
/** Account/position identity only. No inferred ISIN attribution or price fetch. */
export function positionHistory(model,positionId){
 const position=model.positions.find(p=>p.id===positionId);
 if(!position)return {events:[],grossBuysExactEUR:'0',unknownBuys:0};
 const all=bookingHistoryRows(model),events=all.filter(b=>b.positionId===positionId||b.targetPositionId===positionId).map(b=>{
  if(b.positionId===positionId)return {...b};
  const entry=(model.journalEntries||[]).find(e=>e.id===(b.journalEntryId??b.id));
  let delta=null;
  try{if(entry){validateJournalEntry(entry);const posts=entry.postings.filter(p=>p.positionId===positionId&&p.quantityDeltaExact!=null);if(posts.length)delta=posts.reduce((n,p)=>n+units(p.quantityDeltaExact),0n);}
   else delta=decimal(b.targetQuantityExact??(b.type==='transfer'?b.quantityExact??b.quantity:null));
  }catch{}
  return {...b,isTarget:true,positionName:position.name,accountId:position.accountId,deltaExact:delta===null?null:exact(delta)};
 });
 let gross=0n,unknownBuys=0;
 for(const b of events)if(b.type==='buy'&&!b.isTarget){if(b.tradeExactEUR===null)unknownBuys++;else gross+=units(b.tradeExactEUR);}
 // Absolute history requires the existing complete, balanced journal. Never
 // backfill an opening using today's holdings or the first trade amount.
 let coherent=false;try{coherent=ledgerQuantityAudit(model).ok;}catch{}
 const opening=(model.openingPositions||[]).find(p=>p.positionId===positionId);
 let quantity=coherent&&opening?decimal(opening.quantityExact):null;
 const journals=(model.journalEntries||[]).filter(e=>e.postings.some(p=>p.positionId===positionId&&p.quantityDeltaExact!=null)).sort((a,b)=>a.date.localeCompare(b.date)||(a.sequence||0)-(b.sequence||0));
 const knownIds=new Set(journals.map(e=>e.id));
 if(events.some(b=>!knownIds.has(b.journalEntryId??b.id)))quantity=null;
 const balances=new Map();
 for(const entry of journals){
  if(quantity!==null)quantity+=entry.postings.filter(p=>p.positionId===positionId&&p.quantityDeltaExact!=null).reduce((n,p)=>n+units(p.quantityDeltaExact),0n);
  balances.set(entry.id,quantity===null?null:exact(quantity));
 }
 for(const b of events){b.balanceExact=balances.get(b.journalEntryId??b.id)??null;}
 return {events,grossBuysExactEUR:exact(gross),unknownBuys,openingUndated:Boolean(opening&&!opening.asOf)};
}
