import {legacyContext} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await legacyContext(browser),a=await context.newPage(),b=await context.newPage();
try{
 await a.goto('http://127.0.0.1:4173/');
 await a.evaluate(async()=>{
  const {fixture}=await import('/tests/p0-import-fixture.mjs');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const s=new PortfolioStorage(),m=fixture();await s.initialize();await s.save(m);await s.migrate(m);s.close();
 });
 await b.goto('http://127.0.0.1:4173/');
 const faults=await a.evaluate(async()=>{
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const {csv,preview}=await import('/tests/p0-import-fixture.mjs');
  const {importCSV}=await import('/src/csv-import.js');
  const s=new PortfolioStorage(),original=await s.initialize(),revision=s.revision;
  const put=IDBObjectStore.prototype.put;const results=[];
  for(const fault of ['quota','abort']){
   const draft=structuredClone(original);importCSV(draft,preview(draft,csv()));
   IDBObjectStore.prototype.put=function(...args){
    if(fault==='quota')throw new DOMException('Injected quota','QuotaExceededError');
    const result=put.apply(this,args);this.transaction.abort();return result;
   };
   let rejected=false;try{await s.save(draft);}catch{rejected=true;}finally{IDBObjectStore.prototype.put=put;}
   const reloaded=await s.reload();results.push({fault,rejected,revision:s.revision,count:reloaded.bookings.length});
  }
  s.close();return {revision,results};
 });
 assert.ok(faults.results.every(r=>r.rejected&&r.count===0&&r.revision===faults.revision));
 for(const p of [a,b])await p.evaluate(async()=>{
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const {csv,preview}=await import('/tests/p0-import-fixture.mjs');
  window.s=new PortfolioStorage();window.m=await s.initialize();window.p=preview(m,csv());
 });
 const outcomes=await Promise.all([a,b].map(p=>p.evaluate(async()=>{
  const {importCSV}=await import('/src/csv-import.js');
  importCSV(m,window.p);try{await s.save(m);return true;}catch{return false;}finally{s.close();}
 })));
 assert.deepEqual(outcomes.sort(),[false,true]);
 const result=await a.evaluate(async()=>{
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const {csv,preview}=await import('/tests/p0-import-fixture.mjs');
  const {safeImport,backup}=await import('/src/model.js');
  const s=new PortfolioStorage(),m=await s.initialize(),restored=safeImport(JSON.parse(backup(m))),p=preview(restored,csv());
  s.close();return {count:m.bookings.length,ready:p.ready,duplicates:p.duplicates,issues:p.issues.length};
 });
 assert.deepEqual(result,{count:1,ready:0,duplicates:1,issues:0});
 console.log('P0 IMPORT: quota/abort rollback, two-tab CAS, restart, backup restore and idempotence PASS');
}finally{await context.close();await browser.close();}
