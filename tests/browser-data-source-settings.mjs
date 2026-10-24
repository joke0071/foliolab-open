import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:320,height:700}});
page.on('dialog',dialog=>dialog.accept());
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="more"]').click();
 for(const id of ['marketSettings','publicSearchSetup','blockchainSettings','dataPrivacyNotes']){
  assert.equal(await page.locator('#'+id).evaluate(el=>el.open),false,id+' should start collapsed');
 }
 assert.equal(await page.locator('#autoRefresh').isVisible(),true);
 assert.equal(await page.getByText('Powered by Binplorer').count(),0);
 const ownership=await page.locator('[name="binplorerKey"]').evaluate(el=>el.form?.id);
 assert.equal(ownership,'apiSettings','External BNB key must belong to the shared settings form');
 for(const id of ['marketSettings','publicSearchSetup','blockchainSettings']){
  await page.locator('#'+id).evaluate(el=>el.open=true);
 }
 await page.locator('[name="eodhdKey"]').fill('TEST_MARKET_KEY');
 await page.locator('[name="publicInstrumentEndpoint"]').fill('https://test-worker.workers.dev');
 await page.locator('[name="binplorerKey"]').fill('TEST_BSC_KEY');
 await page.locator('[name="etherscanKey"]').fill('TEST_ETH_KEY');
 await page.locator('#publicSearchSetup button[type="submit"]').click();
 // Wait for the completed asynchronous save.
 await page.waitForFunction(()=>document.getElementById('toast')?.textContent==='Datenquellen und Zugänge lokal gespeichert.');
 let settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1'))?.settings);
 assert.equal(settings.eodhdKey,'TEST_MARKET_KEY');
 assert.equal(settings.binplorerKey,'TEST_BSC_KEY');
 assert.equal(settings.etherscanKey,'TEST_ETH_KEY');
 assert.equal(settings.publicInstrumentEndpoint,'https://test-worker.workers.dev');
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#publicSearchSetup').evaluate(el=>el.open=true);
 assert.equal(await page.locator('[name="publicInstrumentEndpoint"]').inputValue(),'https://test-worker.workers.dev');
 await page.locator('#marketSettings').evaluate(el=>el.open=true);
 await page.locator('#clearApiKeys').click();
 // Wait until the removal operation has committed.
 await page.waitForFunction(()=>document.getElementById('toast')?.textContent==='API-Schlüssel und privater RPC-Zugang entfernt. Portfolio bleibt erhalten.');
 settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1'))?.settings);
 assert.equal(settings.binplorerKey,'','Credential removal must clear blockchain keys');
 assert.equal(settings.eodhdKey,'','Credential removal must clear market data keys');
 assert.equal(settings.publicInstrumentEndpoint,'https://test-worker.workers.dev','Non-secret endpoint can remain configured');
 for(const width of [320,390,430,768,1440]){
  await page.setViewportSize({width,height:800});
  const size=await page.evaluate(()=>({body:document.documentElement.scrollWidth,screen:innerWidth}));
  assert.ok(size.body<=size.screen+1,'Horizontal overflow at '+width+': '+JSON.stringify(size));
 }
 console.log('DATA SOURCES: groups, shared form, persistence, keys and mobile layout PASS');
}finally{await browser.close();}
