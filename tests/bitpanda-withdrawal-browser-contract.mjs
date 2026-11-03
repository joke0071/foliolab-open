import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {source,fixture} from './bitpanda-import-fixture.mjs';
import {prepareBitpandaSourcePlan} from '../src/bitpanda-import.js';
import {clickDisclosed} from './browser-disclosures.mjs';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';
export async function bitpandaWithdrawalBrowserContract({browser,base,engine,model}){
 const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),p=await context.newPage();p.setDefaultTimeout(20000);
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 await p.goto(base+'?page=bookings');await ready();await p.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},model);await p.reload();await ready();
 const before=await read(),f=fixture(),groups=prepareBitpandaSourcePlan([source()]).groups;
 const file={name:'synthetic-bitpanda.csv',mimeType:'text/csv',buffer:Buffer.from(source())};
 const open=async()=>{await p.locator('#openCSVImport').click();await p.locator('#csvFile').setInputFiles(file);await clickDisclosed(p.locator('[data-bitpanda="simulate"]'));};
 await open();await p.locator('[data-bitpanda="operation"]').selectOption('withdraw');
 await p.locator('[data-bitpanda-group="'+groups[0].id+'"]').uncheck();
 const key=Object.keys(f.assignments).find(k=>f.assignments[k]==='bp0');
 await p.locator('[data-bitpanda-closing="'+key+'"]').fill('3.1');await p.locator('[data-bitpanda-restored="'+key+'"]').fill('3');
 await p.locator('[data-bitpanda="net"]').check();await p.locator('[data-bitpanda="simulate"]').click();assert.ok(await p.locator('[data-bitpanda="approve"]').isDisabled(),'independent controls need explicit consent');
 await p.locator('[data-bitpanda="controls"]').check();await p.locator('[data-bitpanda="simulate"]').click();await p.locator('[data-bitpanda="status"]').filter({hasText:'1 Vorgang rücknehmbar'}).waitFor();
 assert.match(await p.locator('[data-bitpanda="impact"]').innerText(),/3.1[\s\S]*-0.1[\s\S]*3/);assert.deepEqual(await read(),before);
 await context.route('**/__bp-withdrawal-axe.js',async r=>r.fulfill({contentType:'text/javascript',body:await fs.readFile('node_modules/axe-core/axe.min.js','utf8')}));
 await p.addScriptTag({url:base+'__bp-withdrawal-axe.js'});
 for(const width of [320,360,390,412,430,768,1440]){await p.setViewportSize({width,height:900});assert.equal(await p.locator('#editDialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'withdrawal overflow '+width);assert.deepEqual(await p.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);}
 await p.setViewportSize({width:390,height:900});await fs.mkdir('artifacts/gates/bitpanda-import',{recursive:true});await p.locator('#editDialog').screenshot({path:'artifacts/gates/bitpanda-import/'+engine+'-withdrawal-390.png'});
 await p.locator('[data-bitpanda="partial"]').check();await p.locator('[data-bitpanda="approve"]').check();
 // Revision race: the click must not retain approval for a different control balance.
 await p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');window.__bpAssert=PortfolioStorage.prototype.assertCurrent;PortfolioStorage.prototype.assertCurrent=async function(...args){window.__bpEntered=true;await new Promise(r=>window.__bpRelease=r);return window.__bpAssert.apply(this,args);};});
 await p.locator('#saveDialog').click();await p.waitForFunction(()=>window.__bpEntered);await p.locator('[data-bitpanda-restored="'+key+'"]').fill('3.000000000000000001');
 await p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');PortfolioStorage.prototype.assertCurrent=window.__bpAssert;window.__bpRelease();});
 await p.locator('#dialogError:not(.hidden)').filter({hasText:'Bitpanda-Auswahl oder Datenstand geändert'}).waitFor();assert.deepEqual(await read(),before);
 await p.locator('[data-bitpanda-restored="'+key+'"]').fill('3');await p.locator('[data-bitpanda="simulate"]').click();await p.locator('[data-bitpanda="approve"]').check();
 await p.evaluate(()=>{window.__bpPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('synthetic withdrawal quota','QuotaExceededError');};});
 await p.locator('#saveDialog').click();await p.locator('#dialogError:not(.hidden)').filter({hasText:'quota'}).waitFor();await p.evaluate(()=>IDBObjectStore.prototype.put=window.__bpPut);assert.deepEqual(await read(),before);assert.ok(await p.locator('[data-bitpanda="approve"]').isDisabled());
 await p.locator('[data-bitpanda="simulate"]').click();await p.locator('[data-bitpanda="approve"]').check();await p.locator('#saveDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});
 let after=await read(),saved=JSON.parse(after.raw);assert.equal(after.revision,before.revision+1);assert.equal(saved.version,5);assert.equal(saved.positions.find(p=>p.id==='bp0').quantityExact,'3');assert.equal(saved.positions.find(p=>p.id==='bp1').quantityExact,'99');assert.equal(saved.bookings.length,model.bookings.length-1);assert.deepEqual(saved.purchaseEvidence,model.purchaseEvidence);assert.equal(saved.journalEntries.filter(j=>j.type==='bitpanda-undo').length,1);
 await p.locator('#undoCSVImport').click();await p.locator('#saveDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});await p.locator('#toast').filter({hasText:'CSV-Import rückgängig gemacht.'}).waitFor();const undone=await read();assert.equal(undone.raw,before.raw);assert.deepEqual(undone.settings,before.settings);assert.equal(undone.revision,after.revision+1);
 await open();await p.locator('[data-bitpanda="operation"]').selectOption('withdraw');await p.locator('[data-bitpanda-group="'+groups[0].id+'"]').uncheck();await p.locator('[data-bitpanda-closing="'+key+'"]').fill('3.1');await p.locator('[data-bitpanda-restored="'+key+'"]').fill('3');await p.locator('[data-bitpanda="net"]').check();await p.locator('[data-bitpanda="controls"]').check();await p.locator('[data-bitpanda="simulate"]').click();await p.locator('[data-bitpanda="partial"]').check();await p.locator('[data-bitpanda="approve"]').check();await p.locator('#saveDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});after=await read();saved=JSON.parse(after.raw);assert.equal(after.revision,undone.revision+1);assert.equal(saved.positions.find(p=>p.id==='bp0').quantityExact,'3');
 await p.reload();await ready();await open();await p.locator('[data-bitpanda="net"]').check();await p.locator('[data-bitpanda="simulate"]').click();await p.locator('[data-bitpanda="status"]').filter({hasText:'dauerhaft zurückgenommen'}).waitFor();assert.ok(await p.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),after);await p.locator('#cancelDialog').click();
 const restored=await p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{backup,safeImport}=await import('/src/model.js'),{createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js'),{encryptBackup,decryptBackup}=await import('/src/crypto-backup.js');const s=new PortfolioStorage(),m=await s.initialize(),full=createCompleteBackup(JSON.parse(backup(m)),null,m.walletHistory),r=safeImport(unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(await encryptBackup(JSON.stringify(full),'synthetic-passphrase')),'synthetic-passphrase'))).data);await s.save(r);s.close();return r;});
 assert.deepEqual(restored.journalEntries,saved.journalEntries);assert.equal(restored.version,5);
 const failureChecks=await p.evaluate(async({model,text,assignments,options,group})=>{
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{confirmBitpandaWithdrawal}=await import('/src/bitpanda-import.js');
  const a=new PortfolioStorage(),b=new PortfolioStorage();await a.initialize();await a.save(model);await b.initialize();
  const baseline=JSON.stringify(await a.reload()),draft=confirmBitpandaWithdrawal(model,[text],assignments,{...options,selectedGroups:[group],controlsConfirmed:true,expectedClosing:{bp0:'3.1'},expectedRestored:{bp0:'3'},partialConfirmed:true,baseline:JSON.stringify(model),confirmed:true});
  const put=IDBObjectStore.prototype.put;let aborted=false,putSucceeded=false;IDBObjectStore.prototype.put=function(...args){const request=put.apply(this,args);request.addEventListener('success',()=>{putSucceeded=true;this.transaction.abort();},{once:true});return request;};
  try{await a.save(draft);}catch(e){aborted=e.name==='AbortError'||e.message==='Speichertransaktion abgebrochen.';}finally{IDBObjectStore.prototype.put=put;}
  const unchanged=JSON.stringify(await a.reload())===baseline;await a.save(draft);let stale=false;try{await b.save(draft);}catch(e){stale=/anderen Tab/.test(e.message);}a.close();b.close();return {putSucceeded,aborted,unchanged,stale};
 },{model,text:source(),assignments:f.assignments,options:f.options,group:groups[1].id});
 assert.deepEqual(failureChecks,{putSucceeded:true,aborted:true,unchanged:true,stale:true});await context.close();
 // The actual installed offline path must retain the tombstone, not merely a mocked reader.
 const offline=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'allow'}),page=await offline.newPage();await page.goto(base+'?page=bookings');
 const offlineReady=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const offlineRecord=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 await controlledStorageFixture(page,offlineReady,offlineRecord);
 await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},restored);await page.reload();await offlineReady();await offline.setOffline(true);await page.reload();await offlineReady();
 await page.locator('#openCSVImport').click();await page.locator('#csvFile').setInputFiles(file);await clickDisclosed(page.locator('[data-bitpanda="simulate"]'));await page.locator('[data-bitpanda="net"]').check();await page.locator('[data-bitpanda="simulate"]').click();await page.locator('[data-bitpanda="status"]').filter({hasText:'dauerhaft zurückgenommen'}).waitFor();assert.ok(await page.locator('#saveDialog').isDisabled());assert.deepEqual(JSON.parse((await offlineRecord()).raw).journalEntries,restored.journalEntries);await offline.close();assert.deepEqual(errors,[]);
 console.log('UH03 Bitpanda '+engine+': persistent terminal withdrawal through real shared UI, exact independent before/after controls, seven widths/Axe, approval race, quota/one CAS revision, retained original/reimport block/reload/encrypted restore/offline PWA PASS');
}
