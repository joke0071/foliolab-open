/** Synthetic owner reproductions; actual UI, IndexedDB/CAS and fresh encrypted restore. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {reviewWalletFixture} from './review-v289-fixture.mjs';
import {nativeProjectionFixture} from './flatex-native-projection-fixture.mjs';
import {prepareNativeFlatexPreview} from '../src/flatex-backfill.js';
import {importCSV} from '../src/csv-import.js';
import {createAccount,createPosition} from '../src/model.js';
import {waitForAppServiceWorker,browserGateDeadline} from './browser-gate-deadline.mjs';
const finish=browserGateDeadline('v289-review-integrity');
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',dir='artifacts/gates/v289-review-integrity',report={base,scope:'Synthetic H1/H2/H3/M1/M2/M3; no original or hardware acceptance',engines:[]};mkdirSync(dir,{recursive:true});
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox'],...(process.env.SHARED_CHROMIUM_EXECUTABLE?{executablePath:process.env.SHARED_CHROMIUM_EXECUTABLE}:{})}:{})});
 const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage(),errors=[],unexpected=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await context.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 // WebKit may route requests that pass through a service worker outside Playwright's
 // network routing. Fixture only the provider fetch boundary, preserving the real SW.
 await context.exposeBinding('reviewUnexpected',(_source,origin)=>unexpected.push(origin));
 await context.addInitScript(()=>{
  const actualFetch=globalThis.fetch.bind(globalThis);
  globalThis.fetch=async(input,options)=>{
   const url=new URL(typeof input==='string'?input:input.url,location.href);
   if(url.origin===location.origin)return actualFetch(input,options);
   if(url.hostname==='eth.blockscout.com'&&url.pathname.endsWith('/token-balances'))return new Response('[]',{headers:{'content-type':'application/json'}});
   if(url.hostname==='eth.blockscout.com'&&url.pathname.includes('/api/v2/addresses/'))return new Response(JSON.stringify({coin_balance:'2000000000000000000'}),{headers:{'content-type':'application/json'}});
   await globalThis.reviewUnexpected(url.origin);throw Error('Unexpected external fixture request: '+url.origin);
  };
 });
 const handler=async route=>{
  const url=new URL(route.request().url());if(url.origin===new URL(base).origin)return route.continue();
  if(url.hostname==='eth.blockscout.com'&&url.pathname.endsWith('/token-balances'))return route.fulfill({json:[]});
  if(url.hostname==='eth.blockscout.com'&&url.pathname.includes('/api/v2/addresses/'))return route.fulfill({json:{coin_balance:'2000000000000000000'}});
  unexpected.push(url.origin);return route.abort();
 };await context.route('**/*',handler);
 const ready=p=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const seed=async model=>{await page.evaluate(async model=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(model);s.close();},model);await page.reload();await ready(page);};
 const nav=async tab=>page.locator((await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav')+' [data-page='+tab+']').click();
 const disclose=async id=>{if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+'>summary').click();};
 try{
  await page.goto(base);await ready(page);await waitForAppServiceWorker(page);
  // H1: persisted source, new local depot, real native upload and forced submit.
  const f=nativeProjectionFixture(),initial=prepareNativeFlatexPreview(f.model,f.documents,f.assignments,{mode:'append'});assert.equal(initial.eligible,true);importCSV(f.model,initial.preview);
  f.model.accounts.push(createAccount({id:'second',providerId:'provider',name:'Second',type:'securities'},f.model));f.model.positions.push(createPosition({id:'asset-second',providerId:'provider',accountId:'second',name:'Same synthetic ETF',isin:'IE00SYNTH001',kind:'etf',quantity:0,price:1},f.model));f.model.settings.autoRefresh=false;
  await seed(f.model);const nativeBefore=await read();await nav('bookings');await page.locator('#openCSVImport').click();await page.locator('#csvSource').selectOption('flatex-native');await page.locator('#csvFlatexDepot').setInputFiles({name:'synthetic-native.csv',mimeType:'text/csv',buffer:Buffer.from(f.text)});await page.locator('#flatexNativeBindings').waitFor();await disclose('flatexNativeBindings');await page.locator('#flatexBindingAccount-0').selectOption('second');await page.locator('#flatexBindingConfirm-0').check();await disclose('flatexNativeSimulation');await page.locator('#flatexSimulationMode').selectOption('append');await page.locator('#flatexSimulationRun').click();await page.locator('#flatexSimulationResult').waitFor();assert.ok(await page.locator('#saveDialog').isDisabled());assert.equal(await page.locator('#flatexNativeAccept').count(),0);assert.deepEqual(await read(),nativeBefore);
  await page.locator('#editorForm').evaluate(e=>e.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await page.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await read(),nativeBefore);await page.locator('#cancelDialog').click();
  // H2: actual global refresh rebases only an undated observation, one CAS.
  const wallet=reviewWalletFixture();await seed(wallet);const before=await read();await nav('positions');await page.locator('#refreshAll').click();await page.waitForFunction(()=>!document.getElementById('refreshAll').disabled);let saved=await read(),model=JSON.parse(saved.raw);assert.equal(saved.revision,before.revision+1);assert.equal(model.positions.find(p=>p.id==='wallet').quantityExact,'2');assert.equal(model.openingPositions.find(p=>p.positionId==='wallet').quantityExact,'2');assert.deepEqual(model.journalEntries,wallet.journalEntries);assert.equal(model.snapshots.at(-1).valuationStatus,'partial');
  // Actual failed writes keep both the raw record and its revision.
  for(const failure of ['quota','post-put']){
   await seed(wallet);await nav('positions');const old=await read();await page.evaluate(mode=>{window.reviewPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='records'&&args[1]==='portfolio'){if(mode==='quota')throw new DOMException('Synthetic quota','QuotaExceededError');const r=window.reviewPut.apply(this,args);r.addEventListener('success',()=>this.transaction.abort(),{once:true});return r;}return window.reviewPut.apply(this,args);};},failure);
   await page.locator('#refreshAll').click();await page.waitForFunction(()=>!document.getElementById('refreshAll').disabled);assert.deepEqual(await read(),old);await page.evaluate(()=>IDBObjectStore.prototype.put=window.reviewPut);
  }
  // Datable openings remain unchanged even though the mocked provider reports 2.
  const dated=reviewWalletFixture();dated.openingPositions.find(p=>p.positionId==='wallet').asOf='1999-01-01';await seed(dated);await nav('positions');const protectedBefore=await read();await page.locator('#refreshAll').click();await page.waitForFunction(()=>!document.getElementById('refreshAll').disabled);assert.deepEqual(await read(),protectedBefore);
  // A real second tab wins after the refresh's snapshot is prepared but before save.
  await seed(wallet);await nav('positions');await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),save=PortfolioStorage.prototype.save;window.reviewOriginalSave=save;PortfolioStorage.prototype.save=function(model){return new Promise((resolve,reject)=>window.releaseReviewSave=()=>save.call(this,model).then(resolve,reject));};});await page.locator('#refreshAll').click();await page.waitForFunction(()=>Boolean(window.releaseReviewSave));
  const other=await context.newPage();await other.goto(base);await ready(other);await other.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.settings.showSmall=!m.settings.showSmall;await s.save(m);s.close();});await other.close();const concurrent=await read();await page.evaluate(()=>window.releaseReviewSave());await page.waitForFunction(()=>!document.getElementById('refreshAll').disabled);assert.deepEqual(await read(),concurrent);await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');PortfolioStorage.prototype.save=window.reviewOriginalSave;});
  // H3: choosing another account in the actual discovery UI cannot duplicate the holding.
  await seed(wallet);await nav('positions');const duplicateBefore=await read();await page.locator('#addWallet').click();await page.locator('#scanAddress').fill('0x'+'A'.repeat(40));await page.locator('#scanWalletButton').click();await page.locator('[data-wallet-asset]').first().waitFor();await page.locator('#scanProvider').selectOption('p');await page.locator('#scanAccount').selectOption('b');await page.locator('#saveDialog').click();await page.locator('#dialogError:not(.hidden)').waitFor();assert.match(await page.locator('#dialogError').innerText(),/bereits erfasst/);assert.deepEqual(await read(),duplicateBefore);
  for(const width of [320,360,390,412,430]){await page.setViewportSize({width,height:900});assert.ok(await page.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));const violations=await page.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));writeFileSync(dir+'/'+engine+'-'+width+'-axe.json',JSON.stringify(violations,null,2));await page.screenshot({path:dir+'/'+engine+'-'+width+'.png'});assert.deepEqual(violations,[]);}await page.setViewportSize({width:390,height:900});await page.screenshot({path:dir+'/'+engine+'-390.png'});await page.locator('#cancelDialog').click();
  // Restore the successful observed balance through the real encrypted UI reader.
  await seed(wallet);await nav('positions');await page.locator('#refreshAll').click();await page.waitForFunction(()=>!document.getElementById('refreshAll').disabled);saved=await read();model=JSON.parse(saved.raw);
  const password='Synthetic review restore 2026!',envelope=await page.evaluate(async({raw,password})=>{const {configureBackupPassword,encryptWithBackupPassword}=await import('/src/backup-vault.js');await configureBackupPassword(password,password);return encryptWithBackupPassword(raw);},{raw:saved.raw,password});
  const rc=await browser.newContext(),rp=await rc.newPage();try{rp.on('dialog',d=>d.accept(d.type()==='prompt'?password:undefined));await rp.goto(base);await ready(rp);const old=await rp.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
   const tampered=structuredClone(model);tampered.bookings[0].date='1999-01-03';await rp.locator('#backupFile').setInputFiles({name:'synthetic-bad-modern.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(tampered))});await rp.locator('#toast').filter({hasText:/Journal|widersprechen/}).waitFor();const unchanged=await rp.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});assert.deepEqual(unchanged,old);
   await rp.locator('#backupFile').setInputFiles({name:'synthetic-review-encrypted.json',mimeType:'application/json',buffer:Buffer.from(envelope)});await rp.locator('#toast').filter({hasText:'Backup wiederhergestellt'}).waitFor();await rp.reload();await ready(rp);const restored=await rp.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();s.close();return m;});assert.deepEqual(restored.journalEntries,model.journalEntries);assert.deepEqual(restored.openingPositions,model.openingPositions);assert.equal(restored.positions.find(p=>p.id==='wallet').quantityExact,'2');
  }finally{await rc.close();}
  // Unroute before a genuine Firefox offline navigation; no fixture transport fallback.
  await waitForAppServiceWorker(page);await context.unroute('**/*',handler);await context.setOffline(true);await page.reload();await ready(page);assert.equal((await read()).raw,saved.raw);
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);const entry={engine,version:browser.version(),result:'PASS',checks:['H1 changed local account/real upload/forced submit exact no mutation','H2 global refresh after cash booking/one CAS/exact journal','quota/post-put abort keep bytes and revision','dated opening protected','real competing tab wins at canonical CAS boundary','H3 real wallet discovery under second account rejected','five widths/Axe and actual error screenshot','M2 undated price remains partial','M3 tampered date rejected without writes','encrypted fresh-profile UI restore and offline reload','deterministic provider fetch fixture; no live provider calls']};report.engines.push(entry);writeFileSync(dir+'/report-'+engine+'.json',JSON.stringify(entry,null,2));console.log('REVIEW_INTEGRITY_PASS '+engine);
 }finally{await context.close();await browser.close();}
}
report.result='PASS';writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));finish();
