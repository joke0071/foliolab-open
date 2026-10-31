import {importSourceKey,bookingOwnership,sourceUnmodified,sourceDigest,validateNativeSourceEvidence,removedImportSources} from './import-identity.js';
import {units,exact} from './decimal.js';
import {executeTransaction,ledgerQuantityAudit} from './transactions.js';
import {safeImport,backup} from './model.js';
import {readCSVRecords} from './csv-records.js';
/** Client-only CSV parser; never uploads the original document to a remote service. */
export function parseCSV(input,{delimiter,sourceName=''}={}){
 const lexed=readCSVRecords(input,{delimiter}),sep=lexed.delimiter,rows=lexed.records.map(r=>r.cells);
 if(rows.length<2||rows.length>5001)throw Error('CSV benötigt Kopfzeile und maximal 5.000 Datenzeilen.');
 const headers=rows.shift().map(h=>h.trim().slice(0,120));
 if(headers.some(x=>!x)||new Set(headers.map(x=>x.toLowerCase())).size!==headers.length)throw Error('Leere oder doppelte CSV-Spalten.');
 if(rows.some(x=>x.length!==headers.length))throw Error('CSV enthält Zeilen mit abweichender Spaltenanzahl.');
 return {delimiter:sep,sourceName:String(sourceName),headers,rows:rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i].trim()])))};
}
export const CSV_FIELDS=['date','type','position','quantity','unitPrice','feeEUR','taxEUR','fxRate','cashPosition','notes','externalId'];
const auto={date:/^(datum|date|trade.?date|buchungsdatum)$/i,type:/^(typ|type|transaktion|vorgang)$/i,position:/^(isin|symbol|ticker|position|wertpapier|asset)$/i,quantity:/^(menge|quantity|stueck|stück|anzahl|shares)$/i,unitPrice:/^(kurs|price|unit.?price|preis)$/i,feeEUR:/^(gebuehr|gebühr|fee|fees)$/i,taxEUR:/^(tax|steuer|steuern)$/i,fxRate:/^(fx|wechselkurs|fxrate)$/i,cashPosition:/^(verrechnungskonto|cashposition|cash.?account)$/i,notes:/^(notiz|notes|comment|beschreibung)$/i,externalId:/^(id|trade.?id|referenz|external.?id)$/i};
export const inferMapping=headers=>Object.fromEntries(CSV_FIELDS.map(f=>[f,headers.find(h=>auto[f]?.test(h))||'']));
export function normalizeCSVNumber(input,{optional=false}={}){
 let s=String(input??'').trim().replace(/[\u00A0\u202F\s']/g,'');
 if(!s){if(optional)return '0';throw Error('Pflichtbetrag fehlt.');}
 if(!/^[+-]?[\d.,]+$/.test(s))throw Error('Ungültiger Zahlenwert.');
 if(s.includes(',')&&s.includes('.')){const decimal=s.lastIndexOf(',')>s.lastIndexOf('.')?',':'.';const group=decimal===','?'.':',';s=s.replaceAll(group,'').replace(decimal,'.');}
 else if(s.includes(','))s=s.replace(',','.');
 else if((s.match(/\./g)||[]).length>1)s=s.replaceAll('.','');
 return exact(units(s));
}
function typeOf(value){const t=String(value??'').toLowerCase().trim();return ({kauf:'buy',buy:'buy',verkauf:'sell',sell:'sell',einzahlung:'deposit',deposit:'deposit',auszahlung:'withdraw',withdraw:'withdraw',dividende:'dividend',dividend:'dividend',zinsen:'interest',interest:'interest',gebühr:'fee',gebuehr:'fee',fee:'fee',steuer:'tax',tax:'tax',reward:'reward',airdrop:'airdrop',transfer:'transfer'})[t]||null;}
const sourceConflict=message=>Object.assign(Error(message),{code:'source-conflict'});
const fingerprint=r=>JSON.stringify([r.date,r.type,r.positionId,r.quantity,r.unitPrice,r.feeEUR,r.taxEUR,r.fxRate,r.externalId||'']);
function resolvePosition(model,key,defaultId,allowedAccountId=''){
 const needle=String(key||'').trim().toLowerCase();
 if(!needle){const p=model.positions.find(p=>p.id===defaultId);if(!p)throw Error('Anlage fehlt – bitte diese Buchung ausdrücklich zuordnen.');return p;}
 const hits=model.positions.filter(p=>(!allowedAccountId||p.accountId===allowedAccountId)&&[p.id,p.name,p.isin,p.symbol].some(s=>s&&String(s).toLowerCase()===needle));
 if(hits.length!==1)throw Error('Anlage nicht eindeutig erkannt: '+needle.slice(0,42)+'. Bitte zuordnen.');
 return hits[0];
}
/** Preview never changes original portfolio; transaction engine validates clone only. */
export function previewCSV(model,parsed,mapping,{defaultPositionId='',cashPositionId='',positionOverrides={},skippedLines=[],allowedAccountId='',fxRateOverrides={},sourceId='generic-csv',sourceIdentities={}}={}){
 const baseline=JSON.stringify(model);
 const draft=structuredClone(model),claimedIds=new Set();
 let nativeSeen=model.bookings.some(b=>b.importSource?.sourceId?.startsWith('flatex-native-'));
 const fileDigest=sourceDigest(JSON.stringify([parsed.sourceName||'',parsed.headers,parsed.rows]));
 const removed=removedImportSources(model);
 const list=[],issues=[],occurrences=new Map(),ignored=new Set(skippedLines.map(Number));let duplicates=0;
 const mapped=parsed.rows.map((data,index)=>({data,index:index+2,date:String(data[mapping.date]||'').trim()})).sort((a,b)=>a.date.localeCompare(b.date)||a.index-b.index);
 for(const item of mapped){
  if(ignored.has(item.index)){list.push({line:item.index,status:'skipped'});continue;}
  try{
   const d=item.data,type=typeOf(d[mapping.type]);if(!type)throw Error('Buchungstyp unbekannt.');
   const pos=resolvePosition(draft,positionOverrides[item.index]||d[mapping.position],defaultPositionId,allowedAccountId);
   if(allowedAccountId&&pos.accountId!==allowedAccountId)throw Error('Anlage gehört nicht zum gewählten Depot. Bitte Flatex-Depot und ISIN prüfen.');
   const qty=normalizeCSVNumber(d[mapping.quantity]);
   if(['buy','sell'].includes(type)&&!String(d[mapping.unitPrice]??'').trim())throw Error('Historischer Ausführungskurs fehlt. Aktueller Kurs wird nicht eingesetzt.');
   const price=normalizeCSVNumber(d[mapping.unitPrice]||pos.price,{optional:true});
   const fee=normalizeCSVNumber(d[mapping.feeEUR],{optional:true});
   const tax=normalizeCSVNumber(d[mapping.taxEUR],{optional:true});
   const providedFx=Object.hasOwn(fxRateOverrides,item.index)?fxRateOverrides[item.index]:(d[mapping.fxRate]||(pos.currency==='EUR'?'1':''));
   if(pos.currency!=='EUR'&&!String(providedFx).trim())throw Error('Historischer Wechselkurs fehlt. Bitte den tatsächlichen Brokerkurs in EUR je Handelswährung eingeben.');
   const fx=normalizeCSVNumber(providedFx,{optional:pos.currency==='EUR'});
   const ref=String(d[mapping.externalId]||'').trim();
   if(ref.length>200)throw Error('Buchungs-ID ist zu lang.');
   const linked=String(d[mapping.cashPosition]||'').trim();
   const c=linked?resolvePosition(draft,linked,'').id:(['buy','sell'].includes(type)?cashPositionId||'':'');
   const row={type,date:item.date,positionId:pos.id,quantity:qty,unitPrice:price,feeEUR:fee,taxEUR:tax,fxRate:fx,cashPositionId:c,notes:String(d[mapping.notes]||'').slice(0,180),externalId:ref};
   const origin=sourceIdentities[item.index]||parsed.sourceIdentities?.[item.index];
   const trade=['buy','sell'].includes(type);
   const feeKnown=!!String(d[mapping.feeEUR]??'').trim()&&origin?.costsVerified!==false;
   const taxKnown=!!String(d[mapping.taxEUR]??'').trim()&&origin?.costsVerified!==false;
   const costsKnown=!trade||(feeKnown&&taxKnown);
   if(trade){if(!feeKnown)row.feeEUR=null;if(!taxKnown)row.taxEUR=null;}
   const identity={sourceId:origin?.sourceId||sourceId,externalId:origin?.externalId??ref,sourceEvidence:origin?.sourceEvidence};
   const evidence=validateNativeSourceEvidence(identity),sourceRow=evidence?{...row,sourceEvidence:evidence}:row;
   const source={version:1,sourceId:identity.sourceId,accountId:pos.accountId,
    externalId:identity.externalId,sourcePayload:JSON.stringify(sourceRow),fileId:origin?.fileId||fileDigest+':'+item.index,occurrence:1,ownership:'imported',ownedSnapshot:''};
   // An omitted settlement selection on repeat import cannot erase the
   // previously confirmed link; an explicitly changed selection conflicts.
   const samePayload=prior=>{
    const previous=JSON.parse(prior.sourcePayload),current={...sourceRow};
    if(!current.cashPositionId&&!linked&&!cashPositionId)current.cashPositionId=previous.cashPositionId;
    return JSON.stringify(previous)===JSON.stringify(current);
   };
   const key=importSourceKey(source);
   if(removed.some(prior=>(prior.accountId===source.accountId&&((source.externalId&&prior.externalId===source.externalId)||prior.fileId===source.fileId||(()=>{const old=JSON.parse(prior.sourcePayload);return old.positionId===row.positionId&&old.date===row.date&&old.type===row.type;})()))))
    throw sourceConflict('Diese Importbuchung wurde ausdrücklich gelöscht. Kein automatischer Wiederimport; Rücknahme oder geprüfte Sicherung verwenden.');
   const matches=key?draft.bookings.filter(b=>importSourceKey(b.importSource)===key):[];
   if(matches.length){
    if(matches.length!==1||!samePayload(matches[0].importSource))
     throw sourceConflict('Quellkonflikt: dieselbe Buchungs-ID enthält abweichende Angaben. Bitte prüfen.');
    if(!sourceUnmodified(draft,matches[0]))throw sourceConflict('Manuell geänderte Buchung bleibt geschützt. Bitte Importkonflikt prüfen.');
    duplicates++;list.push({line:item.index,status:'duplicate',row});continue;
   }
   if(evidence)nativeSeen=true;
   if(nativeSeen&&draft.bookings.some(b=>b.accountId===source.accountId&&Boolean(evidence)!==Boolean(b.importSource?.sourceId?.startsWith('flatex-native-'))&&
      (((b.importSource?.sourceId==='flatex-at'||source.sourceId==='flatex-at')&&b.importSource?.externalId===source.externalId)||(b.positionId===row.positionId&&b.date===row.date&&b.type===row.type))))
    throw sourceConflict('Native und andere Buchungsherkunft könnten dieselbe Quelle betreffen. Bitte Herkunft ausdrücklich prüfen.');
   const base=fingerprint(row);
   const count=ref?1:(occurrences.get(base)||0)+1;
   if(!ref)occurrences.set(base,count);
   // Identical rows in one file may be distinct transactions. Keep a stable
   // occurrence number, while explicit broker transaction IDs stay unique.
   const id=count===1?base:base+'#'+count;
   source.occurrence=count;
   const fileMatches=draft.bookings.filter(b=>b.importSource?.sourceId===source.sourceId&&
    b.importSource.accountId===source.accountId&&b.importSource.fileId===source.fileId);
   if(fileMatches.length){
    const prior=fileMatches[0];
    if(fileMatches.length!==1||(claimedIds.has(prior.id)&&!origin?.fileId)||!samePayload(prior.importSource)||!sourceUnmodified(draft,prior))
     throw sourceConflict('Dateikonflikt oder manuell geänderte Buchung. Bitte prüfen.');
    claimedIds.add(prior.id);duplicates++;list.push({line:item.index,status:'duplicate',row});continue;
   }
   // Legacy fingerprints do not prove a source/file identity. Matching values
   // in another document are only review candidates, never automatic skips.
   const legacy=model.bookings.some(b=>!b.importSource&&b.importFingerprint&&(b.importFingerprint===id||
    (b.positionId===row.positionId&&b.date===row.date&&b.type===row.type)));
   const economic=r=>JSON.stringify([r.date,r.type,r.positionId,r.quantity,r.unitPrice,r.feeEUR,r.taxEUR,r.fxRate,r.cashPositionId||'']);
   const candidate=!source.externalId&&draft.bookings.some(b=>{
    // Identical rows inside one original file may be independent fills.
    if(b.importSource?.fileId?.split(':')[0]===source.fileId.split(':')[0])return false;
    if(b.importSource?.accountId!==source.accountId)return false;
    try{return economic(JSON.parse(b.importSource.sourcePayload))===economic(row);}catch{return false;}
   });
   if(legacy||candidate)throw sourceConflict('Mögliche bereits vorhandene Buchung aus einer anderen oder älteren Datei. Bitte ausdrücklich prüfen; keine automatische Übernahme.');
   if(!costsKnown){
    if(c)throw Error('Gebühren oder Steuern fehlen. Für eine Geldbuchung bitte belegte Werte (auch 0) in der CSV angeben; sonst ohne Verrechnungskonto nur Stückzahlen übernehmen.');
    if(pos.costBasisExact!=null||pos.costBasisEUR!=null||pos.realizedPnLExact!=null||pos.realizedPnLEUR!=null)
     throw Error('Unbekannte Nebenkosten: vorhandene bestätigte Anschaffungskosten bleiben geschützt. Bitte Abrechnung ergänzen.');
   }
   const event=executeTransaction(draft,row);const booking=draft.bookings.find(b=>b.id===event.id);
   if(!costsKnown){
    const changed=draft.positions.find(p=>p.id===pos.id);
    changed.costBasisExact=null;changed.costBasisEUR=null;changed.realizedPnLExact=null;changed.realizedPnLEUR=null;
    if(!feeKnown)booking.feeEUR=null;if(!taxKnown)booking.taxEUR=null;
    booking.costsVerified=false;
   }
   booking.importFingerprint=id;draft.journalEntries.find(j=>j.id===booking.journalEntryId).source='csv';
   source.occurrence=count;source.ownedSnapshot=bookingOwnership(draft,booking);booking.importSource=source;
   list.push({line:item.index,status:'ready',row});
  }catch(e){issues.push({line:item.index,code:e.code||'invalid-row',message:String(e.message).slice(0,200)});list.push({line:item.index,status:'error',message:String(e.message).slice(0,200)});}
 }
 return {rows:list,issues,duplicates,skipped:list.filter(r=>r.status==='skipped').length,ready:list.filter(r=>r.status==='ready').length,simulated:draft,baseline};
}
/** All-or-nothing commit. An invalid row never leaves partial imported positions. */
export function importCSV(model,preview){
 if(typeof preview.baseline!=='string'||preview.baseline!==JSON.stringify(model))throw Error('Das Portfolio wurde seit der CSV-Vorschau verändert. Bitte Vorschau erneut erstellen.');
 if(preview.issues.length)throw Error('CSV enthält fehlerhafte Zeilen – vor Import korrigieren.');
 if(!preview.ready)return {imported:0,duplicates:preview.duplicates};
 const next=structuredClone(preview.simulated);
 if(next.bookings.length!==(model.bookings||[]).length+preview.ready||next.version!==model.version||
    model.bookings.some(b=>!next.bookings.some(n=>n.id===b.id&&JSON.stringify(n)===JSON.stringify(b)))||
    model.journalEntries.some(e=>!next.journalEntries.some(n=>n.id===e.id&&JSON.stringify(n)===JSON.stringify(e))))throw Error('CSV-Vorschau stimmt nicht zum Datenmodell.');
 safeImport(JSON.parse(backup(next)));
 if(!ledgerQuantityAudit(next).ok)throw Error('CSV-Journal und Bestände widersprechen sich. Nichts übernommen.');
 Object.assign(model,next);return {imported:preview.ready,duplicates:preview.duplicates};
}
