import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {blankModel,backup} from '../src/model.js';

async function show(page,text){
 await page.evaluate(async text=>{
  const {showPinnedConflict}=await import('/experimental/sync/sync-conflict-view.js');
  await showPinnedConflict(document.body,window.syncTest.api,text);
 },text);
}

export async function saveConflictSet(page,request,directory,profiles){
 await show(page,request.text);
 await page.getByRole('button',{name:'Alle Stände sichern'}).click();
 const paths=[],labels=['Verzeichnis','Lokaler Stand',...profiles.map(p=>'Revision '+p.id)];
 for(const label of labels){
  const [event]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:label+' speichern'}).click()]);
  const path=join(directory,event.suggestedFilename());await event.saveAs(path);paths.push(path);
 }
 assert.equal(new Set(paths).size,paths.length);
 const [indexFile,...copies]=await Promise.all(paths.map(path=>readFile(path,'utf8')));
 const decoded=await page.evaluate(async({copies,indexFile,password})=>{
  const {decryptPasswordBackup}=await import('/src/backup-vault.js');
  const decrypt=async text=>JSON.parse(await decryptPasswordBackup(JSON.parse(text),password));
  return {index:await decrypt(indexFile),data:await Promise.all(copies.map(decrypt))};
 },{copies,indexFile,password:request.password});
 assert.deepEqual(decoded.data,[profiles[0].data,...profiles.map(p=>p.data)]);
 assert.deepEqual(decoded.index.entries.map(({role,revisionId})=>[role,revisionId]),
  [['local','A'],['head','A'],['head','B'],['head','C']]);
 assert.equal(decoded.index.selectedHead,request.confirmedHead);
 assert.equal(decoded.data[2].positions[0].quantityExact,decoded.data[3].positions[0].quantityExact);
 assert.notDeepEqual(decoded.data[2],decoded.data[3]);
 return {paths,labels,copies,indexFile};
}

async function openApp(context,origin){
 const page=await context.newPage();
 await page.goto(origin);
 await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 return page;
}

async function readAppState(page){
 return page.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioSyncRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();
  try{return await readPortfolioSyncRecord(db);}finally{db.close();}
 });
}

async function restoreDownload({browserType,target,origin,file,password,expected,label}){
 let context=await browserType.launchPersistentContext(target);
 try{
  const page=await openApp(context,origin),before=await readAppState(page);
  assert.deepEqual(JSON.parse(before.portfolio.raw),JSON.parse(backup(blankModel(),{includeHistory:true})),label);
  assert.equal(before.sync,null);
  const dialogs=[];
  page.on('dialog',async dialog=>{
   dialogs.push(dialog.type());
   if(dialog.type()==='prompt'&&dialog.message().includes('Backup-Passwort'))await dialog.accept(password);
   else if(dialog.type()==='confirm'&&dialog.message().includes('wiederherstellen?'))await dialog.accept();
   else await dialog.dismiss();
  });
  await page.locator('#backupFile').setInputFiles(file);
  await page.locator('#toast').filter({hasText:'Backup wiederhergestellt'}).waitFor();
  assert.deepEqual(dialogs,['prompt','confirm'],label);
  await context.close();
  context=await browserType.launchPersistentContext(target);
  const reopened=await readAppState(await openApp(context,origin));
  const finance=JSON.parse(reopened.portfolio.raw);
  delete finance.settings;
  assert.deepEqual(finance,expected,label);
  assert.equal(reopened.portfolio.revision,before.portfolio.revision+1,label);
  assert.deepEqual(reopened.portfolio.settings,before.portfolio.settings,label);
  assert.equal(reopened.portfolio.syncEnrollmentRequired,true,label);
  assert.equal(reopened.sync,null,label);
 }finally{await context.close();}
}

export async function checkRecoverySetRestore({browserType,directory,source,profiles,request}){
 const {paths,labels}=source.backupSet,origin=new URL('/',source.page.url()).href;
 // Oracles were captured in the individual source profiles before the archive existed.
 const cases=[['Lokaler Stand',source],...profiles.map(profile=>['Revision '+profile.id,profile])];
 for(const [label,profile] of cases){
  const file=paths[labels.indexOf(label)];
  assert.ok(file,label);
  await restoreDownload({browserType,target:join(directory,'restore-'+label),origin,file,
   password:request.password,expected:profile.data,label});
 }
 const text=await readFile(source.file,'utf8');
 const {archive,selected}=await source.page.evaluate(async({text,expectedPinVersion})=>{
  const {api}=window.syncTest;
  return {archive:await api.reopenPinnedConflictArchive({text}),
   selected:await api.exportPinnedFinancialCopy({text,expectedPinVersion})};
 },{text,expectedPinVersion:request.expectedPinVersion});
 assert.deepEqual(archive.heads,profiles.map(p=>p.id));
 assert.equal(archive.pinVersion,request.expectedPinVersion);
 assert.equal(archive.applyAuthorized,false);
 assert.equal(selected.restorePreview.selectedHead,request.confirmedHead);
 assert.deepEqual(JSON.parse(selected.financialCopy),profiles.find(p=>p.id===request.confirmedHead).data);
 await assert.rejects(()=>source.page.evaluate(req=>window.syncTest.api.restorePinnedLocalCopy(req),request),
  /restore-needs-local-and-selected-heads/);
}

export async function checkSavedSet(page,request,set){
 const {text,expectedPinVersion,password}=request;
 await show(page,text);
 const {paths,labels,indexFile,copies}=set;
 for(const [i,label] of labels.entries())await page.getByLabel(label+' zurücklesen').setInputFiles(paths[i]);
 await page.getByLabel('Backup-Passwort').fill(password);
 await page.getByRole('button',{name:'Sicherungssatz prüfen'}).click();
 await page.getByRole('status').filter({hasText:'Lokaler Stand und 3 Revisionen geprüft'}).waitFor();
 const req={text,expectedPinVersion,indexFile,copies,password};
 const verify=changes=>page.evaluate(req=>window.syncTest.api.verifyPinnedRecoverySet(req),{...req,...changes});
 await assert.rejects(()=>verify({indexFile:undefined}),/file-missing/);
 await assert.rejects(()=>verify({copies:copies.slice(1)}),/set-count/);
 await assert.rejects(()=>verify({copies:[copies[0],copies[0],...copies.slice(2)]}),/set-file/);
 await assert.rejects(()=>verify({copies:[copies[1],copies[0],...copies.slice(2)]}),/set-file/);
 await assert.rejects(()=>verify({copies:[copies[0],copies[1],copies[3],copies[2]]}),/set-file/);
 await assert.rejects(()=>verify({password:'another synthetic password'}),/Passwort/);
 const selected=await page.evaluate(req=>window.syncTest.api.exportPinnedFinancialCopy(req),{text,expectedPinVersion});
 assert.equal(selected.restorePreview.selectedHead,request.confirmedHead);assert.equal(selected.pinVersion,expectedPinVersion);
 return req;
}

// Pause actual backup crypto after its first v2 operation, while another tab
// commits. The adapter must reject before releasing either files or a receipt.
export async function pauseRecoverySet(page,request,verify){
 await page.evaluate(({req,verify})=>{
  const method=verify?'decrypt':'encrypt',subtle=crypto.subtle,original=subtle[method].bind(subtle);
  subtle[method]=async function(algorithm,...rest){
   const value=await original(algorithm,...rest);
   if(algorithm.additionalData&&new TextDecoder().decode(algorithm.additionalData)==='FolioLab Open password backup v2'){
    delete subtle[method];await new Promise(resolve=>{window.resumeRecoverySet=resolve;});
   }
   return value;
  };
  const api=window.syncTest.api;
  window.pendingRecoverySet=(verify?api.verifyPinnedRecoverySet(req):api.exportPinnedRecoverySet(req))
   .then(()=>null,e=>e.message);
 },{req:request,verify});
 await page.waitForFunction(()=>typeof window.resumeRecoverySet==='function');
}

export function resumeRecoverySet(page){
 return page.evaluate(()=>{window.resumeRecoverySet();return window.pendingRecoverySet;});
}
