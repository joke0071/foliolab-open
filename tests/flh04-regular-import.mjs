import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {openApp,readAppState,importPasswordFile,assertRestored,restoreDownload,openBackupControls,saveTargetBackup} from './flh04-backup-app.mjs';
import {restartAfterKill} from './flh04-persistent-restart.mjs';

// Stop the accepted file import either at the call to the real portfolio save
// or after its promise resolves. An independent IDB reader witnesses each boundary.
async function holdRestore(page,stage){
 await page.evaluate(async stage=>{
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const save=PortfolioStorage.prototype.save;
  PortfolioStorage.prototype.save=async function(model,options){
   if(options?.intent!=='restore')return save.call(this,model,options);
   PortfolioStorage.prototype.save=save;
   const wait=()=>new Promise(release=>{window.restoreBarrier={stage,release};});
   if(stage==='before-save')await wait();
   const result=await save.call(this,model,options);
   if(stage==='save-complete')await wait();
   return result;
  };
 },stage);
}

function finances(record){
 const data=JSON.parse(record.portfolio.raw);
 delete data.settings;
 return data;
}

async function exportReadback(page,file,password,expected){
 await saveTargetBackup(page,file);
 const finance=await page.evaluate(async({text,password})=>{
  const {decryptPasswordBackup}=await import('/src/backup-vault.js');
  const {unpackCompleteBackup}=await import('/src/complete-backup.js');
  const {data}=unpackCompleteBackup(JSON.parse(await decryptPasswordBackup(JSON.parse(text),password)));
  delete data.settings;
  return data;
 },{text:await readFile(file,'utf8'),password});
 assert.deepEqual(finance,expected,'Zurückgelesene verschlüsselte Finanzdaten');
}

async function deposit(page,original,amount,balance){
 const before=await readAppState(page);
 const date='2026-11-02',notes='Wiederherstellungsprobe '+amount+' EUR';
 await page.clock.setFixedTime(new Date('2026-11-20T12:00:00Z'));
 await page.locator('#sidebarNav [data-page="bookings"]').click();
 await page.locator('#addBooking').click();
 await page.locator('#bookingPosition').selectOption('cash');
 await page.locator('#bookingType').selectOption('deposit');
 await page.locator('#editorForm [name=date]').fill(date);
 await page.locator('#bookingQuantityWrap [name=quantity]').fill(amount);
 await page.locator('.booking-notes summary').click();
 await page.locator('#editorForm [name=notes]').fill(notes);
 // Independently advance the pre-captured B model before submitting the form.
 // Matching synthetic UUIDs and a fixed clock permit exact journal equality.
 const expected=await page.evaluate(async({original,amount,date,notes})=>{
  const {executeTransaction}=await import('/src/transactions.js');
  const {backup,safeImport}=await import('/src/model.js');
  const draft=safeImport(original);
  let count=0;
  crypto.randomUUID=()=>'ded05170-0000-4000-8000-'+String(++count).padStart(12,'0');
  executeTransaction(draft,{type:'deposit',positionId:'cash',quantity:amount,unitPrice:'1',date,notes});
  const data=JSON.parse(backup(draft,{includeHistory:true}));delete data.settings;
  count=0;
  return data;
 },{original,amount,date,notes});
 try{
  await page.locator('#saveDialog').click();
  await page.locator('#toast').filter({hasText:'Buchung gespeichert: Einzahlung'}).waitFor();
 }finally{await page.evaluate(()=>{delete crypto.randomUUID;});}
 const state=await readAppState(page);
 assert.equal(state.portfolio.revision,before.portfolio.revision+1);
 assert.equal(expected.positions[0].quantityExact,balance);
 assert.equal(expected.journalEntries.length,original.journalEntries.length+1);
 assert.ok(original.walletHistory.sessions.length);
 assert.deepEqual(finances(state),expected);
 return {expected,state};
}

export async function checkConcurrentImport({page,before,original,headFile,password,targetPassword,directory,origin}){
 const writer=await openApp(page.context(),origin);
 await holdRestore(page,'before-save');
 try{
  await importPasswordFile(page,headFile,password,{replacement:'accept',barrier:'before-save'});
  assert.deepEqual(await readAppState(writer),before);
  const {expected,state}=await deposit(writer,original,'7.25','17.25');
  await page.evaluate(()=>window.restoreBarrier.release());
  await page.locator('#toast').filter({hasText:'in einem anderen Tab geändert'}).waitFor();
  await page.waitForFunction(()=>!document.getElementById('backupStatus').classList.contains('lab-loading'));
  assert.match(await page.locator('#toast').innerText(),/neu laden/i);
  assert.deepEqual(await readAppState(page),state,'Kein zusätzlicher Commit');
  await page.locator('#sidebarNav [data-page="dashboard"]').click();
  assert.match(await page.locator('#totalValue').innerText(),/17,25/);
  await page.locator('#sidebarNav [data-page="bookings"]').click();
  const row=page.locator('#bookingList [data-booking-id="'+expected.bookings[0].id+'"]');
  await page.locator('#bookingSearch').fill(expected.bookings[0].notes);
  await row.waitFor();
  assert.match(await row.innerText(),/Einzahlung/);
  assert.match(await row.innerText(),/7,25/);
  await openBackupControls(page);
  await exportReadback(page,join(directory,'target-concurrent.json'),targetPassword,expected);
  console.log(JSON.stringify({kind:'FLH04ConcurrentImport',status:'PASS',engine:page.context().browser().browserType().name(),
   revision:state.portfolio.revision,balance:'17.25',rejectedRestore:true,targetExportVerified:true}));
  return state;
 }finally{
  await page.evaluate(()=>window.restoreBarrier?.release()).catch(()=>{});
  await writer.close();
 }
}

export async function checkReturnAndBook({page,original,browserType,directory,origin,targetPassword}){
 const {expected,state}=await deposit(page,original,'4.75','14.75');
 await openBackupControls(page);
 const file=join(directory,'target-followup.json');
 await saveTargetBackup(page,file);
 await restoreDownload({browserType,target:join(directory,'readback-followup'),origin,file,password:targetPassword,expected,
  label:'Fortgeschriebener B-Stand samt Journal und bestätigter Wallet-Historie'});
 console.log(JSON.stringify({kind:'FLH04ReturnToOriginal',status:'PASS',engine:browserType.name(),
  restoredRevision:state.portfolio.revision-1,bookedRevision:state.portfolio.revision,balance:'14.75',
  journalEntries:expected.journalEntries.length,confirmedSessions:expected.walletHistory.sessions.length}));
}

export async function checkInterruptedImports({browserType,target,origin,beforeFile,original,headFile,password,targetPassword,expected,directory}){
 let context=await browserType.launchPersistentContext(target);
 try{
  let page=await openApp(context,origin);
  await importPasswordFile(page,beforeFile,targetPassword,{replacement:'accept'});
  await page.close();
  page=await openApp(context,origin);
  const before=await readAppState(page);
  assert.deepEqual(finances(before),original);
  for(const stage of ['before-save','save-complete']){
   await holdRestore(page,stage);
   await importPasswordFile(page,headFile,password,{replacement:'accept',barrier:stage});
   assert.equal(await page.locator('#backupStatus').evaluate(el=>el.classList.contains('lab-loading')),true);
   assert.doesNotMatch(await page.locator('#toast').innerText(),/Backup wiederhergestellt/);
   const witness=await readAppState(page);
   if(stage==='before-save')assert.deepEqual(witness,before);
   else assertRestored(witness,before,expected,stage);
   context=await restartAfterKill(context,target);
   page=await openApp(context,origin);
   const reopened=await readAppState(page);
   assert.deepEqual(reopened,witness,'Wiederanlauf nach '+stage);
   await openBackupControls(page);
   await exportReadback(page,join(directory,stage+'.json'),targetPassword,stage==='before-save'?original:expected);
   console.log(JSON.stringify({kind:'FLH04InterruptedImport',status:'PASS',engine:browserType.name(),stage,
    mechanism:'SIGKILL',target:'browser',successPending:true,head:stage==='before-save'?'B':'C',
    witnessedRevision:witness.portfolio.revision,reopenedRevision:reopened.portfolio.revision,targetExportVerified:true}));
  }
 }finally{await context.close();}
}
