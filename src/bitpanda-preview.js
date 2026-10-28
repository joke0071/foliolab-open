/** Documentary native CSV projection only. No portfolio, network, storage or import API. */
import {readCSVRecords} from './csv-records.js';
import {units,exact} from './decimal.js';
export const BITPANDA_HEADERS=Object.freeze(['Transaction ID','Timestamp','Transaction Type','In/Out','Amount Fiat','Fiat','Amount Asset','Asset','Asset market price','Asset market price currency','Asset class','Product ID','Fee','Fee asset','Fee percent','Spread','Spread Currency','Tax Fiat']);
const signature=['Transaction ID','Timestamp','Transaction Type','In/Out','Amount Fiat','Fee asset'];
const headerLike=cells=>signature.filter(h=>cells.includes(h)).length>=3;
export const looksLikeBitpandaCSV=lexed=>Boolean(lexed?.records?.slice(0,21).some(r=>headerLike(r.cells.map(v=>v.trim()))));
const shortTypes=new Set(['reward','transfer (stake)','transfer (unstake)']);
const types=new Set(['buy','sell','deposit','withdrawal','transfer',...shortTypes]);
const numeric=['Amount Fiat','Amount Asset','Asset market price','Fee','Fee percent','Spread','Tax Fiat'];
const unknown=v=>v==null||v===''||v==='-';
function sourceTime(value){
 const m=/^(\d{4}-\d\d-\d\d)T(\d\d:\d\d:\d\d)(\.\d{1,3})?(Z|[+-](\d\d):(\d\d))$/.exec(value);
 if(!m)return false;
 const local=m[1]+'T'+m[2]+(m[3]||'')+'Z',n=Date.parse(local);
 if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,19)!==m[1]+'T'+m[2])return false;
 return m[4]==='Z'||(Number(m[5])<=14&&Number(m[6])<60&&(Number(m[5])!==14||m[6]==='00'));
}
export function parseBitpandaCSV(input){
 if(typeof input!=='string'||new TextEncoder().encode(input).length>2_000_000)throw Error('Bitpanda: maximal 2 MB UTF-8-Text erlaubt.');
 const {records}=readCSVRecords(input,{delimiter:',',maxRecords:5021});
 const header=records.findIndex(r=>headerLike(r.cells.map(v=>v.trim())));
 if(header<0||header>20)throw Error('Bitpanda: eindeutiger Header nach maximal 20 Vorspannrecords erforderlich.');
 const headers=records[header].cells.map(v=>v.trim());
 if(headers.length!==18||headers.some((v,i)=>v!==BITPANDA_HEADERS[i]))throw Error('Bitpanda: das bestätigte 18-Spalten-Headerschema in Quellreihenfolge wird benötigt.');
 const data=records.slice(header+1);
 if(!data.length||data.length>5000)throw Error('Bitpanda: 1 bis 5.000 Datenzeilen erforderlich.');
 const rows=data.map(record=>{
  const cells=record.cells.map(v=>v.trim()),type=cells[2],omitted=cells.length===17;
  if(headerLike(cells))throw Error('Bitpanda: wiederholter oder gemischter Header.');
  if(cells.length!==18&&!(omitted&&shortTypes.has(type)))throw Error('Bitpanda: abweichende Spaltenanzahl; nur bestätigte 17-Feld-Staking-/Rewardzeilen zulässig.');
  const values=Object.fromEntries(BITPANDA_HEADERS.map((h,i)=>[h,i<cells.length?cells[i]:null])),numbers={},issues=[];
  if(omitted)issues.push('Tax Fiat fehlt als Quellfeld; unbekannt, niemals als 0 ergänzt.');
  for(const [key,value]of Object.entries(values))if(value!==null&&(value.length>300||/[\u0000-\u001f]/.test(value)))issues.push(key+': ungewöhnliches oder langes Quellfeld.');
  for(const key of numeric){
   const v=values[key];numbers[key]=null;
   if(unknown(v)){issues.push(key+': Wert unbekannt, nicht nullgesetzt.');continue;}
   try{if(v.length>100||!/^[-+]?\d+(?:\.\d+)?$/.test(v))throw Error();numbers[key]=exact(units(v));}catch{issues.push(key+': Zahl nicht exakt lesbar.');}
  }
  if(!sourceTime(values.Timestamp))issues.push('Timestamp: Kalender, Uhrzeit oder expliziter Zeitoffset ungeklärt.');
  if(!types.has(type))issues.push('Unbekannter Transaktionstyp; keine Buchungsannahme.');
  if(!['incoming','outgoing'].includes(values['In/Out']))issues.push('Richtung ungeklärt; keine Vorzeichen- oder Cashflowannahme.');
  if(unknown(values['Transaction ID']))issues.push('Transaction ID fehlt; keine globale Identität belegt.');
  for(const [amount,currency]of [['Amount Fiat','Fiat'],['Amount Asset','Asset'],['Asset market price','Asset market price currency'],['Fee','Fee asset'],['Spread','Spread Currency']])if(numbers[amount]!==null&&unknown(values[currency]))issues.push(currency+': Währung/Asset zur Quellzahl ungeklärt.');
  return {line:record.line,fieldCount:cells.length,values:Object.freeze(values),numbers:Object.freeze(numbers),issues};
 });
 const ids=new Map();
 for(const row of rows){const id=row.values['Transaction ID'];if(!unknown(id)){const list=ids.get(id)||[];list.push(row);ids.set(id,list);}}
 for(const list of ids.values())if(list.length>1){const same=new Set(list.map(r=>JSON.stringify(r.values))).size===1;for(const row of list)row.issues.push(same?'Identische ID-Wiederholung; alle Zeilen bleiben erhalten.':'Widersprüchliche ID-Zeilen; keine automatische Auflösung.');}
 return Object.freeze({kind:'bitpanda-document-preview',version:1,writeEnabled:false,ready:false,preambleRecords:header,
  rows:Object.freeze(rows.map(r=>Object.freeze({...r,issues:Object.freeze(r.issues)}))),
  reason:'Nur lokale Formatprüfung. Keine Buchungen, Bestände, Cashflows, Einstandswerte oder Steuerwerte werden übernommen. Unabhängige Stichtage und vollständige Historie bleiben gesondert zu belegen.'});
}
