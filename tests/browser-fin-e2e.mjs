import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {oracle,steps,password,fxSteps,fxOracle,fxCSV,fxSaleCSV} from './fin-e2e-scenario.mjs';
const base=process.env.FIN_E2E_BASE||'http://127.0.0.1:4173/';
const engines=(process.env.FIN_E2E_ENGINES||'chromium').split(',');
const report={base,scope:'FIN-E2E01 cash + FX/partial-fill continuation: production APIs + actual IDB + UI encrypted export/fresh restore; no hardware claim',engines:[]};
mkdirSync('artifacts/gates/fin-e2e',{recursive:true});
for(const engine of engines){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),page=await context.newPage(),errors=[];
 const origin=new URL(base).origin;
 // Synthetic tests never call a live financial provider or Google account.
 await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 const ready=p=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const record=p=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 try{
  await page.goto(base);await ready(page);
  // Browser loads identical test helper bytes from the checked-out candidate, even on production.
  // Only /src production modules execute finance; the fixture itself is never deployed.
  const helperURL=new URL('tests/fin-e2e-scenario.mjs',base).href;
  await context.route(helperURL,r=>r.fulfill({status:200,contentType:'text/javascript',body:readFileSync(new URL('./fin-e2e-scenario.mjs',import.meta.url),'utf8')}));
  await page.evaluate(async()=>{
   const {seed}=await import('/tests/fin-e2e-scenario.mjs');const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const s=new PortfolioStorage();await s.initialize();await s.save(seed());s.close();
  });
  let receipt,matched;
  const state=()=>page.evaluate(async()=>{const {financialState}=await import('/tests/fin-e2e-scenario.mjs');const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();try{return financialState(await s.initialize());}finally{s.close();}});
  assert.deepEqual(await state(),oracle.seed);
  for(const step of steps){
   const before=await record(page);
   // Withhold confirmation and inject actual IDB write failures against this very chain.
   if(step==='correct'||step==='remove'){
    for(const mode of ['cancel','stale','quota','abort']){
     const result=await page.evaluate(async({step,mode})=>{
      const h=await import('/tests/fin-e2e-scenario.mjs'),{prepareBookingChange}=await import('/src/booking-management.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
      const s=new PortfolioStorage(),m=await s.initialize(),request=step==='correct'?h.correctRequest:h.removeRequest(m),put=IDBObjectStore.prototype.put;
      try{
       if(mode==='cancel'||mode==='stale'){prepareBookingChange(m,request,{expectedModel:mode==='stale'?'stale':JSON.stringify(m),confirmed:mode!=='cancel'});return 'unexpected';}
       const next=h.advance(m,step).model;
       IDBObjectStore.prototype.put=function(...args){if(mode==='quota')throw new DOMException('Synthetic quota','QuotaExceededError');const r=put.apply(this,args);this.transaction.abort();return r;};
       await s.save(next);return 'unexpected';
      }catch(e){return e.name;}finally{IDBObjectStore.prototype.put=put;s.close();}
     },{step,mode});
     assert.notEqual(result,'unexpected',step+' '+mode);if(mode==='quota')assert.equal(result,'QuotaExceededError');
     assert.deepEqual(await record(page),before,step+' '+mode+' keeps raw bytes and revision');
    }
   }
   const result=await page.evaluate(async({step,receipt})=>{
    const h=await import('/tests/fin-e2e-scenario.mjs'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
    const s=new PortfolioStorage();try{const m=await s.initialize(),next=h.advance(m,step,receipt);if(step==='reimport'&&JSON.stringify(next.model)!==JSON.stringify(m))throw Error('Repeat import mutated model');if(step!=='reimport')await s.save(next.model);return {receipt:next.receipt,state:h.financialState(next.model)};}finally{s.close();}
   },{step,receipt});
   receipt=result.receipt;assert.deepEqual(result.state,oracle[step],step+' API');assert.deepEqual(await state(),oracle[step],step+' persisted');
   const after=await record(page);assert.equal(after.revision,before.revision+(step==='reimport'?0:1),step+' CAS revision');
   if(step==='match')matched=after.raw;
   if(step==='undo')assert.equal(after.raw,matched,'undo restores exact canonical model bytes');
   if(step==='reimport')assert.deepEqual(after,before,'duplicate import is not persisted');
   if(step==='remove'||step==='remove-again'){
    const blocked=await page.evaluate(async()=>{const h=await import('/tests/fin-e2e-scenario.mjs'),{importCSV}=await import('/src/csv-import.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();try{const m=await s.initialize(),p=h.previewFile(m,h.cashCSV);try{importCSV(m,p);return false;}catch{return p.ready===0&&p.issues[0].code==='source-conflict';}}finally{s.close();}});
    assert.equal(blocked,true);assert.deepEqual(await record(page),after,'rejected reimport keeps exact canonical bytes');
   }
  }
  // Continue this exact portfolio through imported USD partial fills and sale.
  const historical=JSON.parse((await record(page)).raw).snapshots;
  for(const step of fxSteps){
   const before=await record(page);
   if(step==='fx-import'||step==='fx-sell')for(const mode of ['quota','abort']){
    const name=await page.evaluate(async({step,mode})=>{
     const h=await import('/tests/fin-e2e-scenario.mjs'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
     const s=new PortfolioStorage(),put=IDBObjectStore.prototype.put;
     try{const next=h.advanceFX(await s.initialize(),step);IDBObjectStore.prototype.put=function(...args){if(mode==='quota')throw new DOMException('Synthetic FX quota','QuotaExceededError');const r=put.apply(this,args);this.transaction.abort();return r;};await s.save(next);return 'unexpected';}
     catch(e){return e.name;}finally{IDBObjectStore.prototype.put=put;s.close();}
    },{step,mode});
    assert.notEqual(name,'unexpected');if(mode==='quota')assert.equal(name,'QuotaExceededError');assert.deepEqual(await record(page),before,step+' '+mode+' exact FX preimage');
   }
   const actual=await page.evaluate(async step=>{
    const h=await import('/tests/fin-e2e-scenario.mjs'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
    const s=new PortfolioStorage();try{const m=await s.initialize(),next=h.advanceFX(m,step);if(step==='fx-reimport'){if(JSON.stringify(next)!==JSON.stringify(m))throw Error('FX reimport mutated model');}else await s.save(next);return h.financialStateFX(next);}finally{s.close();}
   },step);
   assert.deepEqual(actual,fxOracle[step],step+' API oracle');
   const after=await record(page);assert.equal(after.revision,before.revision+(step==='fx-reimport'?0:1),step+' CAS revision');
   assert.deepEqual(JSON.parse(after.raw).snapshots,historical,'FX trades preserve earlier reference evidence');
   assert.deepEqual(await page.evaluate(async()=>{const h=await import('/tests/fin-e2e-scenario.mjs'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();try{return h.financialStateFX(await s.initialize());}finally{s.close();}}),fxOracle[step],step+' persisted oracle');
   if(step==='fx-reimport')assert.deepEqual(after,before,'all three FX receipts deduplicate without any write');
  }
  const fxBefore=await record(page);
  assert.deepEqual(await page.evaluate(async()=>{
   const h=await import('/tests/fin-e2e-scenario.mjs'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{importCSV}=await import('/src/csv-import.js'),{previewBookingChange}=await import('/src/booking-management.js');
   const s=new PortfolioStorage();try{const m=await s.initialize(),before=JSON.stringify(m),results=[];
    for(const csv of [h.fxCSV.replace('usd,0.5,100','usd,0.6,100'),h.fxCSV.replaceAll(',0.8,a,',',,a,')]){const p=h.previewFile(m,csv);try{importCSV(m,p);results.push(false);}catch{results.push(p.issues.length>0&&JSON.stringify(m)===before);}}
    for(const id of ['SYN-FX-FILL-1','SYN-FX-FILL-2','SYN-FX-SALE'])results.push(!previewBookingChange(m,{ids:[h.imported(m,id).id],action:'remove',reason:'Unproven FX inverse'}).ready);
    return results;
   }finally{s.close();}
  }),[true,true,true,true,true]);
  assert.deepEqual(await record(page),fxBefore,'FX guards preserve canonical bytes/revision');
  // A stale real tab cannot undo or overwrite the winning chain revision.
  const peer=await context.newPage();await peer.goto(base);await ready(peer);
  await peer.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');window.finPeer=new PortfolioStorage();window.finPeerModel=await finPeer.initialize();});
  await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.positions[0].notes='SYN winner';await s.save(m);s.close();});
  const winner=await record(page);
  assert.equal(await peer.evaluate(async()=>{try{finPeerModel.positions[0].notes='SYN stale';await finPeer.save(finPeerModel);return false;}catch(e){return /anderen Tab/.test(e.message);}finally{finPeer.close();}}),true);
  assert.deepEqual(await record(page),winner);await peer.close();
  // Real UI, mobile widths, offline resume, then an actual encrypted UI download.
  await page.reload();await ready(page);
  for(const width of [320,360,390,412,430,768,1440]){
   await page.setViewportSize({width,height:900});await page.locator('#mobileNav [data-page="bookings"]:visible,#sidebarNav [data-page="bookings"]:visible').click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   const violations=await page.evaluate(async()=>{for(let i=0;i<3;i++){const animations=document.getAnimations().filter(a=>a.playState==='running'&&Number.isFinite(a.effect?.getComputedTiming().endTime));if(!animations.length)break;await Promise.all(animations.map(a=>a.finished.catch(()=>{})));}await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return (await axe.run('#bookingsPage',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});
   assert.deepEqual(violations,[],engine+' '+width+' Axe');
  }
  await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.active?.state==='activated';},null,{timeout:60000});
  await page.reload();await ready(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  // Firefox network interception can bypass offline navigation before its worker sees it.
  // Fixture routing is no longer needed; remove it, then exercise the real worker transport.
  await context.unrouteAll({behavior:'wait'});
  await context.setOffline(true);await page.reload();await ready(page);assert.deepEqual(await record(page),winner);await context.setOffline(false);
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.evaluate(async password=>{const {configureBackupPassword}=await import('/src/backup-vault.js');await configureBackupPassword(password,password);},password);
  await page.reload();await ready(page);await page.setViewportSize({width:390,height:844});await page.locator('#mobileNav [data-page="more"]').click();
  await page.waitForFunction(()=>!document.getElementById('exportEncryptedBackup').disabled);
  await page.locator('#backupPasswordSetup').evaluate(el=>el.open=true);
  const download=page.waitForEvent('download');await page.locator('#exportEncryptedBackup').click();
  const encrypted=readFileSync(await(await download).path());assert.equal(JSON.parse(encrypted).format,'foliolab-open-encrypted-v2');assert.deepEqual(await record(page),winner,'export never mutates portfolio');
  const fresh=await browser.newContext({viewport:{width:390,height:844}});const restored=await fresh.newPage();
  try{
   await fresh.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
   await restored.goto(base);await ready(restored);restored.on('dialog',d=>d.accept(d.type()==='prompt'?password:undefined));
   await restored.locator('#backupFile').setInputFiles({name:'synthetic-fin-e2e.json',mimeType:'application/json',buffer:encrypted});
   await restored.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Backup wiederhergestellt'));
   const actual=await record(restored);assert.deepEqual(JSON.parse(actual.raw),JSON.parse(winner.raw),'fresh UI restore exact canonical portfolio');
   // Reimport after a fresh-device-style restore still respects the retained removal audit.
   assert.equal(await restored.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{parseCSV,inferMapping,previewCSV}=await import('/src/csv-import.js');const s=new PortfolioStorage();try{const m=await s.initialize(),csv=parseCSV('date,type,position,quantity,price,fee,tax,id\n2026-01-02,interest,a,2,1,0,0,SYN-INTEREST');return previewCSV(m,csv,inferMapping(csv.headers)).issues[0].code;}finally{s.close();}}),'source-conflict');
   assert.deepEqual(await record(restored),actual);await restored.reload();await ready(restored);assert.deepEqual(await record(restored),actual);
   assert.deepEqual(await restored.evaluate(async files=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{parseCSV,inferMapping,previewCSV,importCSV}=await import('/src/csv-import.js');const s=new PortfolioStorage();try{const m=await s.initialize(),before=JSON.stringify(m),results=[];for(const text of files){const csv=parseCSV(text),p=previewCSV(m,csv,inferMapping(csv.headers));importCSV(m,p);results.push({duplicates:p.duplicates,ready:p.ready,issues:p.issues.length});}if(JSON.stringify(m)!==before)throw Error('Fresh restore FX duplicate mutation');return results;}finally{s.close();}},[fxCSV,fxSaleCSV]),[{duplicates:2,ready:0,issues:0},{duplicates:1,ready:0,issues:0}]);
   assert.deepEqual(await record(restored),actual,'fresh restore FX deduplication is read-only');
  }finally{await fresh.close();}
  assert.deepEqual(errors,[]);report.engines.push({engine,status:'PASS',steps:[...steps,...fxSteps],checks:['exact oracle after every CAS commit','cancel/stale/quota/post-put abort preserve bytes+revision','delete/reimport/undo','distinct equal USD partial fills + historical FX + EUR settlement + partial sale journal oracle','FX source conflicts/guards/archival + quota/post-put abort','actual second tab CAS','7 widths/Axe','offline reload','UI v2 download + fresh context UI restore + deleted identity + all FX source duplicates']});
  console.log('FIN-E2E01 '+engine+': exact cash/flows/basis/PnL/fees/taxes, source identity, '+(steps.length+fxSteps.length)+' steps including USD partial fills/historical FX, CAS/quota/abort/offline, UI encrypted fresh restore PASS');
 }finally{writeFileSync('artifacts/gates/fin-e2e/'+engine+'.json',JSON.stringify(report,null,2));await context.close();await browser.close();}
}
