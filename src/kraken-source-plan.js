/** UH03 source facts. No journal arithmetic, matching by amount, or persistence. */
import {parseKrakenLedgerCSV,KRAKEN_LEDGER_HEADERS} from './kraken-ledger.js';
import {sourceDigest} from './import-identity.js';
import {units,exact} from './decimal.js';
const digest=v=>sourceDigest(JSON.stringify(v));
const streamOf=v=>JSON.stringify([v.asset,v.wallet,v.subclass]);
const abs=n=>n<0n?-n:n;
/** Documentary multi-asset principal allocation, never pairing by aggregate sum.
 * One native reference/time owns exactly one debit and credit per declared asset.
 * Wallet names/direction, subclass and zero fees are part of this bounded proof.
 */
export function krakenAutoallocationPairs(rows){
 if(rows.length<4||rows.length>24||rows.length%2||rows.some(r=>r.issues.length||r.values.type!=='earn'||r.values.subtype!=='autoallocation'||r.values.aclass!=='currency'||r.amountExact===null||r.feeExact!=='0')||new Set(rows.map(r=>r.values.refid)).size!==1||!rows[0].values.refid||new Set(rows.map(r=>r.values.time)).size!==1)return null;
 const assets=new Map(),identities=new Set();
 for(const row of rows){
  if(!row.identity||identities.has(row.identity))return null;identities.add(row.identity);
  const list=assets.get(row.values.asset)||[];list.push(row);assets.set(row.values.asset,list);
 }
 const pairs=[],directions=new Set();
 for(const [asset,legs] of [...assets].sort(([a],[b])=>a.localeCompare(b))){
  if(legs.length!==2)return null;
  const debit=legs.find(r=>units(r.amountExact)<0n),credit=legs.find(r=>units(r.amountExact)>0n);
  if(!debit||!credit||units(debit.amountExact)!==-units(credit.amountExact)||debit.values.subclass!==credit.values.subclass||!['crypto','stable_coin','fiat'].includes(debit.values.subclass)||debit.values.subclass==='fiat'&&asset!=='EUR')return null;
  const direction=JSON.stringify([debit.values.wallet,credit.values.wallet]);
  if(!['["spot / main","earn / liquid"]','["earn / liquid","spot / main"]'].includes(direction))return null;
  directions.add(direction);pairs.push({asset,debit,credit});
 }
 return directions.size===1?pairs:null;
}
/** Each Ledger ID owns its complete payload; refid groups never replace leg identities. */
export function prepareKrakenSourcePlan(inputs){
 if(!Array.isArray(inputs)||!inputs.length||inputs.length>20)throw Error('Kraken: 1 bis 20 Originaldateien erforderlich.');
 const observations=new Map(),conflicts=new Set();let repeated=0,total=0;
 for(const [fileIndex,input] of inputs.entries()){
  const doc=parseKrakenLedgerCSV(input);total+=doc.rows.length;
  if(total>5000)throw Error('Kraken: insgesamt maximal 5.000 Quellzeilen.');
  for(const row of doc.rows){
   const v=row.values,payloadDigest=digest(KRAKEN_LEDGER_HEADERS.map(h=>[h,v[h]]));
   // Source account binding is deliberately absent here, supplied by the later confirmed import.
   const identity=v.txid?digest(['kraken-ledger-v1',v.txid]):null;
   const key=identity??digest(['unidentified',observations.size,payloadDigest]);
   const prior=observations.get(key);
   if(prior){if(prior.payloadDigest!==payloadDigest)conflicts.add(key);else repeated++;}
   else observations.set(key,{identity,payloadDigest,values:v,numbers:row.numbers,issues:[...row.issues],occurrences:[]});
   observations.get(key).occurrences.push({file:fileIndex,line:row.line});
  }
 }
 const rows=[...observations.values()];
 for(const row of rows){
  // A duplicate in an overlapping export is documentary repetition, a changed ID is a conflict.
  row.issues=row.issues.filter(s=>!s.startsWith('Identische txid-Wiederholung')&&!(s==='Gebührenwährung nicht ausdrücklich deklariert.'&&row.numbers.fee==='0'));
  // A declared exact zero has no fee movement to denominate. Unknown fees stay blocked.
  if(conflicts.has(row.identity))row.issues.push('Dieselbe Ledger-ID enthält widersprüchliche Quellfelder.');
  const {amount,fee,balance}=row.numbers,v=row.values;
  row.streamId=digest(['kraken-stream-v1',streamOf(v)]);
  row.amountExact=amount;row.feeExact=fee;row.balanceExact=balance;
  row.beforeExact=amount===null||fee===null||balance===null?null:exact(units(balance)-units(amount)+units(fee));
  row.deltaExact=amount===null||fee===null?null:exact(units(amount)-units(fee));
  // The documented Kraken balance equation is in the row's asset. Never convert fee currency.
  if(fee!==null&&units(fee)!==0n&&v.feecurrency!==v.asset)row.issues.push('Gebührenasset widerspricht dem Asset der Kraken-Saldobewegung.');
 }
 const groups=new Map();
 for(const row of rows){
  const groupKey=row.values.refid?digest(['kraken-ref-v1',row.values.refid]):digest(['unidentified',row.identity,row.payloadDigest]);
  if(!groups.has(groupKey))groups.set(groupKey,{id:groupKey,rows:[]});groups.get(groupKey).rows.push(row);
 }
 const result=[...groups.values()].map(g=>{
  const issues=g.rows.flatMap(r=>r.issues),nonzero=g.rows.filter(r=>r.amountExact!==null&&units(r.amountExact)!==0n);
  const positive=nonzero.filter(r=>units(r.amountExact)>0n),negative=nonzero.filter(r=>units(r.amountExact)<0n);
  let kind='unresolved';
  if(g.rows.every(r=>['trade','spend','receive'].includes(r.values.type))&&positive.length===1&&negative.length===1)kind='exchange';
  else if(g.rows.every(r=>r.values.type==='earn'&&r.values.subtype==='reward')&&positive.length===1&&!negative.length)kind='reward';
  else if(g.rows.every(r=>r.values.type==='transfer'||r.values.type==='earn'&&['allocation','deallocation','autoallocation','autoallocate'].includes(r.values.subtype))&&positive.length===1&&negative.length===1&&positive[0].values.asset===negative[0].values.asset&&units(positive[0].amountExact)===-units(negative[0].amountExact))kind='internal-transfer';
  else if(krakenAutoallocationPairs(g.rows))kind='internal-transfer-batch';
  else if(g.rows.every(r=>r.values.type==='deposit')&&positive.length===1&&!negative.length)kind='deposit-review';
  else if(g.rows.every(r=>r.values.type==='withdrawal')&&negative.length===1&&!positive.length)kind='withdrawal-review';
  if(new Set(g.rows.map(r=>r.values.time)).size!==1)issues.push('Referenzgruppe enthält verschiedene Zeitpunkte; keine automatische Ausführungsreihenfolge.');
  if(kind==='unresolved')issues.push('Beine oder Ereignisklasse nicht eindeutig belegt.');
  const movements=new Map();
  for(const r of g.rows){
   if(!movements.has(r.streamId))movements.set(r.streamId,{streamId:r.streamId,asset:r.values.asset,wallet:r.values.wallet,subclass:r.values.subclass,amount:0n,fee:0n,known:true});
   const m=movements.get(r.streamId);
   if(r.amountExact===null||r.feeExact===null)m.known=false;else{m.amount+=units(r.amountExact);m.fee+=units(r.feeExact);}
  }
  return {id:g.id,kind,issues:[...new Set(issues)],rows:g.rows,
   outgoing:negative.map(r=>({identity:r.identity,streamId:r.streamId,quantityExact:exact(abs(units(r.amountExact)))})),
   incoming:positive.map(r=>({identity:r.identity,streamId:r.streamId,quantityExact:r.amountExact})),
   movements:[...movements.values()].map(m=>({streamId:m.streamId,asset:m.asset,wallet:m.wallet,subclass:m.subclass,amountExact:m.known?exact(m.amount):null,feeExact:m.known?exact(m.fee):null,deltaExact:m.known?exact(m.amount-m.fee):null})),
   payloadDigest:digest(g.rows.map(r=>[r.identity,r.payloadDigest]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))))};
 });
 return {kind:'kraken-source-plan',version:1,writeEnabled:false,ready:false,groups:result,observations:rows,repeated,conflicts:conflicts.size};
}
