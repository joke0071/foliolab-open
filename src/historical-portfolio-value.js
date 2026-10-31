/** Pure declared-scope aggregation; snapshots remain independent observations. */
import {projectHistoricalPosition} from './historical-position-value.js';
import {units,exact} from './decimal.js';
import {valueSign} from './defi.js';
export function projectHistoricalPortfolio(model,{dates=null,histories={},fxByCurrency={}}={}){
 const calendarInput=dates??[...new Set([
  ...Object.values(model.priceHistories??{}).flatMap(h=>(h.points??[]).map(p=>p.valuationDate??p.date).filter(Boolean)),
  ...Object.values(histories).flatMap(h=>(h.points||[]).map(p=>p.valuationDate??p.date).filter(Boolean)),...(model.walletHistory?.sessions||[]).flatMap(s=>[...(s.quotes||[]).map(q=>q.date),...s.events.filter(e=>e.timestamp).map(e=>e.timestamp.slice(0,10))]),...(model.journalEntries??[]).map(e=>e.date),...(model.snapshots??[]).map(s=>s.date)
 ])].sort();
 const calendar=[...new Set(calendarInput)].sort();
 if(calendar.length>15000)throw Error('Bewertungszeitraum zu groß.');
 const positions=new Map(model.positions.map(p=>[p.id,p])),orphaned=new Set();
 for(const e of model.journalEntries??[])for(const p of e.postings)if(p.positionId&&!positions.has(p.positionId))orphaned.add(p.positionId);
 const emptyAccounts=model.accounts.filter(a=>!model.positions.some(p=>p.accountId===a.id));
 if(calendar.length*model.positions.length>2000000)throw Error('Historie zu groß für eine direkte Übersicht. Zeitraum oder Portfolioumfang eingrenzen.');
 // Position metadata is stable during this synchronous pure projection. Only
 // quantity equality and dated valuation remain inside the daily loop.
 const walletSignatures=new Map(model.positions.filter(p=>p.wallet?.enabled).map(p=>[p,JSON.stringify([p.wallet.chain,p.wallet.chainId,p.wallet.contract||''])]));
 const walletRules=new Map(model.positions.map(p=>{
  const target=p.valuationMode==='excluded'?model.positions.find(x=>x.id===p.representedByPositionId):null;
  const alias=Boolean(p.wallet?.enabled&&target?.wallet?.enabled&&p.accountId===target.accountId&&walletSignatures.get(p)===walletSignatures.get(target));
  const overlap=Boolean(p.wallet?.enabled&&model.positions.some(other=>other.id!==p.id&&other.valuationMode!=='excluded'&&other.accountId===p.accountId&&other.wallet?.enabled&&walletSignatures.get(other)===walletSignatures.get(p)));
  return [p,{target,alias,overlap}];
 }));
 const walletDaysCache=new Map();
 const projections=new Map(model.positions.map(p=>[p.id,projectHistoricalPosition(model,p.id,{dates:calendar,marketHistory:histories[p.id]??null,fxPoints:fxByCurrency[p.currency]??null,walletDaysCache}).rows]));
 // This index belongs to this pure projection only; dated eligibility and all journal validation remain unchanged.
 const unresolvedClearing=(model.journalEntries||[]).filter(e=>e.status==='unresolved-clearing');
 const days=calendar.map((date,index)=>{
  let sum=0n;const missing=[...orphaned].map(id=>({positionId:id,reason:'Historische Positionsidentität fehlt.'}));
  missing.push(...emptyAccounts.map(a=>({accountId:a.id,reason:'Historischer Kontoumfang nicht belegt.'})));
  const components=[];
  for(const p of model.positions){
   const row=projections.get(p.id)[index];
   // Wallet facts and staking/LST accounting need their explicit ownership
   // contract before inclusion. Do not fall back to a second journal balance.
   if(p.valuationMode==='excluded'){const rule=walletRules.get(p),other=rule.target&&projections.get(rule.target.id)?.[index];const alias=rule.alias&&row.quantityExact!==null&&row.quantityExact===other?.quantityExact;if(alias||row?.quantityExact==='0')continue;missing.push({positionId:p.id,reason:'Historischer Umfang der wirtschaftlichen Repräsentation nicht belegt. Keine doppelte oder rückwirkende Anrechnung.'});continue;}
   if(walletRules.get(p).overlap){missing.push({positionId:p.id,reason:'Überlappende Wallet-Positionen: Eigentümer-/Assetzuordnung prüfen.'});continue;}

   if(row?.valueEURExact===null||!row){missing.push({positionId:p.id,reason:row?.reason||'Historische Bewertung fehlt.'});continue;}
   const signed=units(row.valueEURExact)*BigInt(valueSign(p));sum+=signed;components.push({...row,valueEURExact:exact(signed)});
  }
  if(unresolvedClearing.some(e=>e.date<=date)&&!missing.some(x=>x.reason==='Historisches Verrechnungskonto fehlt.'))missing.push({reason:'Historisches Verrechnungskonto fehlt.'});
  const complete=model.positions.length>0&&missing.length===0;
  return {date,totalEURExact:complete?exact(sum):null,partialEURExact:components.length?exact(sum):null,coverage:complete?'reconstructed':'partial',components,missing};
 });
 const observations=(model.snapshots??[]).map(s=>({...s,date:s.date,totalEURExact:s.totalEURExact??String(s.total),evidenceKind:'observed',snapshotId:s.id}));
 // One date index per pure projection; duplicate snapshots retain their input order.
 const observationsByDate=new Map();
 for(const item of observations){const matches=observationsByDate.get(item.date);if(matches)matches.push(item);else observationsByDate.set(item.date,[item]);}
 const reconciliation=days.flatMap(d=>d.totalEURExact===null?[]:(observationsByDate.get(d.date)||[]).map(s=>({date:d.date,snapshotId:s.snapshotId,reconstructedEURExact:d.totalEURExact,observedEURExact:s.totalEURExact,differenceEURExact:exact(units(d.totalEURExact)-units(s.totalEURExact)),status:units(d.totalEURExact)===units(s.totalEURExact)?'agrees':'review',reason:'Kurszeitpunkt, Cash-Abdeckung und manuelle Bewertung prüfen. Keine automatische Korrektur.'})));
 return {days,observations,reconciliation};
}

/** Never alternate observations and reconstructions in one line. No writes or requests. */
export function historicalWealthView(model,basis='auto'){
 let projection;try{projection=projectHistoricalPortfolio(model);}catch(error){return {samples:model.snapshots.map(s=>({...s,breakBefore:true})),label:'Erfasste Stichtage',basis:'observed',projection:{days:[],observations:[],reconciliation:[]},reason:error.message};}
 const complete=projection.days.filter(d=>d.totalEURExact!==null),partial=projection.days.filter(d=>d.partialEURExact!==null),observed=projection.observations;
 const selected=basis==='observed'&&observed.length?'observed':basis==='partial'&&partial.length?'partial':complete.length>=2?'reconstructed':observed.length?'observed':partial.length?'partial':'unavailable';
 let rows=selected==='reconstructed'?complete:selected==='partial'?partial:observed;
 const samples=rows.map((row,index)=>({...row,date:row.date,totalEURExact:selected==='partial'?row.partialEURExact:row.totalEURExact,breakBefore:selected==='observed'||index>0&&(selected==='partial'&&JSON.stringify(row.components.map(c=>c.positionId).sort())!==JSON.stringify(rows[index-1].components.map(c=>c.positionId).sort())||(Date.parse(row.date)-Date.parse(rows[index-1].date))/864e5>4||selected!=='observed'&&projection.days.indexOf(row)!==projection.days.indexOf(rows[index-1])+1),detail:selected==='partial'?'Teilportfolio · '+row.missing.map(m=>m.reason).filter((v,i,a)=>a.indexOf(v)===i).slice(0,3).join(' · '):selected==='observed'?'Erfasster Kontrollpunkt, keine interpolierte Tagesbewertung':'Rekonstruiert aus belegten Beständen und Kursen'}));
 return {samples,label:selected==='reconstructed'?'Rekonstruiert aus belegten Beständen und Kursen':selected==='partial'?'Rekonstruierte Positionen · Teilportfolio':selected==='observed'?'Erfasste Stichtage':'Historische Werte noch nicht belegbar',basis:selected,projection,reason:projection.days.flatMap(d=>d.missing).find(Boolean)?.reason??'Historische Kurse und Bestände ergänzen; manuelle Stichtage sind optional.'};
}
