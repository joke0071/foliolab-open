import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),p=createProvider({name:'Ledger'});m.providers.push(p);
  const a=createAccount({name:'Wallet',type:'wallet',providerId:p.id},m);m.accounts.push(a);
  m.positions.push(createPosition({id:'sonic-test',kind:'crypto',coinId:'sonic-3',name:'Sonic',symbol:'S',providerId:p.id,accountId:a.id,quantity:'100',price:'0.005602',currency:'EUR'},m));
  persist(m);
 });
 await page.reload();
 await page.route('https://api.coingecko.com/api/v3/coins/sonic-3/market_chart**',route=>route.abort('failed'));
 await page.locator('#providerOverview .provider-accordion>summary').click();
 const row=page.locator('[data-position-id="sonic-test"]');
 await row.locator('summary').click();
 await row.locator('.position-history-external').waitFor();
 assert.match(await row.locator('.position-history-unavailable').innerText(),/CoinGecko aus diesem Browser gerade nicht erreichbar/);
 assert.equal(await row.locator('.position-history-external').getAttribute('href'),'https://www.coingecko.com/en/coins/sonic-3');
 assert.equal(await row.locator('.position-history-chart').count(),0,'Network errors must not display synthetic prices');
 const model=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(model.positions[0].quantityExact,'100');
 assert.equal(model.positions[0].priceExact,'0.005602');
 // Switch to an available chart; small-cap crypto axis must retain precision.
 await page.unroute('https://api.coingecko.com/api/v3/coins/sonic-3/market_chart**');
 // A failed fetch is not retained in the yearly history cache.
 await page.route('https://api.coingecko.com/api/v3/coins/sonic-3/market_chart**',route=>{
  const now=Date.now();
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({prices:[[now-3*86400000,.0054],[now-86400000,.0056],[now,.0058]]})});
 });
 await row.locator('[data-position-range="7"]').click();
 await row.locator('.chart-y-labels').waitFor();
 assert.match(await row.locator('.chart-y-labels').innerText(),/0,00/);
 assert.doesNotMatch(await row.locator('.chart-y-labels').innerText(),/€ 0\n€ 0\n€ 0/);
 console.log('CRYPTO HISTORY: CORS fallback, user navigation, no false chart or changed holdings, tiny-price axis PASS');
}finally{await browser.close();}
