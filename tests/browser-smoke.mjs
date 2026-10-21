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
   assert.ok(overflow.scroll<=overflow.inner+1,'Horizontal overflow at '+width+' px: '+JSON.stringify(overflow));
 }
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#sidebarNav [data-page="more"]').click();
 await page.locator('#addProvider').click();
 await page.locator('#editorForm [name="name"]').fill('Test-Broker');
 await page.locator('#editorForm [name="type"]').selectOption('broker');
 await page.locator('#saveDialog').click();
 await page.locator('#addAccount').click();
 await page.locator('#editorForm [name="name"]').fill('Testdepot');
 await page.locator('#saveDialog').click();
 assert.match(await page.locator('#providerSettings').innerText(),/Test-Broker/);
 assert.match(await page.locator('#providerSettings').innerText(),/Testdepot/);
 await page.locator('#sidebarNav [data-page="positions"]').click();
 await page.locator('#addPosition').click();
 assert.equal(await page.locator('#positionAccount').inputValue(),(await page.locator('#positionAccount option').first().getAttribute('value')));
 await page.locator('#editorForm [name="name"]').fill('ETF-Test');
 await page.locator('#editorForm [name="symbol"]').fill('VWCE');
 await page.locator('#editorForm [name="isin"]').fill('IE00BK5BQT80');
 await page.locator('#editorForm [name="quantity"]').fill('2.5');
 await page.locator('#editorForm [name="price"]').fill('100');
 await page.locator('#saveDialog').click();
 assert.match(await page.locator('#positionList').innerText(),/ETF-Test/);
 assert.match(await page.locator('#positionList').innerText(),/Testdepot/);
 await page.locator('#addWallet').click();
 await page.locator('#scanAddress').fill('xprvNotAPublicAddress');
 await page.locator('#scanWalletButton').click();
 await page.waitForFunction(()=>document.querySelector('#scanWalletStatus').textContent.includes('Scan nicht möglich'));
 await page.locator('#closeDialog').click();
 await page.locator('#sidebarNav [data-page="more"]').click();
 const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#exportBackup').click()]);
 const exported=JSON.parse(await fs.readFile(await dl.path(),'utf8'));
 assert.equal(exported.version,2);assert.equal(exported.accounts.length,1);
 assert.equal(exported.positions.length,1);assert.ok(exported.positions[0].accountId);
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
 await page.locator('#saveDialog').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),'{corrupted');
 console.log('Browser smoke: six viewports, accounts, positions, wallet validation, backup, v1 migration, corrupt-storage protection PASS');
} finally {await browser.close();}
