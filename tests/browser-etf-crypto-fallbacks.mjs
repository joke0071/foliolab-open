import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,backup,safeImport,persist}=await import('/src/model.js');
  const m=blankModel(),p=createProvider({name:'Demo Flatex'});m.providers.push(p);
  const a=createAccount({name:'Depot',providerId:p.id,type:'securities'},m);m.accounts.push(a);
  m.positions.push(createPosition({id:'etf-demo',providerId:p.id,accountId:a.id,kind:'etf',
   symbol:'5MVL',name:'iShares Edge MSCI EM Value',quantity:'228.652303',price:'86.18999127246927',currency:'EUR'},m));
  const restored=safeImport(JSON.parse(backup(m)));
  persist(restored);
 });
 await page.reload();
 await page.locator('#providerOverview .provider-accordion>summary').click();
 const detail=page.locator('#providerOverview [data-position-id="etf-demo"]');
 await detail.locator(':scope > summary').click();
 assert.equal(await detail.locator('[data-action="load-tradingview"]').count(),0,'No external chart button');
 assert.equal(await detail.locator('iframe[src*="tradingview"]').count(),0,'No vendor iframe');
 assert.equal(await detail.locator('[data-action="import-price-history"]').count(),1,'Local CSV course import stays accessible');
 assert.equal(await detail.locator('.position-chart-options').count(),0,'Unnecessary nested disclosure removed');
 assert.equal(await detail.locator('.position-history-compact').getAttribute('open'),null);
 await detail.locator('.position-history-compact>summary').click();
 assert.match(await detail.locator('.position-history-unavailable').innerText(),/Kein nativer Kursverlauf/);
 assert.equal(await detail.locator('[data-position-range]').count(),0,'No fake market dates without verified course provider');
 const model=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(model.positions[0].isin,'IE00BG0SKF03');
 assert.equal(model.positions[0].quantityExact,'228.652303');
 assert.equal(model.positions[0].priceExact,'86.18999127246927');
 assert.equal(model.positions[0].mic,'XETR');
 assert.equal(model.positions[0].eodhdSymbol,'5MVL.XETRA');
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const dims=await page.evaluate(()=>{
   const view=document.documentElement,root=document.querySelector('#providerOverview [data-position-id="etf-demo"]');
   const rect=root.getBoundingClientRect();
   return {scrollWidth:view.scrollWidth,left:rect.left,right:rect.right,viewport:innerWidth};
  });
  assert.ok(dims.scrollWidth<=width+1,'horizontal overflow at '+width+': '+JSON.stringify(dims));
  assert.ok(dims.left>=-1&&dims.right<=width+1,'ETF card escapes viewport at '+width+': '+JSON.stringify(dims));
 }
 console.log('ETF REFERENCE + NATIVE CSV ACTIONS: preserved holdings, deterministic Xetra identity, no vendor chart, and 7 responsive widths PASS');
}finally{await browser.close();}
