import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
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
 assert.equal(await detail.locator('[data-action="load-tradingview"]').isVisible(),false,'External chart must start collapsed');
 assert.match(await detail.locator('.position-history-unavailable').innerText(),/Kein nativer Kursverlauf/);
 await detail.locator('.position-chart-options>summary').click();
 await detail.locator('[data-action="load-tradingview"]').waitFor({state:'visible'});
 assert.match(await detail.innerText(),/Öffentliches Diagramm laden/);
 assert.equal(await detail.locator('[data-position-range]').count(),0,'TradingView has its own chart ranges');
 await page.route('https://s.tradingview.com/widgetembed/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated public chart</title>'}));
 await detail.locator('[data-action="load-tradingview"]').click();
 const frame=detail.locator('iframe[src*="s.tradingview.com/widgetembed/"]');
 await frame.waitFor({state:'attached'});
 const url=new URL(await frame.getAttribute('src'));
 assert.equal(url.searchParams.get('symbol'),'XETR:5MVL');
 assert.equal(url.searchParams.get('interval'),'D');
 assert.equal(url.searchParams.get('symboledit'),'0');
 assert.match(await frame.getAttribute('sandbox'),/allow-scripts/);
 assert.equal(await detail.locator('script[src*="tradingview"]').count(),0,'External scripts must never run in FolioLab origin');
 const model=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(model.positions[0].isin,'IE00BG0SKF03');
 assert.equal(model.positions[0].quantityExact,'228.652303');
 assert.equal(model.positions[0].priceExact,'86.18999127246927');
 assert.equal(model.positions[0].mic,'XETR');
 assert.equal(model.positions[0].eodhdSymbol,'5MVL.XETRA');
 await frame.waitFor({state:'attached'});
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const dims=await page.evaluate(()=>{
   const slot=document.querySelector('.public-chart .tradingview-widget-container');
   const rect=slot.getBoundingClientRect(),parent=slot.closest('.public-chart').getBoundingClientRect();
   return {scrollWidth:document.documentElement.scrollWidth,height:rect.height,left:rect.left,right:rect.right,parentLeft:parent.left,parentRight:parent.right};
  });
  assert.ok(dims.scrollWidth<=width+1,'horizontal overflow at '+width+': '+JSON.stringify(dims));
  assert.ok(dims.height>=360,'clipped TradingView chart at '+width+': '+JSON.stringify(dims));
  assert.ok(dims.left>=dims.parentLeft-1&&dims.right<=dims.parentRight+1,'chart escapes card '+width);
 }
 console.log('ETF REFERENCE + TRADINGVIEW ADVANCED CHART: preserved holdings, deterministic Xetra identity and 7 responsive widths PASS');
}finally{await browser.close();}
