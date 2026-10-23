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
   for(const id of buttons){
    const button=page.locator('#'+id);
    assert.ok((await button.getAttribute('aria-label'))?.length>0,id+' lacks accessible label');
    assert.ok((await button.getAttribute('title'))?.length>0,id+' lacks title');
    assert.equal(await button.locator('.action-icon svg').count(),1,id+' lacks a real SVG icon');
   }
   if(mobile)assert.ok(measured.rects.every(x=>x.w>=38&&x.w<=41&&x.h>=38&&x.h<=41),name+' not compact squares at '+width);
   else assert.ok(measured.rects.every(x=>x.w>65),name+' desktop labels have no space at '+width);
  }
  await page.locator(nav+' [data-page="positions"]').click();
  assert.equal(await page.locator('#positionsPage .action-group #resolveListings').count(),0,'Review action must not crowd the three primary actions');
  assert.equal(await page.locator('#positionsPage .position-review-action #resolveListings').count(),1);
  await page.locator(nav+' [data-page="history"]').click();
  const add=page.locator('#addSnapshot');
  const history=await add.evaluate(el=>{
   const r=el.getBoundingClientRect(),parent=el.closest('.panel').getBoundingClientRect();
   return {w:r.width,h:r.height,within:r.left>=parent.left-1&&r.right<=parent.right+1,
    label:getComputedStyle(el.querySelector('.history-add-label')).display,scroll:document.documentElement.scrollWidth};
  });
  assert.equal(history.label==='none',mobile,'Stichtag label breakpoint '+width);
  assert.ok(history.within,'History add button escapes card at '+width);
  assert.ok(history.scroll<=width+1,'History horizontal overflow at '+width);
  if(mobile)assert.ok(history.w<=38,'History add action not compact on '+width);
  else assert.ok(history.w>100,'History add action does not display text on '+width);
 }
 await page.setViewportSize({width:390,height:850});
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#addWizard').click();
 assert.equal(await page.locator('#wizardDialog').isVisible(),true,'Plus action must retain wizard');
 await page.keyboard.press('Escape');
 await page.locator('#mobileNav [data-page="bookings"]').click();
 await page.locator('#openCSVImport').click();
 assert.equal(await page.locator('#editDialog').isVisible(),true,'CSV import must retain its form');
 console.log('RESPONSIVE ACTIONS: icon-only mobile, one row desktop, icon accessibility, unchanged actions, 320–1440px PASS');
}finally{
 await browser.close();
}
