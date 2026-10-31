import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {mkdir,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
export async function runValuationReview(engine){
const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
try{
 await page.addInitScript({content:axe});await page.goto(process.env.VALUATION_BASE||'http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),pr=createProvider({name:'Test Broker',type:'broker'});m.providers.push(pr);m.settings.autoRefresh=false;
  const account=createAccount({name:'Test Depot',providerId:pr.id,type:'securities'},m);m.accounts.push(account);
  const today=new Date().toISOString().slice(0,10),stale=new Date(Date.now()-30*864e5).toISOString().slice(0,10);
  for(const [name,price,asOf] of [['Aktueller ETF',100,today],['Ohne Kurs',0,null],['Veralteter ETF',50,stale]]){
   const pos=createPosition({name,kind:'etf',price,quantity:1,providerId:pr.id,accountId:account.id},m);pos.quoteAsOf=asOf;m.positions.push(pos);
  }persist(m);
 });
 await page.reload();
 const state=()=>page.evaluate(()=>({portfolio:localStorage.getItem('foliolab-open-v1'),settings:localStorage.getItem('foliolab-open-settings-v1')}));
 const before=await state();
 assert.equal((await page.locator('#totalHint button').innerText()).trim(),'2 Positionen prüfen');
 await page.locator('#mobileNav [data-page="positions"]').click();
 assert.equal(await page.locator('#positionQuoteDetails').isVisible(),false,'global technical quote panel removed from overview');
 await page.locator('#positionSearch').fill('keine solche Position');await page.locator('#positionSort').selectOption('name');await page.locator('#positionArchiveFilter').selectOption('archived');
 await page.locator('#mobileNav [data-page="dashboard"]').click();
 for(const width of [320,360,390,412,430,1440]){
  await page.setViewportSize({width,height:900});
  const toggle=page.locator('#heroReviewToggle');
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');await toggle.focus();await page.keyboard.press('Enter');
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.ok(!page.url().includes('page=positions'));
  assert.match(await page.locator('#heroQualitySummary').innerText(),/1 Fehlende Kurse/);assert.match(await page.locator('#heroQualitySummary').innerText(),/1 Veraltete Kursdaten/);
  await page.locator('[data-action="open-quality-review"]').click();assert.ok(page.url().includes('page=positions'));
  assert.equal(await page.locator('#qualityReviewHeading').evaluate(el=>document.activeElement===el),true);
  assert.equal(await page.locator('#qualityReviewList .quality-review-card').count(),3,'fresh unverified source is distinct from two valuation warnings');
  assert.match(await page.locator('#qualityReviewSummary').innerText(),/Aktuelle Bewertung: 2 Positionen/);
  assert.equal(await page.locator('#positionOverview').isVisible(),false);
  assert.equal(await page.locator('#positionList .holding-expand[open]').count(),0,'no first row automatically opens');
  assert.equal(await page.locator('#positionSearch').inputValue(),'keine solche Position');assert.equal(await page.locator('#positionSort').inputValue(),'name');assert.equal(await page.locator('#positionArchiveFilter').inputValue(),'archived');
  assert.deepEqual(await page.evaluate(async()=> (await axe.run('#qualityReviewPanel',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await mkdir('artifacts/gates/structured-quality',{recursive:true});await page.screenshot({path:'artifacts/gates/structured-quality/review-'+engine+'-'+width+'.png',fullPage:true});
  await page.locator('[data-action="close-quality-review"]').click();assert.equal(await toggle.evaluate(el=>document.activeElement===el),true);
  await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'false');await toggle.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
  await page.screenshot({path:'artifacts/gates/structured-quality/hero-'+engine+'-'+width+'.png'});
 }
 assert.deepEqual(await state(),before,'disclosure, review, filtering and return never write portfolio');
 await page.locator('#sidebarNav [data-page="positions"]').click();await page.locator('[data-filter="__review"]').click();await page.locator('[data-action="reset-quality-review"]').click();await page.locator('[data-action="close-quality-review"]').click();
 assert.ok(page.url().includes('page=positions'));assert.equal(await page.locator('#positionSearch').inputValue(),'keine solche Position');assert.equal(await page.locator('#positionArchiveFilter').inputValue(),'archived');
 await page.locator('[data-filter="__review"]').click();const missing=page.locator('.quality-review-card').filter({has:page.getByRole('heading',{name:'Ohne Kurs',exact:true})});await missing.locator('[data-action="edit-position"]').click();await page.locator('#dialogFields [name="price"]').fill('42');await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});assert.match(await page.locator('#qualityReviewProgress').innerText(),/1 von 2 Positionen/);assert.match(await page.locator('#qualityReviewSummary').innerText(),/Aktuelle Bewertung: 1 Positionen/);assert.equal(await page.locator('#qualityReviewList .quality-review-card').count(),3,'manual price does not invent provider confirmation');assert.equal(await page.locator('#qualityReviewList [data-action="edit-position"]').first().evaluate(el=>document.activeElement.closest('.quality-review-card')!==null),true,'focus stays in the refreshed review after saving');
 console.log('VALUATION REVIEW: disclosure/explicit navigation/scopes, 6 widths/Axe/focus, normal state preserved, no auto-open/no writes PASS');
}finally{await browser.close();}

}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)for(const engine of (process.env.VALUATION_ENGINES||'chromium').split(','))await runValuationReview(engine);
