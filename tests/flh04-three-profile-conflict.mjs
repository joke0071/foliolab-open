import {saveConflictSet,checkRecoverySetRestore,checkSavedSet,pauseRecoverySet,resumeRecoverySet} from './flh04-recovery-set.mjs';
import {checkPreviousArchiveClient} from './flh04-previous-archive-client.mjs';
import {checkPendingBooking} from './flh04-pending-booking.mjs';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {snapshotFrame} from './sync-outbox-fixture.mjs';
import {commonPortfolio,appendBookings} from './flh04-source-restore-fixture.mjs';

export async function checkThreeProfileConflict(browser,setup,operation){
 const directory=await mkdtemp(join(tmpdir(),'foliolab-three-profiles-'));
 const base=commonPortfolio(),root=snapshotFrame(base);
 const profiles=['A','B','C'].map(id=>({id,path:join(directory,id)}));
 async function open(profile){
  profile.context=await browser.browserType().launchPersistentContext(profile.path);
  profile.page=await profile.context.newPage();await setup(profile.page);
 }
 const password='Three local synthetic profiles 2026';
 try{
  for(const profile of profiles){
   await open(profile);
   const initial=await operation(profile.page,'save',{revision:null,raw:base});
   const queue=await operation(profile.page,'capture',{expectedLocalRevision:initial.revision,expectedSyncVersion:null,frameText:root});
   profile.revision=initial.revision;profile.version=queue.version;
  }
  // No profile sees another's branch until all three edits have committed.
  await Promise.all(profiles.map(async(profile,index)=>{
   const {id,page}=profile;
   const model=JSON.parse(base);
   if(id==='B')model.providers[0].name='Private branch B';
   if(id==='C')model.performanceFlowTrackingSince='2026-11-01';
   const raw=id==='A'?await appendBookings(page,base,id,['2.25']):JSON.stringify(model);
   const saved=await operation(page,'save',{revision:profile.revision,raw});
   profile.frame=snapshotFrame(saved.raw,id,'R','2',('a'+index).repeat(32),undefined,'device-'+id);
   const next=await operation(page,'capture',{expectedLocalRevision:saved.revision,expectedSyncVersion:profile.version,frameText:profile.frame});
   profile.before=await operation(page,'read');
   profile.data=JSON.parse(saved.raw);delete profile.data.settings;
   profile.cas={expectedLocalRevision:saved.revision,expectedSyncVersion:next.version};
  }));
  const original=JSON.parse(base);delete original.settings;
  const expected=profiles.map(({id,data})=>({id,changedSections:Object.keys(data).filter(k=>
   JSON.stringify(data[k])!==JSON.stringify(original[k])).sort()}));
  assert.ok(expected[0].changedSections.includes('journalEntries'));
  assert.deepEqual(expected[1].changedSections,['providers']);
  assert.deepEqual(expected[2].changedSections,['performanceFlowTrackingSince']);
  for(const profile of profiles){
   const siblings=profiles.filter(p=>p!==profile);
   const {archive}=await profile.page.evaluate(req=>window.syncTest.api.createConflictArchive(req),
    {...profile.cas,observationComplete:true,frameTexts:[siblings[1].frame,siblings[0].frame,siblings[1].frame]});
   profile.file=join(directory,profile.id+'.flh');await writeFile(profile.file,archive.text);
   await profile.page.evaluate(req=>window.syncTest.api.pinConflictArchive(req),
    {...profile.cas,text:archive.text,expectedDigest:archive.digest,expectedPinVersion:0});
   await profile.context.close();
  }
  let successorRequest;
  for(const [index,profile] of profiles.entries()){
   await open(profile);
   const {page}=profile,text=await readFile(profile.file,'utf8');
   const review=await page.evaluate(async text=>{
    const {api}=window.syncTest;
    const {showPinnedConflict}=await import('/experimental/sync/sync-conflict-view.js');
    const container=document.createElement('section');document.body.append(container);
    await showPinnedConflict(container,api,text);
    const rows=[...container.querySelectorAll('tbody tr')].map(row=>row.textContent);
    const {overview,applyAuthorized,pinVersion}=await api.reopenPinnedConflictArchive({text,includeOverview:true});
    try{await showPinnedConflict(container,api,text.slice(0,-1));}catch{}
    return {overview,rows,applyAuthorized,pinVersion,remaining:container.childElementCount};
   },text);
   assert.deepEqual(review.overview,{status:'compared',baseId:'R',heads:expected});
   assert.equal(review.remaining,0);assert.equal(review.pinVersion,1);assert.equal(review.applyAuthorized,false);
   assert.match(review.rows[0],/Buchungen/);assert.equal(review.rows[1],'BAnbieter');
   assert.match(review.rows[2],/^CBeginn/);assert.doesNotMatch(review.rows.join(' '),/Private branch|12\.25/);
   for(const head of profiles){
    await page.evaluate(req=>window.syncTest.api.recordPinnedSelection(req),
     {text,selectedHead:head.id,expectedPinVersion:1+profiles.indexOf(head)});
    const result=await page.evaluate(req=>window.syncTest.api.exportPinnedFinancialCopy(req),
     {text,expectedPinVersion:2+profiles.indexOf(head)});
    assert.deepEqual(JSON.parse(result.financialCopy),head.data);
   }
   const selectedHead=profiles[(index+1)%profiles.length].id;
   const request=await page.evaluate(async({text,selectedHead,password})=>{
    const {api}=window.syncTest;
    const {configureBackupPassword}=await import('/src/backup-vault.js');await configureBackupPassword(password,password);
    const pin=await api.recordPinnedSelection({text,selectedHead,expectedPinVersion:4});
    const req={text,expectedPinVersion:pin.pinVersion};
    const {recoveryFiles}=await api.exportPinnedRecoveryFiles(req);
    const verified=await api.verifyPinnedRecoveryFiles({...req,...recoveryFiles,password});
    if(!verified.recoveryFilesVerified)throw Error('unverified test pair');
    return {...req,...recoveryFiles,password,confirmedHead:selectedHead};
   },{text,selectedHead,password});
   await assert.rejects(()=>page.evaluate(req=>window.syncTest.api.restorePinnedLocalCopy(req),request),/restore-needs-local-and-selected-heads/);
   assert.deepEqual(await operation(page,'read'),profile.before);
   assert.equal(await page.evaluate(()=>window.syncTest.api.archivePinVersion()),request.expectedPinVersion);
   if(index===0){
    successorRequest=request;profile.backupSet=await saveConflictSet(page,request,directory,profiles);
   }
   if(index===1){
    await pauseRecoverySet(page,request,false);
    const writer=await profile.context.newPage();await setup(writer);
    await writer.evaluate(req=>window.syncTest.api.recordPinnedSelection(req),{...request,selectedHead:'A'});
    assert.match(await resumeRecoverySet(page),/pin-version|selection-changed/);
    assert.deepEqual(await operation(writer,'read'),profile.before);await writer.close();
   }
   if(index===2)await checkPreviousArchiveClient({profile,open,operation,request,directory});
   await profile.context.close();
  }
  const [local,remote]=profiles;
  await open(remote);
  const remoteSaved=await operation(remote.page,'save',{revision:remote.cas.expectedLocalRevision,
   raw:await appendBookings(remote.page,remote.before.portfolio.raw,'later-B',['1.375'])});
  const lateFrame=snapshotFrame(remoteSaved.raw,'B2','B','3','b8'.repeat(32),undefined,'device-B');
  const captured=await operation(remote.page,'capture',{expectedLocalRevision:remoteSaved.revision,
   expectedSyncVersion:remote.cas.expectedSyncVersion,frameText:lateFrame});
  const sourceRequest={previousText:await readFile(remote.file,'utf8'),
   expectedPinVersion:await remote.page.evaluate(()=>window.syncTest.api.archivePinVersion()),
   expectedLocalRevision:remoteSaved.revision,expectedSyncVersion:captured.version};
  const source=await remote.page.evaluate(req=>window.syncTest.api.prepareSuccessorConflictArchive(req),sourceRequest);
  const sourceFile=join(directory,'B-next.flh');await writeFile(sourceFile,source.archive.text);
  const sourceArchive={text:await readFile(sourceFile,'utf8'),expectedDigest:source.archive.digest};
  await remote.context.close();await open(remote);
  const localFiles={previousText:await readFile(remote.file,'utf8'),text:await readFile(sourceFile,'utf8')};
  const pending=await remote.page.evaluate(files=>window.syncTest.api.inspectSuccessorHandoff(files),localFiles);
  assert.equal(pending.status,'pending-confirmation');
  const done=await remote.page.evaluate(files=>window.syncTest.api.confirmSuccessorHandoff(files),localFiles);
  assert.equal(done.pinVersion,pending.pinVersion+1);
  await remote.context.close();
  await open(local);
  await checkRecoverySetRestore({browserType:browser.browserType(),directory,source:local,profiles,request:successorRequest});
  assert.deepEqual(await operation(local.page,'read'),local.before);
  console.log(JSON.stringify({kind:'FLH04RecoverySetRestore',status:'PASS',engine:browser.browserType().name(),
   restored:['local:A','head:A','head:B','head:C'],selectedHead:successorRequest.confirmedHead}));
  await checkSuccessor({profile:local,open,setup,operation,text:await readFile(local.file,'utf8'),
   request:successorRequest,directory,sourceArchive,sourceFile,remoteRaw:remoteSaved.raw});
  await local.context.close();
  console.log(JSON.stringify({kind:'FLH04ThreeProfileConflict',status:'PASS',engine:browser.browserType().name(),
   persistentProfiles:3,verifiedFinancialCopies:9,blockedSourceRestores:3}));
 }finally{
  try{await Promise.all(profiles.map(p=>p.context?.close()));}
  finally{await rm(directory,{recursive:true,force:true});}
 }
}

async function checkSuccessor({profile,open,setup,operation,text,request,directory,sourceArchive,sourceFile,remoteRaw}){
 const reader=profile.page,writer=await profile.context.newPage();await setup(writer);
 const damaged={...sourceArchive,text:sourceArchive.text.slice(0,-1)};
 await assert.rejects(()=>writer.evaluate(req=>window.syncTest.api.createSuccessorConflictArchive(req),
  {...profile.cas,previousText:text,expectedPinVersion:request.expectedPinVersion,sourceArchive:damaged}),/source-digest/);
 const retained=await writer.evaluate(text=>window.syncTest.api.reopenPinnedSelection({text}),text);
 assert.equal(retained.restorePreview.selectedHead,'B');assert.equal(retained.pinVersion,request.expectedPinVersion);
 // Suspend an old selection after it has read the pin. The other tab records a
 // booking, captures it and binds the new file while this operation is pending.
 await reader.evaluate(async req=>{
  const subtle=crypto.subtle,digest=subtle.digest.bind(subtle);
  let resume;
  const gate=new Promise(resolve=>{resume=resolve;});
  subtle.digest=async function(...args){
   delete subtle.digest;
   window.resumeOldSelection=resume;await gate;
   return digest(...args);
  };
  window.oldSelection=window.syncTest.api.recordPinnedSelection(req).then(()=>null,e=>e.message);
 },{text,expectedPinVersion:request.expectedPinVersion,selectedHead:'A'});
 await reader.waitForFunction(()=>typeof window.resumeOldSelection==='function');
 const setRequest=await checkSavedSet(reader,request,profile.backupSet);
 await pauseRecoverySet(reader,setRequest,true);
 const before=profile.before;
 const saved=await operation(writer,'save',{revision:before.portfolio.revision,
  raw:await appendBookings(writer,before.portfolio.raw,'next',['0.75'])});
 assert.match(await resumeRecoverySet(reader),/pin-preimage/);
 const frameText=snapshotFrame(saved.raw,'A2','A','3','b9'.repeat(32),undefined,'device-A');
 const queue=await operation(writer,'capture',{expectedLocalRevision:saved.revision,expectedSyncVersion:before.sync.version,frameText});
 const args={previousText:text,expectedPinVersion:request.expectedPinVersion,expectedLocalRevision:saved.revision,
  expectedSyncVersion:queue.version,sourceArchive};
 const next=await writer.evaluate(req=>window.syncTest.api.createSuccessorConflictArchive(req),args);
 assert.deepEqual(next.transition,{previousSelection:'B',additionalHeads:[],branches:[
  {previousHead:'A',currentHeads:['A2']},{previousHead:'B',currentHeads:['B2']},{previousHead:'C',currentHeads:['C']}]});
 assert.equal(next.pinVersion,request.expectedPinVersion);assert.deepEqual(next.heads,['A2','B2','C']);
 assert.notEqual(next.archive.text.split('\n',1)[0],sourceArchive.text.split('\n',1)[0]);
 await writer.evaluate(async()=>{
  const {showArchiveHandoff}=await import('/experimental/sync/sync-archive-handoff-view.js');
  showArchiveHandoff(document.body,window.syncTest.api);
 });
 const output=writer.locator('output[role=status]'),confirm=writer.getByRole('button',{name:'Übernahme bestätigen'});
 const inspect=writer.getByRole('button',{name:'Dateien prüfen'}),sourceInput=writer.getByLabel('Quellarchiv (',{exact:false});
 await writer.getByLabel('Bisheriges Archiv').setInputFiles(profile.file);await sourceInput.setInputFiles(sourceFile);
 await writer.getByText('Neue Übernahme vorbereiten',{exact:true}).click();
 await writer.getByLabel('Prüfsumme des Quellarchivs (SHA-256)').fill(sourceArchive.expectedDigest);
 await writer.getByRole('button',{name:'Zielarchiv vorbereiten'}).click();
 await output.filter({hasText:'zum Speichern bereit'}).waitFor();
 const download=writer.getByRole('link',{name:'Zielarchiv speichern'});
 async function save(path){
  const [event]=await Promise.all([writer.waitForEvent('download'),download.click()]);
  await event.saveAs(path);return readFile(path,'utf8');
 }
 const file=join(directory,'A-next.flh'),readback=await save(file);
 assert.equal(readback,next.archive.text);
 await writer.getByRole('button',{name:'Zielarchiv erneut erstellen'}).click();
 await output.filter({hasText:'zum Speichern bereit'}).waitFor();
 assert.equal(await save(join(directory,'regenerated.flh')),readback);
 args.expectedPortfolioDigest=next.successorPortfolioDigest;
 const pin=req=>writer.evaluate(req=>window.syncTest.api.pinSuccessorConflictArchive(req),req);
 await assert.rejects(()=>pin({...args,text:readback,sourceArchive:damaged}),/source-digest/);
 assert.equal(await writer.evaluate(()=>window.syncTest.api.archivePinVersion()),request.expectedPinVersion);
 await assert.rejects(()=>pin({...args,text:readback.slice(0,-1)}),/successor-readback/);
 await writer.getByLabel('Gespeichertes Zielarchiv').setInputFiles(file);
 await inspect.click();
 await output.filter({hasText:'Bestätigung steht aus'}).waitFor();
 await sourceInput.setInputFiles(profile.file);assert.equal(await confirm.isDisabled(),true);
 await inspect.click();await output.filter({hasText:'fehlgeschlagen'}).waitFor();
 assert.equal(await confirm.isDisabled(),true);
 await sourceInput.setInputFiles(sourceFile);await inspect.click();
 await output.filter({hasText:'Bestätigung steht aus'}).waitFor();await confirm.click();
 await output.filter({hasText:'Zielarchiv ist bestätigt'}).waitFor();
 const files={previousText:text,text:readback,sourceText:sourceArchive.text};
 const pinned=await writer.evaluate(files=>window.syncTest.api.inspectSuccessorHandoff(files),files);
 assert.equal(pinned.pinVersion,request.expectedPinVersion+1);assert.equal(pinned.applyAuthorized,false);
 assert.match(await reader.evaluate(()=>{window.resumeOldSelection();return window.oldSelection;}),/stale-preimage|pin-preimage|pin-version|pin-binding/);
 await assert.rejects(()=>reader.evaluate(req=>window.syncTest.api.restorePinnedLocalCopy(req),request),/selection-missing/);
 await profile.context.close();await open(profile);
 const page=profile.page;
 assert.deepEqual(await page.evaluate(files=>window.syncTest.api.confirmSuccessorHandoff(files),files),pinned);
 await assert.rejects(()=>page.evaluate(text=>window.syncTest.api.reopenPinnedConflictArchive({text}),text),/archive-digest/);
 await assert.rejects(()=>page.evaluate(text=>window.syncTest.api.reopenPinnedSelection({text}),readback),/selection-missing/);
 const reopened=await page.evaluate(text=>window.syncTest.api.reopenPinnedConflictArchive({text,includeOverview:true}),readback);
 assert.deepEqual(reopened.heads,['A2','B2','C']);assert.equal(reopened.pinVersion,pinned.pinVersion);
 let version=pinned.pinVersion;
 for(const [selectedHead,raw,quantity] of [['A2',saved.raw,'13'],['B2',remoteRaw,'11.375']]){
  const choice=await page.evaluate(req=>window.syncTest.api.recordPinnedSelection(req),
   {text:readback,selectedHead,expectedPinVersion:version});
  version=choice.pinVersion;
  const copy=await page.evaluate(req=>window.syncTest.api.exportPinnedFinancialCopy(req),
   {text:readback,expectedPinVersion:version});
  const data=JSON.parse(raw);delete data.settings;
  assert.deepEqual(JSON.parse(copy.financialCopy),data);assert.equal(data.positions[0].quantityExact,quantity);
 }
 assert.deepEqual(await operation(page,'read'),{portfolio:saved,sync:queue});
 await checkPendingBooking({profile,open,operation,directory,file,readback,saved,queue,version});
 console.log(JSON.stringify({kind:'FLH04ArchiveHandoffFiles',status:'PASS',engine:process.env.ENGINE}));
 console.log(JSON.stringify({kind:'FLH04ConflictSuccessor',status:'PASS',engine:process.env.ENGINE}));
}
