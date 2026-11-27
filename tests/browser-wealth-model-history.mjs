import assert from 'node:assert/strict';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';

export function seedWealthModelHistory(page){
 return page.evaluate(async()=>{
   const {blankModel,createProvider,createPosition,snapshot}=await import('/src/model.js');
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const model=blankModel();model.settings.autoRefresh=false;
   model.providers.push(createProvider({id:'p',name:'Synthetischer Anbieter',type:'broker'}));
   const position=(id,kind,quantity)=>createPosition({id,kind,quantity,price:1,name:id,providerId:'p'},model);
   model.positions.push(position('ETF','etf',2),position('Krypto','crypto',0.5),position('EUR','cash',40));
   const days=['2023-01-02','2023-01-03','2023-01-04','2023-01-05','2023-01-06'];
   const history=totals=>({source:'CSV (selbst geprüft)',currency:'EUR',points:totals.flatMap((total,i)=>total===null?[]:[{date:days[i],total}])});
   model.priceHistories.ETF=history([10,12,null,14,16]);
   model.priceHistories.Krypto=history([20,30,35,40,50]);
   snapshot(model,days[0],'Synthetischer Stichtag',{manualTotalEUR:'999'});
   snapshot(model,days[4],'Synthetischer Stichtag',{manualTotalEUR:'1099'});
   const storage=new PortfolioStorage();await storage.initialize();await storage.save(model);storage.close();
 });
}

export async function wealthModelHistoryBrowserContract({browser,base,axe}){
 const context=await browser.newContext({viewport:{width:390,height:900},hasTouch:true});
 try{
  await context.addInitScript({content:axe});
  const page=await context.newPage(),errors=[],externalRequests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(new URL(request.url()).origin!==new URL(base).origin)externalRequests.push(request.url());});
  const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const record=()=>page.evaluate(async()=>{
   const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
   const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}
  });
  await page.goto(base);
  await controlledStorageFixture(page,ready,record);
  await seedWealthModelHistory(page);
  await page.reload();await ready();
  const before=await record();
  const dashboardStatus=await page.locator('#miniHistoryStatus').innerText();
  const buttons=key=>page.locator(`#mobileNav [data-page="${key}"]:visible,#sidebarNav [data-page="${key}"]:visible`);
  await buttons('history').tap();
  const source=page.locator('#historySourceStatus'),plot=page.locator('#historyChart .chart-plot');
  const points=()=>plot.evaluate(el=>JSON.parse(el.dataset.chartPoints));
  assert.match(await source.innerText(),/Erfasste Stichtage/);
  assert.deepEqual((await points()).map(x=>x.value.match(/[\d.]+,\d{2}/)?.[0]),['999,00','1.099,00']);
  const menu=page.locator('#chartPeriods .history-period-options>summary');
  const basis=page.locator('#historyBasis'),style=page.locator('#historyChartStyle');
  const path=plot.locator('path[stroke="#3b8659"]');
  await menu.focus();await page.keyboard.press('Enter');
  await basis.selectOption('model');
  assert.match(await source.innerText(),/heutige Stückzahlen angenommen · keine persönliche Rendite/);
  assert.match(await page.locator('#historyModelNote').innerText(),/historischer Kurs/);
  assert.deepEqual((await points()).map(x=>x.value.match(/[\d.]+,\d{2}/)?.[0]),['70,00','79,00','88,00','97,00']);
  assert.deepEqual((await path.getAttribute('d')).match(/[ML]/g),['M','L','M','L']);
  await style.selectOption('points');
  assert.equal(await path.count(),0);
  const markers=plot.locator('.series-observation');
  assert.equal(await markers.count(),4,'each observed date has its own marker');
  assert.ok(await markers.evaluateAll(nodes=>nodes.every(node=>{
   const style=getComputedStyle(node);
   return style.strokeLinecap==='round'&&style.vectorEffect==='non-scaling-stroke'&&parseFloat(style.strokeWidth)>=5;
  })),'markers stay round and legible on narrow charts');
  await style.selectOption('line');
  assert.deepEqual((await path.getAttribute('d')).match(/[ML]/g),['M','L','M','L']);
  await page.keyboard.press('Escape');
  assert.equal(await menu.evaluate(el=>document.activeElement===el),true);
  assert.equal(await basis.isVisible(),false);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   await menu.tap();
   const fits=await basis.evaluate(el=>{
    const panel=el.closest('.history-options-popover').getBoundingClientRect();
    return panel.x>=0&&panel.right<=innerWidth&&el.getBoundingClientRect().height>=44;
   });
   assert.ok(fits,'available controls fit at '+width);
   assert.equal(await basis.count(),1);
   const violations=await page.locator('#chartPeriods').evaluate(async el=>(await axe.run(el,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id));
   assert.deepEqual(violations,[]);
   await page.keyboard.press('Escape');
  }
  await buttons('dashboard').tap();
  assert.equal(await page.locator('#miniHistoryStatus').innerText(),dashboardStatus);
  await buttons('history').tap();
  await context.setOffline(true);await page.reload();await ready();
  assert.equal(await page.evaluate(()=>navigator.onLine),false);
  assert.equal(await page.evaluate(()=>navigator.serviceWorker.controller?.state),'activated');
  assert.match(await source.innerText(),/Modellverlauf/);
  await menu.tap();await basis.selectOption('observed');await page.keyboard.press('Escape');
  assert.match(await source.innerText(),/gespeicherte Referenzwerte/);
  assert.deepEqual(await record(),before);
  assert.deepEqual(errors,[]);
  assert.deepEqual(externalRequests,[]);
  console.log(browser.browserType().name()+': model history exact four values, intentional gap, display controls, 4 widths, Axe, keyboard, offline reload and unchanged IndexedDB PASS');
 }finally{await context.close();}
}
