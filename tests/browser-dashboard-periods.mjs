import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,persist}=await import('/src/model.js');
  const m=blankModel(),now=new Date(),last=new Date(now.getTime()-2*864e5).toISOString().slice(0,10);
  m.snapshots=[{id:'s1',date:'2025-01-01',total:1000},{id:'s2',date:last,total:1100},{id:'s3',date:now.toISOString().slice(0,10),total:1200}];
  persist(m);
 });
 await page.reload();
 const all=await page.locator('#miniChart [data-chart-points]').count();
 assert.equal(all,1);
 await page.locator('[data-mini-range="month"]').click();
 assert.ok(await page.locator('#miniChart [data-chart-points]').count()===1);
 assert.equal(await page.locator('[data-mini-range="month"]').evaluate(el=>el.classList.contains('selected')),true);
 await page.locator('[data-mini-range="all"]').click();
 assert.equal(await page.locator('[data-mini-range="all"]').evaluate(el=>el.classList.contains('selected')),true);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).snapshots.length),3);
 await page.locator('#mobileNav [data-page="history"]').click();
 const summary=page.locator('#performanceDetails > summary');
 assert.equal(await page.locator('#performanceDetails').getAttribute('open'),null);
 for(const width of [320,390,430,768,1440]){
  await page.setViewportSize({width,height:850});
  const check=await summary.evaluate(el=>{
   const style=getComputedStyle(el),caret=getComputedStyle(el,'::after');
   return {display:style.display,column:caret.gridColumnStart,row:caret.gridRowStart,border:caret.borderRightStyle,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  assert.equal(check.display,'grid');
  assert.equal(check.column,'2','Chevron must remain right at '+width);
  assert.equal(check.row,'1','Chevron must stay vertically centered at '+width);
  assert.equal(check.border,'solid','Chevron shape must match other accordions');
  assert.ok(check.overflow<=1,'Overflow at '+width+': '+check.overflow);
 }
 const closed=await summary.evaluate(el=>getComputedStyle(el,'::after').transform);
 await summary.click();
 await page.waitForTimeout(220);
 const opened=await summary.evaluate(el=>getComputedStyle(el,'::after').transform);
 assert.notEqual(opened,closed,'Chevron rotates on expand');
 console.log('RETURNS CHEVRON: matching accordion caret aligned right on 320–1440px PASS');
 console.log('DASHBOARD PERIODS: real snapshot filtering and no persisted mutations PASS');
}finally{await browser.close();}
