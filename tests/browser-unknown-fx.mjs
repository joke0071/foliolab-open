/** Invented sources only; UNKNOWN survives the actual browser data lifecycle. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {waitForAppServiceWorker,browserGateDeadline} from './browser-gate-deadline.mjs';
const finish=browserGateDeadline('unknown-fx'),base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',dir='artifacts/gates/unknown-fx';mkdirSync(dir,{recursive:true});
const m=blankModel();m.version=5;m.flatexNetRemovals=[];m.settings.autoRefresh=false;
m.providers.push(createProvider({id:'fx-bank',name:'Synthetic FX'}));
for(const [id,currency,quantity] of [['usd','USD','17.000000000000000005'],['eur','EUR','7']]){
 m.accounts.push(createAccount({id:'a-'+id,providerId:'fx-bank',name:currency+' Spot',currency,type:'exchange'},m));
 m.positions.push(createPosition({id,providerId:'fx-bank',accountId:'a-'+id,name:'Synthetic '+currency,kind:'cash',currency,quantityExact:quantity,price:1},m));
}
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const executablePath=process.env[{chromium:'SHARED_CHROMIUM_EXECUTABLE',firefox:'SHARED_FIREFOX_EXECUTABLE',webkit:'SHARED_WEBKIT_EXECUTABLE'}[engine]];
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,...(executablePath?{executablePath}:{}),...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept(d.type()==='prompt'?'Synthetic UNKNOWN FX 2026!':undefined));
 await context.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 try{
  console.log("FX_STAGE",engine,"initial");
  await page.goto(base);await ready();await waitForAppServiceWorker(page);
  await page.evaluate(async model=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(model);s.close();},m);
  console.log("FX_STAGE",engine,"reload");
  await page.reload();await ready();const before=await read();assert.equal(JSON.parse(before.raw).positions[0].fxRateExact,'UNKNOWN');
  assert.match(await page.locator('#totalHint').innerText(),/Teilsumme/);assert.match(await page.locator('#totalValue').innerText(),/7,00/);assert.equal(await page.locator('#donutShare').innerText(),'Teilsumme');
  assert.ok((await page.locator('#donutTotal').innerText()).includes('7'));
  const proof=await page.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{totalExactEUR,snapshot}=await import('/src/model.js'),{executeTransaction}=await import('/src/transactions.js');
   const s=new PortfolioStorage(),model=await s.initialize();s.close();const raw=JSON.stringify(model);let rejected=false;
   try{executeTransaction(model,{type:'withdraw',positionId:'usd',date:'1999-02-03',quantity:'1'});}catch{rejected=true;}
   const total=totalExactEUR(model),shot=snapshot(model);return {total,shot,rejected,unchanged:raw===JSON.stringify(model),quantity:model.positions[0].quantityExact,fx:model.positions[0].fxRateExact};
  });
  assert.deepEqual(proof,{total:null,shot:null,rejected:true,unchanged:true,quantity:'17.000000000000000005',fx:'UNKNOWN'});assert.deepEqual(await read(),before);
  console.log('FX_STAGE',engine,'rollback');
  for(const mode of ['quota','post-put']){
   console.log('FX_STAGE',engine,mode);
   const failed=await page.evaluate(async mode=>{
    const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),model=await s.initialize();model.positions[0].notes='should never persist';
    const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='records'&&args[1]==='portfolio'){if(mode==='quota')throw new DOMException('Synthetic quota','QuotaExceededError');const r=original.apply(this,args);r.addEventListener('success',()=>this.transaction.abort(),{once:true});return r;}return original.apply(this,args);};
    try{await s.save(model);return false;}catch{return true;}finally{IDBObjectStore.prototype.put=original;s.close();}
   },mode);assert.equal(failed,true);assert.deepEqual(await read(),before);
  }
  console.log("FX_STAGE",engine,"cas");
  const second=await context.newPage();try{
   await second.goto(base);await second.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   await second.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');window.fxStale=new PortfolioStorage();window.fxStaleModel=await window.fxStale.initialize();});
   await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),v=await s.initialize();v.positions[0].notes='actual concurrent change';await s.save(v);s.close();});const changed=await read();
   const rejected=await second.evaluate(async()=>{try{window.fxStaleModel.positions[0].quantityExact='999';window.fxStaleModel.positions[0].quantity=999;await window.fxStale.save(window.fxStaleModel);return false;}catch{return true;}finally{window.fxStale.close();}});assert.equal(rejected,true);assert.deepEqual(await read(),changed);
  }finally{await second.close();}
  console.log("FX_STAGE",engine,"offline");
  await page.reload();await ready();await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));const stable=await read();await context.setOffline(true);await page.reload();await ready();assert.deepEqual(await read(),stable);await context.setOffline(false);
  console.log("FX_STAGE",engine,"axe");
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(await page.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);}
  await page.setViewportSize({width:390,height:900});await page.screenshot({path:dir+'/'+engine+'-unknown-fx.png',fullPage:true});
  console.log("FX_STAGE",engine,"encrypt");
  const encrypted=await page.evaluate(async raw=>{const {configureBackupPassword,encryptWithBackupPassword}=await import('/src/backup-vault.js');await configureBackupPassword('Synthetic UNKNOWN FX 2026!','Synthetic UNKNOWN FX 2026!');return encryptWithBackupPassword(raw);},stable.raw);
  console.log("FX_STAGE",engine,"fresh-restore");
  const fresh=await browser.newContext(),rp=await fresh.newPage();try{
   rp.on('dialog',d=>d.accept(d.type()==='prompt'?'Synthetic UNKNOWN FX 2026!':undefined));await rp.goto(base);await rp.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   await rp.locator('#backupFile').setInputFiles({name:'synthetic-unknown-fx-v5.json',mimeType:'application/json',buffer:Buffer.from(encrypted)});await rp.locator('#toast').filter({hasText:'Backup wiederhergestellt'}).waitFor();
   const restored=await rp.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),v=await s.initialize();s.close();return v;});
   assert.equal(restored.version,5);assert.equal(restored.positions[0].fxRateExact,'UNKNOWN');assert.equal(restored.positions[0].fxRate,null);assert.equal(restored.positions[0].quantityExact,'17.000000000000000005');assert.deepEqual(restored.journalEntries,[]);assert.deepEqual(restored.externalCashFlows,[]);assert.deepEqual(restored.snapshots,[]);
   assert.match(await rp.locator('#totalHint').innerText(),/Teilsumme/);
  }finally{await fresh.close();}
  assert.deepEqual(errors,[]);
  writeFileSync(dir+'/report-'+engine+'.json',JSON.stringify({engine,result:'PASS',base,checks:['exact USD native quantity and UNKNOWN on save/reload','honest UI partial subtotal and no numeric full EUR total/snapshot','historical transaction missing FX rejected without canonical write','quota and post-put preserve exact bytes/revision','real second-tab CAS rejects stale writer','offline reload stable','encrypted v5 actual UI restore in fresh browser context','four widths and full Axe tags'],newUSDPrincipalAdmission:false},null,2));
  console.log('UNKNOWN_FX_PASS',engine);
 }finally{await context.close();await browser.close();}
}
finish();
