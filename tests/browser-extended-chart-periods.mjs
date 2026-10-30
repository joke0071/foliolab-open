import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {mkdirSync} from 'node:fs';
const engine=process.env.UI_PERIOD_ENGINE||'chromium';
const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
const page=await browser.newPage({viewport:{width:390,height:850}});
mkdirSync('artifacts/gates/ui-visual01',{recursive:true});
const day=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 await page.evaluate(async(dates)=>{
  const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const m=blankModel(),provider=createProvider({name:'Synthetic ETF Portfolio'});m.providers.push(provider);
  m.settings.autoRefresh=false;
  const account=createAccount({name:'Testdepot',providerId:provider.id},m);m.accounts.push(account);
  const p=createPosition({id:'long-price',name:'Historic ETF',kind:'etf',symbol:'VWCE',currency:'EUR',
    quantity:2,price:100,providerId:provider.id,accountId:account.id},m);
  m.positions.push(p);
  m.priceHistories[p.id]={source:'CSV (selbst geprüft)',currency:'EUR',
   points:[{date:dates[0],total:50},{date:dates[1],total:80},{date:dates[2],total:95},{date:dates[3],total:100}]};
  const storage=new PortfolioStorage();await storage.initialize();await storage.save(m);storage.close();
 },[day(2200),day(1650),day(5),day(2)]);
 await page.reload();
 await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const provider=page.locator('#providerOverview .provider-accordion').first();
 await provider.locator(':scope > summary').click();
 const holding=page.locator('#providerOverview [data-position-id="long-price"]');
 await holding.locator(':scope > summary').click();
 await holding.locator('.position-history-chart .chart-plot').waitFor();
 const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const before=await record();
 assert.ok(before?.raw&&Number.isInteger(before.revision),'the fixture must have an actual canonical IndexedDB record');
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const overflowing=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflowing<=1,'Overflow at '+width+': '+overflowing);
  assert.equal(await holding.locator('.position-period').getAttribute('aria-label'),'Zeitraum des Kursverlaufs');
  const choices=holding.locator('.position-period button:visible');
  const labels=await choices.allTextContents();
  assert.ok(labels.includes('7 T')&&labels.includes('1 J'));
  if(width<=767){
   assert.deepEqual(labels,['7 T','1 M','3 M','6 M','1 J']);
   const more=holding.locator('.position-period-more > summary');
   assert.equal(await more.isVisible(),true);
   assert.equal(await more.innerText(),'Mehr');
   assert.match(await more.getAttribute('aria-label'),/Max/);
   await more.click();
   assert.deepEqual(await holding.locator('.position-period-popover button:visible').allTextContents(),['3 J','5 J','Max']);
   const rowTops=await holding.locator('.position-period > button:visible, .position-period-more > summary:visible').evaluateAll(els=>[...new Set(els.map(el=>Math.round(el.getBoundingClientRect().top)))]);
   assert.ok(rowTops.length<=2,'The compact mobile selector adapts to at most two rows at '+width+': '+rowTops);
   if(width>=390)assert.equal(rowTops.length,1,'All standard periods fit in one row at '+width);
  }else{
   assert.deepEqual(labels,['7 T','1 M','3 M','6 M','1 J','3 J','5 J','Max']);
   const rowTops=await choices.evaluateAll(els=>[...new Set(els.map(el=>Math.round(el.getBoundingClientRect().top)))]);
   assert.equal(rowTops.length,1,'All available periods stay in one desktop row at '+width);
  }
  const targets=await holding.locator('.position-period button:visible, .position-period-more > summary:visible').evaluateAll(els=>els.map(el=>{
   const r=el.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right};
  }));
  assert.ok(targets.length>0&&targets.every(r=>r.width>=44&&r.height>=44&&r.left>=0&&r.right<=width+1),
   'Visible period targets must be at least 44×44 and within the viewport at '+width+': '+JSON.stringify(targets));
  if(width<=767)await holding.locator('.position-period-more > summary').click();
 }
 await page.setViewportSize({width:390,height:850});
 const more=holding.locator('.position-period-more > summary');
 await more.focus();
 await page.keyboard.press('Enter');
 assert.equal(await holding.locator('.position-period-more').getAttribute('open'),'');
 const summaryFocus=await more.evaluate(el=>({visible:el.matches(':focus-visible'),width:getComputedStyle(el).outlineWidth}));
 assert.ok(summaryFocus.visible&&summaryFocus.width==='3px','Keyboard focus is visible on the expanded-range control');
 const threeYear=holding.locator('.position-period-popover [data-position-range="1096"]');
 await page.keyboard.press('Tab');
 const optionFocus=await threeYear.evaluate(el=>({focused:el===document.activeElement,visible:el.matches(':focus-visible'),width:getComputedStyle(el).outlineWidth}));
 assert.ok(optionFocus.focused&&optionFocus.visible&&optionFocus.width==='3px','Keyboard focus reaches the extended period with a visible outline');
 await page.keyboard.press('Enter');
 await holding.locator('.position-history-chart .chart-plot').waitFor();
 const threeYearPoints=JSON.parse(await holding.locator('.chart-plot').getAttribute('data-chart-points'));
 assert.equal(threeYearPoints.length,2,'three years retains only the two actual in-range observations');
 assert.match(threeYearPoints[0].value,/95,00/);assert.match(threeYearPoints[1].value,/100,00/);
 assert.match(await holding.innerText(),/Tatsächlich verfügbare Kurse/);
 assert.equal(await more.innerText(),'3 J','The selected extended period remains visible after closing the menu');
 assert.equal(await more.getAttribute('aria-label'),'Ausgewählter Zeitraum 3 J. Weitere Zeiträume auswählen');
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const visibleChoices=holding.locator('.position-period button:visible');
  if(width<=767){
   await holding.locator('.position-period-more > summary').click();
   const activeThreeYear=holding.locator('.position-period-popover [data-position-range="1096"]');
   assert.equal(await activeThreeYear.getAttribute('aria-pressed'),'true');
   assert.equal(await holding.locator('.position-period-popover button:visible').count(),2);
  }else{
   const labels=await visibleChoices.allTextContents();
   assert.deepEqual(labels,['7 T','1 M','3 M','6 M','1 J','3 J','5 J','Max']);
   assert.equal(await holding.locator('.position-period [data-position-range="1096"]:visible').getAttribute('aria-pressed'),'true');
  }
  const overflowing=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflowing<=1,'Overflow after extended selection at '+width+': '+overflowing);
  const targets=await holding.locator('.position-period button:visible, .position-period-more > summary:visible').evaluateAll(els=>els.map(el=>{
   const r=el.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right};
  }));
  assert.ok(targets.every(r=>r.width>=44&&r.height>=44&&r.left>=0&&r.right<=width+1),
   'Selected period targets must be at least 44×44 and within the viewport at '+width+': '+JSON.stringify(targets));
  await holding.locator('.position-period').scrollIntoViewIfNeeded();
  await page.screenshot({path:'artifacts/gates/ui-visual01/'+engine+'-emulated-'+width+'.png'});
  if(width<=767)await holding.locator('.position-period-more > summary').click();
 }
 await page.setViewportSize({width:390,height:850});
 await holding.locator('.position-period-more > summary').click();
 const fiveYear=holding.locator('.position-period-popover [data-position-range="1826"]');
 await fiveYear.click();
 await holding.locator('.position-history-chart .chart-plot').waitFor();
 assert.match(await holding.innerText(),/Tatsächlich verfügbare Kurse/);
 assert.equal(await fiveYear.getAttribute('aria-pressed'),'true');
 assert.equal(await holding.locator('.position-period-more > summary').innerText(),'5 J');
 assert.equal(await holding.locator('.position-period-more > summary').getAttribute('aria-label'),'Ausgewählter Zeitraum 5 J. Weitere Zeiträume auswählen');
 assert.equal(JSON.parse(await holding.locator('.chart-plot').getAttribute('data-chart-points')).length,3);
 await holding.locator('.position-period-more > summary').click();
 const max=holding.locator('.position-period-popover [data-position-range="max"]');
 await max.click();
 await holding.locator('.position-history-chart .chart-plot').waitFor();
 assert.equal(await max.getAttribute('aria-pressed'),'true');
 assert.equal(JSON.parse(await holding.locator('.chart-plot').getAttribute('data-chart-points')).length,4);
 assert.match(await holding.innerText(),/Fehlende frühere Kurse werden nicht ergänzt/);
 assert.equal(JSON.parse((await record()).raw).priceHistories['long-price'].points.length,4);
 assert.deepEqual(await record(),before,'period changes preserve exact IndexedDB record/settings/revision');
 console.log(engine+': EXTENDED CHART PERIODS: reachable3Y/5Y/Max, actual in-range values/coverage, mobile menu,320-1440px,exact IndexedDB preservation PASS');
}finally{await browser.close();}
