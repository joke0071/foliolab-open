import {units,exact} from './decimal.js';
import {executeTransaction} from './transactions.js';
/** Client-only CSV parser; never uploads the original document to a remote service. */
export function parseCSV(input,{delimiter}={}){
 const raw=String(input||'').replace(/^\uFEFF/,'');
 if(!raw.trim()||raw.length>2_000_000)throw Error('CSV leer oder größer als 2 MB.');
 const head=raw.slice(0,1200),separators=delimiter?[delimiter]:[';',',','\t'];
 const sep=delimiter||separators.map(c=>({c,n:head.split('\n')[0].split(c).length})).sort((a,b)=>b.n-a.n)[0].c;
 if(![';',',','\t'].includes(sep))throw Error('CSV-Trennzeichen ungültig.');
 const rows=[];let row=[],cell='',quoted=false,closedQuote=false,started=false;
 for(let i=0;i<raw.length;i++){
  const c=raw[i];
  if(c==='"'){
   if(quoted&&raw[i+1]==='"'){cell+='"';i++;}
   else if(quoted){quoted=false;closedQuote=true;}
   else if(!started){quoted=true;started=true;}
   else throw Error('CSV enthält ein ungültiges Anführungszeichen.');
  }else if(!quoted&&(c===sep||c==='\n'||c==='\r')){
   row.push(cell);cell='';started=false;closedQuote=false;
   if(c!==sep){
    if(c==='\r'&&raw[i+1]==='\n')i++;
    if(row.some(x=>x.trim()))rows.push(row);
    row=[];
   }
  }else{
   if(closedQuote)throw Error('CSV enthält Zeichen nach einem schließenden Anführungszeichen.');
   cell+=c;started=true;
  }
 }
 if(quoted)throw Error('CSV enthält ein nicht geschlossenes Anführungszeichen.');
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2||rows.length>5001)throw Error('CSV benötigt Kopfzeile und maximal 5.000 Datenzeilen.');
 const headers=rows.shift().map(h=>h.trim().slice(0,120));
 if(headers.some(x=>!x)||new Set(headers.map(x=>x.toLowerCase())).size!==headers.length)throw Error('Leere oder doppelte CSV-Spalten.');
 if(rows.some(x=>x.length!==headers.length))throw Error('CSV enthält Zeilen mit abweichender Spaltenanzahl.');
 return {delimiter:sep,headers,rows:rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i].trim()])))};
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
function typeOf(value){const t=String(value||'buy').toLowerCase().trim();return ({kauf:'buy',buy:'buy',verkauf:'sell',sell:'sell',einzahlung:'deposit',deposit:'deposit',auszahlung:'withdraw',withdraw:'withdraw',dividende:'dividend',dividend:'dividend',zinsen:'interest',interest:'interest',gebühr:'fee',gebuehr:'fee',fee:'fee',steuer:'tax',tax:'tax',reward:'reward',airdrop:'airdrop',transfer:'transfer'})[t]||null;}
const fingerprint=r=>JSON.stringify([r.date,r.type,r.positionId,r.quantity,r.unitPrice,r.feeEUR,r.taxEUR,r.fxRate,r.externalId||'']);
function resolvePosition(model,key,defaultId){
 const needle=String(key||'').trim().toLowerCase();
 if(!needle){const p=model.positions.find(p=>p.id===defaultId);if(!p)throw Error('Standardposition fehlt.');return p;}
 const hits=model.positions.filter(p=>[p.id,p.name,p.isin,p.symbol].some(s=>s&&String(s).toLowerCase()===needle));
 if(hits.length!==1)throw Error('Asset-Zuordnung fehlt oder ist mehrdeutig: '+needle.slice(0,42));
 return hits[0];
}
/** Preview never changes original portfolio; transaction engine validates clone only. */
export function previewCSV(model,parsed,mapping,{defaultPositionId='',cashPositionId=''}={}){
 const baseline=JSON.stringify(model);
 const draft=structuredClone(model),seen=new Set((model.bookings||[]).map(x=>x.importFingerprint).filter(Boolean));
 const list=[],issues=[],occurrences=new Map();let duplicates=0;
 const mapped=parsed.rows.map((data,index)=>({data,index:index+2,date:String(data[mapping.date]||'').trim()})).sort((a,b)=>a.date.localeCompare(b.date)||a.index-b.index);
 for(const item of mapped){
  try{
   const d=item.data,type=typeOf(d[mapping.type]);if(!type)throw Error('Buchungstyp unbekannt.');
   const pos=resolvePosition(draft,d[mapping.position],defaultPositionId);
   const qty=normalizeCSVNumber(d[mapping.quantity]);
   const price=normalizeCSVNumber(d[mapping.unitPrice]||pos.price,{optional:true});
   const fee=normalizeCSVNumber(d[mapping.feeEUR],{optional:true});
   const tax=normalizeCSVNumber(d[mapping.taxEUR],{optional:true});
   const fx=normalizeCSVNumber(d[mapping.fxRate]|| (pos.currency==='EUR'?'1':''),{optional:pos.currency==='EUR'});
   const ref=String(d[mapping.externalId]||'').trim().slice(0,100);
   const linked=String(d[mapping.cashPosition]||'').trim();
   const c=linked?resolvePosition(draft,linked,'').id:cashPositionId||'';
   const row={type,date:item.date,positionId:pos.id,quantity:qty,unitPrice:price,feeEUR:fee,taxEUR:tax,fxRate:fx,cashPositionId:c,notes:String(d[mapping.notes]||'').slice(0,180),externalId:ref};
   const base=fingerprint(row);
   const count=ref?1:(occurrences.get(base)||0)+1;
   if(!ref)occurrences.set(base,count);
   // Identical rows in one file may be distinct transactions. Keep a stable
   // occurrence number, while explicit broker transaction IDs stay unique.
   const id=count===1?base:base+'#'+count;
   if(seen.has(id)){duplicates++;list.push({line:item.index,status:'duplicate',row});continue;}
   const event=executeTransaction(draft,row);const booking=draft.bookings.find(b=>b.id===event.id);
   booking.importFingerprint=id;draft.journalEntries.find(j=>j.id===booking.journalEntryId).source='csv';
   seen.add(id);list.push({line:item.index,status:'ready',row});
  }catch(e){issues.push({line:item.index,message:String(e.message).slice(0,200)});list.push({line:item.index,status:'error',message:String(e.message).slice(0,200)});}
 }
 return {rows:list,issues,duplicates,ready:list.filter(r=>r.status==='ready').length,simulated:draft,baseline};
}
/** All-or-nothing commit. An invalid row never leaves partial imported positions. */
export function importCSV(model,preview){
 if(typeof preview.baseline!=='string'||preview.baseline!==JSON.stringify(model))throw Error('Das Portfolio wurde seit der CSV-Vorschau verändert. Bitte Vorschau erneut erstellen.');
 if(preview.issues.length)throw Error('CSV enthält fehlerhafte Zeilen – vor Import korrigieren.');
 if(!preview.ready)return {imported:0,duplicates:preview.duplicates};
 const next=structuredClone(preview.simulated);
 if(next.bookings.length>(model.bookings||[]).length+preview.ready||next.version!==model.version)throw Error('CSV-Vorschau stimmt nicht zum Datenmodell.');
 Object.assign(model,next);return {imported:preview.ready,duplicates:preview.duplicates};
}
