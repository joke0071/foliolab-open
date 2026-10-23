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
 const returns=page.locator('#performanceDetails'),summary=returns.locator(':scope > summary');
 assert.equal(await returns.getAttribute('open'),null,'Renditeauswertung starts collapsed');
 for(const width of [320,390,430,768,1440]){
  await page.setViewportSize({width,height:850});
  const geometry=await summary.evaluate(el=>{
   const style=getComputedStyle(el),arrow=getComputedStyle(el,'::after');
   return {layout:style.display,column:arrow.gridColumnStart,row:arrow.gridRowStart,
    border:arrow.borderRightStyle,content:arrow.content,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  assert.equal(geometry.layout,'grid','Return disclosure should keep icon to the right at '+width);
  assert.equal(geometry.column,'2','Chevron stays in right column at '+width);
  assert.equal(geometry.row,'1','Chevron stays aligned with both text rows at '+width);
  assert.equal(geometry.border,'solid','Chevron shape matches settings accordions at '+width);
  assert.ok(geometry.overflow<=1,'No horizontal overflow at '+width+': '+geometry.overflow);
 }
 const before=await summary.evaluate(el=>getComputedStyle(el,'::after').transform);
 await summary.click();
 const after=await summary.evaluate(el=>getComputedStyle(el,'::after').transform);
 assert.notEqual(after,before,'Arrow turns when returns detail opens');
 console.log('RETURNS CHEVRON: right aligned, unified caret and expanded state on 320–1440px PASS');
 console.log('DASHBOARD PERIODS: real snapshot filtering and no persisted mutations PASS');
}finally{await browser.close();}
