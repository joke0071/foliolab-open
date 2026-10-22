import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:320,height:590},acceptDownloads:true});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="more"]').click();
 assert.match(await page.locator('#backupStatus').innerText(),/Noch kein Backup/);
 const downloadPromise=page.waitForEvent('download');
 await page.locator('#exportBackup').click();
 const download=await downloadPromise;
 assert.match(download.suggestedFilename(),/foliolab-backup/);
 assert.match(await page.locator('#backupStatus').innerText(),/für einen Download erstellt/);
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 assert.match(await page.locator('#backupStatus').innerText(),/für einen Download erstellt/);
 assert.equal(await page.locator('#solanaRpc').isVisible(),false);
 await page.locator('#solanaRpc').evaluate(el=>el.closest('details').querySelector('summary').click());
 assert.equal(await page.locator('#solanaRpc').isVisible(),true);
 await page.locator('#addProvider').click();
 const result=await page.locator('#editDialog').evaluate(el=>{
  const rect=el.getBoundingClientRect(),fields=el.querySelector('#dialogFields').getBoundingClientRect();
  const foot=el.querySelector('.dialog-footer').getBoundingClientRect();
  return {dialogTop:rect.top,dialogBottom:rect.bottom,fieldEnd:fields.bottom,footerTop:foot.top,footerBottom:foot.bottom,height:innerHeight,scroll:document.documentElement.scrollWidth};
 });
 assert.ok(result.dialogTop>=-1&&result.dialogBottom<=result.height+1,JSON.stringify(result));
 assert.ok(result.fieldEnd<=result.footerTop+1,'Footer must not cover form fields');
 assert.ok(result.footerBottom<=result.height+1,'Save button remains within viewport');
 assert.ok(result.scroll<=321,'No horizontal scrolling');
 await page.locator('#cancelDialog').click();
 console.log('BACKUPS / SETTINGS / MODAL: downloaded status, persistence, RPC accordion and mobile footer PASS');
}finally{await browser.close();}
