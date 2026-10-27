/** #165 phase 1: read-only provenance and transient selection. No mutation API. */
import {bookingHistoryRows} from './booking-history.js';
import {ledgerQuantityAudit} from './transactions.js';
import {updatePositionSelection,positionSelectionSummary} from './position-selection.js';

function unique(items,label){
 if(!Array.isArray(items))throw Error(label+' fehlen.');
 const seen=new Set();for(const item of items){if(typeof item?.id!=='string'||!item.id||seen.has(item.id))throw Error(label+' sind nicht eindeutig.');seen.add(item.id);}
}
function rows(model){
 unique(model?.bookings,'Buchungen');unique(model?.journalEntries,'Journal');unique(model?.positions,'Positionen');
 const result=bookingHistoryRows(model);unique(result,'Buchungsansicht');return result;
}
/** Reuse the existing stable-ID selection engine, including explicit global consent. */
export function updateBookingSelection(model,selectedIds,action){
 return updatePositionSelection({positions:rows(model)},selectedIds,action);
}
export function bookingSelectionSummary(model,selectedIds,matchingIds){
 return positionSelectionSummary({positions:rows(model)},selectedIds,matchingIds);
}
export function reviewBookingSelection(model,selectedIds,matchingIds){
 const items=rows(model),summary=positionSelectionSummary({positions:items},selectedIds,matchingIds);
 if(summary.requiresRefresh)throw Error('Buchungsauswahl veraltet. Neu prüfen.');
 let ledgerIssue=null;try{if(!ledgerQuantityAudit(model).ok)ledgerIssue='Bestand und Journal stimmen nicht überein.';}catch{ledgerIssue='Journalverlauf ist nicht vollständig prüfbar.';}
 const selected=new Set(selectedIds);
 return {kind:'booking-management-review',version:1,writeEnabled:false,summary,
  items:items.filter(b=>selected.has(b.id)).map(b=>{
   const original=model.bookings.find(x=>x.id===b.id),entry=model.journalEntries.find(e=>e.id===(b.journalEntryId??b.id));
   const position=model.positions.find(p=>p.id===b.positionId),categories=[];
   if(original?.importSource||original?.importFingerprint||entry?.source==='csv')categories.push('import');
   if(original?.transferMatch||['transfer','swap','merger'].includes(b.type)||entry?.status==='matched-internal-transfer')categories.push('linked');
   if(!original||['correction','adjust'].includes(b.type))categories.push('technical');
   if(position?.wallet?.enabled||position?.wallet?.address||position?.wallet?.xpub||entry?.source==='wallet'||entry?.source==='blockchain')categories.push('wallet');
   if(!categories.length)categories.push(original&&entry?.source==='manual'?'manual':'unknown');
   const reasons=[];
   if(ledgerIssue)reasons.push(ledgerIssue);
   if(!position)reasons.push('Zugeordnete Position fehlt.');
   if(!entry)reasons.push('Zugehöriger Journalnachweis fehlt.');
   if(entry&&model.bookings.filter(x=>(x.journalEntryId??x.id)===entry.id).length>1)reasons.push('Journal wird von mehreren Buchungen referenziert.');
   const messages={import:'Importherkunft erhalten; selektive Rücknahme ist noch nicht nachgewiesen.',linked:'Wirtschaftlich verknüpfter Vorgang; gemeinsame Auswirkungen zuerst prüfen.',technical:'Technischer Bestandsabgleich; keine direkte Entfernung von Journalpostings.',wallet:'Wallet-/Blockchain-Nachweis; kein manueller Eingriff ohne Replayvertrag.',unknown:'Herkunft ist nicht belegt.',manual:'Korrektur und Rücknahme benötigen einen geprüften Auswirkungen- und Commitvertrag.'};
   reasons.push(...categories.map(c=>messages[c]));
   return {id:b.id,positionId:b.positionId,journalEntryId:entry?.id??null,categories,approvedActions:[],reasons};
  })};
}
