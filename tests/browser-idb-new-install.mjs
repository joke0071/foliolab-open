import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
const engines={chromium,firefox,webkit};
for(const name of (process.env.IDB_ENGINES||'chromium').split(',')){
 const browser=await engines[name].launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext(),a=await context.newPage(),b=await context.newPage();
 const origin='http://127.0.0.1:4173/tests/storage-origin.html';
 try{
  await Promise.all([a.goto(origin),b.goto(origin)]);
  const init=page=>page.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   window.service=new PortfolioStorage();window.model=await service.initialize();
   return {idb:service.isIndexedDB,revision:service.revision,legacy:localStorage.getItem('foliolab-open-v1')};
  });
  assert.deepEqual(await init(a),{idb:true,revision:1,legacy:null});
  assert.deepEqual(await init(b),{idb:true,revision:1,legacy:null});
  const commit=page=>page.evaluate(async()=>{
   const {createProvider}=await import('/src/model.js');
   model.providers.push(createProvider({name:'Confirmed'}));await service.save(model);
   return service.revision;
  });
  const writers=await Promise.allSettled([commit(a),commit(b)]);
  assert.equal(writers.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(writers.filter(x=>x.status==='rejected').length,1);
  await a.close();await b.close();
  const c=await context.newPage();await c.goto(origin);
  assert.deepEqual(await c.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const s=new PortfolioStorage(),m=await s.initialize();
   const result={idb:s.isIndexedDB,revision:s.revision,names:m.providers.map(x=>x.name),legacy:localStorage.getItem('foliolab-open-v1')};s.close();return result;
  }),{idb:true,revision:2,names:['Confirmed'],legacy:null});
  console.log(name+': fresh IDB, simultaneous CAS, last-tab-close restart, no local mirror PASS');
 }finally{await context.close();}
 // New-store failure and interruption gates use isolated browser profiles.
 for(const fault of ['unavailable','quota','marker','orphan','changed-settings','invalid-settings']){
  const ctx=await browser.newContext(),p=await ctx.newPage();
  try{
   await p.goto(origin);
   const result=await p.evaluate(async fault=>{
    const {PortfolioStorage,MODE_KEY}=await import('/src/browser-portfolio-storage.js');
    const {blankModel,backup}=await import('/src/model.js');
    const {openPortfolioDB,commitPortfolioRecord,readPortfolioRecord,readUnverifiedRecord}=await import('/src/atomic-storage.js');
    const originalPut=IDBObjectStore.prototype.put,originalOpen=indexedDB.open;
    if(fault==='orphan'){
     const db=await openPortfolioDB(),m=blankModel();m.settings.eodhdKey='SYNTHETIC_UNCONFIRMED';
     await commitPortfolioRecord(db,{expectedRevision:null,raw:backup(m),settings:m.settings});db.close();
    }
    if(fault==='quota')IDBObjectStore.prototype.put=function(){throw new DOMException('simulated quota','QuotaExceededError');};
    if(['changed-settings','invalid-settings'].includes(fault))IDBObjectStore.prototype.put=function(record,key){
     return originalPut.call(this,{...record,settings:{...record.settings,eodhdKey:fault==='invalid-settings'?42:'SYNTHETIC_CHANGED'}},key);
    };
    if(fault==='unavailable')indexedDB.open=()=>{throw Error('simulated unavailable IndexedDB');};
    const storage={getItem:k=>localStorage.getItem(k),removeItem:k=>localStorage.removeItem(k),setItem:(k,v)=>{
     if(fault==='marker'&&k===MODE_KEY)throw Error('simulated marker interruption');localStorage.setItem(k,v);
    }};
    const s=new PortfolioStorage(storage);let failed=false,saveBlocked=false;
    try{await s.initialize();}catch{failed=true;}
    try{await s.save(blankModel());}catch{saveBlocked=true;}
    IDBObjectStore.prototype.put=originalPut;indexedDB.open=originalOpen;s.close();
    let resumed=null;
    if(fault==='marker'){
     const retry=new PortfolioStorage();await retry.initialize();resumed={idb:retry.isIndexedDB,revision:retry.revision};retry.close();
    }
    const db=await openPortfolioDB(),record=await readUnverifiedRecord(db);let invalidRejected=false;
    try{await readPortfolioRecord(db);}catch{invalidRejected=true;}db.close();
    return {invalidRejected,failed,saveBlocked,legacy:localStorage.getItem('foliolab-open-v1'),mode:localStorage.getItem(MODE_KEY),resumed,record:record===null?null:record.revision};
   },fault);
   if(fault==='invalid-settings')assert.equal(result.invalidRejected,true);
   assert.equal(result.failed,true,fault);assert.equal(result.saveBlocked,true,fault);assert.equal(result.legacy,null,fault);
   if(fault==='marker')assert.deepEqual(result.resumed,{idb:true,revision:1});
   else assert.equal(result.mode,null,fault);
   if(['quota','unavailable'].includes(fault))assert.equal(result.record,null,fault);
   console.log(name+': new-store '+fault+' fail-closed/retry PASS');
  }finally{await ctx.close();}
 }
 // The real app (not only the controller) starts in IDB and awaits UI commits.
 const uiContext=await browser.newContext({viewport:{width:390,height:844}}),ui=await uiContext.newPage();
 try{
  await ui.goto('http://127.0.0.1:4173/');await ui.locator('#mobileNav [data-page="more"]').click();
  assert.match(await ui.locator('#portfolioStorageState').textContent(),/IndexedDB aktiv/);
  await ui.locator('#addProvider').click();await ui.locator('#providerName').fill('Fresh IDB Bank');await ui.locator('#saveDialog').click();await ui.locator('#editDialog').waitFor({state:'hidden'});
  await ui.reload();await ui.locator('#mobileNav [data-page="more"]').click();
  assert.match(await ui.locator('#providerSettings').textContent(),/Fresh IDB Bank/);
  assert.equal(await ui.evaluate(()=>localStorage.getItem('foliolab-open-v1')),null);
  console.log(name+': real new-install UI save/reload without local portfolio PASS');
 }finally{await uiContext.close();}
 await browser.close();
}
