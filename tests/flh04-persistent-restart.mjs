import {snapshotFrame as frame} from './sync-outbox-fixture.mjs';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';

// Only the browser directly launched by this test with its unique temporary profile is eligible.
async function fixtureBrowserPid(context,profile){
 const session=await context.browser().newBrowserCDPSession();
 try{
  const {processInfo}=await session.send('SystemInfo.getProcessInfo');
  const browsers=processInfo.filter(info=>info.type==='browser');
  assert.equal(browsers.length,1);
  const pid=browsers[0].id;
  assert.ok(Number.isSafeInteger(pid)&&pid>1&&pid!==process.pid);
  const args=(await readFile('/proc/'+pid+'/cmdline','utf8')).split('\0');
  assert.ok(args.includes('--user-data-dir='+profile));
  const status=await readFile('/proc/'+pid+'/status','utf8');
  assert.equal(Number(status.match(/^PPid:\s*(\d+)$/m)?.[1]),process.pid);
  return pid;
 }finally{await session.detach();}
}

async function withCrashedProfile(run){
 assert.equal(process.platform,'linux');
 const profile=await mkdtemp(join(tmpdir(),'foliolab-outbox-restart-'));
 let context;
 try{
  context=await chromium.launchPersistentContext(profile);
  await run(context,async()=>{
   const browser=context.browser(),pid=await fixtureBrowserPid(context,profile);
   const disconnected=once(browser,'disconnected',{signal:AbortSignal.timeout(15000)});
   process.kill(pid,'SIGKILL');
   await disconnected;
   assert.equal(browser.isConnected(),false);
   context=await chromium.launchPersistentContext(profile);
   assert.notEqual(await fixtureBrowserPid(context,profile),pid);
   return {reopened:await context.newPage(),crash:{mechanism:'SIGKILL',target:'browser',freshProcess:true,sameProfile:true}};
  });
 }finally{
  try{if(context?.browser()?.isConnected())await context.close();}finally{await rm(profile,{recursive:true,force:true});}
 }
}

// A synthetic challenge lets us check continuity of the non-extractable epoch key across processes.
async function checkEpochKey(page,previous=null){
 return page.evaluate(async previous=>{
  const tx=window.syncTest.db.transaction('records','readonly');
  const request=tx.objectStore('records').get('sync-local-anchor-v1');
  const anchor=await new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve(request.result);tx.onabort=()=>reject(tx.error);});
  const params={name:'HKDF',hash:'SHA-256',salt:new Uint8Array(32),info:new TextEncoder().encode('fixture:anchor-reopen')};
  const key=await crypto.subtle.deriveKey(params,anchor.epochKey,{name:'AES-GCM',length:256},false,[previous?'decrypt':'encrypt']);
  if(previous){
   const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(previous.iv)},key,new Uint8Array(previous.cipher));
   return new TextDecoder().decode(plain);
  }
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode('persistent test profile'));
  return {iv:Array.from(iv),cipher:Array.from(new Uint8Array(cipher))};
 },previous);
}

export async function checkPersistentRestart({setup,operation,checkUncertainRetry,assertCrashBarrier}){
 await withCrashedProfile(async(context,restart)=>{
  const engine=context.browser().version();
  const evidence=await checkUncertainRetry({context,setup,operation,restart});
  console.log(JSON.stringify({kind:'FLH04PersistentOutboxRestart',status:'PASS',engine,...evidence}));
 });
 await withCrashedProfile(async(context,restart)=>{
  const source=await context.newPage();await setup(source);
  const initial=await operation(source,'initialize');
  const fenced=await operation(source,'adopt',{expected:initial,raw:initial.raw});
  await source.evaluate(async()=>{
   const {installLifecycleHarness}=await import('/tests/flh04-source-lifecycle-harness.mjs');
   const {prepareLocalSyncAnchor,db}=window.syncTest;
   window.anchorPreparation=installLifecycleHarness({controller:{prepare:()=>prepareLocalSyncAnchor(db)},action:'prepare',barrierMode:'readwrite'});
  });
  await source.waitForFunction(()=>window.anchorPreparation.snapshot().settled||window.anchorPreparation.snapshot().events.some(e=>e.name==='barrier-held'));
  assertCrashBarrier(await source.evaluate(()=>window.anchorPreparation.snapshot()),'readwrite',0);
  const proof=await operation(source,'anchor-proof'),challenge=await checkEpochKey(source);
  const {reopened,crash}=await restart();await setup(reopened);
  assert.deepEqual(await operation(reopened,'read'),{portfolio:fenced,sync:null});
  assert.deepEqual(await operation(reopened,'anchor-proof'),proof);
  assert.equal(await checkEpochKey(reopened,challenge),'persistent test profile');
  await assert.rejects(()=>operation(reopened,'prepare-anchor'),/existing-anchor/);
  await assert.rejects(()=>operation(reopened,'recover'),/enrollment-required/);
  console.log(JSON.stringify({kind:'FLH04PersistentAnchorRestart',status:'PASS',crash}));
 });
 await withCrashedProfile(async(context,restart)=>{
  const a=await context.newPage();await setup(a);
  const root=await operation(a,'initialize');
  await operation(a,'capture',{expectedLocalRevision:root.revision,expectedSyncVersion:null,frameText:frame(root.raw)});
  const cas={expectedLocalRevision:root.revision,expectedSyncVersion:1};
  const result=await a.evaluate(req=>window.syncTest.api.createConflictArchive(req),{...cas,observationComplete:true,
   frameTexts:[frame(root.raw,'B','R','2','91'.repeat(32)),frame(root.raw,'C','R','2','92'.repeat(32))]});
  const dir=await mkdtemp(join(tmpdir(),'foliolab-pin-restart-'));
  try{
   const file=join(dir,'conflict.flh');await writeFile(file,result.archive.text);
   await a.evaluate(async request=>{
    const {installLifecycleHarness}=await import('/tests/flh04-source-lifecycle-harness.mjs');
    window.pinWrite=installLifecycleHarness({controller:window.syncTest.api,action:'pinConflictArchive',model:request,barrierMode:'readwrite'});
   },{...cas,text:await readFile(file,'utf8'),expectedDigest:result.archive.digest,expectedPinVersion:0});
   await a.waitForFunction(()=>window.pinWrite.snapshot().settled||window.pinWrite.snapshot().events.some(e=>e.name==='barrier-held'));
   assertCrashBarrier(await a.evaluate(()=>window.pinWrite.snapshot()),'readwrite',0);
   const {reopened,crash}=await restart();await setup(reopened);
   const verified=await reopened.evaluate(text=>window.syncTest.api.reopenPinnedConflictArchive({text}),await readFile(file,'utf8'));
   assert.equal(verified.pinVersion,1);assert.deepEqual(verified.heads,result.heads);assert.equal(verified.applyAuthorized,false);
   console.log(JSON.stringify({kind:'FLH04PersistentArchivePin',status:'PASS',crash}));
  }finally{await rm(dir,{recursive:true,force:true});}
 });
}
