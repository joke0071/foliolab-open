import assert from 'node:assert/strict';
import {blankModel,backup} from '../src/model.js';

export async function openApp(context,origin){
 const page=await context.newPage();
 await page.goto(origin);
 await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 return page;
}

export async function readAppState(page){
 return page.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioSyncRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();
  try{return await readPortfolioSyncRecord(db);}finally{db.close();}
 });
}

export async function importPasswordFile(page,file,password,{replacement,error,barrier}){
 const dialogs=[];
 async function respond(dialog){
  if(dialog.type()==='prompt'&&dialog.message().includes('Backup-Passwort')){
   dialogs.push('password');
   await dialog.accept(password);
  }else if(dialog.type()==='confirm'&&dialog.message().includes('Der aktuelle Datenbestand wird ersetzt.')){
   dialogs.push('replace');
   if(replacement==='accept')await dialog.accept();
   else await dialog.dismiss();
  }else{
   dialogs.push(dialog.message());
   await dialog.dismiss();
  }
 }
 page.on('dialog',respond);
 try{
  const completion=barrier?page.waitForFunction(stage=>window.restoreBarrier?.stage===stage,barrier):
   replacement==='cancel'?page.waitForEvent('dialog',{predicate:d=>d.type()==='confirm'}):
   page.locator('#toast').filter({hasText:error||'Backup wiederhergestellt'}).waitFor();
  await Promise.all([completion,page.locator('#backupFile').setInputFiles(file)]);
  // The interruption probe deliberately holds the handler open. Cancellation has no toast.
  if(!barrier)await page.waitForFunction(()=>!document.getElementById('backupStatus').classList.contains('lab-loading'));
  assert.deepEqual(dialogs,error?['password']:['password','replace']);
 }finally{page.off('dialog',respond);}
}

export function assertRestored(reopened,before,expected,label){
 const finance=JSON.parse(reopened.portfolio.raw);
 delete finance.settings;
 assert.deepEqual(finance,expected,label);
 assert.equal(reopened.portfolio.revision,before.portfolio.revision+1,label);
 assert.deepEqual(reopened.portfolio.settings,before.portfolio.settings,label);
 assert.equal(reopened.portfolio.syncEnrollmentRequired,true,label);
 assert.equal(reopened.sync,null,label);
}

export async function restoreDownload({browserType,target,origin,file,password,expected,label,rejectedPassword,initialPassword}){
 let context=await browserType.launchPersistentContext(target);
 try{
  const page=await openApp(context,origin),before=await readAppState(page);
  assert.deepEqual(JSON.parse(before.portfolio.raw),JSON.parse(backup(blankModel(),{includeHistory:true})),label);
  assert.equal(before.sync,null);
  if(initialPassword!==undefined){
   await openBackupControls(page);
   await page.locator('#backupPassword').fill(initialPassword);
   await page.locator('#backupPasswordConfirm').fill(initialPassword);
   await page.locator('#saveBackupPassword').click();
   await page.locator('#backupPasswordForm').waitFor({state:'hidden'});
  }
  if(rejectedPassword!==undefined){
   await importPasswordFile(page,file,rejectedPassword,{error:'Backup-Passwort falsch'});
   assert.deepEqual(await readAppState(page),before,label);
  }
  await importPasswordFile(page,file,password,{replacement:'accept'});
  await context.close();
  context=await browserType.launchPersistentContext(target);
  const reopened=await readAppState(await openApp(context,origin));
  assertRestored(reopened,before,expected,label);
  return reopened;
 }finally{await context.close();}
}

export async function openBackupControls(page){
 await page.locator('#sidebarNav [data-page="more"]').click();
 await page.locator('#backupPasswordSetup > summary').click();
}

export async function saveTargetBackup(page,file){
 await page.locator('#fullBackupIncludeHistory').check();
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportEncryptedBackup').click()]);
 await download.saveAs(file);
}
