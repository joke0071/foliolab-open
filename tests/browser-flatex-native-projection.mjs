import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {nativeProjectionFixture as fixture} from './flatex-native-projection-fixture.mjs';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const engines=(process.env.UI_QUALITY_ENGINES||'chromium').split(','),report={base,scope:'Synthetic native projection/shared simulation only; no UI or private import',engines:[]};
mkdirSync('artifacts/gates',{recursive:true});
for(const engine of engines){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({ignoreHTTPSErrors:Boolean(proxy)}),p=await ctx.newPage(),errors=[],external=[];
 try{
  p.on('pageerror',e=>errors.push(e.message));const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await p.goto(base);await ready();await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const read=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return {record:await readPortfolioRecord(db),prefs:Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])};}finally{db.close();}});
  const before=await read();ctx.on('request',r=>{const u=new URL(r.url());if(u.origin!==new URL(base).origin&&u.protocol!=='blob:')external.push(r.url());});
  const f=fixture(),held=fixture({quantity:1});
  for(const offline of [false,true]){
   if(offline){await ctx.setOffline(true);await p.reload();await ready();}
   const result=await p.evaluate(async({model,assignments,text,held})=>{
    const {parseFlatexNativeCSV}=await import('/src/flatex-native.js'),{prepareNativeFlatexPreview:preview}=await import('/src/flatex-backfill.js'),{importCSV}=await import('/src/csv-import.js'),{backup,safeImport}=await import('/src/model.js'),{csvUndoReceipt,undoCSV}=await import('/src/csv-batch.js');
    const documents=[parseFlatexNativeCSV(text)],before=JSON.stringify(model),r=preview(model,documents,assignments,{mode:'append'});
    const unchanged=JSON.stringify(model)===before,unknown=r.preview.simulated.bookings.every(b=>b.feeEUR===null&&b.taxEUR===null&&b.costsVerified===false),noFlows=r.preview.simulated.externalCashFlows.length===0;
    const blocked=[preview(model,documents,{}, {mode:'append'}),preview(model,documents,assignments,{mode:'append',stale:true})].every(x=>!x.eligible&&x.preview===null);
    const backfill=preview(held.model,[parseFlatexNativeCSV(held.text)],held.assignments,{mode:'backfill'});
    const simulated=structuredClone(model);importCSV(simulated,r.preview);const restored=safeImport(JSON.parse(backup(simulated))),again=preview(restored,documents,assignments,{mode:'append'});
    const manual=structuredClone(restored);manual.bookings[0].notes='Synthetic user correction';const protectedManual=!preview(manual,documents,assignments,{mode:'append'}).eligible;
    const rawChanged=[parseFlatexNativeCSV(text.replace('06.01.1999','07.01.1999'))];const protectedSource=!preview(restored,rawChanged,assignments,{mode:'append'}).eligible;
    const stale=structuredClone(model);stale.settings.autoRefresh=!stale.settings.autoRefresh;let staleBlocked=false;try{importCSV(stale,r.preview);}catch{staleBlocked=true;}
    const receipt=csvUndoReceipt(before,simulated);undoCSV(simulated,receipt);
    return {eligible:r.eligible,ready:r.preview.ready,quantity:r.preview.simulated.positions[0].quantityExact,outerNoWrite:r.ready===false&&r.writeEnabled===false,unchanged,unknown,noFlows,blocked,backfill:backfill.eligible&&backfill.preview.simulated.positions[0].quantityExact==='1',duplicates:again.preview.duplicates,protectedManual,protectedSource,staleBlocked,undoExact:JSON.stringify(simulated)===before};
   },{model:f.model,assignments:f.assignments,text:f.text,held:{model:held.model,assignments:held.assignments,text:held.text}});
   assert.equal(result.ready,2);assert.equal(result.quantity,'1');assert.equal(result.duplicates,2);for(const k of ['eligible','outerNoWrite','unchanged','unknown','noFlows','blocked','backfill','protectedManual','protectedSource','staleBlocked','undoExact'])assert.equal(result[k],true,k);
   assert.deepEqual(await read(),before);
  }
  // Separate fresh synthetic context proves the existing real IDB CAS path;
  // primary read-only profile above must remain byte-for-byte unchanged.
  const cas=await browser.newContext({ignoreHTTPSErrors:Boolean(proxy)}),cp=await cas.newPage();
  try{
   await cp.goto(base);await cp.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   const proof=await cp.evaluate(async({model,assignments,text})=>{
    const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{parseFlatexNativeCSV}=await import('/src/flatex-native.js'),{prepareNativeFlatexPreview}=await import('/src/flatex-backfill.js'),{importCSV}=await import('/src/csv-import.js');
    const seed=new PortfolioStorage();await seed.initialize();model.settings.autoRefresh=false;await seed.save(model);seed.close();
    const a=new PortfolioStorage(),b=new PortfolioStorage(),ma=await a.initialize(),mb=await b.initialize(),revision=a.revision;
    try{const docs=[parseFlatexNativeCSV(text)];const pa=prepareNativeFlatexPreview(ma,docs,assignments,{mode:'append'}),pb=prepareNativeFlatexPreview(mb,docs,assignments,{mode:'append'});importCSV(ma,pa.preview);importCSV(mb,pb.preview);await a.save(ma);let rejected=false;try{await b.save(mb);}catch{rejected=true;}
     const c=new PortfolioStorage();try{const current=await c.initialize();return {rejected,oneRevision:c.revision===revision+1,bookings:current.bookings.length,quantity:current.positions[0].quantityExact};}finally{c.close();}
    }finally{a.close();b.close();}
   },{model:f.model,assignments:f.assignments,text:f.text});
   assert.deepEqual(proof,{rejected:true,oneRevision:true,bookings:2,quantity:'1'});
  }finally{await cas.close();}
  assert.deepEqual(await read(),before);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  report.engines.push({engine,version:browser.version(),result:'PASS',checks:['native direct parser/shared preview/backfill/no fictional costs or external flows','explicit binding/stale/source/manual/baseline guards','synthetic commit/backup/replay/exact undo in memory','actual SW offline reload/module import','primary profile exact IDB/revision/settings zero mutation','separate synthetic IDB CAS profile: exactly one accepted revision, competing native simulation rejected','no external requests']});console.log(engine+': FLATEX NATIVE PROJECTION shared preview/backfill/replay/manual/undo/offline/primary zero writes/separate synthetic CAS PASS');
 }finally{await ctx.close();await browser.close();}
}
report.result='PASS';writeFileSync('artifacts/gates/flatex-native-projection-'+engines.join('-')+'.json',JSON.stringify(report,null,2));
