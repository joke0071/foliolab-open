import {safeImport,assertDataVersion} from './model.js';
import {syncPayloadDigest} from './sync-payload-integrity.js';
import {units,exact} from './decimal.js';
import {provenCashImport} from './import-identity.js';

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
const journal=v=>basicJournal(v)||cashRemovalJournal(v);
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
const bookingFields=fields('id type date positionId accountId positionName quantity quantityExact unitPrice feeEUR taxEUR fxRate fxRateDate fxSource amountEUR amountExactEUR targetPositionId targetQuantityExact external notes journalEntryId cashPositionId reconciliationStatus costsVerified');
const existingBooking=object({...bookingFields,importSource:bitcoinImport});
const csvCashBooking=object({...bookingFields,importSource:csvCashImport,importFingerprint:historyText});
const booking=v=>existingBooking(v)||csvCashBooking(v);
const cashOriginal=object({booking:csvCashBooking,journal:basicJournal,flows:array(flow)});
const cashRemovalFields=object({version:v=>v===2,action:v=>v==='remove',reason:historyText,
 originals:array(v=>cashOriginal(v)&&v.booking.importSource?.sourceId==='generic-csv'&&provenCashImport(v.booking,v.journal)),
 afterBookings:array(v=>v===null)});
const cashRemovalAudit=v=>v?.version===2&&v.action==='remove'&&Array.isArray(v.originals)&&v.originals.length>0&&cashRemovalFields(v);
const cashRemovalJournalFields=object({...fields('id date recordedAt sequence'),type:v=>v==='booking-management-audit',source:v=>v==='management-audit',
 postings:array(posting),managementAudit:cashRemovalAudit});
const cashRemovalJournal=v=>v?.type==='booking-management-audit'&&v.source==='management-audit'&&cashRemovalAudit(v.managementAudit)&&cashRemovalJournalFields(v);
const dataFields=object({version:v=>v===3||v===4||v===5,providers:array(provider),accounts:array(account),assets:array(asset),
 positions:array(position),bookings:array(booking),journalEntries:array(journal),openingPositions:array(opening),
 externalCashFlows:array(flow),snapshots:array(snapshot),performanceFlowTrackingSince:scalar,
 priceHistories:map(priceHistory),bookingPresentation:archive,walletHistory:history,purchaseEvidence});
// A ledger-only v5 observation is a different incomplete evidence slice.
// No blanket v5 acceptance: require the existing complete UH02 economic path
// (purchase or permanent undo), then let its existing validators decide.
const dataSchema=v=>dataFields(v)&&(v.version!==5||v.journalEntries?.some(j=>j.source==='unified-bitcoin'))&&
 (v.bookings||[]).every(b=>b.importSource?.sourceId!=='generic-csv'||provenCashImport(b,(v.journalEntries||[]).find(j=>j.id===b.journalEntryId)))&&
 // Scope, not a second economics engine: original positions must still be
 // EUR cash. Existing journal validation binds every retained removal flow.
 [...(v.bookings||[]).filter(b=>b.importSource?.sourceId==='generic-csv'),
 ...(v.journalEntries||[]).flatMap(j=>j.managementAudit?.originals?.map(o=>o.booking)||[])].every(b=>
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
