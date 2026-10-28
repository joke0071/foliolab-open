/** Native source evidence only. No portfolio, persistence, network or booking API. */
import {readCSVRecords} from './csv-records.js';
import {units,exact} from './decimal.js';

const schema=(headers,keys)=>Object.freeze(headers.map((header,index)=>Object.freeze({header,key:keys[index],index})));
export const FLATEX_NATIVE_COLUMNS=Object.freeze({
 depot:schema(['Nummer','Buchtag','Valuta','ISIN','Bezeichnung','Nominal','','Buchungsinformationen','TA-Nr.','Kurs','','Depot'],
  ['number','bookingDate','valueDate','isin','description','nominal','unit','details','transactionReference','rate','priceCurrency','depot']),
 account:schema(['Buchtag','Valuta','BIC / BLZ','IBAN / Kontonummer','Buchungsinformationen','TA-Nr.','Betrag','','Auftraggeberkonto','Konto'],
  ['bookingDate','valueDate','counterpartyBIC','counterpartyAccount','details','transactionReference','amount','amountCurrency','originatorAccount','account'])
});
const unknown=v=>v==null||v===''||v==='-';
// https://encoding.spec.whatwg.org/index-windows-1252.txt
// Explicit C1 mapping avoids observed runtime variation (0x80 -> U+0080).
const cp1252C1=[0x20ac,0x81,0x201a,0x192,0x201e,0x2026,0x2020,0x2021,0x2c6,0x2030,0x160,0x2039,0x152,0x8d,0x17d,0x8f,0x90,0x2018,0x2019,0x201c,0x201d,0x2022,0x2013,0x2014,0x2dc,0x2122,0x161,0x203a,0x153,0x9d,0x17e,0x178];
function decodeCP1252(bytes){
 let result='';
 for(let i=0;i<bytes.length;i+=8192)result+=String.fromCharCode(...Array.from(bytes.subarray(i,i+8192),b=>b>=128&&b<=159?cp1252C1[b-128]:b));
 return result;
}
export const looksLikeFlatexNativeCSV=lexed=>{
 const h=lexed?.records?.[0]?.cells?.map(v=>v.trim());
 return Boolean(h&&h.includes('')&&['Buchtag','Valuta','Buchungsinformationen','TA-Nr.'].filter(k=>h.includes(k)).length>=3);
};
function sourceDate(s){
 const m=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(s);
 if(!m)throw Error();
 const iso=m[3]+'-'+m[2]+'-'+m[1],n=Date.parse(iso+'T12:00:00Z');
 if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==iso)throw Error();
 return iso;
}
function sourceNumber(s){
 if(s.length>100||!/^[-+]?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(s))throw Error();
 return exact(units(s.replaceAll('.','').replace(',','.')));
}
function sourceKind(details){
 if(/storno/i.test(details))return /fusion/i.test(details)?'fusion-cancellation':'cancellation';
 if(/thesaurier/i.test(details))return 'accumulation';
 if(/lagerstellenwechsel/i.test(details))return 'custody-change';
 if(/split/i.test(details))return 'split';
 if(/fusion/i.test(details))return 'merger';
 if(/(?:^|\W)ORDER\s+Kauf(?:\W|$)/i.test(details))return 'order-buy';
 if(/(?:^|\W)ORDER\s+Verkauf(?:\W|$)/i.test(details))return 'order-sell';
 return 'unclassified';
}
function project(input,encoding){
 if(typeof input!=='string'||input.includes('\u0000')||input.includes('\ufffd'))throw Error('Flatex: verlustfrei decodierten CSV-Text ohne NUL oder Ersatzzeichen verwenden.');
 const {records}=readCSVRecords(input,{delimiter:';'}),headers=records[0].cells.map(v=>v.trim());
 const type=Object.keys(FLATEX_NATIVE_COLUMNS).find(k=>{
  const columns=FLATEX_NATIVE_COLUMNS[k];return columns.length===headers.length&&columns.every((c,i)=>c.header===headers[i]);
 });
 if(!type)throw Error('Flatex: bestätigtes 12-Spalten-Depot- oder 10-Spalten-Kontoschema einschließlich Leerüberschriften erforderlich.');
 if(records.length<2)throw Error('Flatex: mindestens eine Datenzeile erforderlich.');
 const columns=FLATEX_NATIVE_COLUMNS[type];
 const rows=records.slice(1).map(record=>{
  const fields=record.cells.map(v=>v.trim());
  if(fields.length!==columns.length)throw Error('Flatex: abweichende Spaltenanzahl im Originalformat.');
  if(columns.every((c,i)=>c.header===fields[i]))throw Error('Flatex: wiederholter Header im Originalformat.');
  const values=Object.fromEntries(columns.map((c,i)=>[c.key,fields[i]])),numbers={},dates={},issues=[];
  for(const [key,v]of Object.entries(values))if(v.length>300||/[\u0000-\u001f\u007f-\u009f]/.test(v))issues.push(key+': ungewöhnliches oder langes Quellfeld.');
  for(const key of ['bookingDate','valueDate']){
   dates[key]=null;try{dates[key]=sourceDate(values[key]);}catch{issues.push(key+': Quelltag ungültig oder unbekannt.');}
  }
  for(const key of type==='depot'?['nominal','rate']:['amount']){
   numbers[key]=null;
   if(unknown(values[key]))issues.push(key+': Quellzahl unbekannt, nicht als 0 ergänzt.');
   else try{numbers[key]=sourceNumber(values[key]);}catch{issues.push(key+': deutsche Quellzahl nicht exakt lesbar.');}
  }
  for(const key of type==='depot'?['unit','priceCurrency']:['amountCurrency'])if(unknown(values[key]))issues.push(key+': Einheit/Währung unbekannt; keine Annahme.');
  const kind=sourceKind(values.details);
  if(kind==='unclassified')issues.push('Quellereignis ungeklärt; keine Buchungsannahme.');
  const m=/(?:^|\s)ORDER\s+(Kauf|Verkauf)\s+([A-Z]{2}[A-Z0-9]{10})\s+(\d+)\s*$/i.exec(values.details);
  const order=m?Object.freeze({type:m[1].toLowerCase()==='kauf'?'buy':'sell',isin:m[2].toUpperCase(),reference:m[3]}):null;
  if(order&&type==='depot'&&order.isin!==values.isin.toUpperCase())issues.push('Ordertext-ISIN widerspricht Depot-ISIN; keine Zuordnung.');
  if(unknown(values.transactionReference))issues.push('Bank-Transaktionsreferenz fehlt; keine globale Identität belegt.');
  return {line:record.line,fields:Object.freeze(fields),values:Object.freeze(values),numbers:Object.freeze(numbers),dates:Object.freeze(dates),kind,order,issues};
 });
 const refs=new Map();
 for(const r of rows)if(!unknown(r.values.transactionReference)){const ref=r.values.transactionReference,list=refs.get(ref)||[];list.push(r);refs.set(ref,list);}
 for(const list of refs.values())if(list.length>1){const same=new Set(list.map(r=>JSON.stringify(r.fields))).size===1;for(const r of list)r.issues.push(same?'Identische Bankreferenz-Zeilen; alle Zeilen bleiben erhalten.':'Widersprüchliche Bankreferenz-Zeilen; keine automatische Auflösung.');}
 return Object.freeze({kind:'flatex-native-document-preview',version:1,type,encoding,columns,rows:Object.freeze(rows.map(r=>Object.freeze({...r,issues:Object.freeze(r.issues)}))),ready:false,writeEnabled:false,
  reason:'Nur lokale Originalformatprüfung. Keine Buchungen, Gegenbeine, Gebühren, Steuern, Bestände oder externen Kapitalflüsse werden daraus erzeugt.'});
}
export function parseFlatexNativeCSV(input){
 if(typeof input!=='string'||new TextEncoder().encode(input).length>2_000_000)throw Error('Flatex: maximal 2 MB CSV-Text erlaubt.');
 return project(input,'text');
}
export function readFlatexNativeBytes(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length>2_000_000)throw Error('Flatex: maximal 2 MB Originalbytes als Uint8Array erlaubt.');
 if((bytes[0]===255&&bytes[1]===254)||(bytes[0]===254&&bytes[1]===255)||(bytes[0]===0&&bytes[1]===0))throw Error('Flatex: UTF-16/32 ist nicht als bestätigtes Originalencoding freigegeben.');
 let text,encoding='utf-8';
 try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}
 catch{text=decodeCP1252(bytes);encoding='windows-1252';}
 return project(text,encoding);
}
