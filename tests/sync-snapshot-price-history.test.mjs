import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,backup,safeImport,createProvider,createAccount,createPosition} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {validateImportedPriceHistory} from '../src/historical-csv.js';
import {retainedHistoryDraft,historyIdentity} from '../src/history-evidence-cache.js';
import {validateHistorySession} from '../src/wallet-history-state.js';
import {event,stream,NOW} from './wallet-history-fixtures.mjs';
import {createSyncSnapshot,validateSyncSnapshot,SYNC_SNAPSHOT_KIND,SYNC_SNAPSHOT_UTF8_LIMIT} from '../src/sync-snapshot.js';

const days=['2025-01-02','2025-01-03'];
const points=()=>days.map((date,i)=>({date,total:100.1234567890123+i}));
const envelope=data=>JSON.stringify({kind:SYNC_SNAPSHOT_KIND,snapshotVersion:1,data});
function fixture(){
 let m=blankModel();
 m.providers.push(createProvider({id:'provider',name:'Broker',type:'broker'}));
 m.accounts.push(createAccount({id:'account',providerId:'provider',name:'Depot',type:'securities'},m));
 for(const [id,kind,currency] of [['stock','stock','EUR'],['foreign','stock','USD'],['crypto','crypto','USD']]){
  m.positions.push(createPosition({id,providerId:'provider',accountId:'account',kind,name:id,symbol:id.toUpperCase(),coinId:kind==='crypto'?'bitcoin':'',quantityExact:'1.000000000000000001',price:100,currency,fxRate:currency==='USD'?null:1,fxRateExact:currency==='USD'?'UNKNOWN':'1'},m));
 }
 executeTransaction(m,{id:'buy',type:'buy',date:'2025-01-01',positionId:'stock',quantity:'0.000000000000000001',unitPrice:'1',feeEUR:'0',taxEUR:'0'});
 m.priceHistories.stock=validateImportedPriceHistory({currency:'EUR',source:'CSV (selbst geprüft)',points:points()},m.positions[0]);
 m.priceHistories.foreign=validateImportedPriceHistory({currency:'USD',source:'CSV (selbst geprüft)',points:points(),fxPoints:[{date:days[1],currency:'USD',rate:'1.123456789012345678',source:'Frankfurter',referenceDate:days[0]}]},m.positions[1]);
 m=retainedHistoryDraft(m,'crypto',{currency:'EUR',source:'CoinGecko · daily',points:[{date:days[0],total:90000.123456789,valuationDate:null},{date:days[1],total:90001.123456789,valuationDate:days[0]}]},{rightsConfirmed:true});
 return JSON.parse(backup(m,{includeHistory:true}));
}
async function roundtrip(data){
 const before=JSON.stringify(data),withoutSettings=structuredClone(data);delete withoutSettings.settings;
 const plain=await createSyncSnapshot(before),result=await validateSyncSnapshot(plain);
 assert.equal(JSON.stringify(data),before);assert.deepEqual(result.data,withoutSettings);
 assert.equal(plain,envelope(withoutSettings));return result;
}
async function rejectBoth(data,reason){
 const before=JSON.stringify(data),received=structuredClone(data);delete received.settings;
 await assert.rejects(()=>createSyncSnapshot(before),reason);
 await assert.rejects(()=>validateSyncSnapshot(envelope(received)),reason);
 assert.equal(JSON.stringify(data),before);
}

test('canonical CSV, FX and retained crypto histories roundtrip together without changing finance',async()=>{
 const data=fixture();
 data.walletHistory={schema:1,sessions:[validateHistorySession({id:'accepted',chain:'eth',walletKey:'public',acceptedAt:NOW,
  events:[event({quantityBaseUnits:'9007199254740993000000000000000001'})],streams:[stream({opening:null})],quotes:[],issues:['missing-opening']})],pending:[]};
 const checked=JSON.parse(JSON.stringify(safeImport(data)));delete checked.settings;
 const original=structuredClone(data);delete original.settings;assert.deepEqual(checked,original);
 const result=await roundtrip(data);
 assert.equal(result.data.positions[1].fxRateExact,'UNKNOWN');assert.equal(result.data.positions[1].fxRate,null);
 assert.deepEqual(result.data.journalEntries,data.journalEntries);assert.deepEqual(result.data.bookings,data.bookings);
 assert.equal(result.data.priceHistories.foreign.fxPoints[0].rate,'1.123456789012345678');
 assert.equal(result.data.priceHistories.crypto.points[0].valuationDate,null);
 assert.equal(Object.hasOwn(result.data.priceHistories.stock,'fxPoints'),false);
 assert.ok(Object.isFrozen(result.data.priceHistories.crypto.provenance));
 assert.ok(Object.isFrozen(result.data.priceHistories.foreign.fxPoints[0]));
});
test('all existing confirmed providers and v4 archives retain provenance and price type',async()=>{
 for(const [provider,source] of [['eodhd','EODHD close'],['twelve','Twelve Data close'],['fmp','Financial Modeling Prep close'],['coingecko','CoinGecko daily'],['coinpaprika','CoinPaprika daily']]){
  const data=fixture(),p=data.positions.find(p=>p.id==='stock');
  data.priceHistories.stock=validateImportedPriceHistory({currency:'EUR',source,points:points(),priceType:'close',provenance:{schema:1,provider,identity:historyIdentity(p),retention:'user-confirmed'}},p);
  data.version=4;data.bookingPresentation={version:1,archivedIds:['buy']};
  await roundtrip(data);
 }
});
test('credential-bearing settings excluded while every history value and map order stay intact',async()=>{
 const data=fixture();data.settings={oauth:{accessToken:'SETTINGS_SECRET'},rpc:'https://user:SETTINGS_SECRET@invalid/'};
 data.priceHistories={crypto:data.priceHistories.crypto,foreign:data.priceHistories.foreign,stock:data.priceHistories.stock};
 const result=await roundtrip(data);assert.ok(!result.plain.includes('SETTINGS_SECRET'));
 assert.deepEqual(Object.keys(result.data.priceHistories),['crypto','foreign','stock']);
});
test('unknown keys and object-valued secrets reject at each newly admitted level',async()=>{
 const accessors=[d=>d.priceHistories.stock,d=>d.priceHistories.stock.points[0],d=>d.priceHistories.foreign.fxPoints[0],d=>d.priceHistories.crypto.provenance];
 for(const get of accessors){const data=fixture();get(data).accessToken='SECRET';await rejectBoth(data,/unsupported-data-or-field|envelope/);}
 for(const edit of [d=>d.priceHistories.stock.source={apiKey:'SECRET'},d=>d.priceHistories.foreign.fxPoints[0].rate={token:'SECRET'},d=>d.priceHistories.crypto.points[0].valuationDate={secret:1},d=>d.priceHistories.crypto.provenance.identity={key:1},d=>d.priceHistories.crypto.provenance.schema=2,d=>d.priceHistories.stock.points[0].total='100',d=>d.priceHistories.foreign.fxPoints[0].rate=1.1]){
  const data=fixture();edit(data);await rejectBoth(data,/unsupported-data-or-field|envelope/);
 }
});
test('orphan and dangerous history map identities block the whole portfolio',async()=>{
 for(const key of ['missing','__proto__','constructor','prototype']){
  const data=fixture();Object.defineProperty(data.priceHistories,key,{value:structuredClone(data.priceHistories.stock),enumerable:true});
  await rejectBoth(data,/Positionsbezug|unsupported-data-or-field|envelope/);
 }
});
test('retained history cannot change confirmed position, provider, retention, currency or price type',async()=>{
 for(const edit of [h=>h.provenance.identity='a'.repeat(64),h=>h.provenance.provider='eodhd',h=>h.provenance.retention='automatic',h=>h.priceType='close',h=>h.currency='GBP',h=>h.source='Unconfirmed source']){
  const data=fixture();edit(data.priceHistories.crypto);await rejectBoth(data,/bestätigt|Währungen/);
 }
});
test('invalid, duplicate or reversed price points never normalize silently',async()=>{
 for(const edit of [h=>h.points.reverse(),h=>h.points[1].date=h.points[0].date,h=>h.points[0].date='2025-02-30',h=>h.points[0].date='2999-01-01',h=>h.points[0].total=0,h=>h.points.pop()]){
  const data=fixture();edit(data.priceHistories.stock);await rejectBoth(data,/historische Kurse|Datenlimits|normalization-required/);
 }
});
test('FX source, date, duplicate, reference window and rate validation remain mandatory',async()=>{
 for(const edit of [h=>h.fxPoints[0].source='Other',h=>h.fxPoints[0].currency='EUR',h=>h.fxPoints[0].rate='0',h=>h.fxPoints[0].referenceDate='2025-01-04',h=>h.fxPoints[0].referenceDate='2024-12-01',h=>h.fxPoints[0].date='2025-02-30',h=>h.fxPoints.push({...h.fxPoints[0]})]){
  const data=fixture();edit(data.priceHistories.foreign);await rejectBoth(data,/FX-|Zeitbezug/);
 }
});
test('known fields needing defaults, uppercase or projection reject lossily',async()=>{
 for(const edit of [d=>d.priceHistories.stock.currency='eur',d=>d.priceHistories.stock.fxPoints=[],d=>d.priceHistories.stock.priceType='close',d=>d.priceHistories.stock.points[0].valuationDate=null,d=>delete d.priceHistories.crypto.fxPoints]){
  const data=fixture();edit(data);await rejectBoth(data,/normalization-required/);
 }
});
test('limits reject whole histories without truncation or publishing other valid histories',async()=>{
 const data=fixture();data.priceHistories.stock.points=Array.from({length:6501},(_,i)=>({date:new Date(Date.UTC(2000,0,1+i)).toISOString().slice(0,10),total:1}));
 await rejectBoth(data,/Datenlimits/);
 const tooMany=fixture();tooMany.priceHistories.stock.points=Array.from({length:6500},()=>({date:days[0],total:1}));
 // Even allowed-size lists still face semantic validation, rather than pruning.
 await rejectBoth(tooMany,/historische Kurse/);
 const bytes=fixture();bytes.priceHistories.crypto.source='CoinGecko '+ 'x'.repeat(SYNC_SNAPSHOT_UTF8_LIMIT);
 await rejectBoth(bytes,/byte-budget|bestätigt/);
});
test('unsupported evidence, v5 and pending state still block otherwise supported histories',async()=>{
 for(const edit of [d=>d.version=5,d=>d.purchaseEvidence={schema:2,receipts:[],decisions:[]},d=>d.walletHistory={schema:1,sessions:[],pending:[{id:'pending'}]},d=>d.positions[0].importSource={sourcePayload:'SECRET'}]){
  const data=fixture();edit(data);await rejectBoth(data,/unsupported-data-or-field|envelope/);
 }
});
