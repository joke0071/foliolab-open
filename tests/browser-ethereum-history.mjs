import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';import {chromium,firefox,webkit} from 'playwright';
for(const name of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[name]).launch({headless:true});
 try{
  const page=await legacyPage(browser);await page.goto('http://127.0.0.1:4173/tests/');
  const r=await page.evaluate(async()=>{
   const {fetchEthereumHistory}=await import('/src/ethereum-history.js');
   const {wallets,tokens,openings,provider,now}=await import('/tests/ethereum-history-fixtures.mjs');
   const {blankModel,backup}=await import('/src/model.js');
   const model=blankModel(),before=backup(model),storage=JSON.stringify(Object.entries(localStorage)),db=JSON.stringify(await indexedDB.databases());
   const opts={wallets,tokens,openings,observedAt:now,retryDelayMs:0};
   const p=provider({pages:true}),first=await fetchEthereumHistory({...opts,fetcher:p.fetcher,maxPages:1});
   const result=await fetchEthereumHistory({...opts,fetcher:p.fetcher,resume:first.resume});
   const bad=await fetchEthereumHistory({...opts,fetcher:provider({reorg:true}).fetcher});
   const c=new AbortController();c.abort();const cancel=await fetchEthereumHistory({...opts,fetcher:p.fetcher,signal:c.signal});
   if(before!==backup(model)||storage!==JSON.stringify(Object.entries(localStorage))||db!==JSON.stringify(await indexedDB.databases()))throw Error('state changed');
   return JSON.parse(JSON.stringify({result,first:first.issues,bad:bad.coverage,cancel:cancel.issues}));
  });
  assert.deepEqual(r.first,['page-limit']);assert.equal(r.result.replay.balances.find(b=>b.contract).quantityBaseUnits,'7');
  assert.equal(r.result.replay.balances.find(b=>!b.contract).quantityBaseUnits,null);assert.equal(r.bad,'partial');assert.deepEqual(r.cancel,['aborted']);
  console.log('ETHEREUM HISTORY '+name+': receipt-backed ETH/ERC20, real cursor, safe resume, exact reconciliation, reorg/abort, unchanged portfolio/backup/storage PASS');
 }finally{await browser.close();}
}
