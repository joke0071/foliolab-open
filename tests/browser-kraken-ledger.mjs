import {waitForAppServiceWorker} from './browser-gate-deadline.mjs';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {krakenCSV,krakenHeaders} from './kraken-ledger-fixture.mjs';
import {ledgerModel} from './ledger-live-fixture.mjs';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const report={base,scope:'Synthetic native Kraken read-only CSV preview',engines:[]};
mkdirSync('artifacts/gates/kraken-ledger',{recursive:true});
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({viewport:{width:390,height:900},ignoreHTTPSErrors:Boolean(proxy)});
 await ctx.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
 const p=await ctx.newPage(),errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return {record:await readPortfolioRecord(db),prefs:Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])};}finally{db.close();}});
 const open=async()=>{await p.locator('#mobileNav [data-page=bookings]:visible,#sidebarNav [data-page=bookings]:visible').click();await p.locator('#openCSVImport').click();};
 const close=async(key='cancel')=>{if(key==='Escape')await p.keyboard.press('Escape');else await p.locator('#cancelDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});assert.equal(await p.evaluate(()=>document.activeElement.id),'openCSVImport');};
 const file=text=>({name:'synthetic-kraken.csv',mimeType:'text/csv',buffer:Buffer.from(text)});
 const preview=()=>p.waitForFunction(()=>document.getElementById('csvReviewStatus')?.textContent.includes('Kraken Ledger:'));
 try{
  await p.goto(base);await ready();
  // Finish the first worker claim before seed/re-navigation. Otherwise a late
  // controller handoff can reload the second document during its baseline read.
  await waitForAppServiceWorker(p);await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const seed=ledgerModel();seed.settings.autoRefresh=false;
  await p.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},seed);
  await p.goto(base);await ready();await waitForAppServiceWorker(p);const before=await read();
  ctx.on('request',r=>{const u=new URL(r.url());if(u.origin!==new URL(base).origin&&u.protocol!=='blob:')external.push(r.url());});
  await open();await p.locator('#csvFile').setInputFiles(file(krakenCSV([{wallet:'<img src=x onerror=alert(1)>',amount:'0.000000000000000001',feecurrency:'USD',fee:'2.5'},{asset:'EUR',amount:'-500',feecurrency:'EUR'},{type:'future',subtype:'unproved'}])));await preview();
  assert.ok(await p.locator('#saveDialog').isDisabled());assert.equal(await p.locator('#csvMap-date').count(),0);assert.equal(await p.locator('#csvReview .performance-details').count(),3);
  await p.locator('#csvReview .performance-details').first().locator('summary').first().click();
  const review=await p.locator('#csvReview').innerText();assert.match(review,/2,5 USD|2.5 USD/);assert.match(review,/3 Zeile\(n\) dieser Gruppe/);assert.match(review,/0.000000000000000001/);assert.equal(await p.locator('#csvReview img').count(),0);
  for(const width of [320,390,430,768,1440]){
   await p.setViewportSize({width,height:900});await p.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await p.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   for(const id of ['cancelDialog','saveDialog'])assert.ok((await p.locator('#'+id).boundingBox()).height>=44);
   assert.deepEqual(await p.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(x=>({id:x.id,targets:x.nodes.map(n=>n.target)}))),[]);
   await p.screenshot({path:'artifacts/gates/kraken-ledger/'+engine+'-'+width+'.png'});
  }
  await p.setViewportSize({width:390,height:900});assert.deepEqual(await read(),before);
  await p.locator('#editorForm').evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await p.locator('#dialogError:not(.hidden)').waitFor();assert.match(await p.locator('#dialogError').innerText(),/Kraken Ledger bleibt/);assert.ok(await p.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);await close('Escape');
  await open();assert.equal(await p.locator('#csvReview .performance-details').count(),0);await p.locator('#csvFile').setInputFiles(file(krakenCSV(Array.from({length:75},()=>({})))));await preview();assert.equal(await p.locator('#csvReview .performance-details').count(),50);await p.locator('#krakenShowMore').click();assert.equal(await p.locator('#csvReview .performance-details').count(),75);assert.equal(await p.locator('#krakenShowMore').count(),0);assert.ok(await p.locator('#csvReview .performance-details').nth(50).locator('summary').first().evaluate(e=>e===document.activeElement));
  await p.locator('#csvSource').selectOption('generic');await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('native Kraken-Vorschau'));assert.ok(await p.locator('#saveDialog').isDisabled());assert.equal(await p.locator('#csvMap-feeEUR').count(),0);
  await p.locator('#csvSource').selectOption('kraken');await preview();await p.locator('#csvFile').setInputFiles([file(krakenCSV()),{name:'synthetic-generic.csv',mimeType:'text/csv',buffer:Buffer.from('date,type,quantity\n1999-01-01,buy,1')}]);await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('genau einer Datei'));assert.ok(await p.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);
  await p.locator('#csvFile').setInputFiles(file(krakenCSV([{}],krakenHeaders.filter(h=>h!=='feecurrency'))));await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('16-Spalten'));assert.ok(await p.locator('#saveDialog').isDisabled());await close();assert.deepEqual(await read(),before);
  await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await ctx.setOffline(true);await p.reload();await ready();await open();await p.locator('#csvFile').setInputFiles(file(krakenCSV()));await preview();assert.ok(await p.locator('#saveDialog').isDisabled());await close();assert.deepEqual(await read(),before);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  report.engines.push({engine,result:'PASS',checks:['native auto/explicit recognition','schema/mixed/mode quarantine','all legs and exact declared fees','hostile source escaping','50/100 paging and focus','5 widths/Axe/44px','forced submit/Escape/cancel/reopen','actual offline reload','exact IDB/revision/settings zero mutation','no external preview requests']});
  console.log(engine+': KRAKEN LEDGER native preview/declared fees/guards/5widths/Axe/focus/offline/exact zero writes PASS');
 }finally{await ctx.close();await browser.close();}
}
writeFileSync('artifacts/gates/kraken-ledger/report.json',JSON.stringify(report,null,2));
