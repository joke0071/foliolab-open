/** Actual five-provider UI, canonical IDB commit and independent synthetic oracles. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {fixture,economic} from './shared-import-fixture.mjs';
import {waitForAppServiceWorker,browserGateDeadline} from './browser-gate-deadline.mjs';
const finish=browserGateDeadline('shared-import'),base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',dir='artifacts/gates/shared-import';mkdirSync(dir,{recursive:true});const report={engines:[]};
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox'],...(process.env.SHARED_CHROMIUM_EXECUTABLE?{executablePath:process.env.SHARED_CHROMIUM_EXECUTABLE}:{})}:{})});
 const context=await browser.newContext({viewport:{width:390,height:900}});await context.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept(d.type()==='prompt'?'Synthetic shared import 2026!':undefined));const f=fixture();
 const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const open=async(reverse=false)=>{
  await page.locator('#mobileNav [data-page=bookings]:visible,#sidebarNav [data-page=bookings]:visible').click();await page.locator('#openCSVImport').click();await page.locator('#csvSource').selectOption('shared');
  await page.locator('[data-shared=files]').setInputFiles((reverse?[...f.files].reverse():f.files).map(file=>({name:file.name,mimeType:'text/csv',buffer:Buffer.from(file.text)})));
  await page.locator('[data-shared=files-status]').filter({hasText:'Dateien erkannt'}).waitFor();
  await page.locator('[data-shared-btc=wallet]').selectOption('wallet');await page.locator('[data-shared-btc=funding]').check();await page.locator('[data-shared-btc=partial]').check();
  for(const k of ['kraken','bitpanda'])await page.locator('[data-shared='+k+'] details>summary').first().click();
  for(const [key,id]of Object.entries(f.kr.assignments))await page.locator('[data-kraken-binding="'+key+'"]').selectOption(id);
  await page.locator('[data-kraken=opening]').check();
  for(const [key,id]of Object.entries(f.bp.assignments)){await page.locator('[data-bitpanda-binding="'+key+'"]').selectOption(id);await page.locator('[data-bitpanda-closing="'+key+'"]').fill(f.bp.options.expectedClosing[id]);}
  for(const [id,mode]of Object.entries(f.bp.options.feeModes))await page.locator('[data-bitpanda-fee="'+id+'"]').selectOption(mode);
  await page.locator('[data-bitpanda=net]').check();await page.locator('[data-bitpanda=opening]').check();
  for(const c of await page.locator('[data-flatex-binding-account]').evaluateAll(es=>es.map(e=>({index:e.dataset.flatexBindingAccount,type:e.closest('fieldset').querySelector('legend').textContent})))){const id=c.type.startsWith('Depot')?'d':'c';await page.locator('#flatexBindingAccount-'+c.index).selectOption(id);await page.locator('#flatexBindingConfirm-'+c.index).check();}
  await page.locator('[data-shared-flatex=mode]').selectOption('net-backfill');await page.locator('[data-shared-flatex=all]').click();await page.locator('[data-shared-flatex=date]').fill('1999-01-01');await page.locator('[data-shared-flatex=date]').dispatchEvent('change');await page.locator('[data-shared-flatex=opening]').check();
  for(const [id,start,end]of [['etf','0','2'],['cash','100','78.25']]){await page.locator('[data-shared-start='+id+']').fill(start);await page.locator('[data-shared-end='+id+']').fill(end);}
  await page.locator('[data-shared-flatex=closing]').check();
  await simulate();
 };
 const simulate=async()=>{
  await page.locator('[data-kraken=simulate]').click();await page.locator('[data-kraken=approve]').check();await page.locator('[data-bitpanda=simulate]').click();await page.locator('[data-bitpanda=approve]').check();
  await page.locator('[data-shared=simulate]').click();await page.locator('[data-shared=status]').filter({hasText:/Gesamter Import geprüft|Alle gewählten Quellen bereits/}).waitFor().catch(async e=>{throw Error(e.message+' '+await page.locator('[data-shared=status]').innerText());});
 };
 const approve=async()=>{const download=page.waitForEvent('download');await page.locator('[data-shared=backup]').click();await download;await page.locator('[data-shared=approve]').check();assert.ok(await page.locator('#saveDialog').isEnabled());};
 const commit=async()=>{await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});};
 try{
  console.log(engine+": initial navigation");await page.goto(base);await ready();console.log(engine+": app ready");await waitForAppServiceWorker(page);console.log(engine+": SW ready");await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},f.m);await page.reload();await ready();
  context.on('request',r=>{if(!r.url().startsWith('blob:')&&new URL(r.url()).origin!==new URL(base).origin)external.push(new URL(r.url()).origin);});
  const before=await read();console.log(engine+": opening shared UI");await open();console.log(engine+": shared simulation ready");assert.deepEqual(await read(),before);
  await approve();await page.locator('[data-shared-btc=partial]').uncheck();assert.ok(await page.locator('#saveDialog').isDisabled());assert.ok(await page.locator('[data-shared=approve]').isDisabled());assert.ok(await page.locator('[data-kraken=approve]').isChecked()===false);await page.locator('[data-shared-btc=partial]').check();await simulate();
  for(const width of [320,360,390,412,430]){await page.setViewportSize({width,height:900});assert.ok(await page.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.deepEqual(await page.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);}await page.setViewportSize({width:390,height:900});await page.locator('[data-shared=status]').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/'+engine+'-390.png'});
  // Both synchronous quota and abort after put must leave the complete old record.
  for(const failure of ['quota','post-put']){
   await approve();await page.evaluate(mode=>{window.sharedOriginalPut??=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='records'&&args[1]==='portfolio'){if(mode==='quota')throw new DOMException('Synthetic quota','QuotaExceededError');const r=window.sharedOriginalPut.apply(this,args);r.addEventListener('success',()=>this.transaction.abort(),{once:true});return r;}return window.sharedOriginalPut.apply(this,args);};},failure);
   await page.locator('#saveDialog').click();await page.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await read(),before);await page.evaluate(()=>IDBObjectStore.prototype.put=window.sharedOriginalPut);await simulate();
  }
  await approve();await commit();const saved=await read(),m=JSON.parse(saved.raw);assert.equal(saved.revision,before.revision+1);assert.equal(m.bookings.length,6);assert.deepEqual(Object.fromEntries(m.positions.map(p=>[p.id,p.quantityExact])),{wallet:'0.0248',p0:'100',p1:'3',p2:'0.00000083',bp0:'3.1',bp1:'99',etf:'2',cash:'78.25'});assert.equal(m.externalCashFlows.length,1);assert.equal(m.externalCashFlows[0].amountExactEUR,'1000');assert.equal(m.bookings.find(b=>b.netSettlement).feeEUR,null);assert.equal(m.bookings.find(b=>b.notes.startsWith('Kraken-Gebühr')).quantityExact,'0.00000017');
  await page.locator('#undoCSVImport').click();await commit();assert.equal((await read()).raw,before.raw);await open(true);await approve();await commit();assert.deepEqual(economic(JSON.parse((await read()).raw)),economic(m));
  await context.setOffline(true);await page.reload();await ready();const stable=await read();await open(true);assert.match(await page.locator('[data-shared=status]').innerText(),/bereits vorhanden/);assert.ok(await page.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),stable);await page.locator('#cancelDialog').click();await context.setOffline(false);
  const envelope=await page.evaluate(async raw=>{const {configureBackupPassword,encryptWithBackupPassword}=await import('/src/backup-vault.js');await configureBackupPassword('Synthetic shared import 2026!','Synthetic shared import 2026!');return encryptWithBackupPassword(raw);},stable.raw);
  const rc=await browser.newContext(),rp=await rc.newPage();try{rp.on('dialog',d=>d.accept(d.type()==='prompt'?'Synthetic shared import 2026!':undefined));await rp.goto(base);await rp.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));await rp.locator('#backupFile').setInputFiles({name:'synthetic-shared-v5.json',mimeType:'application/json',buffer:Buffer.from(envelope)});await rp.locator('#toast').filter({hasText:'Backup wiederhergestellt'}).waitFor();const restored=await rp.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();s.close();return m;});assert.deepEqual(economic(restored),economic(m));}finally{await rc.close();}
  // Pause precisely at the existing CAS boundary, then let a real second tab write.
  await page.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},f.m);await page.reload();await ready();await open();await approve();await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),save=PortfolioStorage.prototype.save;PortfolioStorage.prototype.save=function(m){return new Promise((resolve,reject)=>window.releaseShared=()=>save.call(this,m).then(resolve,reject));};});await page.locator('#saveDialog').click();await page.waitForFunction(()=>Boolean(window.releaseShared));
  const other=await context.newPage();await other.goto(base);await other.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));await other.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.settings.showSmall=!m.settings.showSmall;await s.save(m);s.close();});await other.close();const concurrent=await read();await page.evaluate(()=>window.releaseShared());await page.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await read(),concurrent);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);report.engines.push({engine,version:browser.version(),result:'PASS',checks:['all five native sources, overlapping and duplicate exports, both file orders','one CAS revision, independent quantities/cash/fees, no invented costs','selection revokes all approvals; full zero-write quota/post-put rollback','actual Undo/recommit/reimport/offline reload','encrypted v5 backup and actual restore in fresh profile','real second-tab race at canonical save','five widths/Axe, no external requests']});
 }finally{await context.close();await browser.close();}
}
report.result='PASS';writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));finish();

await import('./browser-kraken-allocation.mjs');
await import('./browser-kraken-fiat-binding.mjs');
