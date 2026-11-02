/** UH03: orchestration over the existing transaction journal, never a second financial engine. */
import {prepareKrakenSourcePlan} from './kraken-source-plan.js';
import {executeTransaction,ledgerQuantityAudit} from './transactions.js';
import {sourceDigest,sourceUnmodified,bookingOwnership,importSourceKey,validateImportSource} from './import-identity.js';
import {units,exact,div} from './decimal.js';
import {backup,safeImport} from './model.js';
const digest=v=>sourceDigest(JSON.stringify(v));
const sourceId='kraken-uh03-v1';
const unsupported=message=>{throw Error(message);};
const qty=p=>units(p.quantityExact??p.quantity);
const amount=n=>n<0n?-n:n;
function position(model,row,assignments){
 const id=assignments[row.streamId],p=model.positions.find(p=>p.id===id);
 if(!p||p.wallet?.enabled||p.managementSource==='wallet'||!['cash','crypto'].includes(p.kind)||p.currency!=='EUR')unsupported('Jeden Kraken-Asset-/Walletbereich ausdrücklich einer manuellen EUR-Position zuordnen.');
 if(p.kind==='cash'?row.values.asset!=='EUR':p.symbol!==row.values.asset)unsupported('Assetcode und Position widersprechen sich; keine Ticker- oder Netzwerkanahme.');
 return p;
}
function actionsFor(model,group,assignments,{externalReferences=[]}={}){
 if(group.issues.length)unsupported(group.issues.join(' '));
 const rows=[...group.rows].sort((a,b)=>a.identity.localeCompare(b.identity)),positive=rows.filter(r=>units(r.amountExact)>0n),negative=rows.filter(r=>units(r.amountExact)<0n),actions=[];
 const p=row=>position(model,row,assignments);
 const add=(type,row,quantity,more={})=>actions.push({type,date:row.values.time.slice(0,10),positionId:p(row).id,quantity:exact(quantity),unitPrice:p(row).kind==='cash'?'1':'0',feeEUR:'0',taxEUR:'0',fxRate:'1',notes:'Kraken: '+group.kind+'. Kosten-/Steuerbewertung ungeprüft.',...more});
 if(group.kind==='exchange'){
  const incoming=positive[0],outgoing=negative[0],a=p(incoming),b=p(outgoing);
  if(a.kind==='crypto'&&b.kind==='cash'||a.kind==='cash'&&b.kind==='crypto'){
   const buy=a.kind==='crypto',crypto=buy?incoming:outgoing,cash=buy?outgoing:incoming;
   const total=amount(units(cash.amountExact)),quantity=amount(units(crypto.amountExact));
   const eurFee=rows.filter(r=>p(r).kind==='cash').reduce((n,r)=>n+units(r.feeExact),0n);
   add(buy?'buy':'sell',crypto,quantity,{cashPositionId:p(cash).id,unitPrice:exact(div(total,quantity)),tradeAmountEURExact:exact(total),feeEUR:exact(eurFee)});
  }else if(a.kind==='crypto'&&b.kind==='crypto')add('swap',outgoing,-units(outgoing.amountExact),{targetPositionId:a.id,targetQuantity:incoming.amountExact});
  else unsupported('Handelsgruppe benötigt zwei verschiedene belegte Assets.');
 }else if(group.kind==='internal-transfer'){
  if(p(negative[0]).id===p(positive[0]).id)unsupported('Staking-/Spotbereiche müssen getrennt zugeordnet sein; Hauptbetrag nicht als Ertrag zählen.');
  add('transfer',negative[0],-units(negative[0].amountExact),{targetPositionId:p(positive[0]).id});
 }else if(group.kind==='reward')add(p(positive[0]).kind==='cash'?'interest':'reward',positive[0],units(positive[0].amountExact));
 else if(['deposit-review','withdrawal-review'].includes(group.kind)){
  // Ledger IDs are not chain transaction IDs. Never infer internal ownership from amount/time.
  if(!externalReferences.includes(group.id))unsupported('Ein-/Ausgang benötigt einen bestätigten externen Gegenbereich oder einen starken Wallet-Gegenbeleg.');
  const row=positive[0]??negative[0],incoming=positive.length>0,cash=p(row).kind==='cash';
  add(cash?(incoming?'deposit':'withdraw'):(incoming?'deliver_in':'deliver_out'),row,amount(units(row.amountExact)));
 }else unsupported('Ereignisklasse vor Übernahme fachlich klären.');
 for(const row of rows){
  const fee=units(row.feeExact);if(!fee)continue;
  if(group.kind==='exchange'&&p(row).kind==='cash'&&actions[0]?.cashPositionId)continue;
  add('fee',row,fee,{notes:'Kraken-Gebühr in '+row.values.asset+'. Exakte Menge; EUR-Wert und Steuerwirkung unbekannt.'});
 }
 return actions;
}
/** Pure full-batch simulation. No selected group is silently omitted after a failure. */
export function previewKrakenImport(model,inputs,assignments,{selectedGroups=null,externalReferences=[],openingConfirmed=false}={}){
 const baseline=JSON.stringify(model),source=prepareKrakenSourcePlan(inputs),known=new Set(source.groups.map(g=>g.id));
 if(!assignments||typeof assignments!=='object'||Array.isArray(assignments))throw Error('Explizite Kraken-Zuordnung erforderlich.');
 if(selectedGroups!==null&&(!Array.isArray(selectedGroups)||new Set(selectedGroups).size!==selectedGroups.length||selectedGroups.some(id=>!known.has(id))))throw Error('Kraken-Auswahl ist veraltet oder doppelt.');
 if(!Array.isArray(externalReferences)||externalReferences.some(id=>!known.has(id)))throw Error('Bestätigung externer Gegenbereiche ist veraltet.');
 const selected=source.groups.filter(g=>selectedGroups===null||selectedGroups.includes(g.id));
 const draft=structuredClone(model),groups=[],issues=[];let ready=0,duplicates=0;
 const assignedStreams=new Map(),providers=new Set();
 for(const row of source.observations){
  if(!assignments[row.streamId])continue;
  const id=assignments[row.streamId],previous=assignedStreams.get(id);
  if(previous&&previous!==row.streamId)throw Error('Unterschiedliche Kraken-Wallet-/Assetbereiche dürfen nicht dieselbe Position verwenden.');
  assignedStreams.set(id,row.streamId);const assigned=model.positions.find(p=>p.id===id);if(assigned)providers.add(assigned.providerId);
 }
 if(providers.size>1)throw Error('Kraken-Quellbereiche müssen zum selben ausdrücklich gewählten Anbieter gehören.');
 const ordered=[...selected].sort((a,b)=>a.rows[0].values.time.localeCompare(b.rows[0].values.time)||a.id.localeCompare(b.id));
 for(const group of ordered){
  try{
   if(group.rows.length>64)unsupported('Große Referenzgruppe benötigt einen gesonderten vollständigen Beinabgleich.');
   const actions=actionsFor(draft,group,assignments,{externalReferences});
   if(actions.length>24)unsupported('Zu viele abhängige Buchungen in einer einzelnen Referenzgruppe.');
   const payload=digest([group.payloadDigest,group.rows.map(r=>[r.identity,assignments[r.streamId]]).sort((a,b)=>a[0].localeCompare(b[0])),externalReferences.includes(group.id)]);
   const origins=actions.map((action,i)=>({version:1,sourceId,accountId:draft.positions.find(p=>p.id===action.positionId).accountId,externalId:group.id+':'+i,sourcePayload:JSON.stringify({group:group.id,payload,bindings:[...new Map(group.rows.map(r=>[r.streamId,assignments[r.streamId]])).entries()].sort((a,b)=>a[0].localeCompare(b[0])),action}),fileId:group.id,occurrence:1,ownership:'imported',ownedSnapshot:''}));
   const existing=origins.map(origin=>draft.bookings.filter(b=>importSourceKey(b.importSource)===importSourceKey(origin)));
   const priorGroup=draft.bookings.filter(b=>b.importSource?.sourceId===sourceId&&b.importSource.fileId===group.id);
   if(priorGroup.length||existing.some(list=>list.length)){
    if(priorGroup.length!==origins.length)unsupported('Vorhandene Kraken-Gruppe ist unvollständig oder anders zugeordnet.');
    if(existing.some((list,i)=>list.length!==1||list[0].importSource.sourcePayload!==origins[i].sourcePayload||!sourceUnmodified(draft,list[0])))unsupported('Vorhandene Kraken-Gruppe ist unvollständig, geändert oder widersprüchlich.');
    duplicates++;groups.push({id:group.id,status:'existing',actions});continue;
   }
   // Exact source balances guard gaps, ordering and replay over already observed holdings.
   if(draft.journalEntries.some(j=>j.source===sourceId&&j.id.startsWith('uh03:'+group.id+':')))unsupported('Kraken-Journal ohne vollständige Quellbuchungen; keine Wiederbelebung.');
   const expected=new Map();
   for(const row of group.rows){
    const p=position(draft,row,assignments);
    const opening=draft.openingPositions.find(o=>o.positionId===p.id);
    if(opening?.asOf&&opening.asOf>row.values.time.slice(0,10))unsupported('Datierter Anfangsbestand liegt nach diesem Quellenereignis. Kein historisches Aufaddieren.');
    if(opening?.costBasisExact!=null||opening?.realizedPnLExact!=null)unsupported('Bestätigte Kostenbasis im Anfangsbestand bleibt geschützt.');
    const before=expected.has(p.id)?expected.get(p.id):qty(p);
    if(!openingConfirmed&&before!==0n&&!draft.bookings.some(b=>b.importSource?.sourceId===sourceId&&b.positionId===p.id))unsupported('Bestehenden Anfangsbestand und seinen zeitlichen Bezug ausdrücklich bestätigen.');
    if(before!==units(row.beforeExact))unsupported('Quellsaldo passt nicht zum Bestand vor dieser Gruppe. Historische Anfangsbestände, Lücken oder Reihenfolge zuerst abgleichen.');
    expected.set(p.id,units(row.balanceExact));
   }
   const touched=new Set(actions.flatMap(a=>[a.positionId,a.targetPositionId,a.cashPositionId].filter(Boolean)));
   if(draft.bookings.some(b=>b.importSource?.sourceId!==sourceId&&[b.positionId,b.targetPositionId,b.cashPositionId].some(id=>touched.has(id))))unsupported('Andere oder manuelle Buchungen benötigen einen ausdrücklichen Quellenabgleich.');
   for(const id of touched){const p=draft.positions.find(p=>p.id===id);if(p.kind==='crypto'&&(p.costBasisExact!=null||p.costBasisEUR!=null||p.realizedPnLExact!=null||p.realizedPnLEUR!=null))unsupported('Vorhandene bestätigte Kostenbasis oder realisierte Ergebnisse zuerst fachlich abgleichen.');}
   const candidate=structuredClone(draft);
   for(const [i,action] of actions.entries()){
    const b=executeTransaction(candidate,{...action,id:'uh03:'+group.id+':'+i});
    const j=candidate.journalEntries.find(j=>j.id===b.journalEntryId);j.source=sourceId;
    // Ledger quantities and cash settlement are facts; historical EUR fee valuation/taxes are not.
    b.costsVerified=false;b.taxEUR=null;
    if(action.type==='fee'&&action.notes.startsWith('Kraken-Gebühr')&&candidate.positions.find(p=>p.id===action.positionId).kind==='crypto'){b.amountEUR=null;b.amountExactEUR=null;b.unitPrice=null;}
    for(const id of touched){const p=candidate.positions.find(p=>p.id===id);if(p.kind==='crypto'){p.costBasisEUR=null;p.costBasisExact=null;p.realizedPnLEUR=null;p.realizedPnLExact=null;}}
    origins[i].ownedSnapshot=bookingOwnership(candidate,b);b.importSource=validateImportSource(origins[i],b.accountId);
   }
   for(const [id,n] of expected)if(qty(candidate.positions.find(p=>p.id===id))!==n)unsupported('Gebuchte Menge und exakter Kraken-Folgesaldo widersprechen sich.');
   if(!ledgerQuantityAudit(candidate).ok)unsupported('Journal stimmt nicht mit den Beständen überein.');
   Object.assign(draft,candidate);ready++;groups.push({id:group.id,status:'ready',actions});
  }catch(e){issues.push({id:group.id,message:e.message});groups.push({id:group.id,status:'blocked',message:e.message});}
 }
 return {baseline,source,groups,issues,ready,duplicates,excluded:source.groups.length-selected.length,simulated:draft};
}
export function confirmKrakenImport(model,inputs,assignments,{baseline,confirmed=false,selectedGroups=null,externalReferences=[],partialConfirmed=false,openingConfirmed=false}={}){
 if(!confirmed||baseline!==JSON.stringify(model))throw Error('Aktuellen Kraken-Prüfplan erneut bestätigen.');
 const plan=previewKrakenImport(model,inputs,assignments,{selectedGroups,externalReferences,openingConfirmed});
 if(plan.issues.length)throw Error('Ungeklärte Gruppen verhindern die Übernahme der Auswahl.');
 if(plan.excluded&&!partialConfirmed)throw Error('Nicht ausgewählte Restgruppen ausdrücklich bestätigen.');
 if(!plan.ready)return model;
 safeImport(JSON.parse(backup(plan.simulated)));
 return plan.simulated;
}
