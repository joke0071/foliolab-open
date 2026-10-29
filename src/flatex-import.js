import {parseCSV,normalizeCSVNumber,CSV_FIELDS} from './csv-import.js';
import {units,exact,SCALE} from './decimal.js';
import {inspectNativeFlatexSourceIdentities} from './import-identity.js';
import {inspectNativeFlatexOrderLinks} from './flatex-settlements.js';

/**
 * An isolated, read-only Flatex AT CSV adapter. The output is compatible with
 * the existing transaction import preview; this module never mutates a model,
 * creates positions, calls a network service, or silently treats a cash
 * settlement as an external transfer.
 *
 * This is independent work, not code copied from flatex-analyzer (AGPL).
 */
export const FLATEX_PROFILE = Object.freeze({id:'flatex-at',label:'Flatex Österreich'});
export const FLATEX_MAPPING = Object.freeze(Object.fromEntries(CSV_FIELDS.map(key=>[key,key])));

/** Native source projection only; unresolved rows block the whole later preview. */
export function prepareNativeFlatexImport(documents){
 const identities=inspectNativeFlatexSourceIdentities(documents),links=inspectNativeFlatexOrderLinks(documents);
 const key=x=>JSON.stringify([x.sourceIndex,x.line]),sources=new Map(identities.rows.map(x=>[key(x),x]));
 const groups=new Map(links.groups.flatMap(g=>[...g.depot,...g.cash].map(l=>[key(l),g])));
 const parsed={headers:[...CSV_FIELDS],rows:[],sourceName:'',sourceIdentities:{}},issues=[],sourceRows=[],sourceTrades=[],depotIdentifiers=new Set(),intraday=new Map();
 for(const [sourceIndex,doc]of documents.entries())for(const row of doc.rows){
  const locator={sourceIndex,line:row.line},source=sources.get(key(locator)),group=groups.get(key(locator)),v=row.values,n=row.numbers;
  const reject=(code,message)=>issues.push({...locator,code,message});
  if(doc.type!=='depot'){reject('cash-review','Kontobelege bleiben ungeklärt; keine stille Auslassung oder Cashbuchung.');continue;}
  if(!['order-buy','order-sell'].includes(row.kind)||!row.order){reject('event-review','Kein belegter unstornierter Stückhandelsvorgang.');continue;}
  if(source.status!=='candidate-source'||group?.status!=='missing-cash'){
   reject('source-review','Quellen- oder Orderkonflikt muss vor einer Gesamtsimulation geklärt werden.');continue;
  }
  if(v.unit!=='Stk.'||v.priceCurrency!=='EUR'){reject('currency-unit-review','Nur belegte EUR-Stücknotierung; keine Nennwert-, Prozent- oder FX-Annahme.');continue;}
  const q=units(n.nominal),price=units(n.rate),quantity=q<0n?-q:q;
  if(row.order.type==='buy'?q<=0n:q>=0n){reject('direction-review','Nominalrichtung widerspricht dem Kauf-/Verkaufsbeleg.');continue;}
  if(price<=0n||(quantity*price)%SCALE!==0n){reject('precision-review','Ausführung muss ohne Rundungsverlust exakt darstellbar sein.');continue;}
  const type=row.order.type,date=row.dates.bookingDate,isin=row.order.isin,index=parsed.rows.length+2;
  parsed.rows.push(record({date,type,position:isin,quantity:exact(quantity),unitPrice:n.rate,notes:v.details,externalId:source.externalId}));
  parsed.sourceIdentities[index]={...source.identity};sourceRows.push(locator);depotIdentifiers.add(v.depot);
  sourceTrades.push({...locator,reference:source.externalId,depot:v.depot,date,isin,type,quantity:exact(quantity),unitPrice:n.rate,externalId:source.externalId});
  const day=JSON.stringify([isin,date]),list=intraday.get(day)||[];list.push({type,locator});intraday.set(day,list);
 }
 for(const list of intraday.values())if(new Set(list.map(x=>x.type)).size>1)for(const x of list)issues.push({...x.locator,code:'intraday-review',message:'Reihenfolge gleichdatierter Käufe und Verkäufe ist nicht belegt.'});
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
 return freeze({kind:'flatex-native-trade-projection',version:1,ready:false,writeEnabled:false,costsVerified:false,
  parsed,mapping:{...FLATEX_MAPPING},sourceRows,sourceTrades,identities,rows:links.rows,depotIdentifiers:[...depotIdentifiers],issues,
  note:'Nur native Stückhandelsprojektion; keine Kontobindung, Cashbuchung, Kostenbasis oder vollständige Historienfreigabe.'});
}

const aliases={
 date:['buchtag','buchungstag'],
 valuta:['valuta'],
 isin:['isin'],
 description:['bezeichnung'],
 units:['nominal','nominal stk'],
 rate:['kurs'],
 details:['buchungsinformationen','buchungsinformation'],
 reference:['ta nr','ta nummer','transaktionsnummer'],
 accountAmount:['betrag'],
 accountNumber:['konto','auftraggeberkonto','zahlungspfl','iban kontonummer'],
 depotNumber:['depot'],
};
const canonical=s=>String(s??'').trim().toLowerCase()
 .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim();
const headersOf=headers=>{
 const found={};
 for(const [key,variants] of Object.entries(aliases)){
  found[key]=headers.find(h=>variants.includes(canonical(h)))||'';
 }
 return found;
};
const value=(row,key,heads)=>String(row[heads[key]]??'').trim();
const exactDate=input=>{
 const raw=String(input??'').trim();
 let year,month,day;
 if(/^\d{2}\.\d{2}\.\d{4}$/.test(raw)){
  [day,month,year]=raw.split('.').map(Number);
 }else if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
  [year,month,day]=raw.split('-').map(Number);
 }else throw Error('Datum fehlt oder hat ein unbekanntes Format.');
 const formatted=[year,String(month).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
 if(!Number.isFinite(year)||new Date(formatted+'T12:00:00Z').toISOString().slice(0,10)!==formatted)
  throw Error('Ungültiges Buchungsdatum.');
 return formatted;
};
const isinOk=s=>/^[A-Z]{2}[A-Z0-9]{10}$/.test(s);
const singleAmount=s=>{
 const raw=String(s??'').trim();
 // Flatex exports use German notation: a lone dot grouping three digits is
 // a thousands separator, not a decimal point.
 const german=/^[+-]?\d{1,3}(?:\.\d{3})+$/.test(raw)?raw.replaceAll('.',''):raw;
 const v=normalizeCSVNumber(german);
 if(!/^\d+(?:\.\d+)?$/.test(v)&&! /^-\d+(?:\.\d+)?$/.test(v))throw Error('Ungültiger Betrag.');
 return v;
};
const absAmount=s=>{
 const v=singleAmount(s);
 if(Number(v)===0)throw Error('Stückzahl/Betrag muss größer als null sein.');
 return v.startsWith('-')?v.slice(1):v;
};
const first=[...CSV_FIELDS];
const record=(d)=>Object.fromEntries(first.map(key=>[key,String(d[key]??'')]));

export function detectFlatexCSV(parsed){
 if(!parsed||!Array.isArray(parsed.headers))return null;
 const heads=headersOf(parsed.headers);
 const base=Boolean(heads.date&&heads.valuta&&heads.details&&heads.reference);
 if(base&&heads.isin&&heads.units&&heads.rate)
  return {profile:'flatex-at',type:'depot',variant:parsed.headers.some(h=>canonical(h)==='nominal stk')?'next':'classic',heads};
 if(base&&heads.accountAmount)
  return {profile:'flatex-at',type:'account',variant:parsed.headers.some(h=>canonical(h)==='zahlungspfl')?'next':'classic',heads};
 return null;
}
const tradeType=details=>{
 if(/(?:^|\W)ORDER\s+Kauf(?:\W|$)/i.test(details))return 'buy';
 if(/(?:^|\W)ORDER\s+Verkauf(?:\W|$)/i.test(details))return 'sell';
 return '';
};
const cashHint=details=>{
 if(/dividendenzahlung|aussch[uü]ttung/i.test(details))return 'dividend';
 if(/zins(?:gutschrift|zahlung)|habenzins/i.test(details))return 'interest';
 if(/kapitalertragsteuer|quellensteuer|steuerbelastung|(?:^|\W)KESt(?:\W|$)/i.test(details))return 'tax';
 if(/depotgeb[uü]hr|kontof[uü]hrungsgeb[uü]hr|geb[uü]hrenbelastung/i.test(details))return 'fee';
 if(/einzahlung|[uü]berweisungseingang/i.test(details))return 'deposit';
 if(/auszahlung|[uü]berweisungsausgang/i.test(details))return 'withdraw';
 if(/ORDER|Wertpapier|Abrechnung|Sparplan/i.test(details))return 'settlement';
 return 'unknown';
};
const stableKey=({type,reference,account,isin,date,details,units,rate})=>
 JSON.stringify([type,reference,account,isin,date,canonical(details),units,rate]);
const issue=(file,line,code,message,extra={})=>({file,line,code,message,...extra});
// Stable compact non-sensitive fingerprint, independent of the source filename.
const shortIdentity=s=>{
 let h=14695981039346656037n;
 for(let i=0;i<s.length;i++)h=((h^BigInt(s.charCodeAt(i)))*1099511628211n)&0xffffffffffffffffn;
 return h.toString(16).padStart(16,'0');
};

/**
 * @param {Array<{name:string,text:string}>} files
 * @returns {{parsed:{headers:string[],rows:object[]},mapping:object,reports:object[],issues:object[],cashItems:object[],duplicates:number}}
 * Only known, unambiguous purchases/sales become candidate transactions.
 * Account movements remain inspection-only until an explicit broker cash
 * settlement matcher and account association is validated.
 */
export function prepareFlatexImport(files){
 if(!Array.isArray(files)||!files.length||files.length>20)throw Error('Bitte 1 bis 20 Flatex-CSV-Dateien auswählen.');
 const reports=[],issues=[],cashItems=[],rows=[],sourceRows=[],sourceTrades=[],keys=new Map(),referenced=new Map(),depotIdentifiers=new Set();
 let duplicates=0,total=0;
 for(const [fileIndex,file] of files.entries()){
  const name=String(file?.name??'').slice(0,140)||'Datei '+(fileIndex+1);
  if(typeof file?.text!=='string')throw Error(name+': Dateiinhalt fehlt.');
  let parsed;
  try{parsed=parseCSV(file.text);}catch(e){throw Error(name+': '+e.message);}
  const detection=detectFlatexCSV(parsed);
  if(!detection)throw Error(name+': kein unterstützter Flatex-Depot- oder Kontoumsatzexport.');
  const {type,heads,variant}=detection;
  const report={name,type,variant,rows:parsed.rows.length,candidates:0,cashRows:0,duplicates:0,review:0};
  reports.push(report);total+=parsed.rows.length;
  if(total>5000)throw Error('Bitte maximal 5.000 Datenzeilen pro Import auswählen.');
  for(const [rowIndex,row] of parsed.rows.entries()){
   const line=rowIndex+2,details=value(row,'details',heads),ref=value(row,'reference',heads);
   try{
    const date=exactDate(value(row,'date',heads));
    const account=value(row,type==='depot'?'depotNumber':'accountNumber',heads);
    if(type==='depot'&&account)depotIdentifiers.add(account);
    if(type==='account'){
     const amount=singleAmount(value(row,'accountAmount',heads));
     const hint=cashHint(details);
     const refKey=ref?JSON.stringify(['account',account,date,ref]):'';
     const signature=JSON.stringify([hint,amount,canonical(details)]);
     if(refKey&&referenced.has(refKey)&&referenced.get(refKey).signature!==signature){
      const prior=referenced.get(refKey);
      issues.push(issue(name,line,'ambiguous-duplicate','Dieselbe Konto-Transaktionsreferenz enthält widersprüchliche Beträge oder Buchungsinformationen (zuerst in '+prior.file+', Zeile '+prior.line+').'));
      report.review++;continue;
     }
     const key=stableKey({type:'cash:'+hint,reference:ref,account,isin:'',date,details,units:'',rate:amount});
     if(keys.has(key)){
      const first=keys.get(key);
      if(ref){report.duplicates++;duplicates++;continue;}
      issues.push(issue(name,line,'ambiguous-duplicate','Gleicher Kontoumsatz ohne Transaktionsreferenz (zuerst in '+first.file+', Zeile '+first.line+').'));
      report.review++;continue;
     }
     keys.set(key,{file:name,line});
     if(refKey)referenced.set(refKey,{signature,file:name,line});
     cashItems.push({file:name,line,date,account,reference:ref,amount,kind:hint,details:details.slice(0,200)});
     report.cashRows++;continue;
    }
    const kind=tradeType(details);
    if(!kind){
     issues.push(issue(name,line,'unsupported','Depotvorgang wird nicht automatisch verbucht: '+details.slice(0,90),{kind:'depot'}));
     report.review++;continue;
    }
    const isin=value(row,'isin',heads).toUpperCase();
    if(!isinOk(isin))throw Error('ISIN fehlt oder ist ungültig.');
    const quantity=absAmount(value(row,'units',heads));
    const unitPrice=singleAmount(value(row,'rate',heads));
    if(Number(unitPrice)<=0)throw Error('Ausführungskurs fehlt oder ist nicht positiv.');
    const refKey=ref?JSON.stringify(['depot',account,date,ref,isin,kind]):'';
    const signature=JSON.stringify([quantity,unitPrice,canonical(details)]);
    if(refKey&&referenced.has(refKey)&&referenced.get(refKey).signature!==signature){
     const prior=referenced.get(refKey);
     issues.push(issue(name,line,'ambiguous-duplicate','Dieselbe Depot-Transaktionsreferenz enthält abweichende Stückzahlen, Kurse oder Angaben (zuerst in '+prior.file+', Zeile '+prior.line+').'));
     report.review++;continue;
    }
    const key=stableKey({type:kind,reference:ref,account,isin,date,details,units:quantity,rate:unitPrice});
    if(keys.has(key)){
     const previous=keys.get(key);
     if(ref){
      report.duplicates++;duplicates++;
      continue;
     }
     // The same order may legitimately have identical partial executions.
     // Never silently collapse these rows without an explicit broker ID.
     issues.push(issue(name,line,'ambiguous-duplicate','Gleiche Buchung ohne eindeutige Transaktionsnummer (zuerst gesehen in '+previous.file+', Zeile '+previous.line+').'));
     report.review++;continue;
    }
    keys.set(key,{file:name,line});
    if(refKey)referenced.set(refKey,{signature,file:name,line});
    // Keep broker reference in the external ID. Where none exists, use a
    // content-derived identity only after the ambiguity checks above.
    const externalId='flatex-at:'+shortIdentity(key);
    rows.push(record({
     date,type:kind,position:isin,quantity,unitPrice,
     feeEUR:'0',taxEUR:'0',fxRate:'',cashPosition:'',notes:details.slice(0,180),
     externalId
    }));
    sourceRows.push({file:name,line});
    sourceTrades.push({file:name,line,reference:ref,depot:account,date,isin,type:kind,quantity,unitPrice,externalId});
    report.candidates++;
   }catch(e){
    issues.push(issue(name,line,'invalid',String(e.message).slice(0,200)));report.review++;
   }
  }
 }
 if(rows.length===0&&!cashItems.length&&!issues.length)
  throw Error('Keine Flatex-Buchungen erkannt.');
 return {parsed:{headers:first,rows,sourceName:files.map(f=>f.name||'').join('|'),sourceIdentities:Object.fromEntries(sourceTrades.map((t,i)=>[i+2,{sourceId:'flatex-at',externalId:t.reference||'',costsVerified:false}]))},mapping:{...FLATEX_MAPPING},reports,issues,cashItems,sourceTrades,duplicates,
  sourceRows,depotIdentifiers:[...depotIdentifiers],requiresCashReview:cashItems.length>0};
}
