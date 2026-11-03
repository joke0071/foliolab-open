// Reproducible responsive sweep for #288/#289 (synthetic data only). Usage: UI_BASE=http://127.0.0.1:4173/ SWEEP_ENGINES=chromium,firefox node sweep.mjs
// Browser zoom is emulated by shrinking the CSS viewport (width/zoom, never below 320 CSS px; zoom 2 = 200%). Not a substitute for Android font scaling or physical devices.
import {chromium,firefox} from 'playwright';
import {seed,ready,nav} from './capture.mjs';
import {writeFileSync} from 'node:fs';
const base=process.env.UI_BASE||'http://127.0.0.1:4173/',widths=[320,360,390,412,430,768,1024,1440],engines=(process.env.SWEEP_ENGINES||'chromium').split(',');
const findings=[],rows=[];
const measure=(p,tag)=>p.evaluate(tag=>{const vw=document.documentElement.clientWidth,over=document.documentElement.scrollWidth-vw;
 const wide=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&e.offsetParent&&getComputedStyle(e).position!=='fixed'&&!e.closest('[hidden],.sr-only,details:not([open])>:not(summary)')&&(r.right>vw+1||r.left<-1)&&!e.closest('.chart-scroll,.table-scroll')}).slice(0,4).map(e=>(e.id||e.className||e.tagName).toString().slice(0,40));
 const small=[...document.querySelectorAll('button,a[href],input,select,summary,[role=button]')].filter(e=>{const r=e.getBoundingClientRect(),t=e.type==='checkbox'||e.type==='radio';return e.offsetParent&&!t&&r.width>0&&(r.width<44||r.height<44)&&!e.closest('.sr-only')&&getComputedStyle(e).visibility!=='hidden'}).map(e=>(e.id||e.dataset.action||e.textContent.trim().slice(0,20)||e.tagName)).slice(0,5);
 return {tag,over,wide,small}},tag);
for(const engine of engines){
 const browser=await({chromium,firefox}[engine]).launch({args:engine==='chromium'?['--no-sandbox']:[]});
 for(const w of widths)for(const zoom of [1,1.5,2]){
  if(w/zoom<320)continue;
  const ctx=await browser.newContext({viewport:{width:Math.round(w/zoom),height:Math.round(800/zoom)},serviceWorkers:'block'}),p=await ctx.newPage();
  await p.goto(base);await ready(p);await seed(p);await p.reload();await ready(p);
  const rec=async t=>{const m=await measure(p,t);m.engine=engine;m.w=w;m.zoom=zoom;rows.push(m);if(m.over>0||m.wide.length)findings.push(m)};
  await nav(p,'dashboard');await rec('dashboard');
  await nav(p,'positions');await rec('positions-normal');
  await p.locator('#positionListHead [data-action="select-positions"]').click();await rec('positions-manage');await p.locator('#positionListHead [data-action="cancel-selection"]').click();
  await nav(p,'bookings');await rec('bookings-normal');
  await p.locator('#bookingListHead [data-booking-manage="select"]').click();await rec('bookings-manage');await p.locator('#bookingListHead [data-booking-manage="cancel"],#bookingManagementTools [data-booking-manage="cancel"]').first().click();
  await nav(p,'history');await p.evaluate(()=>document.querySelectorAll('#historyPage details.performance-details,#snapshotManager').forEach(d=>d.open=true));await rec('history-open');
  await p.locator('#manageReferences').click();await rec('history-manage');await p.locator('#manageReferences').click();
  await nav(p,'more');await p.evaluate(()=>document.querySelectorAll('#morePage details').forEach(d=>d.open=true));await rec('more-open');
  for(const id of ['addWizard','addWallet']){await nav(p,'positions');await p.locator('#'+id).click();await p.locator('dialog[open]').first().waitFor({timeout:5000});await rec('dialog-'+id);
   const fits=await p.evaluate(()=>{const d=document.querySelector('dialog[open]').getBoundingClientRect();return d.bottom<=innerHeight+1&&d.top>=-1});
   if(!fits)findings.push({tag:'dialog-'+id+' exceeds viewport',engine,w,zoom});
   await p.keyboard.press('Escape');await p.waitForTimeout(150);if(await p.locator('dialog[open]').count())await p.locator('dialog[open] [data-close],dialog[open] .close,dialog[open] button[aria-label*="chlie"]').first().click().catch(()=>{});}
  await ctx.close();
 }
 await browser.close();
}
const smallAll=rows.filter(r=>r.small.length);
writeFileSync(new URL('./sweep-result.json',import.meta.url),JSON.stringify({scans:rows.length,overflowFindings:findings,smallTargets:smallAll.slice(0,40)},null,1));
console.log('SWEEP scans',rows.length,'overflow findings',findings.length,'rows with <44px targets',smallAll.length);
if(findings.length){console.log(JSON.stringify(findings.slice(0,8)));process.exitCode=1}
