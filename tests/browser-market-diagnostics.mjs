import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:844}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),provider=createProvider({name:'Demo'});m.providers.push(provider);
  const account=createAccount({name:'Depot',providerId:provider.id},m);m.accounts.push(account);
  for(const symbol of ['VWCE','5MVL','XDEM','XDEQ'])
   m.positions.push(createPosition({providerId:provider.id,accountId:account.id,kind:'etf',name:symbol,
    symbol,mic:'XETR',exchange:'Xetra',currency:'EUR',quantity:1,price:100,eodhdSymbol:symbol+'.XETRA'},m));
  m.settings.eodhdWorkerEndpoint='https://own.workers.dev';m.settings.eodhdWorkerAccessToken='SYNTHETIC_ONLY_FOR_TEST_1234567890';m.settings.autoRefresh=false;persist(m);
 });
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#marketSettings').evaluate(el=>el.open=true);
 const before=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 let calls=0;
 await page.route('https://own.workers.dev/api/market/eodhd',route=>{
  calls++;
  if(calls===1)return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({schemaVersion:1,status:'ok',symbol:'VWCE.XETRA',points:[{date:new Date(Date.now()-864e5).toISOString().slice(0,10),close:111.25}]})});
  return route.fulfill({status:429,contentType:'application/json',body:'{}'});
 });
 await page.locator('#checkMarketSources').click();
 await page.waitForFunction(()=>document.querySelector('#marketDiagnosticStatus')?.textContent?.includes('Diagnose beendet'));
 const s=await page.locator('#marketDiagnosticStatus').innerText();
 assert.match(s,/VWCE/);assert.match(s,/5MVL/);assert.match(s,/Anfragelimit erreicht/);
 assert.doesNotMatch(s,/SYNTHETIC_ONLY_FOR_TEST/);assert.equal(calls,2);
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),before,'Diagnostic must not write any portfolio bytes');
 await page.locator('#mobileNav [data-page="positions"]').click();
 assert.match(await page.locator('#quoteQualitySummary').innerText(),/Kurse:/);
 for(const width of [320,390,430,768,1440]){
  await page.setViewportSize({width,height:844});
  const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(d.scroll<=d.width+1,JSON.stringify(d));
 }
 console.log('MARKET DIAGNOSTICS: capped read-only requests, safe errors, no key leaks, mobile quote status PASS');
}finally{await browser.close();}
