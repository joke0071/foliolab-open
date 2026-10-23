import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844}});
page.on('dialog',dialog=>dialog.accept());
try{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#addProvider').click();
 await page.locator('#editorForm [name="name"]').fill('Audit Depot');
 await page.locator('#saveDialog').click();
 await page.locator('#apiSettings').evaluate(el=>el.closest('details').open=true);
 await page.locator('[name="eodhdKey"]').fill('SYNTHETIC_SECRET_FOR_TEST');
 await page.locator('#apiSettings button[type="submit"]').click();
 const before=await page.evaluate(()=>{
  localStorage.setItem('foliolab-open-v1-premigration-v1','LEGACY_SECRET');
  localStorage.setItem('foliolab-open-v1-premigration-v2','LEGACY_SECRET');
  localStorage.setItem('other-app-settings','untouched');
  return JSON.parse(localStorage.getItem('foliolab-open-v1'));
 });
 assert.equal(before.providers.length,1);
 assert.equal(before.settings.eodhdKey,'SYNTHETIC_SECRET_FOR_TEST');
 await page.locator('#clearApiKeys').click();
 const after=await page.evaluate(()=>({
  data:JSON.parse(localStorage.getItem('foliolab-open-v1')),
  old1:localStorage.getItem('foliolab-open-v1-premigration-v1'),
  old2:localStorage.getItem('foliolab-open-v1-premigration-v2'),
  unrelated:localStorage.getItem('other-app-settings')
 }));
 assert.equal(after.data.providers.length,1,'Credential removal must preserve portfolio');
 assert.equal(after.data.settings.eodhdKey,'','API key must be removed from storage');
 assert.equal(after.old1,null);
 assert.equal(after.old2,null);
 assert.equal(after.unrelated,'untouched');
 assert.equal(await page.locator('[name="eodhdKey"]').inputValue(),'','Password input must also be cleared');
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 assert.equal(await page.locator('#providerSettings').innerText().then(s=>s.includes('Audit Depot')),true);
 await page.evaluate(()=>{
  localStorage.setItem('foliolab-open-v1-premigration-v1','LEGACY_SECRET');
  localStorage.setItem('foliolab-open-last-backup-at','2026-01-01');
  localStorage.setItem('foliolab-open-last-auto-refresh','100');
 });
 await page.locator('#deleteAll').click();
 const final=await page.evaluate(()=>({
  keys:Object.keys(localStorage),
  unrelated:localStorage.getItem('other-app-settings')
 }));
 assert.equal(final.keys.some(key=>key.startsWith('foliolab-open-')),false,'All app-owned local keys must be removed');
 assert.equal(final.unrelated,'untouched','Never clear unrelated origin storage');
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 assert.match(await page.locator('#providerSettings').innerText(),/Noch kein Anbieter/);
 assert.equal(await page.locator('#totalValue').innerText().then(s=>/0,00/.test(s)),true);
 console.log('LOCAL-KEY-PRIVACY: credential revocation, preserved portfolio, migration purge, all-data deletion PASS');
}finally{await browser.close();}
