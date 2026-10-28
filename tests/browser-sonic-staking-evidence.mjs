import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {sonicObservation} from './sonic-staking-evidence-fixture.mjs';
const base=process.env.SONIC_EVIDENCE_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const report={base,startedAt:new Date().toISOString(),scope:'Synthetic declared withdrawal observations only; no real wallet, RPC, financial integration or payment inference',engines:[]};
mkdirSync('artifacts/gates',{recursive:true});
for(const engine of (process.env.SONIC_EVIDENCE_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 try{
  const context=await browser.newContext({ignoreHTTPSErrors:Boolean(proxy)}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const result=await p.evaluate(async original=>{
   const {inspectSonicWithdrawal}=await import('/src/sonic-staking-evidence.js'),{openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
   const record=async()=>{const db=await openPortfolioDB();try{return JSON.stringify(await readPortfolioRecord(db));}finally{db.close();}};
   const prefs=()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));
   const before=await record(),prefsBefore=prefs(),inputBefore=JSON.stringify(original),copy=()=>structuredClone(original);
   const waiting=inspectSonicWithdrawal(original),timeOnly=copy();timeOnly.block.timestamp='110';
   const epochOnly=copy();epochOnly.epoch.value='12';
   const mature=copy();mature.block.timestamp='110';mature.epoch.value='12';
   const deactivated=copy();deactivated.validator.deactivatedTime='90';deactivated.validator.deactivatedEpoch='8';
   const empty=copy();empty.request.amountAtomic='0';empty.request.epoch='0';empty.request.time='0';
   const huge=copy();huge.request.amountAtomic='115792089237316195423570985008687907853269984665640564039457584007913129639935';
   const rejected=[];
   for(const field of ['source','request','validator','periods','epoch']){const bad=copy();bad[field].atBlockHash='0x'+'2'.repeat(64);try{inspectSonicWithdrawal(bad);rejected.push(false);}catch{rejected.push(true);}}
   for(const mutate of [o=>{o.source.runtimeSHA256='0'.repeat(64);},o=>{o.validator.validatorId='2';},o=>{o.request.amountAtomic=1;},o=>{o.block.timestamp=huge.request.amountAtomic;o.request.time=huge.request.amountAtomic;}]){const bad=copy();mutate(bad);try{inspectSonicWithdrawal(bad);rejected.push(false);}catch{rejected.push(true);}}
   return {waiting,timeOnly:inspectSonicWithdrawal(timeOnly),epochOnly:inspectSonicWithdrawal(epochOnly),mature:inspectSonicWithdrawal(mature),deactivated:inspectSonicWithdrawal(deactivated),empty:inspectSonicWithdrawal(empty),huge:inspectSonicWithdrawal(huge),rejected,idbUnchanged:before===await record(),prefsUnchanged:prefsBefore===prefs(),inputUnchanged:inputBefore===JSON.stringify(original),immutable:Object.isFrozen(waiting)&&Object.isFrozen(waiting.locator)&&Object.isFrozen(waiting.maturity)};
  },sonicObservation());
  assert.equal(result.waiting.status,'waiting');assert.equal(result.waiting.requestAmountAtomic,'9007199254740993');assert.equal(result.timeOnly.status,'waiting');assert.equal(result.epochOnly.status,'waiting');
  assert.equal(result.mature.status,'mature-pending');assert.equal(result.mature.paymentEvidence,'not-assessed');assert.equal(result.deactivated.maturity.releaseTime,'100');assert.equal(result.deactivated.maturity.releaseEpoch,'10');
  assert.equal(result.empty.status,'no-current-request');assert.equal(result.empty.paymentEvidence,'not-assessed');assert.equal(result.huge.requestAmountAtomic,'115792089237316195423570985008687907853269984665640564039457584007913129639935');
  assert.equal(result.rejected.length,9);assert.ok(result.rejected.every(Boolean));assert.equal(result.idbUnchanged,true);assert.equal(result.prefsUnchanged,true);assert.equal(result.inputUnchanged,true);assert.equal(result.immutable,true);assert.deepEqual(errors,[]);
  report.engines.push({engine,version:browser.version(),result:'PASS',checks:result});console.log(engine+': Sonic synthetic uint256/dual waiting periods/deactivation/empty-not-paid/mixed-pin rejection/zero writes PASS');
 }finally{await browser.close();}
}
report.finishedAt=new Date().toISOString();report.result='PASS';writeFileSync('artifacts/gates/sonic-evidence-'+(process.env.SONIC_EVIDENCE_ENGINES||'chromium').replaceAll(',','-')+'.json',JSON.stringify(report,null,2));
