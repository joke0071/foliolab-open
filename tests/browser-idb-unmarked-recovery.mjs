import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
for(const engine of (process.env.IDB_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[engine]).launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),page=await context.newPage();
 try{
  await page.goto('http://127.0.0.1:4173/tests/storage-origin.html');
  const expected=await page.evaluate(async()=>{
   const {openPortfolioDB}=await import('/src/atomic-storage.js');const {blankModel,createProvider,backup}=await import('/src/model.js');
   const db=await openPortfolioDB();const damaged={schemaVersion:1,revision:7,raw:'{damaged',settings:{alphaVantageKey:'SYNTHETIC_RECOVERY_KEY'},deleted:false,updatedAt:'2026-10-25'};
   await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put(damaged,'portfolio');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
   const m=blankModel();m.providers.push(createProvider({name:'Explicit recovery'}));m.settings.autoRefresh=false;
   return {damaged,raw:backup(m,{includeHistory:true})};
  });
  await page.goto('http://127.0.0.1:4173/');await page.locator('#downloadRaw').waitFor();
  assert.match(await page.locator('#portfolioStorageState').textContent(),/nicht verfügbar/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-storage-mode')),null);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#downloadRaw').click()]);
  assert.deepEqual(JSON.parse(await readFile(await download.path(),'utf8')),expected.damaged,'original bytes and settings remain downloadable');
  // Opening a recovery connection must not make ordinary saves possible.
  assert.equal(await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const {blankModel}=await import('/src/model.js');const s=new PortfolioStorage();try{await s.initialize();}catch{}await s.unverifiedBackup();try{await s.save(blankModel());return false;}catch{return true;}finally{s.close();}}),true);
  page.on('dialog',d=>d.accept());
  await page.locator('#backupFile').setInputFiles({name:'confirmed-backup.json',mimeType:'application/json',buffer:Buffer.from(expected.raw)});
  await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const result=await page.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();
   try{return {revision:s.revision,names:m.providers.map(x=>x.name),key:m.settings.alphaVantageKey,legacy:localStorage.getItem('foliolab-open-v1'),mode:localStorage.getItem('foliolab-open-storage-mode')};}finally{s.close();}
  });
  assert.deepEqual(result,{revision:8,names:['Explicit recovery'],key:'',legacy:null,mode:'idb-v1'});
  console.log(engine+': unmarked damaged record fail-closed, original download, ordinary saves denied, consented recovery/cutover PASS');
 }finally{await context.close();await browser.close();}
}
