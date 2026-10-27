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

// Mutations are limited to provable EUR cash business events. The existing
// transaction engine validates replacements; no historical price is inferred.
import {executeTransaction,validateJournalEntry,nextJournalSequence} from './transactions.js';
import {units,exact} from './decimal.js';
import {safeImport,totalExactEUR} from './model.js';
import {sourceDigest} from './import-identity.js';
const cashTypes=new Set(['deposit','withdraw','dividend','interest','fee','tax']);
const clone=x=>structuredClone(x);
const raw=x=>JSON.stringify(x);
function references(value,ids,guard={nodes:0},depth=0){
 if(++guard.nodes>200000||depth>64)throw Error('Referenzprüfung überschreitet das sichere Prüflimit.');
 if(value==null)return false;
 if(typeof value==='string')return ids.some(id=>value===id||value.includes(id));
 if(typeof value!=='object')return false;
 return Object.entries(value).some(([k,v])=>ids.includes(k)||references(v,ids,guard,depth+1));
}
function eligibility(model,b,action){
 const e=model.journalEntries.find(e=>e.id===b?.journalEntryId),p=model.positions.find(p=>p.id===b?.positionId),reasons=[];
 if(!b||!e||!p)return ['Buchung, Journal oder Position fehlen.'];
 if(e.source!=='manual'||b.importSource||b.importFingerprint)reasons.push('Importierte oder unbekannte Herkunft: den beleggebundenen Import-/Undo-Weg verwenden.');
 if(b.transferMatch||b.targetPositionId||['transfer','swap','merger'].includes(b.type))reasons.push('Verknüpfter Vorgang: Gegenbuchungen müssen gemeinsam fachlich geprüft werden.');
 if(p.wallet?.enabled||p.wallet?.address||p.wallet?.xpub)reasons.push('Wallet-/Blockchain-Ereignisse sind hier gesperrt.');
 if(model.bookings.filter(x=>x.journalEntryId===e.id).length!==1||e.type!==b.type||e.date!==b.date)reasons.push('Buchungs-/Journalzuordnung ist nicht eindeutig.');
 if(p.representedByPositionId||(p.economicRole&&p.economicRole!=='standard')||(p.valuationMode&&p.valuationMode!=='included'))reasons.push('Wirtschaftlich zugeordnete Position: gemeinsame Auswirkungen ungeklärt.');
 if(action==='notes')return reasons;
 if(e.status!=='recorded'||b.external!==['deposit','withdraw'].includes(b.type))reasons.push('Status oder Kapitalflussklassifikation ist nicht belegt.');
 if(!cashTypes.has(b.type)||p.kind!=='cash'||p.currency!=='EUR'||Number(b.fxRate)!==1||units(p.priceExact??p.price)!==units(1))reasons.push('Wirtschaftliche Änderung derzeit nur für belegte manuelle EUR-Geldbuchungen.');
 if(b.cashPositionId||Number(b.feeEUR)!==0||Number(b.taxEUR)!==0)reasons.push('Zusätzliche Gebühren-, Steuer- oder Gegenkontoverknüpfung ist nicht auflösbar.');
 try{
  validateJournalEntry(e);
  const q=units(b.quantityExact),sign=['deposit','dividend','interest'].includes(b.type)?1n:-1n;
  const own=e.postings.filter(x=>x.positionId===p.id),other=e.postings.filter(x=>!x.positionId);
  const role=['deposit','withdraw'].includes(b.type)?'external-clearing':['fee','tax'].includes(b.type)?b.type:'income';
  if(q<=0n||units(b.quantity)!==q||units(b.amountExactEUR)!==q||units(b.amountEUR)!==q||
   e.postings.length!==2||own.length!==1||other.length!==1||own[0].role!=='cash'||other[0].role!==role||
   own[0].accountId!==p.accountId||b.accountId!==p.accountId||own[0].quantityDeltaExact==null||
   units(own[0].quantityDeltaExact)!==sign*q||units(own[0].amountBookEURExact)!==sign*q||units(other[0].amountBookEURExact)!==-sign*q||other[0].quantityDeltaExact!=null||other[0].accountId!=null)
    reasons.push('Mengen, EUR-Beträge oder Kontobelege widersprechen dem Geldvorgang.');
  const flows=model.externalCashFlows.filter(f=>f.id===b.id);
  if(['deposit','withdraw'].includes(b.type)?flows.length!==1||units(flows[0].amountExactEUR)!==sign*q||units(flows[0].amountEUR)!==sign*q||flows[0].date!==b.date:flows.length!==0)
    reasons.push('Externer Kapitalfluss ist nicht eindeutig belegt.');
 }catch{reasons.push('Exakte Mengen- oder Journalnachweise sind ungültig.');}
 if(model.snapshots.some(s=>s.date>=b.date))reasons.push('Spätere Kontrollpunkte könnten widersprechen; zuerst beleggebunden abgleichen.');
 const targets=[b.id,e.id,...e.postings.map(p=>p.id)];
 const rest={...model,bookings:model.bookings.filter(x=>x.id!==b.id),journalEntries:model.journalEntries.filter(x=>x.id!==e.id),externalCashFlows:model.externalCashFlows.filter(x=>x.id!==b.id)};
 if(references(rest,targets))reasons.push('Weitere gespeicherte Referenzen verhindern eine isolierte Änderung.');
 return [...new Set(reasons)];
}
export function previewBookingChange(model,request){
 const ids=request?.ids,action=request?.action;
 if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||!['notes','edit','remove'].includes(action))throw Error('Ungültiger Änderungsauftrag.');
 if(ids.length>200)throw Error('Höchstens 200 Buchungen je Änderung prüfen; Auswahl eingrenzen.');
 if(raw(model).length>8_000_000)throw Error('Datenumfang überschreitet das sichere Prüflimit.');
 rows(model);safeImport(clone(model));
 if(!ledgerQuantityAudit(model).ok)throw Error('Journal und Bestände stimmen nicht überein.');
 if(action==='notes'&&Object.keys(request.changes||{}).some(k=>k!=='notes'))throw Error('Nur die Notiz ist änderbar.');
 if(action!=='remove'&&ids.length!==1)throw Error('Korrekturen benötigen genau eine Buchung.');
 const reason=String(request.reason||'').trim();if(!reason||reason.length>180)throw Error('Bitte eine Belegreferenz oder Begründung mit höchstens 180 Zeichen angeben.');
 const selected=ids.map(id=>{const b=model.bookings.find(x=>x.id===id);if(!b)throw Error('Buchung nicht vorhanden oder technisch; Auswahl neu prüfen.');return b;});
 const blocks=selected.flatMap(b=>eligibility(model,b,action).map(reason=>({id:b.id,reason})));
 const result={action,ids:[...ids],blocks,ready:false,effects:[],beforeTotalEURExact:totalExactEUR(model),afterTotalEURExact:null,candidate:null};
 if(action==='edit'&&request.changes?.date&&model.snapshots.some(s=>s.date>=request.changes.date))blocks.push({id:ids[0],reason:'Das neue Datum berührt gespeicherte Kontrollpunkte.'});
 if(blocks.length)return result;
 const candidate=clone(model),originals=selected.map(b=>({booking:clone(b),journal:clone(model.journalEntries.find(e=>e.id===b.journalEntryId)),flows:clone(model.externalCashFlows.filter(f=>f.id===b.id))}));
 if(action==='notes'){
  const note=String(request.changes?.notes??'').trim();if(note.length>180)throw Error('Notiz ist zu lang.');
  candidate.bookings.find(b=>b.id===ids[0]).notes=note;
 }else{
  for(const b of selected){
   const e=model.journalEntries.find(e=>e.id===b.journalEntryId),posting=e.postings.find(p=>p.positionId===b.positionId),p=candidate.positions.find(p=>p.id===b.positionId);
   const next=units(p.quantityExact)-units(posting.quantityDeltaExact);if(next<0n)throw Error('Rücknahme führt zu negativem Geldbestand.');
   p.quantityExact=exact(next);p.quantity=Number(p.quantityExact);
  }
  candidate.bookings=candidate.bookings.filter(b=>!ids.includes(b.id));
  const journals=selected.map(b=>b.journalEntryId);candidate.journalEntries=candidate.journalEntries.filter(e=>!journals.includes(e.id));
  candidate.externalCashFlows=candidate.externalCashFlows.filter(f=>!ids.includes(f.id));
  if(!ledgerQuantityAudit(candidate).ok)throw Error('Verbleibender chronologischer Verlauf ist nicht sicher.');
  if(action==='edit'){
   const b=selected[0],changes=request.changes||{};
   if(Object.keys(changes).some(k=>!['quantity','date','notes'].includes(k)))throw Error('Nur Betrag, Datum und Notiz sind hier änderbar.');
   executeTransaction(candidate,{...b,id:b.id,quantity:changes.quantity??b.quantityExact,date:changes.date??b.date,notes:changes.notes??b.notes,unitPrice:1,fxRate:1});
  }
 }
 const afterBookings=ids.map(id=>candidate.bookings.find(b=>b.id===id)||null);
 // An audit-only entry has no financial or quantity postings. Originals remain
 // reviewable after complete business-event removal, including backup/restore.
 const auditId=globalThis.crypto.randomUUID();
 const dates=[...model.journalEntries.map(e=>e.date),...candidate.journalEntries.map(e=>e.date)].sort();
 candidate.journalEntries.push({id:auditId,type:'booking-management-audit',date:dates.at(-1),recordedAt:new Date().toISOString(),sequence:nextJournalSequence(candidate),source:'management-audit',postings:[{id:globalThis.crypto.randomUUID(),role:'documentation',positionId:null,accountId:null,quantityDeltaExact:null,amountBookEURExact:'0'}],managementAudit:{version:1,action,reason,originals,afterBookings}});
 safeImport(clone(candidate));
 result.effects=[...new Set(selected.map(b=>b.positionId))].map(positionId=>{
  const before=model.positions.find(p=>p.id===positionId),after=candidate.positions.find(p=>p.id===positionId),group=selected.filter(b=>b.positionId===positionId),groupIds=group.map(b=>b.id),afterGroup=candidate.bookings.filter(b=>groupIds.includes(b.id));
  const charges=(books,kind)=>exact(books.reduce((n,b)=>n+units(b[kind==='fee'?'feeEUR':'taxEUR']??0)+(b.type===kind?units(b.amountExactEUR):0n),0n));
  return {bookingIds:groupIds,positionId,accountId:before.accountId,currency:before.currency,beforeQuantityExact:before.quantityExact,afterQuantityExact:after.quantityExact,deltaExact:exact(units(after.quantityExact)-units(before.quantityExact)),beforeCostBasisExact:before.costBasisExact??null,afterCostBasisExact:after.costBasisExact??null,feeEUR:charges(group,'fee'),afterFeeEUR:charges(afterGroup,'fee'),taxEUR:charges(group,'tax'),afterTaxEUR:charges(afterGroup,'tax'),beforeFlows:clone(model.externalCashFlows.filter(f=>groupIds.includes(f.id))),afterFlows:clone(candidate.externalCashFlows.filter(f=>groupIds.includes(f.id))),history:action==='notes'?'Nur Notiz; finanzielle Historie unverändert.':'Vorhandene datierte Journalereignisse werden korrigiert; keine Kurse oder Renditewerte erfunden.'};
 });
 result.ready=true;result.candidate=candidate;result.afterTotalEURExact=totalExactEUR(candidate);result.auditId=auditId;return result;
}
export function prepareBookingChange(model,request,{expectedModel,confirmed}={}){
 if(confirmed!==true||expectedModel!==raw(model))throw Error('Bestätigung fehlt oder Vorschau ist veraltet.');
 const preview=previewBookingChange(model,request);if(!preview.ready)throw Error(preview.blocks.map(x=>x.reason).join(' '));
 return {candidate:preview.candidate,receipt:{kind:'booking-change-undo',before:expectedModel,after:raw(preview.candidate),digest:sourceDigest(raw(preview.candidate))}};
}
export function canUndoBookingChange(model,receipt){return Boolean(receipt?.kind==='booking-change-undo'&&receipt.after===raw(model));}
export function prepareBookingUndo(model,receipt){
 if(!canUndoBookingChange(model,receipt))throw Error('Portfolio seit der Änderung verändert; Undo gesperrt.');
 const candidate=JSON.parse(receipt.before);safeImport(clone(candidate));return candidate;
}
