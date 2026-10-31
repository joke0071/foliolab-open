import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const base=process.env.BENCH_BASE||'http://127.0.0.1:4173/';
const report={scriptSha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),sha:process.env.BENCH_SHA,scope:'synthetic mixed IndexedDB; fresh Chromium process vs same-dashboard warm reload; 4x CPU emulation is not Android hardware',runs:3,scenarios:[],limitations:['No physical Android device or constrained process memory.','Navigation timing includes Playwright dispatch and two render frames.','No comparison against an older release; no performance improvement claimed.']};
const ready=async p=>{await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv')&&document.getElementById('totalValue')?.textContent.includes('€'));return p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(performance.now())))));};
const stateHash=async p=>createHash('sha256').update(await p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return JSON.stringify(await readPortfolioRecord(db));}finally{db.close();}})).digest('hex');
const observer=()=>{window.__mixedLongTasks=[];new PerformanceObserver(list=>{for(const e of list.getEntries())window.__mixedLongTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});};
const measure=async p=>({interactiveMs:await ready(p),longTasks:await p.evaluate(()=>window.__mixedLongTasks)});
for(const bookings of [1000,10000])for(const cpuRate of [1,4]){
 const profile=mkdtempSync(join(tmpdir(),'foliolab-mixed-'));
 const options={headless:true,viewport:{width:390,height:844}};
 let context=await chromium.launchPersistentContext(profile,options),p=context.pages()[0];
 try{
  await p.goto(base);await ready(p);
  const fixture=await p.evaluate(async bookings=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js');const {executeTransaction}=await import('/src/transactions.js');const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=false;
   for(let n=0;n<3;n++){m.providers.push(createProvider({id:'mixed-p'+n,name:'SYNTHETIC Mixed '+n}));m.accounts.push(createAccount({id:'mixed-a'+n,providerId:'mixed-p'+n,name:'SYNTHETIC Account '+n,type:n===2?'checking':'securities'},m));}
   for(let n=0;n<19;n++){const group=n%3;m.positions.push(createPosition({id:'mixed-'+n,providerId:'mixed-p'+group,accountId:'mixed-a'+group,name:'SYNTHETIC '+n,kind:['etf','crypto','cash'][group],symbol:group===1?'ETH':'SYN'+n,quantity:10,price:group===2?1:100,currency:'EUR',...(group===1?{coinId:'ethereum',wallet:{enabled:true,chain:'evm',chainId:1,address:'0x1111111111111111111111111111111111111111'}}:{})},m));}
   const bookable=m.positions.filter(p=>!p.wallet?.enabled),allBookings=[],allJournal=[];let initialOpenings;
   // Bound fixture-construction cloning only. Each transaction still runs through
   // the real journal operation; holdings/basis/openings carry across batches.
   // The final stored database contains every booking and journal entry.
   for(let start=0;start<bookings;start+=100){m.bookings=[];m.journalEntries=[];for(let n=start;n<Math.min(start+100,bookings);n++){const position=bookable[n%bookable.length];executeTransaction(m,{id:'mixed-book-'+n,type:position.kind==='cash'?'deposit':'buy',positionId:position.id,date:'2025-01-01',quantity:'0.01',unitPrice:'1',notes:'SYNTHETIC benchmark'});}if(start===0)initialOpenings=structuredClone(m.openingPositions);for(const journal of m.journalEntries)journal.sequence+=start;allBookings.push(...m.bookings);allJournal.push(...m.journalEntries);}m.bookings=allBookings;m.journalEntries=allJournal;m.openingPositions=initialOpenings;
   if(m.bookings.length!==bookings||m.journalEntries.length!==bookings)throw Error('Incomplete synthetic fixture');
   for(let n=0;n<1825;n++){const date=new Date(Date.UTC(2021,0,1+n)).toISOString().slice(0,10);m.snapshots.push({id:'mixed-ref-'+n,date,total:10000,totalEURExact:'10000',valuationStatus:'manual',source:'manual',byAccount:null,byPosition:null,quoteTimes:[],revisions:[],note:''});}
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();return {positions:m.positions.length,bookings:m.bookings.length,journalEntries:m.journalEntries.length,references:m.snapshots.length,bytes:new TextEncoder().encode(JSON.stringify(m)).length};
  },bookings);
  await p.reload();await ready(p);const expected=await stateHash(p);await context.close();
  const samples=[];
  for(let n=0;n<3;n++){
   context=await chromium.launchPersistentContext(profile,options);p=context.pages()[0];const cdp=await context.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});await p.addInitScript(observer);
   await p.goto(base);const cold=await measure(p);assert.equal(await stateHash(p),expected);
   const navigation={};for(const tab of ['positions','bookings','history','dashboard']){const start=Date.now();await p.locator('#mobileNav [data-page="'+tab+'"]').click();await p.locator('#'+tab+'Page').waitFor({state:'visible'});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));navigation[tab]=Date.now()-start;}
   await p.reload();const warm=await measure(p);assert.equal(await stateHash(p),expected);
   samples.push({cold,warm,navigation,heap:await p.evaluate(()=>performance.memory?.usedJSHeapSize??null)});await context.close();
  }
  report.scenarios.push({...fixture,cpuRate,samples,exactRecordUnchanged:true});mkdirSync('artifacts/gates/mixed-startup',{recursive:true});writeFileSync('artifacts/gates/mixed-startup/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({bookings,cpuRate,cold:samples.map(x=>Math.round(x.cold.interactiveMs)),warm:samples.map(x=>Math.round(x.warm.interactiveMs)),navigation:samples.map(x=>x.navigation)}));
 }finally{await context.close().catch(()=>{});rmSync(profile,{recursive:true,force:true});}
}
mkdirSync('artifacts/gates/mixed-startup',{recursive:true});writeFileSync('artifacts/gates/mixed-startup/report.json',JSON.stringify(report,null,2));
