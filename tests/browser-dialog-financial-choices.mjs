import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:820}});
try{
 await page.goto('http://127.0.0.1:4173/');
 const ids=await page.evaluate(async()=>{
  const {blankModel,persist,createProvider,createAccount}=await import('/src/model.js');
  const m=blankModel();
  const p1=createProvider({name:'Wallet Alpha',type:'wallet'});
  const p2=createProvider({name:'Wallet Beta',type:'wallet'});
  const p3=createProvider({name:'Broker Gamma',type:'broker'});
  m.providers.push(p1,p2,p3);
  const a1=createAccount({name:'Wallet A1',providerId:p1.id,type:'wallet'},m);
  const a2=createAccount({name:'Wallet A2',providerId:p1.id,type:'wallet'},m);
  const a3=createAccount({name:'Wallet B1',providerId:p2.id,type:'wallet'},m);
  m.accounts.push(a1,a2,a3);persist(m);
  return {p1:p1.id,p2:p2.id,p3:p3.id,a1:a1.id,a2:a2.id,a3:a3.id};
 });
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#addAccount').click();
 assert.equal(await page.locator('#accountProvider').inputValue(),'','Multiple providers must not silently preselect');
 await page.locator('#accountProvider').selectOption(ids.p1);
 await page.locator('#accountName').fill('Individuell angelegtes Wallet-Konto');
 await page.locator('#accountProvider').selectOption(ids.p2);
 assert.equal(await page.locator('#accountName').inputValue(),'Individuell angelegtes Wallet-Konto','User name survives provider change');
 await page.locator('#accountProvider').selectOption(ids.p1);
 assert.equal(await page.locator('#accountName').inputValue(),'Individuell angelegtes Wallet-Konto');
 await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
 await page.locator('#editDialog').waitFor({state:'hidden'});
 let model=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 const added=model.accounts.find(a=>a.name==='Individuell angelegtes Wallet-Konto');
 assert.ok(added&&added.providerId===ids.p1,'Persisted account name and provider must match the explicit choice');
 await page.locator('#mobileNav [data-page="positions"]').click();
 const walletOpen=page.locator('#addWallet');
 await walletOpen.click();
 assert.equal(await page.locator('#scanProvider').inputValue(),'','Multiple wallet providers require an explicit choice');
 assert.equal(await page.locator('#scanProvider option[value=""]').innerText(),'Wallet-Anbieter auswählen');
 assert.equal(await page.locator('#scanWalletStatus').getAttribute('role'),'status','Only concise scan status is announced');
 assert.equal(await page.locator('#walletScanResults').getAttribute('aria-live'),null,'Results list must not announce 150 rows');
 // Expose the post-scan storage controls without making external wallet/network requests.
 // The scanner's separate result-validation and wallet-save gate remain unchanged.
 await page.locator('#scanSaveSettings').evaluate(el=>el.classList.remove('hidden'));
 await page.locator('#scanProvider').selectOption(ids.p1);
 assert.equal(await page.locator('#scanAccount').inputValue(),'','Multiple wallet accounts require explicit choice');
 assert.equal(await page.locator('#scanAccount option[value=""]').innerText(),'Wallet-Konto auswählen');
 await page.locator('#scanAccount').selectOption(ids.a2);
 assert.equal(await page.locator('#scanAccount').inputValue(),ids.a2);
 await page.locator('#scanProvider').selectOption(ids.p2);
 assert.equal(await page.locator('#scanAccount').inputValue(),ids.a3,'Only existing wallet account may be preselected');
 await page.locator('#scanProvider').selectOption(ids.p1);
 assert.equal(await page.locator('#scanAccount').inputValue(),'','Previous provider selection must not leak to new provider');
 await page.locator('#scanProvider').selectOption('__new__');
 assert.equal(await page.locator('#scanAccount').inputValue(),'__new__','New wallet creates an explicit new account');
 assert.equal(await page.locator('#saveDialog').isDisabled(),true,'Import remains locked before scan');
 const targets=await page.locator('#editDialog').evaluate(el=>{
  const close=el.querySelector('.icon-close').getBoundingClientRect();
  const cancel=el.querySelector('#cancelDialog').getBoundingClientRect();
  const save=el.querySelector('#saveDialog').getBoundingClientRect();
  return [[close.width,close.height],[cancel.width,cancel.height],[save.width,save.height]];
 });
 for(const [w,h]of targets)assert.ok(w>=44&&h>=44,'Dialog touch target >=44px: '+JSON.stringify(targets));
 await page.locator('#walletStakingOptions').evaluate(el=>el.open=true);
 const s=await page.locator('#walletStakingOptions summary').evaluate(el=>el.getBoundingClientRect().height);
 assert.ok(s>=44,'Disclosure touch target >=44px');
 for(const width of [320,360,390,430,767,768,1024,1440]){
  await page.setViewportSize({width,height:700});
  const box=await page.locator('#editDialog').evaluate(el=>{
   const a=el.getBoundingClientRect(),foot=el.querySelector('.dialog-footer').getBoundingClientRect();
   return {left:a.left,right:a.right,top:a.top,bottom:a.bottom,foot:foot.bottom,bodyScroll:document.documentElement.scrollWidth};
  });
  assert.ok(box.left>=-1&&box.right<=width+1&&box.top>=-1&&box.bottom<=701&&box.foot<=701,'Wallet overflow '+width+': '+JSON.stringify(box));
  assert.ok(box.bodyScroll<=width+1,'Horizontal page overflow '+width);
 }
 page.once('dialog',d=>d.accept());
 await page.locator('#cancelDialog').click();
 assert.equal(await walletOpen.evaluate(el=>document.activeElement===el),true,'Wallet close restores trigger focus');
 model=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(model.accounts.length,4,'Cancelled wallet scan cannot persist a new account');
 assert.equal(model.providers.length,3,'Cancelled wallet scan cannot persist a new provider');
 console.log('DIALOG FINANCIAL CHOICES: account draft, explicit wallet account/provider, focus, touch targets and 8 widths PASS');
}finally{await browser.close();}
