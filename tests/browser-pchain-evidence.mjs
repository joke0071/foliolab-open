import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {PCHAIN_UTXO,PCHAIN_EXPECTED,OWNER_A,OWNER_B} from './pchain-evidence-fixture.mjs';
import {ADDRESS_VECTORS} from './pchain-identity-fixture.mjs';
const base=process.env.PCHAIN_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const report={base,startedAt:new Date().toISOString(),scope:'Synthetic pure UTXO evidence only; no wallet query, mutation or financial integration',engines:[]};
mkdirSync('artifacts/gates',{recursive:true});
for(const engine of (process.env.PCHAIN_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 try{
  const context=await browser.newContext({ignoreHTTPSErrors:Boolean(proxy)}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const result=await page.evaluate(async({value,a,b,addresses})=>{
   const {decodePchainUTXO,inspectPchainUTXO}=await import('/src/pchain-evidence.js');
   const {decodePchainAddress,pchainUTXOIdentity}=await import('/src/pchain-identity.js');
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
   const owner=decodePchainAddress(addresses.avax_aa,{networkID:'1'}),fuji=decodePchainAddress(addresses.fuji_aa,{networkID:'5'}),chain='0'.repeat(64);
   const identityContext={networkID:'1',sourceChainId:chain,destinationChainId:chain};
   const identity=pchainUTXOIdentity(decoded,identityContext),same=pchainUTXOIdentity(inspected.utxo,identityContext);
   const atomic=pchainUTXOIdentity(decoded,{...identityContext,sourceChainId:'c'.repeat(64)}),otherNetwork=pchainUTXOIdentity(decoded,{...identityContext,networkID:'5'});
   const identityRejected=[];
   for(const [label,run]of [
    ['network mismatch',()=>decodePchainAddress(addresses.avax_aa,{networkID:'5'})],
    ['bad checksum',()=>decodePchainAddress(addresses.avax_aa.slice(0,-1)+'q',{networkID:'1'})],
    ['EVM is not P address',()=>decodePchainAddress('0x'+a,{networkID:'1'})],
    ['wrong chain',()=>decodePchainAddress(addresses.avax_aa.replace('P-','X-'),{networkID:'1'})],
    ['Bech32m',()=>decodePchainAddress(addresses.avax_bech32m,{networkID:'1'})],
    ['missing chain context',()=>pchainUTXOIdentity(decoded,{networkID:'1'})],
    ['unsafe output index',()=>pchainUTXOIdentity({...decoded,outputIndex:4294967296},identityContext)]
   ]){try{run();identityRejected.push({label,rejected:false});}catch{identityRejected.push({label,rejected:true});}}
   return {decoded,inspected,locked,shared,rejected,owner,fuji,identity,sameKey:identity.key===same.key,contextSeparated:identity.key!==atomic.key&&identity.key!==otherNetwork.key,identityRejected,idbUnchanged:before===await record(),prefsUnchanged:prefsBefore===local(),immutable:Object.isFrozen(decoded)&&Object.isFrozen(decoded.ownerIds)&&Object.isFrozen(owner)&&Object.isFrozen(identity)};
  },{value:PCHAIN_UTXO,a:OWNER_A,b:OWNER_B,addresses:ADDRESS_VECTORS});
  assert.deepEqual(result.decoded,PCHAIN_EXPECTED);assert.equal(result.inspected.ownerCoverage,'declared-all');assert.equal(result.inspected.lockState,'unlocked');
  assert.equal(result.locked.lockState,'locked-stakeable');assert.equal(result.shared.ownerCoverage,'shared');assert.equal(result.shared.thresholdCovered,true);
  assert.equal(result.rejected.length,4);assert.ok(result.rejected.every(r=>r.rejected));assert.equal(result.idbUnchanged,true);assert.equal(result.prefsUnchanged,true);assert.equal(result.immutable,true);assert.deepEqual(errors,[]);
  assert.equal(result.owner.ownerId,OWNER_A);assert.equal(result.fuji.ownerId,OWNER_A);assert.notEqual(result.owner.ownerKey,result.fuji.ownerKey);
  assert.equal(result.sameKey,true);assert.equal(result.contextSeparated,true);assert.equal(result.identity.kind,'native');assert.equal(result.identityRejected.length,7);assert.ok(result.identityRejected.every(r=>r.rejected));
  report.engines.push({engine,version:browser.version(),result:'PASS',checks:result});
  console.log(engine+': P-Chain synthetic checked UTXO/exact uint64/owner coverage/locks/address and context identity/negative evidence/zero writes PASS');
 }finally{await browser.close();}
}
report.finishedAt=new Date().toISOString();report.result='PASS';
writeFileSync('artifacts/gates/pchain-evidence-'+(process.env.PCHAIN_ENGINES||'chromium').replaceAll(',','-')+'.json',JSON.stringify(report,null,2));
