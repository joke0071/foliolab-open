// Exact computed font doubling; viewport compression is a separate test.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {seed,ready,nav} from '../docs/ui-copilot-2026-11-03/capture.mjs';
import {manageList} from './browser-management-mode.mjs';
const base=process.env.UI_BASE||'http://127.0.0.1:4173/';
const record=p=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('./src/atomic-storage.js');const db=await openPortfolioDB();try{return JSON.stringify(await readPortfolioRecord(db));}finally{db.close();}});
const results=[];mkdirSync('artifacts/gates/ui-textscale',{recursive:true});
for(const engine of (process.env.UI_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true});
 try{
  const p=await browser.newPage({serviceWorkers:'block'});await p.goto(base);await ready(p);await seed(p);await p.reload();await ready(p);const before=await record(p);
  for(const width of [320,768])for(const tab of ['positions','bookings','history','more']){
   await p.setViewportSize({width,height:900});await nav(p,tab);
   if(tab==='history'&&!await p.locator('#snapshotManager').evaluate(e=>e.open))await p.locator('#snapshotManager>summary').click();
   const category={positions:'positions',bookings:'bookings',history:'references'}[tab];
   for(const mode of category?['normal','management']:['normal']){
    if(mode==='management')await manageList(p,category);
    const result=await p.evaluate(tab=>{
     const nodes=[...document.querySelectorAll('.heading-row *,'+'#'+tab+'Page *')];
     const fonts=nodes.map(e=>[e,e.style.fontSize,parseFloat(getComputedStyle(e).fontSize)]);
     for(const [e,,size] of fonts)e.style.fontSize=2*size+'px';
     const result={width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:nodes.filter(e=>e.getClientRects().length&&(e.getBoundingClientRect().right>innerWidth+1||e.scrollWidth>e.clientWidth+1)).slice(0,12).map(e=>({tag:e.tagName,id:e.id,className:e.className,right:e.getBoundingClientRect().right,client:e.clientWidth,scroll:e.scrollWidth,text:e.textContent.slice(0,70)}))};
     globalThis.__restoreFontScale=()=>{for(const [e,previous]of fonts)e.style.fontSize=previous;};return result;
    },tab);
    try{
     await p.screenshot({path:'artifacts/gates/ui-textscale/'+engine+'-'+width+'-'+tab+'-'+mode+'.png',fullPage:true});
     assert.ok(result.scroll<=width+1,engine+' '+tab+' '+mode+' 200% text: '+JSON.stringify(result));
     results.push({engine,width,tab,mode,result:'PASS'});
    }finally{await p.evaluate(()=>{globalThis.__restoreFontScale();delete globalThis.__restoreFontScale;});}
   }
   if(category){const done={positions:'#positionListHead [data-action=cancel-selection]',bookings:'#bookingListHead [data-booking-manage=cancel]',history:'#manageReferences'}[tab];await p.locator(done).click();}
  }
  assert.equal(await record(p),before,'text scaling/navigation/management preserve the exact persisted record');
  console.log(engine+': computed 200% text at 320/768, lists normal/management and Mehr PASS');
 }finally{await browser.close();}
}
writeFileSync('artifacts/gates/ui-textscale/report.json',JSON.stringify({scope:'Synthetic computed font-size doubling, not OS/physical hardware or browser zoom',results},null,2));
