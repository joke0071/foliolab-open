import {units,exact} from './decimal.js';
import {previewCSV} from './csv-import.js';
import {ledgerQuantityAudit} from './transactions.js';
import {reconcileFlatexPositions,flatexCustodyAccounts} from './flatex-reconciliation.js';

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
 if(selected.some(p=>(model.openingPositions||[]).some(o=>o.positionId===p.id&&o.asOf)))
  return blocked('Ein datierter Eröffnungsbestand darf nicht durch eine neue Schätzung ersetzt werden.');
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
