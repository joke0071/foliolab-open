import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:820}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="more"]').click();
 const addProvider=page.locator('#addProvider'),addAccount=page.locator('#addAccount');
 for(const name of ['Depot Alpha','Bank Beta']){
  await addProvider.click();
  assert.equal(await page.locator('#saveDialog').innerText(),'Anbieter speichern');
  await page.locator('#providerName').fill(name);
  await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
  await page.locator('#editDialog').waitFor({state:'hidden'});
 }
 await addAccount.click();
 assert.equal(await page.locator('#saveDialog').innerText(),'Konto speichern');
 assert.equal(await page.locator('#accountProvider').inputValue(),'','No arbitrary provider when multiple exist');
 assert.equal(await page.locator('#accountProvider').evaluate(el=>el.checkValidity()),false);
 await page.locator('#accountName').fill('Noch nicht zugeordnet');
 page.once('dialog',d=>d.dismiss());
 await page.locator('#cancelDialog').click();
 assert.equal(await page.locator('#editDialog').isVisible(),true,'A rejected discard preserves the editor');
 assert.equal(await page.locator('#accountName').inputValue(),'Noch nicht zugeordnet','Draft survives');
 page.once('dialog',d=>d.accept());
 await page.locator('#cancelDialog').click();
 assert.equal(await page.locator('#editDialog').isVisible(),false);
 assert.equal(await addAccount.evaluate(el=>document.activeElement===el),true,'Focus restored after cancel');
 let m=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(m.accounts.length,0,'Cancel cannot create account');
 await addAccount.click();
 await page.locator('#accountName').fill('Tastaturentwurf');
 page.once('dialog',d=>d.dismiss());
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#editDialog').isVisible(),true,'Escape cannot discard edited fields without confirmation');
 page.once('dialog',d=>d.accept());
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#editDialog').isVisible(),false,'Escape closes after confirmation');
 assert.equal(await addAccount.evaluate(el=>document.activeElement===el),true,'Focus restored after Escape');
 await page.locator('#mobileNav [data-page="positions"]').click();
 const addWizard=page.locator('#addWizard');
 await addWizard.click();
 assert.equal(await page.locator('#wizardProvider').inputValue(),'','No invented wizard provider');
 assert.equal(await page.locator('#wizardAccount').count(),0,'Account stays hidden until provider is chosen');
 await page.locator('#wizardProvider').selectOption('__new__');
 await page.locator('#wizardProviderName').fill('Temporärer Anbieter');
 page.once('dialog',d=>d.dismiss());
 await page.locator('#wizardPrev').click();
 assert.equal(await page.locator('#wizardDialog').isVisible(),true,'Wizard retains unsaved edits on rejected discard');
 assert.equal(await page.locator('#wizardProviderName').inputValue(),'Temporärer Anbieter');
 page.once('dialog',d=>d.accept());
 await page.locator('#wizardPrev').click();
 assert.equal(await page.locator('#wizardDialog').isVisible(),false);
 assert.equal(await addWizard.evaluate(el=>document.activeElement===el),true,'Wizard restores opener focus');
 m=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(m.providers.length,2,'Cancelled wizard may not persist a transient provider');
 for(const width of [320,360,390,430,767,768,1024,1440]){
  await page.setViewportSize({width,height:820});
  const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
  await page.locator(nav+' [data-page="more"]').click();
  await page.locator('#addAccount').click();
  const geometry=await page.locator('#editDialog').evaluate(el=>{
   const r=el.getBoundingClientRect();
   return {left:r.left,right:r.right,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth};
  });
  assert.ok(geometry.left>=-1&&geometry.right<=width+1,'Editor offscreen '+width+': '+JSON.stringify(geometry));
  assert.ok(geometry.scrollWidth<=width+1,'Page overflows at '+width);
  await page.locator('#cancelDialog').click();
 }
 console.log('DIALOG CONSISTENCY: explicit choice, guarded cancel/Escape, draft retention, focus, responsive widths PASS');
}finally{await browser.close();}
