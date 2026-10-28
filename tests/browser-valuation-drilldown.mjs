import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),pr=createProvider({name:'Test Broker',type:'broker'});m.providers.push(pr);
  const account=createAccount({name:'Test Depot',providerId:pr.id,type:'securities'},m);m.accounts.push(account);
  // Keep fresh/stale semantics stable as the actual browser date advances.
  const today=new Date().toISOString().slice(0,10),stale=new Date(Date.now()-30*864e5).toISOString().slice(0,10);
  for(const [name,price,asOf] of [['Aktueller ETF',100,today],['Ohne Kurs',0,null],['Veralteter ETF',50,stale]]){
   const pos=createPosition({name,kind:'etf',price,quantity:1,providerId:pr.id,accountId:account.id},m);
   pos.quoteAsOf=asOf;m.positions.push(pos);
  }
  persist(m);
 });
 await page.reload();
 assert.equal((await page.locator('#totalHint button').innerText()).trim(),'2 Positionen prüfen ›');
 const hint=await page.locator('#totalHint button').evaluate(el=>{
  const r=el.getBoundingClientRect();return {height:r.height,width:r.width,parent:el.closest('.hero').getBoundingClientRect().width};
 });
 assert.ok(hint.height<=40&&hint.width<hint.parent,'Valuation status must be a compact chip on mobile');
 assert.match(await page.locator('#totalHint button').getAttribute('title'),/Bewertung eingeschränkt/);
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#positionSearch').fill('keine solche Position');
 await page.locator('#mobileNav [data-page="dashboard"]').click();
 await page.locator('#totalHint button').click();
 assert.ok(page.url().includes('page=positions'));
 assert.equal(await page.locator('#positionSearch').inputValue(),'','Hero review clears stale search');
 assert.match(await page.locator('#positionFilters .active').innerText(),/Zu prüfen/);
 assert.equal(await page.locator('#positionQuoteDetails').getAttribute('open'),'','Quote details must open');
 assert.equal(await page.locator('#positionList .holding-expand[open]').count(),1,'First affected position expands');
 assert.equal(await page.locator('#positionFilters .active').evaluate(el=>document.activeElement===el),true,'Active filter receives keyboard focus');
 const rows=await page.locator('#positionList .holding-name').allTextContents();
 assert.deepEqual(rows.slice().sort(),['Ohne Kurs','Veralteter ETF'].sort(),'Filter shows precisely affected positions');
 assert.equal(await page.locator('#positionList .position-review-reason').count(),2,'Every affected position explains its warning');
 assert.match(await page.locator('#positionList .holding-expand[open]').innerText(),/Bewertungshinweis/);
 await page.locator('[data-filter="all"]').click();
 assert.equal(await page.locator('#positionList .holding-row').count(),3);
 console.log('VALUATION DRILL-DOWN: exact warning-based position filter PASS');
}finally{await browser.close();}
