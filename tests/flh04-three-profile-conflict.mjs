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
   if(index===0)successorRequest=request;
   await profile.context.close();
  }
  const [local,remote]=profiles;
  await open(remote);
  const remoteSaved=await operation(remote.page,'save',{revision:remote.cas.expectedLocalRevision,
   raw:await appendBookings(remote.page,remote.before.portfolio.raw,'later-B',['1.375'])});
  const lateFrame=snapshotFrame(remoteSaved.raw,'B2','B','3','b8'.repeat(32),undefined,'device-B');
  const captured=await operation(remote.page,'capture',{expectedLocalRevision:remoteSaved.revision,
   expectedSyncVersion:remote.cas.expectedSyncVersion,frameText:lateFrame});
  await remote.context.close();
  await open(local);
  await checkSuccessor({profile:local,open,setup,operation,text:await readFile(local.file,'utf8'),
   request:successorRequest,directory,lateFrame:captured.entries.at(-1).frameText,remoteRaw:remoteSaved.raw});
  await local.context.close();
  console.log(JSON.stringify({kind:'FLH04ThreeProfileConflict',status:'PASS',engine:browser.browserType().name(),
   persistentProfiles:3,verifiedFinancialCopies:9,blockedSourceRestores:3}));
 }finally{
  try{await Promise.all(profiles.map(p=>p.context?.close()));}
  finally{await rm(directory,{recursive:true,force:true});}
 }
}

async function checkSuccessor({profile,open,setup,operation,text,request,directory,lateFrame,remoteRaw}){
 const reader=profile.page,writer=await profile.context.newPage();await setup(writer);
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
 const before=profile.before;
 const saved=await operation(writer,'save',{revision:before.portfolio.revision,
  raw:await appendBookings(writer,before.portfolio.raw,'next',['0.75'])});
 const frameText=snapshotFrame(saved.raw,'A2','A','3','b9'.repeat(32),undefined,'device-A');
 const queue=await operation(writer,'capture',{expectedLocalRevision:saved.revision,expectedSyncVersion:before.sync.version,frameText});
 const args={previousText:text,expectedPinVersion:request.expectedPinVersion,expectedLocalRevision:saved.revision,
  expectedSyncVersion:queue.version,frameTexts:[lateFrame]};
 const next=await writer.evaluate(req=>window.syncTest.api.createSuccessorConflictArchive(req),args);
 assert.deepEqual(next.transition,{previousSelection:'B',additionalHeads:[],branches:[
  {previousHead:'A',currentHeads:['A2']},{previousHead:'B',currentHeads:['B2']},{previousHead:'C',currentHeads:['C']}]});
 assert.equal(next.pinVersion,request.expectedPinVersion);assert.deepEqual(next.heads,['A2','B2','C']);
 const file=join(directory,'A-next.flh');await writeFile(file,next.archive.text);
 const readback=await readFile(file,'utf8');
 args.expectedPortfolioDigest=next.successorPortfolioDigest;
 const pin=req=>writer.evaluate(req=>window.syncTest.api.pinSuccessorConflictArchive(req),req);
 await assert.rejects(()=>pin({...args,text:readback.slice(0,-1)}),/successor-readback/);
 const pinned=await pin({...args,text:readback});
 assert.equal(pinned.pinVersion,request.expectedPinVersion+1);assert.equal(pinned.applyAuthorized,false);
 assert.match(await reader.evaluate(()=>{window.resumeOldSelection();return window.oldSelection;}),/stale-preimage|pin-preimage|pin-version|pin-binding/);
 await assert.rejects(()=>reader.evaluate(req=>window.syncTest.api.restorePinnedLocalCopy(req),request),/selection-missing/);
 await profile.context.close();await open(profile);
 const page=profile.page;
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
 console.log(JSON.stringify({kind:'FLH04ConflictSuccessor',status:'PASS',engine:process.env.ENGINE}));
}
