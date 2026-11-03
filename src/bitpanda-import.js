/** UH03: native source observations orchestrate the existing journal only. */
import {parseBitpandaCSV,canonicalBitpandaType} from './bitpanda-preview.js';
import {sourceDigest,importSourceKey,sourceUnmodified,bookingOwnership,validateImportSource} from './import-identity.js';
import {executeTransaction,ledgerQuantityAudit,validateJournalEntry,nextJournalSequence} from './transactions.js';
import {BITPANDA_SOURCE,bitpandaWithdrawalId,bitpandaWithdrawalDigest,validateBitpandaWithdrawals} from './bitpanda-withdrawal-evidence.js';
import {setArchivePresentation} from './booking-history.js';
import {units,exact,div} from './decimal.js';
import {backup,safeImport} from './model.js';
export {BITPANDA_SOURCE};
const digest=v=>sourceDigest(JSON.stringify(v));
const fail=message=>{throw Error(message);};
const qty=p=>units(p.quantityExact??p.quantity);
export function prepareBitpandaSourcePlan(inputs){
 if(!Array.isArray(inputs)||!inputs.length||inputs.length>20)fail('Bitpanda: 1 bis 20 Dateien erforderlich.');
 const rows=new Map();let total=0,repeated=0;
 for(const input of inputs)for(const row of parseBitpandaCSV(input).rows){
  if(++total>5000)fail('Bitpanda: insgesamt maximal 5.000 Quellzeilen.');
  const v=row.values,reference=v['Transaction ID'],id=digest(['bitpanda-transaction-v1',reference]),payload=digest(v);
  const prior=rows.get(id);
  if(prior){if(prior.payload!==payload)prior.conflict=true;else repeated++;continue;}
  const kind=canonicalBitpandaType(v['Transaction Type']),asset=v['Asset class']==='Fiat'?v.Fiat:v.Asset;
  rows.set(id,{...row,id,payload,kind,asset,conflict:false,
   streamId:v['Asset class']==='Fiat'?digest(['bitpanda-fiat-v1',asset]):digest(['bitpanda-product-v1',v['Asset class'],v['Product ID'],asset]),
   cashStreamId:['buy','sell'].includes(kind)?digest(['bitpanda-fiat-v1',v.Fiat]):null});
 }
 return {groups:[...rows.values()],repeated};
}
function bound(model,key,assignments,asset,kind){
 const p=model.positions.find(p=>p.id===assignments[key]);
 if(!p||p.wallet?.enabled||p.managementSource==='wallet'||p.currency!=='EUR'||p.kind!==kind||kind==='crypto'&&p.symbol!==asset)fail('Quellprodukt ausdrücklich einer passenden manuellen EUR-Position zuordnen.');
 return p;
}
function actionsFor(model,row,assignments,{netConfirmed,feeModes={},externalReferences=[]}){
 const v=row.values,n=row.numbers,kind=row.kind;
 if(row.conflict)fail('Dieselbe Bitpanda-ID enthält widersprüchliche Quellfelder.');
 // Missing optional economic values remain unknown. Malformed values and identifiers block.
 const structural=row.issues.filter(s=>!s.includes('Wert unbekannt')&&!s.startsWith('Tax Fiat fehlt')&&!s.startsWith('Identische ID-Wiederholung')&&!(s.startsWith('Fee asset:')&&n.Fee==='0'));
 if(structural.length)fail(structural.join(' '));
 if(!netConfirmed)fail('Tatsächliche Kontobewegungen und zeitlichen Bezug der Anfangsbestände bestätigen.');
 const cash=v['Asset class']==='Fiat';
 if(!['Cryptocurrency','Fiat'].includes(v['Asset class'])||!cash&&(!v['Product ID']||v['Product ID']==='-'))fail('Assetklasse und Produkt-ID müssen eindeutig belegt sein.');
 const p=bound(model,row.streamId,assignments,row.asset,cash?'cash':'crypto');
 if(cash&&(row.asset!=='EUR'||!['','-','EUR'].includes(v.Asset)))fail('Fiatbewegung benötigt ein ausdrücklich belegtes EUR-Asset.');
 if(cash&&n['Amount Asset']!==null&&n['Amount Fiat']!==n['Amount Asset'])fail('Fiat- und Assetbetrag widersprechen sich.');
 const rawQuantity=cash?n['Amount Fiat']:n['Amount Asset'],quantity=rawQuantity===null?null:units(rawQuantity);
 if(quantity===null||quantity<=0n)fail('Positive exakte Assetmenge erforderlich; keine Vorzeichenannahme.');
 const incoming=v['In/Out']==='incoming',fee=n.Fee===null?null:units(n.Fee),tax=n['Tax Fiat']===null?null:units(n['Tax Fiat']);
 if(fee!==null&&fee<0n||tax!==null&&tax<0n)fail('Negative Gebühren/Steuern zuerst klären.');
 if(tax!==null&&tax!==0n)fail('Ausgewiesene Steuer benötigt einen gesonderten belegten Nettobetragsabgleich.');
 const mode=feeModes[row.id];
 if(fee>0n&&!['included','additional'].includes(mode))fail('Ausgewiesene Gebühr: enthalten oder zusätzlich anhand des Kontoumsatzes bestätigen.');
 const actions=[],add=(type,q,more={})=>actions.push({type,date:new Date(v.Timestamp).toISOString().slice(0,10),positionId:p.id,quantity:exact(q),unitPrice:cash?'1':'0',feeEUR:'0',taxEUR:'0',fxRate:'1',notes:'Bitpanda '+kind+'. Gebühren/Steuern und Kostenbasis soweit unbekannt ungeprüft.',...more});
 if(['buy','sell'].includes(kind)){
  if(cash||v.Fiat!=='EUR'||kind==='buy'&&incoming||kind==='sell'&&!incoming)fail('Handelsrichtung oder EUR-Kryptohandel nicht eindeutig belegt.');
  const c=bound(model,row.cashStreamId,assignments,'EUR','cash'),total=n['Amount Fiat']===null?null:units(n['Amount Fiat']);
  if(c.providerId!==p.providerId||total===null||total<=0n)fail('Positiver tatsächlicher EUR-Kontoumsatz und gleicher Anbieter erforderlich.');
  if(fee>0n&&v['Fee asset']!=='EUR')fail('Handelsgebühr in anderem Asset benötigt gesonderten Mehrbeinabgleich.');
  const charge=fee??0n,trade=mode==='included'?total+(kind==='buy'?-charge:charge):total;
  if(trade<=0n)fail('Gebühr übersteigt den belegten Handelsbetrag.');
  add(kind,quantity,{cashPositionId:c.id,tradeAmountEURExact:exact(trade),unitPrice:exact(div(trade,quantity)),feeEUR:exact(charge)});
 }else if(kind==='reward'){
  if(cash||!incoming)fail('Reward benötigt eine eingehende Kryptomenge.');
  if(fee>0n&&v['Fee asset']!==v.Asset)fail('Rewardgebühr in anderem Asset gesondert abgleichen.');
  add('reward',quantity+(mode==='included'?(fee??0n):0n));
 }else if(['deposit','withdrawal'].includes(kind)){
  if((kind==='deposit')!==incoming)fail('Richtung widerspricht Ein-/Ausgang.');
  if(!externalReferences.includes(row.id))fail('Gegenbereich ausdrücklich außerhalb aller erfassten Konten und Wallets bestätigen oder starken internen Gegenbeleg klären.');
  if(fee>0n&&v['Fee asset']!==row.asset)fail('Gebührenasset benötigt gesonderten Mehrbeinabgleich.');
  const principal=quantity+(mode==='included'?(incoming?1n:-1n)*(fee??0n):0n);
  if(principal<=0n)fail('Gebühr übersteigt die belegte Bewegung.');
  add(cash?(incoming?'deposit':'withdraw'):(incoming?'deliver_in':'deliver_out'),principal);
 }else fail('Transfer-/Staking-Hauptbetrag oder Sonderfall benötigt einen belegten Gegenbereich; kein neuer Ertrag.');
 if(fee>0n&&!['buy','sell'].includes(kind))add('fee',fee,{notes:'Bitpanda-Gebühr in '+v.Asset+'. Kein zusätzlich erfundener EUR-Wert.'});
 return actions;
}
/** Pure detached draft. An unresolved selected row prevents the enclosing atomic commit. */
export function previewBitpandaImport(model,inputs,assignments,options={}){
 const {selectedGroups=null,expectedClosing={},openingConfirmed=false}=options,baseline=JSON.stringify(model),source=prepareBitpandaSourcePlan(inputs);
 if(!assignments||typeof assignments!=='object'||Array.isArray(assignments))fail('Explizite Bitpanda-Zuordnung erforderlich.');
 const ids=new Set(source.groups.map(g=>g.id));
 if(selectedGroups!==null&&(!Array.isArray(selectedGroups)||new Set(selectedGroups).size!==selectedGroups.length||selectedGroups.some(id=>!ids.has(id))))fail('Bitpanda-Auswahl ist veraltet oder doppelt.');
 if(options.externalReferences!==undefined&&(!Array.isArray(options.externalReferences)||options.externalReferences.some(id=>!ids.has(id))))fail('Externe Gegenbereiche sind veraltet.');
 const selected=source.groups.filter(g=>selectedGroups===null||selectedGroups.includes(g.id)).sort((a,b)=>Date.parse(a.values.Timestamp)-Date.parse(b.values.Timestamp)||a.id.localeCompare(b.id));
 const used=new Map(),providers=new Set();
 for(const row of source.groups)for(const key of [row.streamId,row.cashStreamId].filter(Boolean)){
  const id=assignments[key];if(!id)continue;
  if(used.has(id)&&used.get(id)!==key)fail('Verschiedene Quellprodukte dürfen nicht dieselbe Position verwenden.');
  used.set(id,key);const p=model.positions.find(p=>p.id===id);if(p)providers.add(p.providerId);
 }
 if(providers.size>1)fail('Bitpanda-Quellprodukte müssen zum selben Anbieter gehören.');
 const draft=structuredClone(model),groups=[],issues=[],touched=new Set();let ready=0,duplicates=0;
 for(const row of selected){try{
  if(draft.journalEntries.some(j=>j.id===bitpandaWithdrawalId(row.id)))fail('Dieser Bitpanda-Vorgang wurde dauerhaft zurückgenommen. Kein automatischer Wiederimport.');
  const actions=actionsFor(draft,row,assignments,options),bindings=[...new Set([row.streamId,row.cashStreamId].filter(Boolean))].map(k=>[k,assignments[k]]).sort((a,b)=>a[0].localeCompare(b[0]));
  const origins=actions.map((a,i)=>({version:1,sourceId:BITPANDA_SOURCE,accountId:draft.positions.find(p=>p.id===a.positionId).accountId,externalId:row.id+':'+i,fileId:row.id,occurrence:1,ownership:'imported',ownedSnapshot:'',sourcePayload:JSON.stringify({source:row.payload,bindings,feeMode:options.feeModes?.[row.id]??null,netConfirmed:true,external:options.externalReferences?.includes(row.id)??false,action:a})}));
  const prior=draft.bookings.filter(b=>b.importSource?.sourceId===BITPANDA_SOURCE&&b.importSource.fileId===row.id);
  if(prior.length){
   if(prior.length!==origins.length||origins.some(o=>{const matches=prior.filter(b=>importSourceKey(b.importSource)===importSourceKey(o));return matches.length!==1||matches[0].importSource.sourcePayload!==o.sourcePayload||!sourceUnmodified(draft,matches[0]);}))fail('Vorhandener Bitpanda-Vorgang ist geändert, unvollständig oder widersprüchlich.');
   duplicates++;groups.push({id:row.id,status:'existing',actions});continue;
  }
  if(draft.journalEntries.some(j=>j.source===BITPANDA_SOURCE&&j.id.startsWith('uh03bp:'+row.id+':')))fail('Quellbuchung fehlt zum vorhandenen Journal; keine Wiederbelebung.');
  const affected=new Set(actions.flatMap(a=>[a.positionId,a.cashPositionId].filter(Boolean)));
  for(const id of affected){
   const p=draft.positions.find(p=>p.id===id),opening=draft.openingPositions.find(o=>o.positionId===id);
   if(!openingConfirmed)fail('Geprüfte Anfangsbestände vor den neuen Vorgängen ausdrücklich bestätigen.');
   if(opening?.asOf&&opening.asOf>actions[0].date)fail('Datierter Anfangsbestand liegt nach dem Quellenereignis.');
   if(p.kind==='crypto'&&[p.costBasisExact,p.costBasisEUR,p.realizedPnLExact,p.realizedPnLEUR,opening?.costBasisExact,opening?.realizedPnLExact].some(v=>v!=null))fail('Vorhandene bestätigte Kostenbasis bleibt geschützt.');
   if(draft.bookings.some(b=>b.importSource?.sourceId!==BITPANDA_SOURCE&&[b.positionId,b.cashPositionId,b.targetPositionId].includes(id)))fail('Andere oder manuelle Buchungen benötigen zuerst einen ausdrücklichen Quellenabgleich.');
  }
  const candidate=structuredClone(draft);
  for(const [i,action]of actions.entries()){
   const b=executeTransaction(candidate,{...action,id:'uh03bp:'+row.id+':'+i});candidate.journalEntries.find(j=>j.id===b.journalEntryId).source=BITPANDA_SOURCE;
   b.costsVerified=false;b.taxEUR=null;if(row.numbers.Fee===null)b.feeEUR=null;
   if(!['buy','sell'].includes(action.type)&&candidate.positions.find(p=>p.id===action.positionId).kind==='crypto'){b.amountEUR=null;b.amountExactEUR=null;b.unitPrice=null;}
   for(const id of affected){const p=candidate.positions.find(p=>p.id===id);if(p.kind==='crypto'){p.costBasisExact=null;p.costBasisEUR=null;p.realizedPnLExact=null;p.realizedPnLEUR=null;}}
   origins[i].ownedSnapshot=bookingOwnership(candidate,b);b.importSource=validateImportSource(origins[i],b.accountId);
  }
  if(!ledgerQuantityAudit(candidate).ok)fail('Journal und Bestände widersprechen sich.');
  Object.assign(draft,candidate);for(const id of affected)touched.add(id);ready++;groups.push({id:row.id,status:'ready',actions});
 }catch(e){issues.push({id:row.id,message:e.message});groups.push({id:row.id,status:'blocked',message:e.message});}}
 // Bitpanda has no source running balances. A separately checked closing balance is mandatory.
 for(const id of touched){try{if(expectedClosing[id]==null||expectedClosing[id]===''||units(expectedClosing[id])!==qty(draft.positions.find(p=>p.id===id)))fail('Unabhängig belegten Endbestand für jede betroffene Position eingeben und exakt abgleichen.');}catch(e){issues.push({id,message:e.message});}}
 return {baseline,source,groups,issues,ready,duplicates,excluded:source.groups.length-selected.length,simulated:draft};
}
export function confirmBitpandaImport(model,inputs,assignments,{baseline,confirmed=false,partialConfirmed=false,...options}={}){
 if(options.operation==='withdraw')return confirmBitpandaWithdrawal(model,inputs,assignments,{...options,baseline,confirmed,partialConfirmed});
 if(options.operation!==undefined&&options.operation!=='import')fail('Unbekannter Bitpanda-Vorgang.');
 if(!confirmed||baseline!==JSON.stringify(model))fail('Aktuellen Bitpanda-Prüfplan erneut bestätigen.');
 const plan=previewBitpandaImport(model,inputs,assignments,options);
 if(plan.issues.length)fail('Ungeklärte Vorgänge oder Endbestände verhindern die gesamte Auswahl.');
 if(plan.excluded&&!partialConfirmed)fail('Nicht ausgewählte Restvorgänge ausdrücklich offen lassen.');
 if(!plan.ready)return model;
 safeImport(JSON.parse(backup(plan.simulated)));return plan.simulated;
}

/** One complete terminal native group; both control balances are explicit and exact.
 * Bitpanda has no running source balances. These user-supplied controls must come
 * from independent records, never from an invented historical opening balance.
 */
export function previewBitpandaWithdrawal(model,inputs,assignments,options={}){
 const baseline=JSON.stringify(model),{selectedGroups,expectedClosing={},expectedRestored={},controlsConfirmed=false}=options;
 if(!Array.isArray(selectedGroups)||selectedGroups.length!==1)fail('Genau einen vollständigen Bitpanda-Vorgang zur Rücknahme auswählen.');
 if(!controlsConfirmed)fail('Aktuellen Bestand und Bestand nach Rücknahme anhand unabhängiger Belege ausdrücklich bestätigen.');
 safeImport(JSON.parse(backup(model)));validateBitpandaWithdrawals(model);
 const plan=previewBitpandaImport(model,inputs,assignments,options),group=plan.groups[0];
 if(plan.issues.length||group?.status!=='existing'||plan.duplicates!==1)fail('Vollständiger unveränderter Originalvorgang erforderlich. '+(plan.issues[0]?.message||''));
 const id=selectedGroups[0],originals=group.actions.map((_,i)=>{
  const booking=model.bookings.find(b=>b.id==='uh03bp:'+id+':'+i),journal=model.journalEntries.find(j=>j.id===booking?.journalEntryId);
  if(!booking||!journal||journal.id!==booking.id||journal.source!==BITPANDA_SOURCE||!sourceUnmodified(model,booking)||booking.transferMatch)fail('Bitpanda-Vorgang wurde geändert oder ist verknüpft.');
  const knownBooking='id type date positionId accountId positionName quantity quantityExact unitPrice feeEUR taxEUR fxRate fxRateDate fxSource amountEUR amountExactEUR targetPositionId external notes journalEntryId cashPositionId reconciliationStatus targetQuantityExact costsVerified importSource'.split(' '),knownJournal='id type date recordedAt sequence postings cashPositionId status source'.split(' '),knownPosting='id role positionId accountId quantityDeltaExact amountBookEURExact'.split(' ');
  if(Object.keys(booking).some(k=>!knownBooking.includes(k))||Object.keys(journal).some(k=>!knownJournal.includes(k))||journal.postings.some(p=>Object.keys(p).some(k=>!knownPosting.includes(k)))||!Number.isSafeInteger(journal.sequence))fail('Unbekannte Vorgangsfelder oder Journalreihenfolge zuerst abgleichen.');
  return structuredClone({booking,journal,flows:model.externalCashFlows.filter(f=>f.id===booking.id)});
 });
 const ids=new Set(originals.map(o=>o.booking.id)),touched=new Set(originals.flatMap(o=>o.journal.postings.filter(p=>p.quantityDeltaExact!=null).map(p=>p.positionId))),targets=[id,...ids,...originals.flatMap(o=>o.journal.postings.map(p=>p.id))];
 let nodes=0;const references=(v,depth=0)=>{
  if(++nodes>200000||depth>64)fail('Referenzprüfung überschreitet das sichere Prüflimit.');
  return typeof v==='string'?targets.some(id=>v.includes(id)):v&&typeof v==='object'?Object.entries(v).some(([k,v])=>targets.includes(k)||references(v,depth+1)):false;
 };
 const draft=structuredClone(model);
 draft.bookings=draft.bookings.filter(b=>!ids.has(b.id));draft.journalEntries=draft.journalEntries.filter(j=>!ids.has(j.id));draft.externalCashFlows=draft.externalCashFlows.filter(f=>!ids.has(f.id));
 if(references({...draft,bookingPresentation:undefined}))fail('Weitere Quellen oder abhängige Nachweise verhindern die isolierte Rücknahme.');
 const first=Math.min(...originals.map(o=>o.journal.sequence)),date=originals[0].booking.date;
 for(const j of draft.journalEntries.filter(j=>j.postings.some(p=>touched.has(p.positionId)))){
  if(j.source!==BITPANDA_SOURCE||!Number.isSafeInteger(j.sequence)||j.sequence>=first||j.date>date)fail('Spätere oder fremde Buchungen im betroffenen Quellbereich zuerst abgleichen.');
  const b=draft.bookings.find(b=>b.journalEntryId===j.id);if(!b||!sourceUnmodified(draft,b))fail('Frühere Quellbuchungen wurden geändert.');
 }
 const changes=[];
 for(const positionId of touched){
  const p=draft.positions.find(p=>p.id===positionId),opening=draft.openingPositions.find(o=>o.positionId===positionId);
  if(!p||p.wallet?.enabled||p.managementSource==='wallet'||p.currency!=='EUR'||!['cash','crypto'].includes(p.kind)||!opening||opening.asOf&&opening.asOf>date||[p.costBasisExact,p.costBasisEUR,p.realizedPnLExact,p.realizedPnLEUR,opening.costBasisExact,opening.realizedPnLExact].some(v=>v!=null))fail('Wallet, Anfangsbestand oder bestätigte Kosten-/Ergebniswerte bleiben geschützt.');
  const delta=originals.reduce((n,o)=>n+o.journal.postings.filter(p=>p.positionId===positionId&&p.quantityDeltaExact!=null).reduce((n,p)=>n+units(p.quantityDeltaExact),0n),0n),before=qty(p),after=before-delta;
  if(after<0n||expectedClosing[positionId]==null||expectedClosing[positionId]===''||expectedRestored[positionId]==null||expectedRestored[positionId]===''||units(expectedClosing[positionId])!==before||units(expectedRestored[positionId])!==after)fail('Unabhängig belegte aktuelle und rückgenommene Kontrollbestände müssen für jeden betroffenen Bereich exakt übereinstimmen.');
  changes.push({positionId,before:exact(before),after:exact(after),delta:exact(-delta)});p.quantityExact=exact(after);p.quantity=Number(p.quantityExact);
 }
 if(draft.bookingPresentation)setArchivePresentation(draft,{bookingIds:draft.bookingPresentation.archivedIds.filter(id=>!ids.has(id))});
 if(!ledgerQuantityAudit(draft).ok)fail('Rücknahme widerspricht dem vollständigen chronologischen Journal.');
 return {baseline,group:id,originals,changes,simulated:draft,excluded:plan.excluded};
}
export function confirmBitpandaWithdrawal(model,inputs,assignments,{baseline,confirmed=false,partialConfirmed=false,at=new Date().toISOString(),...options}={}){
 if(!confirmed||baseline!==JSON.stringify(model))fail('Aktuelle Bitpanda-Rücknahme erneut prüfen und bestätigen.');
 const plan=previewBitpandaWithdrawal(model,inputs,assignments,options);
 if(plan.excluded&&!partialConfirmed)fail('Nicht ausgewählte Restvorgänge ausdrücklich offen lassen.');
 const draft=plan.simulated,id=bitpandaWithdrawalId(plan.group);
 draft.journalEntries.push(validateJournalEntry({id,type:'bitpanda-undo',date:at.slice(0,10),recordedAt:at,sequence:nextJournalSequence(model),source:BITPANDA_SOURCE,status:'removed',postings:[{id:id+':documentation',role:'documentation',positionId:null,accountId:null,quantityDeltaExact:null,amountBookEURExact:'0'}],bitpandaWithdrawal:{version:1,group:plan.group,originals:plan.originals,checks:plan.changes,digest:bitpandaWithdrawalDigest([plan.originals,plan.changes])}}));
 draft.version=5;validateBitpandaWithdrawals(draft);safeImport(JSON.parse(backup(draft)));return draft;
}
