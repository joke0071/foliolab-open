import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
try{
 await page.route('https://api.twelvedata.com/quote**',async route=>{
  const symbol=new URL(route.request().url()).searchParams.get('symbol');
  const payload=symbol==='VWCE'
   ?{symbol:'VWCE',exchange:'Xetra',mic_code:'XETR',currency:'EUR',close:'125.25',datetime:'2026-10-21'}
   :{symbol:'ABC',exchange:'NYSE',mic_code:'XNYS',currency:'EUR',close:'999',datetime:'2026-10-21'};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
 });
 await page.route('https://api.frankfurter.dev/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(path.includes('2026-10-20')?{date:'2026-10-20',base:'USD',rates:{EUR:.87}}:{date:'2026-10-21',base:'USD',rates:{EUR:.89}})});
 });
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),provider=createProvider({name:'Testbroker'});m.providers.push(provider);
  const dep=createAccount({providerId:provider.id,name:'Depot',type:'securities'},m);m.accounts.push(dep);
  m.positions.push(createPosition({providerId:provider.id,accountId:dep.id,kind:'etf',name:'VWCE',symbol:'VWCE',isin:'IE00BK5BQT80',exchange:'Xetra',mic:'XETR',quantity:1,price:100,currency:'EUR'},m));
  m.positions.push(createPosition({providerId:provider.id,accountId:dep.id,kind:'stock',name:'Unsicherer Titel',symbol:'ABC',exchange:'NYSE',mic:'XNYS',quantity:1,price:200,currency:'USD',fxRate:1},m));
  m.settings.twelveKey='TEST_USER_KEY';persist(m);
 });
 await page.reload();
 await page.locator('#refreshAll').click();
 await page.waitForFunction(()=>document.querySelector('#refreshAll').disabled===false,{timeout:18000});
 const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 const good=s.positions.find(p=>p.symbol==='VWCE'),bad=s.positions.find(p=>p.symbol==='ABC');
 assert.equal(good.price,125.25);assert.equal(good.quoteSource,'Twelve Data');
 assert.equal(good.mic,'XETR');assert.equal(good.quoteQuality,'verified-listing');
 assert.equal(bad.price,200,'currency mismatch must preserve previous quote');
 assert.equal(bad.quoteSource,null);assert.equal(bad.fxRate,.89);
 assert.equal(bad.fxRateDate,'2026-10-21');
 await page.reload();
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(persisted.positions[0].quoteSource,'Twelve Data');
 assert.equal(persisted.positions[1].fxSource,'Frankfurter');
 await page.locator('#sidebarNav [data-page="bookings"]').click();
 await page.locator('#addBooking').click();
 await page.locator('#bookingPosition').selectOption(bad.id);
 await page.locator('#editorForm [name="date"]').fill('2026-10-20');
 await page.locator('#bookingAdvanced').evaluate(el=>el.open=true);
 await page.locator('#loadHistoricalFx').click();
 await page.waitForFunction(()=>document.querySelector('#editorForm [name="fxRate"]').value==='0.87');
 assert.equal(await page.locator('#editorForm [name="fxRateDate"]').inputValue(),'2026-10-20');
 assert.match(await page.locator('#historicalFxNote').innerText(),/Broker-Ausführungskurs/);
 console.log('Phase 2 browser: verified listing updates, mismatched currency rejects, reference FX and provenance roundtrip PASS');
}finally{await browser.close();}
