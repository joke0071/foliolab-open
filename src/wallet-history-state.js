import {sourceDigest} from './import-identity.js';
import {validateHistoryQuotes} from './wallet-history-valuation.js';
/** Accepted read-only history is part of the existing revisioned portfolio record. */
import {validateHistoryEvent,replayWalletHistory,HISTORY_COVERAGE,dedupeHistoryEvents} from './wallet-history-core.js';
const label=(v,n=200)=>{if(typeof v!=='string'||!v||v.length>n||/[\u0000-\u001f]/.test(v))throw Error('Ungültige Historienkennung.');return v;};
const integer=v=>{if(typeof v!=='string'||! /^(0|-?[1-9]\d{0,99})$/.test(v))throw Error('Ungültige historische Rohmenge.');return v;};
const utc=v=>{if(typeof v!=='string'||new Date(v).toISOString()!==v)throw Error('Ungültiger Historienzeitpunkt.');return v;};
const source=v=>{v=label(v,1000);if(v.includes('://'))return new URL(v).hostname;return /^[a-zA-Z0-9 .:_-]{1,180}$/.test(v)?v:'provider';};
function stream(v){
 if(!HISTORY_COVERAGE.includes(v.coverage?.status))throw Error('Ungültige historische Coverage.');
 return {network:label(v.network),chainId:label(v.chainId),accountId:label(v.accountId),assetId:label(v.assetId),contract:v.contract==null?null:label(v.contract),mint:v.mint==null?null:label(v.mint),decimals:v.decimals,throughBlock:integer(v.throughBlock),opening:v.opening?{quantityBaseUnits:integer(v.opening.quantityBaseUnits),beforeBlock:integer(v.opening.beforeBlock),source:source(v.opening.source)}:null,coverage:{status:v.coverage.status,fromBlock:integer(v.coverage.fromBlock),toBlock:integer(v.coverage.toBlock),tipHash:v.coverage.tipHash==null?null:label(v.coverage.tipHash),source:source(v.coverage.source)}};
}
/** Bind accepted BTC ownership facts to the exact public configuration actually queried. */
export function bitcoinHistoryScope(wallet){
 if(!wallet?.enabled||!['btc','btc-hd'].includes(wallet.chain)||typeof wallet.address!=='string'||!wallet.address)throw Error('Bitcoin-Walletkonfiguration fehlt.');
 return sourceDigest(JSON.stringify([wallet.chain,wallet.address,wallet.chain==='btc-hd'?(wallet.addressType||'auto'):null]));
}
export function validateHistorySession(v){
 if(!v||!['btc','eth','sol'].includes(v.chain)||!Array.isArray(v.events)||v.events.length>50000||!Array.isArray(v.streams)||v.streams.length>1000)throw Error('Historie ist ungültig oder zu groß.');
 const projected=v.events.map(e=>validateHistoryEvent({...e,source:e.source?source(e.source):null})),streams=v.streams.map(stream);
 const canonical=dedupeHistoryEvents(projected);if(canonical.conflicts.length)throw Error('Widersprüchliche Ereignisse können nicht bestätigt werden.');
 const events=canonical.events,checked=replayWalletHistory({events,streams});
 for(let i=0;i<streams.length;i++){const s=streams[i],b=checked.balances.find(b=>b.network===s.network&&b.chainId===s.chainId&&b.accountId===s.accountId&&b.assetId===s.assetId&&b.contract===s.contract&&b.mint===s.mint);s.coverage.status=b.coverage;} // validates identity, duplicates, opening ranges and exact raw amounts
 const quotes=validateHistoryQuotes(v.quotes??[],streams);
 if(v.walletScopeDigest!==undefined&&(v.chain!=='btc'||typeof v.walletScopeDigest!=='string'||!/^[a-f0-9]{64}$/.test(v.walletScopeDigest)))throw Error('Ungültiger Historien-Walletbezug.');
 return {...(v.walletScopeDigest===undefined?{}:{walletScopeDigest:v.walletScopeDigest}),quotes,id:label(v.id),chain:v.chain,walletKey:label(v.walletKey,300),acceptedAt:utc(v.acceptedAt),events,streams,issues:(v.issues||[]).slice(0,100).map(x=>label(x)),decision:'accepted',providerCache:'re-fetch-needed'};
}
export function validateWalletHistory(value){
 if(!value||value.schema!==1||!Array.isArray(value.sessions)||value.sessions.length>100||!Array.isArray(value.pending)||value.pending.length>100)throw Error('Unbekanntes Historienformat.');
 const sessions=value.sessions.map(validateHistorySession),ids=new Set();let count=0;
 for(const s of sessions){if(ids.has(s.id))throw Error('Doppelte Historien-ID.');ids.add(s.id);count+=s.events.length;}
 if(count>50000)throw Error('Zu viele gespeicherte Historienereignisse.');
 const pending=value.pending.map(v=>({id:label(v.id),chain:label(v.chain),walletKey:label(v.walletKey,300),provider:source(v.provider),filter:label(v.filter),tip:v.tip==null?null:label(v.tip),scope:v.scope==null?null:(/^[0-9a-f]{64}$/.test(v.scope)?v.scope:(()=>{throw Error('Ungültiger Cursor-Konfigurationsbezug.');})()),status:'re-fetch-needed',updatedAt:utc(v.updatedAt)}));
 const result={schema:1,sessions,pending};if(new TextEncoder().encode(JSON.stringify(result)).length>8e6)throw Error('Historie überschreitet das sichere Speicher-/Backuplimit.');return result;
}
export const emptyWalletHistory=()=>({schema:1,sessions:[],pending:[]});
/** Return a draft only. Caller commits via existing PortfolioStorage and CAS/WebLocks. */
export function acceptHistory(model,session){
 const state=validateWalletHistory(model.walletHistory??emptyWalletHistory()),record=validateHistorySession(session);
 state.sessions=state.sessions.filter(s=>s.id!==record.id);state.sessions.push(record);state.pending=state.pending.filter(p=>p.id!==record.id);
 const draft={...model,walletHistory:validateWalletHistory(state)};if(new TextEncoder().encode(JSON.stringify(draft)).length>10e6)throw Error('Portfolio mit Historie überschreitet das sichere Vollbackuplimit.');return draft;
}
export function checkpointHistory(model,metadata){
 const state=validateWalletHistory(model.walletHistory??emptyWalletHistory());
 state.pending=state.pending.filter(p=>p.id!==metadata.id);state.pending.push(metadata);
 return {...model,walletHistory:validateWalletHistory(state)};
}
/** Drop only temporary resume metadata; retain every accepted session/event. */
export function clearHistoryCheckpoint(model,id){
 const state=validateWalletHistory(model.walletHistory??emptyWalletHistory());
 state.pending=state.pending.filter(p=>p.id!==label(id));
 return {...model,walletHistory:validateWalletHistory(state)};
}
/** Adapter results are projected; accepted events never retain raw provider pages/credentials. */
export function historyPreview(result,{id,chain,walletKey,walletScopeDigest,acceptedAt=new Date().toISOString()}){
 if(!result.replay)throw Error('Keine rekonstruierte Vorschau vorhanden.');
 const streams=result.replay.balances.map(b=>({network:b.network,chainId:b.chainId,accountId:b.accountId,assetId:b.assetId,contract:b.contract,mint:b.mint,decimals:b.decimals,throughBlock:b.throughBlock,
  // A zero genesis is retained only if the adapter proved its exact delta equals its verified balance.
  opening:result.openings?.find(o=>o.accountId===b.accountId&&o.assetId===b.assetId&&o.mint===b.mint)??(b.coverage==='verified'&&b.quantityBaseUnits===b.knownDeltaBaseUnits?{quantityBaseUnits:'0',beforeBlock:'0',source:'adapter-complete-history'}:null),
  coverage:{status:b.coverage==='verified'&&(result.openings?.some(o=>o.accountId===b.accountId&&o.assetId===b.assetId&&o.mint===b.mint)||b.quantityBaseUnits===b.knownDeltaBaseUnits)?'verified':'partial',fromBlock:result.openings?.find(o=>o.accountId===b.accountId&&o.assetId===b.assetId&&o.mint===b.mint)?.beforeBlock??'0',toBlock:b.throughBlock,tipHash:b.blockHash,source:chain+'-history-adapter'}}));
 return validateHistorySession({id,chain,walletKey,walletScopeDigest,acceptedAt,events:result.replay.events,streams,issues:result.issues??[]});
}
/** Explicit encrypted exports exclude resume metadata and raw provider cache. */
export function portableWalletHistory(state){const clean=validateWalletHistory(state);return {...clean,pending:[]};}
/** Invalidate only historical claims after observed reorg/provider conflict; preserve evidence. */
export function invalidateHistory(model,id,reason){
 const state=validateWalletHistory(model.walletHistory??emptyWalletHistory());
 state.sessions=state.sessions.map(s=>s.id===id?{...s,streams:s.streams.map(v=>({...v,coverage:{...v.coverage,status:'partial'}})),issues:[...new Set([...s.issues,label(reason)])]}:s);
 return {...model,walletHistory:validateWalletHistory(state)};
}
