import assert from 'node:assert/strict';
import {readFile,symlink,rename} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [from,to,served,seed,base,engine,playwright]=process.argv.slice(2);
const pw=await import(pathToFileURL(resolve(playwright)));
const origin=resolve(served),previous=resolve(from),current=resolve(to);
async function serve(dir){await symlink(dir,origin+'-next');await rename(origin+'-next',origin);}
const hash=b=>createHash('sha256').update(b).digest('hex');
const version=async dir=>(await readFile(resolve(dir,'sw.js'),'utf8')).match(/^const CACHE='([^']+)';/)[1];
const cacheBefore=await version(previous),cacheAfter=await version(current);
await serve(previous);
const browser=await pw[engine].launch();
try{
 const context=await browser.newContext();const page=await context.newPage();
 const ready=()=>page.waitForFunction(()=>document.getElementById('appStartup')?.hidden&&document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv')&&navigator.serviceWorker.controller?.state==='activated');
 const read=()=>page.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();
  try{return await readPortfolioRecord(db);}finally{db.close();}
 });
 const seedBytes=await readFile(seed);
 await page.goto(base);await ready();
 assert(await page.evaluate(c=>caches.has(c),cacheBefore));
 await page.evaluate(async raw=>{
  const {safeImport}=await import('/src/model.js');const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const storage=new PortfolioStorage();try{await storage.initialize();await storage.save(safeImport(JSON.parse(raw)));}finally{storage.close();}
 },gunzipSync(seedBytes).toString());
 await page.reload({waitUntil:'networkidle'});await ready();const before=await read();
 assert.equal(JSON.parse(before.raw).bookings.length,10000);
 await serve(current);const navigation=page.waitForEvent('framenavigated',{predicate:f=>f===page.mainFrame(),timeout:60000});
 await page.evaluate(()=>setTimeout(()=>{void navigator.serviceWorker.ready.then(r=>r.update());},0));
 await navigation;await page.waitForLoadState('networkidle');await ready();
 await page.waitForFunction(async([a,b])=>(await caches.has(b))&&!(await caches.has(a)),[cacheBefore,cacheAfter]);
 await page.reload({waitUntil:'networkidle'});await ready();assert.deepEqual(await read(),before);
 await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await ready();assert.deepEqual(await read(),before);
 const m=JSON.parse(before.raw);
 console.log(JSON.stringify({engine,browser:browser.version(),from:execFileSync('git',['-C',previous,'rev-parse','HEAD']).toString().trim(),to:execFileSync('git',['-C',current,'rev-parse','HEAD']).toString().trim(),fixtureSha256:hash(seedBytes),portfolioSha256:hash(before.raw),revision:before.revision,bookings:m.bookings.length,journal:m.journalEntries.length,flows:m.externalCashFlows.length,snapshots:m.snapshots.length,afterUpdate:'byte-and-revision-equal',offlineReload:'byte-and-revision-equal',environment:'local isolated browser profile, same origin'}));
} finally{await browser.close();}
