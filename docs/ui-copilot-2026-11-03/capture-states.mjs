// Synthetic-data state capture for #288/#289: empty portfolio, open accordions, position detail, dialogs.
// Usage: node docs/ui-copilot-2026-11-03/capture-states.mjs <tag> [engines] [widths]   (UI_BASE overrides the server)
import {chromium,firefox} from 'playwright';
import {mkdirSync} from 'node:fs';
import {seed,ready,nav} from './capture.mjs';
const tag=process.argv[2]||'after',base=process.env.UI_BASE||'http://127.0.0.1:4173/';
const out=new URL('./img/',import.meta.url).pathname;mkdirSync(out,{recursive:true});
const widths=(process.argv[4]||'390,1440').split(',').map(Number);
for(const engine of (process.argv[3]||'chromium').split(',')){
 const browser=await({chromium,firefox}[engine]).launch({args:engine==='chromium'?['--no-sandbox']:[]});
 for(const w of widths){
  const shotFor=p=>async(n,full=false)=>p.screenshot({path:`${out}${tag}-${engine}-${w}-s-${n}.png`,fullPage:full});
  let ctx=await browser.newContext({viewport:{width:w,height:900},serviceWorkers:'block'}),p=await ctx.newPage(),shot=shotFor(p);
  await p.goto(base);await ready(p);await shot('empty-dashboard');
  await nav(p,'positions');await shot('empty-positions');await nav(p,'bookings');await shot('empty-bookings');await nav(p,'history');await shot('empty-history');
  await ctx.close();
  ctx=await browser.newContext({viewport:{width:w,height:900},serviceWorkers:'block'});p=await ctx.newPage();shot=shotFor(p);
  await p.goto(base);await ready(p);await seed(p);await p.reload();await ready(p);
  await nav(p,'more');
  await p.evaluate(()=>document.querySelectorAll('#morePage details:not([hidden])').forEach(d=>{d.open=true;}));await shot('more-open-full',true);
  await nav(p,'history');await p.evaluate(()=>document.querySelectorAll('#historyPage details:not(.history-calendar-popover)').forEach(d=>{d.open=true;}));
  await shot('history-open-full',true);
  await nav(p,'positions');await p.locator('.position-entry [data-action="detail"],.position-entry .holding-row button').first().click().catch(()=>{});await shot('position-detail');
  await nav(p,'dashboard');await p.locator('#addWizard,[data-go="positions"]').first().scrollIntoViewIfNeeded().catch(()=>{});
  await nav(p,'positions');
  for(const [id,name] of [['#addWizard','wizard'],['#addWallet','wallet']]){
   if(await p.locator(id).first().isVisible().catch(()=>false)){await p.locator(id).first().click();await p.waitForTimeout(300);await shot('dialog-'+name);await p.keyboard.press('Escape');await p.waitForTimeout(200);}
  }
  await ctx.close();
 }
 await browser.close();
}
