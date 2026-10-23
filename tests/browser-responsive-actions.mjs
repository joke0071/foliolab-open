import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
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
   if(mobile)assert.ok(measured.rects.every(x=>x.w>=38&&x.w<=41&&x.h>=38&&x.h<=41),name+' not compact squares at '+width);
   else assert.ok(measured.rects.every(x=>x.w>65),name+' desktop labels have no space at '+width);
  }
  await page.locator(nav+' [data-page="positions"]').click();
  assert.equal(await page.locator('#positionsPage .action-group #resolveListings').count(),0,'Review action must not crowd the three primary actions');
  assert.equal(await page.locator('#positionsPage .position-review-action #resolveListings').count(),1);
  await page.locator(nav+' [data-page="history"]').click();
  assert.equal(await page.locator('#historyPage #addWallet').count(),0,'History must not have a wallet action');
  assert.equal((await page.locator('#historyCalendarDisclosure > summary').textContent()).trim(),'','Calendar trigger must stay icon-only');
  assert.ok((await page.locator('#pageDescription').textContent())?.includes('Stichtagen'),'History needs a descriptive subtitle');
  assert.equal((await page.locator('#addSnapshot .history-add-label').textContent()).trim(),'Stichtag','Desktop snapshot text must stay short');
  const calendarStroke=await page.locator('#historyCalendarDisclosure > summary svg').evaluate(el=>parseFloat(getComputedStyle(el).strokeWidth));
  assert.ok(calendarStroke>=2.1,'Calendar icon stroke should match the other actions');
  const plusWeight=await page.locator('#historyPage .history-add-glyph').evaluate(el=>Number(getComputedStyle(el).fontWeight));
  assert.ok(plusWeight>=600,'History plus icon should not be lighter than other actions');
  assert.equal(await page.locator('#historyPage .history-insights > details').count(),2,'Shared history area must contain exactly two disclosures');
  const insightStyle=await page.locator('#historyPage .history-insights').evaluate(el=>{
   const container=getComputedStyle(el);
   const separator=getComputedStyle(el.querySelector('#snapshotManager'));
   const performance=getComputedStyle(el.querySelector('#performanceDetails'));
   return {
    border:container.borderTopWidth,
    background:container.backgroundColor,
    separator:separator.borderTopWidth,
    separatorStyle:separator.borderTopStyle,
    performanceBorder:performance.borderTopWidth,
    performanceBackground:performance.backgroundColor
   };
  });
  assert.equal(insightStyle.border,'0px','History disclosures must have no enclosing border');
  assert.equal(insightStyle.background,'rgba(0, 0, 0, 0)','History disclosures must have no card background');
  assert.equal(insightStyle.separator,'1px','History rows must be separated by a single thin line');
  assert.equal(insightStyle.separatorStyle,'solid','Separator should be a continuous thin line');
  assert.equal(insightStyle.performanceBorder,'0px','Renditeauswertung must not have its own border');
  assert.equal(insightStyle.performanceBackground,'rgba(0, 0, 0, 0)','Renditeauswertung must not have a card surface');
  assert.equal(await page.locator('#historyPage .history-insights > details[open]').count(),0,'Both disclosures must start collapsed');
  assert.equal(await page.locator('.side-caption, .mobile-label').count(),0,'Remove redundant portfolio header labels');
  const add=page.locator('#addSnapshot');
  const history=await add.evaluate(el=>{
   const r=el.getBoundingClientRect(),parent=el.closest('.panel').getBoundingClientRect();
   const controls=el.closest('.history-controls').getBoundingClientRect();
   const calendar=el.closest('.history-controls').querySelector('#historyCalendarDisclosure').getBoundingClientRect();
   const label=el.querySelector('.history-add-label').getBoundingClientRect();
   const style=getComputedStyle(el);
   return {w:r.width,h:r.height,within:r.left>=parent.left-1&&r.right<=parent.right+1,
    label:getComputedStyle(el.querySelector('.history-add-label')).display,scroll:document.documentElement.scrollWidth,
    background:style.backgroundColor,display:style.display,nowrap:style.whiteSpace,
    controlsRight:controls.right,addRight:r.right,calendarRight:calendar.right,addLeft:r.left,
    labelCenter:label.top+label.height/2,buttonCenter:r.top+r.height/2};
  });
  assert.equal(history.label==='none',mobile,'Stichtag label breakpoint '+width);
  assert.ok(history.within,'History add button escapes card at '+width);
  assert.ok(history.scroll<=width+1,'History horizontal overflow at '+width);
  if(mobile){
   assert.ok(history.w<=38,'History add action not compact on '+width);
   assert.ok(Math.abs(history.addRight-history.controlsRight)<=2,'History buttons should sit at right edge on '+width+': '+JSON.stringify(history));
   assert.ok(history.addLeft-history.calendarRight>=3,'Mobile calendar and plus must remain separate on '+width);
   assert.equal(history.background,'rgb(255, 255, 255)','Mobile plus retains outlined style on '+width);
  }else{
   assert.ok(history.w>70,'History add action must have room for desktop Stichtag text at '+width);
   assert.equal(history.display,'inline-flex','Desktop plus and Stichtag text must appear inline at '+width);
   assert.equal(history.nowrap,'nowrap','Desktop plus label must not wrap at '+width);
   assert.ok(Math.abs(history.labelCenter-history.buttonCenter)<=2,'Desktop Stichtag label must be vertically centered at '+width);
   assert.equal(history.background,'rgb(38, 86, 61)','Desktop plus action must be green like other primary actions at '+width);
  }
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
