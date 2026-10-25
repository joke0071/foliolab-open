import {parseCSV} from './csv-import.js';
import {sourceDigest} from './import-identity.js';
import {units,exact} from './decimal.js';
import {safeImport} from './model.js';

/** Generic normalized documents only. Provider-specific documents must pass
 * their own format adapter first; identical headers are not provider evidence. */
export function prepareCSVBatch(files){
 if(!Array.isArray(files)||!files.length||files.length>20)throw Error('Bitte 1 bis 20 CSV-Dateien auswählen.');
 const rows=[],sourceRows=[],sourceIdentities={},reports=[];
 let headers;
 for(const [index,file] of files.entries()){
  if(typeof file?.text!=='string')throw Error('CSV-Dateiinhalt fehlt.');
  const name=String(file.name||'Datei '+(index+1));
  const parsed=parseCSV(file.text,{sourceName:name});
  if(!headers)headers=parsed.headers;
  if(parsed.headers.length!==headers.length||headers.some(h=>!parsed.headers.includes(h)))
   throw Error('Allgemeine CSV-Dateien benötigen dieselben Spalten. Unterschiedliche Formate bitte getrennt importieren.');
  if(rows.length+parsed.rows.length>5000)throw Error('Maximal 5.000 Datenzeilen pro Import.');
  // Exactly the identity used by the existing single-file importer. It must
  // survive adding/removing/reordering documents in subsequent batches.
  const digest=sourceDigest(JSON.stringify([parsed.sourceName,parsed.headers,parsed.rows]));
  for(const [i,row] of parsed.rows.entries()){
   const line=rows.length+2;
   sourceIdentities[line]={sourceId:'generic-csv',externalId:undefined,fileId:digest+':'+(i+2)};
   sourceRows.push({file:name,line:i+2});rows.push(row);
  }
  reports.push({name,rows:parsed.rows.length});
 }
 return {parsed:{headers,rows,sourceName:'',sourceIdentities},sourceRows,reports};
}

/** Evidence range is a range of input events, never continuous market or
 * ownership coverage. Impact is computed from the existing journal dry-run. */
export function csvPreviewSummary(model,preview){
 const ready=preview.rows.filter(r=>r.status==='ready'),dates=ready.map(r=>r.row.date).sort();
 const conflicts=preview.issues.filter(i=>i.code==='source-conflict').length;
 const impacts=preview.simulated.positions.flatMap(p=>{
  const old=model.positions.find(x=>x.id===p.id);
  if(!old)return [];
  const before=old.quantityExact??String(old.quantity),after=p.quantityExact??String(p.quantity);
  const delta=exact(units(after)-units(before));
  return delta==='0'?[]:[{positionId:p.id,accountId:p.accountId,name:p.name,currency:p.currency,kind:p.kind,beforeExact:before,afterExact:after,deltaExact:delta}];
 });
 return {newEvents:preview.ready,duplicates:preview.duplicates,conflicts,unresolved:preview.issues.length-conflicts,skipped:preview.skipped,
  coverage:{from:dates[0]??null,to:dates.at(-1)??null,complete:false},impacts,
  historyNote:'Ereignisdaten sind keine lückenlose Historie. Historische Marktwerte benötigen belegte Anfangsbestände, Tageskurse und gegebenenfalls Wechselkurse.'};
}

/** Session-local rollback receipt. Never persist another portfolio or secret
 * copy. All later changes invalidate it, including settings/quotes/snapshots. */
export function csvUndoReceipt(before,model){
 safeImport(JSON.parse(before));
 return {before,after:JSON.stringify(model)};
}
export function canUndoCSV(model,receipt){return Boolean(receipt&&receipt.after===JSON.stringify(model));}
export function undoCSV(model,receipt){
 if(!canUndoCSV(model,receipt))throw Error('Portfolio seit dem Import verändert. Rückgängig gesperrt; bitte Backup oder einzelne Belege prüfen.');
 safeImport(JSON.parse(receipt.before));
 Object.assign(model,JSON.parse(receipt.before));
}

