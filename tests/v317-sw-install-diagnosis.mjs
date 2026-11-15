import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';
import {createHash} from 'node:crypto';
const root='artifacts/v317-sw-install';mkdirSync(root,{recursive:true});
const report={product:'a53856e385ef1d9fd65d8710618244e80b8341e7',diagnosticHead:process.env.GITHUB_SHA,originalRun:43713836553,originalAttempt:2,originalJob:132821674164,thresholdMs:20000,roundLimit:8,startedAt:new Date().toISOString(),rounds:[],result:'PENDING',sourceHashes:Object.fromEntries(['src/app.js','sw.js','tests/browser-controlled-storage-fixture.mjs'].map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]))};
const persist=()=>writeFileSync(root+'/report.json',JSON.stringify(report,null,2));
persist();let failed=false;
for(let i=0;i<8;i++){
 const r={index:i,startedAt:new Date().toISOString(),phase:'startup',requests:[],workerEvents:[],result:'PENDING'};report.rounds.push(r);persist();
 const browser=await chromium.launch({headless:true});let context;
 try{
  r.browser=browser.version();context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'allow'});const ids=new WeakMap();let next=0;
  context.on('request',q=>{const id=++next;ids.set(q,id);r.requests.push({id,event:'request',at:Date.now(),url:q.url(),worker:q.serviceWorker()?.url()||null,resource:q.resourceType(),phase:r.phase});});
  context.on('response',q=>{r.requests.push({id:ids.get(q.request()),event:'response',at:Date.now(),url:q.url(),status:q.status(),headers:q.headers(),worker:q.request().serviceWorker()?.url()||null,phase:r.phase});});
  context.on('requestfailed',q=>r.requests.push({id:ids.get(q),event:'failed',at:Date.now(),url:q.url(),failure:q.failure(),worker:q.serviceWorker()?.url()||null,phase:r.phase}));
  const p=await context.newPage();p.setDefaultTimeout(20000);const cdp=await context.newCDPSession(p);
  for(const event of ['ServiceWorker.workerErrorReported','ServiceWorker.workerVersionUpdated','ServiceWorker.workerRegistrationUpdated'])cdp.on(event,payload=>r.workerEvents.push({event,at:Date.now(),payload,phase:r.phase}));
  await cdp.send('ServiceWorker.enable');await p.goto('https://foliolab.unperfekt.at/?page=bookings');
  const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
  r.phase='unchanged-controlled-storage-fixture';
  try{r.verified=await controlledStorageFixture(p,ready,record);r.result='PASS';}
  catch(error){r.result='FAIL';r.error=String(error);r.stack=error.stack;failed=true;
   r.final=await p.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();return{controller:navigator.serviceWorker.controller?.scriptURL,active:reg?.active?.state,installing:reg?.installing?.state,waiting:reg?.waiting?.state,cacheEntries:await Promise.all((await caches.keys()).map(async k=>({name:k,count:(await(await caches.open(k)).keys()).length})))}}).catch(e=>({error:String(e)}));}
  r.badResponses=r.requests.filter(x=>x.event==='response'&&x.status>=400);
  r.failedRequests=r.requests.filter(x=>x.event==='failed');
  r.phase='cleanup';
 }finally{r.phase='cleanup';await context?.close();await browser.close();r.finishedAt=new Date().toISOString();persist();}
 console.log('V317_SW_ROUND '+JSON.stringify({index:i,result:r.result,bad:r.badResponses?.map(x=>({url:x.url,status:x.status,worker:x.worker})),workerErrors:r.workerEvents.filter(x=>x.event==='ServiceWorker.workerErrorReported')}));
 if(failed)break;
}
report.result=failed?'FAIL':'PASS';report.finishedAt=new Date().toISOString();persist();assert.equal(failed,false,'unchanged20s acquisition; capture actual worker/network failure without another regular live attempt');
