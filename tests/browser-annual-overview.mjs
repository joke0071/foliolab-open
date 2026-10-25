import assert from 'node:assert/strict';import {chromium,firefox,webkit} from 'playwright';import {annualFixture} from './annual-overview-fixture.mjs';import {readFile,mkdir} from 'node:fs/promises';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
for(const engine of (process.env.ANNUAL_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true}),context=await browser.newContext(),page=await context.newPage();
 try{
  await page.addInitScript({content:axe});await page.goto('http://127.0.0.1:4173/tests/storage-origin.html');const {model,custody}=annualFixture();
  await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},model);
  await page.goto('http://127.0.0.1:4173/');
  const state=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}}),before=await state();
  for(const width of [320,390,430,768,1440]){
   await page.setViewportSize({width,height:900});await page.locator((width<720?'#mobileNav':'#sidebarNav')+' [data-page="bookings"]').click();await page.locator('#bookingIncomeDetails').evaluate(el=>el.open=true);
   await page.locator('#incomeYear').selectOption('2025');await page.locator('#incomeAccount').selectOption(custody.id);
   assert.match(await page.locator('#bookingIncome').innerText(),/-\s*€\s*7,00/);assert.match(await page.locator('#incomeRecords summary').first().innerText(),/\(2\)/);
   await page.locator('#incomeRecords').evaluate(el=>el.open=true);await page.locator('.annual-record summary').first().click();assert.match(await page.locator('#incomeRecords').innerText(),/Kaufbeleg SYN-TRADE/);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await mkdir('artifacts/gates/annual',{recursive:true});await page.screenshot({path:'artifacts/gates/annual/'+engine+'-'+width+'-layout.png'});
   const overflow=await page.locator('#bookingIncome').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,children:[...el.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().right>el.getBoundingClientRect().right+1||x.scrollWidth>x.clientWidth+1).slice(0,10).map(x=>({tag:x.tagName,id:x.id,cls:x.className,width:x.getBoundingClientRect().width,client:x.clientWidth,scroll:x.scrollWidth,display:getComputedStyle(x).display,text:x.textContent.slice(0,70)}))}));
   assert.ok(overflow.scroll<=overflow.width+1,engine+' width '+width+': '+JSON.stringify(overflow));
   assert.deepEqual(await page.evaluate(async()=> (await axe.run('#bookingIncome',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))),[]);
   await mkdir('artifacts/gates/annual',{recursive:true});await page.screenshot({path:'artifacts/gates/annual/'+engine+'-'+width+'.png'});
   await page.locator('[data-action="reset-income-filters"]').click();assert.equal(await page.locator('#incomeYear').inputValue(),'');assert.equal(await page.locator('#incomeAccount').inputValue(),'');assert.match(await page.locator('#bookingIncome').innerText(),/15,00/);
  }
  assert.deepEqual(await state(),before,'filters/details must not change revision or financial data');
  // Recompute from a real decrypted complete backup, including API-key opt-in.
  const result=await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const {backup,safeImport}=await import('/src/model.js');const {bookedAnnualOverview}=await import('/src/booking-insights.js');const {createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js');const {configureBackupPassword,encryptWithBackupPassword,decryptPasswordBackup}=await import('/src/backup-vault.js');const s=new PortfolioStorage(),m=await s.initialize();s.close();await configureBackupPassword('synthetic-annual-password','synthetic-annual-password');const encrypted=await encryptWithBackupPassword(JSON.stringify(createCompleteBackup(JSON.parse(backup(m)),{settings:{...m.settings,eodhdKey:'SYNTHETIC_ANNUAL_KEY'},drive:{}})));const decoded=unpackCompleteBackup(JSON.parse(await decryptPasswordBackup(JSON.parse(encrypted),'synthetic-annual-password')));return {same:JSON.stringify(bookedAnnualOverview(safeImport(decoded.data)))===JSON.stringify(bookedAnnualOverview(m)),key:decoded.configuration.settings.eodhdKey,leaked:JSON.stringify(bookedAnnualOverview(m)).includes('SYNTHETIC_ANNUAL_KEY')};});
  assert.equal(result.same,true);assert.equal(result.key,'SYNTHETIC_ANNUAL_KEY');assert.equal(result.leaked,false);
  console.log('ANNUAL '+engine+': year/account/detail/reset/5 widths/Axe/zero writes/encrypted restore PASS');
 }finally{await context.close();await browser.close();}
}
