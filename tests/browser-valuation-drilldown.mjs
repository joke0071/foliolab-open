import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),pr=createProvider({name:'Test Broker',type:'broker'});m.providers.push(pr);
  const account=createAccount({name:'Test Depot',providerId:pr.id,type:'securities'},m);m.accounts.push(account);
  for(const [name,price,asOf] of [['Aktueller ETF',100,'2026-10-21'],['Ohne Kurs',0,null],['Veralteter ETF',50,'2026-10-01']]){
   const pos=createPosition({name,kind:'etf',price,quantity:1,providerId:pr.id,accountId:account.id},m);
   pos.quoteAsOf=asOf;m.positions.push(pos);
  }
  persist(m);
 });
 await page.reload();
 assert.match(await page.locator('#totalHint').innerText(),/Bewertung eingeschränkt/);
 await page.locator('#totalHint button').click();
 assert.ok(page.url().includes('page=positions'));
 assert.match(await page.locator('#positionFilters .active').innerText(),/Zu prüfen/);
 const rows=await page.locator('#positionList .holding-name').allTextContents();
 assert.deepEqual(rows,['Ohne Kurs','Veralteter ETF']);
 await page.locator('[data-filter="all"]').click();
 assert.equal(await page.locator('#positionList .holding-row').count(),3);
 console.log('VALUATION DRILL-DOWN: exact warning-based position filter PASS');
}finally{await browser.close();}
