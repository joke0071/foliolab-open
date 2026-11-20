import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {commonPortfolio,appendBookings} from './flh04-source-restore-fixture.mjs';
import {openInstallation} from './flh04-profile-restore.mjs';
import {snapshotFrame} from './sync-outbox-fixture.mjs';

async function checkArchivedHead(page,text,id,expected,history,local){
 const preview=await page.evaluate(request=>window.syncTest.api.previewPinnedRestore(request),
  {text,expectedPinVersion:2,selectedHead:id});
 assert.deepEqual(preview.heads,['L','R2']);assert.equal(preview.applyAuthorized,false);
 assert.equal(preview.restorePreview.selectedHead,id);assert.equal(preview.restorePreview.positions,1);
 assert.equal(preview.restorePreview.bookings,expected.ids.length);
 assert.equal(preview.restorePreview.journalEntries,expected.ids.length);
 const changes=preview.restorePreview.changedSections;
 if(local)assert.deepEqual(changes,[]);
 else for(const key of ['positions','bookings','journalEntries'])assert.ok(changes.includes(key));
 assert.ok(!changes.includes('walletHistory'));
 // Inspect the actual encrypted file independently of the summary from the preview adapter.
 const raw=await page.evaluate(async({text,id})=>{
  const {readVerifiedSyncFrame}=await import('/experimental/sync/sync-frame-verifier.js');
  for(const line of text.split('\n').slice(1)){
   const frame=readVerifiedSyncFrame(await window.syncTest.verify(line));
   if(frame.descriptor.revisionId===id){
    const {safeImport,backup}=window.syncTest.model;
    return backup(safeImport(JSON.parse(frame.plain).data),{includeHistory:true});
   }
  }
  throw Error('missing archived head');
 },{text,id});
 const data=JSON.parse(raw);
 assert.equal(data.positions[0].quantityExact,expected.cash);
 assert.deepEqual(data.bookings.map(b=>b.id),[...expected.ids].reverse());
 assert.deepEqual(data.journalEntries.map(j=>j.id),expected.ids);
 assert.deepEqual(data.walletHistory,history);
}

async function checkRestoredCopy({directory,setup,operation,source,text,expected,encrypted}){
 const copy=await source.page.evaluate(text=>window.syncTest.api.exportPinnedFinancialCopy({text,expectedPinVersion:2}),text);
 assert.equal(copy.restorePreview.selectedHead,expected.id);
 const data=JSON.parse(copy.financialCopy);
 assert.equal(Object.hasOwn(data,'settings'),false);
 const password='Source financial fixture 2026';
 const file=join(directory,encrypted?'selected-password.json':'selected-finances.json');
 let damagedFile,rollbackFile;
 if(encrypted){
  const request={text,expectedPinVersion:2};
  await assert.rejects(()=>source.page.evaluate(request=>window.syncTest.api.exportEncryptedPinnedFinancialCopy(request),request),/Backup-Passwort einrichten/);
  await source.page.evaluate(async password=>{
   const {configureBackupPassword}=await import('/src/backup-vault.js');
   await configureBackupPassword(password,password);
  },password);
  const sealed=await source.page.evaluate(request=>window.syncTest.api.exportEncryptedPinnedFinancialCopy(request),request);
  assert.equal(Object.hasOwn(sealed,'financialCopy'),false);assert.equal(sealed.applyAuthorized,false);
  const envelope=JSON.parse(sealed.encryptedCopy);
  assert.equal(envelope.format,'foliolab-open-encrypted-v2');
  const pair=await source.page.evaluate(request=>window.syncTest.api.exportPinnedRecoveryFiles(request),request);
  assert.equal(pair.applyAuthorized,false);assert.equal(pair.pinVersion,2);
  rollbackFile=join(directory,'local-rollback.json');
  await writeFile(rollbackFile,pair.recoveryFiles.localFile);
  await writeFile(file,pair.recoveryFiles.selectedFile);
  const readback={...request,localFile:await readFile(rollbackFile,'utf8'),selectedFile:await readFile(file,'utf8'),password};
  const verify=files=>source.page.evaluate(files=>window.syncTest.api.verifyPinnedRecoveryFiles(files),files);
  const receipt=await verify(readback);
  assert.equal(receipt.recoveryFilesVerified,true);assert.equal(receipt.applyAuthorized,false);
  await assert.rejects(()=>verify({...readback,localFile:readback.selectedFile}),/file-pair/);
  await assert.rejects(()=>verify({...readback,localFile:readback.selectedFile,selectedFile:readback.localFile}),/file-content/);
  await assert.rejects(()=>verify({...readback,password:'Incorrect fixture password'}),/Passwort falsch/);
  envelope.data=(envelope.data.startsWith('A')?'B':'A')+envelope.data.slice(1);
  damagedFile=join(directory,'damaged-password.json');
  await writeFile(damagedFile,JSON.stringify(envelope));
 }else await writeFile(file,copy.financialCopy);
 const profile=join(directory,encrypted?'password-target':'restore-target');
 let target=await openInstallation(profile,setup);
 try{
  await target.page.evaluate(async()=>{
   const store=window.installation,model=await store.reload();
   model.settings.showSmall=false;await store.save(model);
  });
  await operation(target.page,'prepare-anchor');
  const identity=await operation(target.page,'anchor-proof'),before=await operation(target.page,'read');
  const app=await target.context.newPage();
  await app.goto(new URL('/',target.page.url()).href);
  await app.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const targetPassword='Recipient fixture vault 2026';
  if(encrypted)await target.page.evaluate(async password=>{
   const {configureBackupPassword}=await import('/src/backup-vault.js');
   await configureBackupPassword(password,password);
  },targetPassword);
  let suppliedPassword=password;
  const confirmations=[];
  app.on('dialog',async dialog=>{
   if(encrypted&&dialog.type()==='prompt'&&dialog.message().includes('Backup-Passwort')){
    await dialog.accept(suppliedPassword);return;
   }
   confirmations.push(dialog.message());
   if(dialog.type()==='confirm'&&dialog.message().includes('wiederherstellen?'))await dialog.accept();
   else await dialog.dismiss();
  });
  if(encrypted){
   for(const [candidate,pass,errorText] of [[file,'Incorrect fixture password','Backup-Passwort falsch'],
    [damagedFile,password,'Backup ist beschädigt']]){
    suppliedPassword=pass;
    await app.locator('#backupFile').setInputFiles(candidate);
    await app.waitForFunction(message=>document.getElementById('toast')?.textContent.includes(message),errorText);
    assert.deepEqual(await operation(target.page,'read'),before);
    assert.deepEqual(await operation(target.page,'anchor-proof'),identity);
    assert.deepEqual(confirmations,[]);
   }
  }
  await app.locator('#backupFile').setInputFiles(file);
  await app.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Backup wiederhergestellt'));
  assert.equal(confirmations.length,1);
  await target.context.close();target=await openInstallation(profile,setup);
  const restored=await operation(target.page,'read'),finance=JSON.parse(restored.portfolio.raw);
  delete finance.settings;assert.deepEqual(finance,data);
  assert.equal(finance.positions[0].quantityExact,expected.cash);
  assert.deepEqual(finance.journalEntries.map(entry=>entry.id),expected.ids);
  assert.deepEqual(finance.walletHistory,JSON.parse(source.before.portfolio.raw).walletHistory);
  assert.deepEqual(restored.portfolio.settings,before.portfolio.settings);
  assert.equal(restored.portfolio.settings.showSmall,false);
  assert.equal(restored.portfolio.revision,before.portfolio.revision+1);
  assert.equal(restored.portfolio.syncEnrollmentRequired,true);assert.equal(restored.sync,null);
  assert.deepEqual(await operation(target.page,'anchor-proof'),identity);
  if(encrypted){
   const challenge=await target.page.evaluate(async password=>{
    const {encryptWithBackupPassword,decryptPasswordBackup}=await import('/src/backup-vault.js');
    const envelope=JSON.parse(await encryptWithBackupPassword('recipient-vault'));
    return decryptPasswordBackup(envelope,password);
   },targetPassword);
   assert.equal(challenge,'recipient-vault');
   const rollback=await target.context.newPage();
   await rollback.goto(new URL('/',target.page.url()).href);
   await rollback.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   rollback.on('dialog',dialog=>dialog.type()==='prompt'?dialog.accept(password):dialog.accept());
   await rollback.locator('#backupFile').setInputFiles(rollbackFile);
   await rollback.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Backup wiederhergestellt'));
   const reverted=await operation(target.page,'read');
   assert.deepEqual(JSON.parse(reverted.portfolio.raw),JSON.parse(source.before.portfolio.raw));
   assert.equal(reverted.portfolio.revision,restored.portfolio.revision+1);
   assert.deepEqual(reverted.portfolio.settings,before.portfolio.settings);
   assert.deepEqual(await operation(target.page,'anchor-proof'),identity);
   console.log(JSON.stringify({kind:'FLH04RecoveryFiles',status:'PASS',selectedCash:expected.cash,
    rollbackCash:JSON.parse(reverted.portfolio.raw).positions[0].quantityExact}));
  }
  console.log(JSON.stringify({kind:encrypted?'FLH04EncryptedFinancialCopy':'FLH04SelectedFinancialCopy',status:'PASS',fileRestore:true,recipientRestart:true}));
 }finally{await target.context.close();}
}

async function checkSourceRestore({directory,profiles,setup,operation}){
 const [source,other]=profiles,password='Source financial fixture 2026';
 const request={text:await readFile(source.file,'utf8'),expectedPinVersion:2,confirmedHead:other.id,password,
  localFile:await readFile(join(directory,'local-rollback.json'),'utf8'),
  selectedFile:await readFile(join(directory,'selected-password.json'),'utf8')};
 const restore=input=>source.page.evaluate(input=>window.syncTest.api.restorePinnedLocalCopy(input),input);
 await assert.rejects(()=>restore({...request,confirmedHead:source.id}),/confirmed-head/);
 await assert.rejects(()=>restore({...request,selectedFile:request.localFile}),/file-pair/);
 await source.page.evaluate(async input=>{
  const put=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(value,key){
   const result=put.call(this,value,key);
   if(key==='sync-outbox-v1'&&value.disabled==='portfolio-restored')this.transaction.abort();
   return result;
  };
  try{
   try{await window.syncTest.api.restorePinnedLocalCopy(input);}catch(error){
    if(/abort/i.test(error.message))return;
    throw error;
   }
   throw Error('injected transaction unexpectedly committed');
  }finally{IDBObjectStore.prototype.put=put;}
 },request);
 assert.deepEqual(await operation(source.page,'read'),source.before);
 const result=await restore(request);
 assert.deepEqual(result,{status:'restored-local-copy',selectedHead:other.id,
  localRevision:source.before.portfolio.revision+1,applyAuthorized:false});
 await source.context.close();
 source.context=await chromium.launchPersistentContext(join(directory,source.id));
 source.page=await source.context.newPage();await setup(source.page);
 const restored=await operation(source.page,'read');
 assert.equal(restored.portfolio.raw,other.before.portfolio.raw);
 assert.equal(restored.portfolio.revision,result.localRevision);
 assert.equal(restored.portfolio.syncEnrollmentRequired,true);
 assert.deepEqual(restored.portfolio.settings,source.before.portfolio.settings);
 assert.deepEqual(restored.sync,{...source.before.sync,disabled:'portfolio-restored'});
 await assert.rejects(()=>restore(request),/stale-preimage|enrollment-required/);
 assert.deepEqual(await operation(source.page,'read'),restored);

 const race=await other.page.evaluate(async({text,password,confirmedHead})=>{
  const {configureBackupPassword}=await import('/src/backup-vault.js');
  await configureBackupPassword(password,password);
  const request={text,expectedPinVersion:2};
  const {recoveryFiles}=await window.syncTest.api.exportPinnedRecoveryFiles(request);
  return {...request,...recoveryFiles,password,confirmedHead};
 },{text:await readFile(other.file,'utf8'),password,confirmedHead:source.id});
 await other.page.evaluate(request=>{
  const subtle=crypto.subtle,decrypt=subtle.decrypt.bind(subtle);let operations=0;
  subtle.decrypt=async function(algorithm,...args){
   const bytes=await decrypt(algorithm,...args);
   if(new TextDecoder().decode(algorithm.additionalData)==='FolioLab Open password backup v2'&&++operations===4)
    await new Promise(resolve=>{window.resumeSourceRestore=resolve;});
   return bytes;
  };
  window.racedRestore=window.syncTest.api.restorePinnedLocalCopy(request)
   .then(()=>null,error=>error.message).finally(()=>{delete subtle.decrypt;});
 },race);
 await other.page.waitForFunction(()=>typeof window.resumeSourceRestore==='function');
 const tab=await other.context.newPage();await setup(tab);
 const updated=await operation(tab,'save',{revision:other.before.portfolio.revision,raw:other.before.portfolio.raw});
 assert.match(await other.page.evaluate(()=>{window.resumeSourceRestore();return window.racedRestore;}),/pin-preimage/);
 assert.deepEqual(await operation(tab,'read'),{portfolio:updated,sync:other.before.sync});
 console.log(JSON.stringify({kind:'FLH04VerifiedSourceRestore',status:'PASS',rollback:true,concurrentSave:true,restart:true}));
}

export async function checkProfileConflict({setup,operation}){
 const directory=await mkdtemp(join(tmpdir(),'foliolab-profile-conflict-'));
 const profiles=[{id:'L',salt:'a1',amounts:['2.25'],cash:'12.25',ids:['L0']},
  {id:'R2',salt:'a2',amounts:['3','0.125'],cash:'13.125',ids:['R20','R21']}];
 const raw=commonPortfolio(),history=JSON.parse(raw).walletHistory,root=snapshotFrame(raw);
 async function open(profile){
  profile.context=await chromium.launchPersistentContext(join(directory,profile.id));
  profile.page=await profile.context.newPage();await setup(profile.page);
 }
 try{
  for(const profile of profiles){
   await open(profile);
   const p=profile.page,base=await operation(p,'save',{revision:null,raw});
   const queue=await operation(p,'capture',{expectedLocalRevision:base.revision,expectedSyncVersion:null,frameText:root});
   const updated=await operation(p,'save',{revision:base.revision,raw:await appendBookings(p,base.raw,profile.id,profile.amounts)});
   const next=await operation(p,'capture',{expectedLocalRevision:updated.revision,expectedSyncVersion:queue.version,
    frameText:snapshotFrame(updated.raw,profile.id,'R','2',profile.salt.repeat(32),undefined,'device-'+profile.id)});
   profile.frame=next.entries.at(-1).frameText;
   profile.cas={expectedLocalRevision:updated.revision,expectedSyncVersion:next.version};
   profile.before=await operation(p,'read');
  }
  for(const profile of profiles){
   const sibling=profiles.find(other=>other!==profile);
   const {archive}=await profile.page.evaluate(request=>window.syncTest.api.createConflictArchive(request),
    {...profile.cas,frameTexts:[sibling.frame],observationComplete:true});
   profile.file=join(directory,profile.id+'.flh');
   await writeFile(profile.file,archive.text);
   await profile.page.evaluate(request=>window.syncTest.api.pinConflictArchive(request),
    {...profile.cas,text:await readFile(profile.file,'utf8'),expectedDigest:archive.digest,expectedPinVersion:0});
   await profile.page.evaluate(request=>window.syncTest.api.recordPinnedSelection(request),
    {text:archive.text,selectedHead:sibling.id,expectedPinVersion:1});
   await profile.context.close();
  }
  for(const profile of profiles){
   await open(profile);
   const text=await readFile(profile.file,'utf8');
   const sibling=profiles.find(other=>other!==profile);
   assert.deepEqual(profile.cas,sibling.cas);
   const otherArchive=await readFile(sibling.file,'utf8');
   await assert.rejects(()=>profile.page.evaluate(request=>window.syncTest.api.previewPinnedRestore(request),
    {text:otherArchive,expectedPinVersion:2,selectedHead:profile.id}),/archive-digest/);
   for(const head of profiles)await checkArchivedHead(profile.page,text,head.id,head,history,profile===head);
   const reopened=await profile.page.evaluate(text=>window.syncTest.api.reopenPinnedConflictArchive({text}),text);
   assert.deepEqual(reopened.heads,['L','R2']);assert.equal(reopened.pinVersion,2);
   const choice=await profile.page.evaluate(text=>window.syncTest.api.reopenPinnedSelection({text}),text);
   assert.equal(choice.restorePreview.selectedHead,sibling.id);assert.equal(choice.applyAuthorized,false);
   if(profile===profiles[0]){
    for(const encrypted of [false,true])
     await checkRestoredCopy({directory,setup,operation,source:profile,text,expected:sibling,encrypted});
    assert.deepEqual(await profile.page.evaluate(text=>window.syncTest.api.reopenPinnedSelection({text}),text),choice);
   }
   assert.deepEqual(await operation(profile.page,'read'),profile.before);
  }
  await checkSourceRestore({directory,profiles,setup,operation});
  console.log(JSON.stringify({kind:'FLH04ProfileConflictPreview',status:'PASS',persistentProfiles:2,verifiedSelections:4}));
 }finally{
  try{await Promise.all(profiles.map(profile=>profile.context?.close()));}
  finally{await rm(directory,{recursive:true,force:true});}
 }
}
