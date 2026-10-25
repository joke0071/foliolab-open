import {units,exact} from './decimal.js';
/**
 * Simple, strictly booked cash-income overview. No tax estimates, withholding
 * assumptions, unrealised profits or derived broker fees.
 */
export function bookedIncomeSummary(bookings){
 const totals={dividend:0,interest:0,fee:0,tax:0};
 const counts={dividend:0,interest:0,fee:0,tax:0};
 let unavailable=0;
 for(const b of bookings||[]){
  if(!Object.hasOwn(totals,b?.type))continue;
  const amount=Number(b.amountEUR);
  if(b.amountEUR==null||!Number.isFinite(amount)||amount<0){unavailable++;continue;}
  totals[b.type]+=amount;
  counts[b.type]++;
 }
 return {
  ...totals,counts,unavailable,
  income:totals.dividend+totals.interest,
  deductions:totals.fee+totals.tax,
  net:totals.dividend+totals.interest-totals.fee-totals.tax
 };
}

const readAmount=v=>{try{if(v==null||!['number','string'].includes(typeof v)||String(v).trim()==='')return null;const n=units(v);return n<0n?null:n;}catch{return null;}};
/** Read-only evidence projection. One journal posting is one record, not an
 * additional copy of the corresponding booking's fee/tax field. */
export function bookedAnnualOverview(model,{year='',accountId=''}={}){
 const records=[],journalIds=new Set((model.journalEntries||[]).map(e=>e.id)),byJournal=new Map(),seen=new Set();
 for(const b of model.bookings||[]){const key=b.journalEntryId||b.id;if(!journalIds.has(key))continue;const list=byJournal.get(key)||[];list.push(b);byJournal.set(key,list);}
 function accountFor(entry,bookings){
  const ids=new Set();for(const b of bookings){
   // Journal account is historical evidence; a position may have moved since.
   const historical=new Set(entry.postings.filter(p=>p.positionId===b.positionId&&p.accountId).map(p=>p.accountId));
   if(historical.size!==1)return null;const account=[...historical][0];
   if(b.accountId!=null&&b.accountId!==account)return null;ids.add(account);
  }
  if(ids.size===1)return [...ids][0];if(ids.size>1)return null;
  const assets=entry.postings.filter(p=>p.role==='asset'&&p.accountId),cash=entry.postings.filter(p=>p.role==='cash'&&p.accountId),own=new Set((assets.length?assets:cash).map(p=>p.accountId));return own.size===1?[...own][0]:null;
 }
 function add({id,date,kind,value,accountId,source,journalId=null,postingId=null,bookings=[],note=''}){
  if(seen.has(id))return;seen.add(id);
  const knownAccount=model.accounts?.some(a=>a.id===accountId)?accountId:null;
  records.push({id,date,year:String(date).slice(0,4),kind,amountExactEUR:value==null?null:exact(value),accountId:knownAccount,source,journalId,postingId,bookingIds:bookings.map(b=>b.id),note:String(note||'').slice(0,180)});
 }
 for(const e of model.journalEntries||[]){
  const bookings=byJournal.get(e.id)||[],accountId=accountFor(e,bookings),note=bookings.map(b=>b.notes).filter(Boolean).join(' · ');
  for(const kind of ['fee','tax',...(['dividend','interest'].includes(e.type)?[e.type]:[])]){
   const role=['fee','tax'].includes(kind)?kind:'income',posts=e.postings.filter(p=>p.role===role);
   for(const p of posts){let value=null;try{value=units(p.amountBookEURExact)*(role==='income'?-1n:1n);if(value<0n)value=null;}catch{}
    add({id:'journal:'+p.id,date:e.date,kind,value,accountId,source:'journal',journalId:e.id,postingId:p.id,bookings,note:note+(bookings.some(b=>b.date!==e.date)?' · Buchungsdatum weicht vom Journal ab':'')});
   }
   if(posts.length)continue;
   const trade=['buy','sell'].includes(e.type),own=['dividend','interest','fee','tax'].includes(e.type)&&kind===e.type;
   if(own||trade&&['fee','tax'].includes(kind)&&(!bookings.length||bookings.some(b=>readAmount(b[kind+'EUR'])!==0n)))
    add({id:'unknown:'+e.id+':'+kind,date:e.date,kind,value:null,accountId,source:'journal-gap',journalId:e.id,bookings,note:'Kein eindeutiger EUR-Posten für diesen erfassten Vorgang. '+note});
  }
 }
 for(const b of model.bookings||[]){
  if(journalIds.has(b.journalEntryId||b.id))continue;
  const p=model.positions.find(p=>p.id===b.positionId),accountId=p&&(b.accountId==null||b.accountId===p.accountId)?p.accountId:null;
  const kinds=['dividend','interest','fee','tax'].includes(b.type)?[b.type]:['buy','sell'].includes(b.type)?['fee','tax']:[];
  for(const kind of kinds){const own=b.type===kind,value=readAmount(own?b.amountExactEUR??b.amountEUR:b[kind+'EUR']);if(value===0n&&!own)continue;
   add({id:'booking:'+b.id+':'+kind,date:b.date,kind,value,accountId,source:'booking',bookings:[b],note:b.notes});
  }
 }
 const years=[...new Set(records.map(r=>r.year))].sort().reverse(),filtered=records.filter(r=>(!year||r.year===String(year))&&(!accountId||(accountId==='__unknown'?r.accountId===null:r.accountId===accountId))).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 const sums={dividend:0n,interest:0n,fee:0n,tax:0n};let unavailable=0;
 for(const r of filtered){if(r.amountExactEUR===null)unavailable++;else sums[r.kind]+=units(r.amountExactEUR);}
 return {years,records:filtered,unavailable,totals:Object.fromEntries(Object.entries(sums).map(([k,n])=>[k,exact(n)])),netExactEUR:exact(sums.dividend+sums.interest-sums.fee-sums.tax)};
}
