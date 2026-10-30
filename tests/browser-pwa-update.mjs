// Real worker update against deliberately fresh HTTP-cache entries. Synthetic only.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium,firefox,webkit} from 'playwright';
import {waitForAsyncReadiness} from './browser-async-readiness.mjs';

const sw=await readFile('sw.js','utf8'),cache=sw.match(/const CACHE='([^']+)'/)[1];
const oldCache='foliolab-open-synthetic-previous';
const assets=JSON.parse(sw.match(/const ASSETS=(\[[^\n]+\]);/)[1].replaceAll("'",'"'));
const current=new Map(await Promise.all(assets.map(async asset=>{
 const path=asset==='./'?'index.html':asset.slice(2);
 return ['/'+path,await readFile(path)];
})));
const previous=new Map(current);
previous.set('/src/app.js',Buffer.concat([current.get('/src/app.js'),Buffer.from('\n/* SYNTHETIC previous release app bytes */\n')]));
previous.set('/styles.css',Buffer.concat([current.get('/styles.css'),Buffer.from('\n:root{--synthetic-previous-release:1}\n')]));
// Deliberately retain the old installation behavior for the previous release.
const oldSW=sw.replace("const CACHE='"+cache+"'","const CACHE='"+oldCache+"'")
 .replace("ASSETS.map(asset=>new Request(asset,{cache:'reload'}))",'ASSETS');
let generation='previous';
let failedAssetRequest;
const requests=[];
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 const key=path==='/'?'/index.html':path;
 if(generation==='failed'&&key==='/styles.css'){
  failedAssetRequest?.();res.writeHead(503,{'Cache-Control':'no-store'});res.end('SYNTHETIC unavailable release asset');return;
 }
 const body=key==='/sw.js'?Buffer.from(generation==='previous'?oldSW:sw):(generation==='previous'?previous:current).get(key);
 if(!body){res.writeHead(404);res.end();return;}
 requests.push({generation,path:key});
 res.writeHead(200,{'Content-Type':key.endsWith('.js')?'text/javascript':key.endsWith('.css')?'text/css':key.endsWith('.svg')?'image/svg+xml':key.endsWith('.html')?'text/html':'application/json',
  'Cache-Control':key==='/sw.js'?'no-store':'public, max-age=3600'});
 res.end(body);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const report={scope:'Synthetic warm HTTP cache, real previous/current Service Workers, exact cached bytes and IndexedDB, no physical hardware claim',cache,engines:[]};
await mkdir('artifacts/gates/pwa-update',{recursive:true});
try{
 for(const engine of (process.env.PWA_UPDATE_ENGINES||'chromium').split(',')){
  generation='previous';requests.length=0;
  const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  const context=await browser.newContext({viewport:{width:390,height:700}}),page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const result={engine,result:'RUNNING',checks:[],readiness:[],lifecycle:[]};report.engines.push(result);
  page.on('framenavigated',frame=>{if(frame===page.mainFrame())result.lifecycle.push({event:'navigation',at:Date.now(),url:frame.url()});});
  page.on('console',message=>{if(message.text().startsWith('PWA_LIFECYCLE '))result.lifecycle.push({event:'worker',at:Date.now(),message:message.text()});});
  await context.addInitScript(()=>{
   const describe=worker=>worker?{scriptURL:worker.scriptURL,state:worker.state}:null;
   const emit=event=>console.info('PWA_LIFECYCLE '+JSON.stringify({event,timeOrigin:performance.timeOrigin,controller:describe(navigator.serviceWorker.controller)}));
   const watch=()=>{
    const worker=navigator.serviceWorker.controller;
    if(worker)worker.addEventListener('statechange',()=>emit('statechange'));
   };
   navigator.serviceWorker.addEventListener('controllerchange',()=>{emit('controllerchange');watch();});
   emit('document');watch();
  });
  const wait=async(stage,predicate,arg,options)=>{
   const receipt=await waitForAsyncReadiness(page,predicate,arg,options);
   result.readiness.push({stage,...receipt});assert.equal(receipt.value,true);
  };
  const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
  const cachedHashes=()=>page.evaluate(async cacheName=>{
   const c=await caches.open(cacheName),rows=[];
   for(const request of await c.keys()){
    const bytes=await(await c.match(request)).arrayBuffer();
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
    rows.push({path:new URL(request.url).pathname,sha256:hash});
   }
   return rows;
  },cache);
  try{
   await page.goto(base,{waitUntil:'networkidle'});await ready();
   await wait('previous-controller',async old=>Boolean(navigator.serviceWorker.controller)&&(await caches.keys()).includes(old),oldCache);
   await page.evaluate(async()=>{
    const {blankModel,createProvider,createAccount,createPosition,snapshot}=await import('/src/model.js');
    const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
    const m=blankModel();m.settings.autoRefresh=false;
    m.providers.push(createProvider({id:'p',name:'SYNTHETIC worker update'}));
    m.accounts.push(createAccount({id:'a',providerId:'p',name:'SYNTHETIC account',type:'cash'},m));
    m.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',name:'SYNTHETIC cash',kind:'cash',quantity:1234,price:1},m));
    snapshot(m,'2026-10-28','SYNTHETIC reference',{manualTotalEUR:'1234'});
    const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
   });
   await page.reload({waitUntil:'networkidle'});await ready();const before=await record();
   assert.match(await page.evaluate(async()=>await(await fetch('/src/app.js')).text()),/SYNTHETIC previous release app bytes/);
   result.checks.push('previous worker controls actual synthetic IndexedDB portfolio with warm HTTP app/CSS cache');
   // A failed update must leave the old complete worker usable, including offline.
   generation='failed';const rejectedAsset=new Promise(resolve=>{failedAssetRequest=resolve;});
   await page.evaluate(()=>{
    const operation=window.__pwaFailedUpdate={settled:false,error:null};
    setTimeout(async()=>{
     try{await(await navigator.serviceWorker.getRegistration()).update();}
     catch(error){operation.error=String(error);}
     finally{operation.settled=true;}
    },0);
   });
   await Promise.race([rejectedAsset,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Failed-release fixture was not requested')),30000);timer.unref();})]);
   await wait('failed-install-settled',async()=>{const r=await navigator.serviceWorker.getRegistration();return window.__pwaFailedUpdate?.settled===true&&!r.installing&&!r.waiting;});
   result.failedUpdateOperation=await page.evaluate(()=>window.__pwaFailedUpdate);
   assert.equal(result.failedUpdateOperation.settled,true,'failed update operation completed before next generation');
   assert.match(await page.evaluate(async()=>await(await fetch('/src/app.js')).text()),/SYNTHETIC previous release app bytes/);
   await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await ready();
   assert.deepEqual(await record(),before,'failed installation preserves exact offline record');
   assert.ok((await page.evaluate(()=>caches.keys())).includes(oldCache),'failed install keeps previous complete cache');
   await context.setOffline(false);result.checks.push('actual 503 aborts new installation; previous app and offline portfolio survive unchanged');
   generation='current';
   const beforeUpdateDocument=await page.evaluate(()=>performance.timeOrigin);
   // Arm before update(): the real app reloads on controllerchange. The new
   // controller can become visible before that navigation has committed.
   const automaticReload=page.waitForEvent('framenavigated',{
    predicate:frame=>frame===page.mainFrame(),timeout:60000
   }).then(()=>({observed:true}),error=>({observed:false,error:String(error)}));
   // update() may trigger the app's intended controllerchange reload before
   // its promise reaches the old document. Observe the new controller below.
   await page.evaluate(()=>{setTimeout(()=>navigator.serviceWorker.getRegistration().then(r=>r.update()).catch(error=>console.error('Worker update failed',error)),0);});
   await wait('current-controller',async expected=>{
    const r=await navigator.serviceWorker.getRegistration();
    return !r.installing&&!r.waiting&&r.active?.state==='activated'&&navigator.serviceWorker.controller===r.active&&(await caches.keys()).filter(k=>k.startsWith('foliolab-open-')).join()===expected;
   },cache,{timeout:60000});
   result.automaticReload=await automaticReload;
   assert.equal(result.automaticReload.observed,true,'real controllerchange reload committed');
   await page.waitForLoadState('networkidle');await ready();
   result.automaticReload.newDocument=await page.evaluate(()=>performance.timeOrigin);
   assert.notEqual(result.automaticReload.newDocument,beforeUpdateDocument,'automatic update created a new document');
   await page.reload({waitUntil:'networkidle'});await ready();
   // The automatic controllerchange reload may overlap the explicit reload.
   await wait('post-reload-current-cache',async expected=>(await caches.keys()).filter(k=>k.startsWith('foliolab-open-')).join()===expected,cache);
   const hashes=await cachedHashes();assert.equal(hashes.length,assets.length,'complete matching precache');
   for(const row of hashes)assert.equal(row.sha256,hash(current.get(row.path==='/'?'/index.html':row.path)),'fresh cached bytes '+row.path);
   for(const path of ['/src/app.js','/styles.css']){
    assert.ok(requests.some(r=>r.generation==='current'&&r.path===path),'new release requested '+path+' despite fresh old HTTP cache');
    const actual=await page.evaluate(async path=>await(await fetch(path)).text(),path);
    assert.equal(hash(actual),hash(current.get(path)),'active worker serves current '+path);
   }
   assert.deepEqual(await record(),before,'update preserves exact raw/settings/revision');
   result.checks.push('new active controller, old cache removed, every cached asset hash and active app/CSS bytes match new release');
   await page.screenshot({path:'artifacts/gates/pwa-update/'+engine+'-updated-390.png'});
   await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await ready();
   assert.match(await page.locator('#totalValue').innerText(),/1\.234/);
   await page.locator('#mobileNav [data-page=history]').click();
   assert.match(await page.locator('#snapshotList').textContent(),/1\.234/);
   assert.deepEqual(await record(),before,'offline reload/navigation preserves exact record');
   assert.deepEqual(errors,[]);result.checks.push('updated offline reload and historical reference remain accessible; exact record preserved; no page errors');
   result.assetHashes=hashes;result.result='PASS';console.log(engine+': PWA UPDATE warm HTTP cache/current asset hashes/old cache removal/exact IDB/offline PASS');
  }catch(error){
   result.result='FAIL';result.error=String(error).slice(0,2000);
   // Failure-only evidence: do not poll, retry or change the original gate.
   result.failureRequests=requests.map(request=>({...request}));
   result.failurePageErrors=[...errors];
   try{
    result.failureState=await page.evaluate(async()=>{
     const registration=await navigator.serviceWorker.getRegistration();
     const worker=w=>w?{scriptURL:w.scriptURL,state:w.state}:null;
     const names=await caches.keys(),contents=[];
     for(const name of names){
      const requests=await(await caches.open(name)).keys();
      contents.push({name,count:requests.length,paths:requests.map(r=>new URL(r.url).pathname)});
     }
     return {url:location.href,readyState:document.readyState,
      failedUpdateOperation:window.__pwaFailedUpdate??null,
      storageState:document.getElementById('portfolioStorageState')?.textContent??null,
      controller:worker(navigator.serviceWorker.controller),
      registration:registration?{scope:registration.scope,active:worker(registration.active),installing:worker(registration.installing),waiting:worker(registration.waiting)}:null,
      caches:contents};
    });
   }catch(diagnosticError){result.failureState={error:String(diagnosticError)};}
   throw error;
  }
  finally{await browser.close();await writeFile('artifacts/gates/pwa-update/report.json',JSON.stringify(report,null,2));}
 }
}finally{await new Promise(resolve=>server.close(resolve));}
