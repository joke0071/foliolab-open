import {units,exact} from './decimal.js';
import {previewCSV} from './csv-import.js';
import {ledgerQuantityAudit} from './transactions.js';
import {reconcileFlatexPositions,flatexCustodyAccounts} from './flatex-reconciliation.js';
import {prepareNativeFlatexImport} from './flatex-import.js';
import {reviewNativeFlatexBindings} from './flatex-native-ui.js';

/** Strict native simulation over the existing CSV/backfill engines. No write API. */
export function prepareNativeFlatexPreview(model,documents,assignments,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(k=>!['mode','stale'].includes(k))||!['append','backfill'].includes(options.mode)||(options.stale!==undefined&&typeof options.stale!=='boolean'))throw Error('Expliziten nativen Vorschautyp ohne Importoverrides wählen.');
 const prepared=prepareNativeFlatexImport(documents);
 const blocked=reason=>({kind:'flatex-native-trade-preview',eligible:false,ready:false,writeEnabled:false,reason,preview:null,prepared});
 if(prepared.issues.length||!prepared.parsed.rows.length)return blocked('Alle Quellen müssen geklärt sein; keine teilweise Übernahme von Cash-, Sonder- oder fehlerhaften Vorgängen.');
 const binding=reviewNativeFlatexBindings(model,prepared.identities,assignments,{stale:options.stale});
 if(binding.contexts.length!==1||binding.contexts[0].sourceType!=='depot'||!binding.contexts[0].confirmed||binding.rows.some(r=>!['source-only','existing-source'].includes(r.status)))return blocked('Eine aktuelle ausdrücklich bestätigte Depot-/Quellzuordnung ohne Manual- oder Quellenkonflikt ist erforderlich.');
 const accountId=binding.contexts[0].accountId;
 const reconciliation=reconcileFlatexPositions(prepared,model,accountId);
 if(reconciliation.results.some(r=>!r.positionId))return blocked('Jede ISIN muss genau einer bestehenden Anlage im gewählten Depot zugeordnet sein.');
 const positions=reconciliation.results.map(r=>model.positions.find(p=>p.id===r.positionId));
 if(positions.some(p=>p.currency!=='EUR'||p.wallet?.enabled||p.managementSource==='wallet'))return blocked('Nur bestehende EUR-Wertpapiere ohne automatische Walletverwaltung sind qualifiziert.');
 let preview;
 if(options.mode==='backfill'){
  const result=prepareFlatexBackfillPreview(model,prepared,accountId);
  if(!result.eligible)return blocked(result.reason);preview=result.preview;
 }else{
  preview=previewCSV(model,prepared.parsed,prepared.mapping,{allowedAccountId:accountId});
  if(preview.issues.length)return blocked('Gemeinsame Importprüfung meldet Quellen-, Kosten- oder Bestandskonflikte.');
  const touched=new Set(preview.rows.filter(r=>r.status==='ready').map(r=>r.row.positionId));
  for(const p of positions.filter(p=>touched.has(p.id))){
   if(units(p.quantityExact??p.quantity)!==0n||p.costBasisExact!=null||p.costBasisEUR!=null||p.realizedPnLExact!=null||p.realizedPnLEUR!=null||
    model.bookings.some(b=>[b.positionId,b.targetPositionId,b.cashPositionId].includes(p.id))||
    model.journalEntries.some(e=>e.postings?.some(x=>x.positionId===p.id))||
    (model.openingPositions||[]).some(o=>o.positionId===p.id&&(o.asOf||units(o.quantityExact)!==0n||o.costBasisExact!=null||o.realizedPnLExact!=null))||
    (model.snapshots||[]).some(s=>s.byPosition&&Object.hasOwn(s.byPosition,p.id)&&units(s.byPosition[p.id])!==0n))return blocked('Neue native Historie nur in eine leere ungeschützte Position; vorhandene Bestände über den geprüften Backfillpfad abgleichen.');
  }
 }
 if(preview.issues.length||preview.skipped||preview.ready+preview.duplicates!==prepared.parsed.rows.length||!ledgerQuantityAudit(preview.simulated).ok)return blocked('Kein vollständiger atomarer Simulationsnachweis.');
 return {kind:'flatex-native-trade-preview',eligible:true,ready:false,writeEnabled:false,reason:'',prepared,preview,
  note:'Gemeinsame Simulation ohne UI- oder Übernahmefreigabe. Nebenkosten und vollständige historische Abdeckung bleiben ungeprüft.'};
}

/**
 * Conservative historical trade replacement for manually observed positions.
 *
 * A complete nonnegative CSV trade sequence may replace a manual opening
 * quantity ONLY if its final balance agrees exactly with today's quantity,
 * there is no prior booking/journal for the position and no pre-existing
 * trusted cost basis or realised P&L to lose.
 *
 * All transformations happen on clones. The returned preview is compatible
 * with importCSV's original-model baseline check and atomic commit. Missing
 * broker charges remain unknown: reconstructed cost bases and realised P&L are
 * deliberately null even when gross execution prices are known.
 *
 * Passing this check does NOT prove the export covers earlier corporate
 * actions or excluded cash settlements. User acknowledgement is mandatory.
 */
export function prepareFlatexBackfillPreview(model,prepared,accountId,options={}){
 const blocked=reason=>({eligible:false,reason,preview:null,positions:[]});
 if(!accountId||!flatexCustodyAccounts(model).some(a=>a.id===accountId))
  return blocked('Ein vorhandenes Flatex-Wertpapierdepot auswählen.');
 if(!prepared?.parsed?.rows?.length)return blocked('Keine Wertpapierkäufe und -verkäufe in den Dateien.');
 if(prepared.depotIdentifiers?.length>1)return blocked('Mehrere Depotnummern: die Historien einzeln je Depot importieren.');
 if(prepared.issues?.length)return blocked('Unbekannte, fehlerhafte oder mehrdeutige Depot- und Kontovorgänge müssen zuerst geklärt werden.');
 if(options.skippedLines?.length)return blocked('Für die historische Rekonstruktion dürfen keine Buchungen übersprungen werden.');
 if(options.cashPositionId)return blocked('Historische Wertpapierkäufe zunächst ohne automatisches Verrechnungskonto rekonstruieren.');
 const check=reconcileFlatexPositions(prepared,model,accountId);
 if(check.results.some(x=>x.status!=='arithmetically-aligned'))
  return blocked('Die CSV-Käufe und -Verkäufe ergeben nicht für alle Anlagen genau den aktuellen Bestand ohne erforderlichen Anfangsbestand.');
 const ids=new Set(check.results.map(x=>x.positionId));
 if(!ids.size)return blocked('Keine eindeutig zugeordneten Wertpapiere gefunden.');
 const selected=(model.positions||[]).filter(p=>ids.has(p.id));
 if(selected.some(p=>p.wallet?.enabled||p.managementSource==='wallet'))
  return blocked('Automatisch verwaltete Wallet-Positionen können nicht rekonstruiert werden.');
 if(!selected.some(p=>units(p.quantityExact??p.quantity)>0n))
  return blocked('Es gibt keinen vorhandenen manuellen Anfangsbestand, der abgeglichen werden muss.');
 if(selected.some(p=>p.costBasisExact!=null||p.costBasisEUR!=null||
    p.realizedPnLExact!=null||p.realizedPnLEUR!=null))
  return blocked('Bereits erfasste Anschaffungskosten oder realisierte Ergebnisse dürfen nicht ersetzt werden.');
 if((model.bookings||[]).some(b=>ids.has(b.positionId)||ids.has(b.targetPositionId)||ids.has(b.cashPositionId)))
  return blocked('Zu den betroffenen Anlagen existieren bereits Buchungen. Historie nicht überschreiben.');
 if((model.journalEntries||[]).some(e=>e.postings?.some(p=>ids.has(p.positionId))))
  return blocked('Zu den betroffenen Anlagen existiert bereits ein Journal. Rückdatierung nicht erlaubt.');
 if(selected.some(p=>(model.openingPositions||[]).some(o=>o.positionId===p.id&&
    (o.asOf||o.costBasisExact!=null||o.realizedPnLExact!=null))))
  return blocked('Ein datierter Eröffnungsbestand oder bereits dokumentierte Anschaffungskosten dürfen nicht überschrieben werden.');
 const earliest=prepared.parsed.rows.map(r=>r.date).sort()[0];
 if((model.snapshots||[]).some(shot=>shot.date<earliest&&selected.some(p=>
    shot.byPosition&&Object.hasOwn(shot.byPosition,p.id)&&units(shot.byPosition[p.id])!==0n)))
  return blocked('Ein älterer Stichtag enthält bereits einen Wert für dieses Wertpapier. Die historische Rekonstruktion muss zuerst mit den Stichtagen abgeglichen werden.');
 if((prepared.parsed.rows||[]).some(x=>!['buy','sell'].includes(x.type)||!x.externalId))
  return blocked('Die Exportdaten enthalten Vorgänge ohne eindeutige Importidentität.');
 const original=JSON.stringify(model),draft=structuredClone(model);
 for(const p of draft.positions.filter(p=>ids.has(p.id))){
  p.quantityExact='0';p.quantity=0;
  p.costBasisExact=null;p.costBasisEUR=null;
  p.realizedPnLExact=null;p.realizedPnLEUR=null;
 }
 for(const opening of draft.openingPositions||[]){
  if(ids.has(opening.positionId)){
   opening.quantityExact='0';opening.costBasisExact=null;opening.realizedPnLExact=null;
  }
 }
 let result;
 try{result=previewCSV(draft,prepared.parsed,prepared.mapping,{
  ...options,allowedAccountId:accountId,skippedLines:[]
 });}catch(e){return blocked('Historische Vorschau fehlgeschlagen: '+e.message);}
 if(result.issues.length||result.ready!==prepared.parsed.rows.length||result.duplicates)
  return blocked('Mindestens eine historische Buchung konnte nicht chronologisch und eindeutig übernommen werden.');
 for(const p of result.simulated.positions.filter(p=>ids.has(p.id))){
  const old=model.positions.find(x=>x.id===p.id);
  if(units(p.quantityExact??p.quantity)!==units(old.quantityExact??old.quantity))
   return blocked('Rekonstruierte und beobachtete Stückzahl stimmen nicht überein.');
  // No actual fee, withholding tax or corporate-action completeness proof exists.
  p.costBasisExact=null;p.costBasisEUR=null;
  p.realizedPnLExact=null;p.realizedPnLEUR=null;
 }
 const audit=ledgerQuantityAudit(result.simulated);
 if(!audit.ok)return blocked('Die rekonstruierten Journalbestände stimmen nicht überein.');
 const preview={...result,baseline:original};
 if(JSON.stringify(model)!==original)throw Error('Historische Vorschau hat das Original unerwartet verändert.');
 return {
  eligible:true,reason:'',
  positions:selected.map(p=>({id:p.id,name:p.name,quantityExact:String(p.quantityExact??p.quantity)})),
  preview,
  note:'Der beobachtete Gesamtbestand bleibt gleich. Nur die belegten Käufe und Verkäufe ersetzen die bisher undatierte Anfangsmenge; Gebühren, Steuern und steuerliche Anschaffungskosten bleiben ausdrücklich unbekannt. Historische Vollständigkeit wird nicht behauptet.'
 };
}
