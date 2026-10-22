import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),p=createProvider({name:'Broker'});m.providers.push(p);
  const a=createAccount({providerId:p.id,name:'Depot Alpha'},m),b=createAccount({providerId:p.id,name:'Depot Beta'},m);m.accounts.push(a,b);
  m.positions.push(createPosition({providerId:p.id,accountId:a.id,name:'ETF One',kind:'etf',symbol:'ONE',quantity:2,price:100},m));
  m.positions.push(createPosition({providerId:p.id,accountId:b.id,name:'ETF Two',kind:'etf',symbol:'TWO',quantity:2,price:120},m));
  persist(m);
 });
 await page.reload();
 await page.locator('#providerOverview summary.provider-row').click();
 await page.locator('[data-action="view-account"]').first().click();
 assert.ok(page.url().includes('page=positions'));
 assert.match(await page.locator('#positionFilters .active').innerText(),/Depot Alpha/);
 assert.deepEqual(await page.locator('#positionList .holding-name').allTextContents(),['ETF One']);
 console.log('ACCOUNT DEEPLINK: navigates from dashboard to exact account holdings PASS');
}finally{await browser.close();}
