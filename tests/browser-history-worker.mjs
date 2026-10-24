import assert from 'node:assert/strict';import {chromium,firefox,webkit} from 'playwright';
for(const name of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[name]).launch({headless:true});
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/tests/');
  const r=await page.evaluate(async()=>{
   const {calculateHistoryDays}=await import('/src/wallet-history-calculation.js');const {event,stream}=await import('/tests/wallet-history-fixtures.mjs');
   const session={events:Array.from({length:1000},(_,i)=>event({txid:'tx-'+i,blockHeight:String(i+1),blockHash:'b-'+i,timestamp:new Date(Date.UTC(2025,0,1)+Math.floor(i/3)*864e5).toISOString()})),streams:[stream({throughBlock:'1000',coverage:{...stream().coverage,toBlock:'1000',tipHash:'b-999'}})]};
   const c=new AbortController(),start=performance.now();const work=calculateHistoryDays(session,{limit:365},{signal:c.signal});const handled=work.catch(e=>e.name);
   await new Promise(resolve=>setTimeout(resolve,25));const heartbeatMs=performance.now()-start;c.abort();const cancelled=await handled;
   const small={events:[event()],streams:[stream()]};const rows=await calculateHistoryDays(small,{limit:30});
   return {heartbeatMs,cancelled,last:rows.at(-1).quantityBaseUnits};
  });
  assert.ok(r.heartbeatMs<1500,'main thread blocked '+JSON.stringify(r));assert.equal(r.cancelled,'AbortError');assert.equal(r.last,'1');
  await page.goto('http://127.0.0.1:4173/');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.evaluate(async()=>{const {event,stream}=await import('/tests/wallet-history-fixtures.mjs');window.offlineHistoryFixture={events:[event({txid:'offline-worker',quantityBaseUnits:'2'})],streams:[stream()]};});
  await page.context().setOffline(true);
  const offline=await page.evaluate(async()=>{const {calculateHistoryDays}=await import('/src/wallet-history-calculation.js');return (await calculateHistoryDays(window.offlineHistoryFixture,{limit:31})).at(-1).quantityBaseUnits;});
  assert.equal(offline,'2');
  console.log('HISTORY WORKER '+name+': 1000-event computation leaves UI responsive, cancellation, exact worker replay and real Service Worker offline computation PASS '+Math.round(r.heartbeatMs)+'ms heartbeat');
 }finally{await browser.close();}
}
