/** One ephemeral composition of existing provider planners. No storage or network. */
import {parseCSV,importCSV} from './csv-import.js';
import {readCSVRecords} from './csv-records.js';
import {looksLikeBitpandaCSV,parseBitpandaCSV} from './bitpanda-preview.js';
import {looksLikeKrakenLedgerCSV,parseKrakenLedgerCSV} from './kraken-ledger.js';
import {looksLikeLedgerLiveCSV,parseLedgerLiveCSV} from './ledger-live.js';
import {readFlatexNativeBytes} from './flatex-native.js';
import {readUnifiedBitcoinFiles,previewUnifiedBitcoin,confirmUnifiedBitcoin} from './unified-bitcoin.js';
import {previewKrakenImport,confirmKrakenImport} from './kraken-import.js';
import {previewBitpandaImport,confirmBitpandaImport} from './bitpanda-import.js';
import {inspectFlatexNetPairs} from './flatex-net-settlement.js';
import {prepareNativeFlatexPreview} from './flatex-backfill.js';
import {sourceDigest} from './import-identity.js';
import {backup,safeImport} from './model.js';
import {ledgerQuantityAudit} from './transactions.js';
import {units,exact} from './decimal.js';
const digest=v=>sourceDigest(JSON.stringify(v));
export function readSharedImportFiles(files){
 if(!Array.isArray(files)||!files.length||files.length>20)throw Error('Bitte 1 bis 20 Originaldateien auswählen.');
 const result={bitcoin:{receipts:[],operations:[]},kraken:[],bitpanda:[],flatex:[],files:[]},bitcoin=[];let total=0;
 for(const file of files){
  const bytes=file.bytes??new TextEncoder().encode(file.text);
  if(bytes.length>2_000_000)throw Error('Je Datei sind höchstens 2 MB erlaubt.');
  const text=new TextDecoder().decode(bytes);let kind,rows,document;
  try{document=readFlatexNativeBytes(bytes);}catch{}
  if(document){kind='flatex';rows=document.rows.length;result.flatex.push({name:file.name,document});}
  else if(looksLikeBitpandaCSV(readCSVRecords(text,{delimiter:',',maxRecords:5021}))){kind='bitpanda';rows=parseBitpandaCSV(text).rows.length;result.bitpanda.push(text);}
  else{
   const parsed=parseCSV(text);rows=parsed.rows.length;
   if(looksLikeKrakenLedgerCSV(parsed)){kind='kraken';parseKrakenLedgerCSV(text);result.kraken.push(text);}
   else if(looksLikeLedgerLiveCSV(parsed)){kind='ledger';parseLedgerLiveCSV(text);bitcoin.push(text);}
   else if(parsed.headers.includes('Bitcoin Transaction ID')){kind='bittr';bitcoin.push(text);}
   else throw Error('Nicht unterstützte Originaldatei: '+String(file.name||'CSV')+'. Keine Datei wurde übernommen.');
  }
  total+=rows;if(total>5000)throw Error('Maximal 5.000 Quellzeilen im gemeinsamen Import.');
  result.files.push({name:String(file.name||'CSV'),kind,rows});
 }
 if(bitcoin.length)result.bitcoin=readUnifiedBitcoinFiles(bitcoin);
 return result;
}
export function sharedSourceKey(sources){return digest(sources);}
/** Re-run every provider against the preceding draft. Individual reviews never save. */
export function previewSharedImport(model,sources,choices,{at=new Date().toISOString()}={}){
 const baseline=JSON.stringify(model),sourceKey=sharedSourceKey(sources),choiceKey=digest(choices),reports=[];
 let draft=structuredClone(model);
 const bitcoin=sources.files.some(f=>['bittr','ledger'].includes(f.kind));
 if(bitcoin){
  const c=choices.bitcoin;if(!c?.confirmed)throw Error('Bittr / Ledger: Wallet, Finanzierung und offene Bereiche prüfen.');
  const p=previewUnifiedBitcoin(draft,sources.bitcoin,c.positionId);
  draft=confirmUnifiedBitcoin(draft,sources.bitcoin,c.positionId,{...c,baseline:p.baseline,at});
  reports.push({provider:'Bittr / Ledger Live',ready:p.newCount,duplicates:p.groups.filter(g=>g.status==='existing').length,excluded:p.excluded,details:p.groups.map(g=>({id:g.id,status:g.status,text:g.netBTC+' BTC · '+g.fiatEUR+' EUR · Netzwerkabzug '+g.receipts.map(r=>r.miningFeeBTC).join(' + ')+' BTC bereits enthalten'})),note:p.unknownIncoming+' weitere Eingänge mit unbekannten Kosten. BTC-Bestand unverändert. Fehlende Wallets und Staking bleiben unbekannt.'});
 }
 if(sources.kraken.length){
  const c=choices.kraken;if(!c?.confirmed||c.operation==='withdraw')throw Error('Kraken: Importauswahl ausdrücklich prüfen.');
  const p=previewKrakenImport(draft,sources.kraken,c.assignments,c);
  if(p.issues.length)throw Error('Kraken: '+p.issues.map(i=>i.message).join(' '));
  draft=confirmKrakenImport(draft,sources.kraken,c.assignments,{...c,baseline:p.baseline});
  reports.push({provider:'Kraken',ready:p.ready,duplicates:p.duplicates,excluded:p.excluded,details:p.groups.map(g=>({id:g.id,status:g.status,text:g.message||g.actions?.map(a=>a.type+' · '+(a.quantityExact??a.quantity??'')+' · '+(a.notes||'')).join('; ')||'Bereits vorhanden'})),note:'Interne Transfers brauchen passende Gegenbelege. Gebühren und Hauptbetrag bleiben getrennt; keine automatische externe Finanzierung.'});
 }
 if(sources.bitpanda.length){
  const c=choices.bitpanda;if(!c?.confirmed||c.operation==='withdraw')throw Error('Bitpanda: Importauswahl ausdrücklich prüfen.');
  const p=previewBitpandaImport(draft,sources.bitpanda,c.assignments,c);
  if(p.issues.length)throw Error('Bitpanda: '+p.issues.map(i=>i.message).join(' '));
  draft=confirmBitpandaImport(draft,sources.bitpanda,c.assignments,{...c,baseline:p.baseline});
  reports.push({provider:'Bitpanda',ready:p.ready,duplicates:p.duplicates,excluded:p.excluded,details:p.groups.map(g=>({id:g.id,status:g.status,text:g.message||g.actions?.map(a=>a.type+' · '+(a.quantityExact??a.quantity??'')+' · '+(a.notes||'')).join('; ')||'Bereits vorhanden'})),note:'Endbestände und Gebührenmodus geprüft. Ungeklärte Transfers und Staking bleiben offen.'});
 }
 if(sources.flatex.length){
  const c=choices.flatex;if(!c?.confirmed||!['append','backfill','net','net-backfill','net-augment'].includes(c.options?.mode))throw Error('Flatex: Zuordnung und Importmodus prüfen.');
  const inspection=inspectFlatexNetPairs(sources.flatex.map(f=>f.document)),excluded=c.options.mode.startsWith('net')?inspection.reviewCount+inspection.pairs.filter(p=>!c.options.selectedIds?.includes(p.id)).length:0;
  if(excluded&&!c.partialConfirmed)throw Error('Flatex: ungeklärte und nicht ausgewählte Restgruppen ausdrücklich offen lassen.');
  const p=prepareNativeFlatexPreview(draft,sources.flatex.map(f=>f.document),c.assignments,c.options);
  if(!p.eligible)throw Error('Flatex: '+p.reason);
  if(p.preview.ready||p.preview.evidenceUpdates)importCSV(draft,p.preview);
  reports.push({provider:'Flatex AT',ready:p.preview.ready,duplicates:p.preview.duplicates,excluded,details:p.preview.rows.map(r=>({id:String(r.line),status:r.status,text:r.row?.netSettlement?['Order '+r.row.netSettlement.orderReference,'Brutto '+r.row.netSettlement.grossExact+' EUR','Nettocash '+r.row.netSettlement.cashExact+' EUR','ungeklärte Differenz '+r.row.netSettlement.differenceExact+' EUR'].join(' · '):r.row?.notes||r.message||'Geprüfte Quellzeile'})),note:'Nettocash, Brutto und ungeklärte Differenz getrennt. Gebühren, Steuern und Kosten bleiben unbekannt.'});
 }
 if(!reports.length)throw Error('Keine unterstützte Quelle ausgewählt.');
 if(!ledgerQuantityAudit(draft).ok)throw Error('Gemeinsamer Journalabgleich fehlgeschlagen.');
 safeImport(JSON.parse(backup(draft,{includeHistory:true})));
 if(JSON.stringify(model)!==baseline)throw Error('Vorschau hat den Ausgangsstand verändert.');
 const impacts=draft.positions.flatMap(p=>{const old=model.positions.find(o=>o.id===p.id);if(!old)return [];const before=String(old.quantityExact??old.quantity),after=String(p.quantityExact??p.quantity);return before===after?[]:[{id:p.id,name:p.name,symbol:p.symbol||p.currency,before,after,delta:exact(units(after)-units(before))}];});
 return {baseline,sourceKey,choiceKey,at,reports,impacts,simulated:draft,draftKey:digest(draft),changed:JSON.stringify(draft)!==baseline};
}
export function confirmSharedImport(model,sources,choices,plan,{confirmed=false,backupConfirmed=false}={}){
 if(!confirmed||!backupConfirmed||!plan||plan.baseline!==JSON.stringify(model)||plan.sourceKey!==sharedSourceKey(sources)||plan.choiceKey!==digest(choices))throw Error('Gemeinsame Vorschau, Backup und Zustimmung erneut bestätigen.');
 if(digest(plan.simulated)!==plan.draftKey||!plan.changed)throw Error('Gemeinsamer Entwurf geändert oder keine neuen Wirkungen. Erneut prüfen.');
 const draft=structuredClone(plan.simulated);
 safeImport(JSON.parse(backup(draft,{includeHistory:true})));
 if(!ledgerQuantityAudit(draft).ok)throw Error('Gemeinsamer Journalabgleich fehlgeschlagen.');
 return draft;
}
