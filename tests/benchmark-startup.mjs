import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
const require=createRequire(resolve('package.json'));
const {chromium}=require('playwright');
const executablePath=process.env.BENCH_EXECUTABLE||undefined;
const base=process.env.BENCH_BASE||'http://127.0.0.1:4173/';
const report={sha:process.env.BENCH_SHA,benchmarkScriptSha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),node:process.version,profiler:false,scope:'unprofiled actual IndexedDB, installed controlled PWA, fresh Chromium processes versus same-page warm dashboard reload; synthetic only',viewport:{width:1440,height:900},runs:5,scenarios:[]};
const ready=async p=>{await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv')&&document.getElementById('totalValue')?.textContent.includes('10.000'));return p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(performance.now())))));};
const record=p=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
const median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)];
for(const positions of [19,1000]){
 const profile=mkdtempSync(join(tmpdir(),'foliolab-startup-profile-'));
 const options={headless:true,executablePath,viewport:report.viewport};
 let ctx=await chromium.launchPersistentContext(profile,options),p=ctx.pages()[0];await p.goto(base);await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 await p.evaluate(async positions=>{
  const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const m=blankModel();m.settings.autoRefresh=false;
  m.providers.push(createProvider({id:'bench-provider',name:'SYNTHETIC startup'}));m.accounts.push(createAccount({id:'bench-account',providerId:'bench-provider',name:'SYNTHETIC',type:'securities'},m));
  for(let i=0;i<positions;i++)m.positions.push(createPosition({id:'bench-'+i,providerId:'bench-provider',accountId:'bench-account',name:'SYNTHETIC '+i,kind:'etf',quantity:1,price:10000/positions},m));
  for(let i=0;i<1825;i++){const date=new Date(Date.UTC(2021,0,1+i)).toISOString().slice(0,10);m.snapshots.push({id:'bench-ref-'+i,date,total:10000,totalEURExact:'10000',valuationStatus:'manual',source:'manual',byAccount:null,byPosition:null,quoteTimes:[],revisions:[],note:''});}
  const storage=new PortfolioStorage();await storage.initialize();await storage.save(m);storage.close();
 },positions);
 await p.reload();await ready(p);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);const expected=await record(p);await ctx.close();
 const coldMs=[],warmMs=[],offlineMs=[];
 try{
  for(let i=0;i<5;i++){
   ctx=await chromium.launchPersistentContext(profile,options);p=ctx.pages()[0];await p.goto(base);coldMs.push(await ready(p));assert.deepEqual(await record(p),expected,'fresh-process startup must preserve exact record/settings/revision');
   await p.reload();warmMs.push(await ready(p));assert.deepEqual(await record(p),expected,'same dashboard warm reload must preserve exact record/settings/revision');
   await ctx.setOffline(true);await p.reload();offlineMs.push(await ready(p));assert.deepEqual(await record(p),expected,'actual controlled offline startup must preserve exact record/settings/revision');await ctx.close();
  }
  const s={positions,references:1825,coldMs,warmMs,offlineMs,coldMedianMs:median(coldMs),warmMedianMs:median(warmMs),offlineMedianMs:median(offlineMs),exactRecordUnchanged:true};report.scenarios.push(s);console.log(JSON.stringify(s));
 }finally{await ctx.close().catch(()=>{});rmSync(profile,{recursive:true,force:true});}
}
report.limitations=['Synthetic ETF/reference stress fixture; no large wallet journals or physical mobile hardware.','Warm samples are same-page Dashboard and are directly matched; every cold sample starts a new browser process with the installed PWA.','Navigation-to-interactive measurement includes two rendering frames, excludes browser-process launch, no CPU profiler/throttling.'];
const out=process.env.BENCH_OUTPUT||'artifacts/gates/startup-performance/report.json';mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(report,null,2));console.log('SAVED '+out);
