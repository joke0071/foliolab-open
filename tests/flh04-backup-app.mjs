import assert from 'node:assert/strict';
import {blankModel,backup} from '../src/model.js';

const navigationBackoffMs=[10000,30000,65000];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function retryAfterMs(value){
 if(!value)return 0;
 if(/^\d+$/.test(value))return Number(value)*1000;
 const date=Date.parse(value);
 return Number.isFinite(date)?Math.max(0,date-Date.now()):0;
}

async function navigateApp(page,origin,navigate,waitForRetry){
 const expectedOrigin=new URL(origin).origin;
 for(let attempt=0;;attempt++){
  const limitedScripts=[];
  function observe(response){
   if(response.status()!==429||new URL(response.url()).origin!==expectedOrigin)return;
   const request=response.request();
   if(request.resourceType()==='script' && !request.serviceWorker?.() && request.frame()===page.mainFrame()){
    limitedScripts.push(response);
   }
  }
  page.on('response',observe);
  let limited;
  try{
   const document=await navigate();
   if(document?.status()===429){
    limited=[document];
   }else{
    try{
     await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
     return page;
    }catch(error){
     if(error.name!=='TimeoutError'||!limitedScripts.length)throw error;
     limited=limitedScripts;
    }
   }
  }finally{
   page.off('response',observe);
  }
  const headers=await Promise.all(limited.map(response=>response.headerValue('retry-after')));
  const backoff=navigationBackoffMs[attempt];
  const delay=Math.max(backoff??0,...headers.map(retryAfterMs));
  if(backoff===undefined||delay>120000){
   throw Error('Application navigation still rate limited (HTTP 429). Required delay: '+delay+' ms.');
  }
  console.log('QA navigation HTTP 429; waiting '+delay+' ms before retry '+(attempt+1));
  await waitForRetry(delay);
 }
}

export async function openApp(context,origin,{waitForRetry=wait}={}){
 const page=await context.newPage();
 return navigateApp(page,origin,()=>page.goto(origin),waitForRetry);
}

export function reloadApp(page,{waitForRetry=wait}={}){
 return navigateApp(page,page.url(),()=>page.reload(),waitForRetry);
}

export async function readAppState(page){
 return page.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();
  try{return {portfolio:await readPortfolioRecord(db)};}finally{db.close();}
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
 assert.equal(reopened.portfolio.confirmedActive,true,label);
}

export async function restoreDownload({browserType,target,origin,file,password,expected,label,rejectedPassword,initialPassword}){
 let context=await browserType.launchPersistentContext(target);
 try{
  const page=await openApp(context,origin),before=await readAppState(page);
  assert.deepEqual(JSON.parse(before.portfolio.raw),JSON.parse(backup(blankModel(),{includeHistory:true})),label);
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
 const panel=page.locator('#backupPasswordSetup');
 if(!await panel.evaluate(el=>el.open))await panel.locator(':scope > summary').click();
}

export async function saveTargetBackup(page,file){
 await page.locator('#fullBackupIncludeHistory').check();
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportEncryptedBackup').click()]);
 await download.saveAs(file);
}
