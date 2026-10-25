import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
async function testStaleSource(){
 const context=await browser.newContext(),page=await context.newPage();
 try{
  await page.goto('http://127.0.0.1:4173/tests/storage-origin.html');
  const result=await page.evaluate(async()=>{
   const {blankModel,createProvider,persist,load,STORE_KEY}=await import('/src/model.js');
   const {PortfolioStorage,MODE_KEY}=await import('/src/browser-portfolio-storage.js');
   const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
   const starting=blankModel();starting.providers.push(createProvider({name:'Initial'}));
   starting.settings.autoRefresh=false;starting.settings.eodhdKey='SYNTHETIC_A';
   persist(starting);
   const service=new PortfolioStorage();const stale=await service.initialize();
   const changed=JSON.parse(localStorage.getItem(STORE_KEY));
   changed.providers.push(createProvider({name:'Committed in another tab'}));
   changed.settings.eodhdKey='SYNTHETIC_B';
   localStorage.setItem(STORE_KEY,JSON.stringify(changed));
   const original=localStorage.getItem(STORE_KEY);
   let blocked=false;
   try{await service.migrate(stale);}catch(e){blocked=/anderen Tab geändert/.test(e.message);}
   const noMarker=localStorage.getItem(MODE_KEY)===null;
   const db=await openPortfolioDB();
   const noPartialWrite=(await readPortfolioRecord(db))===null;
   db.close();
   // An actual app reload constructs a fresh controller that observes the new
   // canonical legacy bytes before consenting to migration again.
   const reloadedService=new PortfolioStorage();
   const fresh=await reloadedService.initialize();
   await reloadedService.migrate(fresh);
   const activated=localStorage.getItem(MODE_KEY)==='idb-v1';
   const preserved=localStorage.getItem(STORE_KEY)===original;
   const verified=await reloadedService.reload();
   reloadedService.close();service.close();
   return {blocked,noMarker,noPartialWrite,activated,preserved,
    names:verified.providers.map(x=>x.name),key:verified.settings.eodhdKey};
  });
  assert.deepEqual(result,{blocked:true,noMarker:true,noPartialWrite:true,activated:true,preserved:true,
   names:['Initial','Committed in another tab'],key:'SYNTHETIC_B'});
 }finally{await context.close();}
}
async function testInterruptedMarker(){
 const context=await browser.newContext(),page=await context.newPage();
 try{
  await page.goto('http://127.0.0.1:4173/tests/storage-origin.html');
  const result=await page.evaluate(async()=>{
   const {blankModel,createProvider,persist,STORE_KEY}=await import('/src/model.js');
   const {PortfolioStorage,MODE_KEY}=await import('/src/browser-portfolio-storage.js');
   const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
   const m=blankModel();m.providers.push(createProvider({name:'Interrupted migration'}));
   m.settings.autoRefresh=false;persist(m);
   const original=localStorage.getItem(STORE_KEY);
   let failed=false;
   const proxy={
    getItem:k=>localStorage.getItem(k),
    setItem:(k,v)=>{if(k===MODE_KEY)throw new DOMException('Simulated interrupted marker','QuotaExceededError');localStorage.setItem(k,v);},
    removeItem:k=>localStorage.removeItem(k)
   };
   const failing=new PortfolioStorage(proxy);
   try{await failing.migrate(m);}catch(e){failed=e.name==='QuotaExceededError';}
   const firstDB=await openPortfolioDB(),first=await readPortfolioRecord(firstDB);
   firstDB.close();
   const oldMode=localStorage.getItem(MODE_KEY)===null;
   const intact=localStorage.getItem(STORE_KEY)===original;
   const retry=new PortfolioStorage();
   await retry.migrate(m);
   const active=localStorage.getItem(MODE_KEY)==='idb-v1';
   const second=await retry.reload();retry.close();
   return {failed,oldMode,intact,stagedRevision:first.revision,
     active,provider:second.providers[0].name};
  });
  assert.deepEqual(result,{failed:true,oldMode:true,intact:true,stagedRevision:1,
   active:true,provider:'Interrupted migration'});
 }finally{await context.close();}
}
async function testQuotaBeforeCommit(){
 const context=await browser.newContext(),page=await context.newPage();
 try{
  await page.goto('http://127.0.0.1:4173/tests/storage-origin.html');
  const result=await page.evaluate(async()=>{
   const {blankModel,createProvider,persist,STORE_KEY}=await import('/src/model.js');
   const {PortfolioStorage,MODE_KEY}=await import('/src/browser-portfolio-storage.js');
   const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
   const m=blankModel();m.providers.push(createProvider({name:'No partial quota write'}));persist(m);
   const raw=localStorage.getItem(STORE_KEY);
   const original=IDBObjectStore.prototype.put;
   let denied=false;IDBObjectStore.prototype.put=function(){throw new DOMException('Simulated quota exhaustion','QuotaExceededError');};
   try{await new PortfolioStorage().migrate(m);}catch(e){denied=e.name==='QuotaExceededError';}
   finally{IDBObjectStore.prototype.put=original;}
   const db=await openPortfolioDB();
   const record=await readPortfolioRecord(db);db.close();
   return {denied,record,legacyUnchanged:localStorage.getItem(STORE_KEY)===raw,marker:localStorage.getItem(MODE_KEY)};
  });
  assert.deepEqual(result,{denied:true,record:null,legacyUnchanged:true,marker:null});
 }finally{await context.close();}
}
async function testLegacyFormats(){
 for(const version of [1,2,3]){
  const context=await browser.newContext(),page=await context.newPage();
  try{
   await page.goto('http://127.0.0.1:4173/tests/storage-origin.html');
   const result=await page.evaluate(async version=>{
    const {blankModel,createProvider,STORE_KEY}=await import('/src/model.js');
    const {PortfolioStorage,MODE_KEY}=await import('/src/browser-portfolio-storage.js');
    const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
    const old=blankModel();
    old.version=version;old.settings.eodhdKey='SYNTHETIC_V'+version;old.providers.push(createProvider({name:'Legacy v'+version}));
    if(version===1)delete old.accounts;
    localStorage.setItem(STORE_KEY,JSON.stringify(old));
    const raw=localStorage.getItem(STORE_KEY);
    const service=new PortfolioStorage();
    const normalized=await service.initialize();
    await service.migrate(normalized);
    const db=await openPortfolioDB();
    const record=await readPortfolioRecord(db);
    db.close();service.close();
    return {mode:localStorage.getItem(MODE_KEY),bytesPreserved:localStorage.getItem(STORE_KEY)===raw,
     revision:record.revision,version:JSON.parse(record.raw).version,key:record.settings.eodhdKey,
     accounts:JSON.parse(record.raw).accounts.length,name:JSON.parse(record.raw).providers[0].name};
   },version);
   assert.equal(result.mode,'idb-v1');
   assert.equal(result.bytesPreserved,true);
   assert.equal(result.revision,1);
   assert.equal(result.version,3);
   assert.equal(result.key,'SYNTHETIC_V'+version);
   assert.ok(result.accounts>=0);
   assert.equal(result.name,'Legacy v'+version);
   if(version===1)assert.ok(result.accounts>=1);
  }finally{await context.close();}
 }
}
async function testVerifiedCutover(){
 for(const fault of ['portfolio','settings','source-during-commit']){
  const context=await browser.newContext(),page=await context.newPage();
  try{
   await page.goto('http://127.0.0.1:4173/tests/storage-origin.html');
   const r=await page.evaluate(async fault=>{
    const {blankModel,createProvider,persist,STORE_KEY}=await import('/src/model.js');
    const {PortfolioStorage,MODE_KEY}=await import('/src/browser-portfolio-storage.js');
    const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
    const m=blankModel();m.providers.push(createProvider({name:'Confirmed source'}));m.settings.autoRefresh=false;persist(m);
    const source=localStorage.getItem(STORE_KEY),s=new PortfolioStorage(),loaded=await s.initialize();
    const put=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(record,key){
     if(fault==='portfolio'){const data=JSON.parse(record.raw);data.providers[0].name='Altered';record={...record,raw:JSON.stringify(data)};}
     if(fault==='settings')record={...record,settings:{...record.settings,eodhdKey:'SYNTHETIC_ALTERED'}};
     if(fault==='source-during-commit')localStorage.setItem(STORE_KEY,source+' ');
     return put.call(this,record,key);
    };
    let rejected=false;try{await s.migrate(loaded);}catch{rejected=true;}finally{IDBObjectStore.prototype.put=put;s.close();}
    const db=await openPortfolioDB(),before=await readPortfolioRecord(db);db.close();
    const modeBeforeRetry=localStorage.getItem(MODE_KEY);
    const retry=new PortfolioStorage(),fresh=await retry.initialize();let retryRejected=false;
    try{await retry.migrate(fresh);}catch{retryRejected=true;}finally{retry.close();}
    const check=await openPortfolioDB(),after=await readPortfolioRecord(check);check.close();
    return {rejected,mode:modeBeforeRetry,source:localStorage.getItem(STORE_KEY)===source+(fault==='source-during-commit'?' ':''),retryRejected,unchanged:JSON.stringify(before)===JSON.stringify(after)};
   },fault);
   assert.equal(r.rejected,true,fault);assert.equal(r.mode,null,fault);assert.equal(r.source,true,fault);
   if(fault!=='source-during-commit'){assert.equal(r.retryRejected,true,fault);assert.equal(r.unchanged,true,fault);}
  }finally{await context.close();}
 }
}
try{
 await testStaleSource();await testInterruptedMarker();await testQuotaBeforeCommit();
 await testLegacyFormats();await testVerifiedCutover();
 console.log('IDB MIGRATION RESILIENCE: stale bytes, interrupted marker retry, quota rollback, v1/v2/v3 keys, full readback/source cutover verification PASS');
}finally{await browser.close();}
