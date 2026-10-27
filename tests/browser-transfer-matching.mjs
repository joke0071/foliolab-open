import {clickDisclosed} from './browser-disclosures.mjs';
import assert from 'node:assert/strict';import {chromium,firefox,webkit} from 'playwright';import {transferFixture} from './transfer-matching-fixture.mjs';import {readFile,mkdir} from 'node:fs/promises';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
for(const engine of (process.env.TRANSFER_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true}),context=await browser.newContext(),page=await context.newPage();
 try{
  await page.addInitScript({content:axe});await page.goto('http://127.0.0.1:4173/tests/storage-origin.html');
  await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},transferFixture());
  await page.goto('http://127.0.0.1:4173/');
  const state=()=>page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();try{return await s.initialize();}finally{s.close();}});
  const before=await state(),d=page.locator('#transferMatchingDialog');
  async function choose(){await d.locator('[data-transfer="out"]').selectOption('out');await d.locator('[data-transfer-in][value="in"]').check();await d.locator('[data-transfer-in][value="in2"]').check();await d.locator('[data-transfer="reference"]').fill('Synthetic beleg-001');assert.equal(await d.locator('[data-transfer="accept"]').isDisabled(),true);await d.locator('[data-transfer="consent"]').check();}
  for(const width of [320,390,430,768,1440]){
   await page.setViewportSize({width,height:900});await page.locator((width<720?'#mobileNav':'#sidebarNav')+' [data-page="bookings"]').click();
   const button=page.locator('[data-action="transfer-matching"]');await clickDisclosed(button);await choose();
   assert.match(await d.locator('[data-transfer="preview"]').innerText(),/Mengen stimmen überein/);
   assert.deepEqual(await page.evaluate(async()=> (await axe.run('#transferMatchingDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);
   assert.ok(await d.evaluate(el=>el.scrollWidth<=el.clientWidth+1));await mkdir('artifacts/gates/transfers',{recursive:true});await page.screenshot({path:'artifacts/gates/transfers/'+engine+'-'+width+'.png'});
   await page.keyboard.press('Escape');await d.waitFor({state:'hidden'});assert.ok(await button.evaluate(el=>el===document.activeElement));
  }
  assert.deepEqual(await state(),before,'preview/cancel must not change portfolio');
  await clickDisclosed(page.locator('[data-action="transfer-matching"]'));await choose();await d.locator('[data-transfer="accept"]').click();await page.waitForFunction(()=>document.querySelector('[data-transfer="status"]').textContent.startsWith('Zuordnung gespeichert'));
  const matched=await state();assert.deepEqual(matched.positions,before.positions);assert.equal(matched.bookings.length,3);assert.equal(matched.externalCashFlows.length,0);
  // Exact encrypted full-backup roundtrip includes optional metadata through existing engine.
  const restored=await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const {backup,safeImport}=await import('/src/model.js');const {createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js');const {configureBackupPassword,encryptWithBackupPassword,decryptPasswordBackup}=await import('/src/backup-vault.js');const s=new PortfolioStorage(),m=await s.initialize();s.close();await configureBackupPassword('synthetic-transfer-password','synthetic-transfer-password');const encrypted=await encryptWithBackupPassword(JSON.stringify(createCompleteBackup(JSON.parse(backup(m)),{settings:{...m.settings,eodhdKey:'SYNTHETIC_TRANSFER_KEY'},drive:{}})));const decoded=unpackCompleteBackup(JSON.parse(await decryptPasswordBackup(JSON.parse(encrypted),'synthetic-transfer-password')));return {model:safeImport(decoded.data),settings:decoded.configuration.settings};});
  assert.equal(restored.model.externalCashFlows.length,0);assert.deepEqual(restored.model.bookings,matched.bookings);assert.equal(restored.settings.eodhdKey,'SYNTHETIC_TRANSFER_KEY');
  await d.locator('details summary').click();page.once('dialog',x=>x.accept());await d.locator('[data-transfer-undo]').click();await page.waitForFunction(()=>document.querySelector('[data-transfer="status"]').textContent.startsWith('Zuordnung gespeichert'));
  assert.deepEqual((await state()).externalCashFlows,before.externalCashFlows);
  await page.keyboard.press('Escape');await page.reload();await page.locator('#sidebarNav [data-page="bookings"]').click();await clickDisclosed(page.locator('[data-action="transfer-matching"]'));await choose();
  // A real second controller commits a newer revision while the preview is open.
  await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.bookings[0].notes='Different tab edit';await s.save(m);s.close();});
  await d.locator('[data-transfer="accept"]').click();await page.waitForFunction(()=>document.querySelector('[data-transfer="status"]').textContent.startsWith('Nicht gespeichert'));
  assert.equal((await state()).externalCashFlows.length,3);
  console.log('TRANSFER '+engine+': split preview/consent/5 widths/Axe/focus/IDB/undo/encrypted restore/stale CAS PASS');
 }finally{await context.close();await browser.close();}
}
