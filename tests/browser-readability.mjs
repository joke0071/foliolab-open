import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {createPosition} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {bookingUIFixture} from './booking-ui-fixture.mjs';
const out='artifacts/gates/readability';mkdirSync(out,{recursive:true});
const report={engines:[],failures:[]};
for(const engine of (process.env.READABILITY_ENGINES||process.env.BOOKING_MANAGEMENT_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true});
 const context=await browser.newContext(),page=await context.newPage();
 const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=async tab=>page.locator('#mobileNav [data-page="'+tab+'"]:visible,#sidebarNav [data-page="'+tab+'"]:visible').click();
 const m=bookingUIFixture();m.positions[0].name='SYNTHETIC Vanguard FTSE All-World UCITS ETF thesaurierend IE00BK5BQT80';m.positions[1].name='SYNTHETIC Ethereum Cold Wallet langfristige Rücklage';m.providers[0].name='SYNTHETIC Anbieter mit sehr langem Namen';for(const b of m.bookings)b.positionName=m.positions.find(p=>p.id===b.positionId)?.name||b.positionName;
 const asset=createPosition({id:'readability-etf',providerId:'p',accountId:'account-a',name:'SYNTHETIC Vanguard FTSE All-World UCITS ETF thesaurierend IE00BK5BQT80',kind:'etf',symbol:'SYN',quantity:0,price:100,currency:'EUR'},m);m.positions.push(asset);
 executeTransaction(m,{id:'readability-small',type:'buy',date:'2026-01-01',positionId:asset.id,quantity:'0.000000000000000001',unitPrice:'100'});
 executeTransaction(m,{id:'readability-large',type:'buy',date:'2026-01-02',positionId:asset.id,quantity:'123456789',unitPrice:'12345.67'});
 executeTransaction(m,{id:'readability-negative',type:'sell',date:'2026-01-03',positionId:asset.id,quantity:'0.000000000000000001',unitPrice:'100'});
 try{
  await page.goto(process.env.READABILITY_BASE||'http://127.0.0.1:4173/');await ready();
  await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},m);await page.reload();await ready();
  for(const [width,height] of [[320,640],[360,740],[390,844],[412,915],[430,932],[768,1024],[1440,900],[740,360]]){
   await page.setViewportSize({width,height});
   for(const tab of ['dashboard','history','positions','bookings','more']){
    await nav(tab);await page.screenshot({path:`${out}/${engine}-${width}-${height}-${tab}.png`,fullPage:tab==='more'});
    if(tab==='dashboard'){
     const fullAmountVisible=()=>page.locator('#totalValue').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const hero=el.closest('.hero').getBoundingClientRect();return [...range.getClientRects()].every(r=>r.left>=hero.left&&r.right<=hero.right&&r.top>=hero.top&&r.bottom<=hero.bottom);});
     assert.ok(await fullAmountVisible(),engine+' '+width+' complete hero amount is visible, including hidden-overflow ancestors');
     assert.ok(await page.locator('#summaryStats .stat-value').evaluateAll(nodes=>nodes.every(el=>{const range=document.createRange();range.selectNodeContents(el);const card=el.closest('.stat').getBoundingClientRect();return [...range.getClientRects()].every(r=>r.left>=card.left&&r.right<=card.right&&r.top>=card.top&&r.bottom<=card.bottom);})),engine+' '+width+' complete category amounts remain within their tiles');
     if(width===320||width===390){
      await page.locator('#totalValue').evaluate(el=>{el.style.fontSize=(parseFloat(getComputedStyle(el).fontSize)*1.25)+'px';});
      assert.ok(await fullAmountVisible(),engine+' '+width+' hero amount remains visible with 125 percent text');
      await page.screenshot({path:`${out}/${engine}-${width}-hero-text125.png`});
      await page.locator('#totalValue').evaluate(el=>el.style.removeProperty('font-size'));
     }
    }
    const overflow=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,items:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&e.getBoundingClientRect().width>0).slice(0,8).map(e=>({tag:e.tagName,id:e.id,cls:e.className,text:e.textContent.slice(0,100)}))}));if(overflow.page>width+1)report.failures.push({engine,width,tab,issue:'overflow',...overflow});
   }
   await nav('bookings');
   const filters=await page.locator('#bookingArchiveFilter').evaluate(s=>{const st=getComputedStyle(s),c=document.createElement('canvas').getContext('2d');c.font=st.font;const required=Math.max(...[...s.options].map(o=>c.measureText(o.label).width));return {required,available:s.clientWidth-parseFloat(st.paddingLeft)-parseFloat(st.paddingRight)-24};});
   if(filters.available+1<filters.required)report.failures.push({engine,width,issue:'archive label clipped',...filters});
   const geometry=await page.locator('#bookingList .booking-main').evaluateAll(nodes=>nodes.map(n=>{const title=n.querySelector('strong'),r=title.getBoundingClientRect();return {width:r.width,height:r.height,line:parseFloat(getComputedStyle(title).lineHeight),text:title.textContent,wordLines:[...title.textContent.matchAll(/\S{4,}/g)].map(match=>{const range=document.createRange();range.setStart(title.firstChild,match.index);range.setEnd(title.firstChild,match.index+match[0].length);return [...new Set([...range.getClientRects()].map(r=>Math.round(r.top)))].length;}),values:[...n.querySelectorAll('strong,span')].map(e=>({text:e.textContent,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,scroll:e.scrollWidth,client:e.clientWidth,lines:(()=>{const r=document.createRange();r.selectNodeContents(e);return [...new Set([...r.getClientRects()].map(r=>Math.round(r.top)))].length;})()}))};}));
   assert.ok(geometry.every(r=>r.width>=Math.min(95,width*.25)),`${engine} ${width} titles squeezed`);
   assert.ok(geometry.every(r=>r.wordLines.every(lines=>lines<=2)),`${engine} ${width} words broken into narrow vertical fragments`);assert.ok(geometry.every(r=>r.values.every(v=>v.left>=0&&v.right<=width+1&&v.scroll<=v.client+1)),`${engine} ${width} booking values clipped or overflowing: `+JSON.stringify(geometry.filter(r=>r.values.some(v=>v.scroll>v.client+1))));
   if(width<=767)assert.ok(geometry.every(r=>r.values.filter(v=>/^[€+−\-0-9]/.test(v.text)).every(v=>v.lines===1)),`${engine} ${width} numeric values split across lines`);
   await page.locator('[data-booking-manage="select"]').click();assert.ok(await page.locator('#bookingList .booking-main').evaluateAll(nodes=>nodes.every(n=>n.querySelector('strong').getBoundingClientRect().width>=80)),'selection preserves readable titles');await page.screenshot({path:`${out}/${engine}-${width}-${height}-selection.png`});await page.locator('[data-booking-manage="cancel"]').click();
   await page.locator('#bookingList .booking-meta>summary').first().click();
   await page.locator('#bookingList .booking-meta').first().scrollIntoViewIfNeeded();
   await page.screenshot({path:`${out}/${engine}-${width}-${height}-booking-details.png`});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'expanded booking details fit');
   await page.locator('#bookingList .booking-meta>summary').first().click();
   for(const value of ['archived','all','active']){await page.locator('#bookingArchiveFilter').selectOption(value);assert.equal(await page.locator('#bookingArchiveFilter').inputValue(),value);}
   if(width===390){
    await nav('more');
    for(const details of await page.locator('#morePage details').all()){if(await details.isVisible()&&!await details.evaluate(d=>d.open))await details.locator(':scope>summary').click();}
    await page.screenshot({path:`${out}/${engine}-390-more-expanded.png`,fullPage:true});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'expanded More sections fit');
    await nav('bookings');
    // Emulate text enlargement only; this does not claim Android system-font testing.
    await page.evaluate(()=>{const text=[...document.querySelectorAll('#bookingsPage *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,size] of text)e.style.fontSize=(size*1.25)+'px';});
    await page.screenshot({path:`${out}/${engine}-390-text125.png`});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'125 percent text fits');
    await page.evaluate(()=>document.querySelectorAll('#bookingsPage *').forEach(e=>e.style.removeProperty('font-size')));
   }

  }
  report.engines.push({engine,result:report.failures.some(f=>f.engine===engine)?'FAIL':'PASS'});
 }catch(error){report.failures.push({engine,error:String(error)});throw error;}finally{await context.close();await browser.close();writeFileSync(out+'/report.json',JSON.stringify(report,null,2));}
}
assert.deepEqual(report.failures,[],'native select values must be readable including archived state');
