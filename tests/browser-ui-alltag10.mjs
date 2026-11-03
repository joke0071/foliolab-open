// UI-ALLTAG10 regression: long press / selection symbol on all three lists. Synthetic data only.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {seed,ready,nav} from '../docs/ui-copilot-2026-11-03/capture.mjs';
const base=process.env.UI_BASE||'http://127.0.0.1:4173/';
mkdirSync('artifacts/gates/ui-alltag10',{recursive:true});
const report={engines:[]};
const press=(p,selector,{hold=650,release=true,move=0,second=false}={})=>p.evaluate(async({selector,hold,release,move,second})=>{
 const el=document.querySelector(selector),r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+Math.min(r.height/2,20);
 const init=(id,type,dx=0)=>({pointerId:id,pointerType:'touch',isPrimary:id===1,bubbles:true,cancelable:true,composed:true,clientX:x+dx,clientY:y,button:0,buttons:1});
 el.dispatchEvent(new PointerEvent('pointerdown',init(1,'down')));
 if(second)el.dispatchEvent(new PointerEvent('pointerdown',init(2,'down')));
 if(move)el.dispatchEvent(new PointerEvent('pointermove',init(1,'move',move)));
 await new Promise(r=>setTimeout(r,hold));
 if(release){const t=document.elementFromPoint(x,y)||document.body;t.dispatchEvent(new PointerEvent('pointerup',{...init(1),buttons:0}));if(second)t.dispatchEvent(new PointerEvent('pointerup',{...init(2),buttons:0}));}
 return true;
},{selector,hold,release,move,second});
const ghostClick=(p,selector)=>p.evaluate(s=>{const el=document.querySelector(s);(document.elementFromPoint(el.getBoundingClientRect().left+10,el.getBoundingClientRect().top+10)||el).dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));},selector);
const lists={
 positions:{nav:'positions',row:'.position-entry[data-position-id="pos-1"]',box:'[data-position-select]',status:'#positionSelectionStatus',done:'#positionListHead [data-action="cancel-selection"]',manage:'#positionListHead [data-action="select-positions"]',open:'.position-entry[data-position-id="pos-1"] details.holding-expand'},
 bookings:{nav:'bookings',row:'.booking-management-row[data-booking-id="bk-1"]',box:'[data-booking-select]',done:'[data-booking-manage="cancel"]',manage:'#bookingListHead [data-booking-manage="select"]',open:'.booking-management-row[data-booking-id="bk-1"] details.booking-meta'},
 references:{nav:'history',row:'.reference-row[data-reference-id="ref-1"]',box:'[data-reference-select]',done:'#manageReferences[aria-pressed="true"]',manage:'#manageReferences',open:null}
};
const record=p=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return JSON.stringify(await readPortfolioRecord(db));}finally{db.close();}});
for(const engine of (process.env.UI_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const ctx=await browser.newContext({viewport:{width:390,height:900},hasTouch:true,serviceWorkers:'block'});await ctx.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await ready(p);await seed(p);await p.reload();await ready(p);
 const stored=await record(p),result={};
 for(const [name,c] of Object.entries(lists)){if(process.env.UI_ONLY&&process.env.UI_ONLY!==name)continue;
  await nav(p,c.nav);if(name==='references'&&!await p.locator('#snapshotManager').evaluate(e=>e.open))await p.locator('#snapshotManager>summary').click();
  const checkedIds=()=>p.locator(c.box+':checked').evaluateAll(es=>es.map(e=>e.getAttribute(Object.keys(e.dataset).includes('positionSelect')?'data-position-select':Object.keys(e.dataset).includes('bookingSelect')?'data-booking-select':'data-reference-select')));
  const selecting=()=>p.locator(c.box).count();
  // short tap: no management mode, no selection
  await press(p,c.row,{hold:80});await ghostClick(p,c.row);assert.equal(await selecting(),0,name+' short tap must not enter management');
  // scroll/move cancels
  await press(p,c.row,{hold:700,move:40});assert.equal(await selecting(),0,name+' moved press cancels');
  // pointercancel cancels
  await p.evaluate(async s=>{const el=document.querySelector(s),r=el.getBoundingClientRect();const i={pointerId:3,pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+10,button:0};el.dispatchEvent(new PointerEvent('pointerdown',i));await new Promise(r=>setTimeout(r,100));el.dispatchEvent(new PointerEvent('pointercancel',i));await new Promise(r=>setTimeout(r,700));},c.row);assert.equal(await selecting(),0,name+' pointercancel cancels');
  // multi-touch cancels
  await press(p,c.row,{second:true});assert.equal(await selecting(),0,name+' multi-touch cancels');
  // mouse never long-presses
  await p.evaluate(async s=>{const el=document.querySelector(s),r=el.getBoundingClientRect();el.dispatchEvent(new PointerEvent('pointerdown',{pointerId:9,pointerType:'mouse',bubbles:true,clientX:r.left+20,clientY:r.top+10,button:0}));await new Promise(r=>setTimeout(r,650));el.dispatchEvent(new PointerEvent('pointerup',{pointerId:9,pointerType:'mouse',bubbles:true}));},c.row);assert.equal(await selecting(),0,name+' mouse does not long press');
  // interactive child: no competing gesture
  if(c.open){await press(p,c.open+'>summary');assert.equal(await selecting(),0,name+' summary press is not a row gesture');}
  // real long press
  await press(p,c.row);await p.locator(c.box).first().waitFor();
  const ids=await checkedIds();assert.equal(ids.length,1,name+' exactly one selected');assert.match(ids[0],/-1$/,name+' pressed row selected');
  assert.equal(await p.locator(c.row+' '+c.box+':checked').count(),1);
  assert.equal(await p.locator(c.box).evaluateAll(es=>es.every(e=>!e.closest('label')?.textContent.trim().includes('Auswählen'))),true,name+' no visible Auswählen text');
  assert.equal(await p.locator(c.box).evaluateAll(es=>es.every(e=>e.getAttribute('aria-label')?.endsWith('auswählen'))),true,name+' accessible name');
  // ghost click after the press must not open details or toggle
  await ghostClick(p,c.row);assert.deepEqual(await checkedIds(),ids,name+' ghost click ignored');
  if(c.open)assert.equal(await p.locator(c.open).evaluate(e=>e.open),false,name+' ghost click did not open details');
  // touch target and focus
  assert.equal(await p.locator(c.row+' '+c.box).evaluate(e=>{const r=(e.closest('label')||e).getBoundingClientRect();return r.width>=43.5&&r.height>=43.5;}),true,name+' 44px target');
  assert.equal(await p.evaluate(s=>document.activeElement?.matches(s),c.box),true,name+' focus on pressed checkbox');
  // keyboard: toggle second and first
  await p.locator(c.row+' '+c.box).focus();await p.keyboard.press('Space');assert.equal((await checkedIds()).length,0,name+' keyboard unselect');await p.keyboard.press('Space');assert.equal((await checkedIds()).length,1);
  // second long press while managing does not re-select / reset
  const other=c.row.replace('-1"','-2"');await press(p,other);assert.equal((await checkedIds()).length,1,name+' press in manage mode keeps selection');
  // axe
  const violations=await p.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id+':'+v.nodes.map(n=>n.target.join(' ')).join('|')));assert.deepEqual(violations,[],name+' axe');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' no overflow');
  // Fertig leaves management without leftover checkboxes
  await p.locator(c.done).first().click();await p.waitForTimeout(300);assert.equal(await selecting(),0,name+' Fertig removes checkboxes');
  assert.equal(await p.locator(c.manage).count()>0,true,name+' Verwalten reachable again');
  // deliberate path without long press
  await p.locator(c.manage).first().click();assert.ok(await selecting()>0,name+' Verwalten works without long press');await p.locator(c.done).first().click();
  result[name]='PASS';
 }

 if(engine==='chromium'){
  // Real browser touch input via CDP (trusted events): long press selects, panning cancels.
  const cdp=await ctx.newCDPSession(p),touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
  await nav(p,'positions');const target=p.locator('#positionList .position-entry .holding-row').nth(2);await target.evaluate(e=>e.scrollIntoView({block:'center'}));
  const box=await p.locator('#positionList .position-entry .holding-row').nth(2).boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  await touch('touchStart',x,y);await p.waitForTimeout(150);for(let i=1;i<=6;i++){await touch('touchMove',x,y-i*25);await p.waitForTimeout(40);}await p.waitForTimeout(700);await touch('touchEnd');
  assert.equal(await p.locator('[data-position-select]').count(),0,'real touch pan must not select');
  await target.evaluate(e=>e.scrollIntoView({block:'center'}));const box2=await target.boundingBox(),x2=box2.x+box2.width/2,y2=box2.y+box2.height/2;
  await touch('touchStart',x2,y2);await p.waitForTimeout(700);await touch('touchEnd');await p.waitForTimeout(300);
  assert.equal(await p.locator('[data-position-select]:checked').count(),1,'real touch long press selects exactly one');
  assert.equal(await p.locator('.position-entry details.holding-expand[open]').count(),0,'no details opened by the lifting finger');
  await p.locator('#positionListHead [data-action="cancel-selection"]').click();
  await target.evaluate(e=>e.scrollIntoView({block:'center'}));const box3=await target.boundingBox();await touch('touchStart',box3.x+box3.width/2,box3.y+box3.height/2);await p.waitForTimeout(100);await touch('touchEnd');await p.waitForTimeout(700);
  assert.equal(await p.locator('[data-position-select]').count(),0,'real short touch does not manage');
  result.realTouch='PASS';
 }
 assert.equal(await record(p),stored,'pure UI operation must not change stored data');
 assert.deepEqual(errors,[]);
 report.engines.push({engine,result});console.log(engine,JSON.stringify(result));
 await browser.close();
}
writeFileSync('artifacts/gates/ui-alltag10/long-press.json',JSON.stringify(report,null,2));
