import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:820}});
mkdirSync('artifacts/dialog-visual',{recursive:true});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,persist,createProvider,createAccount,createPosition}=await import('/src/model.js');
  const m=blankModel(),p=createProvider({name:'Beispielanbieter mit langem Namen',type:'broker'});
  m.providers.push(p);
  const a=createAccount({providerId:p.id,name:'Wertpapierdepot für Beispielwerte',type:'securities'},m);
  m.accounts.push(a);
  m.positions.push(createPosition({providerId:p.id,accountId:a.id,kind:'etf',name:'Beispiel ETF mit langer Bezeichnung',symbol:'TEST',quantity:5,price:100,currency:'EUR'},m));
  persist(m);
 });
 await page.reload();
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:820});
  const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
  await page.locator(nav+' [data-page="more"]').click();
  await page.locator('#addAccount').click();
  assert.equal(await page.locator('#editDialog').getAttribute('aria-labelledby'),'dialogTitle');
  const layout=await page.locator('#editDialog').evaluate(el=>{
   const box=el.getBoundingClientRect(),footer=el.querySelector('.dialog-footer').getBoundingClientRect(),fields=el.querySelector('#dialogFields').getBoundingClientRect();
   return {top:box.top,left:box.left,right:box.right,bottom:box.bottom,foot:footer.bottom,fieldBottom:fields.bottom,footerTop:footer.top,pageWidth:document.documentElement.scrollWidth,screenWidth:innerWidth,screenHeight:innerHeight};
  });
  assert.ok(layout.left>=-1&&layout.right<=width+1&&layout.bottom<=821&&layout.top>=-1,'Editor does not fit '+width+': '+JSON.stringify(layout));
  assert.ok(layout.fieldBottom<=layout.footerTop+1&&layout.foot<=821,'Footer remains reachable '+width);
  assert.ok(layout.pageWidth<=width+1,'Page overflow '+width);
  await page.locator('#editDialog').screenshot({path:'artifacts/dialog-visual/editor-account-'+width+'.png'});
  await page.locator('#cancelDialog').click();
  await page.locator(nav+' [data-page="positions"]').click();
  await page.locator('#addWizard').click();
  assert.equal(await page.locator('#wizardDialog').getAttribute('aria-labelledby'),'wizardTitle');
  await page.locator('#wizardDialog').screenshot({path:'artifacts/dialog-visual/wizard-'+width+'.png'});
  await page.locator('#wizardAdvanced > summary').click();
  await page.locator('#wizardDialog').screenshot({path:'artifacts/dialog-visual/wizard-advanced-'+width+'.png'});
  await page.locator('#wizardPrev').click();
 }
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:820});
  const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
  await page.locator(nav+' [data-page="bookings"]').click();
  await page.locator('#addBooking').click();
  await page.locator('#editDialog').screenshot({path:'artifacts/dialog-visual/booking-'+width+'.png'});
  assert.equal(await page.locator('#bookingPosition').evaluate(el=>el.checkValidity()),true,'Single position can be preselected');
  await page.locator('#cancelDialog').click();
 }
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:820});
  const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
  await page.locator(nav+' [data-page="positions"]').click();
  await page.locator('#addWallet').click();
  await page.locator('#editDialog').screenshot({path:'artifacts/dialog-visual/wallet-'+width+'.png'});
  await page.locator('#walletStakingOptions > summary').click();
  await page.locator('#scanAsset').selectOption('13');
  await page.locator('#editDialog').screenshot({path:'artifacts/dialog-visual/staking-manual-'+width+'.png'});
  await page.locator('#scanAsset').selectOption('11');
  await page.locator('#editDialog').screenshot({path:'artifacts/dialog-visual/staking-partial-'+width+'.png'});
  page.once('dialog',d=>d.accept());
  await page.locator('#cancelDialog').click();
 }
 console.log('DIALOG VISUAL: 4 widths plus supported/manual staking screenshots for mobile and desktop PASS');
}finally{await browser.close();}
