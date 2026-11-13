// Prepared toast-delta qualification; NOT RUN. No live OAuth, Drive or cryptography claim.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base='http://127.0.0.1:4173',dir='artifacts/restore-outcome';
assert.match(process.env.FOLIOLAB_TEST_SHA||'',/^[0-9a-f]{40}$/);
await mkdir(dir,{recursive:true});
const report={scope:'drive-restore-toast-delta',sourceSHA:process.env.FOLIOLAB_TEST_SHA,result:'NOT_REACHED',cleanup:'NOT_REACHED',cases:[],stages:[],limits:['Linux Chromium, isolated synthetic IDB contexts','OAuth, Drive media, decrypt and password adoption deliberately simulated','Actual delivered restore callback and Drive status code; actual IDB portfolio save/readback','No encrypted restore, real OAuth, recovery, Windows/Android/PWA or crypto review claim']};
async function stage(name,state='BEGIN'){report.stages.push({name,state});console.log(JSON.stringify({kind:'RestoreOutcomeStage',name,state}));await writeFile(dir+'/report.json',JSON.stringify(report,null,2));}
let browser,context;
async function independentRecord(page){
 return page.evaluate(()=>new Promise((resolve,reject)=>{
  const r=indexedDB.open('foliolab-open-portfolio',1);
  r.onerror=()=>reject(r.error);
  r.onsuccess=()=>{const db=r.result,tx=db.transaction('records','readonly');let value;
   tx.objectStore('records').get('portfolio').onsuccess=e=>{value=e.target.result;};
   tx.oncomplete=()=>{db.close();resolve(value);};tx.onabort=()=>{db.close();reject(tx.error);};
  };
 }));
}
async function runCase(kind){
 await stage(kind+':context');
 context=await browser.newContext({viewport:{width:390,height:850},hasTouch:true,acceptDownloads:true,serviceWorkers:'block'});
 const requests=[];let blockedExternal=0;
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.origin===base)return route.continue();
  if(u.origin==='https://www.googleapis.com'){
   requests.push({method:route.request().method(),path:u.pathname,media:u.searchParams.get('alt')==='media'});
   if(route.request().method()!=='GET')return route.abort();
   return route.fulfill({status:200,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify(u.searchParams.get('alt')==='media'?{format:'foliolab-open-encrypted-v2',synthetic:true}:{files:[]})});
  }
  blockedExternal++;return route.abort();
 });
 await context.addInitScript(()=>{
  if(location.origin!=='http://127.0.0.1:4173')return;
  if(!localStorage.getItem('foliolab-open-drive-backup-settings-v1'))localStorage.setItem('foliolab-open-drive-backup-settings-v1',JSON.stringify({clientId:'SYNTHETIC.apps.googleusercontent.com',mode:'off',retention:3}));
  window.google={accounts:{oauth2:{initTokenClient(){return {requestAccessToken(){this.callback({access_token:'SYNTHETIC-NONCREDENTIAL',expires_in:3600});}};}}}};
  const state=window.__restoreProbe={calls:0,adoptions:0,passwordCompleted:false,errors:[],idbWrites:0};
  let module;
  Object.defineProperty(window,'FolioDriveBackup',{configurable:true,get:()=>module,set:value=>{
   module=value;const init=value.init;
   value.init=async backend=>{
    const restore=backend.restoreData;
    backend.restoreData=async(...args)=>{state.calls++;try{return await restore(...args);}catch(e){state.errors.push({message:e.message,restoreCommitted:e.restoreCommitted===true,cause:e.cause?.message??null});throw e;}};
    // Explicit external/crypto adapters. Portfolio save is never replaced.
    backend.decryptPasswordBackup=async()=>JSON.stringify(window.__restorePayload);
    backend.hasPasswordVault=async()=>false;
    backend.adoptPasswordVault=async()=>{state.adoptions++;if(state.kind==='password')throw Error('SYNTHETIC_PASSWORD_FAILURE');state.passwordCompleted=true;};
    state.backend=backend;
    const result=await init(backend);state.initialized=true;return result;
   };
  }});
 });
 const page=await context.newPage(),pageErrors=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>pageErrors.push(e.message));page.on('dialog',d=>d.accept());
 await stage(kind+':fixture');
 await page.goto(base+'/tests/storage-origin.html');
 const fixture=await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,backup,safeImport}=await import('/src/model.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const {createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js');
  const s=new PortfolioStorage();await s.initialize();
  const before=blankModel();before.settings.autoRefresh='off';before.settings.coinGeckoKey='SYNTHETIC_STORED';await s.save(before);s.close();
  const next=blankModel();next.settings.autoRefresh='off';next.settings.coinGeckoKey='SYNTHETIC_IMPORTED';
  const provider=createProvider({name:'Synthetische Restorebank'});next.providers.push(provider);
  const account=createAccount({name:'Synthetisches Cashkonto',type:'savings',providerId:provider.id},next);next.accounts.push(account);
  next.positions.push(createPosition({name:'Synthetisches Guthaben',kind:'cash',quantity:123.45,price:1,providerId:provider.id,accountId:account.id},next));
  const payload=createCompleteBackup(JSON.parse(backup(next,{includeHistory:true})),{settings:next.settings,drive:{clientId:'SYNTHETIC.apps.googleusercontent.com',mode:'off',retention:3}});
  const imported=safeImport(unpackCompleteBackup(payload).data);
  return {payload,expectedRaw:backup(imported,{includeHistory:true}),expectedSettings:payload.configuration.settings};
 });
 await stage(kind+':app-ready');
 await page.goto(base+'/');
 await page.waitForFunction(()=>window.__restoreProbe?.initialized&&document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const before=await independentRecord(page);
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-storage-mode')),'idb-v1');
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),null);
 await page.evaluate(({kind,payload})=>{
  window.__restorePayload=payload;window.__restoreProbe.kind=kind;
  document.querySelector('#mobileNav [data-page="more"]').click();
  for(const id of ['driveRestore','coinGeckoKey']){
   const el=id==='coinGeckoKey'?document.querySelector('[name="coinGeckoKey"]'):document.getElementById(id);
   for(let n=el;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;
  }
  const field=document.querySelector('[name="coinGeckoKey"]');field.value='SYNTHETIC_DRAFT';field.type='text';
 },{kind,payload:fixture.payload});
 const field=page.locator('#apiSettings [name="coinGeckoKey"]');
 await page.evaluate(()=>window.FolioDriveBackup.connect());
 await page.evaluate(()=>{
  const select=document.getElementById('driveBackupSelect');select.add(new Option('Synthetisches Backup','syntheticBackup12345'));select.value='syntheticBackup12345';
  document.getElementById('driveRecoveryInput').value='SYNTHETIC restore password';
 });
 await stage(kind+':arm-fault');
 await page.evaluate(kind=>{
  const state=window.__restoreProbe;
  const originalPut=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(...args){
   if(this.name==='records'){
    state.idbWrites++;
    if(kind==='commit'){const request=originalPut.apply(this,args);state.commitFaultObserved=true;this.transaction.abort();return request;}
   }
   return originalPut.apply(this,args);
  };
  if(kind==='preferences'){
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,...args){if(key==='foliolab-open-drive-backup-settings-v1'){state.preferenceFaultObserved=true;throw Error('SYNTHETIC_PREFERENCES_FAILURE');}return original.call(this,key,...args);};
  }
  if(kind==='display'){
   const dialog=document.createElement('dialog');dialog.id='restoreBackupDialog';
   dialog.close=()=>{state.displayFaultObserved=true;throw Error('SYNTHETIC_DISPLAY_FAILURE');};document.body.append(dialog);
  }
 },kind);
 await stage(kind+':toast-observer');
 // Observe the real toast DOM; do not replace notify, save, or the restore callback.
 await page.evaluate(()=>{
  const box=document.getElementById('toast');
  if(!box)throw Error('Real toast node missing');
  window.__restoreToastEvidence=[];
  window.__restoreToastObserver=new MutationObserver(records=>{
   for(const record of records)if(record.type==='childList'){
    const text=Array.from(record.addedNodes,node=>node.textContent??'').join('');
    if(text)window.__restoreToastEvidence.push(text);
   }
  });
  window.__restoreToastObserver.observe(box,{childList:true});
 });
 await stage(kind+':restore');
 // Invoke the exact installed UI handler and await it; no artificial delay or retry.
 await page.evaluate(()=>document.getElementById('driveRestore').onclick());
 await stage(kind+':independent-readback');
 const after=await independentRecord(page);
 const state=await page.evaluate(()=>{
  const s=window.__restoreProbe;return {calls:s.calls,adoptions:s.adoptions,passwordCompleted:s.passwordCompleted,errors:s.errors,idbWrites:s.idbWrites,commitFaultObserved:s.commitFaultObserved??false,preferenceFaultObserved:s.preferenceFaultObserved??false,displayFaultObserved:s.displayFaultObserved??false,status:window.FolioDriveBackup.getStatus(),field:document.querySelector('[name="coinGeckoKey"]').value,fieldType:document.querySelector('[name="coinGeckoKey"]').type,passwordCleared:document.getElementById('driveRecoveryInput').value==='',storageMode:localStorage.getItem('foliolab-open-storage-mode'),toasts:[...window.__restoreToastEvidence],toastText:document.getElementById('toast').textContent,toastVisible:!document.getElementById('toast').classList.contains('hidden')};
 });
 await writeFile(dir+'/'+kind+'.json',JSON.stringify({kind,before,after,state,requests,pageErrors,blockedExternal},null,2));
 const expectedToast='Portfoliodaten aus Google Drive übernommen.';
 assert.equal(state.toasts.includes('Google-Drive-Backup erfolgreich wiederhergestellt.'),false);
 const expectedToastCount=['success','password','display'].includes(kind)?1:0;
 assert.equal(state.toasts.filter(text=>text===expectedToast).length,expectedToastCount);
 if(expectedToastCount){assert.equal(state.toastText,expectedToast);assert.equal(state.toastVisible,true);}
 await stage(kind+':toast-assertions','PASS');
 assert.equal(state.calls,1);assert.equal(state.passwordCleared,true);assert.equal(state.status.busy,false);
 assert.equal(state.storageMode,'idb-v1');assert.equal(state.idbWrites,1);
 assert.equal(requests.filter(r=>r.media).length,1);assert.equal(requests.filter(r=>r.method!=='GET').length,0);
 if(kind==='commit'){
  assert.deepEqual(after,before);assert.equal(state.adoptions,0);assert.equal(state.commitFaultObserved,true);
  assert.equal(state.errors.length,1);assert.equal(state.errors[0].restoreCommitted,false);assert.equal(state.errors[0].cause,null);
  assert.match(state.status.message,/Wiederherstellung fehlgeschlagen/);assert.doesNotMatch(state.status.message,/Portfolio wiederhergestellt/);
 }else{
  assert.equal(after.revision,before.revision+1);assert.equal(after.raw,fixture.expectedRaw);assert.deepEqual(after.settings,fixture.expectedSettings);
  assert.equal(JSON.parse(after.raw).positions.length,1);
  assert.equal(Number(JSON.parse(after.raw).positions[0].quantity),123.45);
  if(kind==='preferences'){
   assert.equal(state.preferenceFaultObserved,true);assert.equal(state.adoptions,0);
   assert.equal(state.errors[0].restoreCommitted,true);assert.equal(state.errors[0].message,'SYNTHETIC_PREFERENCES_FAILURE');assert.equal(state.errors[0].cause,'SYNTHETIC_PREFERENCES_FAILURE');
   assert.match(state.status.message,/Portfolio wiederhergestellt.*Einstellungen fehlgeschlagen.*Backup-Passwort.*noch nicht übernommen/);
  }else if(kind==='password'){
   assert.equal(state.adoptions,1);assert.equal(state.passwordCompleted,false);assert.equal(state.errors.length,0);
   assert.match(state.status.message,/Portfolio wiederhergestellt.*Backup-Passwort.*nicht.*übernommen.*SYNTHETIC_PASSWORD_FAILURE/);
  }else if(kind==='display'){
   assert.equal(state.adoptions,1);assert.equal(state.passwordCompleted,true);assert.equal(state.displayFaultObserved,true);
   assert.match(state.status.message,/Portfolio und Backup-Passwort übernommen.*Abschlussanzeige fehlgeschlagen.*SYNTHETIC_DISPLAY_FAILURE/);
  }else{
   assert.equal(state.adoptions,1);assert.equal(state.passwordCompleted,true);assert.equal(state.errors.length,0);
   assert.match(state.status.message,/Drive-Backup wiederhergestellt/);
  }
  assert.doesNotMatch(state.status.message,/Wiederherstellung fehlgeschlagen/);
 }
 if(['commit','preferences'].includes(kind)){assert.equal(state.field,'SYNTHETIC_DRAFT');assert.equal(state.fieldType,'text');}
 else{assert.equal(state.field,'SYNTHETIC_IMPORTED');assert.equal(state.fieldType,'password');}
 assert.equal(state.status.error,kind!=='success');assert.deepEqual(pageErrors,[]);assert.equal(blockedExternal,0);
 if(kind==='password'){
  for(const width of [320,390,430,768,1440]){
   await stage(kind+':width-'+width);await page.setViewportSize({width,height:850});
   await page.locator('#driveBackupStatus').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#driveBackupStatus').isVisible(),true);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow '+width);
   await page.screenshot({path:dir+'/password-'+width+'.png',fullPage:true});
  }
  await page.locator('#driveRecoveryInput').focus();assert.equal(await page.locator('#driveRecoveryInput').evaluate(el=>el===document.activeElement),true);
  await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.activeElement!==document.body));
  await page.addStyleTag({url:base+'/tests/restore-text-enlargement.css'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% text approximation overflow');
  assert.deepEqual(await independentRecord(page),after);
 }
 await writeFile(dir+'/'+kind+'.json',JSON.stringify({kind,before,after,state,requests,pageErrors,blockedExternal},null,2));
 report.cases.push({kind,result:'PASS',revisionBefore:before.revision,revisionAfter:after.revision,actualIDB:true,oneRestore:true,oneMediaGET:true,expectedToastCount,observedToasts:state.toasts,status:state.status.message});
 await stage(kind,'PASS');await stage(kind+':cleanup');
 await context.close();context=null;await stage(kind+':cleanup','PASS');
}
try{
 await stage('launch');browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 report.browserVersion=browser.version();report.node=process.version;
 for(const kind of ['success','commit','preferences','password','display'])await runCase(kind);
 report.result='PASS';await stage('restore-outcome','PASS');
}catch(error){report.result='FAIL';report.error=String(error);await stage('restore-outcome','FAIL');throw error;}
finally{
 try{await stage('cleanup');await context?.close();await browser?.close();report.cleanup='PASS';}
 catch(error){report.cleanup='FAIL';report.cleanupError=String(error);process.exitCode=1;}
 await writeFile(dir+'/report.json',JSON.stringify(report,null,2));
}
