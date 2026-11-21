import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';

// Frankfurter v1 originals. The ECB D.USD.EUR.SP00.A series starts on 1999-01-04
// at 1.1789 USD/EUR. Replaying these responses keeps CI independent of the provider.
const published='1999-01-04', missing='1999-01-01';
const first='{"amount":1.0,"base":"USD","date":"1999-01-04","rates":{"EUR":0.84825}}';
const gap='{"message":"not found"}';
const base=process.env.ETF_SOURCE_BASE||'http://127.0.0.1:4173/';
for(const engine of (process.env.ETF_SOURCE_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch();
 try{
  const page=await browser.newPage({serviceWorkers:'block'});
  await page.goto(base);
  const ready=()=>page.waitForFunction(()=>document.querySelector('#portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await ready();
  await page.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js');
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=false;
   m.providers.push(createProvider({id:'provider',name:'Testbroker'}));
   m.accounts.push(createAccount({id:'account',providerId:'provider',name:'USD',currency:'USD'},m));
   m.positions.push(createPosition({id:'cash',providerId:'provider',accountId:'account',name:'USD',kind:'cash',currency:'USD',quantity:100,price:1,fxRate:0.8},m));
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  });
  await page.reload();await ready();
  const read=()=>page.evaluate(async()=>{
   const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
   const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}
  });
  const before=await read();
  await page.locator('#sidebarNav [data-page="bookings"]').click();
  await page.locator('#addBooking').click();
  const form=page.locator('#editorForm'), date=form.locator('[name=date]'), fx=form.locator('[name=fxRate]');
  const load=form.locator('#loadHistoricalFx'), source=form.locator('[name=fxSource]'), sourceDate=form.locator('[name=fxRateDate]');
  const historicalUrl=day=>'https://api.frankfurter.dev/v1/'+day+'?base=USD&symbols=EUR';
  let hold=null;
  await page.route(historicalUrl(published),async route=>{
   if(hold)await hold;
   await route.fulfill({status:200,contentType:'application/json',body:first});
  });
  await page.route(historicalUrl(missing),route=>route.fulfill({status:404,contentType:'application/json',body:gap}));
  await date.fill(published);
  await load.click();
  await page.waitForFunction(()=>document.querySelector('[name=fxRateDate]').value==='1999-01-04');
  assert.equal(await fx.inputValue(),'0.84825');
  // The positive observation must not survive a switch to a day without a rate.
  await date.fill(missing);await form.locator('[name=quantity]').fill('10');await load.click();
  await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('HTTP 404'));
  assert.equal(await fx.inputValue(),'');assert.equal(await sourceDate.inputValue(),'');assert.equal(await source.inputValue(),'');
  assert.equal(await fx.evaluate(el=>el.validity.valueMissing),true);
  await page.locator('#saveDialog').click();
  assert.equal(await page.locator('#editDialog').isVisible(),true);assert.deepEqual(await read(),before);
  // New page context for the request cache; a delayed success must not replace a manual entry.
  page.once('dialog',d=>d.accept());await page.locator('#cancelDialog').click();
  await page.reload();await ready();await page.locator('#sidebarNav [data-page="bookings"]').click();await page.locator('#addBooking').click();
  let release;hold=new Promise(resolve=>{release=resolve;});
  await date.fill(published);
  const started=page.waitForRequest(historicalUrl(published));
  await load.click();await started;await fx.fill('0.91');
  const finished=page.waitForResponse(historicalUrl(published));
  release();const response=await finished;await response.finished();
  // Observe consumption of that response by the app before checking the final DOM.
  await page.evaluate(async()=>{const {historicalExchangeRate}=await import('/src/market.js');await historicalExchangeRate('USD','1999-01-04');});
  assert.equal(await fx.inputValue(),'0.91');assert.equal(await sourceDate.inputValue(),'');assert.equal(await source.inputValue(),'Manuell eingetragen');
  page.once('dialog',d=>d.accept());await page.locator('#cancelDialog').click();
  await page.reload();await ready();assert.deepEqual(await read(),before);
  console.log(engine+': booking FX 1999-01-04 original / 1999-01-01 gap, required rate, delayed response, manual draft and exact IndexedDB reopen PASS');
 }finally{await browser.close();}
}
