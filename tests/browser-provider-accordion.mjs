import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,persist}=await import('/src/model.js');
  const m=blankModel(),pr=createProvider({name:'Example Broker'});m.providers.push(pr);
  m.accounts.push(createAccount({providerId:pr.id,name:'Depot Eins'},m),createAccount({providerId:pr.id,name:'Depot Zwei'},m));
  persist(m);
 });
 await page.reload();await page.locator('#mobileNav [data-page="more"]').click();
 const item=page.locator('#providerSettings details').first();
 assert.equal(await item.getAttribute('open'),null);
 assert.equal(await item.locator('.account-entry').first().isVisible(),false);
 assert.equal(await page.locator('[data-action="edit-provider"]').first().isVisible(),true);
 await item.locator(':scope > summary').click();
 assert.equal(await item.locator('.account-entry').count(),2);
 assert.equal(await item.locator('.account-entry').first().isVisible(),true);
 await page.locator('#mobileNav [data-page="dashboard"]').click();
 await page.locator('#mobileNav [data-page="more"]').click();
 assert.ok(await page.locator('#providerSettings details').first().getAttribute('open')!==null);
 console.log('PROVIDER SETTINGS: default compact, account expansion and visible edit actions PASS');
}finally{await browser.close();}
