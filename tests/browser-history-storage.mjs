import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';import {chromium,firefox,webkit} from 'playwright';
for(const name of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[name]).launch({headless:true});
 try{
  const page=await legacyPage(browser);await page.goto('http://127.0.0.1:4173/tests/');
  const r=await page.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const {blankModel,backup,safeImport}=await import('/src/model.js');
   const {acceptHistory,historyPreview,checkpointHistory}=await import('/src/wallet-history-state.js');const {replayWalletHistory}=await import('/src/wallet-history-core.js');const {event,stream,NOW}=await import('/tests/wallet-history-fixtures.mjs');
   const session=historyPreview({replay:replayWalletHistory({events:[event()],streams:[stream()]}),issues:[]},{id:'session',chain:'eth',walletKey:'public',acceptedAt:NOW});
   const first=new PortfolioStorage();await first.initialize();let model=acceptHistory(blankModel(),session);await first.save(model);
   const after=await first.reload();if(JSON.stringify(after.walletHistory)!==JSON.stringify(model.walletHistory))throw Error('local lost history');
   await first.migrate(after);const a=new PortfolioStorage(),b=new PortfolioStorage();const ma=await a.initialize(),mb=await b.initialize();
   const draft=checkpointHistory(ma,{id:'pending',chain:'eth',walletKey:'public',provider:'rpc.test',filter:'all',tip:'10',updatedAt:NOW});await a.save(draft);
   let stale=false;try{await b.save(mb);}catch{stale=true;}
   const before=JSON.stringify((await a.reload()).walletHistory);const put=IDBObjectStore.prototype.put;let quota=false;
   IDBObjectStore.prototype.put=function(){throw new DOMException('fixture quota','QuotaExceededError');};
   try{await a.save(ma);}catch{quota=true;}finally{IDBObjectStore.prototype.put=put;}
   if(before!==JSON.stringify((await a.reload()).walletHistory))throw Error('quota changed committed history');
   const {openPortfolioDB}=await import('/src/atomic-storage.js');let blocked=false,closed=false;
   const req={result:{close(){closed=true;}}};
   const opening=openPortfolioDB({open(){queueMicrotask(()=>req.onblocked());return req;}});
   try{await opening;}catch(e){blocked=/blockiert/.test(e.message);}req.onsuccess();
   if(!blocked||!closed||before!==JSON.stringify((await a.reload()).walletHistory))throw Error('blocked upgrade did not fail closed');
   const restored=safeImport(JSON.parse(backup(await a.reload(),{includeHistory:true})));
   return {stale,quota,sessions:restored.walletHistory.sessions.length,pending:restored.walletHistory.pending[0].status,plainLeaks:backup(restored).includes('walletHistory'),financialUnchanged:restored.journalEntries.length===0&&restored.snapshots.length===0};
  });
  assert.deepEqual(r,{stale:true,quota:true,sessions:1,pending:'re-fetch-needed',plainLeaks:false,financialUnchanged:true});
  console.log('HISTORY STORAGE '+name+': local/IDB persistence, restore, stale CAS, quota rollback, injected blocked upgrade, refetch checkpoint, credential-free export PASS');
 }finally{await browser.close();}
}
