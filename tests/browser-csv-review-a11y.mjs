import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:720}});
try{
 await page.goto('http://127.0.0.1:4173/');
 const ids=await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),p=createProvider({name:'Testbroker',type:'broker'});
  m.providers.push(p);
  const a=createAccount({providerId:p.id,name:'Depot',type:'securities'},m);m.accounts.push(a);
  const alpha=createPosition({providerId:p.id,accountId:a.id,kind:'etf',name:'Alpha ETF',symbol:'AAA',quantity:1,price:100,currency:'EUR'},m);
  const beta=createPosition({providerId:p.id,accountId:a.id,kind:'etf',name:'Beta ETF',symbol:'BBB',quantity:2,price:200,currency:'EUR'},m);
  const token=createPosition({providerId:p.id,accountId:a.id,kind:'crypto',name:'Sample crypto',symbol:'SAMPLE',quantity:1,price:20,currency:'EUR'},m);
  m.positions.push(alpha,beta,token);persist(m);
  return {alpha:alpha.id,beta:beta.id,token:token.id};
 });
 await page.reload();
 await page.locator('#mobileNav [data-page="bookings"]').click();
 await page.locator('#openCSVImport').click();
 assert.equal(await page.locator('#csvReview').getAttribute('role'),null,'Review list is not a giant live status');
 assert.equal(await page.locator('#csvReviewStatus').getAttribute('role'),'status');
 const csv='Datum;Typ;ISIN;Menge;Kurs\n2026-10-20;Kauf;UNBEKANNT;1;100\n2026-10-21;Kauf;AAA;1;100\n2026-10-22;Kauf;FEHLT;1;50';
 await page.locator('#csvFile').setInputFiles({name:'beispiel.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
 // Parsing uses file.text() asynchronously: wait for the processed preview, not its initial placeholder.
 await page.waitForFunction(()=>document.getElementById('csvReviewStatus')?.textContent.includes('1 bereit, 0 bereits vorhanden, 2 zu prüfen'));
 assert.match(await page.locator('#csvReviewStatus').innerText(),/1 bereit, 0 bereits vorhanden, 2 zu prüfen/);
 assert.equal(await page.locator('#saveDialog').isDisabled(),true,'Unresolved rows block import');
 const first=page.locator('[data-csv-assign="2"]');
 assert.equal(await first.getAttribute('aria-label'),'Zeile 2: passende Anlage');
 await first.selectOption(ids.alpha);
 assert.match(await page.locator('#csvReviewStatus').innerText(),/2 bereit, 0 bereits vorhanden, 1 zu prüfen/);
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'csvReviewHeading','Focus moves to summary if the corrected row disappears');
 const skip=page.locator('[data-csv-skip="4"]');
 await skip.check();
 assert.match(await page.locator('#csvReviewStatus').innerText(),/2 bereit, 0 bereits vorhanden, 0 zu prüfen, 1 übersprungen/);
 assert.equal(await page.locator('[data-csv-skip="4"]').isChecked(),true);
 assert.equal(await page.locator('[data-csv-skip="4"]').evaluate(el=>document.activeElement===el),true,'Review retains focused skip control');
 assert.equal(await page.locator('#saveDialog').isDisabled(),false);
 await page.locator('[data-csv-skip="4"]').uncheck();
 assert.equal(await page.locator('[data-csv-skip="4"]').evaluate(el=>document.activeElement===el),true,'Focus remains on restored problem row');
 assert.equal(await page.locator('#saveDialog').isDisabled(),true);
 await page.locator('[data-csv-skip="4"]').check();
 const old=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 page.once('dialog',d=>d.dismiss());
 await page.locator('#cancelDialog').click();
 assert.equal(await page.locator('#editDialog').isVisible(),true,'CSV draft is guarded after file choice');
 page.once('dialog',d=>d.accept());
 await page.locator('#cancelDialog').click();
 assert.equal(await page.locator('#editDialog').isVisible(),false);
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),old,'Abandoning a reviewed CSV changes no financial data');
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('[data-action="edit-position"][data-id="'+ids.token+'"]').click();
 await page.locator('#coinQuery').fill('bitcoin');
 const results=page.locator('#coinResults [data-coin]');
 if(await results.count()){
  await results.first().click();
  assert.notEqual(await page.locator('#editorForm [name="coinId"]').inputValue(),'','Coin choice fills identity fields');
 }
 page.once('dialog',d=>d.dismiss());
 await page.locator('#cancelDialog').click();
 assert.equal(await page.locator('#editDialog').isVisible(),true,'Programmatic asset suggestions are guarded');
 page.once('dialog',d=>d.accept());
 await page.locator('#cancelDialog').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),old,'Suggestions cannot persist without saving');
 console.log('CSV REVIEW A11Y: concise announcement, focus on replace, skipped rows, guarded draft and unchanged holdings PASS');
}finally{await browser.close();}
