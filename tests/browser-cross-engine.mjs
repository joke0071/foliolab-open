import assert from 'node:assert/strict';
import {firefox,webkit} from 'playwright';

// Repeat the same critical local-first journeys on independent browser engines.
// Nothing here uses a real API key, network wallet or the user's portfolio.
for(const [name,engine] of [['Firefox',firefox],['WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e.message||e)));
 try{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await page.locator('#totalValue').waitFor();
  const nav='#mobileNav';
  assert.ok(await page.locator(nav).isVisible(),name+' mobile navigation hidden');
  for(const section of ['positions','history','more','dashboard']){
   await page.locator(nav+' [data-page="'+section+'"]').click();
   const width=await page.evaluate(()=>({document:document.documentElement.scrollWidth,screen:innerWidth}));
   assert.ok(width.document<=width.screen+1,name+' '+section+' horizontal overflow: '+JSON.stringify(width));
  }
  await page.locator(nav+' [data-page="more"]').click();
  await page.locator('#addProvider').click();
  assert.equal(await page.locator('#editDialog').evaluate(el=>el.open),true,name+' dialog failed to open');
  await page.locator('#editorForm [name="name"]').fill('Audit '+name);
  await page.locator('#saveDialog').click();
  await page.locator('#addAccount').click();
  await page.locator('#editorForm [name="name"]').fill('Testdepot');
  await page.locator('#saveDialog').click();
  await page.locator(nav+' [data-page="positions"]').click();
  await page.locator('#addWizard').click();
 await page.locator('#wizardName').fill('Audit ETF');
   await page.locator('#wizardSymbol').fill('VWCE');
   await page.locator('#wizardIsin').fill('IE00BK5BQT80');
   await page.locator('#wizardQuantity').fill('2');
   await page.locator('#wizardCurrentPrice').fill('100');
   await page.locator('#wizardNext').click();
   await page.locator('#wizardPortfolio').click();
  await page.reload();
  await page.locator(nav+' [data-page="dashboard"]').click();
  assert.match(await page.locator('#totalValue').innerText(),/200/,name+' portfolio not restored after reload');
  await page.locator(nav+' [data-page="more"]').click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportBackup').click()]);
  assert.match(download.suggestedFilename(),/foliolab-backup/,name+' backup export failed');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).positions.length),1);
  await page.setViewportSize({width:1440,height:900});
  assert.ok(await page.locator('#sidebarNav').isVisible(),name+' desktop navigation hidden');
  await page.locator('#sidebarNav [data-page="positions"]').click();
  assert.match(await page.locator('#positionList').innerText(),/Audit ETF/);
  assert.deepEqual(errors,[],name+' uncaught browser errors');
  console.log('CROSS-ENGINE '+name+' mobile/desktop, dialog, asset entry, persistence, backup PASS');
 }finally{await browser.close();}
}
