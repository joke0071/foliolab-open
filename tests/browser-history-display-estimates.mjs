import assert from 'node:assert/strict';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';

export function seedHistoryEstimate(page){
 return page.evaluate(async()=>{
  const {blankModel,createPosition,createProvider}=await import('/src/model.js');
  const {captureOpenings}=await import('/src/transactions.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const model=blankModel();model.settings.autoRefresh=false;
  model.providers.push(createProvider({id:'p',name:'Synthetischer Anbieter',type:'broker'}));
  for(const [id,quantity] of [['A',2],['B',3]])model.positions.push(createPosition({id,kind:'etf',quantity,price:1,name:id,providerId:'p'},model));
  captureOpenings(model);
  const days=['2023-01-02','2023-01-03','2023-01-04'];
  for(const opening of model.openingPositions)opening.asOf=days[0];
  const history=totals=>({source:'CSV (selbst geprüft)',currency:'EUR',points:totals.flatMap((total,i)=>total===null?[]:[{date:days[i],total}])});
  model.priceHistories.A=history([10,null,16]);
  model.priceHistories.B=history([4,4,4]);
  const storage=new PortfolioStorage();await storage.initialize();await storage.save(model);storage.close();
 });
}

export async function verifyHistoryEstimate(page,{scan=async()=>{}}={}){
 const chart=page.locator('#historyChart .chart-plot'),menu=page.locator('#chartPeriods .history-period-options>summary');
 const checkbox=page.locator('#historyEstimates'),estimate=chart.locator('path[stroke="#637089"]');
 const values=()=>chart.evaluate(el=>JSON.parse(el.dataset.chartPoints).map(p=>p.value));
 const evidencePath=chart.locator('path[stroke="#3b8659"]');
 assert.match(await page.locator('#historySourceStatus').innerText(),/Rekonstruiert aus belegten/);
 assert.equal(await estimate.count(),0);
 const exactValues=await values();
 assert.deepEqual(exactValues.map(value=>value.match(/[\d.]+,\d{2}/)?.[0]),['32,00','44,00']);
 assert.deepEqual((await evidencePath.getAttribute('d')).match(/[ML]/g),['M','M']);
 await menu.press('Enter');
 await checkbox.check();
 assert.equal(await estimate.getAttribute('stroke-dasharray'),'5 4');
 assert.deepEqual((await evidencePath.getAttribute('d')).match(/[ML]/g),['M','M']);
 const displayed=await values();
 assert.deepEqual([displayed[0],displayed[2]],exactValues);
 assert.match(displayed[1],/^≈.*38,00/);
 assert.match(await page.locator('#historyEstimateNote').innerText(),/Gestrichelte Abschnitte/);
 await page.locator('#historyChartStyle').selectOption('points');
 assert.equal(await estimate.count(),0);
 assert.equal(await chart.locator('circle[stroke="#637089"]').count(),1);
 assert.match(await page.locator('#historyEstimateNote').innerText(),/Hohle Punkte/);
 await scan();
 await checkbox.press('Escape');
 assert.equal(await menu.evaluate(el=>document.activeElement===el),true);
 await chart.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
 assert.match(await chart.locator('.chart-tooltip').innerText(),/Grafisch geschätzt/);
 return exactValues;
}

export async function historyEstimateBrowserContract({browser,base,axe}){
 const context=await browser.newContext({viewport:{width:390,height:900}});
 try{
  await context.addInitScript({content:axe});
  const page=await context.newPage();
  const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const record=()=>page.evaluate(async()=>{
   const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
   const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}
  });
  await page.goto(base+'?page=history');await controlledStorageFixture(page,ready,record);
  await seedHistoryEstimate(page);
  const before=await record();
  await context.setOffline(true);await page.reload();await ready();
  await verifyHistoryEstimate(page,{scan:async()=>{
   const violations=await page.locator('#chartPeriods').evaluate(async el=>(await axe.run(el,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id));
   assert.deepEqual(violations,[]);
  }});
  await page.reload();await ready();
  assert.equal(await page.locator('#historyEstimateNote').isVisible(),false);
  assert.equal(await page.evaluate(()=>navigator.serviceWorker.controller?.state),'activated');
  assert.deepEqual(await record(),before);
  console.log(browser.browserType().name()+': opt-in estimated overlay, independent 32/38/44 EUR, dashed/point/keyboard, offline and exact unchanged IDB PASS');
 }finally{await context.close();}
}
