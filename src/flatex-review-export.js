/**
 * Export a LOCAL audit copy of the Flatex import preview.
 * Contains original file/line context, not a computed tax return.
 * All external text fields are escaped for CSV and spreadsheet formula safety.
 */
const cell=value=>{
 const normalized=String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,500);
 const guarded=/^[\s]*[=+@-]/.test(normalized)&&! /^-\d+(?:\.\d+)?$/.test(normalized)?
  "'"+normalized:normalized;
 return '"'+guarded.replaceAll('"','""')+'"';
};
const line=(...parts)=>parts.map(cell).join(';');

export function exportFlatexAuditCSV(prepared){
 if(!prepared||!Array.isArray(prepared.parsed?.rows)||!Array.isArray(prepared.cashItems)||!Array.isArray(prepared.issues))
  throw Error('Keine geprüfte Flatex-Vorschau vorhanden.');
 const out=[
  line('Datei','Zeile','Bereich','Datum','Status','Referenz','Konto/Depot','ISIN','Typ','Menge','Kurs','Betrag laut Export','Hinweis')
 ];
 for(const [idx,row] of prepared.parsed.rows.entries()){
  const origin=prepared.sourceRows?.[idx]||{};
  const source=prepared.sourceTrades?.find(t=>t.externalId===row.externalId);
  out.push(line(origin.file||source?.file,origin.line??source?.line,'Depotumsatz',row.date,
   'Kauf/Verkauf – Journal-Kandidat',source?.reference,source?.depot,row.position,row.type,
   row.quantity,row.unitPrice,'','Gebühren, Steuern und Einstandswert nicht bestätigt'));
 }
 for(const item of prepared.cashItems){
  out.push(line(item.file,item.line,'Kontoumsatz',item.date,'Nur prüfen – keine Geldbuchung',
   item.reference,item.account,'',item.kind,'','',item.amount,item.details));
 }
 for(const issue of prepared.issues){
  out.push(line(issue.file,issue.line,'Prüfhinweis','','Nicht automatisch übernehmen',
   '','','',issue.code,'','','',issue.message));
 }
 out.push(line('HINWEIS','','','',
  'Keine Steuererklärung. Kontoreferenzen können Zahlungspartner bezeichnen. Kein Cashflow oder geprüfter Saldo.'));
 return '\uFEFF'+out.join('\r\n')+'\r\n';
}
