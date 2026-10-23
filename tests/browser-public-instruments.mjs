import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,persist}=await import('/src/model.js');
  const m=blankModel();m.settings.publicInstrumentEndpoint='https://synthetic-worker.workers.dev';persist(m);
 });
 await page.route('https://synthetic-worker.workers.dev/api/instruments/search**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
  schemaVersion:1,status:'ok',source:'openfigi',
  results:[{figi:'BBG000SYNTH',name:'Synthetic Small Cap ETF',ticker:'SYNT',isin:null,exchangeCode:'GR',mic:'XETR',currency:null}]
 })}));
 await page.reload();
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#addWizard').click();
 await page.locator('#wizardQuery').fill('Synthetic Small');
 await page.locator('#wizardExternalSearch').click();
 const match=page.locator('#wizardMatches [data-wizard-pick]').first();
 await match.waitFor();
 assert.match(await match.innerText(),/Synthetic Small Cap ETF/);
 await match.click();
 assert.equal(await page.locator('#wizardName').inputValue(),'Synthetic Small Cap ETF');
 assert.equal(await page.locator('#wizardCurrency').inputValue(),'','Unconfirmed currency must never become EUR by guess');
 await page.locator('#wizardNext').click();
 assert.match(await page.locator('#wizardError').innerText(),/Währung/);
 await page.locator('#wizardCurrency').selectOption('EUR');
 assert.equal(await page.locator('#wizardProvider').count(),1,'Account selection is available in the same dialog');
 await page.locator('#wizardNext').click();
 assert.match(await page.locator('#wizardError').innerText(),/Anbieter/);
 await page.locator('#wizardClose').click();
 const m=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(m.positions.length,0);
 console.log('PUBLIC WORKER: versioned metadata response, no inferred currency and cancel without writes PASS');
}finally{await browser.close();}
