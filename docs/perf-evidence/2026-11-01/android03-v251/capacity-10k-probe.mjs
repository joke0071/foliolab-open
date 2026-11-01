import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir,cpus,totalmem} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const out=process.env.BENCH_OUTPUT||'artifacts/gates/mixed-ab';
const base=process.env.BENCH_BASE||'http://127.0.0.1:4173/';
const require=createRequire(resolve('package.json'));
const expectedCache=readFileSync('sw.js','utf8').match(/const CACHE='([^']+)'/)[1];
const report={host:{cpuModel:cpus()[0]?.model,cpuCount:cpus().length,totalMemory:totalmem()},node:process.version,playwright:require('playwright/package.json').version,platform:process.platform,arch:process.arch,cache:expectedCache,workerHelperSha256:createHash('sha256').update(readFileSync(new URL('./browser-controlled-storage-fixture.mjs',import.meta.url))).digest('hex'),scriptSha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),sha:process.env.BENCH_SHA,scope:'EMULATED 10k capacity probe; backup rejection remains explicit, no portable-backup guarantee; synthetic IndexedDB; service-worker-controlled persistent Chromium profiles; fresh-process cold vs same-page warm/offline; CPU4x is not Android hardware or native installed-PWA launch',runs:5,scenarios:[],comparison:'ABBA; exact persisted seed reused across variants; profile preparation excluded from timing',limitations:['CPU4x applies to the page main thread; workers/native I/O are not a physical Android device, installed-PWA launch or constrained memory.','Startup timer begins at navigation, excludes process-launch overhead and ends after validated dashboard label plus two frames.','Tab navigation includes Playwright dispatch and two frames; exact source variants and raw samples retained.']};
const ready=async (p,expected=null)=>{await p.waitForFunction(expected=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv')&&document.getElementById('totalValue')?.textContent.includes('€')&&(!expected||document.getElementById('totalValue').textContent===expected),expected);return p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(performance.now())))));};
const stateHash=async p=>createHash('sha256').update(await p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return JSON.stringify(await readPortfolioRecord(db));}finally{db.close();}})).digest('hex');
const observer=()=>{window.__mixedLongTasks=[];new PerformanceObserver(list=>{for(const e of list.getEntries())window.__mixedLongTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});};
const measure=async (p,expected)=>({interactiveMs:await ready(p,expected),longTasks:await p.evaluate(()=>window.__mixedLongTasks)});
const workerState=async p=>p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {controlled:!!navigator.serviceWorker.controller&&navigator.serviceWorker.controller===r?.active,active:r?.active?.state,controller:navigator.serviceWorker.controller?.scriptURL,caches:await caches.keys()};});
const requireWorker=async p=>{const v=await workerState(p);assert.equal(v.controlled,true);assert.equal(v.active,'activated');assert.deepEqual(v.caches.filter(k=>k.startsWith('foliolab-open-')),[expectedCache]);return v;};
for(const bookings of [10000])for(const cpuRate of [4]){
 const profile=mkdtempSync(join(tmpdir(),'foliolab-mixed-'));
 const options={headless:true,viewport:{width:390,height:844}};
 let context=await chromium.launchPersistentContext(profile,options),p=context.pages()[0];const errors=[];p.on('pageerror',e=>errors.push(e.message));report.chromium=context.browser()?.version()??'unknown';
 try{
  await p.goto(base);await ready(p);
  await controlledStorageFixture(p,()=>ready(p),()=>p.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}}));
  const seedPath=(process.env.BENCH_SEED_FILE||'/tmp/foliolab-perf-abba-seed')+'-'+bookings+'.json';
  const seed=existsSync(seedPath)?JSON.parse(readFileSync(seedPath,'utf8')):null;
  const fixture=await p.evaluate(async ({bookings,seed})=>{
   if(seed){
    const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(seed);s.close();
    return {positions:seed.positions.length,bookings:seed.bookings.length,journalEntries:seed.journalEntries.length,references:seed.snapshots.length,bytes:new TextEncoder().encode(JSON.stringify(seed)).length,fixtureModel:seed};
   }
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js');const {executeTransaction}=await import('/src/transactions.js');const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=false;
   for(let n=0;n<3;n++){m.providers.push(createProvider({id:'mixed-p'+n,name:'SYNTHETIC Mixed '+n}));m.accounts.push(createAccount({id:'mixed-a'+n,providerId:'mixed-p'+n,name:'SYNTHETIC Account '+n,type:n===2?'checking':'securities'},m));}
   for(let n=0;n<(bookings?19:3);n++){const group=n%3;m.positions.push(createPosition({id:'mixed-'+n,providerId:'mixed-p'+group,accountId:'mixed-a'+group,name:'SYNTHETIC '+n,kind:['etf','crypto','cash'][group],symbol:group===1?'ETH':'SYN'+n,quantity:10,price:group===2?1:100,currency:'EUR',...(group===1?{coinId:'ethereum',wallet:{enabled:true,chain:'evm',chainId:1,address:'0x1111111111111111111111111111111111111111'}}:{})},m));}
   const bookable=m.positions.filter(p=>!p.wallet?.enabled),allBookings=[],allJournal=[];let initialOpenings;
   // Bound fixture-construction cloning only. Each transaction still runs through
   // the real journal operation; holdings/basis/openings carry across batches.
   // The final stored database contains every booking and journal entry.
   for(let start=0;start<bookings;start+=100){m.bookings=[];m.journalEntries=[];for(let n=start;n<Math.min(start+100,bookings);n++){const position=bookable[n%bookable.length];executeTransaction(m,{id:'mixed-book-'+n,type:position.kind==='cash'?'deposit':'buy',positionId:position.id,date:'2025-01-01',quantity:'0.01',unitPrice:'1',notes:'SYNTHETIC benchmark'});}if(start===0)initialOpenings=structuredClone(m.openingPositions);for(const journal of m.journalEntries)journal.sequence+=start;allBookings.push(...m.bookings);allJournal.push(...m.journalEntries);}m.bookings=allBookings;m.journalEntries=allJournal;m.openingPositions=initialOpenings||[];
   if(m.bookings.length!==bookings||m.journalEntries.length!==bookings)throw Error('Incomplete synthetic fixture');
   for(let n=0;n<(bookings?1825:30);n++){const date=new Date(Date.UTC(2021,0,1+n)).toISOString().slice(0,10);m.snapshots.push({id:'mixed-ref-'+n,date,total:10000,totalEURExact:'10000',valuationStatus:'manual',source:'manual',byAccount:null,byPosition:null,quoteTimes:[],revisions:[],note:''});}
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();return {positions:m.positions.length,bookings:m.bookings.length,journalEntries:m.journalEntries.length,references:m.snapshots.length,bytes:new TextEncoder().encode(JSON.stringify(m)).length,fixtureModel:m};
  },{bookings,seed});
  if(!seed)writeFileSync(seedPath,JSON.stringify(fixture.fixtureModel));
  delete fixture.fixtureModel;
  fixture.seedSha256=createHash('sha256').update(readFileSync(seedPath)).digest('hex');
  await p.reload();await ready(p);
  fixture.dashboardLabel=await p.locator('#totalValue').textContent();assert.ok(fixture.dashboardLabel?.includes('€'));fixture.initialWorker=await requireWorker(p);const expected=await stateHash(p);
  const values=await p.evaluate(async()=>{
   const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{totalExactEUR}=await import('/src/model.js'),{ledgerQuantityAudit}=await import('/src/transactions.js'),{historicalWealthView}=await import('/src/historical-portfolio-value.js');
   const db=await openPortfolioDB();let raw;try{raw=(await readUnverifiedRecord(db)).raw;}finally{db.close();}
   const storage=new PortfolioStorage(),m=await storage.initialize();storage.close();if(!ledgerQuantityAudit(m).ok)throw Error('Benchmark ledger mismatch');
   return {raw,totalExactEUR:totalExactEUR(m),historical:JSON.stringify(historicalWealthView(m))};
  });
  // Encryption and complete restore are preparation gates, never timed startup work.
  // This separate 10k capacity probe retains honest reader-limit rejection; it does not relax any export guard.
  fixture.backupCapacity=await p.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const {backup,safeImport}=await import('/src/model.js');
   const {createCompleteBackup,unpackCompleteBackup}=await import('/src/complete-backup.js');
   const {encryptBackup,decryptBackup}=await import('/src/crypto-backup.js');
   const {configureBackupPassword,encryptWithBackupPassword,decryptPasswordBackup}=await import('/src/backup-vault.js');
   const storage=new PortfolioStorage(),model=await storage.initialize();storage.close();
   const raw=backup(model,{includeHistory:true}),plain=JSON.stringify(createCompleteBackup(JSON.parse(raw)));
   const password='SYNTHETIC benchmark restore only',results=[];
   await configureBackupPassword(password,password);
   for(const format of ['v1','v2']){
    try{
     const encoded=JSON.parse(await (format==='v1'?encryptBackup(plain,password):encryptWithBackupPassword(plain)));
     const decoded=await (format==='v1'?decryptBackup(encoded,password):decryptPasswordBackup(encoded,password));
     if(backup(safeImport(unpackCompleteBackup(JSON.parse(decoded)).data),{includeHistory:true})!==raw)throw Error('Restore mismatch');
     results.push({format,accepted:true,exactRoundTrip:true});
    }catch(e){
     if(!/sichere Wiederherstellung.*unverändert/.test(e.message))throw e;
     results.push({format,accepted:false,guardMessage:e.message});
    }
   }
   return {plainCharacters:plain.length,plainBytes:new TextEncoder().encode(plain).byteLength,results};
  });
  assert.equal(await stateHash(p),expected);
  fixture.canonicalRawSha256=createHash('sha256').update(values.raw).digest('hex');fixture.historicalSha256=createHash('sha256').update(values.historical).digest('hex');fixture.totalExactEUR=values.totalExactEUR;
  await context.close();
  const samples=[];
  for(let n=0;n<5;n++){
   context=await chromium.launchPersistentContext(profile,options);p=context.pages()[0];p.on('pageerror',e=>errors.push(e.message));const cdp=await context.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});await p.addInitScript(observer);
   await p.goto(base);const cold=await measure(p,fixture.dashboardLabel);const coldWorker=await requireWorker(p);assert.equal(await stateHash(p),expected);
   const navigation={};for(const tab of ['positions','bookings','history','dashboard','more']){const start=Date.now();await p.locator('#mobileNav [data-page="'+tab+'"]').click();await p.locator('#'+tab+'Page').waitFor({state:'visible'});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));navigation[tab]=Date.now()-start;}
   await p.reload();const warm=await measure(p,fixture.dashboardLabel);const warmWorker=await requireWorker(p);assert.equal(await stateHash(p),expected);await context.setOffline(true);await p.reload();const offline=await measure(p,fixture.dashboardLabel);const offlineWorker=await requireWorker(p);assert.equal(await stateHash(p),expected);await context.setOffline(false);
   samples.push({cold,warm,offline,workers:{cold:coldWorker,warm:warmWorker,offline:offlineWorker},navigation,heap:await p.evaluate(()=>performance.memory?.usedJSHeapSize??null)});await context.close();
  }
  assert.deepEqual(errors,[]);report.scenarios.push({...fixture,cpuRate,samples,exactRecordUnchanged:true,errors});mkdirSync(out,{recursive:true});writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({bookings,cpuRate,cold:samples.map(x=>Math.round(x.cold.interactiveMs)),warm:samples.map(x=>Math.round(x.warm.interactiveMs)),offline:samples.map(x=>Math.round(x.offline.interactiveMs)),navigation:samples.map(x=>x.navigation)}));
 }finally{await context.close().catch(()=>{});rmSync(profile,{recursive:true,force:true});}
}
mkdirSync(out,{recursive:true});writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
