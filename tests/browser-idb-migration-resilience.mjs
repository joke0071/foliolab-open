import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
async function testStaleSource(){
 const context=await browser.newContext(),page=await context.newPage();
 try{
  await page.goto('http://127.0.0.1:4173/');
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
   const fresh=load();
   await service.migrate(fresh);
   const activated=localStorage.getItem(MODE_KEY)==='idb-v1';
   const preserved=localStorage.getItem(STORE_KEY)===original;
   const verified=await service.reload();
   service.close();
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
  await page.goto('http://127.0.0.1:4173/');
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
  await page.goto('http://127.0.0.1:4173/');
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
try{
 await testStaleSource();await testInterruptedMarker();await testQuotaBeforeCommit();
 console.log('IDB MIGRATION RESILIENCE: stale legacy source, interrupted marker retry, quota rollback PASS');
}finally{await browser.close();}
