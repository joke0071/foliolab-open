/** Persistent economic rollback evidence; source attribution is retained, never detached. */
import {sourceDigest,sourceUnmodified,validateImportSource} from './import-identity.js';
import {units} from './decimal.js';
import {validateJournalEntry,validateUnpricedUSDTransfers} from './transactions.js';
export const KRAKEN_SOURCE='kraken-uh03-v1';
export const krakenWithdrawalId=group=>'uh03:'+group+':undo';
export const withdrawalDigest=originals=>sourceDigest(JSON.stringify(originals));
export function validateKrakenWithdrawals(model){
 for(const j of model.journalEntries||[]){
  if(j.type!=='uh03-undo'&&!(j.id?.startsWith('uh03:')&&j.id.endsWith(':undo')))continue;
  const e=j.krakenWithdrawal,fail=()=>{throw Error('Kraken-Rücknahmenachweis unvollständig oder widersprüchlich.');};
  if(j.type!=='uh03-undo'||j.source!==KRAKEN_SOURCE||j.status!=='removed'||!e||e.version!==1||!Number.isSafeInteger(j.sequence)||j.sequence<1||typeof e.group!=='string'||!/^[a-f0-9]{64}$/.test(e.group)||j.id!==krakenWithdrawalId(e.group)||Object.keys(j).some(k=>!'id type date recordedAt sequence source status postings krakenWithdrawal'.split(' ').includes(k))||Object.keys(e).some(k=>!'version group count originals digest'.split(' ').includes(k))||!Array.isArray(e.originals)||!e.originals.length||e.originals.length>24||e.count!==e.originals.length||withdrawalDigest(e.originals)!==e.digest||JSON.stringify(e).length>512000||!Array.isArray(j.postings)||j.postings.length!==1)fail();
  const p=j.postings[0];
  if(p.id!==j.id+':documentation'||p.role!=='documentation'||p.positionId!==null||p.accountId!==null||p.quantityDeltaExact!==null||units(p.amountBookEURExact)!==0n)fail();
  const ids=new Set();let payload=null;
  for(const [i,o] of e.originals.entries()){
   const b=o?.booking,r=o?.journal,s=b?.importSource;
   if(!b||!r||!s)fail();
   validateJournalEntry(r);
   validateUnpricedUSDTransfers({...model,bookings:[b],journalEntries:[r],externalCashFlows:[]});
   validateImportSource(s,b.accountId);
   let v;try{v=JSON.parse(s.sourcePayload);}catch{fail();}
   if(b.id!=='uh03:'+e.group+':'+i||b.journalEntryId!==b.id||r.id!==b.id||r.source!==KRAKEN_SOURCE||b.type!==r.type||b.date!==r.date||s.sourceId!==KRAKEN_SOURCE||s.fileId!==e.group||s.externalId!==e.group+':'+i||s.occurrence!==1||v.group!==e.group||typeof v.payload!=='string'||!Array.isArray(v.bindings)||!sourceUnmodified({journalEntries:[r]},b)||!Array.isArray(o.flows)||o.flows.length>1||ids.has(b.id))fail();
   if(payload!==null&&payload!==v.payload)fail();payload=v.payload;ids.add(b.id);
   if(model.bookings.some(x=>x.id===b.id||x.importSource?.sourceId===KRAKEN_SOURCE&&x.importSource.fileId===e.group)||model.journalEntries.some(x=>x.id===r.id)||model.externalCashFlows.some(x=>x.id===b.id))fail();
   if(['deposit','withdraw'].includes(b.type)){
    const f=o.flows[0],n=units(b.quantityExact)*(b.type==='deposit'?1n:-1n);
    if(o.flows.length!==1||f.id!==b.id||f.date!==b.date||units(f.amountExactEUR)!==n||units(f.amountEUR)!==n)fail();
   }else if(o.flows.length)fail();
  }
 }
}
