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
 await page.route('https://s.tradingview.com/widgetembed/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated chart</title>'}));
 await page.locator('#providerOverview .provider-accordion > summary').click();
 const row=page.locator('#providerOverview [data-position-id="etf-test"]');
 await row.locator(':scope > summary').click();
 assert.equal(await row.locator('[data-action="load-tradingview"]').isVisible(),false);
 await row.locator('.position-chart-options>summary').click();
 await row.locator('[data-action="load-tradingview"]').waitFor({state:'visible'});
 assert.equal(await row.locator('.tradingview-slot iframe').count(),0,'No third-party chart loaded without user action');
 assert.match(await row.innerText(),/Öffentliches Diagramm laden/);
 await row.locator('[data-action="load-tradingview"]').click();
 const frame=row.locator('.tradingview-slot iframe');
 const source=await frame.getAttribute('src');
 assert.equal(new URL(source).hostname,'s.tradingview.com');
 assert.equal(new URL(source).searchParams.get('symbol'),'XETR:VWCE');
 assert.match(await frame.getAttribute('sandbox'),/allow-scripts/);
 assert.equal(await row.locator('.tradingview-slot script').count(),0,'No third-party JS in portfolio origin');
 assert.equal(await row.locator('.tradingview-slot a').getAttribute('rel'),'noopener noreferrer');
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#marketSettings > summary').click();
 await page.locator('[name="eodhdKey"]').fill('TESTONLY');
 await page.locator('[name="securitySource"]').selectOption('eodhd');
 await page.locator('#apiSettings button[type="submit"]').click();
 await page.route('https://eodhd.com/api/eod/**',route=>{
  assert.match(route.request().url(),/VWCE.XETRA/);
  return route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify([{date:previous,close:102.5},{date:today,close:103.3}])});
 });
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#refreshAll').click();
 await page.waitForFunction(()=>document.querySelector('#priceInfo').textContent.includes('Datenupdates'));
 const p=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).positions[0]);
 assert.equal(p.price,103.3);assert.equal(p.quoteSource,'EODHD · Tagesschluss');
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
 console.log('SECURITY SOURCES: public chart consent, EODHD quote/history, strict listing, persistent settings, 320-1440px PASS');
}finally{await browser.close();}
