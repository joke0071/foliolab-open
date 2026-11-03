/** Retained original group and explicit quantity controls; never detach a source. */
import {sourceDigest,sourceUnmodified,validateImportSource} from './import-identity.js';
import {units} from './decimal.js';
import {validateJournalEntry} from './transactions.js';
export const BITPANDA_SOURCE='bitpanda-uh03-v1';
export const bitpandaWithdrawalId=group=>'uh03bp:'+group+':undo';
export const bitpandaWithdrawalDigest=value=>sourceDigest(JSON.stringify(value));
export const hasBitpandaWithdrawals=model=>(model?.journalEntries||[]).some(j=>j.bitpandaWithdrawal||j.type==='bitpanda-undo'||j.id?.startsWith('uh03bp:')&&j.id.endsWith(':undo'));
export function validateBitpandaWithdrawals(model){
 for(const j of model.journalEntries||[]){
  if(!j.bitpandaWithdrawal&&j.type!=='bitpanda-undo'&&!(j.id?.startsWith('uh03bp:')&&j.id.endsWith(':undo')))continue;
  const e=j.bitpandaWithdrawal,fail=()=>{throw Error('Bitpanda-Rücknahmenachweis unvollständig oder widersprüchlich.');};
  validateJournalEntry(j);
  if(j.type!=='bitpanda-undo'||j.source!==BITPANDA_SOURCE||j.status!=='removed'||!Number.isSafeInteger(j.sequence)||j.sequence<1||Object.keys(j).some(k=>!'id type date recordedAt sequence source status postings bitpandaWithdrawal'.split(' ').includes(k))||!e||e.version!==1||!/^[a-f0-9]{64}$/.test(e.group)||j.id!==bitpandaWithdrawalId(e.group)||Object.keys(e).sort().join()!=='checks,digest,group,originals,version'||!Array.isArray(e.originals)||!e.originals.length||e.originals.length>2||!Array.isArray(e.checks)||!e.checks.length||e.checks.length>2||JSON.stringify(e).length>128000||bitpandaWithdrawalDigest([e.originals,e.checks])!==e.digest||j.postings.length!==1)fail();
  const posting=j.postings[0];
  if(Object.keys(posting).sort().join()!=='accountId,amountBookEURExact,id,positionId,quantityDeltaExact,role'||posting.id!==j.id+':documentation'||posting.role!=='documentation'||posting.positionId!==null||posting.accountId!==null||posting.quantityDeltaExact!==null||units(posting.amountBookEURExact)!==0n)fail();
  let payload=null;const deltas=new Map();
  for(const [i,o] of e.originals.entries()){
   if(!o||Object.keys(o).sort().join()!=='booking,flows,journal')fail();
   const b=o.booking,r=o.journal,s=b?.importSource;if(!b||!r||!s)fail();
   validateJournalEntry(r);validateImportSource(s,b.accountId);
   let v;try{v=JSON.parse(s.sourcePayload);}catch{fail();}
   if(b.id!=='uh03bp:'+e.group+':'+i||b.journalEntryId!==b.id||r.id!==b.id||r.source!==BITPANDA_SOURCE||b.type!==r.type||b.date!==r.date||s.sourceId!==BITPANDA_SOURCE||s.fileId!==e.group||s.externalId!==e.group+':'+i||s.occurrence!==1||!v.netConfirmed||!/^[a-f0-9]{64}$/.test(v.source)||!Array.isArray(v.bindings)||!sourceUnmodified({journalEntries:[r]},b)||!Array.isArray(o.flows)||o.flows.length>1||!Number.isSafeInteger(r.sequence)||r.sequence>=j.sequence)fail();
   if(payload!==null&&payload!==v.source)fail();payload=v.source;
   if(model.bookings.some(x=>x.id===b.id||x.importSource?.sourceId===BITPANDA_SOURCE&&x.importSource.fileId===e.group)||model.journalEntries.some(x=>x.id===r.id)||model.externalCashFlows.some(x=>x.id===b.id))fail();
   if(['deposit','withdraw'].includes(b.type)){
    const f=o.flows[0],n=units(b.quantityExact)*(b.type==='deposit'?1n:-1n);
    if(o.flows.length!==1||f.id!==b.id||f.date!==b.date||units(f.amountExactEUR)!==n||units(f.amountEUR)!==n)fail();
   }else if(o.flows.length)fail();
   for(const p of r.postings){if(p.quantityDeltaExact==null)continue;deltas.set(p.positionId,(deltas.get(p.positionId)||0n)+units(p.quantityDeltaExact));}
  }
  if(e.checks.length!==deltas.size||new Set(e.checks.map(c=>c.positionId)).size!==e.checks.length)fail();
  for(const c of e.checks){
   if(Object.keys(c).sort().join()!=='after,before,delta,positionId'||!deltas.has(c.positionId)||units(c.before)<0n||units(c.after)<0n||units(c.after)-units(c.before)!==units(c.delta)||units(c.delta)!==-deltas.get(c.positionId))fail();
  }
 }
}
