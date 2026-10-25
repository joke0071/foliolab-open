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
 const fields=['eodhdKey','fmpKey','twelveKey','coinGeckoKey','etherscanKey','binplorerKey'];
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
 assert.equal(await page.locator('[name="eodhdKey"]').getAttribute('type'),'password');
 assert.equal(await page.locator('[name="eodhdKey"]').inputValue(),'SYNTHETIC_eodhdKey');

 // Synthetic position and mocked network: never send an actual user API key.
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const model=blankModel(),provider=createProvider({name:'Test Broker'});
  model.providers.push(provider);
  const account=createAccount({name:'Test Depot',providerId:provider.id},model);
  model.accounts.push(account);
  model.positions.push(createPosition({providerId:provider.id,accountId:account.id,kind:'etf',name:'Test World ETF',symbol:'VWCE',isin:'IE00BK5BQT80',mic:'XETR',exchange:'Xetra',currency:'EUR',quantity:'2',price:'100',eodhdSymbol:'VWCE.XETRA'},model));
  model.settings.eodhdKey='SYNTHETIC_TEST_ONLY';
  model.settings.securitySource='eodhd';
  model.settings.autoRefresh=false;
  persist(model);
 });
 await page.reload();
 let first=0,second=0;
 await page.route('https://eodhd.com/api/eod/**',route=>{first++;return route.abort('failed');});
 await page.route('https://eodhistoricaldata.com/api/eod/**',route=>{
  second++;
  const u=new URL(route.request().url());
  assert.equal(u.searchParams.get('api_token'),'SYNTHETIC_TEST_ONLY');
  assert.equal(u.pathname,'/api/eod/VWCE.XETRA');
  const date=new Date(Date.now()-864e5).toISOString().slice(0,10);
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{date,close:111.25}])});
 });
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#refreshAll').click();
 await page.waitForFunction(()=>document.getElementById('priceInfo')?.textContent?.includes('1 Datenupdate'));
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(saved.positions[0].price,111.25);
 assert.match(saved.positions[0].quoteSource,/EODHD/);
 assert.equal(first,1);assert.equal(second,1);
 assert.equal(await page.locator('#refreshErrorDetails').getAttribute('class').then(x=>x.includes('hidden')),true);
 for(const width of [320,390,430,768,1440]){
  await page.setViewportSize({width,height:850});
  const {scrollWidth,innerWidth}=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth}));
  assert.ok(scrollWidth<=innerWidth+1,'No horizontal overflow at '+width);
 }
 // Real touch emulation: tapping the visibility eye must not leave a green hover tile.
 const touchContext=await legacyContext(browser,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{
  const touch=await touchContext.newPage();
  await touch.goto('http://127.0.0.1:4173/');
  await touch.locator('#mobileNav [data-page="more"]').click();
  await touch.locator('#marketSettings').evaluate(el=>el.open=true);
  const eye=touch.locator('[name="eodhdKey"] + .credential-toggle');
  await eye.click();
  assert.equal(await touch.locator('[name="eodhdKey"]').getAttribute('type'),'text');
  const bg=await eye.evaluate(el=>getComputedStyle(el).backgroundColor);
  assert.ok(bg==='rgba(0, 0, 0, 0)'||bg==='transparent','Touch toggle retained colored hover background: '+bg);
 }finally{await touchContext.close();}
 console.log('EODHD + CREDENTIALS: alternate host, price update, masked/visible keys, no vendor links, responsive PASS');
}finally{await browser.close();}
