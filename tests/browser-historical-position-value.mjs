import assert from 'node:assert/strict';import {chromium,firefox,webkit} from 'playwright';
const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
for(const engine of (process.env.HISTORY_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[engine]).launch({headless:true,timeout:20000});
 try{const page=await browser.newPage({viewport:{width:390,height:900}});page.setDefaultTimeout(15000);await page.goto(base+'tests/');await page.addStyleTag({url:base+'styles.css'});
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createPosition}=await import('/src/model.js'),{executeTransaction}=await import('/src/transactions.js'),{createBookingHistoryUI}=await import('/src/booking-history-ui.js');
  const m=blankModel();m.providers.push(createProvider({id:'provider',name:'Synthetic',type:'broker'}));m.positions.push(createPosition({id:'etf',providerId:'provider',name:'Synthetic long ETF name for narrow mobile display and historical quantity checks',kind:'etf',quantity:0,price:100},m));executeTransaction(m,{positionId:'etf',date:'2023-01-02',type:'buy',quantity:2,unitPrice:100});executeTransaction(m,{positionId:'etf',date:'2023-01-04',type:'buy',quantity:3,unitPrice:110});m.priceHistories.etf={currency:'EUR',source:'CSV (selbst geprüft)',points:[{date:'2023-01-02',total:100},{date:'2023-01-03',total:105},{date:'2023-01-04',total:110}]};
  window.fixture=m;window.before=JSON.stringify(m);window.historyUI=createBookingHistoryUI({getModel:()=>m});window.historyUI.open('etf');
 });
 const d=page.locator('#bookingHistoryDialog');assert.equal(await d.locator('[data-booking-history="view"]').inputValue(),'eur');assert.equal(await d.locator('.chart-plot').count(),1);await d.locator('.chart-plot').focus();await d.locator('.chart-plot').press('ArrowLeft');assert.match(await d.locator('.chart-tooltip').innerText(),/210/);
 await d.locator('[data-booking-history="view"]').selectOption('price');assert.match(await d.innerText(),/Kurs \(EUR\)/);await d.locator('[data-booking-history="view"]').selectOption('events');assert.match(await d.innerText(),/Kauf/);await d.locator('[data-booking-history="view"]').selectOption('eur');
 for(const width of [320,390,430,768,1024,1440]){await page.setViewportSize({width,height:900});assert.equal(await d.evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'overflow '+width);}
 await page.evaluate(async()=>{const {loadPositionDetail}=await import('/src/position-detail-ui.js'),{escapeHTML,money,valueEUR}=await import('/src/model.js');const mount=document.createElement('section');mount.id='synthetic-mini-history';mount.innerHTML='<div class="position-history-plot"></div>';document.body.append(mount);await loadPositionDetail(window.fixture.positions[0],window.fixture,mount,{days:'max',esc:escapeHTML,money,quant:String,valueEUR,dateLabel:d=>d});});
 assert.match(await page.locator('#synthetic-mini-history').innerText(),/Historischer Positionswert/);
 const miniPoints=await page.locator('#synthetic-mini-history .chart-plot').getAttribute('data-chart-points');assert.match(miniPoints,/200/);assert.ok(!miniPoints.includes('500'));
 assert.equal(await page.evaluate(()=>JSON.stringify(window.fixture)===window.before),true);
 await page.addScriptTag({url:base+'node_modules/axe-core/axe.min.js'});assert.deepEqual(await page.evaluate(async()=> (await axe.run(document.getElementById('bookingHistoryDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
 console.log('HISTORICAL POSITION '+engine+': EUR default, historical quantity valuation, alternate views, six widths, no mutation and axe PASS');
 }finally{await browser.close();}
}
