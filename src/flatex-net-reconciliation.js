/** Bounded dated evidence around the existing EUR pair/journal engines. */
import {inspectFlatexNetPairs,prepareFlatexNetPreview,validateFlatexNetSettlements} from './flatex-net-settlement.js';
import {parseFlatexNativeCSV,bindNativeFlatexSourceContext,FLATEX_NATIVE_COLUMNS,FLATEX_DEPOT13_COLUMNS,FLATEX_ACCOUNT8_COLUMNS} from './flatex-native.js';
import {reviewNativeFlatexBindings} from './flatex-native-ui.js';
import {sourceDigest,sourceUnmodified,bookingOwnership} from './import-identity.js';
import {ledgerQuantityAudit,validCalendarDate} from './transactions.js';
import {units,exact,preciseValue} from './decimal.js';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const canonicalObject=x=>Array.isArray(x)?x.map(canonicalObject):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonicalObject(x[k])])):x;
const digest=x=>sourceDigest(JSON.stringify(canonicalObject(x)));
const bad=message=>{throw Error(message||'Datierter EUR-Bestandsabgleich widersprüchlich.');};
const exactKeys=(o,keys)=>{if(!o||Array.isArray(o)||Object.keys(o).sort().join('|')!==keys.split(' ').sort().join('|'))bad();};
const canonical=v=>{if(typeof v!=='string'||v.length>80||exact(units(v))!==v||units(v)<0n)bad('Belegwerte als exakte nichtnegative Dezimalwerte eingeben.');return v;};
const touches=(b,ids)=>[b.positionId,b.cashPositionId,b.targetPositionId].some(id=>ids.has(id));
export function flatexReconciliationScope(model,inspection,assignments,selectedIds){
 const binding=reviewNativeFlatexBindings(model,inspection.identities,assignments),ids=new Set(),sourceIds={};
 for(const id of selectedIds){
  const proof=inspection.pairs.find(p=>p.id===id);if(!proof||proof.version!==1)bad('2:1-Gruppen mit belegtem Anfangsbestand importieren; datierter Abgleich bleibt gesperrt.');
  for(const [type,match] of [['depot',p=>p.isin===proof.isin],['account',p=>p.kind==='cash'&&p.currency==='EUR']]){
   const c=binding.contexts.find(c=>c.sourceId===proof[type].sourceId);if(!c?.confirmed)bad('Aktuelle eigene Quellen und Konten bestätigen.');
   const ps=model.positions.filter(p=>p.accountId===c.accountId&&match(p));if(ps.length!==1)bad('Position und Geldkonto eindeutig zuordnen.');
   const p=ps[0];ids.add(p.id);if(sourceIds[p.id]&&sourceIds[p.id]!==proof[type].sourceId)bad('Mehrdeutiger Quellenbereich.');sourceIds[p.id]=proof[type].sourceId;
  }
 }
 let changed=true;
 while(changed){changed=false;for(const b of model.bookings.filter(b=>touches(b,ids))){
  if(!b.netSettlement||b.netAugmentation&&b.netAugmentation.version!==2||b.transferMatch||b.targetPositionId||!sourceUnmodified(model,b))bad('Fremde, geänderte oder ergänzte Buchungen benötigen einen eigenen Abgleich.');
  for(const [id,type]of [[b.positionId,'depot'],[b.cashPositionId,'account']]){
   const sourceId=b.netSettlement[type].sourceId;if(sourceIds[id]&&sourceIds[id]!==sourceId)bad('Mehrdeutiger Quellenbereich.');sourceIds[id]=sourceId;
   if(!ids.has(id)){ids.add(id);changed=true;}
  }
 }}
 return {ids:[...ids].sort(),sourceIds};
}
function observationAudit(model,observations){
 const dates=new Map();for(const o of observations){const group=dates.get(o.date)||[];group.push(o);dates.set(o.date,group);}
 for(const [date,rows]of dates){
  const ids=new Set(rows.map(o=>o.positionId)),quantities=new Map();
  for(const o of rows){if(quantities.has(o.positionId)&&quantities.get(o.positionId)!==o.quantityExact)bad('Widersprüchliche Mengen am selben Belegtag.');quantities.set(o.positionId,o.quantityExact);}
  const copy={positions:model.positions.filter(p=>ids.has(p.id)).map(p=>({...p,quantityExact:quantities.get(p.id),quantity:Number(quantities.get(p.id))})),openingPositions:model.openingPositions,journalEntries:model.journalEntries.filter(j=>j.date<=date&&j.postings.some(p=>ids.has(p.positionId)))};
  const audit=ledgerQuantityAudit(copy);if(audit.mismatches.length)bad('Datierter Beleg widerspricht der zeitlichen Journalmenge.');
 }
}
/** Called by the ordinary model/backup validators; evidence survives reload. */
export function validateFlatexNetReconciliations(model){
 for(const anchor of model.bookings||[]){
  const c=anchor.netReconciliation;if(c===undefined)continue;
  if(JSON.stringify(c).length>512000)bad('Bestandsbeleg überschreitet das sichere Prüflimit.');
  exactKeys(c,'version id groupIds preserved observations references');
  if(c.version!==1||!anchor.netSettlement||!Array.isArray(c.groupIds)||!c.groupIds.length||c.groupIds.length>2500||new Set(c.groupIds).size!==c.groupIds.length||!c.groupIds.includes(anchor.netSettlement.id)||!Array.isArray(c.preserved)||!c.preserved.length||c.preserved.length>2500||!Array.isArray(c.observations)||c.observations.length<2||c.observations.length>520||!Array.isArray(c.references)||c.references.length>24)bad();
  const {id,...body}=c;if(id!=='fnr-'+digest(body))bad('Gespeicherter Bestandsbeleg wurde verändert.');
  const groups=c.groupIds.map(id=>model.bookings.find(b=>b.netSettlement?.id===id));if(groups.some(b=>!b))bad('Bestandsbeleg benötigt alle zugeordneten Wirtschaftsgruppen.');
  if(c.preserved.length>=groups.length||new Set(c.preserved.map(p=>p.bookingId)).size!==c.preserved.length)bad('Vorhandene und neue Wirtschaftsgruppen eindeutig trennen.');
  const ids=new Set(groups.flatMap(b=>[b.positionId,b.cashPositionId]));
  if(ids.size>20)bad('Höchstens 20 gekoppelte Positionen je datiertem Abgleich.');
  const sourceIds={};for(const b of groups)for(const [p,t]of [[b.positionId,'depot'],[b.cashPositionId,'account']]){if(sourceIds[p]&&sourceIds[p]!==b.netSettlement[t].sourceId)bad();sourceIds[p]=b.netSettlement[t].sourceId;}
  const seen=new Set();
  for(const o of c.observations){
   exactKeys(o,'role snapshotId date positionId accountId sourceId sourceReference quantityExact priceExact valueEURExact currency');
   const p=model.positions.find(p=>p.id===o.positionId),key=JSON.stringify([o.role,o.snapshotId,o.positionId]);
   if(!p||!ids.has(p.id)||seen.has(key)||p.accountId!==o.accountId||o.sourceId!==sourceIds[p.id]||o.currency!=='EUR'||p.currency!=='EUR'||!validCalendarDate(o.date)||o.date>new Date().toISOString().slice(0,10)||!['opening','closing','reference'].includes(o.role)||typeof o.sourceReference!=='string'||!o.sourceReference.trim()||o.sourceReference.length>180)bad('Quelle, Konto, Datum und Bewertungsbezug vollständig belegen.');seen.add(key);
   for(const k of ['quantityExact','priceExact','valueEURExact'])canonical(o[k]);
   if(units(o.priceExact)<=0n||preciseValue(o.quantityExact,o.priceExact)!==o.valueEURExact||p.kind==='cash'&&o.priceExact!=='1')bad('Menge, historischer EUR-Preis und belegter EUR-Wert widersprechen sich.');
   if(o.role!=='reference'&&o.snapshotId!==null)bad();
   if(o.role==='opening'){
    const opening=model.openingPositions.find(x=>x.positionId===p.id);
    if(!opening||opening.asOf!==o.date||opening.quantityExact!==o.quantityExact)bad('Bestehender datierter Anfangsbestand bleibt unverändert.');
   }
   if(o.role==='reference'){
    const s=c.references.find(s=>s.id===o.snapshotId);if(!s||s.date!==o.date||s.source!=='current'||!s.byPosition||s.byPosition[p.id]!==o.valueEURExact)bad('Bewertungsbeleg passt nicht zum erhaltenen Referenzstand.');
   }
  }
  const starts=c.observations.filter(o=>o.role==='opening'),ends=c.observations.filter(o=>o.role==='closing');
  if(starts.length!==ids.size||ends.length!==ids.size||new Set(starts.map(o=>o.date)).size!==1||new Set(ends.map(o=>o.date)).size!==1)bad('Alle betroffenen Positionen an denselben Anfangs- und Endtagen belegen.');
  const first=starts[0].date,last=ends[0].date;
  if(first>=last||groups.some(b=>b.date<=first||b.date>last)||c.observations.some(o=>o.date<first||o.date>last)||c.references.some(s=>!s.byPosition||s.source!=='current'||s.revisions?.length))bad('Belegzeitraum oder überarbeiteter Referenzstand nicht eindeutig.');
  for(const s of c.references)for(const id of ids)if(Object.hasOwn(s.byPosition,id)&&!c.observations.some(o=>o.role==='reference'&&o.snapshotId===s.id&&o.positionId===id))bad('Jeden betroffenen Referenzwert unabhängig belegen.');
  for(const p of c.preserved){
   exactKeys(p,'bookingId bookingDigest journalId journalDigest');const b=model.bookings.find(b=>b.id===p.bookingId),j=model.journalEntries.find(j=>j.id===p.journalId);
   if(!b||!j||b.journalEntryId!==j.id||!c.groupIds.includes(b.netSettlement?.id)||digest(b)!==p.bookingDigest||digest(j)!==p.journalDigest)bad('Vorhandene Buchungen und Journale bleiben unverändert geschützt.');
  }
  observationAudit(model,c.observations);
 }
 return model;
}
const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
function documentarySources(proofs){
 const buckets=new Map();for(const p of proofs)for(const type of ['depot','account']){const s=p[type],key=JSON.stringify([type,s.dialect??null,s.sourceContext??null]),rows=buckets.get(key)||[];rows.push(s);buckets.set(key,rows);}
 return [...buckets.values()].map(rows=>{const s=rows[0],columns=s.dialect==='depot13'?FLATEX_DEPOT13_COLUMNS:s.dialect==='account8'?FLATEX_ACCOUNT8_COLUMNS:FLATEX_NATIVE_COLUMNS[s.type];let d=parseFlatexNativeCSV([columns.map(c=>quote(c.header)).join(';'),...rows.map(s=>s.fields.map(quote).join(';'))].join('\n'));return s.dialect?bindNativeFlatexSourceContext(d,s.sourceContext):d;});
}
export function prepareFlatexNetReconciliationPreview(model,documents,assignments,options={}){
 const inspection=inspectFlatexNetPairs(documents),blocked=reason=>({kind:'flatex-native-trade-preview',eligible:false,ready:false,writeEnabled:false,reason,preview:null,prepared:{...inspection,issues:[]}});
 try{
  validateFlatexNetSettlements(model);
  const {selectedIds=[],observations=[],confirmed=false,stale=false}=options;
  if(stale||!Array.isArray(selectedIds)||!selectedIds.length||selectedIds.length>2500||new Set(selectedIds).size!==selectedIds.length)bad('Eindeutige EUR-Paare ausdrücklich auswählen.');
  const selected=selectedIds.map(id=>inspection.pairs.find(p=>p.id===id));if(selected.some(p=>!p||p.version!==1))bad('Quelle geändert oder 2:1-Gruppe benötigt belegten Anfangsbestand.');
  const fresh=selected.filter(p=>!model.bookings.some(b=>b.netSettlement?.id===p.id));
  const binding=reviewNativeFlatexBindings(model,inspection.identities,assignments,{stale});
  for(const proof of selected){const b=model.bookings.find(b=>b.netSettlement?.id===proof.id);if(b){
   if(['depot','account'].some(t=>b.netSettlement[t].payloadDigest!==proof[t].payloadDigest))bad('Geänderte Originalquelle bleibt Konflikt.');
   for(const [t,id]of [['depot',b.positionId],['account',b.cashPositionId]]){const c=binding.contexts.find(c=>c.sourceId===proof[t].sourceId);if(!c?.confirmed||c.accountId!==model.positions.find(p=>p.id===id)?.accountId)bad('Vorhandene Quellenbindung geändert.');}
  }}
  if(!fresh.length)return {kind:'flatex-native-trade-preview',eligible:true,ready:false,writeEnabled:false,reason:'',prepared:{...inspection,issues:[]},preview:{baseline:JSON.stringify(model),simulated:structuredClone(model),rows:selected.map((proof,i)=>({line:i+2,status:'duplicate',row:{netSettlement:proof}})),ready:0,duplicates:selected.length,skipped:0,issues:[],evidenceUpdates:0,netReconciliation:true}};
  if(!confirmed||!Array.isArray(observations)||observations.length>520)bad('Datierte unabhängige Bestands- und Bewertungsbelege ausdrücklich bestätigen; höchstens 520 Werte.');
  if(!ledgerQuantityAudit(model).ok)bad('Ausgangsjournal stimmt nicht mit den gespeicherten Beständen überein.');
  const scope=flatexReconciliationScope(model,inspection,assignments,selectedIds),ids=new Set(scope.ids),old=model.bookings.filter(b=>touches(b,ids)),oldJournalIds=new Set(old.map(b=>b.journalEntryId));
  if(ids.size>20)bad('Höchstens 20 gekoppelte Positionen je datiertem Abgleich.');
  if(!old.length)bad('Dieser Abgleich benötigt bereits journalisierte EUR-Paare.');
  if(model.journalEntries.some(j=>j.postings.some(p=>ids.has(p.positionId))&&!oldJournalIds.has(j.id)))bad('Fremdes Journal im betroffenen Bereich.');
  for(const id of ids){const p=model.positions.find(p=>p.id===id),o=model.openingPositions.find(o=>o.positionId===id);if(!o?.asOf||p.archived||p.wallet?.enabled||p.managementSource==='wallet'||[p.costBasisExact,p.costBasisEUR,p.realizedPnLExact,p.realizedPnLEUR,o.costBasisExact,o.realizedPnLExact].some(v=>v!=null))bad('Datierter Anfang erforderlich; Wallets und bestätigte Kosten oder Ergebnisse bleiben geschützt.');}
  const oldByGroup=new Map(old.map(b=>[b.netSettlement.id,b])),proofs=[...old.map(b=>b.netSettlement),...fresh];if(proofs.length>2500||new Set(proofs.map(p=>p.date)).size!==proofs.length)bad('Gleichdatierte oder zu große Historien benötigen einen gesonderten Chronologienachweis.');
  if((model.flatexNetRemovals||[]).some(r=>touches(r.booking,ids)))bad('Zurückgenommene Quellen im Bereich bleiben geschützt.');
  // Replay only a detached bounded scope through the existing pair engine.
  const draft=structuredClone(model);draft.bookings=draft.bookings.filter(b=>!oldByGroup.has(b.netSettlement?.id));draft.journalEntries=draft.journalEntries.filter(j=>!oldJournalIds.has(j.id));draft.snapshots=[];
  for(const id of ids){const p=draft.positions.find(p=>p.id===id),o=draft.openingPositions.find(o=>o.positionId===id);p.quantityExact=o.quantityExact;p.quantity=Number(o.quantityExact);}
  const docs=documentarySources(proofs),all=inspectFlatexNetPairs(docs),bound={};
  for(const r of all.identities.rows){const p=model.positions.find(p=>scope.sourceIds[p.id]===r.sourceId);if(!p)bad('Quellenbereich geändert.');bound[r.sourceId]={accountId:p.accountId};}
  for(const c of reviewNativeFlatexBindings(draft,all.identities,bound).contexts)Object.assign(bound[c.sourceId],{confirmed:true,accountSnapshot:c.accountSnapshot});
  const openingDate=model.openingPositions.find(o=>ids.has(o.positionId)).asOf;
  const replay=prepareFlatexNetPreview(draft,docs,bound,{selectedIds:all.pairs.map(p=>p.id),openingDate,openingConfirmed:true});if(!replay.eligible)bad(replay.reason);
  const result=replay.preview.simulated,created=result.bookings.filter(b=>ids.has(b.positionId)&&!oldByGroup.has(b.netSettlement?.id)),newJournalIds=new Set(created.map(b=>b.journalEntryId));
  for(const original of old){
   const b=result.bookings.find(b=>b.netSettlement?.id===original.netSettlement.id),j=result.journalEntries.find(j=>j.id===b?.journalEntryId),oj=model.journalEntries.find(j=>j.id===original.journalEntryId);
   const postings=x=>x.postings.map(({id,...p})=>p);
   if(!b||!same(postings(j),postings(oj))||b.importSource.sourcePayload!==original.importSource.sourcePayload)bad('Wiederaufbau würde vorhandene wirtschaftliche Buchungen verändern.');
  }
  result.bookings=[...structuredClone(model.bookings),...created];result.journalEntries=[...structuredClone(model.journalEntries),...result.journalEntries.filter(j=>newJournalIds.has(j.id))];
  let sequence=Math.max(0,...model.journalEntries.map(j=>j.sequence));for(const j of result.journalEntries.filter(j=>newJournalIds.has(j.id))){j.sequence=++sequence;if(!Number.isSafeInteger(sequence))bad('Journalreihenfolge überschreitet das Prüflimit.');}
  for(const b of created)b.importSource.ownedSnapshot=bookingOwnership(result,b);
  result.snapshots=structuredClone(model.snapshots);result.openingPositions=structuredClone(model.openingPositions);
  const endDates=observations.filter(o=>o.role==='closing').map(o=>o.date),end=endDates[0];
  const refs=model.snapshots.filter(s=>!s.byPosition||[...ids].some(id=>Object.hasOwn(s.byPosition,id)));
  if(refs.some(s=>!s.byPosition||s.date<openingDate||s.date>end))bad('Alle betroffenen Referenzen müssen im belegten Zeitraum liegen; Gesamtwerte bleiben gesperrt.');
  const body={version:1,groupIds:proofs.map(p=>p.id).sort(),preserved:old.map(b=>({bookingId:b.id,bookingDigest:digest(b),journalId:b.journalEntryId,journalDigest:digest(model.journalEntries.find(j=>j.id===b.journalEntryId))})),observations:structuredClone(observations),references:structuredClone(refs)};
  const certificate={...body,id:'fnr-'+digest(body)};created[0].netReconciliation=certificate;
  // The reserved tagged audit is understood here and rejected by older readers.
  created[0].netAugmentation={version:2,reconciliationId:certificate.id};
  for(const b of created)b.importSource.ownedSnapshot=bookingOwnership(result,b);
  validateFlatexNetSettlements(result);if(!ledgerQuantityAudit(result).ok)bad('Endbestand und rekonstruiertes Journal widersprechen sich.');
  const last=proofs.map(p=>p.date).sort().at(-1);for(const o of observations.filter(o=>o.role==='closing'))if(end<last||units(result.positions.find(p=>p.id===o.positionId).quantityExact)!==units(o.quantityExact))bad('Vollständige Historie ergibt nicht den unabhängig belegten Endbestand.');
  replay.preview.baseline=JSON.stringify(model);replay.preview.rows=replay.preview.rows.map(r=>oldByGroup.has(r.row?.netSettlement?.id)?{...r,status:'duplicate'}:r);replay.preview.ready=created.length;replay.preview.duplicates=old.length;replay.preview.netReconciliation=true;replay.preview.evidenceUpdates=0;
  return replay;
 }catch(e){return blocked(e.message);}
}

