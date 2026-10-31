import {manageList} from './browser-management-mode.mjs';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {bookingUIFixture} from './booking-ui-fixture.mjs';
const seed=bookingUIFixture(),target=seed.bookings.find(b=>b.importSource).id;
mkdirSync('artifacts/gates/import-removal',{recursive:true});
for(const engine of (process.env.BOOKING_MANAGEMENT_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true}),context=await browser.newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=()=>page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();s.close();return m;});
 const edit=()=>page.locator('[data-booking-row-action="edit"][data-id="'+target+'"]');
 try{
  await page.goto('http://127.0.0.1:4173/');await ready();await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},seed);await page.reload();await ready();
  await page.locator('#mobileNav [data-page="bookings"]:visible,#sidebarNav [data-page="bookings"]:visible').click();const before=await read();
  for(const width of [320,360,390,412,430,1440]){
   await page.setViewportSize({width,height:900});await manageList(page,'bookings');await edit().click();assert.equal(await page.locator('[name=quantity]').isDisabled(),true);assert.equal(await page.locator('#deleteBooking').isEnabled(),true);await page.locator('#deleteBooking').click();await page.locator('[name=reason]').fill('Synthetic original receipt');await page.locator('#saveDialog').click();await page.locator('[name=confirmBookingChange]').waitFor();assert.match(await page.locator('#dialogFields').innerText(),/Wiederimport gesperrt/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await page.evaluate(readFileSync('node_modules/axe-core/axe.min.js','utf8'));const violations=await page.evaluate(async()=> (await axe.run(document.getElementById('editDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);
   await page.screenshot({path:`artifacts/gates/import-removal/${engine}-${width}.png`});assert.deepEqual(await read(),before);page.once('dialog',d=>d.accept());await page.keyboard.press('Escape');await page.locator('#editDialog').waitFor({state:'hidden'});
  }
  await manageList(page,'bookings');await edit().click();await page.locator('#deleteBooking').click();await page.locator('[name=reason]').fill('Synthetic original receipt');await page.locator('#saveDialog').click();await page.locator('[name=confirmBookingChange]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
  const after=await read();assert.equal(after.bookings.some(b=>b.id===target),false);assert.equal(after.journalEntries.at(-1).managementAudit.version,2);assert.equal(after.positions.find(p=>p.id==='cash-a').quantityExact,'1124');
  await page.locator('[data-booking-manage="undo"]').click();await page.locator('[name=confirmUndo]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});assert.deepEqual(await read(),before);assert.deepEqual(errors,[]);console.log(engine+': imported deletion preview/5 mobile widths+desktop/Axe/exact persisted removal+undo PASS');
 }finally{await browser.close();}
}
