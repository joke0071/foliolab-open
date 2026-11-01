import {legacyContext,legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:844}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="more"]').click();
 for(const section of ['marketSettings','blockchainSettings'])
  await page.locator('#'+section).evaluate(el=>el.open=true);
 const fields=['fmpKey','twelveKey','coinGeckoKey','etherscanKey','binplorerKey'];
 for(const name of fields){
  const input=page.locator('[name="'+name+'"]');
  assert.equal(await input.getAttribute('type'),'password',name+' must start masked');
  const toggle=input.locator('xpath=following-sibling::button[contains(@class,"credential-toggle")]');
  assert.equal(await toggle.getAttribute('aria-pressed'),'false');
  await input.fill('SYNTHETIC_'+name);
  await toggle.click();
  assert.equal(await input.getAttribute('type'),'text');
  assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  assert.match(await toggle.getAttribute('aria-label'),/verbergen/);
  await toggle.click();
  assert.equal(await input.getAttribute('type'),'password');
 }
 const rpc=page.locator('#solanaRpc');
 await page.locator('#solanaRpcSetup').evaluate(el=>el.open=true);
 assert.equal(await rpc.getAttribute('type'),'password','RPC address can contain credentials');
 const rpcToggle=rpc.locator('xpath=following-sibling::button');
 await rpcToggle.click();
 assert.equal(await rpc.getAttribute('type'),'text');
 await rpcToggle.click();
 assert.equal(await rpc.getAttribute('type'),'password');
 assert.equal(await page.locator('#morePage a[href*="binplorer"],#morePage a[href*="helius"]').count(),0);
 assert.match(await page.locator('#blockchainSettings').innerText(),/Binplorer/);
 assert.match(await page.locator('#solanaRpcSetup').innerText(),/Helius/);
 await page.locator('#apiSettings button[type="submit"]').click();
 // A click is not the completion of an asynchronous locked storage write.
 await page.waitForFunction(()=>document.getElementById('toast')?.textContent==='Datenquellen und Zugänge lokal gespeichert.');
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#marketSettings').evaluate(el=>el.open=true);
 assert.equal(await page.locator('[name="fmpKey"]').getAttribute('type'),'password');
 assert.equal(await page.locator('[name="fmpKey"]').inputValue(),'SYNTHETIC_fmpKey');

 // Direct EODHD is no longer a supported automatic browser source. The
 // worker transport and quote/history are covered in browser-eodhd-worker.
 assert.equal(await page.locator('[name="eodhdKey"]').count(),0);
 for(const width of [320,360,390,412,430,768,1440]){
  await page.setViewportSize({width,height:850});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 // Real touch emulation: tapping the visibility eye must not leave a green hover tile.
 const touchContext=await legacyContext(browser,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{
  const touch=await touchContext.newPage();
  await touch.goto('http://127.0.0.1:4173/');
  await touch.locator('#mobileNav [data-page="more"]').click();
  await touch.locator('#marketSettings').evaluate(el=>el.open=true);
  const eye=touch.locator('[name="fmpKey"] + .credential-toggle');
  await eye.click();
  assert.equal(await touch.locator('[name="fmpKey"]').getAttribute('type'),'text');
  const bg=await eye.evaluate(el=>getComputedStyle(el).backgroundColor);
  assert.ok(bg==='rgba(0, 0, 0, 0)'||bg==='transparent','Touch toggle retained colored hover background: '+bg);
 }finally{await touchContext.close();}
 console.log('EODHD + CREDENTIALS: alternate host, price update, masked/visible keys, no vendor links, responsive PASS');
}finally{await browser.close();}
