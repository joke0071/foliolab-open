import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try {
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition,snapshot,persist}=await import('/src/model.js');
   const m=blankModel(),provider=createProvider({name:'Broker Audit'});m.providers.push(provider);
   const dep=createAccount({name:'Wertpapierdepot',type:'securities',providerId:provider.id},m);
   const bank=createAccount({name:'Cash Konto',type:'checking',providerId:provider.id},m);m.accounts.push(dep,bank);
   for(const [kind,name,quantity,price,acc] of [
     ['etf','World ETF',2,100,dep],['cash','Guthaben',1,500,bank],['crypto','Bitcoin',1,50,dep]
   ])m.positions.push(createPosition({kind,name,quantity,price,providerId:provider.id,accountId:acc.id},m));
   snapshot(m,'2026-10-18','Alt',{manualTotalEUR:'900'});
   snapshot(m,'2026-10-21','Neu',{manualTotalEUR:'750'});
   persist(m);
 });
 await page.reload();
 for(const width of [320,390,430,768,1024,1440]){
   await page.setViewportSize({width,height:850});
   const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
   for(const [tab,selector] of [
    ['bookings','#bookingsPage .panel-head-actions'],
    ['more','#morePage .panel-head-actions']
   ]){
     await page.locator(nav+' [data-page="'+tab+'"]').click();
     const result=await page.locator(selector).evaluate(el=>{
       const title=el.querySelector('.panel-title').getBoundingClientRect();
       const actions=el.querySelector('.panel-actions').getBoundingClientRect();
       const parent=el.closest('.panel').getBoundingClientRect();
       const buttons=[...el.querySelectorAll('.btn')].map(x=>x.getBoundingClientRect());
       const overlap=title.left<actions.right&&title.right>actions.left&&title.top<actions.bottom&&title.bottom>actions.top;
       return {overlap,within:buttons.every(x=>x.left>=parent.left-1&&x.right<=parent.right+1),width:innerWidth,scroll:document.documentElement.scrollWidth};
     });
     assert.equal(result.overlap,false,tab+' title/button collision at '+width+' px');
     assert.equal(result.within,true,tab+' button escapes card at '+width+' px');
     assert.ok(result.scroll<=width+1,tab+' horizontal overflow at '+width+' px');
   }
   await page.locator(nav+' [data-page="history"]').click();
   const compact=await page.locator('#historyPage .history-controls').evaluate(el=>{
     const parent=el.closest('.panel').getBoundingClientRect();
     const items=[...el.querySelectorAll('#chartPeriods button,.history-calendar-popover>summary,#addSnapshot')].map(x=>x.getBoundingClientRect());
     return {within:items.every(x=>x.left>=parent.left-1&&x.right<=parent.right+1),scroll:document.documentElement.scrollWidth};
   });
   assert.equal(compact.within,true,'compact history controls escape card at '+width+' px');
   assert.ok(compact.scroll<=width+1,'history horizontal overflow at '+width+' px');
   assert.equal(await page.locator('#snapshotManager').getAttribute('open'),null);
   await page.locator(nav+' [data-page="dashboard"]').click();
   assert.ok(await page.locator('#summaryStats .stat').count()===4);
   const summary=await page.locator('#summaryStats').innerText();
   for(const heading of ['Wertpapiere','Guthaben','Kryptowährungen','Veränderung'])assert.match(summary,new RegExp(heading));
   assert.ok(await page.locator('#miniChart .chart-y-labels').isVisible());
   const axis=await page.locator('#miniChart .chart-y-labels').innerText();
   assert.match(axis,/Tsd\.|€ \d/);
 }
 await page.setViewportSize({width:390,height:850});
 await page.locator('#mobileNav [data-page="history"]').click();
 assert.match(await page.locator('#pageTitle').innerText(),/Vermögensentwicklung/);
 await page.locator('#historyCalendarDisclosure>summary').click();
 assert.ok(await page.locator('#historyCalendarGrid [data-calendar-day="2026-10-18"]').count());
 await page.locator('#historyCalendarGrid [data-calendar-day="2026-10-18"]').click();
 await page.locator('#historyCalendarGrid [data-calendar-day="2026-10-21"]').click();
 assert.equal(await page.locator('#historyCalendarDisclosure').getAttribute('open'),null);
 await page.locator('#historyCalendarDisclosure>summary').click();
 assert.equal(await page.locator('#historyCalendarGrid [data-calendar-day="2026-10-20"]').getAttribute('aria-pressed'),'true');
 await page.locator('#historyCalendarReset').click();
 assert.equal(await page.locator('#chartPeriods [data-range="all"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#snapshotManager').getAttribute('open'),null);
 await page.locator('#snapshotManager>summary').click();
 assert.ok(await page.locator('#snapshotList .history-row').count()>=2);
 await page.locator('#mobileNav [data-page="dashboard"]').click();
 const accordion=page.locator('#providerOverview details').first();
 assert.equal(await accordion.getAttribute('open'),null);
 await accordion.locator(':scope > summary').click();
 assert.ok(await accordion.getAttribute('open')!==null);
 assert.match(await accordion.innerText(),/Wertpapierdepot/);
 assert.match(await accordion.innerText(),/World ETF/);
 await page.locator('#miniChart .chart-plot').focus();
 await page.keyboard.press('ArrowLeft');
 assert.ok(await page.locator('#miniChart .chart-tooltip').isVisible());
 assert.match(await page.locator('#miniChart .chart-tooltip').innerText(),/900,00/);
 console.log('DASHBOARD UI responsive actions 320–1440px, history calendar, chart, KPIs and provider drilldowns PASS');
}finally{
 await browser.close();
}