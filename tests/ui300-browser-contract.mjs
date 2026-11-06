import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
/** Presentation contract shared with the existing mandatory delivered UI suite. */
export async function ui300BrowserContract({p,nav,record,scan,engine,scans}){
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const dates=await p.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,snapshot}=await import('/src/model.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'ui300-p',name:'SYNTHETIC UI300'}));m.accounts.push(createAccount({id:'ui300-a',providerId:'ui300-p',name:'SYNTHETIC Account',type:'checking'},m));
  m.positions.push(createPosition({id:'ui300-cash',providerId:'ui300-p',accountId:'ui300-a',kind:'cash',name:'SYNTHETIC Cash',quantity:130,price:1},m));
  const dates=[40,3,0].map(offset=>new Date(Date.now()-offset*864e5).toISOString().slice(0,10));
  for(const [i,total] of ['100','120','130'].entries())snapshot(m,dates[i],'SYNTHETIC manual reference',{manualTotalEUR:total});
  const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();return dates;
 });
 await p.reload();await ready();await nav('dashboard');const before=await record();
 const out='artifacts/gates/ui300';await mkdir(out,{recursive:true});
 for(const width of [320,360,390,412,430,768,1440]){
  await p.setViewportSize({width,height:800});await nav('dashboard');
  assert.equal(await p.locator('.hero,#summaryStats,.logo img').count(),0);
  assert.equal(await p.locator('#dashboardReview').isVisible(),false,'zero review groups means no chip');
  assert.equal(await p.locator('#pageKicker').isVisible(),false);
  await p.locator('#miniChartPeriods [data-mini-range=all]').click();
  assert.match(await p.locator('#totalValue').innerText(),/130,00/);
  assert.match(await p.locator('#dashboardChange').innerText(),/\+.*30,00/,'whole selected period, not last two observations');
  const label=day=>new Intl.DateTimeFormat('de-AT',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));
  assert.equal(await p.locator('#dashboardChangeHint').innerText(),label(dates[0])+' – '+label(dates[2])+' · inkl. Geldflüsse · keine Rendite');
  await p.locator('#miniChartPeriods [data-mini-range=week]').click();
  assert.match(await p.locator('#dashboardChange').innerText(),/\+.*10,00/);
  assert.equal(await p.locator('#dashboardChangeHint').innerText(),label(dates[1])+' – '+label(dates[2])+' · inkl. Geldflüsse · keine Rendite');
  const menu=p.locator(width<=720?'#mobileNav':'#sidebarNav');assert.equal(await menu.locator('button').count(),5);
  assert.equal(await menu.locator('[aria-current=page]').count(),1);
  assert.equal(await menu.locator('button').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().height>=44)),true);
  if(width<=720){
   assert.equal(await menu.evaluate(el=>parseFloat(getComputedStyle(el).borderTopWidth)),0);
   assert.equal(await menu.locator('.active').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
   await menu.locator('[data-page=history]').focus();await p.keyboard.press('Enter');assert.ok(await p.locator('#historyPage').isVisible());await nav('dashboard');
  }
  await scan('UI300 compact dashboard/navigation '+width);scans.push({page:'UI300',width,height:800});
  await p.screenshot({path:`${out}/${engine}-${width}.png`,fullPage:true});
 }
 await p.setViewportSize({width:390,height:400});
 // Engine-independent 200% text stress, plus the mandatory 320px reflow above.
 await p.evaluate(()=>{document.getElementById('dashboardPage').style.fontSize='200%';for(const e of document.querySelectorAll('.dashboard-metrics strong,.dashboard-metric-label,.dashboard-metrics .small-help'))e.style.fontSize=(parseFloat(getComputedStyle(e).fontSize)*2)+'px';});
 await scan('UI300 200% text/short viewport');await p.screenshot({path:`${out}/${engine}-text200-short.png`,fullPage:true});
 await p.evaluate(()=>{document.getElementById('dashboardPage').style.removeProperty('font-size');for(const e of document.querySelectorAll('.dashboard-metrics strong,.dashboard-metric-label,.dashboard-metrics .small-help'))e.style.removeProperty('font-size');});
 await nav('more');assert.equal(await p.locator('#pageKicker').isVisible(),false);
 await nav('dashboard');await p.context().setOffline(true);await p.reload();await ready();assert.match(await p.locator('#totalValue').innerText(),/130,00/);await p.context().setOffline(false);
 assert.deepEqual(await record(),before,'period, navigation, reflow, keyboard and offline reload preserve exact canonical bytes and revision');
 await p.setViewportSize({width:390,height:900});
 // A real automatic snapshot from an undated quote is already partial. The
 // new compact difference must retain that uncertainty, never turn it into loss.
 await p.evaluate(async()=>{
  const {createPosition,snapshot}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();
  m.positions.push(createPosition({id:'ui300-undated',providerId:'ui300-p',accountId:'ui300-a',kind:'etf',name:'SYNTHETIC undated',quantity:1,price:20},m));snapshot(m);await s.save(m);s.close();
 });await p.reload();await ready();await nav('dashboard');const partialBefore=await record();
 assert.equal(JSON.parse(partialBefore.raw).snapshots.at(-1).valuationStatus,'partial');
 assert.equal(await p.locator('#dashboardChange').innerText(),'–');assert.match(await p.locator('#dashboardChangeHint').innerText(),/unvollständig bewerteten Stichtag/);
 await p.locator('#dashboardReview').click();assert.ok(await p.locator('#qualityReviewPanel').isVisible());await p.locator('[data-action=close-quality-review]').click();assert.deepEqual(await record(),partialBefore,'partial snapshot remains byte exact and review does not write');
 await scan('UI300 partial automatic snapshot');await p.screenshot({path:`${out}/${engine}-partial-observation.png`,fullPage:true});
 await writeFile(`${out}/report-${engine}.json`,JSON.stringify({engine,result:'PASS',base:p.url().split('?')[0],checks:['7 widths/44px/Axe','no hero or tiles; brand and five semantic destinations retained','zero group chip hidden','exact selected-period endpoints; explicit cashflow scope','200% text stress/short viewport (not physical zoom or hardware)','offline actual reload; exact canonical bytes/revision','partial automatic snapshot remains unavailable without writes']},null,2));
}
