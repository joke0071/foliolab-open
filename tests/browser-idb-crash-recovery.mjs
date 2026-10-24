import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const visit=async fn=>{
 const context=await browser.newContext(),page=await context.newPage();
 try{await page.goto('http://127.0.0.1:4173/');return await page.evaluate(fn);}
 finally{await context.close();}
};
try{
 const rollback=await visit(async()=>{
  const {blankModel,createProvider,persist,STORE_KEY}=await import('/src/model.js');
  const {PortfolioStorage,MODE_KEY,MODE_VALUE,REVERT_INTENT_KEY}=await import('/src/browser-portfolio-storage.js');
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const model=blankModel();model.settings.autoRefresh=false;
  model.providers.push(createProvider({name:'Original'}));persist(model);
  const initial=new PortfolioStorage();await initial.migrate(model);initial.close();
  const proxy={
   getItem:k=>localStorage.getItem(k),
   setItem:(k,v)=>localStorage.setItem(k,v),
   removeItem:k=>{if(k===MODE_KEY)throw Error('Simulated tab crash after IDB commit');localStorage.removeItem(k);}
  };
  const editing=new PortfolioStorage(proxy);
  const updated=await editing.initialize();
  updated.providers.push(createProvider({name:'Modified before rollback'}));
  await editing.save(updated);
  let interrupted=false;
  try{await editing.revert(updated);}catch(e){interrupted=/Simulated tab crash/.test(e.message);}
  const beforeMode=localStorage.getItem(MODE_KEY);
  const pending=localStorage.getItem(REVERT_INTENT_KEY);
  const db=await openPortfolioDB(),record=await readPortfolioRecord(db);db.close();
  editing.close();
  const recovered=new PortfolioStorage();
  const state=await recovered.initialize();
  const after={isIDB:recovered.isIndexedDB,mode:localStorage.getItem(MODE_KEY),
   pending:localStorage.getItem(REVERT_INTENT_KEY),
   names:state.providers.map(p=>p.name),
   localNames:JSON.parse(localStorage.getItem(STORE_KEY)).providers.map(p=>p.name)};
  recovered.close();
  return {interrupted,beforeMode,hasPending:Boolean(pending),revision:record.revision,
   deleted:record.deleted,raw:record.raw,after};
 });
 assert.equal(rollback.interrupted,true);
 assert.equal(rollback.beforeMode,'idb-v1');
 assert.equal(rollback.hasPending,true);
 assert.equal(rollback.revision,3);
 assert.equal(rollback.deleted,true);assert.equal(rollback.raw,null);
 assert.deepEqual(rollback.after,{isIDB:false,mode:null,pending:null,
  names:['Original','Modified before rollback'],
  localNames:['Original','Modified before rollback']});

 const noRevival=await visit(async()=>{
  const {blankModel,createProvider,persist,STORE_KEY}=await import('/src/model.js');
  const {PortfolioStorage,MODE_KEY,REVERT_INTENT_KEY}=await import('/src/browser-portfolio-storage.js');
  const model=blankModel();model.providers.push(createProvider({name:'To be deleted'}));
  model.settings.autoRefresh=false;persist(model);
  const store=new PortfolioStorage();await store.migrate(model);
  // An obsolete pending revert intent must not override an intentional reset.
  localStorage.setItem(REVERT_INTENT_KEY,JSON.stringify({revision:2,fingerprint:'irrelevant'}));
  const stale=localStorage.getItem(STORE_KEY);
  await store.removeAll();store.close();
  if(localStorage.getItem(STORE_KEY)!==null)throw Error('Delete must purge the legacy copy');
  localStorage.setItem(STORE_KEY,stale); // simulate stale legacy data returning after deletion
  const restored=new PortfolioStorage();
  const m=await restored.initialize();
  const result={idb:restored.isIndexedDB,providers:m.providers.length,
   intent:localStorage.getItem(REVERT_INTENT_KEY),mode:localStorage.getItem(MODE_KEY),
   legacy:JSON.parse(localStorage.getItem(STORE_KEY)).providers.length};
  restored.close();return result;
 });
 assert.deepEqual(noRevival,{idb:true,providers:0,intent:null,mode:'idb-v1',legacy:1});

 const legacyWriter=await visit(async()=>{
  const {blankModel,createProvider,persist,STORE_KEY}=await import('/src/model.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const m=blankModel();m.providers.push(createProvider({name:'Unchanged'}));
  m.settings.autoRefresh=false;persist(m);
  const old=localStorage.getItem(STORE_KEY);
  const store=new PortfolioStorage();await store.migrate(m);store.close();
  m.providers.push(createProvider({name:'Stale tab'}));
  let blocked=false;try{persist(m);}catch(e){blocked=/IndexedDB.*anderen Tab/.test(e.message);}
  return {blocked,unchanged:localStorage.getItem(STORE_KEY)===old};
 });
 assert.deepEqual(legacyWriter,{blocked:true,unchanged:true});
 const eviction=await visit(async()=>{
  const {blankModel,createProvider,persist,STORE_KEY}=await import('/src/model.js');
  const {PortfolioStorage,MODE_KEY}=await import('/src/browser-portfolio-storage.js');
  const {openPortfolioDB}=await import('/src/atomic-storage.js');
  const model=blankModel();model.settings.autoRefresh=false;
  model.providers.push(createProvider({name:'Legacy rescue copy'}));persist(model);
  const before=localStorage.getItem(STORE_KEY);
  const active=new PortfolioStorage();await active.migrate(model);active.close();
  // Proxy a browser storage eviction: the canonical IDB record disappears,
  // but a stale localStorage copy and IDB mode marker remain present.
  const db=await openPortfolioDB();
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('records','readwrite');
   tx.objectStore('records').delete('portfolio');
   tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
  });db.close();
  const reloaded=new PortfolioStorage();let stopped=false;
  try{await reloaded.initialize();}
  catch(e){stopped=/Speicher nicht gefunden|Datensatz fehlt|Aktiver IndexedDB-Speicher/.test(e.message);}
  const result={stopped,idbMode:reloaded.isIndexedDB,
   marker:localStorage.getItem(MODE_KEY),
   legacyUnchanged:localStorage.getItem(STORE_KEY)===before};
  reloaded.close();return result;
 });
 assert.deepEqual(eviction,{stopped:true,idbMode:true,marker:'idb-v1',legacyUnchanged:true});
 console.log('CRASH-RESILIENT ROLLBACK: interrupted mode marker, safe recovery, no reset revival, stale legacy guard, missing-IDB fail-closed PASS');
}finally{await browser.close();}
