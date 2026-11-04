/** Bounded EUR Depot12/Konto10 groups over the existing CSV/journal core. */
import {parseFlatexNativeCSV,FLATEX_NATIVE_COLUMNS} from './flatex-native.js';
import {inspectNativeFlatexSourceIdentities,sourceDigest,sourceUnmodified,bookingOwnership,importSourceKey,validateImportSource} from './import-identity.js';
import {inspectNativeFlatexOrderLinks} from './flatex-settlements.js';
import {auditNativeFlatexSettlementAmounts} from './flatex-settlement-audit.js';
import {reviewNativeFlatexBindings} from './flatex-native-ui.js';
import {units,exact} from './decimal.js';
import {validCalendarDate,ledgerQuantityAudit,validateJournalEntry} from './transactions.js';
import {previewCSV,CSV_FIELDS} from './csv-import.js';
const fail=()=>{throw Error('Flatex-Nettogruppe oder Quellenbeleg widersprüchlich.');};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const keys=(o,list)=>{if(!o||Array.isArray(o)||Object.keys(o).sort().join('|')!==list.split(' ').sort().join('|'))fail();};
const quote=s=>'"'+String(s).replaceAll('"','""')+'"';
function documentFor(type,fields){
 const columns=FLATEX_NATIVE_COLUMNS[type];if(!columns||!Array.isArray(fields)||fields.length!==columns.length||fields.some(v=>typeof v!=='string'||v.length>300))fail();
 return parseFlatexNativeCSV([columns.map(c=>quote(c.header)).join(';'),fields.map(quote).join(';')].join('\n'));
}
const sourceKey=s=>JSON.stringify([s.sourceId,s.externalId]);
const groupId=(depot,account)=>'fn-'+sourceDigest(JSON.stringify([sourceKey(depot),sourceKey(account)]));
/** Deduplicate documentary occurrences only after exact payload comparison.
 * Changed payloads and ambiguous multi-leg orders remain blocked by the old matcher. */
export function inspectFlatexNetPairs(documents){
 const identities=inspectNativeFlatexSourceIdentities(documents),seen=new Map(),unique=[];
 const byLocator=new Map(identities.rows.map(r=>[JSON.stringify([r.sourceIndex,r.line]),r]));
 const digests=documents.map(doc=>sourceDigest(JSON.stringify([doc.type,doc.rows.map(r=>r.fields)])));
 for(const [di,doc] of documents.entries())for(const row of doc.rows){
  const identity=byLocator.get(JSON.stringify([di,row.line]));
  if(doc.dialect||!identity.sourceId||!identity.externalId)continue;
  const k=sourceKey(identity),previous=seen.get(k);
  const occurrence={documentDigest:digests[di],line:row.line,fields:[...row.fields]};
  if(previous){if(previous.payloadDigest!==identity.payloadDigest)previous.conflict=true;if(!previous.occurrences.some(o=>o.documentDigest===occurrence.documentDigest&&o.line===occurrence.line))previous.occurrences.push(occurrence);continue;}
  const s={type:doc.type,sourceId:identity.sourceId,externalId:identity.externalId,payloadDigest:identity.payloadDigest,fields:[...row.fields],occurrences:[occurrence]};
  seen.set(k,s);unique.push(s);
 }
 const types=['depot','account'].filter(type=>unique.some(s=>s.type===type));
 const grouped=types.map(type=>unique.filter(s=>s.type===type));
 const docs=grouped.map((rows,i)=>parseFlatexNativeCSV([FLATEX_NATIVE_COLUMNS[types[i]].map(c=>quote(c.header)).join(';'),...rows.map(s=>s.fields.map(quote).join(';'))].join('\n')));
 if(!docs.length)return {identities,pairs:[],reviewCount:identities.rows.length};
 const links=inspectNativeFlatexOrderLinks(docs,{maxDays:0}),audit=auditNativeFlatexSettlementAmounts(docs,{maxDays:0});
 const pairs=[];
 for(const [i,g]of links.groups.entries()){
  const a=audit.entries[i];if(g.status!=='possible-single'||a.status==='review'||a.currency!=='EUR')continue;
  const depot=grouped[g.depot[0].sourceIndex][g.depot[0].line-2],account=grouped[g.cash[0].sourceIndex][g.cash[0].line-2];
  if(depot.conflict||account.conflict)continue;
  const d=docs[g.depot[0].sourceIndex].rows.find(r=>r.line===g.depot[0].line),c=docs[g.cash[0].sourceIndex].rows.find(r=>r.line===g.cash[0].line);
  if(d.dates.bookingDate!==c.dates.bookingDate||d.dates.valueDate!==c.dates.valueDate||d.values.unit!=='Stk.')continue;
  const q=units(d.numbers.nominal);
  pairs.push({version:1,id:groupId(depot,account),orderReference:g.orderReference,type:g.type,date:d.dates.bookingDate,valueDate:d.dates.valueDate,isin:g.isin,quantityExact:exact(q<0n?-q:q),unitPriceExact:d.numbers.rate,grossExact:a.grossExact,cashExact:a.cashExact,differenceExact:a.differenceExact,depot,account});
 }
 return {identities,pairs,reviewCount:links.groups.length-pairs.length+links.unassigned.length};
}
export function validateNetSettlement(proof){
 keys(proof,'version id orderReference type date valueDate isin quantityExact unitPriceExact grossExact cashExact differenceExact depot account');
 if(proof.version!==1||!/^fn-[a-f0-9]{64}$/.test(proof.id))fail();
 const docs=[];
 for(const type of ['depot','account']){
  const s=proof[type];keys(s,'type sourceId externalId payloadDigest fields occurrences');
  if(s.type!==type||!Array.isArray(s.occurrences)||!s.occurrences.length||s.occurrences.length>20)fail();
  const doc=documentFor(type,s.fields),id=inspectNativeFlatexSourceIdentities([doc]).rows[0];
  if(id.status!=='candidate-source'||s.sourceId!==id.sourceId||s.externalId!==id.externalId||s.payloadDigest!==id.payloadDigest)fail();
  const seen=new Set();
  for(const o of s.occurrences){
   keys(o,'documentDigest line fields');if(!/^[a-f0-9]{64}$/.test(o.documentDigest)||!Number.isSafeInteger(o.line)||o.line<2||o.line>5001)fail();
   const key=JSON.stringify([o.documentDigest,o.line]);if(seen.has(key))fail();seen.add(key);
   const other=inspectNativeFlatexSourceIdentities([documentFor(type,o.fields)]).rows[0];
   if(other.payloadDigest!==s.payloadDigest||other.sourceId!==s.sourceId||other.externalId!==s.externalId)fail();
  }
  if(!s.occurrences.some(o=>equal(o.fields,s.fields)))fail();docs.push(doc);
 }
 const found=inspectFlatexNetPairs(docs).pairs[0];if(!found)fail();
 for(const k of ['id','orderReference','type','date','valueDate','isin','quantityExact','unitPriceExact','grossExact','cashExact','differenceExact'])if(proof[k]!==found[k])fail();
 return proof;
}
export const hasFlatexNetState=m=>m?.flatexNetRemovals!==undefined||(m?.bookings||[]).some(b=>b.netSettlement!==undefined)||(m?.journalEntries||[]).some(j=>j.netSettlementId!==undefined||j.status==='unresolved-net-settlement'||j.postings?.some(p=>p.role==='unresolved-net-amount'));
function validateGroup(model,b,j,{removed=false}={}){
 const s=validateNetSettlement(b.netSettlement);
 validateImportSource(b.importSource,b.accountId);validateJournalEntry(j);
 if(b.type!==s.type||b.date!==s.date||b.external!==false||b.costsVerified!==false||b.feeEUR!==null||b.taxEUR!==null||b.reconciliationStatus!=='unresolved-net-settlement'||b.transferMatch||b.targetPositionId||b.journalEntryId!==j?.id||j.type!==b.type||j.date!==b.date||j.netSettlementId!==s.id||j.status!=='unresolved-net-settlement'||j.source!=='csv'||b.cashPositionId!==j.cashPositionId||!b.cashPositionId)fail();
 const p=model.positions.find(p=>p.id===b.positionId),c=model.positions.find(p=>p.id===b.cashPositionId);
 if(!p||!c||p.currency!=='EUR'||c.currency!=='EUR'||!['etf','stock','fund'].includes(p.kind)||c.kind!=='cash'||p.wallet?.enabled||c.wallet?.enabled||p.isin!==s.isin||b.accountId!==p.accountId||p.id===c.id||p.providerId!==c.providerId||p.accountId===c.accountId)fail();
 if(!removed&&(p.costBasisExact!=null||p.costBasisEUR!=null||p.realizedPnLExact!=null||p.realizedPnLEUR!=null))fail();
 if(units(b.quantityExact)!==units(s.quantityExact)||units(b.amountExactEUR)!==units(s.grossExact)||b.amountEUR!==Number(s.grossExact)||b.unitPrice!==Number(s.unitPriceExact)||b.fxRate!==1)fail();
 if(b.importSource?.sourceId!==s.depot.sourceId||b.importSource?.externalId!==s.depot.externalId||!sourceUnmodified({journalEntries:[j]},b))fail();
 const payload=JSON.parse(b.importSource.sourcePayload);
 if(payload.netSettlementId!==s.id||payload.sourceEvidence?.payloadDigest!==s.depot.payloadDigest||payload.cashPositionId!==c.id||payload.netCashExact!==s.cashExact||payload.tradeAmountEURExact!==s.grossExact)fail();
 if(j.postings.length!==3)fail();
 const asset=j.postings.filter(x=>x.role==='asset'),cash=j.postings.filter(x=>x.role==='cash'),difference=j.postings.filter(x=>x.role==='unresolved-net-amount');
 if(asset.length!==1||cash.length!==1||difference.length!==1)fail();
 const sign=s.type==='buy'?1n:-1n,a=asset[0],n=cash[0],d=difference[0];
 if(a.positionId!==p.id||a.accountId!==p.accountId||units(a.quantityDeltaExact)!==sign*units(s.quantityExact)||units(a.amountBookEURExact)!==sign*units(s.grossExact)||n.positionId!==c.id||n.accountId!==c.accountId||units(n.quantityDeltaExact)!==units(s.cashExact)||units(n.amountBookEURExact)!==units(s.cashExact)||d.positionId!==null||d.accountId!==null||d.quantityDeltaExact!==null||units(d.amountBookEURExact)!==-sign*units(s.grossExact)-units(s.cashExact))fail();
 return s;
}
export function validateFlatexNetSettlements(model){
 const ids=new Set(),sources=new Set(),journalIds=new Set();
 const reserve=s=>{if(ids.has(s.id))fail();ids.add(s.id);for(const source of [s.depot,s.account]){const key=sourceKey(source);if(sources.has(key))fail();sources.add(key);}};
 for(const b of model.bookings||[])if(b.netSettlement!==undefined){const j=model.journalEntries.find(j=>j.id===b.journalEntryId);reserve(validateGroup(model,b,j));journalIds.add(j.id);}
 for(const j of model.journalEntries||[])if((j.netSettlementId!==undefined||j.status==='unresolved-net-settlement'||j.postings.some(p=>p.role==='unresolved-net-amount'))&&!journalIds.has(j.id))fail();
 if(model.flatexNetRemovals!==undefined){
  if(!Array.isArray(model.flatexNetRemovals)||model.flatexNetRemovals.length>2500)fail();
  for(const r of model.flatexNetRemovals){keys(r,'version booking journal');if(r.version!==1||model.bookings.some(b=>b.id===r.booking?.id)||model.journalEntries.some(j=>j.id===r.journal?.id))fail();reserve(validateGroup(model,r.booking,r.journal,{removed:true}));}
 }
 return model;
}
/** Explicit selected groups only; unrelated unresolved rows remain visible. */
export function prepareFlatexNetPreview(model,documents,assignments,{selectedIds=[],openingDate='',openingConfirmed=false,stale=false,mode}={}){
 const inspection=inspectFlatexNetPairs(documents),prepared={...inspection,issues:[]};
 const blocked=reason=>({kind:'flatex-native-trade-preview',eligible:false,ready:false,writeEnabled:false,reason,preview:null,prepared});
 try{
  validateFlatexNetSettlements(model);
  if(stale||!Array.isArray(selectedIds)||!selectedIds.length||new Set(selectedIds).size!==selectedIds.length||selectedIds.length>2500)throw Error('Einzelne eindeutige EUR-Paare ausdrücklich auswählen.');
  const selected=selectedIds.map(id=>inspection.pairs.find(p=>p.id===id));if(selected.some(p=>!p))throw Error('Ausgewählte Gruppe geändert oder nicht eindeutig.');
  const binding=reviewNativeFlatexBindings(model,inspection.identities,assignments,{stale});
  const draft=structuredClone(model),parsed={headers:[...CSV_FIELDS],rows:[],sourceIdentities:{},sourceName:''};
  const touched=new Set();let evidenceUpdates=0;
  for(const proof of selected.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))){
   validateNetSettlement(proof);
   const dc=binding.contexts.find(c=>c.sourceId===proof.depot.sourceId),cc=binding.contexts.find(c=>c.sourceId===proof.account.sourceId);
   if(!dc?.confirmed||!cc?.confirmed||dc.accountId===cc.accountId)throw Error('Beide eigenen Depot-/Kontozuordnungen aktuell bestätigen.');
   const assets=draft.positions.filter(p=>p.accountId===dc.accountId&&p.isin===proof.isin),cash=draft.positions.filter(p=>p.accountId===cc.accountId&&p.kind==='cash'&&p.currency==='EUR'&&!p.wallet?.enabled);
   if(assets.length!==1||cash.length!==1)throw Error('Je ISIN und Cashkonto muss genau eine passende bestehende EUR-Position vorliegen.');
   const p=assets[0],c=cash[0];
   if(!['etf','stock','fund'].includes(p.kind)||p.currency!=='EUR'||p.wallet?.enabled||p.providerId!==c.providerId||p.archived||c.archived)throw Error('Nur eigene aktive EUR-Positionen beim selben Anbieter.');
   const prior=draft.bookings.find(b=>b.netSettlement?.id===proof.id);
   if((draft.flatexNetRemovals||[]).some(r=>[r.booking.netSettlement.depot,r.booking.netSettlement.account].some(s=>[proof.depot,proof.account].some(n=>sourceKey(s)===sourceKey(n)))))throw Error('Zurückgenommene Wirtschaftsgruppe bleibt gegen Wiederimport gesperrt.');
   if(prior){
    if(prior.positionId!==p.id||prior.cashPositionId!==c.id||!sourceUnmodified(draft,prior))throw Error('Vorhandene Gruppe oder Bindung geändert.');
    for(const type of ['depot','account']){
     const old=prior.netSettlement[type],next=proof[type];if(old.payloadDigest!==next.payloadDigest||sourceKey(old)!==sourceKey(next))throw Error('Geänderte Originalquelle bleibt Konflikt.');
     for(const occurrence of next.occurrences)if(!old.occurrences.some(o=>o.documentDigest===occurrence.documentDigest&&o.line===occurrence.line)){old.occurrences.push(occurrence);evidenceUpdates++;}
    }
    prior.importSource.ownedSnapshot=bookingOwnership(draft,prior);
   }else{
    if(draft.bookings.some(b=>b.importSource&&[proof.depot,proof.account].some(s=>importSourceKey(b.importSource)===importSourceKey({...s,accountId:b.accountId}))))throw Error('Bereits vorhandenes Stück-/Cashbein benötigt einen gesonderten Ergänzungsvertrag.');
    for(const pos of [p,c]){
     if(pos.costBasisExact!=null||pos.costBasisEUR!=null||pos.realizedPnLExact!=null||pos.realizedPnLEUR!=null)throw Error('Bestätigte Kosten oder Ergebnisse bleiben geschützt.');
     if(model.bookings.some(b=>[b.positionId,b.cashPositionId,b.targetPositionId].includes(pos.id))||model.journalEntries.some(j=>j.postings.some(x=>x.positionId===pos.id)))throw Error('Erster Paar-Append nur ohne vorhandene abhängige Buchungen.');
     touched.add(pos.id);
    }
   }
   const index=parsed.rows.length+2;
   parsed.rows.push({date:proof.date,type:proof.type,position:p.id,quantity:proof.quantityExact,unitPrice:proof.unitPriceExact,feeEUR:'',taxEUR:'',fxRate:'1',cashPosition:c.id,notes:'Flatex EUR-Paar; ungeklärte Verrechnung, Kosten unbekannt.',externalId:proof.depot.externalId});
   parsed.sourceIdentities[index]={sourceId:proof.depot.sourceId,externalId:proof.depot.externalId,sourceEvidence:{version:1,payloadDigest:proof.depot.payloadDigest},costsVerified:false,netSettlement:proof};
  }
  if(touched.size){
   const earliest=selected.map(p=>p.date).sort()[0];
   if(!openingConfirmed||!validCalendarDate(openingDate)||openingDate>=earliest)throw Error('Belegte Anfangsbestände an einem Tag vor den ausgewählten Vorgängen ausdrücklich bestätigen. Heutige Salden sind keine historischen Anfangsbestände.');
   for(const id of touched){
    const p=draft.positions.find(p=>p.id===id),o=draft.openingPositions.find(o=>o.positionId===id);
    if(o&&(o.asOf!==openingDate||units(o.quantityExact)!==units(p.quantityExact??p.quantity)||o.costBasisExact!=null||o.realizedPnLExact!=null))throw Error('Vorhandene Eröffnung bleibt geschützt; Datum und Menge müssen exakt passen.');
    if((draft.snapshots||[]).some(s=>s.byPosition&&Object.hasOwn(s.byPosition,id)&&s.date>=openingDate))throw Error('Vorhandener Referenzstand benötigt gesonderten Endbestandsabgleich.');
    if(!o)draft.openingPositions.push({positionId:id,quantityExact:exact(units(p.quantityExact??p.quantity)),costBasisExact:null,realizedPnLExact:null,source:'observed-opening',asOf:openingDate});
   }
  }
  const preview=previewCSV(draft,parsed,Object.fromEntries(CSV_FIELDS.map(k=>[k,k])));
  if(preview.issues.length)throw Error(preview.issues[0].message);
  preview.baseline=JSON.stringify(model);preview.evidenceUpdates=evidenceUpdates;
  validateFlatexNetSettlements(preview.simulated);
  return {kind:'flatex-native-trade-preview',eligible:true,ready:false,writeEnabled:false,reason:'',prepared,preview};
 }catch(e){return blocked(e.message);}
}
/** Persistent guarded full-group withdrawal, not source erasure or session undo. */
export function withdrawFlatexNetGroups(model,ids){
 validateFlatexNetSettlements(model);
 if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw Error('Wirtschaftsgruppen ausdrücklich auswählen.');
 const selected=ids.map(id=>model.bookings.find(b=>b.netSettlement?.id===id));if(selected.some(b=>!b))throw Error('Aktive Wirtschaftsgruppe fehlt.');
 const chosen=new Set(selected.map(b=>b.journalEntryId));
 for(const b of selected){const j=model.journalEntries.find(j=>j.id===b.journalEntryId),touched=new Set([b.positionId,b.cashPositionId]);
  if(model.journalEntries.some(e=>!chosen.has(e.id)&&e.sequence>j.sequence&&e.postings.some(p=>touched.has(p.positionId)))||model.bookings.some(x=>!chosen.has(x.journalEntryId)&&[x.positionId,x.cashPositionId,x.targetPositionId].some(id=>touched.has(id))&&!model.journalEntries.some(e=>e.id===x.journalEntryId)))throw Error('Spätere oder ungeklärte abhängige Buchungen sperren die Gruppenrücknahme.');
 }
 const draft=structuredClone(model);draft.flatexNetRemovals??=[];
 for(const original of selected.sort((a,b)=>model.journalEntries.find(j=>j.id===b.journalEntryId).sequence-model.journalEntries.find(j=>j.id===a.journalEntryId).sequence)){
  const b=draft.bookings.find(b=>b.id===original.id),j=draft.journalEntries.find(j=>j.id===b.journalEntryId);
  for(const post of j.postings.filter(p=>p.positionId)){
   const p=draft.positions.find(p=>p.id===post.positionId),next=units(p.quantityExact??p.quantity)-units(post.quantityDeltaExact);if(next<0n)throw Error('Rücknahme würde negativen Bestand erzeugen.');p.quantityExact=exact(next);p.quantity=Number(p.quantityExact);
  }
  draft.flatexNetRemovals.push({version:1,booking:b,journal:j});draft.bookings=draft.bookings.filter(x=>x.id!==b.id);draft.journalEntries=draft.journalEntries.filter(x=>x.id!==j.id);
 }
 if(!ledgerQuantityAudit(draft).ok)fail();validateFlatexNetSettlements(draft);return draft;
}
export function prepareFlatexNetWithdrawalPreview(model,documents,assignments,options){
 const checked=prepareFlatexNetPreview(model,documents,assignments,options);
 if(!checked.eligible)return checked;
 if(checked.preview.ready)return {...checked,eligible:false,reason:'Nur vorhandene Wirtschaftsgruppen können zurückgenommen werden.',preview:null};
 try{
  const next=withdrawFlatexNetGroups(model,options.selectedIds);
  return {...checked,withdrawal:true,preview:{...checked.preview,ready:options.selectedIds.length,duplicates:0,simulated:next,baseline:JSON.stringify(model),rows:checked.preview.rows.map(r=>({...r,status:'ready'}))}};
 }catch(e){return {...checked,eligible:false,reason:e.message,preview:null};}
}
/** Only append exact documentary occurrences to an otherwise identical booking. */
export function netEvidenceExtension(before,after){
 try{
  if(!before.netSettlement||before.netSettlement.id!==after.netSettlement?.id||!before.importSource||!after.importSource)return false;
  const normalized=structuredClone(after);
  for(const type of ['depot','account']){
   const prior=before.netSettlement[type].occurrences,next=after.netSettlement[type].occurrences;
   if(next.length<prior.length||prior.some((o,i)=>!equal(o,next[i])))return false;
   normalized.netSettlement[type].occurrences=structuredClone(prior);
  }
  normalized.importSource.ownedSnapshot=before.importSource.ownedSnapshot;
  return equal(before,normalized);
 }catch{return false;}
}
