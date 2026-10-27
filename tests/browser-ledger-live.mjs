import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {chromium,firefox,webkit} from 'playwright';
import {ledgerCSV,ledgerModel,ledgerEvidence} from './ledger-live-fixture.mjs';
const require=createRequire(import.meta.url),axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const base=process.env.FLH03_BASE_URL||'http://127.0.0.1:4173/';
for(const engine of (process.env.FLH03_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route(url=>url.origin!==new URL(base).origin&&url.protocol!=='blob:',r=>{external.push(r.request().url());return r.abort();});
 try{
  await page.addInitScript({content:axe});
  await page.goto(new URL('tests/storage-origin.html',base).href);
  const seed=ledgerEvidence(ledgerModel());seed.settings.autoRefresh=false;
  await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},seed);
  await page.goto(base);await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await page.evaluate(()=>navigator.serviceWorker.ready);
  const read=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
  const before=await read();
  const file=text=>({name:'synthetic-ledger.csv',mimeType:'text/csv',buffer:Buffer.from(text)});
  const open=async()=>{await page.locator('#mobileNav [data-page="bookings"]').click();await page.locator('#openCSVImport').click();};
  const close=async key=>{page.once('dialog',d=>d.accept());if(key==='Escape')await page.keyboard.press('Escape');else await page.locator('#cancelDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});};
  const ready=()=>page.waitForFunction(()=>document.getElementById('csvReviewStatus')?.textContent.includes('nur Vorschau'));
  await open();await page.locator('#csvFile').setInputFiles(file(ledgerCSV([{}, {'Status':'Failed','Operation Type':'OUT'}, {'Operation Type':'SWAP'}])));await ready();
  assert.equal(await page.locator('#csvSource').inputValue(),'auto');assert.ok(await page.locator('#saveDialog').isDisabled());assert.equal(await page.locator('#csvMap-date').count(),0);
  const mapping=page.locator('[data-ledger-scope]');await mapping.selectOption('wallet');assert.ok(await mapping.evaluate(el=>el===document.activeElement));
  assert.equal(await page.locator('#csvReview details').count(),3);await page.locator('#csvReview details').first().locator('summary').click();
  assert.match(await page.locator('#csvReview').innerText(),/Vorhandene Kaufbeleggruppe: 2 Belege/);assert.match(await page.locator('#csvReview').innerText(),/1000 EUR laut Kaufbelegen/);
  assert.match(await page.locator('#csvReview').innerText(),/Kein Kaufpreis, Einstandswert oder Steuerbeleg/);
  for(const width of [320,390,430,768,1440]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+width);
   assert.ok(await page.locator('#editDialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'dialog overflow '+width);
   const box=await mapping.boundingBox();assert.ok(box.height>=44,'mapping touch target');
   assert.deepEqual(await page.evaluate(async()=> (await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);
   mkdirSync('artifacts/gates/ledger-live',{recursive:true});await page.screenshot({path:'artifacts/gates/ledger-live/'+engine+'-'+width+'.png'});
  }
  await page.setViewportSize({width:390,height:900});assert.deepEqual(await read(),before,'view and mapping leave exact canonical record unchanged');
  // Deliberate hostile form submission checks the callback guard, not just a disabled button.
  await page.locator('#editorForm').evaluate(el=>el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  await page.locator('#dialogError').waitFor({state:'visible'});assert.match(await page.locator('#dialogError').innerText(),/Ledger Live bleibt eine lokale Vorschau/);assert.ok(await page.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);
  await close('Escape');assert.deepEqual(await read(),before);
  await open();await page.locator('#csvFile').setInputFiles(file(ledgerCSV()));await ready();assert.equal(await page.locator('[data-ledger-scope]').inputValue(),'','reopen never keeps transient mapping');assert.deepEqual(await read(),before,'repeat preview has no second effect');await close();
  await open();await page.locator('#csvFile').setInputFiles(file(ledgerCSV(Array.from({length:75},()=>({'Account Name':'<img src=x onerror=alert(1)>','Operation Hash':'<svg onload=alert(2)>'})))));await ready();
  assert.equal(await page.locator('#csvReview details').count(),50);await page.locator('#ledgerShowMore').click();assert.equal(await page.locator('#csvReview details').count(),75);assert.equal(await page.locator('#ledgerShowMore').count(),0);
  assert.equal(await page.locator('#csvMapping img,#csvReview svg').count(),0,'hostile source labels stay text');assert.deepEqual(await read(),before);
  await page.locator('#csvSource').selectOption('generic');await page.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('native Ledger-Vorschau'));assert.ok(await page.locator('#saveDialog').isDisabled());assert.equal(await page.locator('#csvMap-date').count(),0);
  await page.locator('#csvSource').selectOption('auto');await ready();
  await page.locator('#csvFile').setInputFiles([file(ledgerCSV()),{name:'generic.csv',mimeType:'text/csv',buffer:Buffer.from('date,type,position,quantity,price\n2025-01-01,buy,A,1,1')}]);
  await page.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('genau einer Datei'));assert.ok(await page.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);
  await close();await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await open();await page.locator('#csvFile').setInputFiles(file(ledgerCSV()));await ready();assert.ok(await page.locator('#saveDialog').isDisabled());await close();assert.deepEqual(await read(),before,'offline preview/cancel leave exact record unchanged');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[],'no external calls during synthetic native preview');
  console.log('LEDGER LIVE '+engine+': native detection/mapping/Bittr references/5 widths/Axe/44px/replay/hostile input/mixed sources/submit guard/Escape/cancel/offline/exact zero writes PASS');
 }finally{await context.close();await browser.close();}
}
