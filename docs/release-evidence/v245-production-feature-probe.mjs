import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {bookingUIFixture} from '../../tests/booking-ui-fixture.mjs';
const useProxy=!!process.env.HTTPS_PROXY;
const seed=bookingUIFixture(),target=seed.bookings.find(b=>b.importSource).id;
mkdirSync('artifacts/gates/import-removal-production',{recursive:true});
for(const engine of (process.env.BOOKING_MANAGEMENT_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:useProxy?['--ignore-certificate-errors']:[],...(useProxy?{proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}}:{})}),context=await browser.newContext({ignoreHTTPSErrors:useProxy}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=()=>page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();s.close();return m;});
 const edit=()=>page.locator('[data-booking-row-action="edit"][data-id="'+target+'"]');
 try{
  await page.goto('https://foliolab.unperfekt.at/');await ready();await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},seed);await page.reload();await ready();
  await page.locator('#mobileNav [data-page="bookings"]:visible,#sidebarNav [data-page="bookings"]:visible').click();const before=await read();
  for(const width of [320,360,390,412,430,1440]){
   await page.setViewportSize({width,height:900});await edit().click();assert.equal(await page.locator('[name=quantity]').isDisabled(),true);assert.equal(await page.locator('#deleteBooking').isEnabled(),true);await page.locator('#deleteBooking').click();await page.locator('[name=reason]').fill('Synthetic original receipt');await page.locator('#saveDialog').click();await page.locator('[name=confirmBookingChange]').waitFor();assert.match(await page.locator('#dialogFields').innerText(),/Wiederimport gesperrt/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await page.evaluate(readFileSync('node_modules/axe-core/axe.min.js','utf8'));const violations=await page.evaluate(async()=> (await axe.run(document.getElementById('editDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);
   await page.screenshot({path:`artifacts/gates/import-removal-production/${engine}-${width}.png`});assert.deepEqual(await read(),before);page.once('dialog',d=>d.accept());await page.keyboard.press('Escape');await page.locator('#editDialog').waitFor({state:'hidden'});
  }
  await edit().click();await page.locator('#deleteBooking').click();await page.locator('[name=reason]').fill('Synthetic original receipt');await page.locator('#saveDialog').click();await page.locator('[name=confirmBookingChange]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
  const after=await read();assert.equal(after.bookings.some(b=>b.id===target),false);assert.equal(after.journalEntries.at(-1).managementAudit.version,2);assert.equal(after.positions.find(p=>p.id==='cash-a').quantityExact,'1124');
  const encryptedRestore=await page.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js'),{safeImport}=await import('/src/model.js'),{encryptBackup,decryptBackup}=await import('/src/crypto-backup.js'),{configureBackupPassword,encryptWithBackupPassword,decryptPasswordBackup}=await import('/src/backup-vault.js');
   const s=new PortfolioStorage(),m=await s.initialize();s.close();const plain=JSON.stringify(createCompleteBackup(m)),password='Synthetic v245 acceptance!';
   const v1=await encryptBackup(plain,password),r1=safeImport(unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(v1),password))).data);
   await configureBackupPassword(password,password);const v2=await encryptWithBackupPassword(plain),r2=safeImport(unpackCompleteBackup(JSON.parse(await decryptPasswordBackup(JSON.parse(v2),password))).data);
   return {v1:JSON.stringify(r1)===JSON.stringify(safeImport(structuredClone(m))),v2:JSON.stringify(r2)===JSON.stringify(safeImport(structuredClone(m))),auditVersion:r2.journalEntries.at(-1).managementAudit.version};
  });assert.deepEqual(encryptedRestore,{v1:true,v2:true,auditVersion:2});console.log('Production complete encrypted backup v1/v2 with imported removal audit PASS');
  await page.locator('[data-booking-manage="undo"]').click();await page.locator('[name=confirmUndo]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});assert.deepEqual(await read(),before);assert.deepEqual(errors,[]);console.log(engine+': imported deletion preview/5 mobile widths+desktop/Axe/exact persisted removal+undo PASS');
 }finally{await browser.close();}
}
