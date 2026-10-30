import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync} from 'node:fs';
const axeScript=readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'),'utf8');
const engine=process.env.UI_PERIOD_ENGINE||'chromium';
const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
const page=await browser.newPage({viewport:{width:390,height:850}});
mkdirSync('artifacts/gates/ui-visual01',{recursive:true});
const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
const labels=['7 T','1 M','3 M','6 M','1 J','3 J','5 J','Max'];
const checkAxe=async(root,width,state)=>{
 const violations=await root.evaluate(async el=>(await window.axe.run(el,{
  runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}
 })).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
 assert.deepEqual(violations,[],'Axe period-control violations at '+width+'px ('+state+')');
};
const verifyTargets=async(root,width)=>{
 if(width>720){
  assert.deepEqual(await root.locator('button:visible').allTextContents(),labels);
  assert.equal(await root.locator('.period-more > summary').isVisible(),false);
  const rows=await root.locator('button:visible').evaluateAll(nodes=>new Set(nodes.map(el=>Math.round(el.getBoundingClientRect().top))).size);
  assert.equal(rows,1,'All wealth periods must stay inline at '+width);
  await checkAxe(root,width,'desktop');
  return;
 }
 const narrow=width<=374;
 assert.deepEqual(await root.locator('button:visible').allTextContents(),narrow?
  ['7 T','1 M','3 M','6 M','Max']:['7 T','1 M','3 M','6 M','1 J','Max']);
 const targets=root.locator('button:visible, .period-more > summary:visible');
 const rects=await targets.evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top};}));
 assert.equal(rects.length,narrow?6:7,'inline options and the More disclosure remain reachable');
 assert.ok(rects.every(r=>r.width>=44&&r.height>=44),'Touch targets below 44px at '+width+': '+JSON.stringify(rects));
 assert.equal(new Set(rects.map(r=>Math.round(r.top))).size,1,'Adaptive period row at '+width);
 await checkAxe(root,width,'disclosure closed');
 const summary=root.locator('.period-more > summary');
 await summary.click();
 await checkAxe(root,width,'disclosure open');
 const extra=root.locator('.period-more-list button:visible');
 assert.deepEqual(await extra.allTextContents(),narrow?['1 J','3 J','5 J']:['3 J','5 J']);
 const extraRects=await extra.evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return [r.width,r.height];}));
 assert.ok(extraRects.every(([w,h])=>w>=44&&h>=44),'Disclosure targets below 44px at '+width+': '+JSON.stringify(extraRects));
 await summary.click();
 if(narrow){
  const transition=await root.evaluate(async root=>{
   const more=root.querySelector('.period-more'),year=more.querySelector('button[data-range="year"],button[data-mini-range="year"]');
   // Reproduce the real pre-handler DOM immediately after a wide-to-narrow resize.
   root.insertBefore(year,more);
   const result={hidden:getComputedStyle(year).display==='none',scroll:document.documentElement.scrollWidth,viewport:innerWidth};
   const {layoutPeriodMore}=await import('/src/chart-periods.js');layoutPeriodMore();
   return {...result,restored:year.parentElement===more.querySelector('.period-more-list')};
  });
  assert.ok(transition.hidden&&transition.restored,'1 J stays bounded before resize handling and remains available in More at '+width);
  assert.ok(transition.scroll<=transition.viewport+1,'no transient page overflow before the resize handler at '+width);
 }
};
try{
 await page.route('**/__visual01_axe.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:axeScript}));
 await page.goto('http://127.0.0.1:4173/');
 await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 await page.evaluate(async()=>{
  const {blankModel}=await import('/src/model.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const model=blankModel();
  model.settings.autoRefresh=false;
  const iso=days=>new Date(Date.now()-days*864e5).toISOString().slice(0,10);
  model.snapshots=[
   {id:'before',date:iso(2200),total:1000},
   {id:'long',date:iso(1650),total:1050},
   {id:'middle',date:iso(120),total:1075},
   {id:'within',date:iso(8),total:1100},
   {id:'current',date:iso(1),total:1200}
  ];
  const storage=new PortfolioStorage();await storage.initialize();await storage.save(model);storage.close();
 });
 await page.reload();
 await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const before=await record();
 assert.ok(before?.raw&&Number.isInteger(before.revision),'the fixture must have an actual canonical IndexedDB record');
 await page.addScriptTag({url:'http://127.0.0.1:4173/__visual01_axe.js'});
 const mini=page.locator('#miniChartPeriods');
 assert.deepEqual(await mini.locator('button').allTextContents(),labels);
 assert.equal(await mini.locator('[aria-pressed="true"]').count(),1);
 assert.ok(await mini.locator('[data-mini-range="week"]').isDisabled(),'one recent observation cannot fabricate a weekly curve');
 await mini.locator('[data-mini-range="month"]').click();
 assert.equal(await mini.locator('[data-mini-range="month"]').getAttribute('aria-pressed'),'true');
 const monthPoints=await page.locator('#miniChart [data-chart-points]').getAttribute('data-chart-points');
 assert.equal(JSON.parse(monthPoints).length,2);
 for(const width of [320,360,390,430,767,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  await page.locator('#mobileNav [data-page="dashboard"]:visible, #sidebarNav [data-page="dashboard"]:visible').click();
  await verifyTargets(mini,width);
  await mini.screenshot({path:'artifacts/gates/ui-visual01/'+engine+'-wealth-dashboard-'+width+'.png'});
  if(width===390){
   const more=mini.locator('.period-more > summary');
   await more.focus();await page.keyboard.press('Enter');
   assert.equal(await mini.locator('.period-more').evaluate(el=>el.open),true);
   await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-mini-range')),'threeYears');
   await page.keyboard.press('Escape');
   assert.equal(await mini.locator('.period-more').evaluate(el=>el.open),false,'Escape closes the expanded period list');
   assert.equal(await more.evaluate(el=>document.activeElement===el),true,'Escape restores focus to the disclosure');
   await page.keyboard.press('Enter');await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-mini-range')),'threeYears');
   await page.keyboard.press('Shift+Tab');
   assert.equal(await more.evaluate(el=>el.matches(':focus-visible')),true);
   await page.keyboard.press('Tab');
   await page.keyboard.press('Enter');
   assert.equal(await more.innerText(),'3 J');
   assert.match(await more.getAttribute('aria-label'),/3 J ausgewählt/);
   assert.equal(await mini.locator('[data-mini-range="threeYears"]').getAttribute('aria-pressed'),'true');
   assert.equal(JSON.parse(await page.locator('#miniChart [data-chart-points]').getAttribute('data-chart-points')).length,3);
  }
  await page.locator('#mobileNav [data-page="history"]:visible, #sidebarNav [data-page="history"]:visible').click();
  const history=page.locator('#chartPeriods');
  assert.deepEqual(await history.locator('button').allTextContents(),['7 T','1 M','3 M','6 M','1 J','3 J','5 J','Max']);
  assert.equal(await history.locator('[aria-pressed="true"]').count(),1);
  assert.ok(await history.locator('[data-range="week"]').isDisabled(),'same sparse weekly coverage in both views');
  const layout=await page.locator('#historyPage .history-controls').evaluate(el=>{
   const controls=el.getBoundingClientRect();
   const actions=el.querySelector('.history-actions').getBoundingClientRect();
   const periods=el.querySelector('.history-chart-period').getBoundingClientRect();
   return {controlsRight:controls.right,actionsRight:actions.right,actionLeft:actions.left,periodRight:periods.right,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  assert.ok(Math.abs(layout.controlsRight-layout.actionsRight)<2,'History buttons not aligned right at '+width+': '+JSON.stringify(layout));
  assert.ok(layout.overflow<=1,'Horizontal overflow at '+width+': '+JSON.stringify(layout));
  assert.ok(layout.actionLeft>0,'Actions clipped at '+width);
  await verifyTargets(history,width);
  if(width===390){
   const more=history.locator('.period-more > summary');
   await more.click();
   await history.locator('[data-range="fiveYears"]').click();
   assert.equal(await more.innerText(),'5 J');
   assert.match(await more.getAttribute('aria-label'),/5 J ausgewählt/);
   assert.equal(await history.locator('[data-range="fiveYears"]').getAttribute('aria-pressed'),'true');
   assert.equal(JSON.parse(await page.locator('#historyChart [data-chart-points]').getAttribute('data-chart-points')).length,4);
  }
  await history.screenshot({path:'artifacts/gates/ui-visual01/'+engine+'-wealth-history-'+width+'.png'});
 }
 await page.locator('#chartPeriods [data-range="month"]').click();
 assert.equal(await page.locator('#chartPeriods [data-range="month"]').getAttribute('aria-pressed'),'true');
 assert.equal(JSON.parse(await page.locator('#historyChart [data-chart-points]').getAttribute('data-chart-points')).length,2);
 assert.equal(await page.locator('#historyPage #historyCalendarDisclosure').count(),1);
 assert.equal(await page.locator('#historyPage #addSnapshot').count(),1);
 assert.deepEqual(await page.evaluate(async()=>{
  const {renderChartPeriodButtons}=await import('/src/chart-periods.js');
  const html=renderChartPeriodButtons('market','data-position-range',30);
  const element=document.createElement('div');element.innerHTML=html;
  return [...element.querySelectorAll('button')].map(button=>({
   label:button.textContent,pressed:button.getAttribute('aria-pressed'),
   range:button.dataset.positionRange
  }));
 }),[
  {label:'7 T',pressed:'false',range:'7'},
  {label:'1 M',pressed:'true',range:'30'},
  {label:'3 M',pressed:'false',range:'90'},
  {label:'6 M',pressed:'false',range:'180'},
  {label:'1 J',pressed:'false',range:'365'}
 ]);
 assert.deepEqual(await record(),before,'period selection, responsive relocation and keyboard preserve the entire raw/settings/revision record');
 console.log(engine+': CHART PERIOD CONSISTENCY: filtering, 44px targets, keyboard/Escape/focus, Axe, active 3/5-year disclosure, 320–1440px, exact IDB preservation and retained screenshots PASS');
}finally{await browser.close();}
