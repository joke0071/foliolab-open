/** UH02: economic backfill into the existing journal. Scanned quantities stay authoritative. */
import {parseCSV} from './csv-import.js';
import {parseBittrEvidence,validatePurchaseEvidence,emptyPurchaseEvidence,previewPurchaseEvidence,confirmPurchaseEvidence} from './purchase-evidence.js';
import {looksLikeLedgerLiveCSV,parseLedgerLiveCSV} from './ledger-live.js';
import {validateHistorySession,bitcoinHistoryScope} from './wallet-history-state.js';
import {replayWalletHistory} from './wallet-history-core.js';
import {sourceDigest,bookingOwnership,sourceUnmodified} from './import-identity.js';
import {units,exact} from './decimal.js';
import {validateJournalEntry,nextJournalSequence,ledgerQuantityAudit} from './transactions.js';
const PREFIX='uh02:';
export const hasUnifiedBitcoinState=model=>Boolean(model?.purchaseEvidence?.bitcoinLedger?.length||(model?.journalEntries||[]).some(j=>j.source==='unified-bitcoin'||j.id?.startsWith(PREFIX))||(model?.bookings||[]).some(b=>b.importSource?.sourceId==='unified-bitcoin-v1'||b.id?.startsWith(PREFIX)));
const key=(p,txid)=>PREFIX+sourceDigest(JSON.stringify(['bitcoin','mainnet',p.id,txid]));
const digest=value=>sourceDigest(JSON.stringify(value));
const fingerprint=e=>digest([e.id,e.blockHash,e.blockHeight,e.timestamp,e.quantityBaseUnits,e.status,e.finality,e.type,e.coverage]);
const facts=group=>({receipts:group.receipts.map(r=>r.id).sort(),events:group.events.map(e=>({id:e.id,fingerprint:fingerprint(e)})).sort((a,b)=>a.id.localeCompare(b.id))});
export function readUnifiedBitcoinFiles(inputs){
 if(!Array.isArray(inputs)||!inputs.length||inputs.length>20)throw Error('Bitte 1 bis 20 Bittr-/Ledger-Dateien auswählen.');
 const receipts=new Map(),operations=new Map();let duplicateReceipts=0;
 for(const input of inputs){
  if(typeof input!=='string'||new TextEncoder().encode(input).length>2e6)throw Error('Je CSV höchstens 2 MB.');
  const csv=parseCSV(input);
  if(csv.headers.includes('Bitcoin Transaction ID')){
   const parsed=parseBittrEvidence(input);duplicateReceipts+=parsed.duplicates;
   for(const r of parsed.receipts){if(receipts.has(r.id))duplicateReceipts++;receipts.set(r.id,r);}
  }else if(looksLikeLedgerLiveCSV(csv)){
   const document=parseLedgerLiveCSV(input);
   for(const row of document.operations)operations.set(row.observationId,row);
  }else throw Error('Gemeinsamer Bitcoin-Import: nur erkannte Bittr-/Ledger-Live-Originalformate.');
 }
 if(receipts.size>1000||operations.size>5000)throw Error('Bitcoin-Import zu groß.');
 return {receipts:[...receipts.values()],operations:[...operations.values()],duplicateReceipts};
}
function scope(model,positionId){
 const p=model.positions.find(p=>p.id===positionId);
 if(!p?.wallet?.enabled||!['btc','btc-hd'].includes(p.wallet.chain)||p.kind!=='crypto'||p.coinId!=='bitcoin')throw Error('Eine konfigurierte Bitcoin-Wallet auswählen.');
 // No inferred ownership across overlapping HD/single-address wallets or unrelated accounts.
 if(model.positions.filter(x=>x.wallet?.enabled&&['btc','btc-hd'].includes(x.wallet.chain)).length!==1)throw Error('Mehrere Bitcoin-Wallets: übergreifenden Eigentumsabgleich zuerst klären.');
 const candidates=(model.walletHistory?.sessions||[]).filter(s=>s.walletKey===p.id&&s.chain==='btc');
 if(candidates.length!==1)throw Error('Zuerst die Bitcoin-Historie abrufen und übernehmen.');
 const session=validateHistorySession(candidates[0]);
 if(session.walletScopeDigest!==bitcoinHistoryScope(p.wallet))throw Error('Walletkonfiguration geändert oder alter Historiennachweis ohne Eigentumsbindung. Bitcoin-Historie neu abrufen und übernehmen.');
 if(session.streams.length!==1||session.streams[0].accountId!==p.accountId||session.streams[0].coverage.status!=='verified'||session.events.some(e=>e.accountId!==p.accountId||e.status!=='confirmed'||e.finality!=='confirmed'||e.coverage!=='verified'))throw Error('Vollständig bestätigte, eindeutige Wallet-Historie erforderlich.');
 const replay=replayWalletHistory({events:session.events,streams:session.streams}),balance=replay.balances[0];
 if(balance?.quantityBaseUnits==null||BigInt(balance.quantityBaseUnits)*10n**10n!==units(p.quantityExact??p.quantity))throw Error('Historie und gescannter aktueller Walletbestand stimmen nicht exakt überein. Wallet und Historie erneut prüfen.');
 if(model.bookings.some(b=>b.positionId===p.id&&!b.id.startsWith(PREFIX))||model.journalEntries.some(j=>j.postings.some(x=>x.positionId===p.id)&&j.source!=='unified-bitcoin'))throw Error('Bereits vorhandene Walletbuchungen zuerst fachlich abgleichen.');
 if(model.openingPositions.some(o=>o.positionId===p.id&&o.asOf!==null))throw Error('Datierten Wallet-Eröffnungsbestand zuerst fachlich abgleichen.');
 if(!ledgerQuantityAudit(model).ok)throw Error('Bestehendes Journal stimmt nicht mit den Beständen überein.');
 return {p,session};
}
/** Pure preview: each group is all own verified vouts for a tx, never a txid-wide dedupe. */
export function previewUnifiedBitcoin(model,input,positionId){
 const {p,session}=scope(model,positionId),state=validatePurchaseEvidence(model.purchaseEvidence??emptyPurchaseEvidence());
 const ownerDigest=sourceDigest(p.wallet.address),observations=new Map((state.bitcoinLedger||[]).filter(r=>r.ownerDigest===ownerDigest).map(r=>[r.id,r]));
 const ledger=(input.operations||[]).filter(r=>r.currency==='BTC'&&r.accountIdentity===p.wallet.address&&r.type==='IN'&&r.status==='Confirmed'&&!r.issues.length);
 const excluded=(input.operations||[]).length-ledger.length;
 for(const row of ledger){
  const events=session.events.filter(e=>e.txid===row.txid.toLowerCase()&&e.accountId===p.accountId&&e.type==='incoming'&&e.locator.kind==='vout');
  const received=events.reduce((n,e)=>n+BigInt(e.quantityBaseUnits),0n);
  if(!events.length||received*10n**10n!==units(row.amountExact))throw Error('Ledger-BTC-Eingang ohne exakt verifizierte eigene vout-Zuordnung.');
  const observation={id:row.observationId,ownerDigest,txid:row.txid.toLowerCase(),timestamp:row.timestamp,amountBTC:row.amountExact,events:events.map(e=>({id:e.id,fingerprint:fingerprint(e)})).sort((a,b)=>a.id.localeCompare(b.id))};
  const old=observations.get(observation.id);if(old&&digest(old)!==digest(observation))throw Error('Gespeicherter Ledger-Nachweis widerspricht dem aktuellen Blockchain-Beleg.');
  observations.set(observation.id,observation);
 }
 for(const row of observations.values())if(row.events.some(ref=>!session.events.some(e=>e.id===ref.id&&fingerprint(e)===ref.fingerprint)))throw Error('Ledger-Nachweis nach Historienänderung erneut prüfen.');
 const groups=previewPurchaseEvidence(model,input.receipts||[],session,p.accountId).map(g=>{
  const id=key(p,g.txid),existing=model.bookings.find(b=>b.id===id),record=model.journalEntries.find(j=>j.id===id),f=facts(g);
  const references=[...observations.values()].filter(r=>r.txid===g.txid).map(r=>r.id).sort();
  let status=(g.status==='exact'||g.status==='linked')&&new Set(g.receipts.map(r=>r.timestamp.slice(0,10))).size===1?'new':'blocked';
  if(record?.type==='uh02-undo')status='removed';
  else if(existing){
   let payload;try{payload=JSON.parse(existing.importSource.sourcePayload);}catch{}
   status=sourceUnmodified(model,existing)&&digest(payload?.facts)===digest(f)?'existing':'blocked';
  }else if(record)status='blocked';
  return {...g,id,facts:f,ledgerRefs:references,status};
 });
 if(groups.length>1000)throw Error('Zu viele Kaufgruppen.');
 return {positionId,groups,excluded,ledgerCount:ledger.length,observations:[...observations.values()],unknownIncoming:session.events.filter(e=>e.type==='incoming'&&!groups.some(g=>g.events.some(x=>x.id===e.id))).length,
  newCount:groups.filter(g=>g.status==='new').length,blocked:groups.filter(g=>g.status==='blocked').length,
  fiatEUR:exact(groups.filter(g=>g.status==='new').reduce((n,g)=>n+units(g.fiatEUR),0n)),baseline:digest(model),receiptCount:state.receipts.length};
}
function entryFor(p,g,at,sequence){
 const total=g.receipts.reduce((n,r)=>n+units(r.fiatEUR),0n),fee=g.receipts.reduce((n,r)=>n+units(r.serviceFeeEUR),0n);
 const post=(role,amount,position=null)=>({id:g.id+':'+role,role,positionId:position?.id??null,accountId:position?.accountId??null,quantityDeltaExact:null,amountBookEURExact:exact(amount)});
 // Quantities are already included in the wallet scan/opening. Never replay the acquisition over them.
 return validateJournalEntry({id:g.id,type:'buy',date:g.receipts.map(r=>r.timestamp.slice(0,10)).sort()[0],recordedAt:at,sequence,source:'unified-bitcoin',status:'scan-reflected-acquisition',cashPositionId:null,
  postings:[post('asset',total-fee,p),post('fee',fee),post('external-clearing',-total)]});
}
/** One draft, one caller-owned canonical CAS commit. No storage/network side effects. */
export function confirmUnifiedBitcoin(model,input,positionId,{baseline,confirmed=false,externalFunding=false,bitcoinOnly=false,at=new Date().toISOString()}={}){
 if(!confirmed||!externalFunding)throw Error('Käufe und Finanzierung außerhalb aller erfassten Konten ausdrücklich bestätigen.');
 const plan=previewUnifiedBitcoin(model,input,positionId);
 if(plan.baseline!==baseline)throw Error('Datenstand geändert. Import erneut prüfen.');
 if(plan.blocked)throw Error('Ungeklärte Kaufgruppen verhindern die gemeinsame Übernahme.');
 if(plan.excluded&&!bitcoinOnly)throw Error('Nicht zugeordnete Ledger-Bereiche ausdrücklich ausschließen.');
 const {p,session}=scope(model,positionId);let draft=structuredClone(model);
 if(plan.observations.length){const state=validatePurchaseEvidence(draft.purchaseEvidence??emptyPurchaseEvidence()),all=new Map((state.bitcoinLedger||[]).map(r=>[r.id,r]));for(const r of plan.observations)all.set(r.id,r);draft.purchaseEvidence=validatePurchaseEvidence({...state,bitcoinLedger:[...all.values()]});}

 for(const g of plan.groups){
  if(g.status==='removed')continue;
  if(g.status==='new'){
   draft=confirmPurchaseEvidence(draft,{receipts:g.receipts,confirmed:true});
   const active=previewPurchaseEvidence(draft,[],session,p.accountId).find(x=>x.txid===g.txid);
   if(active.status==='exact')draft=confirmPurchaseEvidence(draft,{receipts:[],receiptIds:g.receipts.map(r=>r.id),eventIds:g.events.map(e=>e.id),session,accountId:p.accountId,confirmed:true,at});
   const entry=entryFor(p,g,at,nextJournalSequence(draft));draft.journalEntries.push(entry);
   const fee=g.receipts.reduce((n,r)=>n+units(r.serviceFeeEUR),0n),net=units(g.netBTC),trade=units(g.fiatEUR)-fee;
   const b={id:g.id,journalEntryId:g.id,type:'buy',date:entry.date,positionId:p.id,accountId:p.accountId,positionName:p.name,quantity:Number(g.netBTC),quantityExact:g.netBTC,unitPrice:null,feeEUR:Number(exact(fee)),taxEUR:0,fxRate:1,amountEUR:Number(exact(trade)),amountExactEUR:exact(trade),external:false,costsVerified:false,notes:'Bittr-Kauf; BTC bereits im Walletbestand. Aktuelle Restkostenbasis unbekannt.'};
   b.importSource={version:1,sourceId:'unified-bitcoin-v1',accountId:p.accountId,externalId:g.id,sourcePayload:JSON.stringify({walletScopeDigest:bitcoinHistoryScope(p.wallet),facts:g.facts,ledgerRefs:g.ledgerRefs}),ownedSnapshot:bookingOwnership(draft,b),fileId:'native-bittr',occurrence:1,ownership:'imported'};
   if(b.importSource.sourcePayload.length>4000)throw Error('Kaufgruppe überschreitet das sichere Herkunftslimit.');
   draft.bookings.unshift(b);
   draft.externalCashFlows.push({id:g.id,date:b.date,amountEUR:Number(g.fiatEUR),amountExactEUR:g.fiatEUR});
  }else if(g.status==='existing'&&g.ledgerRefs.length){
   const b=draft.bookings.find(b=>b.id===g.id),payload=JSON.parse(b.importSource.sourcePayload);
   payload.ledgerRefs=[...new Set([...payload.ledgerRefs,...g.ledgerRefs])].sort();b.importSource.sourcePayload=JSON.stringify(payload);
   if(b.importSource.sourcePayload.length>4000)throw Error('Zu viele zusätzliche Ledger-Belege.');
  }
 }
 if(hasUnifiedBitcoinState(draft))draft.version=5;
 if(JSON.stringify(draft)===JSON.stringify(model))return model;
 validateUnifiedBitcoinEconomics(draft);
 if(!ledgerQuantityAudit(draft).ok)throw Error('Bestandsabgleich fehlgeschlagen.');
 return draft;
}
/** Selective economic undo retains receipt/history evidence and a permanent reimport tombstone. */
export function undoUnifiedBitcoin(model,id,{confirmed=false,baseline,at=new Date().toISOString()}={}){
 if(!confirmed||baseline!==digest(model))throw Error('Rücknahme erneut prüfen und bestätigen.');
 const b=model.bookings.find(b=>b.id===id),j=model.journalEntries.find(j=>j.id===id);
 if(!id.startsWith(PREFIX)||!b||j?.source!=='unified-bitcoin'||!sourceUnmodified(model,b))throw Error('Kauf wurde geändert oder ist nicht sicher rücknehmbar.');
 const targets=[id,...j.postings.map(p=>p.id)],references=value=>typeof value==='string'?targets.some(id=>value.includes(id)):value&&typeof value==='object'?Object.entries(value).some(([k,v])=>targets.includes(k)||references(v)):false;
 const rest={...model,bookings:model.bookings.filter(x=>x.id!==id),journalEntries:model.journalEntries.filter(x=>x.id!==id),externalCashFlows:model.externalCashFlows.filter(x=>x.id!==id),bookingPresentation:undefined};
 if(references(rest))throw Error('Abhängige Nachweise verhindern die isolierte Rücknahme.');
 const draft=structuredClone(model);draft.bookings=draft.bookings.filter(x=>x.id!==id);draft.externalCashFlows=draft.externalCashFlows.filter(x=>x.id!==id);
 draft.journalEntries=draft.journalEntries.filter(x=>x.id!==id);
 draft.journalEntries.push(validateJournalEntry({id,type:'uh02-undo',date:at.slice(0,10),recordedAt:at,sequence:nextJournalSequence(draft),source:'unified-bitcoin',status:'removed',postings:[{id:id+':undo',role:'documentation',positionId:null,accountId:null,quantityDeltaExact:null,amountBookEURExact:'0'}]}));
 if(draft.bookingPresentation){draft.bookingPresentation.archivedIds=draft.bookingPresentation.archivedIds.filter(x=>x!==id);if(draft.bookingPresentation.version===1&&!draft.bookingPresentation.archivedIds.length){delete draft.bookingPresentation;draft.version=5;}}
 return draft;
}
/** Validate the economic/source contract on reload/restore, even when optional chain history is omitted. */
export function validateUnifiedBitcoinEconomics(model){
 const entries=model.journalEntries.filter(j=>j.source==='unified-bitcoin'||j.id?.startsWith(PREFIX));
 if(!entries.length){if(model.bookings.some(b=>b.importSource?.sourceId==='unified-bitcoin-v1'||b.id?.startsWith(PREFIX)))throw Error('Bitcoin-Kauf ohne kanonisches Journal.');return;}
 const state=validatePurchaseEvidence(model.purchaseEvidence??emptyPurchaseEvidence());
 for(const j of entries){
  if(j.source!=='unified-bitcoin'||!/^uh02:[a-f0-9]{64}$/.test(j.id))throw Error('Bitcoin-Importherkunft widersprüchlich.');
  const b=model.bookings.find(b=>b.id===j.id),flows=model.externalCashFlows.filter(f=>f.id===j.id);
  if(j.type==='uh02-undo'){
   if(b||flows.length||j.status!=='removed'||j.postings.length!==1||j.postings[0].role!=='documentation'||j.postings[0].positionId!==null||j.postings[0].quantityDeltaExact!==null||units(j.postings[0].amountBookEURExact)!==0n)throw Error('Bitcoin-Rücknahmenachweis widersprüchlich.');
   continue;
  }
  let payload;try{payload=JSON.parse(b?.importSource?.sourcePayload);}catch{}
  const receiptIds=payload?.facts?.receipts,events=payload?.facts?.events;
  if(!b||j.type!=='buy'||b.type!=='buy'||b.journalEntryId!==j.id||j.status!=='scan-reflected-acquisition'||!sourceUnmodified(model,b)||b.importSource.sourceId!=='unified-bitcoin-v1'||!Array.isArray(receiptIds)||!receiptIds.length||new Set(receiptIds).size!==receiptIds.length||!Array.isArray(events)||!events.length||events.some(e=>typeof e.id!=='string'||!e.id||!/^[a-f0-9]{64}$/.test(e.fingerprint))||new Set(events.map(e=>e.id)).size!==events.length||!Array.isArray(payload.ledgerRefs)||new Set(payload.ledgerRefs).size!==payload.ledgerRefs.length||payload.ledgerRefs.some(id=>!state.bitcoinLedger?.some(r=>r.id===id)))throw Error('Bitcoin-Kaufnachweis oder Importherkunft unvollständig.');
  const receipts=receiptIds.map(id=>state.receipts.find(r=>r.id===id)),p=model.positions.find(p=>p.id===b.positionId);
  if(receipts.some(r=>!r)||!p?.wallet?.enabled||!['btc','btc-hd'].includes(p.wallet.chain)||receipts.some(r=>r.txid!==receipts[0].txid)||key(p,receipts[0].txid)!==j.id||b.accountId!==p.accountId||payload.walletScopeDigest!==bitcoinHistoryScope(p.wallet)||b.external!==false||b.costsVerified!==false)throw Error('Bitcoin-Kauf und Walletidentität widersprechen sich.');
  const total=receipts.reduce((n,r)=>n+units(r.fiatEUR),0n),fee=receipts.reduce((n,r)=>n+units(r.serviceFeeEUR),0n),quantity=receipts.reduce((n,r)=>n+units(r.netBTC),0n),expected=entryFor(p,{id:j.id,receipts},j.recordedAt,j.sequence);
  if(JSON.stringify(expected)!==JSON.stringify(j)||units(b.quantityExact)!==quantity||units(b.amountExactEUR)!==total-fee||units(b.feeEUR)!==fee||flows.length!==1||flows[0].date!==b.date||b.date!==j.date||units(flows[0].amountExactEUR)!==total)throw Error('Bitcoin-Kauf, Gebühren und Finanzierung widersprechen sich.');
 }
 for(const b of model.bookings.filter(b=>b.importSource?.sourceId==='unified-bitcoin-v1'||b.id?.startsWith(PREFIX)))if(!entries.some(j=>j.id===b.id&&j.type==='buy'))throw Error('Bitcoin-Kauf ohne kanonisches Journal.');
}
