/**
 * Read-only blockchain facts, NOT journal entries or investor cashflows.
 * All public amounts/heights are canonical integer strings. BigInt stays local.
 * accountId is the canonical custody owner; walletId identifies a scan view.
 * Adapters must resolve HD/address overlap to the same accountId before replay.
 * Fees are separate negative `fee` events; transfer deltas MUST exclude that fee.
 * No network, storage, model, prices, current clock or implicit zero opening.
 */
export const HISTORY_COVERAGE=Object.freeze(['verified','partial','missing','unsupported','unconfirmed','error']);
const SEVERITY={verified:0,partial:1,missing:2,unconfirmed:3,unsupported:4,error:5};
const TYPES=['incoming','outgoing','internal_transfer','fee','staking_reward','swap','unknown'];
const LOCATORS=['log','vin','vout','instruction','subindex','fee'];
const fail=message=>{throw new Error('Wallet history: '+message);};
const text=(value,name)=>{
 if(typeof value!=='string'||!value.trim()||value.length>1000||/[\u0000-\u001f]/.test(value))fail('invalid '+name);
 return value;
};
const optionalText=(value,name)=>value==null?null:text(value,name);
const integer=(value,signed=false)=>{
 if(typeof value!=='string'||value.length>1000||!(signed?/^(?:0|-?[1-9]\d*)$/:/^(?:0|[1-9]\d*)$/).test(value))fail('invalid integer string');
 return value;
};
const decimals=value=>{if(!Number.isInteger(value)||value<0||value>255)fail('invalid decimals');return value;};
const utc=value=>{
 if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value.replace(/Z$/,value.includes('.')?'Z':'.000Z'))fail('invalid UTC time');
 return new Date(value).toISOString();
};
const coverage=value=>{if(!HISTORY_COVERAGE.includes(value))fail('invalid coverage');return value;};
const compare=(a,b)=>a<b?-1:a>b?1:0;
const compareInteger=(a,b)=>compare(BigInt(a),BigInt(b));
const key=parts=>JSON.stringify(parts);
function identity(value,withAccount=true){
 return {network:text(value.network,'network'),chainId:text(value.chainId,'chainId'),
  ...(withAccount?{accountId:text(value.accountId,'accountId')}:{}),assetId:text(value.assetId,'assetId'),
  contract:optionalText(value.contract,'contract'),mint:optionalText(value.mint,'mint')};
}
const streamKey=value=>key(Object.values(identity(value)));
const assetKey=value=>key(Object.values(identity(value,false)));
const eventKey=e=>key([streamKey(e),e.txid,e.locator.kind,e.locator.index,e.locator.subindex]);
/** Stable ID includes chain, canonical owner, asset identity and native event locator. */
export function historyEventId(value){return eventKey(validateHistoryEvent(value));}
/** Canonical projection prevents BigInt/undefined or arbitrary provider payload in JSON. */
export function validateHistoryEvent(value){
 if(!value||typeof value!=='object')fail('event required');
 const i=identity(value),loc=value.locator;
 if(!loc||!LOCATORS.includes(loc.kind))fail('event locator required');
 const locator={kind:loc.kind,index:integer(loc.index),subindex:integer(loc.subindex)};
 if(!TYPES.includes(value.type))fail('invalid event type');
 if(!['confirmed','failed','unconfirmed','orphaned'].includes(value.status)||!['finalized','confirmed','unconfirmed','orphaned'].includes(value.finality))fail('invalid status/finality');
 if((value.status==='unconfirmed')!==(value.finality==='unconfirmed')||(value.status==='orphaned')!==(value.finality==='orphaned'))fail('inconsistent finality');
 if(value.status==='failed'&&value.type!=='fee')fail('failed transaction can only charge a fee');
 if((value.type==='fee')!==(loc.kind==='fee')||(loc.kind==='fee'&&(loc.index!=='0'||loc.subindex!=='0')))fail('fee must have one canonical locator');
 const amount=value.quantityBaseUnits===null&&value.type==='unknown'?null:integer(value.quantityBaseUnits,true);
 if(amount!==null){
  const n=BigInt(amount);
  if((['outgoing','fee'].includes(value.type)&&n>0n)||(['incoming','staking_reward'].includes(value.type)&&n<0n))fail('invalid quantity sign');
 }
 const event={...i,walletId:text(value.walletId,'walletId'),txid:text(value.txid,'txid'),locator,
  blockHeight:value.blockHeight===null?null:integer(value.blockHeight),blockHash:optionalText(value.blockHash,'blockHash'),
  txIndex:value.txIndex==null?null:integer(value.txIndex),timestamp:value.timestamp===null?null:utc(value.timestamp),
  decimals:decimals(value.decimals),quantityBaseUnits:amount,type:value.type,source:optionalText(value.source,'source'),
  status:value.status,finality:value.finality,observedAt:utc(value.observedAt),coverage:coverage(value.coverage),qualityCode:text(value.qualityCode,'qualityCode')};
 const id=eventKey(event);
 if(value.id!=null&&value.id!==id)fail('event ID does not match identity');
 return {id,...event};
}
// Scan aliases and observation metadata do not change the on-chain fact.
const semantic=e=>{const {id,walletId,source,observedAt,...fact}=e;return JSON.stringify(fact);};
/** Contradictory facts are quarantined, never resolved by arbitrary import order. */
export function dedupeHistoryEvents(values){
 if(!Array.isArray(values))fail('events must be an array');
 const groups=new Map();
 for(const value of values){const e=validateHistoryEvent(value);if(!groups.has(e.id))groups.set(e.id,[]);groups.get(e.id).push(e);}
 const events=[],conflicts=[];
 for(const [id,group] of [...groups].sort(([a],[b])=>compare(a,b))){
  if(new Set(group.map(semantic)).size>1){conflicts.push({id,streamKey:streamKey(group[0]),code:'conflicting-event'});continue;}
  // Prefer evidenced provenance, then a deterministic latest observation.
  group.sort((a,b)=>compare(Boolean(b.source),Boolean(a.source))||compare(b.observedAt,a.observedAt)||compare(JSON.stringify(a),JSON.stringify(b)));
  events.push(group[0]);
 }
 return {events:sortHistoryEvents(events),conflicts};
}
/** Chain/block order precedes UTC time. Ties are stable, never input-order based. */
export function sortHistoryEvents(values){
 return values.map(validateHistoryEvent).sort((a,b)=>compare(a.network,b.network)||compare(a.chainId,b.chainId)||
  (a.blockHeight===null||b.blockHeight===null?compare(a.blockHeight===null,b.blockHeight===null):compareInteger(a.blockHeight,b.blockHeight))||
  (a.txIndex===null||b.txIndex===null?compare(a.txIndex===null,b.txIndex===null):compareInteger(a.txIndex,b.txIndex))||
  compare(a.txid,b.txid)||compare(a.locator.kind,b.locator.kind)||compareInteger(a.locator.index,b.locator.index)||compareInteger(a.locator.subindex,b.locator.subindex)||compare(a.id,b.id));
}
function validateStream(value){
 const i=identity(value),throughBlock=integer(value.throughBlock),c=value.coverage;
 let opening=null;
 if(value.opening!=null){
  opening={quantityBaseUnits:integer(value.opening.quantityBaseUnits,true),beforeBlock:integer(value.opening.beforeBlock),source:optionalText(value.opening.source,'opening source')};
  if(BigInt(opening.quantityBaseUnits)<0n)fail('negative opening holding');
  if(BigInt(opening.beforeBlock)>BigInt(throughBlock))fail('opening follows requested block');
 }
 let span=null;
 if(c!=null){
  span={status:coverage(c.status),fromBlock:integer(c.fromBlock),toBlock:integer(c.toBlock),tipHash:optionalText(c.tipHash,'tipHash'),source:optionalText(c.source,'coverage source')};
  if(BigInt(span.fromBlock)>BigInt(span.toBlock))fail('reversed coverage range');
 }
 return {...i,decimals:decimals(value.decimals),opening,coverage:span,throughBlock};
}
/**
 * Replay at inclusive throughBlock. Opening is immediately BEFORE beforeBlock.
 * Every requested wallet/asset must have a stream, even if no events were found.
 * A zero requires an explicit evidenced opening and a complete provider interval.
 * quantityBaseUnits=null means unknown; knownDeltaBaseUnits is only observed flow.
 */
export function replayWalletHistory({events,streams}){
 if(!Array.isArray(streams))fail('explicit streams required');
 const descriptors=streams.map(validateStream),keys=new Set(descriptors.map(streamKey));
 if(keys.size!==streams.length)fail('duplicate stream');
 const deduped=dedupeHistoryEvents(events),balances=[],owners=new Map();
 for(const e of deduped.events){
  const walletKey=key([e.network,e.chainId,e.walletId]);
  if(!owners.has(walletKey))owners.set(walletKey,new Set());owners.get(walletKey).add(e.accountId);
 }
 for(const e of events)if(!keys.has(streamKey(e)))fail('event outside declared streams');
 for(const s of descriptors.sort((a,b)=>compare(streamKey(a),streamKey(b)))){
  const reasons=new Set(),k=streamKey(s),c=s.coverage,o=s.opening;
  let state='verified',delta=0n;
  const mark=(code,status='partial')=>{reasons.add(code);if(SEVERITY[status]>SEVERITY[state])state=status;};
  if(!o?.source)mark('missing-opening','missing');
  if(!c?.source||!c?.tipHash)mark('missing-provenance','missing');
  if(c&&c.status!=='verified')mark('provider-'+c.status,c.status);
  if(c&&o&&(BigInt(c.fromBlock)>BigInt(o.beforeBlock)||BigInt(c.toBlock)<BigInt(s.throughBlock)))mark('provider-gap');
  // Tip hash can only identify the requested end if coverage ends at that block.
  if(c&&c.toBlock!==s.throughBlock)mark('unmatched-tip');
  if(deduped.conflicts.some(x=>x.streamKey===k))mark('conflicting-event','error');
  const relevant=deduped.events.filter(e=>streamKey(e)===k&&(e.blockHeight===null||(BigInt(e.blockHeight)<=BigInt(s.throughBlock)&&(!o||BigInt(e.blockHeight)>=BigInt(o.beforeBlock)))));
  const hashes=new Map();
  for(const e of relevant){
   if(owners.get(key([e.network,e.chainId,e.walletId])).size>1)mark('ambiguous-wallet-owner','error');
   if(e.decimals!==s.decimals)mark('decimals-mismatch','error');
   if(e.coverage!=='verified')mark(e.qualityCode,e.coverage);
   if(!e.source||!e.blockHash||!e.timestamp||e.blockHeight===null)mark('missing-event-provenance');
   if(e.status==='orphaned'||e.status==='unconfirmed'||e.finality==='unconfirmed'){mark(e.status,'unconfirmed');continue;}
   if(e.blockHeight!==null&&e.blockHash){
    const old=hashes.get(e.blockHeight);if(old&&old!==e.blockHash)mark('inconsistent-block-hash','error');hashes.set(e.blockHeight,e.blockHash);
    if(e.blockHeight===s.throughBlock&&c?.tipHash&&e.blockHash!==c.tipHash)mark('tip-hash-mismatch','error');
   }
   if(e.quantityBaseUnits===null||e.type==='unknown'){mark('unknown-quantity-effect','unsupported');continue;}
   if(e.decimals===s.decimals)delta+=BigInt(e.quantityBaseUnits);
  }
  const quantity=state==='verified'?BigInt(o.quantityBaseUnits)+delta:null;
  // Negative movements are valid; a negative spot holding is a data-quality failure.
  if(quantity!==null&&quantity<0n)mark('negative-holding','error');
  balances.push({...identity(s),decimals:s.decimals,throughBlock:s.throughBlock,blockHash:c?.toBlock===s.throughBlock?c.tipHash:null,
   quantityBaseUnits:state==='verified'?quantity.toString():null,knownDeltaBaseUnits:delta.toString(),coverage:state,reasons:[...reasons].sort()});
 }
 const groups=new Map();
 for(const b of balances){const k=assetKey(b);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(b);}
 const totals=[...groups].sort(([a],[b])=>compare(a,b)).map(([,group])=>{
  const valid=group.every(b=>b.coverage==='verified'&&b.decimals===group[0].decimals&&b.throughBlock===group[0].throughBlock&&b.blockHash===group[0].blockHash);
  return {...identity(group[0],false),decimals:group[0].decimals,quantityBaseUnits:valid?group.reduce((n,b)=>n+BigInt(b.quantityBaseUnits),0n).toString():null,coverage:valid?'verified':'partial'};
 });
 return {events:deduped.events,conflicts:deduped.conflicts,balances,totals};
}
/** Compare only same-block, same-chain, evidenced observations. Never alter either side. */
export function reconcileWalletHistory(result,observations){
 return observations.map(value=>{
  const i=identity(value),quantity=integer(value.quantityBaseUnits,true),block=integer(value.blockHeight);
  const b=result.balances.find(b=>streamKey(b)===streamKey(i));
  const comparable=b?.coverage==='verified'&&b.quantityBaseUnits!==null&&b.throughBlock===block&&b.blockHash&&b.blockHash===value.blockHash&&typeof value.source==='string'&&value.source.trim()&&value.decimals===b.decimals;
  const difference=comparable?(BigInt(b.quantityBaseUnits)-BigInt(quantity)).toString():null;
  return {...i,status:!comparable?'unknown':difference==='0'?'verified':'mismatch',differenceBaseUnits:difference};
 });
}
/**
 * Future read-only adapter: getPage(request) -> Promise<HistoryPage>.
 * Cursor is bound to provider, query identity and schema, not an unscoped token.
 * @typedef {{provider:string,network:string,chainId:string,accountId:string,filterKey:string,schemaVersion:1,from:string|null,to:string|null,value:string}} HistoryCursor
 * @typedef {{provider:string,network:string,chainId:string,accountId:string,filterKey:string,schemaVersion:1,cursor:HistoryCursor|null,pageSize:number,maxPages:number,page:number,from:string|null,to:string|null,signal:AbortSignal}} HistoryRequest
 * @typedef {{events:object[],nextCursor:HistoryCursor|null,coverage:string,oldestReached:boolean}} HistoryPage
 */
function checkCursor(cursor,request){
 if(cursor===null)return;
 if(!cursor||typeof cursor!=='object')fail('cursor required or null');
 for(const field of ['provider','network','chainId','accountId','filterKey','schemaVersion'])if(cursor[field]!==request[field])fail('cursor scope mismatch');
 for(const field of ['from','to'])if((cursor[field]===null?null:utc(cursor[field]))!==(request[field]==null?null:utc(request[field])))fail('cursor window mismatch');
 text(cursor.value,'cursor');
}
export function validateHistoryRequest(request){
 for(const field of ['provider','network','chainId','accountId','filterKey'])text(request[field],field);
 if(request.schemaVersion!==1)fail('unsupported request schema');
 for(const [field,max] of [['pageSize',1000],['maxPages',10000]])if(!Number.isSafeInteger(request[field])||request[field]<1||request[field]>max)fail('invalid '+field);
 if(!Number.isSafeInteger(request.page)||request.page<0||request.page>=request.maxPages)fail('page limit reached');
 const signal=request.signal;
 if(!signal||typeof signal.aborted!=='boolean'||typeof signal.addEventListener!=='function'||typeof signal.removeEventListener!=='function'||typeof signal.throwIfAborted!=='function')fail('AbortSignal required');
 if(signal.aborted){const error=new Error('Wallet history request aborted');error.name='AbortError';throw error;}
 const from=request.from==null?null:utc(request.from),to=request.to==null?null:utc(request.to);
 if(from&&to&&from>to)fail('reversed time window');
 checkCursor(request.cursor,request);
 return request;
}
export function validateHistoryPage(page,request){
 validateHistoryRequest(request);
 if(!Array.isArray(page.events)||page.events.length>request.pageSize||typeof page.oldestReached!=='boolean')fail('invalid page');
 coverage(page.coverage);checkCursor(page.nextCursor,request);
 if(page.coverage==='verified'&&!page.oldestReached)fail('verified page must reach requested beginning');
 if(page.oldestReached&&page.nextCursor!==null)fail('completed page has cursor');
 if(page.nextCursor&&request.cursor&&page.nextCursor.value===request.cursor.value)fail('nonadvancing cursor');
 for(const value of page.events){
  const e=validateHistoryEvent(value);
  for(const field of ['network','chainId','accountId'])if(e[field]!==request[field])fail('event outside request');
  if(e.timestamp&&((request.from&&e.timestamp<utc(request.from))||(request.to&&e.timestamp>utc(request.to))))fail('event outside time window');
 }
 return page;
}
