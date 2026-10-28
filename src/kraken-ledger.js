/** Native documentary ledger preview only. No model, network, import or persistence API. */
import {parseCSV} from './csv-import.js';
import {units,exact} from './decimal.js';
export const KRAKEN_LEDGER_HEADERS=Object.freeze(['txid','refid','time','type','subtype','aclass','subclass','asset','wallet','amount','fee','balance','amountusd','feeusd','balanceusd','feecurrency']);
const descriptions={trade:'Ledgerbewegung eines Handels; Ausführungen und alle Beine separat belegen.',deposit:'Zugang laut Ledger; externe Einzahlung oder Herkunft nicht automatisch belegt.',withdrawal:'Abgang laut Ledger; Gegenkonto und Gebühren gesondert prüfen.',transfer:'Transfer laut Ledger; keine automatische externe Geldbewegung.',spend:'Belastungsseite laut Ledger; zugehörige Beine prüfen.',receive:'Gutschriftsseite laut Ledger; zugehörige Beine prüfen.',earn:'Earn-Bewegung; Zuteilung, Rückführung und Ertrag nicht gleichsetzen.'};
const subtypes=new Set(['','tradespot','spotfromfutures','spottofutures','autoallocation','autoallocate','allocation','deallocation','reward','delistingconversion','migration','spottostaking','stakingfromspot','stakingtospot','spotfromstaking']);
const combinations={trade:['','tradespot'],deposit:['','spotfromfutures'],withdrawal:[''],transfer:['','spotfromfutures','spottofutures','delistingconversion','spottostaking','stakingfromspot','stakingtospot','spotfromstaking'],spend:['','delistingconversion'],receive:['','delistingconversion'],earn:['','autoallocation','autoallocate','allocation','deallocation','reward','migration']};
/** Recognizable incomplete native files are quarantined before generic feeEUR mapping. */
export function looksLikeKrakenLedgerCSV(parsed){return ['txid','refid','aclass','subclass','wallet','feecurrency'].filter(h=>parsed?.headers?.includes(h)).length>=3;}
const decimal=v=>{if(v==='')return null;if(v.length>100||!/^[-+]?\d+(?:\.\d+)?$/.test(v))throw Error();return exact(units(v));};
function sourceTime(v){
 if(!/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(v))return false;
 const iso=v.replace(' ','T')+'Z',n=Date.parse(iso);return Number.isFinite(n)&&new Date(n).toISOString()===iso.replace('Z','.000Z');
}
export function parseKrakenLedgerCSV(input){
 if(typeof input!=='string'||new TextEncoder().encode(input).length>2_000_000)throw Error('Kraken: maximal 2 MB Text erlaubt.');
 const parsed=parseCSV(input);
 if(parsed.headers.length!==16||KRAKEN_LEDGER_HEADERS.some(h=>!parsed.headers.includes(h)))throw Error('Kraken: das bestätigte native 16-Spalten-Ledgerformat wird benötigt.');
 const rows=parsed.rows.map((values,index)=>{
  const issues=[],numbers={};
  for(const h of KRAKEN_LEDGER_HEADERS)if(values[h].length>300||/[\u0000-\u001f]/.test(values[h]))issues.push('Quellfeld '+h+' ist ungewöhnlich oder zu lang.');
  for(const field of ['amount','fee','balance','amountusd','feeusd','balanceusd']){
   try{numbers[field]=decimal(values[field]);}catch{numbers[field]=null;issues.push(field+': Zahl nicht exakt lesbar.');}
  }
  for(const field of ['txid','refid','asset','wallet'])if(!values[field])issues.push(field+': Referenz oder Quellbereich fehlt.');
  for(const field of ['amount','fee','balance'])if(numbers[field]===null)issues.push(field+': Wert unbekannt, nicht nullgesetzt.');
  if(!sourceTime(values.time))issues.push('Zeitpunkt nicht kalendergenau im bestätigten Quellformat.');
  if(!Object.hasOwn(descriptions,values.type))issues.push('Unbekannter Ledger-Typ; keine Buchungsannahme.');
  if(!subtypes.has(values.subtype))issues.push('Unbekannter Ledger-Subtyp; Bedeutung ungeklärt.');
  else if(Object.hasOwn(combinations,values.type)&&!combinations[values.type].includes(values.subtype))issues.push('Typ-/Subtyp-Kombination nicht fachlich freigegeben.');
  if(values.aclass!=='currency')issues.push('Assetklasse ungeklärt.');
  if(numbers.fee!==null&&units(numbers.fee)<0n)issues.push('Negatives Gebührenvorzeichen ungeklärt.');
  if(!values.feecurrency)issues.push('Gebührenwährung nicht ausdrücklich deklariert.');
  return {line:index+2,values:Object.freeze({...values}),numbers:Object.freeze(numbers),meaning:Object.hasOwn(descriptions,values.type)?descriptions[values.type]:'Wirtschaftliche Bedeutung ungeklärt.',issues};
 });
 const txids=new Map(),groups=new Map();
 for(const row of rows){
  if(row.values.txid){const list=txids.get(row.values.txid)||[];list.push(row);txids.set(row.values.txid,list);}
  // Missing references never combine unrelated rows into a single apparent event.
  const key=row.values.refid?'ref:'+row.values.refid:'missing-line:'+row.line;
  const group=groups.get(key)||{refid:row.values.refid,lines:[]};group.lines.push(row.line);groups.set(key,group);
 }
 for(const list of txids.values())if(list.length>1){
  const signatures=new Set(list.map(row=>JSON.stringify(KRAKEN_LEDGER_HEADERS.map(h=>row.values[h]))));
  for(const row of list)row.issues.push(signatures.size===1?'Identische txid-Wiederholung; alle Quellzeilen bleiben sichtbar.':'Widersprüchliche txid-Zeilen; keine automatische Auflösung.');
 }
 const groupList=[...groups.values()].map(g=>Object.freeze({refid:g.refid,lines:Object.freeze(g.lines)}));
 return Object.freeze({kind:'kraken-ledger-preview',version:1,writeEnabled:false,ready:false,
  rows:Object.freeze(rows.map(row=>Object.freeze({...row,issues:Object.freeze(row.issues)}))),groups:Object.freeze(groupList),
  reason:'Nur lokale Prüfvorschau. Keine Buchungen, Bestände, Cashflows, Einstandswerte oder Steuerwerte werden übernommen. Trades, vollständige Historie und unabhängige Stichtagsbestände bleiben gesondert zu belegen.'});
}
