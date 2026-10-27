import {clickDisclosed} from './browser-disclosures.mjs';
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {legacyContext} from './legacy-browser-fixture.mjs';
import {historyFixture} from './booking-history-fixture.mjs';
import {createRequire} from 'node:module';
import {mkdir,readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
for(const engine of (process.env.FLH_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true});
 const context=await legacyContext(browser);const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript({content:axe});
  await page.goto('http://127.0.0.1:4173/');
  const {model,ids}=historyFixture();
  model.priceHistories[ids[0]]={currency:'EUR',source:'CSV (selbst geprüft)',points:[{date:'2025-01-01',total:100},{date:'2026-01-01',total:200}]};
  await page.evaluate(async m=>{const {persist}=await import('/src/model.js');persist(m);},model);
  await page.reload();
  const before=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
  for(const width of [320,390,430,768,1440]){
   await page.setViewportSize({width,height:900});
   const nav=width<768?'#mobileNav':'#sidebarNav';
   await page.locator(nav+' [data-page="bookings"]').click();
   await page.locator('#bookingFilterType').selectOption('correction');
   assert.equal(await page.locator('#bookingList .history-row').count(),4);
   assert.match(await page.locator('#bookingList').innerText(),/\+2/);
   assert.match(await page.locator('#bookingList').innerText(),/Kein Handel/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.locator('#bookingFilterType').selectOption('');
   while(await page.locator('[data-action="more-bookings"]').count())await page.locator('[data-action="more-bookings"]').click();
   assert.equal(await page.locator('#bookingList .history-row').count(),249);
   await page.locator(nav+' [data-page="positions"]').click();
   const button=page.locator('[data-action="booking-history"][data-id="'+ids[0]+'"]');
   await clickDisclosed(button);const d=page.locator('#bookingHistoryDialog');await d.waitFor({state:'visible'});
   assert.equal(await d.locator('[data-booking-history="view"]').inputValue(),'eur');assert.match(await d.innerText(),/6.200/);
   await d.locator('[data-booking-history="view"]').selectOption('balances');
   assert.equal(await d.locator('tbody tr').first().locator('td').nth(1).innerText(),'64');
   await d.locator('[data-booking-history="view"]').selectOption('eur');
   assert.match(await d.locator('tbody').innerText(),/Unbekannt/);
   assert.match(await d.locator('tbody tr').first().locator('td').last().innerText(),/12.800/);
   await page.keyboard.press('Tab');assert.ok(await d.evaluate(el=>el.contains(document.activeElement)));
   const result=await page.evaluate(async()=>axe.run('#bookingHistoryDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
   assert.deepEqual(result.violations,[]);
   assert.ok(await d.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   await mkdir('artifacts/gates/flh01',{recursive:true});await page.screenshot({path:'artifacts/gates/flh01/'+engine+'-'+width+'.png'});
   await page.keyboard.press('Escape');await d.waitFor({state:'hidden'});assert.ok(await button.evaluate(el=>el===document.activeElement));
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),before);
  assert.deepEqual(errors,[]);console.log('FLH01 '+engine+': 245+4, 5 widths, quantity/EUR quality, axe, keyboard/focus and zero writes PASS');
 }finally{await browser.close();}
}
