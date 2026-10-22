/**
 * Locally imported reference lists. The app never mirrors exchange directories.
 * An explicit user-provided text file is parsed and persisted in IndexedDB.
 * No portfolio, account, wallet, current quote or tax information is read or written.
 */
import {FUND_DB} from './instrument-catalog.js';
export const SECURITY_CATALOG_FORMAT='security-directory-v1';
export const DIRECTORY_PAGE_LINKS=Object.freeze({
 xetra:'https://www.cashmarket.deutsche-boerse.com/cash-de/Handel/Handelbare-Werte-Xetra/Downloads/xetra-downloads',
 nasdaq:'https://www.nasdaqtrader.com/trader.aspx?id=symboldirdefs',
 esma:'https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_firds_files'
});
export const MAX_DIRECTORY_BYTES=24_000_000,MAX_DIRECTORY_ROWS=160000,REVIEW_AFTER_DAYS=30;
const knownSources=['xetra','nasdaq','esma','custom'];
const norm=s=>String(s??'').trim();
const upper=s=>norm(s).toUpperCase();
const folded=s=>norm(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de');
const h=s=>folded(s).replace(/[^a-z0-9]/g,'');
const isin=s=>/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(s);
const ticker=s=>/^[A-Z0-9^._/-]{1,32}$/.test(s);
const cc=s=>/^[A-Z]{3}$/.test(s);
const mic=s=>/^[A-Z0-9]{4}$/.test(s);
const timestamp=()=>new Date().toISOString();
const nasdaqMIC=Object.freeze({Q:'XNAS',N:'XNYS',A:'XASE',P:'ARCX',Z:'BATS',V:'IEXG'});
/**
 * Semicolon/pipe/tab/comma quoted rows; Xetra's Market and Date preamble is
 * permitted. Stops at a strict row/column bound before storing untrusted data.
 */
function rowsFrom(text,maxRows=MAX_DIRECTORY_ROWS){
 if(typeof text!=='string'||text.length<15||text.length>MAX_DIRECTORY_BYTES)throw Error('Bitte eine Textdatei bis 24 MB verwenden.');
 const input=text.replace(/^\uFEFF/,'');
 const first=input.split(/\r?\n/,4).find(l=>/^(Symbol|ACT Symbol|Instrument|Product Status|Market Segment Status|ISIN|Financial Instrument|FullNm|ISIN Code|Security Name)/i.test(l.trim()))||input.split(/\r?\n/,1)[0];
 const delimiter=[';','|','\t',','].map(x=>[x,first.split(x).length]).sort((a,b)=>b[1]-a[1])[0];
 if(!delimiter||delimiter[1]<2)throw Error('Keine erkennbaren Spalten in CSV/TXT.');
 const d=delimiter[0],result=[];let line=[],val='',quoted=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(c==='"'){
   if(quoted&&input[i+1]==='"'){val+='"';i++;}
   else quoted=!quoted;
  }else if(c===d&&!quoted){line.push(val.trim());val='';}
  else if((c==='\n'||c==='\r')&&!quoted){
   line.push(val.trim());if(line.some(Boolean))result.push(line);
   if(result.length>maxRows+5)throw Error('Maximal 160.000 Verzeichniszeilen je Datei.');
   line=[];val='';if(c==='\r'&&input[i+1]==='\n')i++;
  }else val+=c;
 }
 if(quoted)throw Error('Unvollständig zitierte CSV-Spalte.');
 line.push(val.trim());if(line.some(Boolean))result.push(line);
 return result;
}
const pick=(headers,aliases)=>{
 for(const alias of aliases){const idx=headers.indexOf(alias);if(idx>=0)return idx;}
 return -1;
};
const typeFrom=(rawName,rawCategory,rawETF,rawCFI)=>{
 const t=folded(rawCategory);
 if(upper(rawETF)==='Y'||/\b(etf|exchange.traded.fund|active etf)\b/.test(t))return 'etf';
 if(/\b(etn|etc|warrant|future|option|certificate|bond|zertifikat|anleihe)\b/.test(t))return 'other';
 if(/\b(fund|mutual|investmentfond|fonds)\b/.test(t))return 'fund';
 if(/\b(stock|shares?|equities|equity|aktien?|common)\b/.test(t)||upper(rawCFI).startsWith('ES')||/\b(common stock|ordinary shares?|registered shares?|aktien?)\b/i.test(rawName))return 'stock';
 // Never invent ETF status from ticker or an unverified instrument name.
 if(/\bETF\b/i.test(rawName))return 'etf';
 return 'other';
};
export function parseSecurityDirectory(input,{filename='referenz.csv',source='auto',importedAt=timestamp()}={}){
 if(source!=='auto'&&!knownSources.includes(source))throw Error('Unbekannte Verzeichnisquelle.');
 const raw=input.replace(/^\uFEFF/,'');
 const lines=rowsFrom(input);
 let headerRow=0,sourceFromFile=source,declaredMarket='',sourceAsOf=null;
 if(/^Market:\s*(XETR|XFRA)/i.test(lines[0]?.[0]||'')){
  const market=upper(lines[0][0].split(':')[1]);declaredMarket=market;
  const preamble=lines.slice(0,3).find(row=>/^Date Last Update:/i.test(row?.[0]||''));
  const foundDate=preamble?.[0]?.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if(foundDate)sourceAsOf=foundDate[3]+'-'+foundDate[2].padStart(2,'0')+'-'+foundDate[1].padStart(2,'0');
  if(source!=='auto'&&source!=='xetra'&&source!=='custom')throw Error('Datei und gewählte Quelle widersprechen sich.');
  sourceFromFile='xetra';headerRow=lines.findIndex((row,i)=>i<=5&&row.some(v=>h(v)==='isin')&&row.some(v=>h(v)==='instrument'));
  if(headerRow<0)throw Error('Xetra-Datei ohne ISIN/Instrument-Kopfzeile.');
  if(market==='XFRA')sourceFromFile='custom';
 }
 if(headerRow===0){
  const keys=lines[0].map(h);
  const isNasdaq=keys.includes('symbol')&&keys.includes('securityname')&&keys.includes('testissue')||keys.includes('actsymbol')&&keys.includes('securityname')&&keys.includes('etf');
  if(source==='auto')sourceFromFile=isNasdaq?'nasdaq':'custom';
  if(source==='nasdaq'&&!isNasdaq)throw Error('Keine passende Nasdaq-Symbolverzeichnis-Datei.');
  if(source==='xetra'&&(!keys.includes('isin')||!keys.includes('instrument')))throw Error('Kein erkennbarer Xetra-Instrumentenkatalog.');
 }
 if(sourceFromFile==='auto')sourceFromFile='custom';
 if(sourceFromFile==='nasdaq'){
  const footer=lines.findLast(row=>/^File Creation Time:\s*\d{8}/i.test(row?.[0]||''));
  const m=footer?.[0]?.match(/File Creation Time:\s*(\d{2})(\d{2})(\d{4})/i);
  if(m)sourceAsOf=m[3]+'-'+m[1]+'-'+m[2];
 }
 const columns=lines[headerRow].map(h);
 const nameIdx=pick(columns,['instrument','securityname','name','fullname','fullnm','financialinstrumentname','instrumentname','shortname','fondsbezeichnung','fondsname','fundname','issuername']);
 const symbolIdx=pick(columns,['mnemonic','symbol','actsymbol','nasdaqsymbol','tradingsymbol','tickercode','ticker','tradingshortcode','exchangeinstrumentid']);
 const isinIdx=pick(columns,['isin','isincode','instrumentisin']);
 const ccyIdx=pick(columns,['tradingcurrency','quotecurrency','pricecurrency','currency','currencycode','tradingcurr']);
 const settlementIdx=pick(columns,['settlementcurrency','settlementcurr','settlementccy']);
 const micIdx=pick(columns,['miccode','mic','tradingvenuemiccode','marketidentifiercode','venue','tradingvenue']);
 const exchangeIdx=pick(columns,['exchange','listingexchange']);
 const typeIdx=pick(columns,['type','producttype','instrumenttype','securitytype','productassignmentgroup','productassignment','assetclass','cficode','cficlassification','classificationtype']);
 const cfiIdx=pick(columns,['cficode','cficlassification']);
 const etfIdx=pick(columns,['etf']);
 const testIdx=pick(columns,['testissue']);
 const statusIdx=pick(columns,['instrumentstatus','productstatus','marketsegmentstatus']);
 if(nameIdx<0||(symbolIdx<0&&isinIdx<0))throw Error('Verzeichnis braucht Name sowie ISIN oder Börsenkürzel; Kopfzeile nicht erkannt.');
 if(sourceFromFile==='xetra'&&isinIdx<0)throw Error('Xetra-Import erfordert die ISIN-Spalte.');
 const out=[],duplicates=new Set();let skipped=0,tests=0;
 for(let i=headerRow+1;i<lines.length;i++){
  const row=lines[i];
  if(row.length<2||row.length<columns.length-3){skipped++;continue;}
  if(row[0]?.startsWith('File Creation Time'))continue;
  const value=n=>n<0?'':norm(row[n]);
  if(testIdx>=0&&upper(value(testIdx))==='Y'){tests++;continue;}
  const status=folded(value(statusIdx));
  if(status&&['inactive','pending deletion','deleted'].includes(status)){skipped++;continue;}
  const name=value(nameIdx).slice(0,140),symbol=upper(value(symbolIdx)).slice(0,32);
  const originalISIN=upper(value(isinIdx)),code=isin(originalISIN)?originalISIN:'';
  const currency=upper(value(ccyIdx)),settlementCurrency=upper(value(settlementIdx)),rawMic=upper(value(micIdx));
  const sourceExchange=upper(value(exchangeIdx));
  const codeMIC=mic(rawMic)?rawMic:sourceFromFile==='nasdaq'?(nasdaqMIC[sourceExchange]||(/^nasdaqlisted/i.test(filename)?'XNAS':'')):sourceFromFile==='xetra'&&declaredMarket==='XETR'?'XETR':'';
  if(name.length<3||(!ticker(symbol)&&!code)||originalISIN&&!code||currency&&!cc(currency)){skipped++;continue;}
  const kind=typeFrom(name,value(typeIdx),value(etfIdx),value(cfiIdx));
  const rowSource=sourceFromFile==='xetra'?'Xetra (Datei, lokal)':sourceFromFile==='nasdaq'?'Nasdaq (Datei, lokal)':sourceFromFile==='esma'?'ESMA (Datei, lokal)':'CSV (Datei, lokal)';
  const exchange=codeMIC==='XETR'?'Xetra':codeMIC||sourceExchange;
  const record={name,kind,symbol:ticker(symbol)?symbol:'',isin:code,currency:cc(currency)?currency:'',settlementCurrency:cc(settlementCurrency)?settlementCurrency:'',mic:codeMIC,exchange,source:rowSource};
  const identity=[record.isin||record.symbol,record.symbol,record.currency,record.mic||record.exchange].join('|');
  if(duplicates.has(identity)){skipped++;continue;}
  duplicates.add(identity);out.push(record);
 }
 if(!out.length)throw Error('Keine nutzbaren Datensätze gefunden; Dateiformat und Quelle überprüfen.');
 const fileBase=folded(filename).replace(/[^a-z0-9._-]/g,'').slice(0,60);
 const datasetId=sourceFromFile==='nasdaq'?(fileBase.includes('otherlisted')?'otherlisted':fileBase.includes('nasdaqtraded')?'nasdaqtraded':'nasdaqlisted'):
   sourceFromFile==='xetra'?'all-tradable':fileBase||'custom';
 return {format:SECURITY_CATALOG_FORMAT,source:sourceFromFile,datasetId,filename:norm(filename).slice(0,130),importedAt,sourceAsOf,
  entries:out,skipped,testIssues:tests,fileRows:lines.length-headerRow-1};
}
export function searchSecurityDirectories(query,kind,catalogs=[],limit=100){
 const q=folded(query);
 if(q.length<2)return {total:0,results:[]};
 const raw=[];
 for(const catalog of catalogs)for(const x of catalog.entries||[]){
  if(x.kind!==kind||![x.name,x.symbol,x.isin].some(v=>folded(v).includes(q)))continue;
  raw.push(x);
 }
 raw.sort((a,b)=>{
  const score=x=>Number(folded(x.isin)===q)*100+Number(folded(x.symbol)===q)*60+Number(folded(x.name)===q)*40+
   Number(folded(x.symbol).startsWith(q))*20+Number(folded(x.name).startsWith(q))*10;
  return score(b)-score(a)||a.name.localeCompare(b.name);
 });
 const deduped=[],seen=new Set();
 for(const row of raw){const key=[row.kind,row.isin||row.symbol,row.symbol,row.mic,row.currency].join('|');if(seen.has(key))continue;seen.add(key);deduped.push(row);}
 return {total:deduped.length,results:deduped.slice(0,Math.min(Math.max(1,limit),100))};
}
export function directoryAge(catalog,now=Date.now()){
 const time=Date.parse(catalog?.sourceAsOf||catalog?.importedAt||'');
 if(!Number.isFinite(time))return {days:null,stale:true};
 const days=Math.max(0,Math.floor((now-time)/86400000));
 return {days,stale:days>=REVIEW_AFTER_DAYS};
}
function openDB(factory){
 return new Promise((resolve,reject)=>{
  const req=factory.open(FUND_DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('catalogs'))req.result.createObjectStore('catalogs');};
  req.onerror=()=>reject(req.error||Error('IndexedDB nicht erreichbar.'));
  req.onsuccess=()=>resolve(req.result);
 });
}
export async function saveSecurityDirectory(catalog,{factory=globalThis.indexedDB}={}){
 if(catalog?.format!==SECURITY_CATALOG_FORMAT||!knownSources.includes(catalog.source)||!Array.isArray(catalog.entries)||
   !catalog.entries.length||catalog.entries.length>MAX_DIRECTORY_ROWS||!factory)throw Error('Verzeichnis kann nicht sicher lokal gespeichert werden.');
 const db=await openDB(factory);
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction('catalogs','readwrite');
  tx.objectStore('catalogs').put(catalog,'security:'+catalog.source+':'+(catalog.datasetId||'default'));
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Speichern fehlgeschlagen.'));tx.onabort=()=>reject(tx.error||Error('Speichern abgebrochen.'));
 });}finally{db.close();}
 return catalog.entries.length;
}
export async function loadSecurityDirectories({factory=globalThis.indexedDB}={}){
 if(!factory)return [];
 let db;
 try{
  db=await openDB(factory);
  const rows=await new Promise((resolve,reject)=>{
   const req=db.transaction('catalogs','readonly').objectStore('catalogs').getAll();
   req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Verzeichnisse nicht lesbar.'));
  });
  return rows.filter(c=>c?.format===SECURITY_CATALOG_FORMAT&&knownSources.includes(c.source)&&
   Array.isArray(c.entries)&&c.entries.length<=MAX_DIRECTORY_ROWS);
 }finally{db?.close();}
}
