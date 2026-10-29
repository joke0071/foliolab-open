import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 for(const width of [320,360,390,430,767,768,900,1024,1280,1440]){
  await page.setViewportSize({width,height:850});
  const mobile=width<=767;
  const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
  for(const [name,tab,buttons] of [
   ['positions','positions',['addWizard','refreshAll','addWallet']],
   ['bookings','bookings',['openCSVImport','addBooking']]
  ]){
   await page.locator(nav+' [data-page="'+tab+'"]').click();
   const group=page.locator('#'+name+'Page .action-group');
   const measured=await group.evaluate(el=>{
    const buttons=[...el.querySelectorAll('.responsive-action')];
    const rects=buttons.map(x=>x.getBoundingClientRect());
    const parent=(el.closest('.toolbar')||el.closest('.panel')).getBoundingClientRect();
    const labelVisible=buttons.map(x=>getComputedStyle(x.querySelector('.action-label')).display!=='none');
    return {
     labels:labelVisible,rects:rects.map(r=>({x:r.left,y:r.top,w:r.width,h:r.height})),
     within:rects.every(r=>r.left>=parent.left-1&&r.right<=parent.right+1),
     scroll:document.documentElement.scrollWidth,
     viewport:innerWidth,
     actualDisplay:getComputedStyle(el).display,
     nowrap:getComputedStyle(el).flexWrap==='nowrap'
    };
   }).catch(()=>null);
   assert.ok(measured,name+' action group absent at '+width);
   assert.equal(await group.locator('.responsive-action').count(),buttons.length);
   assert.ok(measured.within,name+' buttons exceed card at '+width+': '+JSON.stringify(measured));
   assert.ok(measured.scroll<=measured.viewport+1,name+' horizontal overflow at '+width+': '+JSON.stringify(measured));
   assert.ok(measured.rects.every(x=>Math.abs(x.y-measured.rects[0].y)<=1),name+' buttons wrapped at '+width);
   assert.ok(measured.labels.every(x=>x!==mobile),name+' labels do not match breakpoint at '+width);
   assert.equal(measured.nowrap,true,name+' action group wraps at '+width);
   const expectedLabels=name==='positions'
    ?['Anlage','Aktualisieren','Wallet']
    :['CSV-Import','Buchung'];
   assert.deepEqual(await group.locator('.action-label').allTextContents(),expectedLabels,name+' action labels');
   const description=await page.locator('#pageDescription').textContent();
   assert.ok(description?.length>35,name+' missing explanatory subtitle');
   for(const id of buttons){
    const button=page.locator('#'+id);
    assert.ok((await button.getAttribute('aria-label'))?.length>0,id+' lacks accessible label');
    assert.ok((await button.getAttribute('title'))?.length>0,id+' lacks title');
    assert.equal(await button.locator('.action-icon svg').count(),1,id+' lacks a real SVG icon');
    const stroke=await button.locator('.action-icon svg').evaluate(el=>parseFloat(getComputedStyle(el).strokeWidth));
    assert.ok(stroke>=2.1,id+' icon stroke too thin at '+width+': '+stroke);
   }
   // UI-A02 explicitly replaces the former38–41px visual contract with real
   //44px targets. Keep the compact square, wrapping and card-boundary gates.
   assert.ok(measured.rects.every(x=>x.w>=44&&x.h>=44),name+' below44px at '+width);
   if(mobile)assert.ok(measured.rects.every(x=>x.w===44&&x.h===44),name+' not44px compact squares at '+width);
   else assert.ok(measured.rects.every(x=>x.w>65),name+' desktop labels have no space at '+width);
  }
  await page.locator(nav+' [data-page="positions"]').click();
  assert.equal(await page.locator('#positionsPage .action-group #resolveListings').count(),0,'Review action must not crowd the three primary actions');
  assert.equal(await page.locator('#positionsPage .position-review-action #resolveListings').count(),1);
  await page.locator(nav+' [data-page="history"]').click();
  assert.equal(await page.locator('#historyPage #addWallet').count(),0,'History must not have a wallet action');
  assert.equal((await page.locator('#historyCalendarDisclosure > summary').textContent()).trim(),'','Calendar trigger must stay icon-only');
  assert.ok((await page.locator('#pageDescription').textContent())?.length>15,'History needs a descriptive subtitle');
  assert.equal(await page.locator('#historyPage .history-panel > .panel-head').count(),0,'History chart must not duplicate the page heading');
  assert.equal(await page.locator('#historyPage .history-panel[role="region"]').count(),1,'History chart needs an accessible region name');
  assert.equal((await page.locator('#addSnapshot .manual-snapshot-label').textContent()).trim(),'Stichtag hinzufügen','Desktop snapshot text must stay short');
  const calendarStroke=await page.locator('#historyCalendarDisclosure > summary svg').evaluate(el=>parseFloat(getComputedStyle(el).strokeWidth));
  assert.ok(calendarStroke>=2.1,'Calendar icon stroke should match the other actions');
  assert.equal(await page.locator('.history-controls #addSnapshot').count(),0,'Manual action must not dominate the chart toolbar');
  assert.equal(await page.locator('#snapshotManager').evaluate(el=>el.open),false,'Manual controls start closed');
  await page.locator('#snapshotManager > summary').click();
  const manual=page.locator('#addSnapshot');assert.equal(await manual.isVisible(),true);
  assert.equal(await manual.getAttribute('aria-label'),'Stichtag hinzufügen');
  assert.ok(!(await manual.getAttribute('class')).includes('primary'),'Manual checkpoint is secondary');
  const size=await manual.evaluate(el=>({h:el.getBoundingClientRect().height,right:el.getBoundingClientRect().right,scroll:document.documentElement.scrollWidth}));
  assert.ok(size.h>=38&&size.right<=width+1&&size.scroll<=width+1,'Manual action remains usable at '+width);
  assert.equal(await page.locator('#historyCalendarDisclosure > summary').isVisible(),false,'Empty history has no date-selection action');
  await page.locator('#snapshotManager > summary').click();
 }
 await page.setViewportSize({width:390,height:850});
 await page.locator('#mobileNav [data-page="dashboard"]').click();
 assert.equal((await page.locator('#pageDescription').textContent()).trim(),'','Dashboard does not need an action subtitle');
 await page.locator('#mobileNav [data-page="history"]').click();
 await page.locator('#historyPage #performanceDetails > summary').click();
 assert.equal(await page.locator('#historyPage #performanceDetails[open]').count(),1,'Renditeauswertung expands');
 assert.equal(await page.locator('#historyPage #snapshotManager[open]').count(),0,'Stichtage remains independently collapsed');
 await page.locator('#historyPage #snapshotManager > summary').click();
 assert.equal(await page.locator('#historyPage .history-insights > details[open]').count(),2,'Both disclosures can expand independently');
 await page.locator('#historyPage #performanceDetails > summary').click();
 await page.locator('#historyPage #snapshotManager > summary').click();
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#addWizard').click();
 assert.equal(await page.locator('#wizardDialog').isVisible(),true,'Plus action must retain wizard');
 await page.keyboard.press('Escape');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),provider=createProvider({name:'UI-Test'});m.providers.push(provider);
  const account=createAccount({name:'Testdepot',providerId:provider.id},m);m.accounts.push(account);
  m.positions.push(createPosition({name:'Test-ETF',kind:'etf',quantity:1,price:10,providerId:provider.id,accountId:account.id},m));
  persist(m);
 });
 await page.reload();
 await page.locator('#mobileNav [data-page="bookings"]').click();
 await page.locator('#openCSVImport').click();
 assert.equal(await page.locator('#editDialog').isVisible(),true,'CSV import must retain its form');
 console.log('RESPONSIVE ACTIONS: icon-only mobile, one row desktop, icon accessibility, unchanged actions, 320–1440px PASS');
}finally{
 await browser.close();
}
