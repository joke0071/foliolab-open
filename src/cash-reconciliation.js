import {units,exact} from './decimal.js';
import {ledgerQuantityAudit} from './transactions.js';

/** Current, read-only comparison in the selected position's own currency.
 * An undated opening plus journal is an arithmetic check, never bank evidence.
 * Deliberately has no write, correction, cashflow or historical-date API.
 */
export function compareCurrentCashBalance(model,{positionId,referenceAmount,currency}={}){
 const position=model.positions.find(p=>p.id===positionId);
 if(!position||position.kind!=='cash')throw Error('Bitte eine vorhandene Guthabenposition auswählen.');
 const account=model.accounts.find(a=>a.id===position.accountId);
 if(!account||account.providerId!==position.providerId)throw Error('Die Kontozuordnung ist nicht eindeutig.');
 if(currency!==position.currency||account.currency!==position.currency)
  throw Error('Kontowährung und Referenzwährung müssen zur Guthabenposition passen.');
 if(!['string','number'].includes(typeof referenceAmount)||String(referenceAmount).trim()==='')
  throw Error('Bitte den aktuellen Kontostand eingeben; auch 0 ist möglich.');
 const recordedRaw=position.quantityExact??position.quantity;
 if(recordedRaw==null||String(recordedRaw).trim()==='')throw Error('Der erfasste Bestand ist unbekannt.');
 const recorded=units(recordedRaw),reference=units(referenceAmount);
 const hasJournal=(model.journalEntries||[]).some(e=>e.postings.some(p=>p.positionId===positionId&&p.quantityDeltaExact!=null));
 // Reuse the canonical validator instead of maintaining a second ledger.
 const audit=ledgerQuantityAudit(model);
 if(audit.mismatches.some(x=>x.positionId===positionId))
  throw Error('Erfasster Bestand und Finanzjournal widersprechen sich. Bitte die Buchungen prüfen.');
 const difference=reference-recorded;
 return {positionId,accountId:account.id,currency,recordedExact:exact(recorded),referenceExact:exact(reference),
  differenceExact:exact(difference),status:difference===0n?'matched':'difference',
  basis:hasJournal?'opening-and-journal':'recorded-only'};
}
