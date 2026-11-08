import {validateSolanaBridgeProof,validateKrakenSolanaBridges,krakenSolanaBridgeFor,solanaBridgeDigest} from './kraken-solana-bridge.js';
import {validateEthereumBridgeProof,validateKrakenEthereumBridges,krakenEthereumBridgeFor,ethereumBridgeDigest} from './kraken-ethereum-bridge.js';
import {validateBitcoinBridgeProof,validateKrakenBitcoinBridges,krakenBridgeFor,bitcoinBridgeDigest} from './kraken-bitcoin-bridge.js';
/** UH03: orchestration over the existing transaction journal, never a second financial engine. */
import {prepareKrakenSourcePlan,krakenAutoallocationPairs} from './kraken-source-plan.js';
import {executeTransaction,ledgerQuantityAudit,validateJournalEntry,nextJournalSequence} from './transactions.js';
import {KRAKEN_SOURCE,krakenWithdrawalId,withdrawalDigest,validateKrakenWithdrawals} from './kraken-withdrawal-evidence.js';
import {sourceDigest,sourceUnmodified,bookingOwnership,importSourceKey,validateImportSource} from './import-identity.js';
import {units,exact,div} from './decimal.js';
import {backup,safeImport} from './model.js';
import {setArchivePresentation} from './booking-history.js';
import {FX_UNKNOWN} from './fx-state.js';
import {UNPRICED_USD_PRINCIPAL} from './transactions.js';
const digest=v=>sourceDigest(JSON.stringify(v));
const sourceId='kraken-uh03-v1';
const unsupported=message=>{throw Error(message);};
const qty=p=>units(p.quantityExact??p.quantity);
const amount=n=>n<0n?-n:n;
// Directed Euler-trail feasibility: exact degree balance plus weak connectivity.
// This avoids factorial search while retaining locally branching unique trails.
function completeTrailExists(edges,start){
 if(!edges.length)return true;
 const degree=new Map(),adjacent=new Map();
 for(const {before,after} of edges){
  degree.set(before,(degree.get(before)||0)+1);degree.set(after,(degree.get(after)||0)-1);
  if(!adjacent.has(before))adjacent.set(before,new Set());
  if(!adjacent.has(after))adjacent.set(after,new Set());
  adjacent.get(before).add(after);adjacent.get(after).add(before);
 }
 let positive=0,negative=0;
 for(const [vertex,delta] of degree){
  if(delta===1){positive++;if(vertex!==start)return false;}
  else if(delta===-1)negative++;
  else if(delta!==0)return false;
 }
 if(!((positive===0&&negative===0)||(positive===1&&negative===1))||!adjacent.has(start))return false;
 const seen=new Set([start]),pending=[start];
 while(pending.length)for(const vertex of adjacent.get(pending.pop()))if(!seen.has(vertex)){seen.add(vertex);pending.push(vertex);}
 return seen.size===adjacent.size;
}
/** Sole complete row path from a confirmed holding, within one reference/stream. */
export function krakenBalanceTrail(rows,start){
 if(rows.length>64)unsupported('Große Referenzgruppe benötigt einen gesonderten vollständigen Beinabgleich.');
 let rest=rows.map(row=>({row,before:units(row.beforeExact),after:units(row.balanceExact)})),current=start;
 const trail=[];
 if(!completeTrailExists(rest,current))unsupported('Quellsaldo passt nicht zum Bestand vor dieser Gruppe. Historische Anfangsbestände, Lücken oder Reihenfolge zuerst abgleichen.');
 while(rest.length){
  let chosen=null;
  for(const edge of rest){
   if(edge.before!==current||!completeTrailExists(rest.filter(other=>other!==edge),edge.after))continue;
   if(chosen)unsupported('Quellsaldo erlaubt mehrere vollständige Reihenfolgen innerhalb dieser Referenzgruppe. Zuerst eindeutig abgleichen.');
   chosen=edge;
  }
  if(!chosen)unsupported('Quellsaldo enthält eine Lücke in dieser Referenzgruppe.');
  trail.push(chosen.row);current=chosen.after;rest=rest.filter(edge=>edge!==chosen);
 }
 return trail;
}
/** One timestamp, new references only. Existing groups never supply historical openings. */
export function krakenReferenceOrder(groups,starts){
 const byId=new Map(groups.map(g=>[g.id,g])),streams=new Map(),edges=new Map(groups.map(g=>[g.id,new Set()]));
 if(byId.size!==groups.length)unsupported('Doppelte Kraken-Referenzgruppe.');
 const times=new Set();
 for(const group of groups){
  if(group.issues.length)unsupported(group.issues.join(' '));
  for(const row of group.rows){
   times.add(row.values.time);
   if(!streams.has(row.streamId))streams.set(row.streamId,[]);
   streams.get(row.streamId).push({...row,referenceId:group.id});
  }
 }
 if(times.size>1)unsupported('Kraken-Chronologie benötigt einen gemeinsamen exakten Zeitpunkt.');
 for(const [stream,rows] of streams){
  if(!starts.has(stream))unsupported('Expliziter Bestand für jeden Kraken-Quellbereich erforderlich.');
  const trail=krakenBalanceTrail(rows,starts.get(stream)),seen=new Set();let previous=null;
  for(const row of trail){
   const id=row.referenceId;if(id===previous)continue;
   if(seen.has(id))unsupported('Kraken-Referenzen sind im selben Quellbereich verschachtelt. Gesonderter Beinabgleich erforderlich.');
   seen.add(id);if(previous!==null)edges.get(previous).add(id);previous=id;
  }
 }
 const incoming=new Map(groups.map(g=>[g.id,0]));
 for(const targets of edges.values())for(const id of targets)incoming.set(id,incoming.get(id)+1);
 const available=[...incoming].filter(([,n])=>n===0).map(([id])=>id).sort(),ordered=[];
 while(available.length){
  const id=available.shift();ordered.push(byId.get(id));
  for(const target of edges.get(id)){incoming.set(target,incoming.get(target)-1);if(incoming.get(target)===0){available.push(target);available.sort();}}
 }
 if(ordered.length!==groups.length)unsupported('Kraken-Quellbereiche widersprechen sich in der Referenzreihenfolge.');
 return ordered;
}
// Resolve each timestamp against the evolving draft. Reimport groups are validated
// normally but excluded from new trails: their effects are already in the holding.
function* chronologicalGroups(selected,draft,assignments){
 const timestamps=new Map();
 for(const group of selected){const time=group.rows[0].values.time;if(!timestamps.has(time))timestamps.set(time,[]);timestamps.get(time).push(group);}
 for(const time of [...timestamps.keys()].sort()){
  const cluster=timestamps.get(time).sort((a,b)=>a.id.localeCompare(b.id)),fresh=[];
  for(const group of cluster){
   if(draft.bookings.some(b=>b.importSource?.sourceId===sourceId&&b.importSource.fileId===group.id)||draft.journalEntries.some(j=>j.id===krakenWithdrawalId(group.id)))yield group;
   else fresh.push(group);
  }
  if(fresh.length<2){yield* fresh;continue;}
  let ordered;
  try{
   const starts=new Map();
   for(const group of fresh)for(const row of group.rows)starts.set(row.streamId,qty(position(draft,row,assignments)));
   ordered=krakenReferenceOrder(fresh,starts);
  }catch(e){ordered=fresh.map(group=>({...group,chronologyIssue:e.message}));}
  yield* ordered;
 }
}
function position(model,row,assignments){
 const id=assignments[row.streamId],p=model.positions.find(p=>p.id===id);
 const usd=p?.kind==='cash'&&p.currency==='USD'&&row.values.asset==='USD'&&row.values.subclass==='fiat'&&model.accounts.some(a=>a.id===p.accountId&&a.providerId===p.providerId&&a.currency==='USD');
 if(!p||p.wallet?.enabled||p.managementSource==='wallet'||!['cash','crypto'].includes(p.kind)||p.currency!=='EUR'&&!usd)unsupported('Jeden Kraken-Asset-/Walletbereich ausdrücklich einer passenden manuellen Position zuordnen; USD nur für den begrenzten Hauptbetragsvertrag.');
 if(p.kind==='cash'?row.values.asset!==p.currency:p.symbol!==row.values.asset)unsupported('Assetcode und Position widersprechen sich; keine Ticker- oder Netzwerkanahme.');
 return p;
}
function nativeUSDPrincipal(group){
 const rows=group.rows;
 if(group.kind!=='internal-transfer'||rows.length!==2||group.issues.length||new Set(rows.map(r=>r.values.refid)).size!==1||!rows[0].values.refid||new Set(rows.map(r=>r.values.time)).size!==1||rows.some(r=>r.issues.length||r.values.type!=='earn'||r.values.subtype!=='autoallocation'||r.values.aclass!=='currency'||r.values.subclass!=='fiat'||r.values.asset!=='USD'||r.feeExact!=='0'||!String(r.values.fee).trim()))return false;
 const out=rows.find(r=>units(r.amountExact)<0n),incoming=rows.find(r=>units(r.amountExact)>0n);
 return Boolean(out&&incoming&&out.values.wallet==='spot / main'&&incoming.values.wallet==='earn / liquid'&&units(out.amountExact)===-units(incoming.amountExact));
}
function actionsFor(model,group,assignments,{externalReferences=[],openingConfirmed=false,bitcoinBridge=null,ethereumBridge=null,solanaBridge=null}={},reconstructExisting=false){
 if(group.issues.length)unsupported(group.issues.join(' '));
 const rows=[...group.rows].sort((a,b)=>a.identity.localeCompare(b.identity)),positive=rows.filter(r=>units(r.amountExact)>0n),negative=rows.filter(r=>units(r.amountExact)<0n),actions=[];
 const p=row=>position(model,row,assignments);
 const usdPrincipal=nativeUSDPrincipal(group)&&rows.every(row=>p(row).kind==='cash'&&p(row).currency==='USD');
 if(usdPrincipal&&(!openingConfirmed&&!reconstructExisting||externalReferences.includes(group.id)||bitcoinBridge||ethereumBridge||solanaBridge))unsupported('Vollständigen eigenen USD-Spot-/Earn-Hauptbetrag und Quellenanfänge ausdrücklich bestätigen.');
 // Admission only: existing actions still need the complete origin/payload/
 // ownership checks below. This flag is derived internally, never from options.
 if(!reconstructExisting)for(const row of rows){
  const assigned=p(row),nativeFiat=row.values.subclass==='fiat';
  if(nativeFiat&&(row.values.asset!=='EUR'||assigned.kind!=='cash')&&!usdPrincipal)unsupported('Native Fiat-Zeilen benötigen EUR-Cash; USD ist ausschließlich als vollständiger Spot-/Earn-Hauptbetrag zulässig.');
  if(assigned.kind==='cash'&&!nativeFiat)unsupported('Fiat-Cash benötigt die native EUR-Fiat-Rolle der Quelle.');
 }
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
  if(usdPrincipal&&p(negative[0]).accountId===p(positive[0]).accountId)unsupported('USD Spot und Earn benötigen getrennte eigene Konten.');
  add('transfer',negative[0],-units(negative[0].amountExact),{targetPositionId:p(positive[0]).id,...(usdPrincipal?{fxRate:FX_UNKNOWN,notes:'Kraken: nativer USD-Hauptbetrag Spot → Earn. EUR-Wert unbekannt; kein Ertrag, externer Fluss oder neue Kostenbasis.'}:{})});
 }else if(group.kind==='internal-transfer-batch'){
  const pairs=krakenAutoallocationPairs(group.rows);
  const observed=model.bookings.some(b=>b.importSource?.sourceId===sourceId&&b.importSource.fileId===group.id);
  if(!pairs||!openingConfirmed&&!observed||externalReferences.includes(group.id))unsupported('Vollständige interne Kraken-Umbuchung mit ausdrücklich geprüften Anfangsbeständen erforderlich; kein externer Zufluss oder Ertrag.');
  for(const {debit,credit} of pairs){
   if(p(debit).id===p(credit).id||p(debit).accountId===p(credit).accountId)unsupported('Spot- und Earn-Bereiche ausdrücklich getrennten Konten zuordnen.');
   add('transfer',debit,-units(debit.amountExact),{targetPositionId:p(credit).id,notes:'Kraken: interne Spot-/Earn-Umbuchung. Kein Ertrag oder externer Kapitalfluss; Kostenbasis unbekannt.'});
  }
 }else if(group.kind==='reward')add(p(positive[0]).kind==='cash'?'interest':'reward',positive[0],units(positive[0].amountExact));
 else if(['deposit-review','withdrawal-review'].includes(group.kind)){
  // Ledger IDs are not chain transaction IDs. Never infer internal ownership from amount/time.
  if(!bitcoinBridge&&!ethereumBridge&&!solanaBridge&&!externalReferences.includes(group.id))unsupported('Ein-/Ausgang benötigt einen bestätigten externen Gegenbereich oder einen starken Wallet-Gegenbeleg.');
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
export function previewKrakenImport(model,inputs,assignments,{selectedGroups=null,externalReferences=[],openingConfirmed=false,bitcoinBridge=null,ethereumBridge=null,solanaBridge=null}={}){
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
 for(const group of chronologicalGroups(selected,draft,assignments)){
  try{
   if(draft.journalEntries.some(j=>j.id===krakenWithdrawalId(group.id)))unsupported('Diese Kraken-Gruppe wurde dauerhaft zurückgenommen. Kein automatischer Wiederimport.');
   if(group.chronologyIssue)unsupported(group.chronologyIssue);
   if(group.rows.length>64)unsupported('Große Referenzgruppe benötigt einen gesonderten vollständigen Beinabgleich.');
   const btc=bitcoinBridge?.group===group.id?bitcoinBridge:krakenBridgeFor(draft,group.id),eth=ethereumBridge?.group===group.id?ethereumBridge:krakenEthereumBridgeFor(draft,group.id),sol=solanaBridge?.group===group.id?solanaBridge:krakenSolanaBridgeFor(draft,group.id);
   if([btc,eth,sol].filter(Boolean).length>1)unsupported('Mehrdeutige Wallet-Gegenbelege.');
   const bridge=btc??eth??sol,bridgeKey=sol?'solanaBridge':eth?'ethereumBridge':'bitcoinBridge',bridgeDigest=sol?solanaBridgeDigest:eth?ethereumBridgeDigest:bitcoinBridgeDigest;
   if(bridge){
    (sol?validateSolanaBridgeProof:eth?validateEthereumBridgeProof:validateBitcoinBridgeProof)(draft,bridge,{requireHistory:!(sol?krakenSolanaBridgeFor:eth?krakenEthereumBridgeFor:krakenBridgeFor)(draft,group.id)});
    const row=group.rows[0],source=position(draft,row,assignments),asset=sol?'SOL':eth?.kind==='link-explorer-beacon'?'LINK':eth?'ETH':'BTC',coin=sol?'solana':eth?.kind==='link-explorer-beacon'?'chainlink':eth?'ethereum':'bitcoin';
    if(group.kind!=='withdrawal-review'||group.rows.length!==1||group.issues.length||row.values.asset!==asset||source.coinId!==coin||source.accountId===bridge.event.accountId||bridge.reference!==row.values.refid||bridge.payload!==group.payloadDigest||bridge['principal'+asset]!==exact(-units(row.amountExact))||bridge['exchangeFee'+asset]!==row.feeExact||externalReferences.includes(group.id))unsupported('Wallet-Gegenbeleg passt nicht zur vollständigen Kraken-Gruppe.');
   }
   const priorGroup=draft.bookings.filter(b=>b.importSource?.sourceId===sourceId&&b.importSource.fileId===group.id);
   const actions=actionsFor(draft,group,assignments,{externalReferences,openingConfirmed,bitcoinBridge:btc,ethereumBridge:eth,solanaBridge:sol},priorGroup.length>0);
   if(actions.length>24)unsupported('Zu viele abhängige Buchungen in einer einzelnen Referenzgruppe.');
   const payload=digest([group.payloadDigest,group.rows.map(r=>[r.identity,assignments[r.streamId]]).sort((a,b)=>a[0].localeCompare(b[0])),externalReferences.includes(group.id),...(bridge?[bridgeDigest(bridge)]:[])]);
   const origins=actions.map((action,i)=>({version:1,sourceId,accountId:draft.positions.find(p=>p.id===action.positionId).accountId,externalId:group.id+':'+i,sourcePayload:JSON.stringify({group:group.id,payload,...(bridge?{[bridgeKey]:bridgeDigest(bridge)}:{}),bindings:[...new Map(group.rows.map(r=>[r.streamId,assignments[r.streamId]])).entries()].sort((a,b)=>a[0].localeCompare(b[0])),action}),fileId:group.id,occurrence:1,ownership:'imported',ownedSnapshot:''}));
   const existing=origins.map(origin=>draft.bookings.filter(b=>importSourceKey(b.importSource)===importSourceKey(origin)));
   if(priorGroup.length||existing.some(list=>list.length)){
    if(priorGroup.length!==origins.length)unsupported('Vorhandene Kraken-Gruppe ist unvollständig oder anders zugeordnet.');
    if(existing.some((list,i)=>list.length!==1||list[0].importSource.sourcePayload!==origins[i].sourcePayload||!sourceUnmodified(draft,list[0])))unsupported('Vorhandene Kraken-Gruppe ist unvollständig, geändert oder widersprüchlich.');
    duplicates++;groups.push({id:group.id,status:'existing',actions});continue;
   }
   // Exact source balances guard gaps, ordering and replay over already observed holdings.
   if(draft.journalEntries.some(j=>j.source===sourceId&&j.id.startsWith('uh03:'+group.id+':')))unsupported('Kraken-Journal ohne vollständige Quellbuchungen; keine Wiederbelebung.');
   const expected=new Map(),streams=new Map();
   for(const row of group.rows){
    const p=position(draft,row,assignments);
    const opening=draft.openingPositions.find(o=>o.positionId===p.id);
    if(opening?.asOf&&opening.asOf>row.values.time.slice(0,10))unsupported('Datierter Anfangsbestand liegt nach diesem Quellenereignis. Kein historisches Aufaddieren.');
    if(opening?.costBasisExact!=null||opening?.realizedPnLExact!=null)unsupported('Bestätigte Kostenbasis im Anfangsbestand bleibt geschützt.');
    const before=qty(p);
    if(!openingConfirmed&&before!==0n&&!draft.bookings.some(b=>b.importSource?.sourceId===sourceId&&b.positionId===p.id))unsupported('Bestehenden Anfangsbestand und seinen zeitlichen Bezug ausdrücklich bestätigen.');
    if(!streams.has(p.id))streams.set(p.id,[]);
    streams.get(p.id).push(row);
   }
   for(const [id,rows] of streams){
    const trail=krakenBalanceTrail(rows,qty(draft.positions.find(p=>p.id===id)));
    expected.set(id,units(trail.at(-1).balanceExact));
   }
   const touched=new Set(actions.flatMap(a=>[a.positionId,a.targetPositionId,a.cashPositionId].filter(Boolean)));
   if(draft.bookings.some(b=>b.importSource?.sourceId!==sourceId&&[b.positionId,b.targetPositionId,b.cashPositionId].some(id=>touched.has(id))))unsupported('Andere oder manuelle Buchungen benötigen einen ausdrücklichen Quellenabgleich.');
   for(const id of touched){const p=draft.positions.find(p=>p.id===id);if(p.kind==='crypto'&&(p.costBasisExact!=null||p.costBasisEUR!=null||p.realizedPnLExact!=null||p.realizedPnLEUR!=null))unsupported('Vorhandene bestätigte Kostenbasis oder realisierte Ergebnisse zuerst fachlich abgleichen.');}
   const candidate=structuredClone(draft);
   for(const [i,action] of actions.entries()){
    const b=executeTransaction(candidate,{...action,id:'uh03:'+group.id+':'+i});
    const j=candidate.journalEntries.find(j=>j.id===b.journalEntryId);j.source=sourceId;if(bridge&&i===0)j[sol?'krakenSolanaBridge':eth?'krakenEthereumBridge':'krakenBitcoinBridge']=structuredClone(bridge);
    // Ledger quantities and cash settlement are facts; historical EUR fee valuation/taxes are not.
    b.costsVerified=false;b.taxEUR=null;
    if(action.type==='fee'&&action.notes.startsWith('Kraken-Gebühr')&&candidate.positions.find(p=>p.id===action.positionId).kind==='crypto'){b.amountEUR=null;b.amountExactEUR=null;b.unitPrice=null;}
    for(const id of touched){const p=candidate.positions.find(p=>p.id===id);if(p.kind==='crypto'){p.costBasisEUR=null;p.costBasisExact=null;p.realizedPnLEUR=null;p.realizedPnLExact=null;}}
    origins[i].ownedSnapshot=bookingOwnership(candidate,b);b.importSource=validateImportSource(origins[i],b.accountId);
   }
   for(const [id,n] of expected)if(qty(candidate.positions.find(p=>p.id===id))!==n)unsupported('Gebuchte Menge und exakter Kraken-Folgesaldo widersprechen sich.');
   if(!ledgerQuantityAudit(candidate).ok)unsupported('Journal stimmt nicht mit den Beständen überein.');
   if(bridge)candidate.version=5;validateKrakenBitcoinBridges(candidate);validateKrakenEthereumBridges(candidate);validateKrakenSolanaBridges(candidate);
   Object.assign(draft,candidate);ready++;groups.push({id:group.id,status:'ready',actions});
  }catch(e){issues.push({id:group.id,message:e.message});groups.push({id:group.id,status:'blocked',message:e.message});}
 }
 return {baseline,source,groups,issues,ready,duplicates,excluded:source.groups.length-selected.length,simulated:draft};
}
export function confirmKrakenImport(model,inputs,assignments,{baseline,confirmed=false,selectedGroups=null,externalReferences=[],partialConfirmed=false,openingConfirmed=false,bitcoinBridge=null,ethereumBridge=null,solanaBridge=null}={}){
 if(!confirmed||baseline!==JSON.stringify(model))throw Error('Aktuellen Kraken-Prüfplan erneut bestätigen.');
 const plan=previewKrakenImport(model,inputs,assignments,{selectedGroups,externalReferences,openingConfirmed,bitcoinBridge,ethereumBridge,solanaBridge});
 if(plan.issues.length)throw Error('Ungeklärte Gruppen verhindern die Übernahme der Auswahl.');
 if(plan.excluded&&!partialConfirmed)throw Error('Nicht ausgewählte Restgruppen ausdrücklich bestätigen.');
 if(!plan.ready)return model;
 safeImport(JSON.parse(backup(plan.simulated)));
 return plan.simulated;
}

/** Original export proves the complete group, including separate fee legs.
 * Bounded first contract: terminal groups only. Never detach the sole source
 * from an economic event or reinterpret scan-reflected Bitcoin quantities.
 */
export function previewKrakenWithdrawal(model,inputs,assignments,options={}){
 const baseline=JSON.stringify(model),{selectedGroups}=options;
 if(!Array.isArray(selectedGroups)||selectedGroups.length!==1)throw Error('Genau eine vollständige Kraken-Gruppe zur Rücknahme auswählen.');
 safeImport(JSON.parse(backup(model)));validateKrakenWithdrawals(model);
 const plan=previewKrakenImport(model,inputs,assignments,options),group=plan.groups[0];
 if(plan.issues.length||group?.status!=='existing'||plan.duplicates!==1)throw Error('Vollständige unveränderte Originalgruppe erforderlich. '+(plan.issues[0]?.message||''));
 const id=selectedGroups[0],originals=group.actions.map((_,i)=>{
  const booking=model.bookings.find(b=>b.id==='uh03:'+id+':'+i),journal=model.journalEntries.find(j=>j.id===booking?.journalEntryId);
  if(!booking||!journal||journal.id!==booking.id||journal.source!==KRAKEN_SOURCE||!sourceUnmodified(model,booking)||booking.transferMatch)throw Error('Kraken-Gruppe wurde geändert oder ist verknüpft.');
  const knownBooking='id type date positionId accountId positionName quantity quantityExact unitPrice feeEUR taxEUR fxRate fxRateDate fxSource amountEUR amountExactEUR targetPositionId external notes journalEntryId cashPositionId reconciliationStatus targetQuantityExact costsVerified importSource'.split(' '),knownJournal='id type date recordedAt sequence postings cashPositionId status source krakenBitcoinBridge krakenEthereumBridge krakenSolanaBridge nativeCurrency'.split(' '),knownPosting='id role positionId accountId quantityDeltaExact amountBookEURExact'.split(' ');
  if(Object.keys(booking).some(k=>!knownBooking.includes(k))||Object.keys(journal).some(k=>!knownJournal.includes(k))||journal.postings.some(p=>Object.keys(p).some(k=>!knownPosting.includes(k)))||!Number.isSafeInteger(journal.sequence))throw Error('Unbekannte Gruppenfelder oder Journalreihenfolge zuerst abgleichen.');
  return structuredClone({booking,journal,flows:model.externalCashFlows.filter(f=>f.id===booking.id)});
 });
 const ids=new Set(originals.map(o=>o.booking.id)),touched=new Set(originals.flatMap(o=>o.journal.postings.map(p=>p.positionId).filter(Boolean)));
 const targets=[id,...ids,...originals.flatMap(o=>o.journal.postings.map(p=>p.id))];
 let nodes=0;
 const references=(v,depth=0)=>{
  if(++nodes>200000||depth>64)throw Error('Referenzprüfung überschreitet das sichere Prüflimit.');
  return typeof v==='string'?targets.some(id=>v.includes(id)):v&&typeof v==='object'?Object.entries(v).some(([k,v])=>targets.includes(k)||references(v,depth+1)):false;
 };
 const draft=structuredClone(model);
 draft.bookings=draft.bookings.filter(b=>!ids.has(b.id));draft.journalEntries=draft.journalEntries.filter(j=>!ids.has(j.id));draft.externalCashFlows=draft.externalCashFlows.filter(f=>!ids.has(f.id));
 if(references({...draft,bookingPresentation:undefined}))throw Error('Weitere Quellen oder abhängige Nachweise verhindern die isolierte Gruppenrücknahme.');
 const first=Math.min(...originals.map(o=>o.journal.sequence));
 for(const j of draft.journalEntries.filter(j=>j.postings.some(p=>touched.has(p.positionId)))){
  if(j.source!==KRAKEN_SOURCE||!Number.isSafeInteger(j.sequence)||j.sequence>=first)throw Error('Spätere oder fremde Buchungen im betroffenen Quellbereich zuerst abgleichen.');
  const b=draft.bookings.find(b=>b.journalEntryId===j.id);
  if(!b||!sourceUnmodified(draft,b))throw Error('Frühere Quellbuchungen wurden geändert.');
 }
 const changes=[];
 for(const positionId of touched){
  const p=draft.positions.find(p=>p.id===positionId),opening=draft.openingPositions.find(o=>o.positionId===positionId);
  const usd=p?.kind==='cash'&&p.currency==='USD'&&originals.every(o=>o.journal.status===UNPRICED_USD_PRINCIPAL);
  if(!p||p.wallet?.enabled||p.currency!=='EUR'&&!usd||!['cash','crypto'].includes(p.kind)||!opening||[p.costBasisExact,p.costBasisEUR,p.realizedPnLExact,p.realizedPnLEUR,opening.costBasisExact,opening.realizedPnLExact].some(v=>v!=null))throw Error('Wallet, fehlender Anfangsbestand oder bestätigte Kosten-/Ergebniswerte bleiben geschützt.');
  const delta=originals.reduce((sum,o)=>sum+o.journal.postings.filter(p=>p.positionId===positionId&&p.quantityDeltaExact!=null).reduce((n,p)=>n+units(p.quantityDeltaExact),0n),0n),before=qty(p),after=before-delta;
  if(after<0n)throw Error('Rücknahme würde einen negativen Bestand erzeugen.');
  changes.push({positionId,before:exact(before),after:exact(after),delta:exact(-delta)});p.quantityExact=exact(after);p.quantity=Number(p.quantityExact);
 }
 // A coherent journal alone does not prove that a later edited opening still
 // belongs to this original export. Anchor both sides of the inverse to the
 // original exact stream balances, never to a changed observed baseline.
 const sourceGroup=plan.source.groups.find(g=>g.id===id),streams=new Map();
 for(const row of sourceGroup.rows){
  const p=position(draft,row,assignments),opening=draft.openingPositions.find(o=>o.positionId===p.id);
  if(opening.asOf&&opening.asOf>row.values.time.slice(0,10))throw Error('Geänderter datierter Anfangsbestand liegt nach der Originalgruppe.');
  if(!streams.has(p.id))streams.set(p.id,[]);streams.get(p.id).push(row);
 }
 for(const [positionId,rows] of streams){
  const trail=krakenBalanceTrail(rows,qty(draft.positions.find(p=>p.id===positionId)));
  if(units(trail.at(-1).balanceExact)!==qty(model.positions.find(p=>p.id===positionId)))throw Error('Aktueller Bestand widerspricht dem unveränderten Kraken-Endsaldo der Gruppe.');
 }
 if(draft.bookingPresentation)setArchivePresentation(draft,{bookingIds:draft.bookingPresentation.archivedIds.filter(id=>!ids.has(id))});
 if(!ledgerQuantityAudit(draft).ok)throw Error('Rücknahme widerspricht dem vollständigen chronologischen Journal.');
 return {baseline,group:id,originals,changes,simulated:draft,excluded:plan.excluded};
}
export function confirmKrakenWithdrawal(model,inputs,assignments,{baseline,confirmed=false,partialConfirmed=false,at=new Date().toISOString(),...options}={}){
 if(!confirmed||baseline!==JSON.stringify(model))throw Error('Aktuelle Gruppenrücknahme erneut prüfen und bestätigen.');
 const plan=previewKrakenWithdrawal(model,inputs,assignments,options);
 if(plan.excluded&&!partialConfirmed)throw Error('Nicht ausgewählte Restgruppen ausdrücklich bestätigen.');
 const draft=plan.simulated,id=krakenWithdrawalId(plan.group);
 draft.journalEntries.push(validateJournalEntry({id,type:'uh03-undo',date:at.slice(0,10),recordedAt:at,sequence:nextJournalSequence(model),source:KRAKEN_SOURCE,status:'removed',postings:[{id:id+':documentation',role:'documentation',positionId:null,accountId:null,quantityDeltaExact:null,amountBookEURExact:'0'}],krakenWithdrawal:{version:1,group:plan.group,count:plan.originals.length,originals:plan.originals,digest:withdrawalDigest(plan.originals)}}));
 validateKrakenWithdrawals(draft);safeImport(JSON.parse(backup(draft)));
 return draft;
}
