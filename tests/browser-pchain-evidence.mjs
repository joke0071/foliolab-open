import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {PCHAIN_UTXO,PCHAIN_EXPECTED,OWNER_A,OWNER_B} from './pchain-evidence-fixture.mjs';
const base=process.env.PCHAIN_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const report={base,startedAt:new Date().toISOString(),scope:'Synthetic pure UTXO evidence only; no wallet query, mutation or financial integration',engines:[]};
mkdirSync('artifacts/gates',{recursive:true});
for(const engine of (process.env.PCHAIN_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 try{
  const context=await browser.newContext({ignoreHTTPSErrors:Boolean(proxy)}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const result=await page.evaluate(async({value,a,b})=>{
   const {decodePchainUTXO,inspectPchainUTXO}=await import('/src/pchain-evidence.js');
   const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
   const record=async()=>{const db=await openPortfolioDB();try{return JSON.stringify(await readPortfolioRecord(db));}finally{db.close();}};
   const local=()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));
   const before=await record(),prefsBefore=local();
   const raw=value.slice(2,-8),decoded=await decodePchainUTXO(value,{encoding:'hex'});
   const inspected=await inspectPchainUTXO(value,{encoding:'hexc',watchedPChainOwnerIds:[a],atTimeSeconds:'100'});
   const locked=await inspectPchainUTXO('0x'+raw.slice(0,140)+'00000016'+'0000000000000065'+raw.slice(140),{encoding:'hexnc',watchedPChainOwnerIds:[a],atTimeSeconds:'100'});
   const shared=await inspectPchainUTXO('0x'+raw.slice(0,188)+'00000002'+raw.slice(196)+b,{encoding:'hexnc',watchedPChainOwnerIds:[a],atTimeSeconds:'100'});
   const rejected=[];
   for(const [label,input,options]of [['corrupt checksum',value.slice(0,-1)+'0',{encoding:'hex'}],['unsupported codec','0x0001'+raw.slice(4),{encoding:'hexnc'}],['trailing byte','0x'+raw+'00',{encoding:'hexnc'}],['missing explicit encoding',value,{}]]){
    try{await decodePchainUTXO(input,options);rejected.push({label,rejected:false});}catch{rejected.push({label,rejected:true});}
   }
   return {decoded,inspected,locked,shared,rejected,idbUnchanged:before===await record(),prefsUnchanged:prefsBefore===local(),immutable:Object.isFrozen(decoded)&&Object.isFrozen(decoded.ownerIds)};
  },{value:PCHAIN_UTXO,a:OWNER_A,b:OWNER_B});
  assert.deepEqual(result.decoded,PCHAIN_EXPECTED);assert.equal(result.inspected.ownerCoverage,'declared-all');assert.equal(result.inspected.lockState,'unlocked');
  assert.equal(result.locked.lockState,'locked-stakeable');assert.equal(result.shared.ownerCoverage,'shared');assert.equal(result.shared.thresholdCovered,true);
  assert.equal(result.rejected.length,4);assert.ok(result.rejected.every(r=>r.rejected));assert.equal(result.idbUnchanged,true);assert.equal(result.prefsUnchanged,true);assert.equal(result.immutable,true);assert.deepEqual(errors,[]);
  report.engines.push({engine,version:browser.version(),result:'PASS',checks:result});
  console.log(engine+': P-Chain synthetic checked UTXO/exact uint64/owner coverage/locks/negative evidence/zero writes PASS');
 }finally{await browser.close();}
}
report.finishedAt=new Date().toISOString();report.result='PASS';
writeFileSync('artifacts/gates/pchain-evidence-'+(process.env.PCHAIN_ENGINES||'chromium').replaceAll(',','-')+'.json',JSON.stringify(report,null,2));
