import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {replayWalletHistory,reconcileWalletHistory,historyEventId} from '../src/wallet-history-core.js';
import {event,stream} from './wallet-history-fixtures.mjs';
const huge='12345678901234567890123456789012345678901234567890';
const fee=event({type:'fee',quantityBaseUnits:'-1',locator:{kind:'fee',index:'0',subindex:'0'}});
const btcInput=event({type:'outgoing',quantityBaseUnits:'-100',locator:{kind:'vin',index:'0',subindex:'0'}});
const cases=[
 {events:[btcInput,event({quantityBaseUnits:'39',locator:{kind:'vout',index:'1',subindex:'0'}}),{...fee,includedInEventId:historyEventId(btcInput)}],streams:[stream({opening:{quantityBaseUnits:'100',beforeBlock:'0',source:'fixture'}})]},
 {events:[event({quantityBaseUnits:huge}),fee,fee],streams:[stream()]},
 {events:[event(),event({locator:{kind:'log',index:'1',subindex:'0'}})],streams:[stream()]},
 {events:[event(),event({walletId:'HD-alias'})],streams:[stream()]},
 {events:[event(),event({blockHash:'reorg'})],streams:[stream()]},
 {events:[event({type:'unknown',quantityBaseUnits:null,coverage:'unsupported'})],streams:[stream()]},
 {events:[],streams:[stream({opening:null})]},
 {events:[event({status:'failed',type:'fee',quantityBaseUnits:'-1',locator:{kind:'fee',index:'0',subindex:'0'}})],streams:[stream({opening:{quantityBaseUnits:'10',beforeBlock:'0',source:'fixture'}})]},
 {events:[event({accountId:'a',walletId:'a',quantityBaseUnits:'-12',type:'internal_transfer'}),event({accountId:'b',walletId:'b',quantityBaseUnits:'7',type:'internal_transfer'}),event({accountId:'c',walletId:'c',quantityBaseUnits:'5',type:'internal_transfer'}),fee],streams:['a','b','c'].map(accountId=>stream({accountId,opening:{quantityBaseUnits:accountId==='a'?'20':'0',beforeBlock:'0',source:'fixture'}}))}
];
const expected=cases.map(replayWalletHistory);
for(const name of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const engine={chromium,firefox,webkit}[name];assert.ok(engine,'unknown engine');
 const browser=await engine.launch({headless:true});
 try{
  const page=await legacyPage(browser);
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto('http://127.0.0.1:4173/tests/');
  const actual=await page.evaluate(async cases=>{
   const core=await import('/src/wallet-history-core.js');
   const {blankModel,backup}=await import('/src/model.js');
   const model=blankModel(),portfolio=backup(model);
   localStorage.setItem('foliolab-open-v1',portfolio);
   const storage=()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));
   const before=storage(),dbBefore=JSON.stringify(await indexedDB.databases());
   const savedFetch=globalThis.fetch;let calls=0;
   globalThis.fetch=()=>{calls++;throw Error('Core must not access network');};
   try{
    const results=cases.map(input=>{
     const before=JSON.stringify(input),result=core.replayWalletHistory(input);
     if(JSON.stringify(input)!==before)throw Error('Caller input mutated');
     return JSON.parse(JSON.stringify(result));
    });
    if(storage()!==before||backup(model)!==portfolio||JSON.stringify(await indexedDB.databases())!==dbBefore)throw Error('Persistent or model state changed');
    if(calls)throw Error('Network called');
    const b=results[0].balances[0];
    const reconciliation=core.reconcileWalletHistory(results[0],[{...b,blockHeight:b.throughBlock,source:'browser-fixture'}]);
    return {results,reconciliation};
   }finally{globalThis.fetch=savedFetch;}
  },cases);
  assert.deepEqual(actual.results,expected);
  const b=expected[0].balances[0];
  assert.deepEqual(actual.reconciliation,reconcileWalletHistory(expected[0],[{...b,blockHeight:b.throughBlock,source:'browser-fixture'}]));
  console.log('WH01 '+name+': 9 exact replay fixtures match Node; JSON, reconciliation, no network/storage/model changes PASS');
 }finally{await browser.close();}
}
