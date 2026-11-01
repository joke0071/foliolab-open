import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
const today=new Date().toISOString().slice(0,10);
const previous=new Date(Date.now()-86400000).toISOString().slice(0,10);
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),provider=createProvider({name:'Flatex'});m.providers.push(provider);
  const account=createAccount({name:'Wertpapierdepot',providerId:provider.id},m);m.accounts.push(account);
  m.settings.autoRefresh=false;
  m.positions.push(createPosition({id:'etf-test',providerId:provider.id,accountId:account.id,kind:'etf',
   name:'Vanguard FTSE All-World',symbol:'VWCE',isin:'IE00BK5BQT80',exchange:'Xetra',mic:'XETR',currency:'EUR',quantity:'10',price:'100'},m));
  persist(m);
 });
 await page.reload();
 await page.locator('#providerOverview .provider-accordion > summary').click();
 const row=page.locator('#providerOverview [data-position-id="etf-test"]');
 await row.locator(':scope > summary').click();
 await row.locator('[data-action="import-price-history"]').waitFor({state:'visible'});
 assert.equal(await row.locator('[data-action="load-tradingview"]').count(),0,'Deprecated external widget button must not exist');
 assert.equal(await row.locator('iframe[src*="tradingview"]').count(),0,'No vendor iframe');
 assert.equal(await row.locator('[data-action="import-price-history"]').count(),1,'Local CSV import remains available');
 assert.equal(await row.locator('.position-chart-options').count(),0,'No extra nested disclosure for one local action');
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#marketSettings > summary').click();
 await page.locator('[name="eodhdWorkerEndpoint"]').evaluate(el=>{for(let p=el;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
 await page.locator('[name="eodhdWorkerEndpoint"]').fill('https://own.workers.dev');
 await page.locator('[name="eodhdWorkerAccessToken"]').fill('SYNTHETIC_WORKER_ACCESS_TOKEN_12345');
 await page.locator('[name="securitySource"]').selectOption('eodhd');
 await page.locator('#apiSettings button[type="submit"]').click();
 await page.route('https://own.workers.dev/api/market/eodhd',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({schemaVersion:1,status:'ok',symbol:'VWCE.XETRA',points:[{date:previous,close:99},{date:today,close:105}]})}));
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#refreshAll').click();
 await page.waitForFunction(()=>document.querySelector('#priceInfo').textContent.includes('Datenupdates'));
 const p=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).positions[0]);
 assert.equal(p.price,105);assert.equal(p.quoteSource,'EODHD · eigener Worker');
 assert.equal(p.quoteAsOf,today);
 assert.equal(p.quantityExact,'10');
 await page.locator('#mobileNav [data-page="dashboard"]').click();
 const providerRow=page.locator('#providerOverview .provider-accordion').first();
 if(!(await providerRow.getAttribute('open')!==null))await providerRow.locator(':scope > summary').click();
 const refreshed=page.locator('#providerOverview [data-position-id="etf-test"]');
 if(await refreshed.getAttribute('open')===null)await refreshed.locator(':scope > summary').click();
 await refreshed.locator('.position-history-chart .chart-plot').waitFor();
 assert.match(await refreshed.innerText(),/EODHD/);
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const r=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(r<=1,'Horizontal overflow at '+width);
 }
 console.log('SECURITY SOURCES: no third-party chart, local CSV, own-worker quote/history, strict listing, persistent settings, 320-1440px PASS');
}finally{await browser.close();}
