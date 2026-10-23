import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
const page=await context.newPage();
try{
 await page.goto('http://127.0.0.1:4173/');
 const backupFile=await page.evaluate(async()=>{
  const {blankModel,createProvider,persist,backup}=await import('/src/model.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const m=blankModel();m.providers.push(createProvider({name:'Recovery broker'}));
  m.settings.eodhdKey='SYNTHETIC_RECOVERY_SECRET';m.settings.autoRefresh=false;
  persist(m);const raw=backup(m);
  const storage=new PortfolioStorage();await storage.migrate(m);storage.close();
  return raw;
 });
 await page.evaluate(async()=>{
  const {openPortfolioDB}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('records','readwrite');
   tx.objectStore('records').put({
    schemaVersion:1,revision:1,raw:'{corrupt',settings:{eodhdKey:'SYNTHETIC_RECOVERY_SECRET'},
    deleted:false,updatedAt:'2026-10-23'
   },'portfolio');
   tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
  });db.close();
 });
 await page.reload();
 assert.match(await page.locator('#notice').innerText(),/beschädigt|nicht lesbar/);
 assert.match(await page.locator('#notice').innerText(),/API-Schlüssel/);
 const download=page.waitForEvent('download');
 await page.locator('#downloadRaw').click();
 assert.match((await download).suggestedFilename(),/idb-original/);
 page.on('dialog',async d=>d.accept());
 await page.locator('#recoverBackup').click();
 const recoveredNavigation=page.waitForEvent('framenavigated',{timeout:15000});
 await page.locator('#backupFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backupFile)});
 await recoveredNavigation;
 await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent?.includes('IndexedDB aktiv'),null,{timeout:15000});
 const state=await page.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}
 });
 assert.equal(state.revision,2);
 assert.equal(JSON.parse(state.raw).providers[0].name,'Recovery broker');
 assert.equal(state.settings.eodhdKey,'');
 assert.ok(!state.raw.includes('SYNTHETIC_RECOVERY_SECRET'));
 await page.locator('#mobileNav [data-page="more"]').click();
 assert.match(await page.locator('#portfolioStorageState').innerText(),/IndexedDB aktiv/);
 console.log('IDB RECOVERY: original export, explicit repair, atomic revision and no secret revival PASS');
}finally{await context.close();await browser.close();}
