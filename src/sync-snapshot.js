import {safeImport,assertDataVersion} from './model.js';
import {syncPayloadDigest} from './sync-payload-integrity.js';
import {units,exact} from './decimal.js';

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
const journal=object({...fields('id type date recordedAt sequence cashPositionId status source nativeCurrency'),postings:array(posting)});
const booking=object(fields('id type date positionId accountId positionName quantity quantityExact unitPrice feeEUR taxEUR fxRate fxRateDate fxSource amountEUR amountExactEUR targetPositionId targetQuantityExact external notes journalEntryId cashPositionId reconciliationStatus costsVerified'));
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
const dataSchema=object({version:v=>v===3||v===4,providers:array(provider),accounts:array(account),assets:array(asset),
 positions:array(position),bookings:array(booking),journalEntries:array(journal),openingPositions:array(opening),
 externalCashFlows:array(flow),snapshots:array(snapshot),performanceFlowTrackingSince:scalar,
 priceHistories:map(()=>false),bookingPresentation:archive,walletHistory:history});
const same=(a,b)=>{
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 const aa=Object.keys(a),bb=Object.keys(b);
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
