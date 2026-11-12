// Controlled read-only failure diagnostics, never an actual CI-cause claim.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import {observeLiveStartup} from './live-startup-diagnostics.mjs';
const base=process.env.DIAGNOSTIC_BASE||'http://127.0.0.1:4173/';
assert.equal(new URL(base).hostname,'127.0.0.1','Controlled local synthetic app only');
const browser=await chromium.launch({headless:true}),reports=[];
try{
 const c=await browser.newContext({viewport:{width:390,height:900}}),p=await c.newPage();
 await p.addInitScript(()=>{navigator.locks.request('foliolab-portfolio-write',()=>{window.__diagnosticLockHeld=true;return new Promise(resolve=>{window.__releaseDiagnosticLock=resolve;});});});
 const capture=await observeLiveStartup(p,base);await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__diagnosticLockHeld);
 let original;try{await p.locator('#mobileNav [data-page="more"]').click({timeout:150});}catch(error){original=error;}
 assert.equal(original?.name,'TimeoutError');const before=await p.evaluate(()=>JSON.stringify({...localStorage}));const blocked=await capture();assert.equal(await p.evaluate(()=>JSON.stringify({...localStorage})),before);
 assert.equal(blocked.state.mobileNav.more,false);assert.match(blocked.state.startup.text,/Lokale Daten werden vorbereitet/);assert.equal(blocked.state.readyAt,null);assert.equal(blocked.pendingCount,0);
 await p.evaluate(()=>window.__releaseDiagnosticLock());await p.locator('#mobileNav [data-page="more"]').click();const ready=await capture();assert.equal(ready.state.mobileNav.more,true);assert.equal(ready.state.startup.hidden,true);assert.ok(ready.state.readyAt>0);
 const record=()=>p.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('foliolab-open-portfolio',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await new Promise((resolve,reject)=>{const tx=db.transaction('records','readonly'),r=tx.objectStore('records').get('portfolio');r.onsuccess=()=>resolve(JSON.stringify(r.result));r.onerror=()=>reject(r.error);});}finally{db.close();}});
 const bytes=await record();await capture();assert.equal(await record(),bytes);reports.push({case:'pending existing write lock versus ready app',originalFailure:original.name,blocked,ready,exactIDBNonmutation:true});await c.close();
 const nc=await browser.newContext({viewport:{width:390,height:900}}),np=await nc.newPage();let release,entered;const hold=new Promise(resolve=>{release=resolve;}),seen=new Promise(resolve=>{entered=resolve;});
 await nc.route('**/src/atomic-storage.js',async route=>{entered();await hold;await route.continue();});const networkCapture=await observeLiveStartup(np,base);await np.goto(base,{waitUntil:'commit'});await seen;await np.locator('#appStartup').waitFor();const network=await networkCapture();
 assert.equal(network.state.readyAt,null);assert.equal(network.state.mobileNav.more,false);assert.match(network.state.startup.text,/Portfolio wird geladen/);assert.ok(network.pendingRequests.some(x=>x.url.endsWith('/src/atomic-storage.js')));release();await np.locator('#mobileNav [data-page="more"]').click();reports.push({case:'held module response versus storage wait',network});await nc.close();
 // v310 production original: the entry module received 503 before initNav.
 // Reproduce that transport failure once; never turn its later independent
 // successful HTTP hash probe into proof that the initial module loaded.
 const fc=await browser.newContext({viewport:{width:390,height:900}}),fp=await fc.newPage();let moduleRequests=0;
 await fc.route('**/src/browser-portfolio-storage.js',route=>{moduleRequests++;return route.fulfill({status:503,contentType:'text/html',body:'Synthetic unavailable module'});});
 const failureCapture=await observeLiveStartup(fp,base);await fp.goto(base,{waitUntil:'networkidle'});
 await fp.waitForFunction(()=>!document.getElementById('appStartupHelp').hidden);
 const failure=await failureCapture();
 assert.equal(moduleRequests,1,'a failed module is not silently retried');
 assert.equal(failure.state.readyAt,null);assert.equal(failure.state.startup.hidden,false);
 assert.match(failure.state.startup.text,/nicht vollständig gestartet/);
 assert.equal(failure.state.mobileNav.buttons,0);assert.equal(failure.state.sidebarNav.buttons,0);
 assert.ok(failure.badResponses.some(r=>r.url.endsWith('/src/browser-portfolio-storage.js')&&r.status===503));
 const later=await fc.request.get(new URL('src/browser-portfolio-storage.js',base).href);
 assert.equal(later.status(),200,'an independent later HTTP probe can succeed');
 assert.equal(await later.text(),await (await import('node:fs/promises')).readFile('src/browser-portfolio-storage.js','utf8'));
 const afterProbe=await failureCapture();assert.equal(afterProbe.state.mobileNav.buttons,0);assert.equal(afterProbe.state.readyAt,null);
 assert.equal((await fp.evaluate(()=>indexedDB.databases())).some(db=>db.name==='foliolab-open-portfolio'),false,'module failure creates no substitute portfolio');
 reports.push({case:'one initial storage module 503; later exact HTTP bytes do not recover the failed document',failure,afterProbe,moduleRequests,exactLaterModuleBytes:true,noPortfolioCreated:true});await fc.close();
 const sc=await browser.newContext({viewport:{width:390,height:900}}),sp=await sc.newPage(),successCapture=await observeLiveStartup(sp,base);
 await sp.goto(base,{waitUntil:'networkidle'});await sp.locator('#mobileNav [data-page="more"]').click();
 const success=await successCapture();assert.ok(success.state.readyAt>0);assert.equal(success.state.startup.hidden,true);
 assert.equal(success.state.mobileNav.buttons,5);assert.equal(success.state.sidebarNav.buttons,5);assert.deepEqual(success.badResponses,[]);
 reports.push({case:'separate fresh profile without injected transport failure starts with unchanged navigation',success});await sc.close();
 await mkdir('artifacts/gates/live-diagnostics',{recursive:true});await writeFile('artifacts/gates/live-diagnostics/report.json',JSON.stringify({result:'PASS',browser:browser.version(),scope:'Controlled local negatives only; no inferred CI root cause',reports},null,2));console.log('PASS: network vs initialization stall and initial module 503 distinguished; later HTTP bytes do not mask failure; independent fresh startup succeeds');
}finally{await browser.close();}
