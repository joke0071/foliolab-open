import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {waitForAppServiceWorker} from '../../../tests/browser-gate-deadline.mjs';
const deadline=setTimeout(()=>process.exit(1),15000);
const browser=await chromium.launch({headless:true}),p=await browser.newPage();
let release,requested;const blocked=new Promise(r=>release=r),seen=new Promise(r=>requested=r);
try{
 await p.route('**/src/header-status.js',async route=>{requested();await blocked;await route.continue();});
 await p.goto('http://127.0.0.1:4173/',{waitUntil:'commit'});await seen;
 const old=await p.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.active?.state==='activated';},null,{timeout:60000});
 const oldValue=await old.jsonValue();await old.dispose();assert.equal(oldValue,false,'original async predicate completed with FALSE instead of polling');
 const corrected=waitForAppServiceWorker(p);assert.equal(await Promise.race([corrected.then(()=> 'early'),new Promise(r=>setTimeout(()=>r('pending'),100))]),'pending','corrected native readiness cannot complete while actual script is blocked');
 await p.reload({waitUntil:'commit'});assert.equal(await Promise.race([corrected.then(()=> 'early'),new Promise(r=>setTimeout(()=>r('pending'),100))]),'pending','real document navigation does not resolve or reject readiness while startup remains blocked');
 release();await corrected;const state=await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {active:r.active.state,script:r.active.scriptURL};});assert.equal(state.active,'activated');assert.equal(state.script,'http://127.0.0.1:4173/sw.js');
 const report={result:'PASS',scope:'synthetic controlled transport delay of the real app startup module; unchanged real SW, no replacement worker',oldAsyncPredicateReturnedFalse:oldValue===false,correctedWaitStayedPendingUntilRealActivation:true,survivedActualNavigation:true,state,helperSHA256:createHash('sha256').update(readFileSync('tests/browser-gate-deadline.mjs')).digest('hex')};mkdirSync('artifacts/gates/history-worker',{recursive:true});writeFileSync('artifacts/gates/history-worker/readiness-negative-control.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{clearTimeout(deadline);release();await browser.close();}
