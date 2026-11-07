/** Bounded EUR Depot12/Konto10 groups over the existing CSV/journal core. */
import {parseFlatexNativeCSV,FLATEX_NATIVE_COLUMNS,FLATEX_DEPOT13_COLUMNS,FLATEX_ACCOUNT8_COLUMNS,bindNativeFlatexSourceContext} from './flatex-native.js';
import {inspectNativeFlatexSourceIdentities,sourceDigest,sourceUnmodified,bookingOwnership,importSourceKey,validateImportSource} from './import-identity.js';
import {inspectNativeFlatexOrderLinks} from './flatex-settlements.js';
import {auditNativeFlatexSettlementAmounts} from './flatex-settlement-audit.js';
import {reviewNativeFlatexBindings} from './flatex-native-ui.js';
import {units,exact,preciseValue,SCALE} from './decimal.js';
import {validCalendarDate,ledgerQuantityAudit,validateJournalEntry,executeTransaction} from './transactions.js';
import {previewCSV,CSV_FIELDS} from './csv-import.js';
import {validateFlatexNetReconciliations} from './flatex-net-reconciliation.js';
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
  if(g.status==='multiple-depot-review'&&[2,3].includes(g.depot.length)&&g.cash.length===1){
   const executions=g.depot.map(l=>grouped[l.sourceIndex][l.line-2]).sort((a,b)=>sourceKey(a).localeCompare(sourceKey(b))),account=grouped[g.cash[0].sourceIndex][g.cash[0].line-2];
   try{const proof=multiFillProof(executions,account,g),members=[...executions,account];
    const original=identities.rows.filter(r=>r.orderReference===g.orderReference);
    if(original.every(r=>r.sourceId&&r.externalId&&r.status!=='conflict'&&members.some(s=>sourceKey(s)===sourceKey(r)&&s.payloadDigest===r.payloadDigest))&&!members.some(s=>s.conflict))pairs.push(proof);
   }catch{}
   continue;
  }
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
 if(isMultiFill(proof))return validateMultiFillProof(proof);
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
  validateNetSettlement(proof);if(proof.version!==1)fail();if(!['buy','sell'].includes(proof.type)||openingDate>=proof.date)fail();
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
  const proofs=selectedIds.map(id=>inspection.pairs.find(p=>p.id===id));if(proofs.some(p=>!p||p.version!==1))fail();
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
 if(b.netAugmentation?.version===3){
  keys(b.netAugmentation,'version fundingId');
  if(b.netFundingMember!=='trade'||!b.netFunding||b.netAugmentation.fundingId!==b.netFunding.id||b.netReconciliation!==undefined||payload.netAugmentationDigest!==undefined)fail();
 }else if(b.netAugmentation?.version===2){
  // Versioned capability: old v287 validators reject this reserved audit tag.
  keys(b.netAugmentation,'version reconciliationId');
  if(!b.netReconciliation||b.netAugmentation.reconciliationId!==b.netReconciliation.id||payload.netAugmentationDigest!==undefined)fail();
 }else{
  if(b.netReconciliation!==undefined)fail();
  if(b.netAugmentation!==undefined||payload.netAugmentationDigest!==undefined)validateNetAugmentation(b,j);
 }
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
 const multiGroups=new Map();for(const b of model.bookings||[])if(isMultiFill(b.netSettlement)){const list=multiGroups.get(b.netSettlement.id)||[];list.push(b);multiGroups.set(b.netSettlement.id,list);}
 for(const members of multiGroups.values()){const proof=validateMultiFillMembers(model,members);ids.add(proof.id);for(const source of [...proof.executions,proof.account]){const k=sourceKey(source);if(sources.has(k))fail();sources.add(k);}for(const b of members)journalIds.add(b.journalEntryId);}
 const reserve=s=>{if(ids.has(s.id))fail();ids.add(s.id);for(const source of [s.depot,s.account]){const key=sourceKey(source);if(sources.has(key))fail();sources.add(key);}};
 if((model.bookings||[]).some(b=>(b.netAugmentation!==undefined||b.netMember!==undefined)&&!b.netSettlement||b.netMember!==undefined&&!isMultiFill(b.netSettlement)))fail();
 for(const b of model.bookings||[])if(b.netSettlement!==undefined&&!isMultiFill(b.netSettlement)){const j=model.journalEntries.find(j=>j.id===b.journalEntryId);reserve(validateGroup(model,b,j));journalIds.add(j.id);}
 for(const j of model.journalEntries||[])if((j.netSettlementId!==undefined||j.status==='unresolved-net-settlement'||j.postings.some(p=>p.role==='unresolved-net-amount'))&&!journalIds.has(j.id))fail();
 if(model.flatexNetRemovals!==undefined){
  if(!Array.isArray(model.flatexNetRemovals)||model.flatexNetRemovals.length>2500)fail();
  for(const r of model.flatexNetRemovals){keys(r,'version booking journal');if(r.version!==1||model.bookings.some(b=>b.id===r.booking?.id)||model.journalEntries.some(j=>j.id===r.journal?.id))fail();reserve(validateGroup(model,r.booking,r.journal,{removed:true}));}
 }
 validateFlatexFunding(model);
 return validateFlatexNetReconciliations(model);
}
/** Explicit selected groups only; unrelated unresolved rows remain visible. */
export function prepareFlatexNetPreview(model,documents,assignments,{selectedIds=[],openingDate='',openingConfirmed=false,stale=false,mode}={}){
 const offered=inspectFlatexNetPairs(documents);if(selectedIds.some(id=>isMultiFill(offered.pairs.find(p=>p.id===id))))return prepareMultiFillPreview(model,documents,assignments,{selectedIds,openingDate,openingConfirmed,stale,mode});
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
    if(prior.netFunding)throw Error('Finanzierte Gruppe im ausdrücklich bestätigten Finanzierungsmodus erneut prüfen.');
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
  if(proofs.some(p=>!p||p.version!==1))throw Error('Ausgewählte Gruppe benötigt den Import mit belegtem Anfangsbestand; Endbestandsersatz für 2:1 bleibt gesperrt.');
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
 if(model.bookings.some(b=>b.netFunding&&ids.includes(b.netFunding.settlement.id)))throw Error('Finanzierung und Kauf nur über vollständiges Sitzungs-Undo oder geprüftes Backup zurücknehmen.');
 if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw Error('Wirtschaftsgruppen ausdrücklich auswählen.');
 if(model.bookings.some(b=>b.netReconciliation?.groupIds.some(id=>ids.includes(id))))throw Error('Datierter Bestandsabgleich schützt diese Gruppen. Nur vollständiges Sitzungs-Undo oder geprüftes Backup wiederherstellen.');
 if(ids.some(id=>model.bookings.some(b=>b.netSettlement?.id===id&&isMultiFill(b.netSettlement))))throw Error('Mehrgliedrige Gruppen nur über vollständiges Sitzungs-Undo oder geprüftes Backup zurücknehmen.');
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
  if(before.netFunding)return fundingEvidenceExtension(before,after);
  if(!before.netSettlement||before.netSettlement.id!==after.netSettlement?.id||!before.importSource||!after.importSource)return false;
  const normalized=structuredClone(after);
  for(const path of isMultiFill(before.netSettlement)?['depot','account',...before.netSettlement.executions.map((_,i)=>String(i))]:['depot','account']){
   const type=path,oldSource=/^[012]$/.test(type)?before.netSettlement.executions[Number(type)]:before.netSettlement[type],newSource=/^[012]$/.test(type)?after.netSettlement.executions[Number(type)]:after.netSettlement[type],target=/^[012]$/.test(type)?normalized.netSettlement.executions[Number(type)]:normalized.netSettlement[type];
   const prior=oldSource.occurrences,next=newSource.occurrences;
   if(next.length<prior.length||prior.some((o,i)=>!equal(o,next[i])))return false;
   target.occurrences=structuredClone(prior);
  }
  normalized.importSource.ownedSnapshot=before.importSource.ownedSnapshot;
  return equal(before,normalized);
 }catch{return false;}
}

/** Exactly two or three separately identified executions and one documentary EUR payment.
 * No price average and no per-execution cash, charges or basis allocation. */
const isMultiFill=proof=>proof?.version===2||proof?.version===3;
const fillCount=proof=>proof?.version===2?2:proof?.version===3?3:0;
function multiFillProof(executions,account,g){
 if(![2,3].includes(executions.length)||executions.some(s=>s.sourceId!==executions[0].sourceId)||new Set(executions.map(sourceKey)).size!==executions.length)fail();
 const version=executions.length;
 for(const s of [...executions,account])if(inspectNativeFlatexSourceIdentities([documentFor(s.type,s.fields,s)]).rows[0].status!=='candidate-source')fail();
 const rows=executions.map(s=>documentFor('depot',s.fields,s).rows[0]),c=documentFor('account',account.fields,account).rows[0];
 const fills=rows.map((r,i)=>{
  const n=units(r.numbers.nominal),q=n<0n?-n:n,s=executions[i];
  if(r.values.priceCurrency!=='EUR'||r.values.unit!==(s.dialect==='depot13'?'Stück':'Stk.')||q<=0n||(g.type==='buy'?n<=0n:n>=0n)||r.dates.bookingDate!==c.dates.bookingDate||r.dates.valueDate!==c.dates.valueDate||s.dialect==='depot13'&&(r.numbers.fxRate!=='1'||r.values.amountCurrency!=='EUR'))fail();
  if(q*units(r.numbers.rate)%SCALE!==0n)fail();
  const grossExact=preciseValue(exact(q),r.numbers.rate);if(s.dialect==='depot13'&&units(r.numbers.amount)!==(g.type==='buy'?-1n:1n)*units(grossExact))fail();
  return {quantityExact:exact(q),unitPriceExact:r.numbers.rate,grossExact};
 });
 if(c.values.amountCurrency!=='EUR'||(g.type==='buy'?units(c.numbers.amount)>=0n:units(c.numbers.amount)<=0n))fail();
 const quantityExact=exact(fills.reduce((n,f)=>n+units(f.quantityExact),0n)),grossExact=exact(fills.reduce((n,f)=>n+units(f.grossExact),0n)),cashExact=c.numbers.amount;
 return {version,id:'fn-'+sourceDigest(JSON.stringify(version===2?[executions.map(sourceKey),sourceKey(account)]:[3,executions.map(s=>[sourceKey(s),s.payloadDigest]),[sourceKey(account),account.payloadDigest]])),orderReference:g.orderReference,type:g.type,date:c.dates.bookingDate,valueDate:c.dates.valueDate,isin:g.isin,quantityExact,grossExact,cashExact,differenceExact:exact(units(cashExact)+(g.type==='buy'?1n:-1n)*units(grossExact)),depot:executions[0],executions,account,fills};
}
function validateMultiFillProof(proof){
 keys(proof,'version id orderReference type date valueDate isin quantityExact grossExact cashExact differenceExact depot executions account fills');
 if(!isMultiFill(proof)||!Array.isArray(proof.executions)||proof.executions.length!==fillCount(proof)||!equal(proof.depot,proof.executions[0]))fail();
 const docs=[];
 for(const s of [...proof.executions,proof.account]){
  keys(s,'type sourceId externalId payloadDigest fields occurrences'+(s.dialect!==undefined?' dialect sourceContext':''));
  if(s.type!==(docs.length<fillCount(proof)?'depot':'account')||!Array.isArray(s.occurrences)||!s.occurrences.length||s.occurrences.length>20)fail();
  const doc=documentFor(s.type,s.fields,s),r=inspectNativeFlatexSourceIdentities([doc]).rows[0];
  if(r.status!=='candidate-source'||s.sourceId!==r.sourceId||s.externalId!==r.externalId||s.payloadDigest!==r.payloadDigest)fail();
  const seen=new Set();for(const o of s.occurrences){keys(o,'documentDigest line fields');const key=JSON.stringify([o.documentDigest,o.line]);if(!/^[a-f0-9]{64}$/.test(o.documentDigest)||!Number.isSafeInteger(o.line)||o.line<2||o.line>5001||seen.has(key))fail();seen.add(key);const row=inspectNativeFlatexSourceIdentities([documentFor(s.type,o.fields,s)]).rows[0];if(row.sourceId!==s.sourceId||row.externalId!==s.externalId||row.payloadDigest!==s.payloadDigest)fail();}
  if(!s.occurrences.some(o=>equal(o.fields,s.fields)))fail();docs.push(doc);
 }
 const links=inspectNativeFlatexOrderLinks(docs,{maxDays:0}),g=links.groups[0];
 if(links.groups.length!==1||links.unassigned.length||g.status!=='multiple-depot-review'||g.depot.length!==fillCount(proof)||g.cash.length!==1||[...proof.executions].sort((a,b)=>sourceKey(a).localeCompare(sourceKey(b))).some((s,i)=>s!==proof.executions[i]))fail();
 const found=multiFillProof(proof.executions,proof.account,g);
 if(!equal(found,proof))fail();return proof;
}
function validateMultiFillMembers(model,members){
 if(!members.length)fail();const proof=validateMultiFillProof(members[0].netSettlement),count=fillCount(proof),roles=new Set(),journalIds=new Set();if(members.length!==count+1)fail();
 for(const b of members){
  if(!equal(b.netSettlement,proof)||![...proof.executions.map((_,i)=>'fill-'+i),'cash'].includes(b.netMember)||roles.has(b.netMember)||b.netAugmentation!==undefined||b.netReconciliation!==undefined)fail();roles.add(b.netMember);
  const j=model.journalEntries.find(j=>j.id===b.journalEntryId);if(!j||journalIds.has(j.id))fail();journalIds.add(j.id);validateJournalEntry(j);validateImportSource(b.importSource,b.accountId);
  const isCash=b.netMember==='cash',index=Number(b.netMember.slice(-1)),source=isCash?proof.account:proof.executions[index],f=isCash?null:proof.fills[index],p=model.positions.find(p=>p.id===b.positionId),sign=proof.type==='buy'?1n:-1n;
  if(!p||p.currency!=='EUR'||p.wallet?.enabled||p.managementSource==='wallet'||b.accountId!==p.accountId||b.date!==proof.date||j.date!==proof.date||j.type!==b.type||j.source!=='csv'||j.netSettlementId!==proof.id||j.status!=='unresolved-net-settlement'||b.reconciliationStatus!==j.status||b.external!==false||b.transferMatch||b.targetPositionId||b.cashPositionId||j.cashPositionId||b.costsVerified!==false||b.feeEUR!==null||b.taxEUR!==null||b.fxRate!==1||!sourceUnmodified(model,b)||b.importSource.sourceId!==source.sourceId||b.importSource.externalId!==source.externalId)fail();
  const payload=JSON.parse(b.importSource.sourcePayload);
  if(!equal(payload,{version:proof.version,netSettlementId:proof.id,member:b.netMember,sourceEvidence:{version:1,payloadDigest:source.payloadDigest},positionId:b.positionId}))fail();
  const q=isCash?(units(proof.cashExact)<0n?-units(proof.cashExact):units(proof.cashExact)):units(f.quantityExact),amt=isCash?q:units(f.grossExact);
  if(b.type!==(isCash?(proof.type==='buy'?'withdraw':'deposit'):proof.type)||units(b.quantityExact)!==q||b.quantity!==Number(exact(q))||units(b.amountExactEUR)!==amt||b.amountEUR!==Number(exact(amt))||b.unitPrice!==Number(isCash?'1':f.unitPriceExact))fail();
  const first=j.postings[0],other=j.postings[1];
  if(first.positionId!==p.id||first.accountId!==p.accountId||first.role!==(isCash?'cash':'asset')||units(first.quantityDeltaExact)!==(isCash?units(proof.cashExact):sign*q)||units(first.amountBookEURExact)!==(isCash?units(proof.cashExact):sign*amt)||other.positionId!==null||other.accountId!==null||other.quantityDeltaExact!==null||other.role!=='clearing'||units(other.amountBookEURExact)!==(isCash?sign*units(proof.grossExact):-sign*amt))fail();
  if(isCash){const d=j.postings[2];if(p.kind!=='cash'||j.postings.length!==3||!d||d.role!=='unresolved-net-amount'||d.positionId!==null||d.accountId!==null||d.quantityDeltaExact!==null||units(d.amountBookEURExact)!==-units(proof.cashExact)-sign*units(proof.grossExact))fail();}
  else if(!['stock','etf','fund'].includes(p.kind)||p.isin!==proof.isin||j.postings.length!==2||[p.costBasisExact,p.costBasisEUR,p.realizedPnLExact,p.realizedPnLEUR].some(v=>v!=null))fail();
  if(model.externalCashFlows.some(flow=>flow.id===b.id))fail();
 }
 const c=members.find(b=>b.netMember==='cash'),fills=members.filter(b=>b.netMember!=='cash'),cp=model.positions.find(p=>p.id===c.positionId),asset=model.positions.find(p=>p.id===fills[0].positionId);
 if(fills.some(b=>b.positionId!==asset.id)||cp.accountId===asset.accountId||cp.providerId!==asset.providerId)fail();
 const seq=members.map(b=>model.journalEntries.find(j=>j.id===b.journalEntryId).sequence);if(new Set(seq).size!==count+1||seq[0]===undefined||model.journalEntries.find(j=>j.id===c.journalEntryId).sequence!==Math.max(...seq))fail();
 return proof;
}
function prepareMultiFillPreview(model,documents,assignments,{selectedIds=[],openingDate='',openingConfirmed=false,stale=false,mode}={}){
 const inspection=inspectFlatexNetPairs(documents),prepared={...inspection,issues:[]},blocked=reason=>({kind:'flatex-native-trade-preview',eligible:false,ready:false,writeEnabled:false,reason,preview:null,prepared});
 try{
  validateFlatexNetSettlements(model);if(stale||mode&&mode!=='net'||!Array.isArray(selectedIds)||!selectedIds.length||selectedIds.length>2500||new Set(selectedIds).size!==selectedIds.length)fail();
  const selected=selectedIds.map(id=>inspection.pairs.find(p=>p.id===id));if(selected.some(p=>!p))fail();
  const bindings=reviewNativeFlatexBindings(model,inspection.identities,assignments,{stale}),draft=structuredClone(model),rows=[];let duplicates=0,evidenceUpdates=0;
  for(const proof of selected.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))){
   if(proof.version===1){const p=prepareFlatexNetPreview(draft,documents,assignments,{selectedIds:[proof.id],openingDate,openingConfirmed,stale});if(!p.eligible)throw Error(p.reason);Object.assign(draft,p.preview.simulated);rows.push(...p.preview.rows);duplicates+=p.preview.duplicates;continue;}
   validateMultiFillProof(proof);
   const dc=bindings.contexts.find(c=>c.sourceId===proof.depot.sourceId),cc=bindings.contexts.find(c=>c.sourceId===proof.account.sourceId);
   if(!dc?.confirmed||!cc?.confirmed||dc.accountId===cc.accountId)throw Error('Beide eigenen Depot-/Kontozuordnungen aktuell bestätigen.');
   const assets=draft.positions.filter(p=>p.accountId===dc.accountId&&p.isin===proof.isin),cash=draft.positions.filter(p=>p.accountId===cc.accountId&&p.kind==='cash'&&p.currency==='EUR');if(assets.length!==1||cash.length!==1)fail();
   const p=assets[0],c=cash[0];if(p.currency!=='EUR'||!['stock','etf','fund'].includes(p.kind)||p.providerId!==c.providerId||[p,c].some(p=>p.archived||p.wallet?.enabled||p.managementSource==='wallet'||[p.costBasisExact,p.costBasisEUR,p.realizedPnLExact,p.realizedPnLEUR].some(v=>v!=null)))fail();
   const previous=draft.bookings.filter(b=>b.netSettlement?.id===proof.id);
   if(previous.length){validateMultiFillMembers(draft,previous);if(previous.some(b=>b.positionId!==(b.netMember==='cash'?c.id:p.id)))fail();
    const merged=structuredClone(previous[0].netSettlement);
    for(const [old,next]of [...merged.executions.map((s,i)=>[s,proof.executions[i]]),[merged.account,proof.account]]){
     if(old.payloadDigest!==next.payloadDigest||sourceKey(old)!==sourceKey(next))fail();
     for(const o of next.occurrences)if(!old.occurrences.some(x=>x.documentDigest===o.documentDigest&&x.line===o.line))old.occurrences.push(structuredClone(o));
    }
    merged.depot=structuredClone(merged.executions[0]);validateMultiFillProof(merged);
    if(!equal(merged,previous[0].netSettlement)){for(const b of previous){b.netSettlement=structuredClone(merged);b.importSource.ownedSnapshot=bookingOwnership(draft,b);}evidenceUpdates++;}
    duplicates+=proof.executions.length+1;rows.push(...previous.map(b=>({line:rows.length+2,status:'duplicate',row:{netSettlement:proof,notes:b.netMember}})));continue;}
   const sources=[...proof.executions,proof.account],sameSource=s=>sources.some(n=>sourceKey(s)===sourceKey(n));
   if(draft.bookings.some(b=>b.importSource&&sameSource(b.importSource)||b.netSettlement&&[b.netSettlement.depot,b.netSettlement.account,...(b.netSettlement.executions||[])].some(sameSource))||(draft.flatexNetRemovals||[]).some(r=>[r.booking.netSettlement.depot,r.booking.netSettlement.account].some(sameSource)))throw Error('Bereits vorhandene Teilmengen oder zurückgenommene Quellen sperren die vollständige Ausführungsgruppe.');
   for(const pos of [p,c]){
    const old=draft.bookings.filter(b=>[b.positionId,b.cashPositionId,b.targetPositionId].includes(pos.id)),journals=draft.journalEntries.filter(j=>j.postings.some(x=>x.positionId===pos.id)),o=draft.openingPositions.find(o=>o.positionId===pos.id);
    if((model.snapshots||[]).some(s=>!s.byPosition||Object.hasOwn(s.byPosition,pos.id)))throw Error('Vorhandene Referenzstände benötigen einen gesonderten Mehrfachausführungs-Abgleich.');
    if(o&&(o.costBasisExact!=null||o.realizedPnLExact!=null))fail();
    if(old.length||journals.length){if(!o?.asOf||o.asOf>=proof.date||old.some(b=>!b.netSettlement||b.date>=proof.date||!sourceUnmodified(draft,b))||journals.some(j=>j.date>=proof.date||!old.some(b=>b.journalEntryId===j.id)))throw Error('Widersprüchliche oder gleichdatierte Historie bleibt gesperrt.');}
    else{if(!openingConfirmed||!validCalendarDate(openingDate)||openingDate>=proof.date)throw Error('Unabhängig belegte Anfangsbestände vor der vollständigen Ausführungsgruppe bestätigen.');if(o&&(o.asOf!==openingDate||units(o.quantityExact)!==units(pos.quantityExact??pos.quantity)||o.costBasisExact!=null||o.realizedPnLExact!=null))fail();if(!o)draft.openingPositions.push({positionId:pos.id,quantityExact:exact(units(pos.quantityExact??pos.quantity)),costBasisExact:null,realizedPnLExact:null,source:'observed-opening',asOf:openingDate});}
   }
   for(let i=0;i<=proof.executions.length;i++){
    const isCash=i===proof.executions.length,f=proof.fills[i],s=isCash?proof.account:proof.executions[i],member=isCash?'cash':'fill-'+i;
    const ev=executeTransaction(draft,{date:proof.date,type:isCash?(proof.type==='buy'?'withdraw':'deposit'):proof.type,positionId:isCash?c.id:p.id,quantity:isCash?exact(units(proof.cashExact)<0n?-units(proof.cashExact):units(proof.cashExact)):f.quantityExact,unitPrice:isCash?'1':f.unitPriceExact,...(isCash?{}:{tradeAmountEURExact:f.grossExact}),feeEUR:0,taxEUR:0,fxRate:'1',notes:isCash?'Flatex '+proof.executions.length+':1 · gemeinsamer Nettocash; Differenz ungeklärt.':'Flatex '+proof.executions.length+':1 · eigenständige Ausführung; Kosten unbekannt.'});
    const b=draft.bookings.find(b=>b.id===ev.id),j=draft.journalEntries.find(j=>j.id===b.journalEntryId);b.netSettlement=structuredClone(proof);b.netMember=member;b.external=false;b.feeEUR=null;b.taxEUR=null;b.costsVerified=false;b.reconciliationStatus='unresolved-net-settlement';j.source='csv';j.netSettlementId=proof.id;j.status=b.reconciliationStatus;
    if(isCash){draft.externalCashFlows=draft.externalCashFlows.filter(f=>f.id!==b.id);const sign=proof.type==='buy'?1n:-1n;j.postings[1].role='clearing';j.postings[1].amountBookEURExact=exact(sign*units(proof.grossExact));j.postings.push({id:proof.id+'-difference',role:'unresolved-net-amount',positionId:null,accountId:null,quantityDeltaExact:null,amountBookEURExact:exact(-units(proof.cashExact)-sign*units(proof.grossExact))});}
    else{const a=draft.positions.find(a=>a.id===p.id);a.costBasisExact=null;a.costBasisEUR=null;a.realizedPnLExact=null;a.realizedPnLEUR=null;}
    b.importSource={version:1,sourceId:s.sourceId,accountId:b.accountId,externalId:s.externalId,sourcePayload:JSON.stringify({version:proof.version,netSettlementId:proof.id,member,sourceEvidence:{version:1,payloadDigest:s.payloadDigest},positionId:b.positionId}),fileId:proof.id+':'+member,occurrence:1,ownership:'imported',ownedSnapshot:''};b.importSource.ownedSnapshot=bookingOwnership(draft,b);rows.push({line:rows.length+2,status:'ready',row:{netSettlement:proof,netMember:member,quantityExact:b.quantityExact,unitPriceExact:isCash?'1':f.unitPriceExact,grossExact:b.amountExactEUR,positionId:b.positionId,notes:b.notes}});
   }
   draft.version=5;
  }
  validateFlatexNetSettlements(draft);if(!ledgerQuantityAudit(draft).ok)fail();
  return {kind:'flatex-native-trade-preview',eligible:true,ready:false,writeEnabled:false,reason:'',prepared,preview:{baseline:JSON.stringify(model),simulated:draft,rows,issues:[],ready:rows.filter(r=>r.status==='ready').length,duplicates,skipped:0,evidenceUpdates}};
 }catch(e){return blocked(e.message);}
}

/** One explicit external funding source beside the immutable V1 order proof.
 * Booking dates drive the existing ledger. Shared value dates never reorder it. */
function fundingSourceRow(source){
 keys(source,'type sourceId externalId payloadDigest fields occurrences'+(source.dialect!==undefined?' dialect sourceContext':''));
 if(source.type!=='account'||!Array.isArray(source.occurrences)||!source.occurrences.length||source.occurrences.length>20)fail();
 const doc=documentFor('account',source.fields,source),identity=inspectNativeFlatexSourceIdentities([doc]).rows[0],seen=new Set();
 if((identity.status!=='candidate-source'&&!(identity.status==='source-review'&&equal(identity.reasons,['Quellereignis ungeklärt; keine Buchungsannahme.'])))||source.sourceId!==identity.sourceId||source.externalId!==identity.externalId||source.payloadDigest!==identity.payloadDigest)fail();
 for(const o of source.occurrences){
  keys(o,'documentDigest line fields');const k=JSON.stringify([o.documentDigest,o.line]);
  if(!/^[a-f0-9]{64}$/.test(o.documentDigest)||!Number.isSafeInteger(o.line)||o.line<2||o.line>5001||seen.has(k))fail();seen.add(k);
  const other=inspectNativeFlatexSourceIdentities([documentFor('account',o.fields,source)]).rows[0];
  if(other.sourceId!==source.sourceId||other.externalId!==source.externalId||other.payloadDigest!==source.payloadDigest)fail();
 }
 if(!source.occurrences.some(o=>equal(o.fields,source.fields)))fail();return doc.rows[0];
}
function fundingReference(row){return /^Kauf\s+([A-Z]{2}[A-Z0-9]{10})\s+(\d+)\s*$/i.exec(row.values.details);}
function fundingProof(settlement,funding){
 const row=fundingSourceRow(funding),ref=fundingReference(row);
 if(settlement.version!==1||settlement.type!=='buy'||!ref||ref[1].toUpperCase()!==settlement.isin||ref[2]!==settlement.orderReference||funding.sourceId!==settlement.account.sourceId||sourceKey(funding)===sourceKey(settlement.account)||row.values.amountCurrency!=='EUR'||row.numbers.amount===null||units(row.numbers.amount)<=0n||units(row.numbers.amount)!==-units(settlement.cashExact)||row.dates.valueDate!==settlement.valueDate||!validCalendarDate(row.dates.bookingDate)||row.dates.bookingDate>settlement.valueDate)fail();
 return {version:1,id:'ff-'+sourceDigest(JSON.stringify([settlement.id,sourceKey(funding)])),role:'external',date:row.dates.bookingDate,valueDate:row.dates.valueDate,cashExact:exact(units(row.numbers.amount)),settlement:structuredClone(settlement),funding:structuredClone(funding)};
}
export function validateFlatexFundingProof(proof){
 keys(proof,'version id role date valueDate cashExact settlement funding');
 validateNetSettlement(proof.settlement);const expected=fundingProof(proof.settlement,proof.funding);
 if(!equal(expected,proof))fail();return proof;
}
/** Documentary offers never infer account ownership or approve any role. */
export function inspectFlatexFundingGroups(documents){
 const inspection=inspectFlatexNetPairs(documents),sources=new Map(),byLine=documents.map(d=>new Map(d.rows.map(r=>[r.line,r]))),digests=documents.map(d=>sourceDigest(JSON.stringify([d.type,d.rows.map(r=>r.fields)])));
 for(const r of inspection.identities.rows){
  if(r.sourceType!=='account'||!r.sourceId||!r.externalId)continue;
  const doc=documents[r.sourceIndex],row=byLine[r.sourceIndex].get(r.line),key=sourceKey(r);
  const previous=sources.get(key);
  const occurrence={documentDigest:digests[r.sourceIndex],line:row.line,fields:[...row.fields]};
  if(previous){if(previous.payloadDigest!==r.payloadDigest||r.status==='conflict')previous.conflict=true;if(!previous.occurrences.some(o=>o.documentDigest===occurrence.documentDigest&&o.line===occurrence.line))previous.occurrences.push(occurrence);}
  else sources.set(key,{type:'account',...(doc.dialect?{dialect:doc.dialect,sourceContext:{...doc.sourceContext}}:{}),sourceId:r.sourceId,externalId:r.externalId,payloadDigest:r.payloadDigest,fields:[...row.fields],occurrences:[occurrence],...(r.status==='conflict'?{conflict:true}:{})});
 }
 const groups=[],byReference=new Map();
 for(const s of sources.values()){const ref=fundingReference(documentFor('account',s.fields,s).rows[0]);if(!ref)continue;const key=JSON.stringify([ref[1].toUpperCase(),ref[2]]),list=byReference.get(key)||[];list.push(s);byReference.set(key,list);}
 for(const pair of inspection.pairs.filter(p=>p.version===1&&p.type==='buy')){
  const candidates=byReference.get(JSON.stringify([pair.isin,pair.orderReference]))||[];
  if(candidates.length!==1||candidates[0].conflict)continue;
  try{const proof=fundingProof(pair,candidates[0]);validateFlatexFundingProof(proof);groups.push(proof);}catch{}
 }
 return {...inspection,fundingGroups:groups};
}
function fundingEvidenceExtension(before,after){
 if(!after.netFunding||before.netFunding.id!==after.netFunding.id)return false;
 const normalized=structuredClone(after),old=before.netFunding,next=normalized.netFunding;
 for(const [a,b]of [[old.settlement.depot,next.settlement.depot],[old.settlement.account,next.settlement.account],[old.funding,next.funding]]){
  if(b.occurrences.length<a.occurrences.length||a.occurrences.some((o,i)=>!equal(o,b.occurrences[i])))return false;
  b.occurrences=structuredClone(a.occurrences);
 }
 if(before.netSettlement)normalized.netSettlement=structuredClone(next.settlement);
 normalized.importSource.ownedSnapshot=before.importSource.ownedSnapshot;
 return equal(before,normalized);
}
/** Completeness and external-flow proof are checked on every backup/load/commit. */
function validateFlatexFunding(model){
 const groups=new Map();
 for(const b of model.bookings||[]){
  if(b.netFundingMember!==undefined&&!b.netFunding)fail();
  if(!b.netFunding)continue;
  validateFlatexFundingProof(b.netFunding);
  const members=groups.get(b.netFunding.id)||[];members.push(b);groups.set(b.netFunding.id,members);
 }
 const used=new Set();
 for(const members of groups.values()){
  if(members.length!==2)fail();
  const trade=members.find(b=>b.netFundingMember==='trade'),credit=members.find(b=>b.netFundingMember==='funding'),f=trade?.netFunding;
  if(!trade||!credit||!equal(f,credit.netFunding)||!equal(trade.netSettlement,f.settlement)||trade.netAugmentation?.version!==3||trade.netAugmentation.fundingId!==f.id||credit.netSettlement!==undefined||credit.netAugmentation!==undefined||credit.netMember!==undefined||credit.netReconciliation!==undefined)fail();
  const cash=model.positions.find(p=>p.id===trade.cashPositionId),j=model.journalEntries.find(j=>j.id===credit.journalEntryId);
  for(const id of [trade.positionId,trade.cashPositionId]){const o=model.openingPositions.find(o=>o.positionId===id),firstDate=id===trade.cashPositionId&&f.date<f.settlement.date?f.date:f.settlement.date;if(!o||!validCalendarDate(o.asOf)||o.asOf>=firstDate)fail();}
  if(!cash||credit.positionId!==cash.id||credit.accountId!==cash.accountId||credit.type!=='deposit'||credit.date!==f.date||credit.external!==true||credit.transferMatch||credit.targetPositionId||credit.cashPositionId||credit.costsVerified!==undefined||credit.quantityExact!==f.cashExact||credit.quantity!==Number(f.cashExact)||credit.amountExactEUR!==f.cashExact||credit.amountEUR!==Number(f.cashExact)||credit.unitPrice!==1||credit.fxRate!==1||credit.feeEUR!==0||credit.taxEUR!==0||credit.reconciliationStatus!=='recorded')fail();
  validateImportSource(credit.importSource,credit.accountId);validateJournalEntry(j);
  if(!sourceUnmodified(model,credit)||credit.importSource.sourceId!==f.funding.sourceId||credit.importSource.externalId!==f.funding.externalId||j.source!=='csv'||j.date!==f.date||j.type!=='deposit'||j.cashPositionId||j.status!=='recorded'||j.postings.length!==2)fail();
  const [own,external]=j.postings;
  if(own.role!=='cash'||own.positionId!==cash.id||own.accountId!==cash.accountId||own.quantityDeltaExact!==f.cashExact||own.amountBookEURExact!==f.cashExact||external.role!=='external-clearing'||external.positionId!==null||external.accountId!==null||external.quantityDeltaExact!==null||units(external.amountBookEURExact)!==-units(f.cashExact))fail();
  const row=JSON.parse(credit.importSource.sourcePayload);
  const expected={type:'deposit',date:f.date,positionId:cash.id,quantity:f.cashExact,unitPrice:'1',feeEUR:'0',taxEUR:'0',fxRate:'1',cashPositionId:'',notes:credit.notes,externalId:f.funding.externalId,sourceEvidence:{version:1,payloadDigest:f.funding.payloadDigest},netFundingId:f.id,netFundingMember:'funding'};
  if(!equal(row,expected))fail();
  for(const b of members){const r=JSON.parse(b.importSource.sourcePayload);if(r.netFundingId!==f.id||r.netFundingMember!==b.netFundingMember)fail();}
  const flows=model.externalCashFlows.filter(x=>x.id===credit.id);
  if(flows.length!==1||flows[0].date!==f.date||flows[0].amountExactEUR!==f.cashExact||flows[0].amountEUR!==Number(f.cashExact)||model.externalCashFlows.some(x=>x.id===trade.id))fail();
  for(const s of [f.settlement.depot,f.settlement.account,f.funding]){
   const k=sourceKey(s);if(used.has(k))fail();used.add(k);
   if(model.bookings.some(b=>!members.includes(b)&&(b.importSource&&sourceKey(b.importSource)===k||b.netSettlement&&[b.netSettlement.depot,b.netSettlement.account,...(b.netSettlement.executions||[])].some(n=>n&&sourceKey(n)===k)))||
    (model.flatexNetRemovals||[]).some(r=>[r.booking.netSettlement.depot,r.booking.netSettlement.account].some(n=>n&&sourceKey(n)===k)))fail();
  }
 }
}
/** Bounded append/replay in the existing CSV/transaction ledger, without a
 * cash-netting shortcut, retroactive opening or alternative financial engine. */
export function prepareFlatexFundingPreview(model,documents,assignments,{selectedIds=[],fundingRoles={},openingDate='',openingConfirmed=false,stale=false}={}){
 const inspection=inspectFlatexFundingGroups(documents),prepared={...inspection,issues:[]};
 const blocked=reason=>({kind:'flatex-native-trade-preview',eligible:false,ready:false,writeEnabled:false,reason,preview:null,prepared});
 try{
  validateFlatexNetSettlements(model);if(!ledgerQuantityAudit(model).ok)fail();
  if(stale||!Array.isArray(selectedIds)||!selectedIds.length||selectedIds.length>2500||new Set(selectedIds).size!==selectedIds.length||!fundingRoles||Array.isArray(fundingRoles)||Object.keys(fundingRoles).sort().join('|')!==[...selectedIds].sort().join('|'))throw Error('Jede ausgewählte Finanzierung einzeln als externen Zufluss bestätigen.');
  const selected=selectedIds.map(id=>inspection.fundingGroups.find(f=>f.settlement.id===id));
  if(selected.some(f=>!f)||selectedIds.some(id=>!equal(fundingRoles[id],{role:'external',confirmed:true})))throw Error('Eine eindeutige Finanzierung und aktuelle externe Rolle je ausgewähltem Kauf sind erforderlich.');
  const binding=reviewNativeFlatexBindings(model,inspection.identities,assignments,{stale}),draft=structuredClone(model),events=[],touched=new Map();let evidenceUpdates=0;
  for(let f of selected){
   const proof=f.settlement,dc=binding.contexts.find(c=>c.sourceId===proof.depot.sourceId),cc=binding.contexts.find(c=>c.sourceId===proof.account.sourceId);
   if(!dc?.confirmed||!cc?.confirmed||dc.accountId===cc.accountId)throw Error('Depot und Cashkonto aktuell ausdrücklich zuordnen.');
   const assets=draft.positions.filter(p=>p.accountId===dc.accountId&&p.isin===proof.isin),cash=draft.positions.filter(p=>p.accountId===cc.accountId&&p.kind==='cash'&&p.currency==='EUR');
   if(assets.length!==1||cash.length!==1)fail();const p=assets[0],c=cash[0];
   if(!['etf','stock','fund'].includes(p.kind)||p.currency!=='EUR'||p.providerId!==c.providerId||[p,c].some(x=>x.archived||x.wallet?.enabled||x.managementSource==='wallet'||[x.costBasisExact,x.costBasisEUR,x.realizedPnLExact,x.realizedPnLEUR].some(v=>v!=null)))fail();
   const prior=draft.bookings.find(b=>b.netFunding?.id===f.id&&b.netFundingMember==='trade');
   const keysSelected=[proof.depot,proof.account,f.funding].map(sourceKey);
   if(!prior&&draft.bookings.some(b=>b.importSource&&keysSelected.includes(sourceKey(b.importSource))||b.netSettlement&&[b.netSettlement.depot,b.netSettlement.account,...(b.netSettlement.executions||[])].some(s=>s&&keysSelected.includes(sourceKey(s)))))throw Error('Vorhandene Einzelbeine oder andere Kontozuordnung benötigen einen eigenen Ergänzungsnachweis.');
   if((draft.flatexNetRemovals||[]).some(r=>[r.booking.netSettlement.depot,r.booking.netSettlement.account].some(s=>s&&keysSelected.includes(sourceKey(s)))))fail();
   if(prior){
    if(prior.positionId!==p.id||prior.cashPositionId!==c.id)fail();
    const merged=structuredClone(prior.netFunding);
    for(const [old,next]of [[merged.settlement.depot,f.settlement.depot],[merged.settlement.account,f.settlement.account],[merged.funding,f.funding]]){
     if(sourceKey(old)!==sourceKey(next)||old.payloadDigest!==next.payloadDigest)fail();
     for(const o of next.occurrences)if(!old.occurrences.some(x=>x.documentDigest===o.documentDigest&&x.line===o.line)){old.occurrences.push(o);evidenceUpdates++;}
    }
    const normalized=structuredClone(f);normalized.settlement.depot=merged.settlement.depot;normalized.settlement.account=merged.settlement.account;normalized.funding=merged.funding;
    if(!equal(normalized,merged))fail();f=merged;
    for(const b of draft.bookings.filter(b=>b.netFunding?.id===f.id)){b.netFunding=structuredClone(f);if(b.netSettlement)b.netSettlement=structuredClone(f.settlement);b.importSource.ownedSnapshot=bookingOwnership(draft,b);}
   }else for(const pos of [p,c]){
    const firstDate=pos.id===c.id&&f.date<proof.date?f.date:proof.date,journals=model.journalEntries.filter(j=>j.postings.some(x=>x.positionId===pos.id)),bookings=model.bookings.filter(b=>[b.positionId,b.cashPositionId,b.targetPositionId].includes(pos.id)),opening=model.openingPositions.find(o=>o.positionId===pos.id);
    if(journals.length||bookings.length){if(!opening?.asOf||opening.asOf>=firstDate||journals.some(j=>j.date>=firstDate)||model.bookings.some(b=>[b.positionId,b.cashPositionId,b.targetPositionId].includes(pos.id)&&(!b.netSettlement&&!b.netFunding||!sourceUnmodified(model,b))))throw Error('Neue Finanzierung muss nach der unveränderten belegten Journalhistorie liegen.');}
    else touched.set(pos.id,touched.has(pos.id)&&touched.get(pos.id)<firstDate?touched.get(pos.id):firstDate);
    if(model.snapshots.some(s=>s.byPosition&&Object.hasOwn(s.byPosition,pos.id)&&s.date>=firstDate))throw Error('Vorhandener Referenzstand benötigt gesonderten datierten Abgleich.');
   }
   events.push({f,p,c,member:'trade',date:proof.date},{f,p:c,c:null,member:'funding',date:f.date});
  }
  if(touched.size){
   if(!openingConfirmed||!validCalendarDate(openingDate)||[...touched.values()].some(d=>openingDate>=d))throw Error('Unabhängig belegten Anfangsbestand vor dem frühesten betroffenen Buchtag bestätigen; keine Ableitung aus der Finanzierung.');
   for(const [id]of touched){const p=draft.positions.find(p=>p.id===id),o=draft.openingPositions.find(o=>o.positionId===id);
    if(o&&(o.asOf!==openingDate||units(o.quantityExact)!==units(p.quantityExact??p.quantity)||o.costBasisExact!=null||o.realizedPnLExact!=null))throw Error('Vorhandene Eröffnung bleibt unverändert geschützt.');
    if(model.snapshots.some(s=>!s.byPosition||Object.hasOwn(s.byPosition,id)&&s.date>=openingDate))throw Error('Referenzstand benötigt gesonderten Bestandsabgleich.');
    if(!o)draft.openingPositions.push({positionId:id,quantityExact:exact(units(p.quantityExact??p.quantity)),costBasisExact:null,realizedPnLExact:null,source:'observed-opening',asOf:openingDate});
   }
  }
  const parsed={headers:[...CSV_FIELDS],rows:[],sourceIdentities:{},sourceName:''};
  // Stable same-day order uses the separately booked credit before its order;
  // different booking dates are never changed or netted away.
  events.sort((a,b)=>a.date.localeCompare(b.date)||(a.member==='funding'?0:1)-(b.member==='funding'?0:1)||a.f.id.localeCompare(b.f.id));
  for(const {f,p,c,member,date}of events){const trade=member==='trade',s=trade?f.settlement.depot:f.funding,line=parsed.rows.length+2;
   parsed.rows.push({date,type:trade?'buy':'deposit',position:p.id,quantity:trade?f.settlement.quantityExact:f.cashExact,unitPrice:trade?f.settlement.unitPriceExact:'1',feeEUR:trade?'':'0',taxEUR:trade?'':'0',fxRate:'1',cashPosition:c?.id||'',notes:trade?'Flatex Kauf; Nettocash und ungeklärte Differenz getrennt.':'Flatex Finanzierung; Gegenkonto außerhalb des Portfolios.',externalId:s.externalId});
   parsed.sourceIdentities[line]={sourceId:s.sourceId,externalId:s.externalId,sourceEvidence:{version:1,payloadDigest:s.payloadDigest},costsVerified:!trade,netFunding:f,netFundingMember:member,...(trade?{netSettlement:f.settlement}:{})};
  }
  const preview=previewCSV(draft,parsed,Object.fromEntries(CSV_FIELDS.map(k=>[k,k])));
  if(preview.issues.length)throw Error(preview.issues[0].message+' Buchtag und Valuta bleiben unverändert; kein erfundener Anfangsbestand.');
  validateFlatexNetSettlements(preview.simulated);if(!ledgerQuantityAudit(preview.simulated).ok)fail();
  preview.baseline=JSON.stringify(model);preview.evidenceUpdates=evidenceUpdates;
  return {kind:'flatex-native-trade-preview',eligible:true,ready:false,writeEnabled:false,reason:'',prepared,preview};
 }catch(e){return blocked(e.message);}
}
