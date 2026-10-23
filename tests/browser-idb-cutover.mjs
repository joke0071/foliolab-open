import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:850},acceptDownloads:true});
const page=await context.newPage();
try{
 await page.goto('http://127.0.0.1:4173/');
 // Existing legacy data plus locally configured credentials.
 await page.evaluate(async()=>{
  const {blankModel,createProvider,persist}=await import('/src/model.js');
  const model=blankModel();model.providers.push(createProvider({name:'Legacy Bank',type:'bank'}));
  model.settings.eodhdKey='SYNTHETIC_LOCAL_SECRET_FOR_TEST';
  model.settings.autoRefresh=false;
  persist(model);
 });
 await page.reload();
 const oldRaw=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#storageMigrationSetup').evaluate(el=>el.open=true);
 assert.match(await page.locator('#portfolioStorageState').innerText(),/Bisheriger/);
 const dialogLabels=[];
 page.on('dialog',async dialog=>{dialogLabels.push(dialog.message());await dialog.accept();});
 await Promise.all([
  page.waitForEvent('download'),
  page.locator('#migrateToIDB').click()
 ]);
 await page.waitForFunction(()=>localStorage.getItem('foliolab-open-storage-mode')==='idb-v1');
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#storageMigrationSetup').evaluate(el=>el.open=true);
 assert.match(await page.locator('#portfolioStorageState').innerText(),/IndexedDB aktiv/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),oldRaw,'legacy bytes must be preserved');
 const first=await page.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}
 });
 assert.equal(first.revision,1);
 assert.equal(first.settings.eodhdKey,'SYNTHETIC_LOCAL_SECRET_FOR_TEST');
 assert.ok(!first.raw.includes('SYNTHETIC_LOCAL_SECRET_FOR_TEST'),'No credentials inside exportable portfolio snapshot');
 await page.locator('#addProvider').click();
 await page.locator('#providerName').fill('IndexedDB Bank');
 await page.locator('#editorForm button[type="submit"]').click();
 await page.locator('#editDialog').waitFor({state:'hidden'});
 const saved=await page.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}
 });
 assert.equal(saved.revision,2);
 assert.ok(JSON.parse(saved.raw).providers.some(p=>p.name==='IndexedDB Bank'));
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),oldRaw,'IDB writes may not mirror into legacy');
 const other=await context.newPage();
 await other.goto('http://127.0.0.1:4173/');
 // Both tabs have revision 2. The first one may commit, the second must fail.
 await page.locator('#addProvider').click();
 await page.locator('#providerName').fill('Tab A');
 await page.locator('#editorForm button[type="submit"]').click();
 await page.locator('#editDialog').waitFor({state:'hidden'});
 await other.locator('#mobileNav [data-page="more"]').click();
 await other.locator('#addProvider').click();
 await other.locator('#providerName').fill('Stale Tab B');
 await other.locator('#editorForm button[type="submit"]').click();
 await other.locator('#toast').getByText(/nicht gespeichert/).waitFor();
 const afterConflict=await page.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}
 });
 assert.equal(afterConflict.revision,3);
 assert.equal(JSON.parse(afterConflict.raw).providers.some(p=>p.name==='Stale Tab B'),false);
 await other.close();
 // An explicit fallback writes the current IDB version to the legacy key.
 await Promise.all([page.waitForEvent('download'),page.locator('#revertFromIDB').click()]);
 await page.waitForFunction(()=>localStorage.getItem('foliolab-open-storage-mode')===null);
 await page.reload();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).providers.some(p=>p.name==='Tab A')),true);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).settings.eodhdKey),'SYNTHETIC_LOCAL_SECRET_FOR_TEST');
 assert.equal(dialogLabels.length,4);
 console.log('IDB-CUTOVER: opt-in, predownload, idb-only edits, CAS stale-tab rejection, key separation, rollback PASS');
}finally{await context.close();await browser.close();}
