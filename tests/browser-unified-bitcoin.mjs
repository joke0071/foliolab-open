import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
import {ledgerCSV,txid} from './ledger-live-fixture.mjs';
import {clickDisclosed} from './browser-disclosures.mjs';
const base=process.env.UH02_BASE||process.env.BASE_URL||'http://127.0.0.1:4173/';
const csv='Currency,Fiat Amount,Bittr Fee,Bitcoin Purchased,Mining Fee,Bitcoin Amount,Bitcoin Transaction ID,Timestamp,IBAN\nEUR,500,9,0.025,0.0002,0.0248,'+txid+',2025-01-01 12:00:00Z,PRIVATE-IBAN';
const files=[{name:'bittr.csv',mimeType:'text/csv',buffer:Buffer.from(csv)},{name:'ledger.csv',mimeType:'text/csv',buffer:Buffer.from(ledgerCSV())}];
for(const name of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[name]).launch({headless:true,timeout:20000});
 try{
  const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(20000);
  await context.route('**/__uh02-fixture.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="de"><title>Synthetic UH02 fixture</title><body></body></html>'}));
  await context.route('**/__uh02-axe.js',async route=>route.fulfill({contentType:'text/javascript',body:await fs.readFile('node_modules/axe-core/axe.min.js','utf8')}));
  await context.route('**/tests/ledger-live-fixture.mjs',async route=>route.fulfill({contentType:'text/javascript',body:await fs.readFile(new URL('./ledger-live-fixture.mjs',import.meta.url),'utf8')}));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'__uh02-fixture.html');
  await page.evaluate(async()=>{const {ledgerModel,ledgerEvidence}=await import('/tests/ledger-live-fixture.mjs'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const m=ledgerEvidence(ledgerModel());m.settings.autoRefresh=false;delete m.purchaseEvidence;const s=new PortfolioStorage();await s.initialize();await s.save(m);});
  const read=()=>page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{readPortfolioRecord}=await import('/src/atomic-storage.js');const s=new PortfolioStorage(),m=await s.initialize();return {model:m,revision:(await readPortfolioRecord(s.db)).revision};});
  const original=await read();
  await page.goto(base+'?page=bookings');await page.locator('#addBooking').waitFor();
  await page.locator('#openCSVImport').click();
  await page.locator('#csvFile').setInputFiles(files);
  const d=page.locator('#walletHistoryDialog');await d.waitFor({state:'visible'});await d.locator('[data-unified="status"]').filter({hasText:'lokal geprüft'}).waitFor();
  assert.deepEqual(await read(),original,'preview must not write even a revision');
  assert.ok(!(await d.innerText()).includes('PRIVATE-IBAN'));
  const accept=d.locator('[data-unified="accept"]');assert.equal(await accept.isDisabled(),true);
  await d.locator('[data-unified="funding"]').check();await accept.click();
  await d.locator('[data-unified="status"]').filter({hasText:'atomar gespeichert'}).waitFor();
  const saved=await read();assert.equal(saved.revision,original.revision+1);assert.equal(saved.model.bookings.length,1);assert.equal(saved.model.bookings[0].feeEUR,9);assert.equal(saved.model.bookings[0].amountExactEUR,'491');assert.equal(saved.model.externalCashFlows[0].amountExactEUR,'500');assert.deepEqual(saved.model.positions,original.model.positions);
  for(const width of [320,360,390,412,430,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await d.evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'overflow '+width);}
  await page.addScriptTag({url:base+'__uh02-axe.js'});assert.deepEqual(await page.evaluate(async()=> (await axe.run(document.querySelector('#walletHistoryDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
  await page.setViewportSize({width:390,height:900});await fs.mkdir('artifacts/gates/unified-bitcoin',{recursive:true});await d.screenshot({path:'artifacts/gates/unified-bitcoin/'+name+'-390.png'});
  await d.locator('[data-history="close"]').click();await page.goto(base+'?page=bookings');await page.locator('#openCSVImport').click();await page.locator('#csvFile').setInputFiles(files);await d.locator('[data-unified="status"]').filter({hasText:'lokal geprüft'}).waitFor();
  await d.locator('[data-unified="files"]').setInputFiles(files);await d.locator('[data-unified="funding"]').check();await accept.click();await d.locator('[data-unified="status"]').filter({hasText:'atomar gespeichert'}).waitFor();
  assert.equal((await read()).model.bookings.length,1);assert.equal((await read()).model.externalCashFlows.length,1);
  const restored=await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{backup,safeImport}=await import('/src/model.js'),{createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js'),{encryptBackup,decryptBackup}=await import('/src/crypto-backup.js');const s=new PortfolioStorage(),m=await s.initialize(),full=createCompleteBackup(JSON.parse(backup(m)),null,m.walletHistory),r=safeImport(unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(await encryptBackup(JSON.stringify(full),'synthetic-passphrase')),'synthetic-passphrase'))).data);await s.save(r);return r;});assert.equal(restored.bookings.length,1);
  await d.locator('[data-history="close"]').click();await page.goto(base+'?page=bookings');await page.locator('#openCSVImport').click();await page.locator('#csvFile').setInputFiles(files);await d.locator('[data-unified="status"]').filter({hasText:'lokal geprüft'}).waitFor();
  // Persisted modules work offline; stale/Quota failures below use a fresh isolated IDB store.
  await context.setOffline(true);await d.locator('[data-unified="files"]').setInputFiles(files);await d.locator('[data-unified="status"]').filter({hasText:'lokal geprüft'}).waitFor();await context.setOffline(false);
  await d.locator('[data-unified="files"]').setInputFiles(files);await d.locator('[data-unified="preview"] details summary').first().click();await d.locator('[data-unified-undo]').click();await d.locator('[data-unified="status"]').filter({hasText:'zurückgenommen'}).waitFor();assert.equal((await read()).model.bookings.length,0);assert.equal((await read()).model.externalCashFlows.length,0);assert.equal((await read()).model.journalEntries.at(-1).type,'uh02-undo');
  await d.locator('[data-unified="files"]').setInputFiles(files);await d.locator('[data-unified="status"]').filter({hasText:'lokal geprüft'}).waitFor();assert.ok((await d.locator('[data-unified="preview"]').innerText()).includes('Wiederimport gesperrt'));
  const failures=await page.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{ledgerModel,ledgerEvidence}=await import('/tests/ledger-live-fixture.mjs'),{previewUnifiedBitcoin,confirmUnifiedBitcoin}=await import('/src/unified-bitcoin.js');
   const a=new PortfolioStorage(),b=new PortfolioStorage();await a.initialize();const m=ledgerEvidence(ledgerModel());await a.save(m);await b.initialize();const beforeQuota=JSON.stringify(await a.reload());const i={receipts:m.purchaseEvidence.receipts,operations:[]},p=previewUnifiedBitcoin(m,i,'wallet'),draft=confirmUnifiedBitcoin(m,i,'wallet',{baseline:p.baseline,confirmed:true,externalFunding:true});
   const put=IDBObjectStore.prototype.put;let quota=false;IDBObjectStore.prototype.put=function(){throw new DOMException('synthetic quota','QuotaExceededError');};try{await a.save(draft);}catch(e){quota=e.name==='QuotaExceededError';}finally{IDBObjectStore.prototype.put=put;}const unchanged=JSON.stringify(await a.reload())===beforeQuota;
   await a.save(draft);let stale=false;try{await b.save(draft);}catch(e){stale=/anderen Tab/.test(e.message);}return {quota,unchanged,stale,count:(await a.reload()).bookings.length};
  });assert.deepEqual(failures,{quota:true,unchanged:true,stale:true,count:1});assert.deepEqual(errors,[]);
  await context.close();
  const offlineContext=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'allow'}),offlinePage=await offlineContext.newPage();offlinePage.setDefaultTimeout(20000);
  await offlinePage.goto(base+'?page=bookings');await offlinePage.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await offlinePage.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  await offlinePage.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const store=new PortfolioStorage();await store.initialize();await store.save(m);},saved.model);
  await offlinePage.reload();await offlinePage.locator('#bookingList').filter({hasText:'Bittr'}).waitFor();await offlineContext.setOffline(true);await offlinePage.reload();
  await offlinePage.locator('#bookingList').filter({hasText:'Bittr'}).waitFor();
  const offlineState=await offlinePage.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const m=await new PortfolioStorage().initialize();return {version:m.version,bookings:m.bookings.length,flows:m.externalCashFlows.length,scope:m.walletHistory.sessions[0].walletScopeDigest,ledger:m.purchaseEvidence.bitcoinLedger.length};});
  assert.deepEqual(offlineState,{version:5,bookings:1,flows:1,scope:saved.model.walletHistory.sessions[0].walletScopeDigest,ledger:1});await offlineContext.close();
  console.log('UH02 '+name+': actual shared CSV entry, single CAS commit, no quantity double effect, reload/reimport, source proof, seven widths/axe, offline, encrypted restore, undo/tombstone, quota rollback, stale CAS and actual offline PWA reload of protected v5 data PASS');
 }finally{await browser.close();}
}
