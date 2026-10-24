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
 for(const id of ['publicSearchSetup','marketWorkerSetup','blockchainSettings','legacyQuoteAudit']){
  const group=page.locator('#'+id);
  await group.evaluate(el=>el.open=true);
  const tips=group.locator('.more-panel-help');
  assert.ok(await tips.count()>0,id+' must keep optional technical help');
  for(let i=0;i<await tips.count();i++)assert.equal(await tips.nth(i).evaluate(el=>el.open),false,'Help initially collapsed in '+id);
 }
 await page.locator('#dataPrivacyNotes').evaluate(el=>el.open=true);
 assert.equal(await page.locator('#dataPrivacyNotes .more-privacy-notes section').count(),3,'Privacy guidance uses three short, readable sections');
 assert.equal(await page.locator('#legacyQuoteAuditStatus').innerText(),'Noch nicht geprüft.');
 assert.ok((await page.locator('#dataPrivacyNotes').innerText()).includes('verschlüsselte Vollbackups'));
 assert.doesNotMatch(await page.locator('#dataPrivacyNotes').innerText(),/Backups enthalten keine API-Schlüssel/);
 await page.locator('[name="eodhdKey"]').fill('TEST_MARKET_KEY');
 await page.locator('[name="publicInstrumentEndpoint"]').fill('https://test-worker.workers.dev');
 await page.locator('[name="binplorerKey"]').fill('TEST_BSC_KEY');
 await page.locator('[name="etherscanKey"]').fill('TEST_ETH_KEY');
 await page.locator('#publicSearchSetup button[type="submit"]').click();
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
 await page.locator('#marketSettings > .more-panel-help').evaluate(el=>el.open=true);
 await page.locator('#clearApiKeys').click();
 settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1'))?.settings);
 assert.equal(settings.binplorerKey,'','Credential removal must clear blockchain keys');
 assert.equal(settings.eodhdKey,'','Credential removal must clear market data keys');
 assert.equal(settings.publicInstrumentEndpoint,'https://test-worker.workers.dev','Non-secret endpoint can remain configured');
 for(const id of ['publicSearchSetup','marketWorkerSetup','blockchainSettings','legacyQuoteAudit']){
  await page.locator('#'+id).evaluate(el=>el.open=true);
  await page.locator('#'+id+' .more-panel-help').first().evaluate(el=>el.open=true);
 }
 await page.locator('#dataPrivacyNotes').evaluate(el=>el.open=true);
 await page.locator('#solanaRpcSetup').evaluate(el=>el.open=true);
 for(const width of [320,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:800});
  const size=await page.evaluate(()=>({body:document.documentElement.scrollWidth,screen:innerWidth,
   broken:[...document.querySelectorAll('#dataSourcesPanel input,#dataSourcesPanel button')].filter(el=>{
    const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1;
   }).map(el=>el.name||el.id||el.textContent.slice(0,30))}));
  assert.ok(size.body<=size.screen+1,'Horizontal overflow at '+width+': '+JSON.stringify(size));
  assert.deepEqual(size.broken,[],'Settings controls overflow at '+width);
 }
 console.log('DATA SOURCES: groups, shared form, persistence, keys and mobile layout PASS');
}finally{await browser.close();}
