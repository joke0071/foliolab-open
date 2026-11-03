import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
import {source as distinctAssetSource,sameAssetSource,crossReferenceSource,fixture} from './kraken-import-fixture.mjs';
import {ledgerModel,ledgerEvidence} from './ledger-live-fixture.mjs';
import {previewUnifiedBitcoin,confirmUnifiedBitcoin} from '../src/unified-bitcoin.js';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';
import {clickDisclosed} from './browser-disclosures.mjs';
const base=process.env.UH03_BASE||process.env.BASE_URL||'http://127.0.0.1:4173/';
for(const scenario of [
 {name:'distinct-fee',source:distinctAssetSource,seed:distinctAssetSource(),quantities:['100','3','0.00000083']},
 {name:'cross-reference',source:()=>{const [header,...rows]=crossReferenceSource().split('\n');return [header,...rows.reverse()].join('\n');},seed:crossReferenceSource(),quantities:['50','5'],groups:2},
 {name:'same-asset-fee',source:()=>{const [header,...rows]=sameAssetSource().split('\n');return [header,...rows.reverse()].join('\n');},seed:sameAssetSource(),quantities:['100','2.99']}
]){
const source=scenario.source;
const {m,assignments}=fixture(scenario.seed);
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
  const file={name:'synthetic-kraken.csv',mimeType:'text/csv',buffer:Buffer.from(source())};
  const open=async()=>{await page.goto(base+'?page=bookings');await page.locator('#openCSVImport').click();await page.locator('#csvFile').setInputFiles(file);await page.locator('#csvKrakenEconomic').waitFor();};
  await open();assert.deepEqual(await read(),before);
  assert.equal(await page.locator('#saveDialog').isDisabled(),true);assert.equal(await page.locator('[data-kraken="more-bindings"]').isHidden(),true);assert.equal(await page.locator('[data-kraken="more"]').isHidden(),true);
  await clickDisclosed(page.locator('[data-kraken="simulate"]'));
  await page.locator('[data-kraken="status"]').filter({hasText:'gesperrt'}).waitFor();assert.equal(await page.locator('#saveDialog').isDisabled(),true);
  for(const [stream,id] of Object.entries(assignments))await page.locator('[data-kraken-binding="'+stream+'"]').selectOption(id);
  await page.locator('[data-kraken="opening"]').check();await page.locator('[data-kraken="simulate"]').click();
  await page.locator('[data-kraken="status"]').filter({hasText:(scenario.groups||1)+' neue Gruppen'}).waitFor();assert.equal(await page.locator('[data-kraken="approve"]').isDisabled(),false);
  assert.deepEqual(await read(),before);
  for(const width of [320,360,390,412,430,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.locator('#editDialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'overflow '+width);}
  await context.route('**/__uh03-axe.js',async r=>r.fulfill({contentType:'text/javascript',body:await fs.readFile('node_modules/axe-core/axe.min.js','utf8')}));
  await page.addScriptTag({url:base+'__uh03-axe.js'});
  assert.deepEqual(await page.evaluate(async()=> (await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);
  await page.setViewportSize({width:390,height:900});await fs.mkdir('artifacts/gates/kraken-import',{recursive:true});await page.locator('#editDialog').screenshot({path:'artifacts/gates/kraken-import/'+engine+'-'+scenario.name+'-390.png'});
  await page.locator('[data-kraken="approve"]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
  let saved=await read();assert.equal(saved.revision,before.revision+1);assert.equal(saved.model.version,5);assert.equal(saved.model.bookings.length,before.model.bookings.length+2);
  assert.deepEqual(saved.model.positions.filter(p=>p.providerId==='kraken').map(p=>p.quantityExact),scenario.quantities);
  assert.deepEqual(saved.model.externalCashFlows,before.model.externalCashFlows);
  await page.locator('#undoCSVImport').click();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});await page.locator('#toast').filter({hasText:'CSV-Import rückgängig gemacht.'}).waitFor();
  const undone=await read();assert.deepEqual(undone.model,before.model);assert.equal(undone.revision,saved.revision+1);
  await open();await clickDisclosed(page.locator('[data-kraken="simulate"]'));
  for(const [stream,id] of Object.entries(assignments))await page.locator('[data-kraken-binding="'+stream+'"]').selectOption(id);
  await page.locator('[data-kraken="opening"]').check();await page.locator('[data-kraken="simulate"]').click();await page.locator('[data-kraken="approve"]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});saved=await read();
  await open();await clickDisclosed(page.locator('[data-kraken="simulate"]'));
  await page.locator('[data-kraken="status"]').filter({hasText:(scenario.groups||1)+' bereits vorhanden'}).waitFor();assert.equal(await page.locator('#saveDialog').isDisabled(),true);assert.deepEqual(await read(),saved);
  await page.locator('#cancelDialog').click();
  // Persistent selective economic rollback through the same actual dialog/CAS boundary.
  const sourceGroups=prepareKrakenSourcePlan([source()]).groups,removedGroup=(scenario.groups?sourceGroups.find(g=>g.rows.some(r=>r.values.refid==='SYN-CROSS-FIRST')):sourceGroups[0]).id;
  await open();await clickDisclosed(page.locator('[data-kraken="operation"]'));
  await page.locator('[data-kraken="operation"]').selectOption('withdraw');
  for(const box of await page.locator('[data-kraken-group]').all())if(await box.getAttribute('data-kraken-group')!==removedGroup)await box.uncheck();
  await page.locator('[data-kraken="simulate"]').click();await page.locator('[data-kraken="status"]').filter({hasText:'1 Gruppe rücknehmbar'}).waitFor();
  assert.deepEqual(await read(),saved);
  if(scenario.groups)await page.locator('[data-kraken="partial"]').check();
  for(const width of [320,360,390,412,430,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.locator('#editDialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'withdrawal overflow '+width);}
  await page.addScriptTag({url:base+'__uh03-axe.js'});assert.deepEqual(await page.evaluate(async()=> (await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
  await page.setViewportSize({width:390,height:900});await page.locator('[data-kraken="status"]').scrollIntoViewIfNeeded();await page.locator('#editDialog').screenshot({path:'artifacts/gates/kraken-import/'+engine+'-'+scenario.name+'-withdrawal-390.png'});
  await page.locator('[data-kraken="approve"]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
  const withdrawn=await read();assert.equal(withdrawn.revision,saved.revision+1);assert.equal(withdrawn.model.version,5);
  assert.deepEqual(withdrawn.model.positions.filter(p=>p.providerId==='kraken').map(p=>p.quantityExact),scenario.groups?['100','3']:m.positions.map(p=>p.quantityExact));
  assert.deepEqual(withdrawn.model.externalCashFlows,before.model.externalCashFlows);
  assert.deepEqual(withdrawn.model.bookings.filter(b=>b.importSource?.sourceId==='unified-bitcoin-v1'),before.model.bookings);
  assert.equal(withdrawn.model.journalEntries.filter(j=>j.type==='uh03-undo').length,1);
  await page.reload();await open();await clickDisclosed(page.locator('[data-kraken="simulate"]'));await page.locator('[data-kraken="status"]').filter({hasText:'1 gesperrt'}).waitFor();assert.equal(await page.locator('#saveDialog').isDisabled(),true);assert.deepEqual(await read(),withdrawn);await page.locator('#cancelDialog').click();
  const restored=await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{backup,safeImport}=await import('/src/model.js'),{createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js'),{encryptBackup,decryptBackup}=await import('/src/crypto-backup.js');const s=new PortfolioStorage(),m=await s.initialize(),full=createCompleteBackup(JSON.parse(backup(m)),null,m.walletHistory),r=safeImport(unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(await encryptBackup(JSON.stringify(full),'synthetic-passphrase')),'synthetic-passphrase'))).data);await s.save(r);s.close();return {version:r.version,bookings:r.bookings.length};});assert.deepEqual(restored,{version:5,bookings:withdrawn.model.bookings.length});
  // Exact quota rollback and stale-CAS behavior use the real existing storage boundary.
  const failures=await page.evaluate(async seed=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{previewKrakenWithdrawal,confirmKrakenWithdrawal}=await import('/src/kraken-import.js');const a=new PortfolioStorage(),b=new PortfolioStorage();await a.initialize();await a.save(seed.model);await b.initialize();const options={selectedGroups:[seed.group],openingConfirmed:true,partialConfirmed:true},p=previewKrakenWithdrawal(seed.model,[seed.text],seed.assignments,options),draft=confirmKrakenWithdrawal(seed.model,[seed.text],seed.assignments,{...options,baseline:p.baseline,confirmed:true}),before=JSON.stringify(await a.reload()),put=IDBObjectStore.prototype.put;let quota=false;IDBObjectStore.prototype.put=function(){throw new DOMException('synthetic quota','QuotaExceededError');};try{await a.save(draft);}catch(e){quota=e.name==='QuotaExceededError';}finally{IDBObjectStore.prototype.put=put;}const unchanged=JSON.stringify(await a.reload())===before;await a.save(draft);let stale=false;try{await b.save(draft);}catch(e){stale=/anderen Tab/.test(e.message);}a.close();b.close();return {quota,unchanged,stale};},{model:saved.model,text:source(),assignments,group:removedGroup});assert.deepEqual(failures,{quota:true,unchanged:true,stale:true});
  assert.deepEqual(errors,[]);await context.close();
  const offlineContext=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'allow'}),offlinePage=await offlineContext.newPage();offlinePage.setDefaultTimeout(20000);
  await offlinePage.goto(base+'?page=bookings');
  const ready=()=>offlinePage.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const record=()=>offlinePage.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
  await controlledStorageFixture(offlinePage,ready,record);
  await offlinePage.evaluate(async model=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(model);s.close();},withdrawn.model);
  await offlinePage.reload();await ready();await offlineContext.setOffline(true);await offlinePage.reload();await ready();
  await offlinePage.locator('#openCSVImport').click();await offlinePage.locator('#csvFile').setInputFiles(file);await clickDisclosed(offlinePage.locator('[data-kraken="simulate"]'));await offlinePage.locator('[data-kraken="status"]').filter({hasText:'1 gesperrt'}).waitFor();assert.equal(await offlinePage.locator('#saveDialog').isDisabled(),true);
  const offline=JSON.parse((await record()).raw);assert.equal(offline.version,5);assert.equal(offline.bookings.length,withdrawn.model.bookings.length);await offlineContext.close();
  console.log('UH03 Kraken '+engine+' '+scenario.name+': actual shared CSV dialog, exact trade/fee/cash, pure preview, explicit bindings/opening, one CAS revision, protected v5, reload/reimport, seven widths/Axe, exact undo, persistent complete-group withdrawal/reimport tombstone, encrypted restore, withdrawal quota/stale CAS and actual offline PWA reload PASS');
 }finally{await browser.close();}
}
}
