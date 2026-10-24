import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#addProvider').click();
 await page.locator('#providerName').fill('Example Bank');
 await page.locator('#providerType').selectOption('bank');
 await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
 await page.locator('#addAccount').click();
 await page.locator('#accountOpeningAmount').fill('120');
 assert.match(await page.locator('#accountOpeningLabel').innerText(),/EUR/);
 // Explicitly acknowledge changing the unit of a previously entered amount.
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#accountCurrency').selectOption('USD');
 assert.match(await page.locator('#accountOpeningLabel').innerText(),/USD/);
 assert.equal(await page.locator('#accountOpeningFxWrap').isVisible(),true);
 await page.locator('#accountOpeningFx').fill('0.9');
 await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('saveDialog').disabled);
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 const a=data.accounts.find(a=>a.currency==='USD');
 const p=data.positions.find(p=>p.accountId===a.id);
 assert.ok(p&&p.kind==='cash');
 assert.equal(p.quantityExact,'120');
 assert.equal(p.currency,'USD');
 assert.equal(p.fxRate,0.9);
 assert.equal(data.bookings.length,0);
 for(const width of [320,390,430,768,1024,1280,1440]){
  await page.setViewportSize({width,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,'Overflow at '+width);
 }
 console.log('ACCOUNT OPENING: currency label, USD FX and transaction-free opening PASS');
}finally{await browser.close();}
