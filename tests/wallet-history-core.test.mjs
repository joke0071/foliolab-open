import test from 'node:test';
import assert from 'node:assert/strict';
import {event,stream,NOW} from './wallet-history-fixtures.mjs';
import {validateHistoryEvent,historyEventId,dedupeHistoryEvents,sortHistoryEvents,replayWalletHistory,reconcileWalletHistory,validateHistoryRequest,validateHistoryPage} from '../src/wallet-history-core.js';
const replay=(events,streams=[stream()])=>replayWalletHistory({events,streams});
test('WH01 exact signed 24-decimal quantities, huge integers and JSON roundtrip',()=>{
 const huge='12345678901234567890123456789012345678901234567890';
 const result=replay([event({quantityBaseUnits:huge}),event({txid:'tx-2',quantityBaseUnits:'-7',type:'outgoing'})]);
 assert.equal(result.balances[0].quantityBaseUnits,(BigInt(huge)-7n).toString());
 assert.deepEqual(JSON.parse(JSON.stringify(result)),result);
 for(const quantityBaseUnits of [1,1n,'1.1','1e3','+1','01','-0',null]){
  if(quantityBaseUnits===null)assert.doesNotThrow(()=>validateHistoryEvent(event({quantityBaseUnits,type:'unknown'})));
  else assert.throws(()=>validateHistoryEvent(event({quantityBaseUnits})));
 }
});
test('WH01 same tx two indices; stable IDs and order with same timestamp',()=>{
 const a=event(),b=event({locator:{kind:'log',index:'1',subindex:'0'}});
 assert.notEqual(historyEventId(a),historyEventId(b));
 assert.deepEqual(sortHistoryEvents([b,a]),sortHistoryEvents([a,b]));
 assert.equal(replay([a,b]).balances[0].quantityBaseUnits,'2');
 assert.throws(()=>validateHistoryEvent({...a,id:'forged'}));
});
test('WH01 repeated imports and explicit same-account wallet/HD overlap deduplicate',()=>{
 const a=event(),alias=event({walletId:'HD-alias',observedAt:'2026-10-24T13:00:00.000Z',source:'second-provider'});
 assert.equal(dedupeHistoryEvents([a,a,alias]).events.length,1);
 assert.deepEqual(replay([a,alias,a]),replay([alias,a]));
 assert.equal(replay([a,alias]).balances[0].quantityBaseUnits,'1');
});
test('WH01 BTC input/change and fee contract applies fee once',()=>{
 const input=event({type:'outgoing',quantityBaseUnits:'-100',locator:{kind:'vin',index:'0',subindex:'0'}});
 const change=event({quantityBaseUnits:'39',locator:{kind:'vout',index:'1',subindex:'0'}});
 // Adapter supplies transfer debit excluding fee; raw prevout -100 would be -101 with separate fee.
 const debit={...input,quantityBaseUnits:'-99'};
 const fee=event({type:'fee',quantityBaseUnits:'-1',locator:{kind:'fee',index:'0',subindex:'0'}});
 const s=stream({opening:{quantityBaseUnits:'100',beforeBlock:'0',source:'fixture'}});
 assert.equal(replay([debit,change,fee,fee],[s]).balances[0].quantityBaseUnits,'39');
});
test('WH01 >2 own wallets: transfer legs net neutral, fee once in aggregate',()=>{
 const events=[event({quantityBaseUnits:'-12',type:'internal_transfer'}),event({accountId:'b',walletId:'b',quantityBaseUnits:'7',type:'internal_transfer'}),event({accountId:'c',walletId:'c',quantityBaseUnits:'5',type:'internal_transfer'}),event({type:'fee',quantityBaseUnits:'-1',locator:{kind:'fee',index:'0',subindex:'0'}})];
 const streams=['a','b','c'].map(accountId=>stream({accountId,opening:{quantityBaseUnits:accountId==='a'?'20':'0',beforeBlock:'0',source:'fixture'}}));
 const r=replay(events,streams);assert.equal(r.totals[0].quantityBaseUnits,'19');
 assert.equal(r.balances.length,3);
});
test('WH01 missing opening/genesis, provenance and provider gaps never become zero',()=>{
 for(const s of [stream({opening:null}),stream({coverage:{...stream().coverage,status:'partial'}}),stream({coverage:{...stream().coverage,fromBlock:'1'}}),stream({coverage:{...stream().coverage,toBlock:'9'}})]){
  const r=replay([], [s]);assert.equal(r.balances[0].quantityBaseUnits,null);assert.notEqual(r.balances[0].coverage,'verified');
 }
 for(const e of [event({source:null}),event({blockHash:null}),event({timestamp:null}),event({coverage:'partial'})])assert.equal(replay([e]).balances[0].quantityBaseUnits,null);
 assert.equal(replay([]).balances[0].quantityBaseUnits,'0','only an evidenced complete empty interval proves zero');
});
test('WH01 conflicting duplicate, reorg and orphaned events withhold balances deterministically',()=>{
 const a=event(),b=event({blockHash:'replacement'});
 assert.equal(dedupeHistoryEvents([a,b]).conflicts.length,1);
 assert.deepEqual(replay([a,b]),replay([b,a]));
 assert.equal(replay([a,b]).balances[0].quantityBaseUnits,null);
 assert.equal(replay([event({status:'orphaned',finality:'orphaned'})]).balances[0].quantityBaseUnits,null);
});
test('WH01 failed transaction is fee-only; unconfirmed is not final balance',()=>{
 const fee=event({type:'fee',status:'failed',quantityBaseUnits:'-2',locator:{kind:'fee',index:'0',subindex:'0'}});
 assert.equal(replay([fee],[stream({opening:{quantityBaseUnits:'10',beforeBlock:'0',source:'fixture'}})]).balances[0].quantityBaseUnits,'8');
 assert.throws(()=>validateHistoryEvent(event({status:'failed'})));
 assert.equal(replay([event({status:'unconfirmed',finality:'unconfirmed',blockHeight:null,blockHash:null})]).balances[0].quantityBaseUnits,null);
});
test('WH01 unknown rebase and decimals mismatch withhold amounts',()=>{
 const r=replay([event({type:'unknown',quantityBaseUnits:null,coverage:'unsupported',qualityCode:'unknown-rebase'})]);
 assert.equal(r.balances[0].quantityBaseUnits,null);assert.equal(r.balances[0].coverage,'unsupported');
 assert.equal(replay([event({decimals:18})]).balances[0].quantityBaseUnits,null);
});
test('WH01 block cutoff, source range and distinct chain/contract identity',()=>{
 assert.equal(replay([event({blockHeight:'11'})]).balances[0].quantityBaseUnits,'0');
 assert.throws(()=>replay([event({contract:'different-contract'})]));
 assert.throws(()=>replay([event({chainId:'2'})]));
 assert.throws(()=>replay([], [stream(),stream()]));
 assert.equal(replay([event({blockHeight:'9'})],[stream({opening:{quantityBaseUnits:'20',beforeBlock:'10',source:'checkpoint'},coverage:{...stream().coverage,fromBlock:'10'}})]).balances[0].quantityBaseUnits,'20');
});
test('WH01 exact same-block reconciliation, mismatch and unknown are explicit',()=>{
 const snapshot={...stream(),blockHeight:'10',blockHash:'block-10',quantityBaseUnits:'1',source:'scanner'};
 assert.equal(reconcileWalletHistory(replay([event()]),[snapshot])[0].status,'verified');
 assert.equal(reconcileWalletHistory(replay([event()]),[{...snapshot,quantityBaseUnits:'2'}])[0].differenceBaseUnits,'-1');
 for(const patch of [{blockHeight:'9'},{blockHash:'other'},{source:null}])assert.equal(reconcileWalletHistory(replay([event()]),[{...snapshot,...patch}])[0].status,'unknown');
 assert.equal(reconcileWalletHistory(replay([],[stream({opening:null})]),[snapshot])[0].status,'unknown');
});
test('WH01 validators reject impossible signs, metadata and UTC dates',()=>{
 for(const patch of [{type:'fee',quantityBaseUnits:'1'},{type:'outgoing',quantityBaseUnits:'1'},{type:'incoming',quantityBaseUnits:'-1'},{decimals:1.5},{decimals:256},{observedAt:'2026-02-30T12:00:00.000Z'},{timestamp:'2026-10-24T14:00:00+02:00'},{locator:{kind:'fee',index:'1',subindex:'0'}}])assert.throws(()=>validateHistoryEvent(event(patch)));
});
test('WH01 provider request/page: bounded cursor, AbortSignal, windows, no calls',()=>{
 const request={provider:'fixture',network:'ethereum',chainId:'1',accountId:'a',filterKey:'token-v1',schemaVersion:1,cursor:null,pageSize:2,maxPages:3,page:0,from:NOW,to:NOW,signal:new AbortController().signal};
 assert.doesNotThrow(()=>validateHistoryRequest(request));
 const cursor={provider:'fixture',filterKey:'token-v1',schemaVersion:1,network:'ethereum',chainId:'1',accountId:'a',value:'next'};
 const page={events:[event()],nextCursor:cursor,coverage:'partial',oldestReached:false};
 assert.doesNotThrow(()=>validateHistoryPage(page,request));
 for(const patch of [{cursor:{...cursor,accountId:'other'}},{pageSize:0},{maxPages:0},{page:3},{from:'2026-10-25T00:00:00.000Z'},{signal:{}},{cursor:{...cursor,schemaVersion:2}}])assert.throws(()=>validateHistoryRequest({...request,...patch}));
 assert.throws(()=>validateHistoryPage({...page,events:[event(),event(),event()]},request));
 assert.throws(()=>validateHistoryPage({...page,events:[event({accountId:'other'})]},request));
 assert.throws(()=>validateHistoryPage({...page,events:[event({timestamp:'2026-10-23T00:00:00.000Z'})]},request));
 const controller=new AbortController();controller.abort();assert.throws(()=>validateHistoryRequest({...request,signal:controller.signal}),{name:'AbortError'});
});
test('WH01 pure APIs leave caller data untouched',()=>{
 const data={events:[event()],streams:[stream()]},before=structuredClone(data);
 replayWalletHistory(data);assert.deepEqual(data,before);
});
