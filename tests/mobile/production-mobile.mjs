import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync,readFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {seed,ready,nav} from '../../docs/ui-copilot-2026-11-03/capture.mjs';
import {revealAction} from '../browser-disclosures.mjs';
const [base,engine,out]=process.argv.slice(2);
const browser=await ({chromium,firefox,webkit})[engine].launch();
try {
 const p=await browser.newPage({viewport:{width:320,height:740},serviceWorkers:'block'});
 await p.goto(base);await ready(p);
 const assets={};
 for(const file of ['sw.js','index.html','styles.css','src/app.js']){
  const resp=await p.request.get(new URL(file,base).href);assert.equal(resp.status(),200);
  const bytes=await resp.body();assert.ok(bytes.equals(readFileSync(file)),file);
  assets[file]=createHash('sha256').update(bytes).digest('hex');
 }
 await seed(p);await p.reload();await ready(p);
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db)}finally{db.close()}});
 const before=await record();assert.ok(before);
 const links=[],anchors=[],widths=[];
 await nav(p,'more');
 const selectors=['#driveOAuthHelp a','#optionalConnections>.more-panel-help a'];
 for(const sel of selectors)await revealAction(p.locator(sel));
 for(const width of [320,360,390,412,430,768,1440]){
  await p.setViewportSize({width,height:740});
  for(const selector of selectors)for(const scale of [1,2]){
   const box=await p.locator(selector).evaluate((el,scale)=>{
    const old=el.style.fontSize;el.style.fontSize=(parseFloat(getComputedStyle(el).fontSize)*scale)+'px';
    el.scrollIntoView({block:'center',behavior:'instant'});el.focus({preventScroll:true});
    const r=el.getBoundingClientRect(),hit=y=>el.contains(document.elementFromPoint(r.x+r.width/2,y));
    const result={w:r.width,h:r.height,inBounds:r.left>=0&&r.right<=innerWidth+1,top:hit(r.top+2),bottom:hit(r.bottom-2),focus:el===document.activeElement};
    el.style.fontSize=old;return result;
   },scale);
   assert.ok(box.w>=44&&box.h>=44&&box.inBounds&&box.top&&box.bottom&&box.focus,JSON.stringify({width,selector,scale,box}));
   links.push({width,selector,scale,...box});
  }
 }
 await p.setViewportSize({width:320,height:740});await nav(p,'dashboard');
 for(let width=320;width<=430;width++){
  await p.setViewportSize({width,height:740});
  await p.evaluate(()=>{
   const nodes=[...document.querySelectorAll('.mobile-header,.mobile-header *,#mobileNav,#mobileNav *')];
   for(const el of nodes)el.style.removeProperty('font-size');
   const fonts=nodes.map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);
   for(const [el,size] of fonts)el.style.fontSize=2*size+'px';
  });
  await p.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('.content')).paddingBottom)>=document.querySelector('#mobileNav').getBoundingClientRect().height);
  const row=await p.evaluate(()=>{
   const buttons=[...document.querySelectorAll('#mobileNav button')];
   const fits=buttons.every(b=>{const r=b.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(b.querySelector('span'));return r.width>=44&&r.height>=44&&[...range.getClientRects()].every(t=>t.left>=r.left-1&&t.right<=r.right+1&&t.top>=r.top-1&&t.bottom<=r.bottom+1)});
   return {count:buttons.length,fits,scroll:document.documentElement.scrollWidth};
  });
  assert.ok(row.count===5&&row.fits&&row.scroll<=width,JSON.stringify({width,row}));widths.push(width);
  if(![320,360,390,412,430].includes(width))continue;
  await nav(p,'history');
  for(const [label,sel] of [['Datenabdeckung','#historyCoverage>summary'],['Rendite','#performanceDetails>summary'],['Stichtage','#snapshotManager>summary']]){
   await p.getByRole('navigation',{name:'Abschnitte im Verlauf'}).getByRole('link',{name:label}).click();
   const geometry=await p.locator(sel).evaluate(el=>{const r=el.getBoundingClientRect();return {focus:el===document.activeElement,top:r.top,bottom:r.bottom,header:document.querySelector('.mobile-header').getBoundingClientRect().bottom,nav:document.querySelector('#mobileNav').getBoundingClientRect().top}});
   assert.ok(geometry.focus&&geometry.top>=geometry.header-1&&geometry.bottom<=geometry.nav+1,JSON.stringify({width,label,geometry}));
   anchors.push({width,label,...geometry});
  }
  await nav(p,'dashboard');
 }
 assert.deepEqual(await record(),before);await p.reload();await ready(p);assert.deepEqual(await record(),before);
 const receipt={base,engine,browser:browser.version(),assets,links,anchors,widths,labelsPerWidth:5,unchangedRecordAfterReload:true,result:'PASS'};
 writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');console.log(engine,widths.length,'widths,',links.length,'link tests,',anchors.length,'focus jumps PASS');
}finally{await browser.close()}
