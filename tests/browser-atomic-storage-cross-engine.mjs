import assert from 'node:assert/strict';
import {firefox,webkit} from 'playwright';
for(const [name,engine] of [['Firefox',firefox],['WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext();
 const a=await context.newPage(),b=await context.newPage();
 const run=async(page,fn,args={})=>page.evaluate(fn,args);
 try{
  await Promise.all([a.goto('http://127.0.0.1:4173/tests/storage-origin.html'),b.goto('http://127.0.0.1:4173/tests/storage-origin.html')]);
  const initial=await run(a,async()=>{
   const {openPortfolioDB,commitPortfolioRecord}=await import('/src/atomic-storage.js');
   const {blankModel,backup}=await import('/src/model.js');
   const db=await openPortfolioDB();
   try{return await commitPortfolioRecord(db,{expectedRevision:null,raw:backup(blankModel())});}
   finally{db.close();}
  });
  assert.equal(initial.revision,1);
  const contender=async page=>run(page,async()=>{
   const {openPortfolioDB,commitPortfolioRecord}=await import('/src/atomic-storage.js');
   const {blankModel,backup,createProvider}=await import('/src/model.js');
   const db=await openPortfolioDB(),m=blankModel();
   m.providers.push(createProvider({name:'Concurrent provider'}));
   try{return await commitPortfolioRecord(db,{expectedRevision:1,raw:backup(m)});}
   finally{db.close();}
  });
  const contenders=await Promise.allSettled([contender(a),contender(b)]);
  assert.equal(contenders.filter(x=>x.status==='fulfilled').length,1,name+' must serialize concurrent transactions');
  assert.equal(contenders.filter(x=>x.status==='rejected').length,1);
  await a.close();await b.close();
  const third=await context.newPage();await third.goto('http://127.0.0.1:4173/tests/storage-origin.html');
  let record=await run(third,async()=>{
   const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
   const db=await openPortfolioDB();
   try{return await readPortfolioRecord(db);}finally{db.close();}
  });
  assert.equal(record.revision,2,name+' last-tab-close data loss');
  assert.equal(JSON.parse(record.raw).providers[0].name,'Concurrent provider');
  // Direct corruption is treated as corrupt source, never a blank portfolio.
  const altered=await run(third,async()=>{
   const {openPortfolioDB,readPortfolioRecord,commitPortfolioRecord}=await import('/src/atomic-storage.js');
   const {blankModel,backup}=await import('/src/model.js');
   const db=await openPortfolioDB();
   await new Promise((resolve,reject)=>{
    const tx=db.transaction('records','readwrite');
    tx.objectStore('records').put({schemaVersion:1,revision:2,raw:'{not valid',deleted:false,updatedAt:'2026-10-23'},'portfolio');
    tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
   });
   let readFailed=false,writeFailed=false;
   try{await readPortfolioRecord(db);}catch{readFailed=true;}
   try{await commitPortfolioRecord(db,{expectedRevision:2,raw:backup(blankModel())});}catch{writeFailed=true;}
   db.close();
   return {readFailed,writeFailed};
  });
  assert.deepEqual(altered,{readFailed:true,writeFailed:true});
  await third.close();
  console.log('ATOMIC STORAGE '+name+': concurrent CAS, restart persistence, corruption read/write guards PASS');
 }finally{await context.close();await browser.close();}
}
