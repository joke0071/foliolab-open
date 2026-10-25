/** Documentary provenance only. Never posts buys, cashflows or quantity deltas. */
import {parseCSV} from './csv-import.js';
import {sourceDigest} from './import-identity.js';
import {units,exact} from './decimal.js';
import {validateHistorySession} from './wallet-history-state.js';
const fail=()=>{throw Error('Kaufbeleg ungültig. EUR, UTC-Zeitpunkt, TxID und Gebühren/Mengen prüfen.');};
const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const text=v=>{if(typeof v!=='string'||!v||v.length>300||/[\u0000-\u001f]/.test(v))fail();return v;};
const utc=v=>{if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString()!==v.replace(/Z$/,v.includes('.')?'Z':'.000Z'))fail();return new Date(v).toISOString();};
function decimal(v,places,positive){
 if(typeof v!=='string'||v.length>40||!new RegExp('^\\d{1,12}(?:\\.\\d{1,'+places+'})?$').test(v))fail();
 const n=units(v);if(positive?n<=0n:n<0n)fail();return exact(n);
}
export function validatePurchaseReceipt(v){
 if(!v||v.provider!=='bittr'||v.currency!=='EUR'||!hash(v.txid))fail();
 const r={provider:'bittr',currency:'EUR',timestamp:utc(v.timestamp),txid:v.txid,
  fiatEUR:decimal(v.fiatEUR,2,true),serviceFeeEUR:decimal(v.serviceFeeEUR,2,false),
  grossBTC:decimal(v.grossBTC,8,true),miningFeeBTC:decimal(v.miningFeeBTC,8,false),netBTC:decimal(v.netBTC,8,true)};
 if(units(r.grossBTC)-units(r.miningFeeBTC)!==units(r.netBTC)||units(r.serviceFeeEUR)>units(r.fiatEUR))fail();
 const id=sourceDigest(JSON.stringify(r));if(v.id!==undefined&&v.id!==id)fail();return {id,...r};
}
/** Strictly projects an allowlist: IBAN, From, Deposit Code and Current Value never leave preview parsing. */
export function parseBittrEvidence(input){
 if(typeof input!=='string'||new TextEncoder().encode(input).length>2e6)fail();
 const parsed=parseCSV(input),fields=['Currency','Fiat Amount','Bittr Fee','Bitcoin Purchased','Mining Fee','Bitcoin Amount','Bitcoin Transaction ID','Timestamp'];
 if(fields.some(k=>!parsed.headers.includes(k)))throw Error('Bittr-CSV: benötigte Spalten fehlen.');
 const receipts=[],seen=new Set();let duplicates=0;
 for(const row of parsed.rows){
  // Bittr exports an explicitly UTC timestamp with a space instead of ISO's T.
  const timestamp=row.Timestamp.replace(/^(\d{4}-\d\d-\d\d) (\d\d:\d\d:\d\dZ)$/, '$1T$2');
  const r=validatePurchaseReceipt({provider:'bittr',currency:row.Currency,timestamp,txid:row['Bitcoin Transaction ID'].toLowerCase(),fiatEUR:row['Fiat Amount'],serviceFeeEUR:row['Bittr Fee'],grossBTC:row['Bitcoin Purchased'],miningFeeBTC:row['Mining Fee'],netBTC:row['Bitcoin Amount']});
  if(seen.has(r.id)){duplicates++;continue;}seen.add(r.id);receipts.push(r);
 }
 return {receipts,duplicates};
}
export const emptyPurchaseEvidence=()=>({schema:1,receipts:[],decisions:[]});
export function validatePurchaseEvidence(value){
 if(!value||value.schema!==1||!Array.isArray(value.receipts)||value.receipts.length>5000||!Array.isArray(value.decisions)||value.decisions.length>10000)fail();
 const receipts=value.receipts.map(validatePurchaseReceipt),ids=new Set(receipts.map(r=>r.id));if(ids.size!==receipts.length)fail();
 const decisions=value.decisions.map(v=>{
  if(!v||!['link','unlink'].includes(v.action)||!Array.isArray(v.receiptIds)||!v.receiptIds.length||v.receiptIds.length>5000||v.receiptIds.some(id=>!ids.has(id))||new Set(v.receiptIds).size!==v.receiptIds.length||!Array.isArray(v.events)||v.events.length>5000)fail();
  const events=v.events.map(e=>{if(!hash(e.fingerprint)||typeof e.id!=='string'||!e.id||e.id.length>16384)fail();return {id:e.id,fingerprint:e.fingerprint};});
  if(v.action==='link'&&(!events.length||new Set(events.map(e=>e.id)).size!==events.length))fail();
  return {action:v.action,walletKey:text(v.walletKey),sessionId:text(v.sessionId),at:utc(v.at),receiptIds:[...v.receiptIds],events};
 });
 const active=new Map();
 for(const d of decisions){
  if(d.action==='link'){
   if(d.receiptIds.some(id=>active.has(id))||[...active.values()].some(old=>old.events.some(e=>d.events.some(ref=>ref.id===e.id))))fail();
   for(const id of d.receiptIds)active.set(id,d);
  }else{
   const old=active.get(d.receiptIds[0]);
   if(!old||d.events.length||old.sessionId!==d.sessionId||old.walletKey!==d.walletKey||JSON.stringify([...old.receiptIds].sort())!==JSON.stringify([...d.receiptIds].sort()))fail();
   for(const id of d.receiptIds)active.delete(id);
  }
 }
 const result={schema:1,receipts,decisions};if(new TextEncoder().encode(JSON.stringify(result)).length>3e6)throw Error('Kaufbelege überschreiten das sichere Speicherlimit.');return result;
}
const fingerprint=e=>sourceDigest(JSON.stringify([e.id,e.blockHash,e.blockHeight,e.timestamp,e.quantityBaseUnits,e.status,e.finality,e.type,e.coverage]));
function eligible(session,accountId){
 const s=validateHistorySession(session);
 if(s.chain!=='btc')throw Error('Bitcoin-Historie erforderlich.');
 return s.events.filter(e=>e.accountId===accountId&&e.network==='bitcoin'&&e.chainId==='mainnet'&&e.assetId==='bitcoin'&&e.decimals===8&&e.type==='incoming'&&e.locator.kind==='vout'&&e.status==='confirmed'&&e.finality==='confirmed'&&e.coverage==='verified'&&e.blockHash&&e.timestamp&&BigInt(e.quantityBaseUnits)>0n&&s.streams.some(t=>t.accountId===e.accountId&&t.assetId==='bitcoin'&&t.coverage.status==='verified'));
}
export function activePurchaseLinks(state){
 const active=new Map();for(const d of state.decisions){for(const id of d.receiptIds)active.delete(id);if(d.action==='link')for(const id of d.receiptIds)active.set(id,d);}return active;
}
/** Group by txid, never deduplicate by it. Whole-group exact sums prove N:M and split own outputs. */
export function previewPurchaseEvidence(model,receipts,session,accountId){
 const state=validatePurchaseEvidence(model.purchaseEvidence??emptyPurchaseEvidence()),all=new Map(state.receipts.map(r=>[r.id,r]));
 for(const v of receipts){const r=validatePurchaseReceipt(v);all.set(r.id,r);}
 const links=activePurchaseLinks(state),events=session?eligible(session,accountId):[],groups=new Map();
 for(const r of all.values()){if(!groups.has(r.txid))groups.set(r.txid,[]);groups.get(r.txid).push(r);}
 return [...groups].map(([txid,rs])=>{
  const matched=events.filter(e=>e.txid===txid),needed=rs.reduce((n,r)=>n+units(r.netBTC)/10n**10n,0n),sum=matched.reduce((n,e)=>n+BigInt(e.quantityBaseUnits),0n);
  const existing=rs.map(r=>links.get(r.id)).filter(Boolean);
  const coherent=existing.length===rs.length&&existing.every(d=>d===existing[0])&&existing[0].sessionId===session?.id&&existing[0].walletKey===session?.walletKey&&existing[0].events.every(ref=>events.some(e=>e.id===ref.id&&fingerprint(e)===ref.fingerprint))&&existing[0].receiptIds.length===rs.length;
  let status=existing.length?(coherent?'linked':'conflict'):matched.length?(needed===sum?'exact':'conflict'):'unmatched';
  let candidates=matched;
  if(!existing.length&&!matched.length){
   candidates=events.filter(e=>BigInt(e.quantityBaseUnits)===needed&&rs.every(r=>Math.abs(Date.parse(e.timestamp)-Date.parse(r.timestamp))<=7*864e5));
   status=candidates.length===1?'proposal':candidates.length>1?'ambiguous':'unmatched';
  }
  return {txid,receipts:rs,status,linkedReceiptIds:rs.filter(r=>links.has(r.id)).map(r=>r.id),events:candidates,netBTC:exact(needed*10n**10n),fiatEUR:exact(rs.reduce((n,r)=>n+units(r.fiatEUR),0n))};
 });
}
/** Explicit confirmation; caller uses existing canonical revision/CAS commit. No storage here. */
export function confirmPurchaseEvidence(model,{receipts,receiptIds=[],eventIds=[],session,accountId,confirmed=false,at=new Date().toISOString()}){
 if(!confirmed)throw Error('Bitte Kaufbelege und Zuordnung ausdrücklich bestätigen.');
 const state=validatePurchaseEvidence(model.purchaseEvidence??emptyPurchaseEvidence()),all=new Map(state.receipts.map(r=>[r.id,r]));
 for(const v of receipts){const r=validatePurchaseReceipt(v);all.set(r.id,r);}state.receipts=[...all.values()];
 if(receiptIds.length||eventIds.length){
  if(new Set(receiptIds).size!==receiptIds.length||new Set(eventIds).size!==eventIds.length||!receiptIds.length||!eventIds.length)fail();
  const chosen=receiptIds.map(id=>all.get(id));if(chosen.some(r=>!r))fail();
  const s=validateHistorySession(session),stored=model.walletHistory?.sessions.find(x=>x.id===s.id);
  if(!stored||JSON.stringify(validateHistorySession(stored))!==JSON.stringify(s))throw Error('Zuerst aktuelle Wallet-Historie übernehmen.');
  const pool=eligible(s,accountId),events=eventIds.map(id=>pool.find(e=>e.id===id));
  if(events.some(e=>!e)||chosen.reduce((n,r)=>n+units(r.netBTC)/10n**10n,0n)!==events.reduce((n,e)=>n+BigInt(e.quantityBaseUnits),0n))throw Error('Eigene bestätigte Empfangsmengen stimmen nicht exakt überein.');
  const active=activePurchaseLinks(state);
  if([...active.entries()].some(([id,d])=>receiptIds.includes(id)||d.events.some(e=>eventIds.includes(e.id))))throw Error('Beleg oder Empfang bereits zugeordnet. Erst Zuordnung lösen.');
  // Never override a known differing txid with a time/amount heuristic.
  if(chosen.some(r=>pool.some(e=>e.txid===r.txid)&&!events.some(e=>e.txid===r.txid)))throw Error('Bekannte TxID widerspricht der Auswahl.');
  state.decisions.push({action:'link',walletKey:s.walletKey,sessionId:s.id,at,receiptIds,events:events.map(e=>({id:e.id,fingerprint:fingerprint(e)}))});
 }
 return {...model,purchaseEvidence:validatePurchaseEvidence(state)};
}
export function unlinkPurchaseEvidence(model,receiptId,at=new Date().toISOString()){
 const state=validatePurchaseEvidence(model.purchaseEvidence??emptyPurchaseEvidence()),link=activePurchaseLinks(state).get(receiptId);
 if(!link)throw Error('Keine bestätigte Zuordnung vorhanden.');
 state.decisions.push({...link,action:'unlink',at,events:[]});return {...model,purchaseEvidence:validatePurchaseEvidence(state)};
}
