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
 console.log('DASHBOARD PERIODS: real snapshot filtering and no persisted mutations PASS');
}finally{await browser.close();}
