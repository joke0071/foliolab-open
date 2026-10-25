import {legacyContext} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await legacyContext(browser),a=await context.newPage(),b=await context.newPage();
try{
 await Promise.all([a.goto('http://127.0.0.1:4173/'),b.goto('http://127.0.0.1:4173/')]);
 for(const page of [a,b])await page.evaluate(async()=>{
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  window.store=new PortfolioStorage();window.draft=await store.initialize();
 });
 const results=await Promise.all([a,b].map(page=>page.evaluate(async()=>{
  const {createProvider}=await import('/src/model.js');draft.providers.push(createProvider({name:'Winner'}));
  try{await store.save(draft);return true;}catch{return false;}
 })));
 assert.deepEqual(results.sort(),[false,true]);
 const tombstone=await a.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();
  await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put({schemaVersion:1,revision:1,raw:null,deleted:false},'portfolio');tx.oncomplete=resolve;tx.onabort=reject;});
  try{await readPortfolioRecord(db);return false;}catch{return true;}finally{db.close();}
 });
 assert.equal(tombstone,true,'raw=null without a tombstone must fail closed');
 console.log('P0 STORAGE: real concurrent local tabs serialize, stale writer rejects, contradictory tombstone rejects PASS');
}finally{await context.close();await browser.close();}
