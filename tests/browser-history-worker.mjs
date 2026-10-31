import {browserGateDeadline,waitForAppServiceWorker} from './browser-gate-deadline.mjs';
import assert from 'node:assert/strict';import {mkdirSync,writeFileSync} from 'node:fs';import {chromium,firefox,webkit} from 'playwright';
for(const name of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const finish=browserGateDeadline('history-worker '+name,180000);
 const browser=await ({chromium,firefox,webkit}[name]).launch({headless:true});
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/tests/');
  console.log('HISTORY_WORKER_PHASE '+name+' responsive-replay');
  const r=await page.evaluate(async()=>{
   const {calculateHistoryDays}=await import('/src/wallet-history-calculation.js');const {event,stream}=await import('/tests/wallet-history-fixtures.mjs');
   const session={events:Array.from({length:1000},(_,i)=>event({txid:'tx-'+i,blockHeight:String(i+1),blockHash:'b-'+i,timestamp:new Date(Date.UTC(2025,0,1)+Math.floor(i/3)*864e5).toISOString()})),streams:[stream({throughBlock:'1000',coverage:{...stream().coverage,toBlock:'1000',tipHash:'b-999'}})]};
   const c=new AbortController(),start=performance.now();const work=calculateHistoryDays(session,{limit:365},{signal:c.signal});const handled=work.catch(e=>e.name);
   await new Promise(resolve=>setTimeout(resolve,25));const heartbeatMs=performance.now()-start;c.abort();const cancelled=await handled;
   const small={events:[event()],streams:[stream()]};const rows=await calculateHistoryDays(small,{limit:30});
   return {heartbeatMs,cancelled,last:rows.at(-1).quantityBaseUnits};
  });
  assert.ok(r.heartbeatMs<1500,'main thread blocked '+JSON.stringify(r));assert.equal(r.cancelled,'AbortError');assert.equal(r.last,'1');
  console.log('HISTORY_WORKER_PHASE '+name+' service-worker-activation');
  const workerState=()=>page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {url:location.href,timeOrigin:performance.timeOrigin,controller:navigator.serviceWorker.controller?.scriptURL??null,controllerState:navigator.serviceWorker.controller?.state??null,active:r?.active?.state??null,activeURL:r?.active?.scriptURL??null,waiting:r?.waiting?.state??null,installing:r?.installing?.state??null};});
  const lifecycle={engine:name,expectedScript:'http://127.0.0.1:4173/sw.js'},pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  try{
   await page.goto('http://127.0.0.1:4173/');await waitForAppServiceWorker(page);lifecycle.activated=await workerState();assert.equal(lifecycle.activated.active,'activated');assert.equal(lifecycle.activated.activeURL,lifecycle.expectedScript);
   // Activation alone does not prove control of this document. Establish the
   // actual initial controller before testing a controlled reload, then retain
   // the original post-reload and offline requirements without retries.
   await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL===new URL('sw.js',location.href).href&&navigator.serviceWorker.controller.state==='activated');lifecycle.beforeReload=await workerState();
   assert.equal(lifecycle.beforeReload.controller,lifecycle.expectedScript);await page.reload();
   await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL===new URL('sw.js',location.href).href&&navigator.serviceWorker.controller.state==='activated');lifecycle.afterReload=await workerState();
   assert.equal(lifecycle.afterReload.controller,lifecycle.expectedScript);assert.notEqual(lifecycle.afterReload.timeOrigin,lifecycle.beforeReload.timeOrigin);lifecycle.result='PASS';
  }finally{lifecycle.final=await workerState().catch(e=>({error:String(e)}));lifecycle.pageErrors=pageErrors;mkdirSync('artifacts/gates/history-worker',{recursive:true});writeFileSync('artifacts/gates/history-worker/'+name+'-controller.json',JSON.stringify(lifecycle,null,2));}
  await page.evaluate(async()=>{const {event,stream}=await import('/tests/wallet-history-fixtures.mjs');window.offlineHistoryFixture={events:[event({txid:'offline-worker',quantityBaseUnits:'2'})],streams:[stream()]};});
  console.log('HISTORY_WORKER_PHASE '+name+' offline-replay');
  await page.context().setOffline(true);
  const offline=await page.evaluate(async()=>{const {calculateHistoryDays}=await import('/src/wallet-history-calculation.js');return (await calculateHistoryDays(window.offlineHistoryFixture,{limit:31})).at(-1).quantityBaseUnits;});
  assert.equal(offline,'2');
  console.log('HISTORY WORKER '+name+': 1000-event computation leaves UI responsive, cancellation, exact worker replay and real Service Worker offline computation PASS '+Math.round(r.heartbeatMs)+'ms heartbeat');
 }finally{try{await browser.close();}finally{finish();}}
}
