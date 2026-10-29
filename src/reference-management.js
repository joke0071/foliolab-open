/** Historical references: existing selection/CAS/edits, visibility-only archive. */
import {safeImport,snapshot} from './model.js';
import {snapshotEditChanges,editSnapshot,deleteSnapshot} from './portfolio-edit-actions.js';
import {updatePositionSelection,positionSelectionSummary} from './position-selection.js';
import {historicalWealthView} from './historical-portfolio-value.js';
import {portfolioTwr,portfolioXirr,performanceIssues} from './performance.js';
import {capitalReferenceSeries} from './capital-flows.js';
import {setArchivePresentation} from './booking-history.js';
const clone=m=>structuredClone(m),raw=m=>JSON.stringify(m);
export const REFERENCE_DELETE_REASON='Löschen benötigt eine vollständige Abhängigkeitsprüfung, ein aktuelles Backup und eine eigene Bestätigung. Archivieren verändert nur die Sichtbarkeit.';
function rows(model){
 if(!Array.isArray(model?.snapshots))throw Error('Historische Referenzwerte fehlen.');
 const seen=new Set();for(const s of model.snapshots){if(typeof s?.id!=='string'||!s.id||s.id.length>120||seen.has(s.id))throw Error('Stichtagsidentitäten sind nicht eindeutig.');seen.add(s.id);}
 return model.snapshots;
}
function selected(model,ids){
 const shots=rows(model);
 if(!Array.isArray(ids)||!ids.length||ids.length>15000||new Set(ids).size!==ids.length)throw Error('Eindeutige Referenzwerte auswählen.');
 const index=new Map(shots.map(s=>[s.id,s]));return ids.map(id=>{const s=index.get(id);if(!s)throw Error('Referenzauswahl veraltet.');return s;});
}
function current(model,expectedModel,confirmed){
 if(confirmed!==true||expectedModel!==raw(model))throw Error('Bestätigung fehlt oder Referenzvorschau ist veraltet.');
 safeImport(clone(model));
}
export function referencePermissions(model,id){
 const s=selected(model,[id])[0];
 const manual=s.source==='manual'&&s.valuationStatus==='manual'&&s.byAccount==null&&s.byPosition==null&&Array.isArray(s.quoteTimes)&&s.quoteTimes.length===0;
 return {editReason:manual?'':'Herkunft geschützt: automatische, migrierte oder ungeklärte Originalwerte nur über die zuständige Quelle prüfen.',deleteReason:removalReason(model,s),startProtected:model.performanceFlowTrackingSince===s.date};
}
export function referenceOrigin(s){
 return s.valuationStatus==='legacy-unverified'||s.source==='legacy'?'historisch ungeprüft · migriertes Original':s.source==='manual'&&s.valuationStatus==='manual'?'Manuell bestätigt':s.source==='current'?'Erfasster aktueller Stand · '+(s.valuationStatus==='partial'?'unvollständig':s.valuationStatus==='observed'?'beobachtet':'Qualität ungeklärt'):'Herkunft oder Qualität ungeklärt';
}
export function referenceRows(model,filter='active'){
 if(!['active','archived','all'].includes(filter))throw Error('Unbekannte Referenzansicht.');
 const archived=new Set(model.bookingPresentation?.referenceArchivedIds||[]);
 return rows(model).filter(s=>filter==='all'||archived.has(s.id)===(filter==='archived')).slice().reverse();
}
/** Same stable-ID engine as positions/bookings, strictly bounded to the rendered view. */
export function updateReferenceSelection(model,ids,action,visibleIds){
 const shots=rows(model),known=new Set(shots.map(s=>s.id));
 if(!Array.isArray(visibleIds)||new Set(visibleIds).size!==visibleIds.length||visibleIds.some(id=>!known.has(id))||ids.some(id=>!visibleIds.includes(id)))throw Error('Auswahl liegt außerhalb der sichtbaren Referenzen.');
 if(!['toggle','filtered','unselect-filtered'].includes(action?.type))throw Error('Nur sichtbare Referenzwerte können ausgewählt werden.');
 if(action.type==='toggle'&&!visibleIds.includes(action.id)||action.matchingIds&&raw(action.matchingIds)!==raw(visibleIds))throw Error('Auswahl liegt außerhalb der sichtbaren Referenzen.');
 return updatePositionSelection({positions:shots.filter(s=>visibleIds.includes(s.id))},ids,action);
}
export function referenceSelectionSummary(model,ids,visibleIds){return positionSelectionSummary({positions:rows(model)},ids,visibleIds);}
export function previewReferenceArchive(model,ids,archived){
 safeImport(clone(model));if(typeof archived!=='boolean')throw Error('Ungültige Archivaktion.');
 const shots=selected(model,ids),stored=new Set(model.bookingPresentation?.referenceArchivedIds||[]),states=new Set(shots.map(s=>stored.has(s.id)));
 if(states.size!==1)throw Error('Auswahl enthält aktive und archivierte Werte. Bitte eine einheitliche Ansicht wählen; keine Teiländerung.');
 if(shots.every(s=>stored.has(s.id)===archived))throw Error('Ausgewählte Referenzwerte haben bereits diesen Archivstatus.');
 return {archived,items:shots.map(s=>({id:s.id,date:s.date,totalEURExact:s.totalEURExact,origin:referenceOrigin(s)}))};
}
export function prepareReferenceArchive(model,{ids,archived},{expectedModel,confirmed}={}){
 current(model,expectedModel,confirmed);previewReferenceArchive(model,ids,archived);
 const candidate=clone(model),next=new Set(candidate.bookingPresentation?.referenceArchivedIds||[]);
 for(const id of ids)if(archived)next.add(id);else next.delete(id);
 setArchivePresentation(candidate,{referenceIds:[...next]});safeImport(clone(candidate));return candidate;
}
export function previewReferenceEdit(model,id,values){
 safeImport(clone(model));const permission=referencePermissions(model,id);if(permission.editReason)throw Error(permission.editReason);
 const change=snapshotEditChanges(model,id,values);
 return {id,correction:change.correction,before:{date:change.current.date,totalEURExact:change.current.totalEURExact,note:change.current.note},after:{date:change.date,totalEURExact:change.totalExact,note:change.note},impact:change.correction?'Datum oder Betrag verändern die historische Beobachtung, den Abgleich und gegebenenfalls Renditen. Bestehende Originalrevisionen bleiben erhalten.':'Nur die Notiz ändert sich; Datum, Betrag und Renditestart bleiben erhalten.'};
}
export function prepareReferenceEdit(model,id,values,{expectedModel,confirmed}={}){
 current(model,expectedModel,confirmed);previewReferenceEdit(model,id,values);const candidate=clone(model);editSnapshot(candidate,id,values,{confirmCorrection:true});safeImport(clone(candidate));return candidate;
}
export function prepareReferenceAdd(model,{date,note,manualTotalEUR},{expectedModel,confirmed}={}){
 current(model,expectedModel,confirmed);if(typeof date!=='string'||!date)throw Error('Stichtag ausdrücklich angeben.');if(rows(model).some(s=>s.date===date))throw Error('Für diesen Stichtag existiert bereits ein Originalwert. Bitte in der Verwaltung prüfen; Hinzufügen überschreibt ihn nicht.');
 const candidate=clone(model);snapshot(candidate,date,note,{manualTotalEUR});safeImport(clone(candidate));return candidate;
}
const snapshotKeys=['id','date','total','totalEURExact','recordedAt','byAccount','byPosition','valuationStatus','source','quoteTimes','revisions','note'];
const revisionKeys=['recordedAt','date','note','totalEURExact','valuationStatus','source'];
function removalReason(model,s){
 if(model.performanceFlowTrackingSince===s.date)return 'Der Startstichtag der Renditeerfassung bleibt geschützt.';
 if(s.source!=='manual'||s.valuationStatus!=='manual'||s.byAccount!=null||s.byPosition!=null||!Array.isArray(s.quoteTimes)||s.quoteTimes.length)
  return 'Verlauf und Abgleich: Originalquelle, Aufschlüsselung oder Wiederimport sind noch nicht sicher rücknehmbar. Archivieren ist möglich.';
 if(s.date===new Date().toISOString().slice(0,10))return 'Der heutige Stichtag kann automatisch neu erfasst werden. Zuerst den Erfassungs- und Wiederanlagevertrag prüfen.';
 if(Object.keys(s).some(k=>!snapshotKeys.includes(k))||!Array.isArray(s.revisions)||s.revisions.some(r=>!r||Object.keys(r).some(k=>!revisionKeys.includes(k))||r.source!=='manual'||r.valuationStatus!=='manual'))
  return 'Originalrevision oder zusätzliche Referenzfelder benötigen eine eigene Abhängigkeitsprüfung.';
 // Restrict the textual reference proof to literal, unescaped identities.
 if(!/^[a-zA-Z0-9_-]{1,120}$/.test(s.id))return 'Stichtagsidentität ist für die Abhängigkeitsprüfung nicht eindeutig lesbar.';
 return '';
}
/** Explicit manual-observation inverse, using the existing snapshot removal and
 * archive contracts. No storage writes, cascades, source suppression or revaluation. */
function removalCandidate(model,ids){
 safeImport(clone(model));const shots=selected(model,ids),targets=new Set(ids);
 if(new Set(model.snapshots.map(s=>s.date)).size!==model.snapshots.length)throw Error('Stichtagsdaten sind nicht eindeutig.');
 for(const s of shots){const reason=removalReason(model,s);if(reason)throw Error(reason);}
 const candidate=clone(model);
 for(const id of ids)deleteSnapshot(candidate,id);
 setArchivePresentation(candidate,{referenceIds:(candidate.bookingPresentation?.referenceArchivedIds||[]).filter(id=>!targets.has(id))});
 // Inspect remaining originals AND encoded metadata. Raw substring checks alone
 // miss JSON Unicode escapes; unknown/opaque encoded references fail closed.
 let nodes=0,bytes=0;const stack=new WeakSet(),encoder=new TextEncoder();
 const scan=(value,depth=0)=>{
  if(++nodes>200000||depth>64)throw Error('Abhängigkeitsprüfung begrenzt. Keine Löschfreigabe.');
  if(typeof value==='string'){
   bytes+=encoder.encode(value).length;if(bytes>8000000)throw Error('Abhängigkeitsprüfung zu groß. Keine Löschfreigabe.');
   if(ids.some(id=>value.includes(id)))throw Error('Weitere Daten verweisen möglicherweise auf die Referenzidentität. Keine Teillöschung.');
   const text=value.trim();
   if(['{','[','"'].includes(text[0])){let decoded;try{decoded=JSON.parse(text);}catch{throw Error('Nicht lesbare codierte Referenzdaten. Keine Löschfreigabe.');}scan(decoded,depth+1);}
   else if(value.includes('\\u'))throw Error('Ungeklärte codierte Referenzdaten. Keine Löschfreigabe.');
  }else if(value&&typeof value==='object'){
   if(stack.has(value))throw Error('Zyklische Referenzdaten. Keine Löschfreigabe.');stack.add(value);
   for(const [key,item]of Object.entries(value)){scan(key,depth+1);scan(item,depth+1);}stack.delete(value);
  }
 };
 scan(candidate);
 safeImport(clone(candidate));return candidate;
}
function removalMetrics(model,start,end){
 return {views:['auto','observed','partial'].map(basis=>{const v=historicalWealthView(model,basis);return {basis,selectedBasis:v.basis,dates:v.samples.map(s=>s.date),reconciliation:v.projection.reconciliation.map(s=>({date:s.date,differenceEURExact:s.differenceEURExact})),reason:v.reason};}),
  start,end,twr:portfolioTwr(model,start,end),xirr:portfolioXirr(model,start,end),issues:performanceIssues(model,start,end),capital:capitalReferenceSeries(model,model.snapshots)};
}
export function previewReferenceRemoval(model,ids){
 const candidate=removalCandidate(model,ids),dates=model.snapshots.map(s=>s.date).sort(),start=dates[0],end=dates.at(-1);
 return {items:selected(model,ids).map(s=>clone(s)),before:removalMetrics(model,start,end),after:removalMetrics(candidate,start,end),
  impact:'Die ausgewählten Beobachtungen und ihre Abgleichpunkte entfallen. Nur daraus abgeleitete Verlaufstage können entfallen. Renditen und Kapitalreferenz werden aus den verbleibenden Belegen berechnet; fehlende Werte bleiben unbekannt. Bestände, Einstandswerte, Buchungen, Journal, Geldflüsse und Renditestart bleiben unverändert.'};
}
export function prepareReferenceRemoval(model,ids,{expectedModel,confirmed}={}){
 current(model,expectedModel,confirmed);return removalCandidate(model,ids);
}
