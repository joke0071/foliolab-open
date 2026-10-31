import {waitForAppServiceWorker} from './browser-gate-deadline.mjs';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {bitpandaCSV,bitpandaHeaders} from './bitpanda-fixture.mjs';
import {ledgerModel} from './ledger-live-fixture.mjs';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const report={base,scope:'Synthetic native Bitpanda read-only CSV preview',engines:[]};
mkdirSync('artifacts/gates/bitpanda-preview',{recursive:true});
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({viewport:{width:390,height:900},ignoreHTTPSErrors:Boolean(proxy)});
 await ctx.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
 const p=await ctx.newPage(),errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return {record:await readPortfolioRecord(db),prefs:Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])};}finally{db.close();}});
 const open=async()=>{await p.locator('#mobileNav [data-page=bookings]:visible,#sidebarNav [data-page=bookings]:visible').click();await p.locator('#openCSVImport').click();};
 const close=async(key='cancel')=>{if(key==='Escape')await p.keyboard.press('Escape');else await p.locator('#cancelDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});assert.equal(await p.evaluate(()=>document.activeElement.id),'openCSVImport');};
 const file=text=>({name:'synthetic-bitpanda.csv',mimeType:'text/csv',buffer:Buffer.from(text)});
 const preview=()=>p.waitForFunction(()=>document.getElementById('csvReviewStatus')?.textContent.includes('Bitpanda:'));
 try{
  await p.goto(base);await ready();const seed=ledgerModel();seed.settings.autoRefresh=false;
  await p.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},seed);
  await p.goto(base);await ready();await waitForAppServiceWorker(p);const before=await read();
  ctx.on('request',r=>{const u=new URL(r.url());if(u.origin!==new URL(base).origin&&u.protocol!=='blob:')external.push(r.url());});
  await open();await p.locator('#csvFile').setInputFiles(file(bitpandaCSV([{'Product ID':'<img src=x onerror=alert(1)>','Amount Asset':'0.000000000000000001','Fee asset':'USD',Fee:'2.5'},{'Transaction Type':'reward',omitTax:true},{'Transaction Type':'future','Tax Fiat':'-'}])));await preview();
  assert.ok(await p.locator('#saveDialog').isDisabled());assert.equal(await p.locator('#csvMap-date').count(),0);assert.equal(await p.locator('#csvReview .performance-details').count(),3);
  await p.locator('#csvReview .performance-details').first().locator('summary').first().click();
  await p.locator('#csvReview .performance-details').nth(1).locator('summary').first().click();
  const review=await p.locator('#csvReview').innerText();assert.match(review,/2,5 USD|2.5 USD/);assert.match(review,/Tax Fiat laut Export: unbekannt/);assert.doesNotMatch(review,/SYNTHETIC OWNER/);assert.match(review,/0.000000000000000001/);assert.equal(await p.locator('#csvReview img').count(),0);
  for(const width of [320,390,430,768,1440]){
   await p.setViewportSize({width,height:900});await p.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await p.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   for(const id of ['cancelDialog','saveDialog'])assert.ok((await p.locator('#'+id).boundingBox()).height>=44);
   assert.deepEqual(await p.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(x=>({id:x.id,targets:x.nodes.map(n=>n.target)}))),[]);
   await p.screenshot({path:'artifacts/gates/bitpanda-preview/'+engine+'-'+width+'.png'});
  }
  await p.setViewportSize({width:390,height:900});assert.deepEqual(await read(),before);
  await p.locator('#editorForm').evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await p.locator('#dialogError:not(.hidden)').waitFor();assert.match(await p.locator('#dialogError').innerText(),/Bitpanda bleibt/);assert.ok(await p.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);await close('Escape');
  await open();assert.equal(await p.locator('#csvReview .performance-details').count(),0);await p.locator('#csvFile').setInputFiles(file(bitpandaCSV(Array.from({length:75},()=>({})))));await preview();assert.equal(await p.locator('#csvReview .performance-details').count(),50);await p.locator('#bitpandaShowMore').click();assert.equal(await p.locator('#csvReview .performance-details').count(),75);assert.equal(await p.locator('#bitpandaShowMore').count(),0);assert.ok(await p.locator('#csvReview .performance-details').nth(50).locator('summary').first().evaluate(e=>e===document.activeElement));
  await p.locator('#csvSource').selectOption('generic');await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('native Bitpanda-Vorschau'));assert.ok(await p.locator('#saveDialog').isDisabled());assert.equal(await p.locator('#csvMap-feeEUR').count(),0);
  for(const mode of ['flatex','ledger','kraken']){await p.locator('#csvSource').selectOption(mode);await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('native Bitpanda-Vorschau'));assert.ok(await p.locator('#saveDialog').isDisabled());}await p.locator('#csvSource').selectOption('auto');await preview();await p.locator('#csvFile').setInputFiles([{name:'synthetic-generic.csv',mimeType:'text/csv',buffer:Buffer.from('date,type,quantity\n1999-01-01,buy,1')},file(bitpandaCSV())]);await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('genau einer Datei'));assert.ok(await p.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);
  await p.locator('#csvSource').selectOption('bitpanda');await p.locator('#csvFile').setInputFiles(file(bitpandaCSV()));await preview();
  await p.locator('#csvFile').setInputFiles(file(bitpandaCSV([{}],{headers:bitpandaHeaders.filter(h=>h!=='Fee asset')})));await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('18-Spalten'));assert.ok(await p.locator('#saveDialog').isDisabled());
  await p.locator('#csvSource').selectOption('generic');await p.locator('#csvFile').setInputFiles(file('date;type;position;quantity;unitPrice;notes\n1999-01-01;buy;SYNTHETIC;1;2;\"a,b\"'));await p.locator('#csvMap-date').waitFor();assert.equal(await p.locator('.bitpanda-preview').count(),0);
  await close();assert.deepEqual(await read(),before);
  await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await ctx.setOffline(true);await p.reload();await ready();await open();await p.locator('#csvFile').setInputFiles(file(bitpandaCSV()));await preview();assert.ok(await p.locator('#saveDialog').isDisabled());await close();assert.deepEqual(await read(),before);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  report.engines.push({engine,result:'PASS',checks:['native preamble/18-17 auto/explicit recognition','schema/mixed/mode quarantine','exact quantities and declared fee assets/unknown tax','hostile source escaping','50/100 paging and focus','5 widths/Axe/44px','forced submit/Escape/cancel/reopen','actual offline reload','exact IDB/revision/settings zero mutation','no external preview requests']});
  console.log(engine+': BITPANDA native preview/declared fees/guards/5widths/Axe/focus/offline/exact zero writes PASS');
 }finally{await ctx.close();await browser.close();}
}
writeFileSync('artifacts/gates/bitpanda-preview/report.json',JSON.stringify(report,null,2));
