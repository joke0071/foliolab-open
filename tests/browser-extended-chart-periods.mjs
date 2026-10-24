import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
const day=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async(dates)=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),provider=createProvider({name:'Synthetic ETF Portfolio'});m.providers.push(provider);
  const account=createAccount({name:'Testdepot',providerId:provider.id},m);m.accounts.push(account);
  const p=createPosition({id:'long-price',name:'Historic ETF',kind:'etf',symbol:'VWCE',currency:'EUR',
    quantity:2,price:100,providerId:provider.id,accountId:account.id},m);
  m.positions.push(p);
  m.priceHistories[p.id]={source:'CSV (selbst geprüft)',currency:'EUR',
   points:[{date:dates[0],total:50},{date:dates[1],total:80},{date:dates[2],total:95},{date:dates[3],total:100}]};
  persist(m);
 },[day(2200),day(1650),day(5),day(2)]);
 await page.reload();
 const provider=page.locator('#providerOverview .provider-accordion').first();
 await provider.locator(':scope > summary').click();
 const holding=page.locator('#providerOverview [data-position-id="long-price"]');
 await holding.locator(':scope > summary').click();
 await holding.locator('.position-history-chart .chart-plot').waitFor();
 for(const width of [320,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const overflowing=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflowing<=1,'Overflow at '+width+': '+overflowing);
  const choices=holding.locator('.position-period button:visible');
  const labels=await choices.allTextContents();
  assert.ok(labels.includes('7 T')&&labels.includes('1 J'));
  assert.ok(width<=767?labels.length<=4:labels.includes('5 J')&&labels.includes('Max'));
  if(width<=767)assert.equal(await holding.locator('.position-period-more > summary').isVisible(),true);
 }
 await page.setViewportSize({width:390,height:850});
 await holding.locator('.position-period-more > summary').click();
 await holding.locator('.position-period-popover [data-position-range="1826"]').click();
 await holding.locator('.position-history-chart .chart-plot').waitFor();
 assert.match(await holding.innerText(),/Tatsächlich verfügbare Kurse/);
 assert.equal(JSON.parse(await holding.locator('.chart-plot').getAttribute('data-chart-points')).length,3);
 await holding.locator('.position-period-more > summary').click();
 await holding.locator('.position-period-popover [data-position-range="max"]').click();
 await holding.locator('.position-history-chart .chart-plot').waitFor();
 assert.equal(JSON.parse(await holding.locator('.chart-plot').getAttribute('data-chart-points')).length,4);
 assert.match(await holding.innerText(),/Fehlende frühere Kurse werden nicht ergänzt/);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).priceHistories['long-price'].points.length),4);
 console.log('EXTENDED CHART PERIODS: local 5Y/Max coverage, mobile menu, 320-1440px, no portfolio mutations PASS');
}finally{await browser.close();}
