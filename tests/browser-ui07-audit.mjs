import assert from 'node:assert/strict';import {chromium,firefox,webkit} from 'playwright';import {historyFixture} from './booking-history-fixture.mjs';import {annualFixture} from './annual-overview-fixture.mjs';import {transferFixture} from './transfer-matching-fixture.mjs';import {readFile,mkdir,writeFile} from 'node:fs/promises';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
for(const engine of (process.env.UI07_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true}),context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage(),findings=[],errors=[],scans=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript({content:axe});await page.goto('http://127.0.0.1:4173/tests/storage-origin.html');
  const h=historyFixture(),model=h.model;
  for(const other of [annualFixture().model,transferFixture()])for(const key of ['providers','accounts','positions','bookings','journalEntries','openingPositions','externalCashFlows','snapshots'])model[key].push(...other[key]);
  model.settings.autoRefresh=false;
  await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const {snapshot}=await import('/src/model.js');for(let i=7;i>=0;i--){const date=new Date(Date.now()-i*864e5).toISOString().slice(0,10);snapshot(m,date,'Synthetisch bestätigter Stichtag',{manualTotalEUR:String(30000+(7-i)*100)});}const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},model);
  await page.goto('http://127.0.0.1:4173/');
  const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}}),before=await record();
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
  const check=async(scope,width,target=page)=>{
   const violations=await target.evaluate(async selector=>(await axe.run(selector,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),scope);
   scans.push({scope,width,violations:violations.length});for(const v of violations)findings.push({engine,width,scope,...v});
   const overflow=await target.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));if(overflow.scroll>overflow.width+1)findings.push({engine,width,scope,id:'page-overflow',...overflow});
  };
  async function closeDialog(id,trigger,enter=false){await page.keyboard.press('Tab');assert.ok(await page.locator(id).evaluate(el=>el.contains(document.activeElement)),'dialog focus remains contained');if(enter){await page.locator(id+' .icon-close').focus();await page.keyboard.press('Enter');}else await page.keyboard.press('Escape');await page.locator(id).waitFor({state:'hidden'});assert.ok(await trigger.evaluate(el=>el===document.activeElement),'dialog focus returns');}
  for(const width of [320,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:1000});const nav=width<720?'#mobileNav':'#sidebarNav';
   for(const tab of ['dashboard','history','positions','bookings','more']){
    await page.locator(nav+' [data-page="'+tab+'"]').click();await check('#'+tab+'Page',width);if(width===320||width===1440){await mkdir('artifacts/gates/ui07',{recursive:true});await page.screenshot({path:'artifacts/gates/ui07/'+engine+'-'+tab+'-'+width+'.png'});}
   }
   await page.locator(nav+' [data-page="positions"]').click();await page.locator('#positionList .holding-expand').first().evaluate(el=>el.open=true);await check('#positionList',width);
   const history=page.locator('[data-action="booking-history"][data-id="'+h.ids[0]+'"]');await history.click();await page.locator('#bookingHistoryDialog').waitFor({state:'visible'});await page.locator('#bookingHistoryDialog .booking-meta').first().evaluate(el=>el.open=true);await check('#bookingHistoryDialog',width);await closeDialog('#bookingHistoryDialog',history);
   await page.locator(nav+' [data-page="bookings"]').click();await page.locator('#bookingList .booking-meta').first().evaluate(el=>el.open=true);await page.locator('#bookingIncomeDetails').evaluate(el=>el.open=true);await page.locator('#incomeRecords').evaluate(el=>el.open=true);await page.locator('.annual-record').first().evaluate(el=>el.open=true);await check('#bookingsPage',width);
   const transfer=page.locator('[data-action="transfer-matching"]');await transfer.click();await page.locator('[data-transfer="out"]').selectOption('out');await page.locator('[data-transfer-in][value="in"]').check();await page.locator('[data-transfer-in][value="in2"]').check();await page.locator('[data-transfer="reference"]').fill('UI07 synthetischer Beleg');await page.locator('[data-transfer="consent"]').check();await check('#transferMatchingDialog',width);await closeDialog('#transferMatchingDialog',transfer);
   await page.locator(nav+' [data-page="more"]').click();const provider=page.locator('#addProvider');await provider.click();await check('#editDialog',width);await closeDialog('#editDialog',provider,true);
   await page.locator('#pageTitle').scrollIntoViewIfNeeded();await mkdir('artifacts/gates/ui07',{recursive:true});await page.screenshot({path:'artifacts/gates/ui07/'+engine+'-'+width+'.png'});
  }
  // Actual browser rendering at 200% CSS zoom, plus reduced-motion context above.
  await page.setViewportSize({width:1440,height:1000});await page.locator('#sidebarNav [data-page="bookings"]').click();await page.evaluate(()=>document.documentElement.style.zoom='2');await check('#bookingsPage','1440 / 200% CSS zoom');await page.screenshot({path:'artifacts/gates/ui07/'+engine+'-zoom200.png'});await page.evaluate(()=>document.documentElement.style.zoom='');
  assert.deepEqual(await record(),before,'audit viewing/cancellation/zoom must not change financial data or revision');
  const empty=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'});empty.on('pageerror',e=>errors.push('empty: '+e.message));await empty.addInitScript({content:axe});await empty.goto('http://127.0.0.1:4173/');for(const tab of ['dashboard','history','positions','bookings','more']){await empty.locator('#mobileNav [data-page="'+tab+'"]').click();await check('#'+tab+'Page','390 empty new IDB installation',empty);}await empty.close();
  assert.deepEqual(errors,[]);await writeFile('artifacts/gates/ui07/'+engine+'-report.json',JSON.stringify({engine,scans,findings,errors},null,2));
  console.log('UI07 '+engine+': '+scans.length+' actual scans, '+findings.length+' findings, 6 widths, native dialog keyboard/focus, reduced motion, 200% CSS zoom');
  assert.deepEqual(findings,[],'UI07 findings: '+JSON.stringify(findings));
 }finally{await context.close();await browser.close();}
}
