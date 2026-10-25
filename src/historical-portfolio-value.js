/** Pure declared-scope aggregation; snapshots remain independent observations. */
import {projectHistoricalPosition} from './historical-position-value.js';
import {units,exact} from './decimal.js';
import {valueSign} from './defi.js';
export function projectHistoricalPortfolio(model,{dates=null,histories={},fxByCurrency={}}={}){
 const calendar=dates??[...new Set([
  ...Object.values(model.priceHistories??{}).flatMap(h=>(h.points??[]).map(p=>p.date)),
  ...(model.journalEntries??[]).map(e=>e.date),...(model.snapshots??[]).map(s=>s.date)
 ])].sort();
 if(calendar.length>15000)throw Error('Bewertungszeitraum zu groß.');
 const positions=new Map(model.positions.map(p=>[p.id,p])),orphaned=new Set();
 for(const e of model.journalEntries??[])for(const p of e.postings)if(p.positionId&&!positions.has(p.positionId))orphaned.add(p.positionId);
 const emptyAccounts=model.accounts.filter(a=>!model.positions.some(p=>p.accountId===a.id));
 const projections=new Map(model.positions.map(p=>[p.id,projectHistoricalPosition(model,p.id,{dates:calendar,marketHistory:histories[p.id]??null,fxPoints:fxByCurrency[p.currency]??[]}).rows]));
 const days=calendar.map((date,index)=>{
  let sum=0n;const missing=[...orphaned].map(id=>({positionId:id,reason:'Historische Positionsidentität fehlt.'}));
  missing.push(...emptyAccounts.map(a=>({accountId:a.id,reason:'Historischer Kontoumfang nicht belegt.'})));
  const components=[];
  for(const p of model.positions){
   const row=projections.get(p.id)[index];
   // Wallet facts and staking/LST accounting need their explicit ownership
   // contract before inclusion. Do not fall back to a second journal balance.
   if(p.wallet?.enabled||p.economicPosition){missing.push({positionId:p.id,reason:'Blockchain-/Staking-Abdeckung muss explizit mit der Kontostruktur abgeglichen werden.'});continue;}
   if(row?.valueEURExact===null||!row){missing.push({positionId:p.id,reason:row?.reason||'Historische Bewertung fehlt.'});continue;}
   const signed=units(row.valueEURExact)*BigInt(valueSign(p));sum+=signed;components.push({...row,valueEURExact:exact(signed)});
  }
  const complete=model.positions.length>0&&missing.length===0;
  return {date,totalEURExact:complete?exact(sum):null,partialEURExact:components.length?exact(sum):null,coverage:complete?'reconstructed':'partial',components,missing};
 });
 const observations=(model.snapshots??[]).map(s=>({date:s.date,totalEURExact:s.totalEURExact??String(s.total),source:'observed',snapshotId:s.id}));
 const reconciliation=days.flatMap(d=>observations.filter(s=>s.date===d.date&&d.totalEURExact!==null).map(s=>({date:d.date,snapshotId:s.snapshotId,reconstructedEURExact:d.totalEURExact,observedEURExact:s.totalEURExact,differenceEURExact:exact(units(d.totalEURExact)-units(s.totalEURExact)),status:units(d.totalEURExact)===units(s.totalEURExact)?'agrees':'review',reason:'Kurszeitpunkt, Cash-Abdeckung und manuelle Bewertung prüfen. Keine automatische Korrektur.'})));
 return {days,observations,reconciliation};
}
