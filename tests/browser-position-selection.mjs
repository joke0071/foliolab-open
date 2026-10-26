// Pure 08a module in real engines + exact IDB/model preservation, including offline imports.
// No bulk-selection UI, delete, commit, new migration or persistent selection is activated.
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
const base='http://127.0.0.1:4173/';
for(const engine of (process.env.FLH03_08_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 // Do not install request interception: this test needs actual SW-controlled Firefox reloads.
 const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}});
 const exercise=()=>page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,valueEUR}=await import('/src/model.js');
  const {searchAndSortPositions}=await import('/src/position-search.js');
  const {updatePositionSelection,positionSelectionSummary,previewPositionRemoval}=await import('/src/position-selection.js');
  const m=blankModel();m.providers.push(createProvider({id:'broker',name:'Synthetic'}));
  for(const id of ['a','b'])m.accounts.push(createAccount({id,providerId:'broker',name:id,type:'securities'},m));
  for(let i=0;i<401;i++)m.positions.push(createPosition({id:'p-'+i,providerId:'broker',accountId:i%2?'b':'a',
   name:(i%2?'Other ':'Wanted ')+i,symbol:'SAME',isin:'IE00B4L5Y983',kind:'etf',quantity:1,price:100},m));
  m.snapshots.push({id:'snapshot',date:'2023-01-01',total:100,totalEURExact:'100',byPosition:{'p-0':'100'}});
  const before=JSON.stringify(m),matching=searchAndSortPositions(m.positions,m,'Wanted','name',valueEUR).map(p=>p.id);
  const selected=updatePositionSelection(m,[],{type:'filtered',matchingIds:matching});
  const summary=positionSelectionSummary(m,selected,['p-1','p-3']);
  const preview=previewPositionRemoval(m,['p-0','p-1']);
  return {selectedCount:selected.length,includesLast:selected.includes('p-400'),hidden:summary.hiddenCount,
   selectedAfterFilter:summary.selectedCount,blocked:preview.blockedCount,unreferenced:preview.unreferencedCount,
   snapshotReference:preview.items[0].references.some(r=>r.category==='snapshots'),writeEnabled:preview.writeEnabled,
   unchanged:JSON.stringify(m)===before};
 });
 const expected={selectedCount:201,includesLast:true,hidden:201,selectedAfterFilter:201,blocked:1,unreferenced:1,
  snapshotReference:true,writeEnabled:false,unchanged:true};
 try{
  await page.goto(base);await page.waitForFunction(()=>document.getElementById('portfolioStorageState').textContent.includes('IndexedDB aktiv'));
  // Synthetic canonical setup only; disable background refresh before the no-write baseline.
  await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const store=new PortfolioStorage();const m=await store.initialize();m.settings.autoRefresh=false;await store.save(m);store.close();});
  await page.reload();await page.waitForFunction(()=>document.getElementById('portfolioStorageState').textContent.includes('IndexedDB aktiv'));
  const before=await record();assert.deepEqual(await exercise(),expected);assert.deepEqual(await record(),before);
  await page.waitForFunction(async()=>{const registration=await navigator.serviceWorker.getRegistration();return registration?.active?.state==='activated';});
  await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload();
  assert.deepEqual(await exercise(),expected,'Fresh offline module realm uses precached code/dependencies');
  assert.deepEqual(await record(),before,'No IDB revision, draft or financial write');assert.deepEqual(errors,[]);
  console.log(engine+': FLH03-08a full-model 201/401 selection, hidden IDs, snapshot blocker, zero model/IDB writes and fresh offline import PASS');
 }finally{await context.close();await browser.close();}
}
