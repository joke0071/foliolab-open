import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {waitForAppServiceWorker,browserGateDeadline} from './browser-gate-deadline.mjs';
import {positionValueFilterBrowserContract} from './position-value-filter-browser-contract.mjs';
const finish=browserGateDeadline('targeted position value filter');
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport:{width:390,height:900}});
  await context.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/');await waitForAppServiceWorker(p);
  await p.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}});
  await positionValueFilterBrowserContract({p,record,engine});
  assert.deepEqual(errors,[]);console.log('POSITION_VALUE_FILTER_PASS '+engine);
 }finally{await browser.close();}
}
finish();
