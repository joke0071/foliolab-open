import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
for(const name of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[name]).launch({headless:true});
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/tests/');
  const result=await page.evaluate(async()=>{
   const {fetchBitcoinHistory}=await import('/src/bitcoin-history.js');
   const {tx,provider,wallets}=await import('/tests/bitcoin-history-fixtures.mjs');
   const {blankModel,backup}=await import('/src/model.js');
   const model=blankModel(),before=backup(model),storage=JSON.stringify(Object.entries(localStorage)),databases=JSON.stringify(await indexedDB.databases());
   const opts={wallets,observedAt:'2026-10-24T12:00:00.000Z',retryDelayMs:0};
   const p=provider(Array.from({length:26},(_,i)=>tx(i+1)));
   const first=await fetchBitcoinHistory({...opts,fetcher:p.fetcher,maxPages:1});
   const resumed=await fetchBitcoinHistory({...opts,fetcher:p.fetcher,resume:first.resume});
   const reorg=await fetchBitcoinHistory({...opts,fetcher:provider([tx(1)],{tipChange:true}).fetcher});
   const controller=new AbortController();controller.abort();
   const cancelled=await fetchBitcoinHistory({...opts,fetcher:p.fetcher,signal:controller.signal});
   const error=await fetchBitcoinHistory({...opts,fetcher:provider([],{fail:{path:'/txs/chain',status:403}}).fetcher});
   if(backup(model)!==before||JSON.stringify(Object.entries(localStorage))!==storage||JSON.stringify(await indexedDB.databases())!==databases)throw Error('state changed');
   return JSON.parse(JSON.stringify({resumed,first:first.issues,reorg:reorg.coverage,cancelled:cancelled.issues,error:error.issues}));
  });
  assert.equal(result.resumed.coverage,'verified');assert.equal(result.resumed.replay.balances[0].quantityBaseUnits,'2600');
  assert.deepEqual(result.first,['page-limit']);assert.equal(result.reorg,'partial');assert.deepEqual(result.cancelled,['aborted']);assert.deepEqual(result.error,['http-403']);
  console.log('BITCOIN HISTORY '+name+': pagination, resume, exact scanner/replay, reorg, abort, HTTP errors and untouched portfolio/storage PASS');
 }finally{await browser.close();}
}
