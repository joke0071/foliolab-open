import {safeImport,assertDataVersion} from './model.js';
import {syncPayloadDigest} from './sync-payload-integrity.js';
import {units,exact} from './decimal.js';
import {provenCashImport,sourceUnmodified} from './import-identity.js';

/** Bounded credential-free financial gate, NOT crypto/graph/CAS/Apply approval.
 * Unsupported financial evidence blocks the entire snapshot; nothing is pruned.
 * See FLH04_SNAPSHOT_CONTRACT.md for supported accepted history and v5 limits.
 */
export const SYNC_SNAPSHOT_KIND='FolioLabSyncSnapshot';
export const SYNC_SNAPSHOT_VERSION=1;
// Conservative payload budget leaves room for JSON-escaped content+descriptor
// inside the existing 7.4MB frame cipher bound. No existing limit is raised.
export const SYNC_SNAPSHOT_UTF8_LIMIT=3500000;
export const SYNC_SNAPSHOT_NODE_LIMIT=100000;
export const SYNC_SNAPSHOT_DEPTH_LIMIT=16;
const fail=reason=>{throw Error('sync-snapshot-'+reason);};
const unicode=v=>{
 for(let i=0;i<v.length;i++){const c=v.charCodeAt(i);
  if(c>=0xd800&&c<=0xdbff){const n=v.charCodeAt(++i);if(!(n>=0xdc00&&n<=0xdfff))return false;}
  else if(c>=0xdc00&&c<=0xdfff)return false;
 }return true;
};
const scalar=v=>v===null||(typeof v==='string'&&unicode(v))||typeof v==='boolean'||(typeof v==='number'&&Number.isFinite(v));
const array=check=>v=>Array.isArray(v)&&v.every(check);
const object=fields=>v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).every(k=>Object.hasOwn(fields,k)&&fields[k](v[k]));
const nullable=check=>v=>v===null||check(v);
const fields=names=>Object.fromEntries(names.split(' ').map(k=>[k,scalar]));
const decimal=v=>{try{return typeof v==='string'&&exact(units(v))===v;}catch{return false;}};
const map=check=>v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).every(k=>unicode(k)&&k!=='__proto__'&&k!=='constructor'&&k!=='prototype'&&check(v[k]));
const provider=object(fields('id name type'));
const cashTerms=object(fields('version status fixedTerm startDate maturityDate outcome outcomeDate evidence renewalMaturityDate'));
const interestTerms=object({...fields('version dayCount'),rates:array(object(fields('fromDate annualRateExact knownThrough')))});
const account=object({...fields('id providerId name type currency'),cashTerms,interestTerms});
const wallet=object(fields('enabled chain address contract decimals chainId addressType'));
const position=object({...fields('archived id providerId accountId managementSource costBasisEUR costBasisExact realizedPnLEUR realizedPnLExact priceExact priceStatus fxUpdatedAt assetId kind name mic listingId economicRole valuationMode representedByPositionId quoteSource quoteAsOf quoteFetchedAt quoteQuality fxSource fxRateDate fxRateExact eodhdSymbol fmpSymbol tradingViewSymbol exchange symbol isin coinId coinIdMigration quantity quantityExact price currency fxRate updatedAt notes'),wallet:nullable(wallet)});
const listing=object(fields('id symbol mic exchange currency'));
const asset=object({...fields('id key kind name isin coinId'),listings:array(listing)});
const opening=object(fields('positionId quantityExact costBasisExact realizedPnLExact source asOf'));
const flow=object(fields('id date amountEUR amountExactEUR'));
const posting=object(fields('id positionId accountId role quantityDeltaExact amountBookEURExact'));
const basicJournal=object({...fields('id type date recordedAt sequence cashPositionId status source nativeCurrency'),postings:array(posting)});
const journal=v=>basicJournal(v)||cashRemovalJournal(v)||manualCashAuditJournal(v)||usdPrincipalRemovalJournal(v)||stakingRemovalJournal(v);
const quoteTime=object(fields('positionId updatedAt quoteAsOf quoteSource fxRateDate'));
const revision=object({...fields('recordedAt valuationStatus source'),totalEURExact:decimal});
const snapshot=object({...fields('id date total totalEURExact recordedAt valuationStatus source note'),
 byAccount:nullable(map(v=>typeof v==='number'&&Number.isFinite(v))),byPosition:nullable(map(decimal)),
 quoteTimes:array(quoteTime),revisions:array(revision)});
const archive=object({...fields('version'),archivedIds:array(v=>typeof v==='string'),referenceArchivedIds:array(v=>typeof v==='string')});
// Only already canonical accepted history: the existing safeImport history
// validator below checks replay, event IDs, coverage and quotes. Its projection
// must equal every original value, so sorting/dedupe/source cleanup cannot
// silently change a snapshot. Pending/resume data remains unsupported in full.
const historyIdentity=fields('network chainId accountId assetId contract mint');
const historyEvent=object({...historyIdentity,
 ...fields('id walletId txid blockHeight blockHash txIndex timestamp decimals quantityBaseUnits includedInEventId type source status finality observedAt coverage qualityCode'),
 locator:object(fields('kind index subindex'))});
const historyStream=object({...historyIdentity,...fields('decimals throughBlock'),
 opening:nullable(object(fields('quantityBaseUnits beforeBlock source'))),
 coverage:object(fields('status fromBlock toBlock tipHash source'))});
const historyQuote=object({...fields('network chainId assetId contract mint date currency priceExact source binding quality')});
const historySession=object({...fields('walletScopeDigest id chain walletKey acceptedAt decision providerCache'),
 events:array(historyEvent),streams:array(historyStream),quotes:array(historyQuote),issues:array(v=>typeof v==='string'&&unicode(v))});
const history=object({schema:v=>v===1,sessions:array(historySession),pending:v=>Array.isArray(v)&&v.length===0});
// Canonical local CSV or explicitly retained provider history only. safeImport
// validates dates, limits, FX, provenance and the current position binding;
// the unchanged-value comparison below rejects every projected/defaulted field.
const historyText=v=>typeof v==='string'&&unicode(v);
const pricePoint=object({date:historyText,total:v=>typeof v==='number'&&Number.isFinite(v),valuationDate:nullable(historyText)});
const priceFX=object({date:historyText,currency:historyText,rate:historyText,source:historyText,referenceDate:historyText});
const priceProvenance=object({schema:v=>v===1,provider:historyText,identity:historyText,retention:historyText});
const priceHistory=object({currency:historyText,source:historyText,points:array(pricePoint),
 priceType:historyText,fxPoints:array(priceFX),provenance:priceProvenance});
// Documentary provenance only. safeImport calls validatePurchaseEvidence; every
// projected value must stay identical. Stale references gain no new authority.
const purchaseRef=object({id:historyText,fingerprint:historyText});
const purchaseReceipt=object(Object.fromEntries('id provider currency timestamp txid fiatEUR serviceFeeEUR grossBTC miningFeeBTC netBTC'.split(' ').map(k=>[k,historyText])));
const purchaseDecision=object({action:historyText,walletKey:historyText,sessionId:historyText,at:historyText,
 receiptIds:array(historyText),events:array(purchaseRef)});
const purchaseLedger=object({id:historyText,ownerDigest:historyText,txid:historyText,timestamp:historyText,
 amountBTC:historyText,events:array(purchaseRef)});
const purchaseEvidence=object({schema:v=>v===1,receipts:array(purchaseReceipt),decisions:array(purchaseDecision),
 bitcoinLedger:array(purchaseLedger)});
// Only the existing UH02 provenance namespace. JSON inside sourcePayload is
// data too: close its recursive schema before the existing economics validator
// binds receipts, wallet scope, source ownership, journal and external funding.
const bitcoinFacts=object({receipts:array(historyText),events:array(purchaseRef)});
const bitcoinPayload=object({walletScopeDigest:historyText,facts:bitcoinFacts,ledgerRefs:array(historyText)});
const bitcoinPayloadText=v=>{
 if(!historyText(v))return false;
 try{const parsed=JSON.parse(v);structureBudget(parsed);
  return JSON.stringify(parsed)===v&&bitcoinPayload(parsed);
 }catch{return false;}
};
const bitcoinImport=object({version:v=>v===1,sourceId:v=>v==='unified-bitcoin-v1',
 accountId:historyText,externalId:historyText,sourcePayload:bitcoinPayloadText,
 // sourceUnmodified checks this entire string against bookingOwnership of the
 // allowlisted booking/journal. It cannot carry independent extension fields.
 ownedSnapshot:historyText,fileId:historyText,occurrence:v=>Number.isSafeInteger(v)&&v>=1,
 ownership:v=>v==='imported'});
// A complete existing generic cash proof, including durable removal originals.
// JSON strings are closed data schemas too; opaque source/ownership extensions
// must never bypass the credential-free snapshot boundary.
const csvCashPayload=object(Object.fromEntries('type date positionId quantity unitPrice feeEUR taxEUR fxRate cashPositionId notes externalId'.split(' ').map(k=>[k,historyText])));
const csvCashPayloadText=v=>{
 if(!historyText(v))return false;
 try{const parsed=JSON.parse(v);structureBudget(parsed);
  return JSON.stringify(parsed)===v&&csvCashPayload(parsed);
 }catch{return false;}
};
const csvCashImport=object({version:v=>v===1,sourceId:v=>v==='generic-csv',
 accountId:historyText,externalId:historyText,sourcePayload:csvCashPayloadText,
 ownedSnapshot:historyText,fileId:historyText,occurrence:v=>v===1,ownership:v=>v==='imported'});
// Full existing native USD principal provenance, never a blanket Kraken gate.
// The existing financial validators bind these closed bytes to ownership,
// account roles, UNKNOWN postings and the permanent withdrawal digest.
const usdPrincipalStatus='unpriced-native-usd-principal';
const krakenSource='kraken-uh03-v1';
const usdPrincipalAction=object(Object.fromEntries('type date positionId quantity unitPrice feeEUR taxEUR fxRate notes targetPositionId'.split(' ').map(k=>[k,historyText])));
const usdPrincipalPayload=object({group:historyText,payload:historyText,
 bindings:v=>Array.isArray(v)&&v.length===2&&v.every(p=>Array.isArray(p)&&p.length===2&&p.every(historyText)),
 action:v=>usdPrincipalAction(v)&&Object.keys(v).length===10});
const usdPrincipalPayloadText=v=>{
 if(!historyText(v))return false;
 try{const parsed=JSON.parse(v);structureBudget(parsed);
  return JSON.stringify(parsed)===v&&usdPrincipalPayload(parsed)&&Object.keys(parsed).length===4;
 }catch{return false;}
};
const usdPrincipalImport=object({version:v=>v===1,sourceId:v=>v===krakenSource,
 accountId:historyText,externalId:historyText,sourcePayload:usdPrincipalPayloadText,
 ownedSnapshot:historyText,fileId:historyText,occurrence:v=>v===1,ownership:v=>v==='imported'});
const bookingFields=fields('id type date positionId accountId positionName quantity quantityExact unitPrice feeEUR taxEUR fxRate fxRateDate fxSource amountEUR amountExactEUR targetPositionId targetQuantityExact external notes journalEntryId cashPositionId reconciliationStatus costsVerified');
const existingBooking=object({...bookingFields,importSource:bitcoinImport});
const csvCashBooking=object({...bookingFields,importSource:csvCashImport,importFingerprint:historyText});
const usdPrincipalBookingFields=object({...bookingFields,importSource:usdPrincipalImport});
const usdPrincipalBooking=v=>usdPrincipalBookingFields(v)&&v.type==='transfer'&&
 v.reconciliationStatus===usdPrincipalStatus&&v.importSource?.sourceId===krakenSource;
const usdPrincipalJournal=v=>basicJournal(v)&&v.type==='transfer'&&v.source===krakenSource&&v.status===usdPrincipalStatus;
const usdPrincipalOriginal=object({booking:usdPrincipalBooking,journal:usdPrincipalJournal,
 flows:v=>Array.isArray(v)&&v.length===0});
const usdPrincipalRemoval=object({version:v=>v===1,group:historyText,count:v=>v===1,
 originals:v=>Array.isArray(v)&&v.length===1&&v.every(usdPrincipalOriginal),digest:historyText});
const usdPrincipalRemovalJournalFields=object({...fields('id date recordedAt sequence'),
 type:v=>v==='uh03-undo',source:v=>v===krakenSource,status:v=>v==='removed',
 postings:array(posting),krakenWithdrawal:usdPrincipalRemoval});
const usdPrincipalRemovalJournal=v=>usdPrincipalRemovalJournalFields(v)&&v.type==='uh03-undo'&&
 v.source===krakenSource&&v.status==='removed'&&usdPrincipalRemoval(v.krakenWithdrawal);
// Complete ETH principal and reward+fee groups only. This is a scope gate;
// existing import ownership, withdrawal and financial validators stay intact.
const hexDigest=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const stakingPayloadText=v=>{
 if(!historyText(v))return false;
 try{const p=JSON.parse(v);structureBudget(p);
  const a=p.action,n=a?.type==='transfer'?10:9;
  return JSON.stringify(p)===v&&Object.keys(p).length===4&&
   Object.keys(p).every(k=>['group','payload','bindings','action'].includes(k))&&
   hexDigest(p.group)&&hexDigest(p.payload)&&
   Array.isArray(p.bindings)&&p.bindings.length===(n===10?2:1)&&
   p.bindings.every(b=>Array.isArray(b)&&b.length===2&&hexDigest(b[0])&&historyText(b[1]))&&
   new Set(p.bindings.map(b=>b[0])).size===p.bindings.length&&
   new Set(p.bindings.map(b=>b[1])).size===p.bindings.length&&
   ['transfer','reward','fee'].includes(a.type)&&usdPrincipalAction(a)&&Object.keys(a).length===n&&
   (n===10?Object.hasOwn(a,'targetPositionId'):!Object.hasOwn(a,'targetPositionId'));
 }catch{return false;}
};
const stakingImport=object({version:v=>v===1,sourceId:v=>v===krakenSource,
 accountId:historyText,externalId:historyText,sourcePayload:stakingPayloadText,
 ownedSnapshot:historyText,fileId:hexDigest,occurrence:v=>v===1,ownership:v=>v==='imported'});
const stakingBookingFields=object({...bookingFields,importSource:stakingImport});
const stakingBooking=v=>stakingBookingFields(v)&&['transfer','reward','fee'].includes(v.type)&&
 v.importSource?.sourceId===krakenSource&&v.reconciliationStatus===(v.type==='fee'?'unpriced-asset-fee':'recorded');
const stakingJournal=v=>basicJournal(v)&&v.source===krakenSource&&
 ['transfer','reward','fee'].includes(v.type)&&v.status===(v.type==='fee'?'unpriced-asset-fee':'recorded')&&
 !Object.hasOwn(v,'nativeCurrency');
const stakingOriginal=object({booking:stakingBooking,journal:stakingJournal,flows:v=>Array.isArray(v)&&v.length===0});
const stakingRemoval=object({version:v=>v===1,group:hexDigest,count:v=>v===1||v===2,
 originals:v=>Array.isArray(v)&&v.length>=1&&v.length<=2&&v.every(stakingOriginal),digest:hexDigest});
const stakingRemovalJournalFields=object({...fields('id date recordedAt sequence'),
 type:v=>v==='uh03-undo',source:v=>v===krakenSource,status:v=>v==='removed',
 postings:array(posting),krakenWithdrawal:stakingRemoval});
const stakingRemovalJournal=v=>stakingRemovalJournalFields(v)&&v.type==='uh03-undo'&&stakingRemoval(v.krakenWithdrawal);
function stakingLeg(b,j){
 const q=b.quantityExact;
 if(!decimal(q)||units(q)<=0n||b.quantity!==Number(q)||b.fxRateDate!==null||b.fxSource!==null||
  j.postings.some(p=>p.amountBookEURExact!=='0'))return false;
 const own=j.postings.filter(p=>p.positionId===b.positionId),target=j.postings.filter(p=>p.positionId===b.targetPositionId);
 const matches=(p,role,id,account,quantity)=>p?.role===role&&p.positionId===id&&p.accountId===account&&p.quantityDeltaExact===quantity;
 if(b.type==='fee')return b.unitPrice===null&&b.feeEUR===null&&b.amountEUR===null&&b.amountExactEUR===null&&b.targetPositionId===null&&
  j.postings.length===2&&own.length===1&&matches(own[0],'asset-fee',b.positionId,b.accountId,exact(-units(q)))&&
  j.postings.some(p=>matches(p,'unpriced-fee',null,null,null));
 if(b.unitPrice!==0||b.feeEUR!==0||b.amountEUR!==0||b.amountExactEUR!=='0')return false;
 if(b.type==='reward')return b.targetPositionId===null&&j.postings.length===1&&matches(own[0],'nonmonetary',b.positionId,b.accountId,q);
 return b.targetQuantityExact===q&&j.postings.length===2&&own.length===1&&target.length===1&&
  matches(own[0],'transfer-out',b.positionId,b.accountId,exact(-units(q)))&&target[0].role==='transfer-in'&&target[0].quantityDeltaExact===q;
}
function stakingGroup(data,originals){
 try{
  if(![1,2].includes(originals.length))return false;
  const sorted=[...originals].sort((a,b)=>a.booking.importSource.externalId.localeCompare(b.booking.importSource.externalId));
  const root=JSON.parse(sorted[0].booking.importSource.sourcePayload);
  if(sorted.map(o=>o.booking.type).join(',')!==(sorted.length===1?'transfer':'reward,fee'))return false;
  return sorted.every(({booking:b,journal:j,flows},i)=>{
   if(!stakingOriginal({booking:b,journal:j,flows})||!sourceUnmodified({journalEntries:[j]},b)||!stakingLeg(b,j))return false;
   const s=b.importSource,p=JSON.parse(s.sourcePayload),a=p.action;
   const position=id=>data.positions?.find(v=>v.id===id&&v.kind==='crypto'&&v.coinId==='ethereum'&&
    v.currency==='EUR'&&!v.wallet?.enabled&&v.managementSource!=='wallet'&&
    [v.costBasisExact,v.costBasisEUR,v.realizedPnLExact,v.realizedPnLEUR].every(n=>n===null));
   const source=position(b.positionId),target=b.type==='transfer'?position(b.targetPositionId):null;
   return source&&source.accountId===b.accountId&&(b.type!=='transfer'||target&&target.id!==source.id&&target.providerId===source.providerId&&
    j.postings.some(p=>p.positionId===target.id&&p.accountId===target.accountId))&&
    s.fileId===root.group&&p.group===root.group&&p.payload===root.payload&&JSON.stringify(p.bindings)===JSON.stringify(root.bindings)&&
    b.id==='uh03:'+root.group+':'+i&&s.externalId===root.group+':'+i&&b.journalEntryId===b.id&&j.id===b.id&&j.type===b.type&&j.date===b.date&&
    a.type===b.type&&a.date===b.date&&a.positionId===b.positionId&&a.quantity===b.quantityExact&&a.notes===b.notes&&
    a.unitPrice==='0'&&a.feeEUR==='0'&&a.taxEUR==='0'&&a.fxRate==='1'&&b.fxRate===1&&b.costsVerified===false&&b.taxEUR===null&&
    b.external===false&&b.cashPositionId===null&&j.cashPositionId===null&&
    (b.type!=='transfer'||a.targetPositionId===b.targetPositionId)&&
    p.bindings.every(v=>[b.positionId,...(target?[target.id]:[])].includes(v[1]));
  });
 }catch{return false;}
}
function stakingScope(data){
 const groups=new Map();
 for(const b of data.bookings||[]){
  if(b.importSource?.sourceId!==krakenSource||usdPrincipalBooking(b))continue;
  if(!stakingBooking(b))return false;
  const key=b.importSource.fileId;if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({booking:b,journal:data.journalEntries?.find(j=>j.id===b.journalEntryId),
   flows:(data.externalCashFlows||[]).filter(f=>f.id===b.id)});
 }
 if([...groups.values()].some(g=>!stakingGroup(data,g)))return false;
 return (data.journalEntries||[]).every(j=>{
  if(j.source!==krakenSource||usdPrincipalJournal(j)||usdPrincipalRemovalJournal(j))return true;
  if(stakingJournal(j))return (data.bookings||[]).some(b=>b.journalEntryId===j.id&&stakingBooking(b));
  return stakingRemovalJournal(j)&&j.krakenWithdrawal.count===j.krakenWithdrawal.originals.length&&
   stakingGroup(data,j.krakenWithdrawal.originals);
 });
}
const booking=v=>existingBooking(v)||csvCashBooking(v)||usdPrincipalBooking(v)||stakingBooking(v);
const cashOriginal=object({booking:csvCashBooking,journal:basicJournal,flows:array(flow)});
const cashRemovalFields=object({version:v=>v===2,action:v=>v==='remove',reason:historyText,
 originals:array(v=>cashOriginal(v)&&v.booking.importSource?.sourceId==='generic-csv'&&provenCashImport(v.booking,v.journal)),
 afterBookings:array(v=>v===null)});
const cashRemovalAudit=v=>v?.version===2&&v.action==='remove'&&Array.isArray(v.originals)&&v.originals.length>0&&cashRemovalFields(v);
const cashRemovalJournalFields=object({...fields('id date recordedAt sequence'),type:v=>v==='booking-management-audit',source:v=>v==='management-audit',
 postings:array(posting),managementAudit:cashRemovalAudit});
const cashRemovalJournal=v=>v?.type==='booking-management-audit'&&v.source==='management-audit'&&cashRemovalAudit(v.managementAudit)&&cashRemovalJournalFields(v);
// Existing manual EUR-cash notes/edit/remove history is a separate complete
// evidence family. Do not broaden imported v2 removals into mixed/edit audits.
const cashTypes=new Set(['deposit','withdraw','dividend','interest','fee','tax']);
const manualCashBooking=v=>existingBooking(v)&&cashTypes.has(v.type)&&
 !Object.hasOwn(v,'importSource')&&!Object.hasOwn(v,'importFingerprint');
const manualCashOriginal=object({booking:manualCashBooking,
 journal:v=>basicJournal(v)&&v.source==='manual',flows:array(flow)});
const manualCashAuditFields=object({version:v=>v===1,action:v=>['notes','edit','remove'].includes(v),reason:historyText,
 originals:array(manualCashOriginal),afterBookings:array(nullable(manualCashBooking))});
const manualCashAudit=v=>v?.version===1&&['notes','edit','remove'].includes(v.action)&&
 Array.isArray(v.originals)&&v.originals.length>0&&manualCashAuditFields(v);
const manualCashAuditJournalFields=object({...fields('id date recordedAt sequence'),
 type:v=>v==='booking-management-audit',source:v=>v==='management-audit',
 postings:array(posting),managementAudit:manualCashAudit});
const manualCashAuditJournal=v=>v?.type==='booking-management-audit'&&v.source==='management-audit'&&
 manualCashAudit(v.managementAudit)&&manualCashAuditJournalFields(v);
const dataFields=object({version:v=>v===3||v===4||v===5,providers:array(provider),accounts:array(account),assets:array(asset),
 positions:array(position),bookings:array(booking),journalEntries:array(journal),openingPositions:array(opening),
 externalCashFlows:array(flow),snapshots:array(snapshot),performanceFlowTrackingSince:scalar,
 priceHistories:map(priceHistory),bookingPresentation:archive,walletHistory:history,purchaseEvidence,
 flatexNetRemovals:v=>Array.isArray(v)&&v.length===0});
// A ledger-only v5 observation is a different incomplete evidence slice.
// No blanket v5 acceptance: require the existing complete UH02 economic path
// (purchase or permanent undo), then let its existing validators decide.
const hasUSDPrincipal=v=>(v.journalEntries||[]).some(j=>usdPrincipalJournal(j)||usdPrincipalRemovalJournal(j));
const dataSchema=v=>dataFields(v)&&
 (v.flatexNetRemovals===undefined||hasUSDPrincipal(v))&&
 (v.version!==5||v.journalEntries?.some(j=>j.source==='unified-bitcoin')||hasUSDPrincipal(v))&&
 stakingScope(v)&&
 (v.bookings||[]).every(b=>b.importSource?.sourceId!=='generic-csv'||provenCashImport(b,(v.journalEntries||[]).find(j=>j.id===b.journalEntryId)))&&
 // Scope, not a second economics engine: original positions must still be
 // EUR cash. Existing journal validation binds every retained removal flow.
 [...(v.bookings||[]).filter(b=>b.importSource?.sourceId==='generic-csv'),
 ...(v.journalEntries||[]).flatMap(j=>j.managementAudit?[...j.managementAudit.originals.map(o=>o.booking),...(j.managementAudit.afterBookings||[]).filter(Boolean)]:[])].every(b=>
  v.positions?.some(p=>p.id===b.positionId&&p.accountId===b.accountId&&p.kind==='cash'&&p.currency==='EUR'));
const same=(a,b)=>{
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 // a is parsed input JSON. Model constructors may add own undefined fields
 // (e.g. BTC wallet.chainId/addressType) absent from every persisted JSON.
 // Ignore only these extra non-JSON projection keys, never an input value.
 const aa=Object.keys(a),bb=Object.keys(b).filter(k=>b[k]!==undefined);
 return aa.length===bb.length&&aa.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));
};
function byteBudget(plain){
 if(new TextEncoder().encode(plain).byteLength>SYNC_SNAPSHOT_UTF8_LIMIT)fail('byte-budget');
}
function structureBudget(value){
 const stack=[[value,0]];let nodes=0;
 while(stack.length){
  const [v,depth]=stack.pop();
  if(++nodes>SYNC_SNAPSHOT_NODE_LIMIT)fail('node-budget');
  if(depth>SYNC_SNAPSHOT_DEPTH_LIMIT)fail('depth-budget');
  if(v&&typeof v==='object')for(const child of Object.values(v))stack.push([child,depth+1]);
 }
}
function checkData(data){
 structureBudget(data);
 if(!dataSchema(data))fail('unsupported-data-or-field');
 assertDataVersion(data);
 // Reuse existing financial/journal/history/reference/dedupe validators. They
 // may migrate/normalize old inputs; a sync gate MUST NOT accept those changes.
 const checked=safeImport(data);delete checked.settings;
 if(!same(data,checked))fail('normalization-required');
 return data;
}
function freeze(value){
 if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}
 return value;
}

/** Encode only already canonical local raw. Local settings are deliberately
 * excluded in their entirety; caller must never pass record.settings here.
 */
export async function createSyncSnapshot(canonicalRaw){
 await syncPayloadDigest(canonicalRaw); // strict UTF8/Unicode and existing limits
 let data;try{data=JSON.parse(canonicalRaw);}catch{fail('json');}
 if(!data||typeof data!=='object'||Array.isArray(data))fail('data');
 structureBudget(data);
 if(canonicalRaw!==JSON.stringify(data)&&canonicalRaw!==JSON.stringify(data,null,2))fail('noncanonical-local-json');
 delete data.settings;
 checkData(data);
 const plain=JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:SYNC_SNAPSHOT_VERSION,data});
 byteBudget(plain);
 await syncPayloadDigest(plain);
 return plain;
}

/** Call only after frame authentication and byte-digest verification. Returning
 * frozen data grants no storage permission and never installs settings/keys.
 */
export async function validateSyncSnapshot(plain){
 await syncPayloadDigest(plain);byteBudget(plain);
 let envelope;try{envelope=JSON.parse(plain);}catch{fail('json');}
 structureBudget(envelope);
 if(!object({kind:v=>v===SYNC_SNAPSHOT_KIND,snapshotVersion:v=>v===SYNC_SNAPSHOT_VERSION,data:dataSchema})(envelope)||
    Object.keys(envelope).length!==3||JSON.stringify(envelope)!==plain)fail('envelope');
 checkData(envelope.data);
 return freeze({plain,data:envelope.data});
}
