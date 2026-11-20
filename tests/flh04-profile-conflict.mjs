import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {blankModel,createProvider,createPosition,backup} from '../src/model.js';
import {validateHistorySession} from '../src/wallet-history-state.js';
import {event,stream,NOW} from './wallet-history-fixtures.mjs';
import {snapshotFrame} from './sync-outbox-fixture.mjs';

function commonPortfolio(){
 const model=blankModel();
 model.providers.push(createProvider({id:'broker',name:'Synthetic broker',type:'broker'}));
 model.positions.push(createPosition({id:'cash',providerId:'broker',kind:'cash',name:'EUR',quantity:10,price:1,currency:'EUR'},model));
 const session=validateHistorySession({id:'accepted',chain:'eth',walletKey:'test-wallet',acceptedAt:NOW,
  events:[event({quantityBaseUnits:'90071992547409930001'})],streams:[stream()],quotes:[],issues:[]});
 model.walletHistory={schema:1,sessions:[session],pending:[]};
 return backup(model,{includeHistory:true});
}

async function appendBookings(page,raw,id,amounts){
 return page.evaluate(async({raw,id,amounts})=>{
  const {executeTransaction}=await import('/src/transactions.js');
  const {safeImport,backup}=window.syncTest.model,model=safeImport(JSON.parse(raw));
  amounts.forEach((amount,index)=>executeTransaction(model,{id:id+index,type:'deposit',date:'2026-11-01',
   positionId:'cash',quantity:amount,unitPrice:'1'}));
  return backup(model,{includeHistory:true});
 },{raw,id,amounts});
}

async function checkArchivedHead(page,text,id,expected,history,local){
 const preview=await page.evaluate(request=>window.syncTest.api.previewPinnedRestore(request),
  {text,expectedPinVersion:1,selectedHead:id});
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
   await profile.context.close();
  }
  for(const profile of profiles){
   await open(profile);
   const text=await readFile(profile.file,'utf8');
   const sibling=profiles.find(other=>other!==profile);
   assert.deepEqual(profile.cas,sibling.cas);
   const otherArchive=await readFile(sibling.file,'utf8');
   await assert.rejects(()=>profile.page.evaluate(request=>window.syncTest.api.previewPinnedRestore(request),
    {text:otherArchive,expectedPinVersion:1,selectedHead:profile.id}),/archive-digest/);
   for(const head of profiles)await checkArchivedHead(profile.page,text,head.id,head,history,profile===head);
   const reopened=await profile.page.evaluate(text=>window.syncTest.api.reopenPinnedConflictArchive({text}),text);
   assert.deepEqual(reopened.heads,['L','R2']);assert.equal(reopened.pinVersion,1);
   assert.deepEqual(await operation(profile.page,'read'),profile.before);
  }
  console.log(JSON.stringify({kind:'FLH04ProfileConflictPreview',status:'PASS',persistentProfiles:2,verifiedSelections:4}));
 }finally{
  try{await Promise.all(profiles.map(profile=>profile.context?.close()));}
  finally{await rm(directory,{recursive:true,force:true});}
 }
}
