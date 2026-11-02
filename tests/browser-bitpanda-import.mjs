import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
import {source,fixture} from './bitpanda-import-fixture.mjs';
import {bitpandaCSV} from './bitpanda-fixture.mjs';
import {ledgerModel,ledgerEvidence} from './ledger-live-fixture.mjs';
import {previewUnifiedBitcoin,confirmUnifiedBitcoin} from '../src/unified-bitcoin.js';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';
import {clickDisclosed} from './browser-disclosures.mjs';
const base=process.env.UH03_BASE||process.env.BASE_URL||'http://127.0.0.1:4173/';
const {m,assignments,options}=fixture();
const protectedModel=ledgerEvidence(ledgerModel()),input={receipts:protectedModel.purchaseEvidence.receipts,operations:[]};
const seed=confirmUnifiedBitcoin(protectedModel,input,'wallet',{confirmed:true,externalFunding:true,baseline:previewUnifiedBitcoin(protectedModel,input,'wallet').baseline});
seed.providers.push(...m.providers);seed.accounts.push(...m.accounts);seed.positions.push(...m.positions);seed.openingPositions.push(...m.openingPositions);seed.settings.autoRefresh=false;
for(const engine of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[engine]).launch({headless:true,timeout:20000});
 try{
  const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/__uh03-fixture.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="de"><title>Synthetic UH03 fixture</title><body></body></html>'}));
  await page.goto(base+'__uh03-fixture.html');
  await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},seed);
  const read=()=>page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{readPortfolioRecord}=await import('/src/atomic-storage.js');const s=new PortfolioStorage(),model=await s.initialize(),revision=(await readPortfolioRecord(s.db)).revision;s.close();return {model,revision};});
  const before=await read();
  const file={name:'synthetic-bitpanda.csv',mimeType:'text/csv',buffer:Buffer.from(source())};
  const open=async()=>{await page.goto(base+'?page=bookings');await page.locator('#openCSVImport').click();await page.locator('#csvFile').setInputFiles(file);await page.locator('#csvBitpandaEconomic').waitFor();};
  await open();assert.deepEqual(await read(),before);
  // Paged economic selection must preserve explicit exclusions and never mutate storage.
  const paged=bitpandaCSV(Array.from({length:75},(_,i)=>({'Transaction ID':'SYN-PAGE-'+i,'Transaction Type':'reward','In/Out':'incoming','Amount Asset':'0.1',Asset:'ETH','Product ID':'SYN-ETH',Fee:'-','Fee asset':'-',omitTax:true})));
  await page.locator('#csvFile').setInputFiles({name:'synthetic-paged.csv',mimeType:'text/csv',buffer:Buffer.from(paged)});
  await clickDisclosed(page.locator('[data-bitpanda="simulate"]'));
  assert.equal(await page.locator('[data-bitpanda-group]').count(),50);
  const firstGroup=page.locator('[data-bitpanda-group]').first(),firstId=await firstGroup.getAttribute('data-bitpanda-group');await firstGroup.uncheck();
  await page.locator('[data-bitpanda="more"]').click();assert.equal(await page.locator('[data-bitpanda-group]').count(),75);
  assert.equal(await page.locator('[data-bitpanda-group="'+firstId+'"]').isChecked(),false);
  assert.equal(await page.locator('[data-bitpanda="approve"]').isDisabled(),true);assert.deepEqual(await read(),before);
  await open();
  assert.equal(await page.locator('#saveDialog').isDisabled(),true);assert.equal(await page.locator('[data-bitpanda="more"]').isHidden(),true);
  await clickDisclosed(page.locator('[data-bitpanda="simulate"]'));
  await page.locator('[data-bitpanda="status"]').filter({hasText:'gesperrt'}).waitFor();assert.equal(await page.locator('#saveDialog').isDisabled(),true);
  for(const [stream,id] of Object.entries(assignments)){
   await page.locator('[data-bitpanda-binding="'+stream+'"]').selectOption(id);
   await page.locator('[data-bitpanda-closing="'+stream+'"]').fill(options.expectedClosing[id]);
  }
  for(const [id,mode]of Object.entries(options.feeModes))await page.locator('[data-bitpanda-fee="'+id+'"]').selectOption(mode);
  await page.locator('[data-bitpanda="net"]').check();
  await page.locator('[data-bitpanda="opening"]').check();await page.locator('[data-bitpanda="simulate"]').click();
  await page.locator('[data-bitpanda="status"]').filter({hasText:'2 neue Vorgänge'}).waitFor();assert.equal(await page.locator('[data-bitpanda="approve"]').isDisabled(),false);
  assert.deepEqual(await read(),before);
  assert.match(await page.locator('[data-bitpanda="impact"]').innerText(),/Änderung[\s\S]*\+3.1[\s\S]*-101/);
  for(const width of [320,360,390,412,430,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.locator('#editDialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'overflow '+width);}
  await context.route('**/__uh03-axe.js',async r=>r.fulfill({contentType:'text/javascript',body:await fs.readFile('node_modules/axe-core/axe.min.js','utf8')}));
  await page.addScriptTag({url:base+'__uh03-axe.js'});
  assert.deepEqual(await page.evaluate(async()=> (await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);
  await page.setViewportSize({width:390,height:900});await fs.mkdir('artifacts/gates/bitpanda-import',{recursive:true});await page.locator('#editDialog').screenshot({path:'artifacts/gates/bitpanda-import/'+engine+'-390.png'});await page.locator('[data-bitpanda="impact"]').screenshot({path:'artifacts/gates/bitpanda-import/'+engine+'-impact-390.png'});
  await page.locator('[data-bitpanda="approve"]').check();
  // Change and re-confirm fee/net values while the real revision check is paused.
  // The first click owns the old plan and must not save it over the new approval.
  await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const original=PortfolioStorage.prototype.assertCurrent;window.__bpAssertOriginal=original;PortfolioStorage.prototype.assertCurrent=async function(...args){window.__bpAssertEntered=true;await new Promise(r=>window.__bpAssertRelease=r);return original.apply(this,args);};});
  await page.locator('#saveDialog').click();await page.waitForFunction(()=>window.__bpAssertEntered);
  await page.locator('[data-bitpanda-fee]').selectOption('additional');
  const cashKey=Object.keys(assignments).find(k=>assignments[k]==='bp1');await page.locator('[data-bitpanda-closing="'+cashKey+'"]').fill('98');
  await page.locator('[data-bitpanda="simulate"]').click();await page.locator('[data-bitpanda="approve"]').check();
  await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');PortfolioStorage.prototype.assertCurrent=window.__bpAssertOriginal;window.__bpAssertRelease();});
  await page.locator('#dialogError:not(.hidden)').filter({hasText:'Bitpanda-Auswahl oder Datenstand geändert'}).waitFor();assert.deepEqual(await read(),before);
  await page.locator('[data-bitpanda-fee]').selectOption('included');await page.locator('[data-bitpanda-closing="'+cashKey+'"]').fill('99');
  await page.locator('[data-bitpanda="simulate"]').click();await page.locator('[data-bitpanda="approve"]').check();assert.match(await page.locator('#csvBrokerStatus').innerText(),/Übernahme ist bereit/);await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
  let saved=await read();assert.equal(saved.revision,before.revision+1);assert.equal(saved.model.version,5);assert.equal(saved.model.bookings.length,before.model.bookings.length+2);
  assert.deepEqual(saved.model.positions.filter(p=>p.providerId==='bitpanda').map(p=>p.quantityExact),['3.1','99']);
  assert.deepEqual(saved.model.externalCashFlows,before.model.externalCashFlows);
  await page.locator('#undoCSVImport').click();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});await page.locator('#toast').filter({hasText:'CSV-Import rückgängig gemacht.'}).waitFor();
  const undone=await read();assert.deepEqual(undone.model,before.model);assert.equal(undone.revision,saved.revision+1);
  await open();await clickDisclosed(page.locator('[data-bitpanda="simulate"]'));
  for(const [stream,id] of Object.entries(assignments)){
   await page.locator('[data-bitpanda-binding="'+stream+'"]').selectOption(id);
   await page.locator('[data-bitpanda-closing="'+stream+'"]').fill(options.expectedClosing[id]);
  }
  for(const [id,mode]of Object.entries(options.feeModes))await page.locator('[data-bitpanda-fee="'+id+'"]').selectOption(mode);
  await page.locator('[data-bitpanda="net"]').check();
  await page.locator('[data-bitpanda="opening"]').check();await page.locator('[data-bitpanda="simulate"]').click();await page.locator('[data-bitpanda="approve"]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});saved=await read();
  await open();await clickDisclosed(page.locator('[data-bitpanda="simulate"]'));
  await page.locator('[data-bitpanda="net"]').check();await page.locator('[data-bitpanda="simulate"]').click();await page.locator('[data-bitpanda="status"]').filter({hasText:'2 bereits vorhanden'}).waitFor();assert.equal(await page.locator('#saveDialog').isDisabled(),true);assert.deepEqual(await read(),saved);
  await page.locator('#cancelDialog').click();
  const restored=await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{backup,safeImport}=await import('/src/model.js'),{createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js'),{encryptBackup,decryptBackup}=await import('/src/crypto-backup.js');const s=new PortfolioStorage(),m=await s.initialize(),full=createCompleteBackup(JSON.parse(backup(m)),null,m.walletHistory),r=safeImport(unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(await encryptBackup(JSON.stringify(full),'synthetic-passphrase')),'synthetic-passphrase'))).data);await s.save(r);s.close();return {version:r.version,bookings:r.bookings.length};});assert.deepEqual(restored,{version:5,bookings:saved.model.bookings.length});
  // Exact quota rollback and stale-CAS behavior use the real existing storage boundary.
  const failures=await page.evaluate(async seed=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{previewBitpandaImport,confirmBitpandaImport}=await import('/src/bitpanda-import.js');const a=new PortfolioStorage(),b=new PortfolioStorage();await a.initialize();await a.save(seed.model);await b.initialize();const p=previewBitpandaImport(seed.model,[seed.text],seed.assignments,seed.options),draft=confirmBitpandaImport(seed.model,[seed.text],seed.assignments,{...seed.options,baseline:p.baseline,confirmed:true}),before=JSON.stringify(await a.reload()),put=IDBObjectStore.prototype.put;let quota=false;IDBObjectStore.prototype.put=function(){throw new DOMException('synthetic quota','QuotaExceededError');};try{await a.save(draft);}catch(e){quota=e.name==='QuotaExceededError';}finally{IDBObjectStore.prototype.put=put;}const unchanged=JSON.stringify(await a.reload())===before;await a.save(draft);let stale=false;try{await b.save(draft);}catch(e){stale=/anderen Tab/.test(e.message);}a.close();b.close();return {quota,unchanged,stale};},{model:seed,text:source(),assignments,options});assert.deepEqual(failures,{quota:true,unchanged:true,stale:true});
  assert.deepEqual(errors,[]);await context.close();
  const offlineContext=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'allow'}),offlinePage=await offlineContext.newPage();offlinePage.setDefaultTimeout(20000);
  await offlinePage.goto(base+'?page=bookings');
  const ready=()=>offlinePage.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const record=()=>offlinePage.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
  await controlledStorageFixture(offlinePage,ready,record);
  await offlinePage.evaluate(async model=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(model);s.close();},saved.model);
  await offlinePage.reload();await ready();await offlineContext.setOffline(true);await offlinePage.reload();await ready();
  await offlinePage.locator('#openCSVImport').click();await offlinePage.locator('#csvFile').setInputFiles(file);await clickDisclosed(offlinePage.locator('[data-bitpanda="simulate"]'));await offlinePage.locator('[data-bitpanda="net"]').check();await offlinePage.locator('[data-bitpanda="simulate"]').click();await offlinePage.locator('[data-bitpanda="status"]').filter({hasText:'2 bereits vorhanden'}).waitFor();
  const offline=JSON.parse((await record()).raw);assert.equal(offline.version,5);assert.equal(offline.bookings.length,saved.model.bookings.length);await offlineContext.close();
  console.log('UH03 Bitpanda '+engine+': actual shared CSV dialog, exact trade/fee/cash, pure preview, explicit bindings/opening, one CAS revision, protected v5, reload/reimport, seven widths/Axe, exact undo, encrypted restore, quota/stale CAS and actual offline PWA reload PASS');
 }finally{await browser.close();}
}
