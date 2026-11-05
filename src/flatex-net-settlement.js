/** Bounded EUR Depot12/Konto10 groups over the existing CSV/journal core. */
import {parseFlatexNativeCSV,FLATEX_NATIVE_COLUMNS,FLATEX_DEPOT13_COLUMNS,FLATEX_ACCOUNT8_COLUMNS,bindNativeFlatexSourceContext} from './flatex-native.js';
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
function documentFor(type,fields,source={}){
 const columns=source.dialect==='depot13'&&type==='depot'?FLATEX_DEPOT13_COLUMNS:source.dialect==='account8'&&type==='account'?FLATEX_ACCOUNT8_COLUMNS:source.dialect===undefined?FLATEX_NATIVE_COLUMNS[type]:null;if(!columns||!Array.isArray(fields)||fields.length!==columns.length||fields.some(v=>typeof v!=='string'||v.length>300))fail();
 const doc=parseFlatexNativeCSV([columns.map(c=>quote(c.header)).join(';'),fields.map(quote).join(';')].join('\n'));
 return source.dialect?bindNativeFlatexSourceContext(doc,source.sourceContext):doc;
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
  if(!identity.sourceId||!identity.externalId)continue;
  const k=sourceKey(identity),previous=seen.get(k);
  const occurrence={documentDigest:digests[di],line:row.line,fields:[...row.fields]};
  if(previous){if(previous.payloadDigest!==identity.payloadDigest)previous.conflict=true;if(!previous.occurrences.some(o=>o.documentDigest===occurrence.documentDigest&&o.line===occurrence.line))previous.occurrences.push(occurrence);continue;}
  const s={type:doc.type,...(doc.dialect?{dialect:doc.dialect,sourceContext:{...doc.sourceContext}}:{}),sourceId:identity.sourceId,externalId:identity.externalId,payloadDigest:identity.payloadDigest,fields:[...row.fields],occurrences:[occurrence]};
  seen.set(k,s);unique.push(s);
 }
 const buckets=new Map();
 for(const s of unique){const k=JSON.stringify([s.type,s.dialect??null,s.sourceContext??null]),list=buckets.get(k)||[];list.push(s);buckets.set(k,list);}
 const grouped=[...buckets.values()];
 const docs=grouped.map(rows=>{
  const first=rows[0],single=documentFor(first.type,first.fields,first);
  const doc=parseFlatexNativeCSV([single.columns.map(c=>quote(c.header)).join(';'),...rows.map(s=>s.fields.map(quote).join(';'))].join('\n'));
  return first.dialect?bindNativeFlatexSourceContext(doc,first.sourceContext):doc;
 });
 if(!docs.length)return {identities,pairs:[],reviewCount:identities.rows.length};
 const links=inspectNativeFlatexOrderLinks(docs,{maxDays:0}),audit=auditNativeFlatexSettlementAmounts(docs,{maxDays:0});
 const pairs=[];
 for(const [i,g]of links.groups.entries()){
  const a=audit.entries[i];if(g.status!=='possible-single'||a.status==='review'||a.currency!=='EUR')continue;
  const depot=grouped[g.depot[0].sourceIndex][g.depot[0].line-2],account=grouped[g.cash[0].sourceIndex][g.cash[0].line-2];
  if(depot.conflict||account.conflict)continue;
  const d=docs[g.depot[0].sourceIndex].rows.find(r=>r.line===g.depot[0].line),c=docs[g.cash[0].sourceIndex].rows.find(r=>r.line===g.cash[0].line);
  if(d.dates.bookingDate!==c.dates.bookingDate||d.dates.valueDate!==c.dates.valueDate||d.values.unit!==(depot.dialect==='depot13'?'Stück':'Stk.'))continue;
  if(depot.dialect==='depot13'&&(d.numbers.fxRate!=='1'||d.values.amountCurrency!=='EUR'))continue;
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
  const s=proof[type];keys(s,'type sourceId externalId payloadDigest fields occurrences'+(s.dialect!==undefined?' dialect sourceContext':''));
  if((s.dialect===undefined&&s.sourceContext!==undefined)||(s.dialect!==undefined&&!['depot13','account8'].includes(s.dialect)))fail();
  if(s.type!==type||!Array.isArray(s.occurrences)||!s.occurrences.length||s.occurrences.length>20)fail();
  const doc=documentFor(type,s.fields,s),id=inspectNativeFlatexSourceIdentities([doc]).rows[0];
  if(id.status!=='candidate-source'||s.sourceId!==id.sourceId||s.externalId!==id.externalId||s.payloadDigest!==id.payloadDigest)fail();
  const seen=new Set();
  for(const o of s.occurrences){
   keys(o,'documentDigest line fields');if(!/^[a-f0-9]{64}$/.test(o.documentDigest)||!Number.isSafeInteger(o.line)||o.line<2||o.line>5001)fail();
   const key=JSON.stringify([o.documentDigest,o.line]);if(seen.has(key))fail();seen.add(key);
   const other=inspectNativeFlatexSourceIdentities([documentFor(type,o.fields,s)]).rows[0];
   if(other.payloadDigest!==s.payloadDigest||other.sourceId!==s.sourceId||other.externalId!==s.externalId)fail();
  }
  if(!s.occurrences.some(o=>equal(o.fields,s.fields)))fail();docs.push(doc);
 }
 const found=inspectFlatexNetPairs(docs).pairs[0];if(!found)fail();
 for(const k of ['id','orderReference','type','date','valueDate','isin','quantityExact','unitPriceExact','grossExact','cashExact','differenceExact'])if(proof[k]!==found[k])fail();
 return proof;
}
export const hasFlatexNetState=m=>m?.flatexNetRemovals!==undefined||(m?.bookings||[]).some(b=>b.netSettlement!==undefined)||(m?.journalEntries||[]).some(j=>j.netSettlementId!==undefined||j.status==='unresolved-net-settlement'||j.postings?.some(p=>p.role==='unresolved-net-amount'));
/** Validate the retained native trade independently of current ownership.
 * Imported editing and ordinary CSV replay do not acquire this permission. */
function validateOriginalTrade(b,j,s){
 if(!b||!j||b.netAugmentation!==undefined||b.netSettlement!==undefined||!['buy','sell'].includes(s.type)||b.type!==s.type||b.date!==s.date||b.journalEntryId!==j.id||j.type!==s.type||j.date!==b.date||j.source!=='csv'||j.status!=='unresolved-clearing'||j.netSettlementId!==undefined||j.cashPositionId||b.cashPositionId||b.targetPositionId||b.transferMatch||b.external!==false||b.costsVerified!==false||b.feeEUR!==null||b.taxEUR!==null||b.fxRate!==1||b.unitPrice!==Number(s.unitPriceExact)||b.amountEUR!==Number(s.grossExact)||units(b.amountExactEUR)!==units(s.grossExact)||units(b.quantityExact)!==units(s.quantityExact)||b.quantity!==Number(s.quantityExact))fail();
 validateImportSource(b.importSource,b.accountId);validateJournalEntry(j);
 if(b.importSource.sourceId!==s.depot.sourceId||b.importSource.externalId!==s.depot.externalId||!sourceUnmodified({journalEntries:[j]},b))fail();
 const row=JSON.parse(b.importSource.sourcePayload);
 keys(row,'type date positionId quantity unitPrice feeEUR taxEUR fxRate cashPositionId notes externalId sourceEvidence');
 if(row.type!==b.type||row.date!==b.date||row.positionId!==b.positionId||row.cashPositionId||row.notes!==b.notes||row.externalId!==s.depot.externalId||row.feeEUR!==null||row.taxEUR!==null||units(row.quantity)!==units(s.quantityExact)||units(row.unitPrice)!==units(s.unitPriceExact)||units(row.fxRate)!==units('1')||!equal(row.sourceEvidence,{version:1,payloadDigest:s.depot.payloadDigest}))fail();
 if(j.postings.length!==2)fail();
 const [asset,clearing]=j.postings,sign=s.type==='buy'?1n:-1n;
 if(asset.role!=='asset'||asset.positionId!==b.positionId||asset.accountId!==b.accountId||units(asset.quantityDeltaExact)!==sign*units(s.quantityExact)||units(asset.amountBookEURExact)!==sign*units(s.grossExact)||clearing.role!=='clearing'||clearing.positionId!==null||clearing.accountId!==null||clearing.quantityDeltaExact!==null||units(clearing.amountBookEURExact)!==-sign*units(s.grossExact))fail();
}
/** One deterministic transition; original IDs, timestamp, sequence and asset
 * posting survive. Exact original booking/journal bytes live in the new audit. */
function augmentedTrade(original,journal,proof,cashPositionId){
 validateOriginalTrade(original,journal,proof);
 const b=structuredClone(original),j=structuredClone(journal);
 const audit={version:1,booking:structuredClone(original),journal:structuredClone(journal)};
 b.cashPositionId=cashPositionId;b.netSettlement=structuredClone(proof);b.netAugmentation=audit;
 b.reconciliationStatus='unresolved-net-settlement';
 j.cashPositionId=cashPositionId;j.netSettlementId=proof.id;j.status='unresolved-net-settlement';
 const cash=j.postings[1];cash.role='cash';cash.positionId=cashPositionId;
 // The account is bound by the caller and checked against the model below.
 cash.accountId=null;cash.quantityDeltaExact=proof.cashExact;cash.amountBookEURExact=proof.cashExact;
 j.postings.push({id:proof.id+'-difference',role:'unresolved-net-amount',positionId:null,accountId:null,quantityDeltaExact:null,amountBookEURExact:exact((proof.type==='buy'?-1n:1n)*units(proof.grossExact)-units(proof.cashExact))});
 const row=JSON.parse(original.importSource.sourcePayload);
 Object.assign(row,{cashPositionId,tradeAmountEURExact:proof.grossExact,netSettlementId:proof.id,netCashExact:proof.cashExact,netAugmentationDigest:sourceDigest(JSON.stringify(audit))});
 b.importSource.sourcePayload=JSON.stringify(row);
 return {booking:b,journal:j};
}
function completeAugmentation(original,journal,proof,cash){
 const result=augmentedTrade(original,journal,proof,cash.id);
 result.journal.postings[1].accountId=cash.accountId;
 result.booking.importSource.ownedSnapshot=bookingOwnership({journalEntries:[result.journal]},result.booking);
 return result;
}
function validateNetAugmentation(b,j){
 const a=b.netAugmentation;keys(a,'version booking journal');if(a.version!==1)fail();
 const cash=j.postings.find(p=>p.role==='cash');if(!cash?.positionId||!cash.accountId)fail();
 const expected=completeAugmentation(a.booking,a.journal,b.netSettlement,{id:cash.positionId,accountId:cash.accountId});
 if(!equal(expected.booking,b)||!equal(expected.journal,j))fail();
}
/** Explicit complete native trade batch: existing share effects and originals
 * are immutable. Only verified net cash and its unresolved counterpart change. */
function augmentModel(model,proofs,bindings,openingDate){
 validateFlatexNetSettlements(model);
 if(!Array.isArray(proofs)||!proofs.length||proofs.length>2500||new Set(proofs.map(p=>p.id)).size!==proofs.length||!validCalendarDate(openingDate)||!ledgerQuantityAudit(model).ok)fail();
 const trades=[],touched=new Set(),selected=new Set(),sourceKeys=new Set();
 for(const proof of proofs){
  validateNetSettlement(proof);if(!['buy','sell'].includes(proof.type)||openingDate>=proof.date)fail();
  const binding=bindings.find(b=>b.groupId===proof.id);if(!binding)fail();
  const p=model.positions.find(p=>p.id===binding.assetId),c=model.positions.find(p=>p.id===binding.cashId);
  if(!p||!c||p.id===c.id||p.accountId===c.accountId||p.providerId!==c.providerId||p.currency!=='EUR'||c.currency!=='EUR'||!['etf','stock','fund'].includes(p.kind)||p.isin!==proof.isin||c.kind!=='cash'||p.archived||c.archived||p.wallet?.enabled||c.wallet?.enabled||p.managementSource==='wallet'||c.managementSource==='wallet')fail();
  for(const pos of [p,c])if(pos.costBasisExact!=null||pos.costBasisEUR!=null||pos.realizedPnLExact!=null||pos.realizedPnLEUR!=null)fail();
  const matches=model.bookings.filter(b=>b.accountId===p.accountId&&b.importSource?.sourceId===proof.depot.sourceId&&b.importSource.externalId===proof.depot.externalId);
  if(matches.length!==1)fail();const old=matches[0],j=model.journalEntries.find(j=>j.id===old.journalEntryId);
  validateOriginalTrade(old,j,proof);if(old.positionId!==p.id||selected.has(old.id))fail();
  for(const source of [proof.depot,proof.account]){const key=sourceKey(source);if(sourceKeys.has(key))fail();sourceKeys.add(key);}
  selected.add(old.id);touched.add(p.id);touched.add(c.id);trades.push({proof,p,c,old,j});
 }
 const journalIds=new Set(trades.map(t=>t.j.id));
 if(model.bookings.some(b=>!selected.has(b.id)&&[b.positionId,b.cashPositionId,b.targetPositionId].some(id=>touched.has(id)))||model.journalEntries.some(j=>!journalIds.has(j.id)&&j.postings.some(x=>touched.has(x.positionId)))||model.externalCashFlows.some(f=>selected.has(f.id))||(model.snapshots||[]).some(s=>s.byPosition&&[...touched].some(id=>Object.hasOwn(s.byPosition,id))&&s.date>=openingDate))fail();
 if((model.flatexNetRemovals||[]).some(r=>[r.booking.netSettlement.depot,r.booking.netSettlement.account].some(s=>sourceKeys.has(sourceKey(s))))||model.bookings.some(b=>!selected.has(b.id)&&b.importSource&&sourceKeys.has(sourceKey(b.importSource))))fail();
 // A complete selected history is required for every touched security. Never
 // infer a new historical opening from today's balance or from a partial batch.
 for(const id of touched){
  const p=model.positions.find(p=>p.id===id),o=model.openingPositions.find(o=>o.positionId===id);
  if(!o||o.costBasisExact!=null||o.realizedPnLExact!=null)fail();
  if(p.kind==='cash'){
   if(units(o.quantityExact)!==units(p.quantityExact??p.quantity)||(o.asOf!=null&&o.asOf!==openingDate))fail();
  }else{
   if((units(o.quantityExact)!==0n&&!o.asOf)||(o.asOf!=null&&(!validCalendarDate(o.asOf)||o.asOf>openingDate)))fail();
   const sum=trades.filter(t=>t.p.id===id).reduce((n,t)=>n+(t.proof.type==='buy'?1n:-1n)*units(t.proof.quantityExact),0n);
   if(units(o.quantityExact)+sum!==units(p.quantityExact??p.quantity))fail();
  }
 }
 const draft=structuredClone(model),cashBalances=new Map();
 // Date and original journal sequence preserve the already committed timeline.
 // A batch cannot conceal an intermediate negative cash balance.
 for(const {proof,c,old,j} of trades.sort((a,b)=>a.proof.date.localeCompare(b.proof.date)||a.j.sequence-b.j.sequence)){
  const balance=(cashBalances.get(c.id)??units(c.quantityExact??c.quantity))+units(proof.cashExact);if(balance<0n)fail();cashBalances.set(c.id,balance);
  const changed=completeAugmentation(old,j,proof,c);
  draft.bookings[draft.bookings.findIndex(b=>b.id===old.id)]=changed.booking;
  draft.journalEntries[draft.journalEntries.findIndex(e=>e.id===j.id)]=changed.journal;
 }
 for(const [id,balance]of cashBalances){const p=draft.positions.find(p=>p.id===id);p.quantityExact=exact(balance);p.quantity=Number(p.quantityExact);draft.openingPositions.find(o=>o.positionId===id).asOf=openingDate;}
 draft.version=5;validateFlatexNetSettlements(draft);if(!ledgerQuantityAudit(draft).ok)fail();return draft;
}
export function prepareFlatexNetAugmentationPreview(model,documents,assignments,{selectedIds=[],openingDate='',openingConfirmed=false,stale=false}={}){
 const inspection=inspectFlatexNetPairs(documents),prepared={...inspection,issues:[]};
 const blocked=reason=>({kind:'flatex-native-trade-preview',eligible:false,ready:false,writeEnabled:false,reason,preview:null,prepared});
 try{
  if(stale||!openingConfirmed||!Array.isArray(selectedIds)||!selectedIds.length||selectedIds.length>2500||new Set(selectedIds).size!==selectedIds.length)throw Error('Bestehende native Stückbuchungen vollständig auswählen und den belegten Cashanfang vor dem Stapel bestätigen.');
  const proofs=selectedIds.map(id=>inspection.pairs.find(p=>p.id===id));if(proofs.some(p=>!p))fail();
  const bindings=reviewNativeFlatexBindings(model,inspection.identities,assignments,{stale}),resolved=[];
  for(const proof of proofs){
   const dc=bindings.contexts.find(c=>c.sourceId===proof.depot.sourceId),cc=bindings.contexts.find(c=>c.sourceId===proof.account.sourceId);
   if(!dc?.confirmed||!cc?.confirmed)throw Error('Beide eigenen Depot-/Kontozuordnungen aktuell bestätigen.');
   const assets=model.positions.filter(p=>p.accountId===dc.accountId&&p.isin===proof.isin),cash=model.positions.filter(p=>p.accountId===cc.accountId&&p.kind==='cash'&&p.currency==='EUR');
   if(assets.length!==1||cash.length!==1)fail();resolved.push({groupId:proof.id,assetId:assets[0].id,cashId:cash[0].id});
  }
  const simulated=augmentModel(model,proofs,resolved,openingDate);
  const marker=proofs.length===1?{version:1,groupId:proofs[0].id,openingDate}:{version:2,groupIds:proofs.map(p=>p.id).sort(),openingDate};
  return {kind:'flatex-native-trade-preview',eligible:true,ready:false,writeEnabled:false,reason:'',prepared,preview:{baseline:JSON.stringify(model),simulated,issues:[],ready:proofs.length,duplicates:0,skipped:0,netAugmentation:marker,rows:resolved.map((b,i)=>({line:i+2,status:'ready',row:{positionId:b.assetId,cashPositionId:b.cashId}}))}};
 }catch(e){return blocked(e.message);}
}
/** Re-derive the ENTIRE allowed delta, including selected count and bindings. */
export function validateNetAugmentationTransition(model,next,marker){
 let ids;
 if(marker?.version===1){keys(marker,'version groupId openingDate');ids=[marker.groupId];}
 else{keys(marker,'version groupIds openingDate');if(marker.version!==2||!Array.isArray(marker.groupIds)||marker.groupIds.length<2||marker.groupIds.length>2500||new Set(marker.groupIds).size!==marker.groupIds.length||!equal([...marker.groupIds].sort(),marker.groupIds))fail();ids=marker.groupIds;}
 const bookings=ids.map(id=>next.bookings.find(b=>b.netSettlement?.id===id));if(bookings.some(b=>!b?.netAugmentation))fail();
 const expected=augmentModel(model,bookings.map(b=>b.netSettlement),bookings.map(b=>({groupId:b.netSettlement.id,assetId:b.positionId,cashId:b.cashPositionId})),marker.openingDate);
 if(!equal(expected,next))fail();return ids.length;
}
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
 if(b.netAugmentation!==undefined||payload.netAugmentationDigest!==undefined)validateNetAugmentation(b,j);
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
 if((model.bookings||[]).some(b=>b.netAugmentation!==undefined&&!b.netSettlement))fail();
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
  const touched=new Set(),augmentedRepeats=[];let evidenceUpdates=0;
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
     const bookings=model.bookings.filter(b=>[b.positionId,b.cashPositionId,b.targetPositionId].includes(pos.id));
     const journals=model.journalEntries.filter(j=>j.postings.some(x=>x.positionId===pos.id));
     if(bookings.length||journals.length){
      // Extend only an intact, chronologically earlier net-pair ledger. Existing
      // quantities/openings are the baseline, never a new inferred opening.
      const opening=model.openingPositions.find(o=>o.positionId===pos.id);
      if(!opening?.asOf||!validCalendarDate(opening.asOf)||opening.asOf>=proof.date||opening.costBasisExact!=null||opening.realizedPnLExact!=null||!ledgerQuantityAudit(model).ok||
       bookings.some(b=>!b.netSettlement||!sourceUnmodified(model,b)||b.date>=proof.date)||
       journals.some(j=>j.date>=proof.date||!bookings.some(b=>b.journalEntryId===j.id&&b.netSettlement)))throw Error('Neue EUR-Paare nur nach unveränderten früheren Wirtschaftsgruppen mit belegtem Anfangsbestand. Andere oder gleichdatierte Buchungen benötigen einen gesonderten Abgleich.');
      if((model.snapshots||[]).some(s=>s.byPosition&&Object.hasOwn(s.byPosition,pos.id)&&s.date>=proof.date))throw Error('Vorhandener Referenzstand benötigt gesonderten Endbestandsabgleich.');
     }else touched.add(pos.id);
    }
   }
   // Its source payload also binds the retained original. Ordinary CSV rows
   // cannot reconstruct or overwrite that audit on a later paired replay.
   if(prior?.netAugmentation){augmentedRepeats.push({line:parsed.rows.length+augmentedRepeats.length+2,status:'duplicate',row:{positionId:p.id,cashPositionId:c.id}});continue;}
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
  preview.rows.push(...augmentedRepeats);preview.duplicates+=augmentedRepeats.length;
  if(preview.issues.length)throw Error(preview.issues[0].message);
  preview.baseline=JSON.stringify(model);preview.evidenceUpdates=evidenceUpdates;
  validateFlatexNetSettlements(preview.simulated);
  return {kind:'flatex-native-trade-preview',eligible:true,ready:false,writeEnabled:false,reason:'',prepared,preview};
 }catch(e){return blocked(e.message);}
}
/** Reconstruct an unjournaled observed closing balance from separately supplied
 * dated openings. The regular pair engine performs every economic posting.
 * Nothing is inferred by subtracting trades from today's holdings.
 * Existing reference values are retained byte for byte, and only observations
 * strictly AFTER the selected history can coexist with this bounded backfill.
 */
export function prepareFlatexNetBackfillPreview(model,documents,assignments,options={}){
 const inspection=inspectFlatexNetPairs(documents);
 const blocked=reason=>({kind:'flatex-native-trade-preview',eligible:false,ready:false,writeEnabled:false,reason,preview:null,prepared:{...inspection,issues:[]}});
 try{
  validateFlatexNetSettlements(model);
  const {selectedIds=[],openingDate='',openingConfirmed=false,openingQuantities={},expectedClosing={},closingConfirmed=false,stale=false}=options;
  if(stale||!Array.isArray(selectedIds)||!selectedIds.length||selectedIds.length>2500||new Set(selectedIds).size!==selectedIds.length)throw Error('Eindeutige EUR-Paare ausdrücklich auswählen.');
  const proofs=selectedIds.map(id=>inspection.pairs.find(p=>p.id===id));
  if(proofs.some(p=>!p))throw Error('Ausgewählte Gruppe geändert oder nicht eindeutig.');
  if((model.flatexNetRemovals||[]).some(r=>[r.booking.netSettlement.depot,r.booking.netSettlement.account].some(s=>proofs.some(p=>[p.depot,p.account].some(n=>sourceKey(s)===sourceKey(n))))))throw Error('Zurückgenommene Wirtschaftsgruppe bleibt gegen Wiederimport gesperrt.');
  // Exact repeats use the existing identity/evidence rules, never reopen a balance.
  const prior=proofs.filter(p=>model.bookings.some(b=>b.netSettlement?.id===p.id));
  if(prior.length===proofs.length)return prepareFlatexNetPreview(model,documents,assignments,{selectedIds,stale});
  if(prior.length)throw Error('Vorhandene und neue Gruppen getrennt prüfen; kein teilweiser Endbestandsersatz.');
  const binding=reviewNativeFlatexBindings(model,inspection.identities,assignments,{stale}),ids=new Set();
  for(const proof of proofs){
   const dc=binding.contexts.find(c=>c.sourceId===proof.depot.sourceId),cc=binding.contexts.find(c=>c.sourceId===proof.account.sourceId);
   if(!dc?.confirmed||!cc?.confirmed||dc.accountId===cc.accountId)throw Error('Beide eigenen Depot-/Kontozuordnungen aktuell bestätigen.');
   const asset=model.positions.filter(p=>p.accountId===dc.accountId&&p.isin===proof.isin),cash=model.positions.filter(p=>p.accountId===cc.accountId&&p.kind==='cash'&&p.currency==='EUR'&&!p.wallet?.enabled);
   if(asset.length!==1||cash.length!==1)throw Error('Jede ISIN und jedes Cashkonto eindeutig zuordnen.');
   ids.add(asset[0].id);ids.add(cash[0].id);
  }
  const first=proofs.map(p=>p.date).sort()[0],last=proofs.map(p=>p.date).sort().at(-1);
  if(!openingConfirmed||!closingConfirmed||!validCalendarDate(openingDate)||openingDate>=first)throw Error('Belegte Anfangsmengen vor der Historie und unabhängige Endbestände ausdrücklich bestätigen.');
  if(!openingQuantities||typeof openingQuantities!=='object'||Array.isArray(openingQuantities)||!expectedClosing||typeof expectedClosing!=='object'||Array.isArray(expectedClosing)||[openingQuantities,expectedClosing].some(o=>Object.keys(o).sort().join('|')!==[...ids].sort().join('|')))throw Error('Für jede betroffene Position genau eine belegte Anfangsmenge und einen Endbestand eingeben.');
  if(!ledgerQuantityAudit(model).ok)throw Error('Vorhandenes Journal widerspricht den Beständen.');
  for(const id of ids){
   const p=model.positions.find(p=>p.id===id),o=model.openingPositions.find(o=>o.positionId===id);
   if(p.wallet?.enabled||p.managementSource==='wallet'||p.archived||[p.costBasisExact,p.costBasisEUR,p.realizedPnLExact,p.realizedPnLEUR,o?.costBasisExact,o?.realizedPnLExact].some(v=>v!=null)||o&&(o.source!=='observed-opening'||o.asOf!=null||units(o.quantityExact)!==units(p.quantityExact??p.quantity)))throw Error('Datierte Eröffnungen, Wallets und bestätigte Kosten oder Ergebnisse bleiben geschützt.');
   if(model.bookings.some(b=>[b.positionId,b.cashPositionId,b.targetPositionId].includes(id))||model.journalEntries.some(j=>j.postings.some(p=>p.positionId===id)))throw Error('Vorhandene Buchungen oder Journale im betroffenen Bereich benötigen einen gesonderten Abgleich.');
   if(typeof openingQuantities[id]!=='string'||!openingQuantities[id].trim()||units(openingQuantities[id])<0n||typeof expectedClosing[id]!=='string'||!expectedClosing[id].trim()||units(expectedClosing[id])!==units(p.quantityExact??p.quantity))throw Error('Unabhängiger Endbestand muss exakt dem beobachteten Bestand entsprechen; Anfangsmenge nicht ableiten.');
  }
  for(const s of model.snapshots||[]){
   if(!s.byPosition)throw Error('Ein Gesamt- oder manueller Referenzstand benötigt einen gesonderten Abgleich.');
   if([...ids].some(id=>Object.hasOwn(s.byPosition,id))&&(s.source!=='current'||s.date<=last))throw Error('Referenzstände innerhalb oder vor der Historie bleiben geschützt.');
  }
  const draft=structuredClone(model);
  // Remove references only on the detached simulation; restore their exact bytes
  // below after proving the entire closing quantity is unchanged.
  draft.snapshots=[];
  draft.openingPositions=draft.openingPositions.filter(o=>!ids.has(o.positionId));
  for(const id of ids){const p=draft.positions.find(p=>p.id===id);p.quantityExact=exact(units(openingQuantities[id]));p.quantity=Number(p.quantityExact);}
  const result=prepareFlatexNetPreview(draft,documents,assignments,{selectedIds,openingDate,openingConfirmed:true,stale});
  if(!result.eligible)throw Error(result.reason);
  for(const id of ids){const p=result.preview.simulated.positions.find(p=>p.id===id);if(units(p.quantityExact??p.quantity)!==units(expectedClosing[id]))throw Error('Die ausgewählten Paare ergeben nicht exakt die unabhängig belegten Endbestände.');}
  result.preview.simulated.snapshots=structuredClone(model.snapshots);
  // Even presentation/quote fields of observed positions stay byte-identical.
  result.preview.simulated.positions=structuredClone(model.positions);
  const openings=result.preview.simulated.openingPositions;
  result.preview.simulated.openingPositions=[...structuredClone(model.openingPositions.filter(o=>!ids.has(o.positionId))),...openings.filter(o=>ids.has(o.positionId))];
  if(!ledgerQuantityAudit(result.preview.simulated).ok)throw Error('Historie und unveränderte Endbestände widersprechen sich.');
  result.preview.baseline=JSON.stringify(model);
  result.preview.netBackfill=true;
  return result;
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
