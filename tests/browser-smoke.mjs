import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({acceptDownloads:true});
const page=await context.newPage();
const url='http://127.0.0.1:4173/';
try{
 await page.goto(url);
 await page.locator('#totalValue').waitFor();
 for(const width of [320,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:850});
   await page.waitForTimeout(100);
   const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
   if(overflow.scroll>overflow.inner+1){
    const offenders=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>{
     const r=el.getBoundingClientRect(),style=getComputedStyle(el);
     return style.display!=='none'&&style.visibility!=='hidden'&&r.width>0&&r.right>innerWidth+1&&r.left>=0;
    }).slice(0,12).map(el=>({tag:el.tagName,id:el.id,cls:typeof el.className==='string'?el.className.slice(0,90):'',right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)})));
    assert.fail('Horizontal overflow at '+width+' px: '+JSON.stringify({...overflow,offenders}));
   }
 }
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#sidebarNav [data-page="more"]').click();
 await page.locator('#addProvider').click();
 await page.locator('#editorForm [name="name"]').fill('Test-Broker');
 await page.locator('#editorForm [name="type"]').selectOption('broker');
 await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
 await page.locator('#addAccount').click();
 await page.locator('#editorForm [name="name"]').fill('Testdepot');
 await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
 assert.match(await page.locator('#providerSettings').innerText(),/Test-Broker/);
 await page.locator('#providerSettings details summary').first().click();
 assert.match(await page.locator('#providerSettings').innerText(),/Testdepot/);
 await page.locator('#sidebarNav [data-page="positions"]').click();
 await page.locator('#addWizard').click();
 await page.locator('#wizardAdvanced > summary').click();
 assert.equal(await page.locator('#wizardAdvanced').getAttribute('open'),'','Advanced fields open inline');
 await page.locator('#wizardName').fill('ETF-Test');
 await page.locator('#wizardSymbol').fill('VWCE');
 await page.locator('#wizardIsin').fill('IE00BK5BQT80');
 await page.locator('#wizardQuantity').fill('2.5');
 await page.locator('#wizardCurrentPrice').fill('100');
 await page.locator('#wizardNext').click();
 await page.locator('#wizardPortfolio').click();
 assert.match(await page.locator('#positionList').innerText(),/ETF-Test/);
 assert.match(await page.locator('#positionList').innerText(),/Testdepot/);
 await page.locator('#addWallet').click();
 await page.locator('#scanAddress').fill('xprvNotAPublicAddress');
 await page.locator('#scanWalletButton').click();
 await page.waitForFunction(()=>document.querySelector('#scanWalletStatus').textContent.includes('Suche fehlgeschlagen'));
 page.once('dialog',dialog=>dialog.accept()); // Explicitly discard invalid wallet draft.
 await page.locator('#closeDialog').click();
 await page.locator('#sidebarNav [data-page="more"]').click();
 const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#exportBackup').click()]);
 const exported=JSON.parse(await fs.readFile(await dl.path(),'utf8'));
 assert.equal(exported.version,3);assert.equal(exported.accounts.length,1);
 assert.equal(exported.positions.length,1);assert.ok(exported.positions[0].accountId);
 // Password-protected backups are never plain-text JSON holdings.
 await page.locator('.advanced-apis').filter({has:page.locator('#backupPassword')}).evaluate(el=>el.open=true);
 await page.locator('#backupPassword').fill('unverwechselbares-testpasswort');
 await page.locator('#backupPasswordConfirm').fill('unverwechselbares-testpasswort');
 await page.locator('#saveBackupPassword').click();
 await page.waitForFunction(()=>document.querySelector('#backupPasswordStatus').textContent.startsWith('Backup-Passwort eingerichtet'));
 assert.equal(await page.locator('#backupPasswordForm').isVisible(),false,'Password form is collapsed once configured');
 assert.equal(await page.locator('#backupChangeToggle').isVisible(),true);
 assert.equal(await page.locator('#backupOldPasswordField').isVisible(),false);
 await page.locator('#backupChangeToggle').click();
 await page.locator('#backupPasswordForm').waitFor({state:'visible'});
 assert.equal(await page.locator('#backupOldPasswordField').isVisible(),true,'Old password only appears in change mode');
 await page.locator('#backupChangeToggle').click();
 await page.locator('#backupPasswordForm').waitFor({state:'hidden'});
 const encryptedDownloadPromise=page.waitForEvent('download',{timeout:5000});
 await page.locator('#exportEncryptedBackup').click();
 let encDl;
 try{encDl=await encryptedDownloadPromise}catch(e){
   throw Error('Encrypted download failed: toast='+JSON.stringify(await page.locator('#toast').innerText())+
     ' vaultStatus='+JSON.stringify(await page.locator('#backupPasswordStatus').innerText())+
     ' browserErrors='+JSON.stringify(await page.evaluate(()=>window.__foliolabTestErrors||[])),{cause:e});
 }
 const encrypted=await fs.readFile(await encDl.path(),'utf8');
 const envelope=JSON.parse(encrypted);
 assert.equal(envelope.format,'foliolab-open-encrypted-v2');
 assert.ok(!encrypted.includes('ETF-Test'));
 const dialogHandler=async dialog=>{if(dialog.type()==='prompt')await dialog.accept('unverwechselbares-testpasswort');else await dialog.accept();};
 page.on('dialog',dialogHandler);
 await page.locator('#backupFile').setInputFiles({name:'verschluesselt.json',mimeType:'application/json',buffer:Buffer.from(encrypted)});
 await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('Backup wiederhergestellt'));
 page.off('dialog',dialogHandler);

 // Once cached, all pages, scripts and manual holdings must remain usable offline.
 await page.waitForFunction(()=>navigator.serviceWorker?.controller!==null,{timeout:15000});
 await context.setOffline(true);await page.reload();
 await page.locator('#sidebarNav [data-page="dashboard"]').click();
 await page.locator('#totalValue').waitFor();
 assert.match(await page.locator('#totalValue').innerText(),/250/);
 await context.setOffline(false);

 // Reload a real legacy data shape and assert one default account is created without modifying original bytes.
 const legacy={...exported,version:1,accounts:undefined,positions:exported.positions.map(({accountId,...p})=>p)};
 const original=JSON.stringify(legacy);
 await page.evaluate(raw=>localStorage.setItem('foliolab-open-v1',raw),original);
 await page.reload();
 const migrated=await page.evaluate(()=>({backup:localStorage.getItem('foliolab-open-v1-premigration-v1'),names:document.getElementById('providerOverview').innerText}));
 assert.equal(migrated.backup,original);
 assert.match(migrated.names,/Test-Broker/);
 // Corrupt data must not silently overwrite user storage.
 await page.evaluate(()=>localStorage.setItem('foliolab-open-v1','{corrupted'));
 await page.reload();
 assert.equal(await page.locator('#notice').isVisible(),true);
 await page.locator('#sidebarNav [data-page="more"]').click();
 await page.locator('#addProvider').click();
 await page.locator('#editorForm [name="name"]').fill('Darf nicht gespeichert werden');
 await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),'{corrupted');
 console.log('Browser smoke: six viewports, accounts, positions, wallet validation, backup, v1 migration, corrupt-storage protection PASS');
} finally {await browser.close();}
