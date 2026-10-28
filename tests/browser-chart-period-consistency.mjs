import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,persist}=await import('/src/model.js');
  const model=blankModel();
  const iso=days=>new Date(Date.now()-days*864e5).toISOString().slice(0,10);
  model.snapshots=[
   {id:'before',date:iso(120),total:1000},
   {id:'within',date:iso(8),total:1100},
   {id:'current',date:iso(1),total:1200}
  ];
  persist(model);
 });
 await page.reload();
 const mini=page.locator('#miniChartPeriods');
 assert.deepEqual(await mini.locator('button').allTextContents(),['7 T','1 M','3 M','6 M','1 J','3 J','5 J','Max']);
 assert.equal(await mini.locator('[aria-pressed="true"]').count(),1);
 assert.ok(await mini.locator('[data-mini-range="week"]').isDisabled(),'one recent observation cannot fabricate a weekly curve');
 await mini.locator('[data-mini-range="month"]').click();
 assert.equal(await mini.locator('[data-mini-range="month"]').getAttribute('aria-pressed'),'true');
 const monthPoints=await page.locator('#miniChart [data-chart-points]').getAttribute('data-chart-points');
 assert.equal(JSON.parse(monthPoints).length,2);
 for(const width of [320,360,390,430,767,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
  await page.locator(nav+' [data-page="history"]').click();
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
 console.log('CHART PERIOD CONSISTENCY: shared presets, period logic, right-alignment and 320–1440px PASS');
}finally{await browser.close();}
