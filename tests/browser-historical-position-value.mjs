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
 const reuse=await page.evaluate(async()=>{
  const {historicalQuantityRows,projectHistoricalPosition}=await import('/src/historical-position-value.js'),{executeTransaction}=await import('/src/transactions.js');
  const m=structuredClone(window.fixture),before=JSON.stringify(m),baseline=projectHistoricalPosition(m,'etf'),invalid=['1900-02-29','2023-02-29','2024-02-30','2024-13-01','2024-01-01T00:00:00Z',null,20240101];
  const rejected=()=>invalid.map(date=>{try{historicalQuantityRows(m,'etf',[date]);return false;}catch(error){return error.message==='Ungültiger Bewertungstag.';}});
  const firstRejected=rejected(),leap=historicalQuantityRows(m,'etf',['2024-02-29'])[0].quantityExact;
  const dates=Array.from({length:16410},(_,i)=>new Date(Date.UTC(1970,0,1+i)).toISOString().slice(0,10));historicalQuantityRows(m,'etf',dates);
  const secondRejected=rejected(),same=JSON.stringify(projectHistoricalPosition(m,'etf'))===JSON.stringify(baseline);
  let priceRejected=false,fxRejected=false;
  try{projectHistoricalPosition(m,'etf',{marketHistory:{currency:'EUR',points:[{date:'2023-01-02',total:0}]}});}catch(error){priceRejected=error.message==='Historischer Kurs ungültig.';}
  const usd=structuredClone(m);usd.positions[0].currency='USD';
  try{projectHistoricalPosition(usd,'etf',{marketHistory:{currency:'USD',points:[{date:'2023-01-02',total:100}]},fxPoints:[{date:'2023-01-02',currency:'USD',source:'Frankfurter',rate:'0'}]});}catch(error){fxRejected=error.message==='Historischer FX-Nachweis ungültig.';}
  const unchanged=JSON.stringify(m)===before;executeTransaction(m,{positionId:'etf',type:'correction',date:'2023-01-04',targetQuantity:'7'});
  const fresh=projectHistoricalPosition(m,'etf').rows.at(-1);
  return {firstRejected,secondRejected,leap,same,priceRejected,fxRejected,unchanged,freshQuantity:fresh.quantityExact,freshValue:fresh.valueEURExact};
 });
 assert.deepEqual(reuse,{firstRejected:Array(7).fill(true),secondRejected:Array(7).fill(true),leap:'5',same:true,priceRejected:true,fxRejected:true,unchanged:true,freshQuantity:'7',freshValue:'770'});
 assert.equal(await page.evaluate(()=>JSON.stringify(window.fixture)===window.before),true);
 console.log(engine+': historical date reuse,16410day pressure,strict calendar/price/FX guards,fresh correction and zero model writes PASS');
 await page.addScriptTag({url:base+'node_modules/axe-core/axe.min.js'});assert.deepEqual(await page.evaluate(async()=> (await axe.run(document.getElementById('bookingHistoryDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
 // A local USD CSV can acquire dated FX without any security-provider key.
 await page.keyboard.press('Escape');await d.evaluate(e=>e.remove());let fxRequests=0;await page.route('https://api.frankfurter.dev/**',route=>{fxRequests++;return route.fulfill({json:{base:'USD',rates:{'2023-01-02':{EUR:0.9},'2023-01-03':{EUR:0.8}}}});});
 await page.evaluate(async()=>{const {blankModel,createProvider,createPosition}=await import('/src/model.js'),{createBookingHistoryUI}=await import('/src/booking-history-ui.js');const {captureOpenings}=await import('/src/transactions.js');let m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic',type:'broker'}));m.positions.push(createPosition({id:'usd',providerId:'p',name:'Synthetic USD',kind:'etf',currency:'USD',quantity:2,price:100},m));captureOpenings(m);m.openingPositions.find(o=>o.positionId==='usd').asOf='2023-01-02';m.priceHistories.usd={currency:'USD',source:'CSV (selbst geprüft)',points:[{date:'2023-01-02',total:100},{date:'2023-01-03',total:105}]};window.usdBefore=JSON.stringify([m.positions,m.bookings,m.journalEntries,m.openingPositions]);window.usdModel=m;createBookingHistoryUI({getModel:()=>m,commit:async next=>{m=next;window.usdModel=m;}}).open('usd');});
 const usd=page.locator('#bookingHistoryDialog');assert.match(await usd.locator('[data-booking-history="load"]').innerText(),/EUR-Wechselkurse/);assert.match(await usd.innerText(),/Wechselkurs fehlt/);await usd.locator('[data-booking-history="load"]').click();await page.waitForFunction(()=>document.querySelector('[data-booking-history="load-status"]').textContent.includes('EUR-Wechselkurse lokal gespeichert'));assert.equal(fxRequests,1);assert.match(await usd.innerText(),/180/);assert.match(await usd.innerText(),/168/);assert.equal(await page.evaluate(()=>JSON.stringify([window.usdModel.positions,window.usdModel.bookings,window.usdModel.journalEntries,window.usdModel.openingPositions])===window.usdBefore),true);
 await page.evaluate(async()=>{const {loadPositionDetail}=await import('/src/position-detail-ui.js'),{escapeHTML,money,valueEUR}=await import('/src/model.js');const mount=document.createElement('section');mount.id='usd-mini';mount.innerHTML='<div class="position-history-plot"></div>';document.body.append(mount);await loadPositionDetail(window.usdModel.positions[0],window.usdModel,mount,{days:'max',esc:escapeHTML,money,quant:String,valueEUR,dateLabel:d=>d});});assert.match(await page.locator('#usd-mini').innerText(),/Historischer Positionswert/);assert.match(await page.locator('#usd-mini .chart-plot').getAttribute('data-chart-points'),/180/);
 console.log('HISTORICAL POSITION '+engine+': EUR default, historical quantity valuation, alternate views, six widths, no mutation and axe PASS');
 }finally{await browser.close();}
}
