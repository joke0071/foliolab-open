import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:320,height:590},acceptDownloads:true});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="more"]').click();
 // Google Drive stays compact even when expanded with the setup instructions and restore controls.
 const drive=page.locator('#googleDriveBackupSetup');
 assert.equal(await drive.getAttribute('open'),null,'Drive settings must be collapsed initially');
 await drive.evaluate(el=>el.open=true);
 assert.equal(await page.locator('#driveDisconnect').isVisible(),false);
 assert.equal(await page.locator('#driveOAuthHelp').getAttribute('open'),null);
 assert.equal(await page.locator('#driveRestoreSection').getAttribute('open'),null);
 await page.locator('#driveOAuthHelp').evaluate(el=>el.open=true);
 await page.locator('#driveRestoreSection').evaluate(el=>el.open=true);
 await page.locator('.drive-folder-options').evaluate(el=>el.open=true);
 for(const width of [320,390,430,540,768,1024]){
  await page.setViewportSize({width,height:760});
  const layout=await page.evaluate(()=>{
   const panel=document.getElementById('googleDriveBackupSetup');
   const sections=[...panel.querySelectorAll('.btn,.field input,.field select')]
    .filter(el=>getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().width>0);
   return {viewport:innerWidth,page:document.documentElement.scrollWidth,
    panel:Math.round(panel.getBoundingClientRect().right),
    offenders:sections.filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>el.id||el.textContent.slice(0,35))};
  });
  assert.ok(layout.page<=layout.viewport+1,'Drive layout horizontal overflow at '+width+': '+JSON.stringify(layout));
  assert.deepEqual(layout.offenders,[],'Drive controls leave viewport at '+width);
 }
 await page.setViewportSize({width:320,height:590});
 await drive.evaluate(el=>el.open=false);
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
 await page.locator('#blockchainSettings').evaluate(el=>el.open=true);
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
 // Simulate full browser quota: an edit may appear in memory but must not be saved later.
 await page.evaluate(async()=>{
  const {blankModel,persist}=await import('/src/model.js');
  persist(blankModel());
 });
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 assert.equal(await page.locator('#autoRefresh').isChecked(),true);
 await page.evaluate(()=>{
  window.__originalSetItem=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){
   if(key==='foliolab-open-v1')throw new DOMException('Storage quota exceeded','QuotaExceededError');
   return window.__originalSetItem.call(this,key,value);
  };
 });
 await page.locator('#autoRefresh').click(); // A failed save must immediately restore checked state.
 await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('Änderung nicht gespeichert'));
 assert.match(await page.locator('#toast').innerText(),/Änderung nicht gespeichert/);
 assert.equal(await page.locator('#autoRefresh').isChecked(),true,'Failed save must restore visible committed settings');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).settings.autoRefresh),true,'Quota must not modify saved data');
 await page.evaluate(()=>{
  Storage.prototype.setItem=window.__originalSetItem;
  delete window.__originalSetItem;
 });
 await page.locator('#autoRefresh').uncheck();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).settings.autoRefresh===false);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).settings.autoRefresh),false,'Saving must recover after storage becomes writable');
 console.log('BACKUPS / SETTINGS / MODAL: downloaded status, persistence, RPC accordion and mobile footer PASS');
}finally{await browser.close();}
