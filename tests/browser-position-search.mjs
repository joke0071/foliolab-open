import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),provider=createProvider({name:'Test Provider'});m.providers.push(provider);
  const account=createAccount({name:'Test Depot',providerId:provider.id},m);m.accounts.push(account);
  for(const [name,price,symbol] of [['Global ETF',400,'GLO'],['Other ETF',100,'OTH']])
   m.positions.push(createPosition({name,price,symbol,kind:'etf',quantity:1,providerId:provider.id,accountId:account.id},m));
  persist(m);
 });
 await page.reload();
 await page.locator('#mobileNav [data-page="positions"]').click();
 assert.equal(await page.locator('#positionList .holding-row').count(),2);
 await page.locator('#positionSearch').fill('global');
 assert.equal(await page.locator('#positionList .holding-row').count(),1);
 assert.match(await page.locator('#positionList .holding-name').first().innerText(),/Global/);
 await page.locator('#positionSearch').fill('');
 await page.locator('#positionSort').selectOption('name');
 assert.deepEqual(await page.locator('#positionList .holding-name').allTextContents(),['Global ETF','Other ETF']);
 await page.locator('#mobileNav [data-page="bookings"]').click();
 await page.locator('#addBooking').click();
 assert.equal(await page.locator('#editDialog').isVisible(),true);
 await page.locator('#cancelDialog').click();
 console.log('POSITION SEARCH / BOOKING EMPTY: filter, sort and header booking action PASS');
}finally{await browser.close();}
