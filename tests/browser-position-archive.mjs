import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.ARCHIVE_BASE||'http://127.0.0.1:4173/',live=base.startsWith('https:'),proxy=live&&process.env.HTTPS_PROXY;
const report={base,scope:'FLH03-14',engines:[]};mkdirSync('artifacts/gates',{recursive:true});
for(const engine of (process.env.ARCHIVE_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({acceptDownloads:true,ignoreHTTPSErrors:live,viewport:{width:390,height:560}});
 await ctx.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 // Re-evaluate visibility at click time across responsive layout/navigation.
 const nav=page=>p.locator('#mobileNav [data-page="'+page+'"]:visible,#sidebarNav [data-page="'+page+'"]:visible').click();
 const record=()=>p.evaluate(async base=>{const {openPortfolioDB,readUnverifiedRecord}=await import(new URL('src/atomic-storage.js',base));const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}},base);
 const menu=async()=>{if(await p.locator('[data-action=select-positions]').count())await p.locator('[data-action=select-positions]').click();};
 const cycle=()=>p.locator('#positionSelectFiltered').click();
 const showArchive=async()=>{await menu();if(await p.locator('#positionArchiveToggle').getAttribute('aria-pressed')==='false')await p.locator('#positionArchiveToggle').click();};
 const open=async id=>{if(await p.locator('[data-action=cancel-selection]').count())await p.locator('[data-action=cancel-selection]').click();await menu();await p.locator('[data-position-select="'+id+'"]').check();const b=p.locator('#positionSelectionTools [data-action="archive-position"][data-id="'+id+'"]');assert.equal(await b.isVisible(),true,'existing single-position archive dialog is available centrally for exactly the selected row');await b.click();await p.locator('#editDialog[open]').waitFor();};
 const commit=async()=>{await p.locator('#saveDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});};
 const value=()=>p.evaluate(async base=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base)),{totalExactEUR}=await import(new URL('src/model.js',base)),{historicalWealthView}=await import(new URL('src/historical-portfolio-value.js',base));const s=new PortfolioStorage();const m=await s.initialize();s.close();return {total:totalExactEUR(m),history:historicalWealthView(m)};},base);
 const strip=(raw,id)=>{const m=JSON.parse(raw);delete m.positions.find(p=>p.id===id).archived;return m;};
 try{
  await p.goto(base);await ready();
  await p.evaluate(async base=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import(new URL('src/model.js',base)),{executeTransaction}=await import(new URL('src/transactions.js',base)),{PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base));
   const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'provider',name:'Synthetic archive'}));
   for(const id of ['a','b'])m.accounts.push(createAccount({id,providerId:'provider',name:'Depot '+id,type:'securities'},m));
   m.positions.push(createPosition({id:'cash',providerId:'provider',accountId:'a',kind:'cash',name:'Cash',symbol:'CASH',quantity:1000,price:1},m));
   for(const id of ['asset','same'])m.positions.push(createPosition({id,providerId:'provider',accountId:id==='asset'?'a':'b',kind:'etf',name:'ETF '+id,isin:'IE00B4L5Y983',symbol:'ETF',quantity:0,price:100},m));
   executeTransaction(m,{positionId:'asset',cashPositionId:'cash',type:'buy',date:'2023-01-02',quantity:6,unitPrice:100,feeEUR:1,taxEUR:0});m.openingPositions.find(p=>p.positionId==='cash').asOf='2023-01-01';
   m.priceHistories.asset={currency:'EUR',source:'CSV (selbst geprüft)',points:[{date:'2023-01-02',total:100},{date:'2023-01-03',total:110}]};
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  },base);await p.reload();await ready();await nav('positions');
  // ready may resolve while the selected active worker is still activating.
  await p.evaluate(async()=>{const r=await navigator.serviceWorker.ready,w=r.active;if(!w)throw new Error('No active service worker');if(w.state!=='activated')await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Service worker did not activate')),60000);const changed=()=>{if(w.state==='activated'){clearTimeout(timer);w.removeEventListener('statechange',changed);resolve();}else if(w.state==='redundant'){clearTimeout(timer);w.removeEventListener('statechange',changed);reject(new Error('Service worker became redundant'));}};w.addEventListener('statechange',changed);changed();});});
  assert.equal(await p.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return r.active?.state;}),'activated');await p.reload();await ready();await nav('positions');await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const before=await record(),financialBefore=await value();await open('asset');assert.equal(await p.locator('#cancelDialog').evaluate(e=>e===document.activeElement),true);
  const scans=[];
  for(const width of [320,390,430,768,1024,1440]){
   await p.setViewportSize({width,height:560});await p.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   const v=await p.evaluate(async()=> (await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(v,[]);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));scans.push({width,height:560,status:'PASS'});
  }
  await p.keyboard.press('Escape');assert.deepEqual(await record(),before);assert.equal(await p.evaluate(()=>document.activeElement.dataset.action),'archive-position');
  await open('asset');await commit();const archived=await record();assert.equal(archived.revision,before.revision+1);assert.deepEqual(strip(archived.raw,'asset'),JSON.parse(before.raw));assert.deepEqual(archived.settings,before.settings);assert.deepEqual(await value(),financialBefore);
  assert.equal(await p.locator('[data-action=archive-position][data-id=asset]').count(),0);await showArchive();assert.match(await p.locator('#positionArchiveHint').innerText(),/weiterhin/);
  // Existing editor must preserve the archive flag rather than reactivate identity.
  await p.locator('[data-action=cancel-selection]').click();
  await p.locator('[data-action=edit-position][data-id=asset]').click();await p.locator('#editorForm [name=name]').fill('Renamed archived ETF');await commit();
  assert.equal(JSON.parse((await record()).raw).positions.find(p=>p.id==='asset').archived,true);
  const edited=await record();await open('asset');await commit();const restored=await record();assert.equal(restored.revision,edited.revision+1);assert.deepEqual(JSON.parse(restored.raw),strip(edited.raw,'asset'));
  // Real IndexedDB quota failure: visibility must roll back exactly.
  await p.evaluate(()=>{const original=IDBObjectStore.prototype.put;window.__archivePut=original;IDBObjectStore.prototype.put=function(...args){if(this.name==='records'&&args[1]==='portfolio')throw new DOMException('Synthetic quota','QuotaExceededError');return original.apply(this,args);};});
  await open('asset');await p.locator('#saveDialog').click();await p.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await record(),restored);
  await p.evaluate(()=>{IDBObjectStore.prototype.put=window.__archivePut;delete window.__archivePut;});await p.keyboard.press('Escape');
  // Actual post-put transaction abort must not commit an archive flag either.
  await p.evaluate(()=>{const original=IDBObjectStore.prototype.put;window.__archivePut=original;IDBObjectStore.prototype.put=function(...args){const result=original.apply(this,args);if(this.name==='records'&&args[1]==='portfolio')result.addEventListener('success',()=>this.transaction.abort(),{once:true});return result;};});
  await open('asset');await p.locator('#saveDialog').click();await p.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await record(),restored);
  await p.evaluate(()=>{IDBObjectStore.prototype.put=window.__archivePut;delete window.__archivePut;});await p.keyboard.press('Escape');
  // A real peer commit invalidates the already open preview without stale overwrite.
  await open('asset');const peer=await ctx.newPage();await peer.goto(base);await peer.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await peer.evaluate(async base=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base));const s=new PortfolioStorage(),m=await s.initialize();m.providers[0].name='Synthetic peer wins';await s.save(m);s.close();},base);
  const peerRecord=await record();await p.locator('#saveDialog').click();await p.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await record(),peerRecord);await peer.close();await p.keyboard.press('Escape');await p.reload();await ready();await nav('positions');
  // Actual offline archive commit and reload, with active controller already proved.
  await ctx.setOffline(true);await open('asset');await commit();const offline=await record();assert.equal(JSON.parse(offline.raw).positions.find(p=>p.id==='asset').archived,true);
  await p.reload();await ready();await nav('positions');assert.equal(await p.locator('[data-action=archive-position][data-id=asset]').count(),0);assert.deepEqual(await record(),offline);await ctx.setOffline(false);
  // Fresh-profile UI restore from a real complete model envelope (plain and encrypted).
  const envelopes=await p.evaluate(async ({base,record})=>{const {safeImport,backup}=await import(new URL('src/model.js',base)),{configureBackupPassword,encryptWithBackupPassword}=await import(new URL('src/backup-vault.js',base)),{createCompleteBackup}=await import(new URL('src/complete-backup.js',base));const m=safeImport(JSON.parse(record.raw));m.settings=record.settings;await configureBackupPassword('Synthetic archive backup 2026!','Synthetic archive backup 2026!');return {plain:backup(m,{includeHistory:true}),encrypted:await encryptWithBackupPassword(JSON.stringify(createCompleteBackup(m,null,m.walletHistory)))};},{base,record:offline});
  for(const [format,text] of Object.entries(envelopes)){
   console.log(engine+': restore begins '+format);
   const fresh=await browser.newContext({acceptDownloads:true,ignoreHTTPSErrors:live}),q=await fresh.newPage();await q.goto(base);await q.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   if(format==='plain')q.once('dialog',d=>d.accept());else q.on('dialog',d=>d.type()==='prompt'?d.accept('Synthetic archive backup 2026!'):d.accept());
   await q.locator('#backupFile').setInputFiles({name:'synthetic-archive-backup.json',mimeType:'application/json',buffer:Buffer.from(text)});
   await q.waitForFunction(()=>document.getElementById('toast').textContent.includes('Backup wiederhergestellt.'));
   const data=await q.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();s.close();return m;});console.log(engine+': restore result '+format+' '+JSON.stringify({positions:data.positions.map(p=>({id:p.id,archived:p.archived})),toast:await q.locator('#toast').textContent(),status:await q.locator('#portfolioStorageState').textContent(),record:await q.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{const r=await readUnverifiedRecord(db);return {revision:r.revision,positions:JSON.parse(r.raw).positions.map(p=>p.id)}}finally{db.close()}})}));assert.equal(data.positions.length,3);assert.deepEqual(data.journalEntries,JSON.parse(offline.raw).journalEntries);assert.deepEqual(data.priceHistories,JSON.parse(offline.raw).priceHistories);await fresh.close();
  }
  // Full archive-aware UI selection, including model rows beyond the first100.
  await p.evaluate(async base=>{const {blankModel,createProvider,createPosition}=await import(new URL('src/model.js',base)),{PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base));const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'provider',name:'Synthetic selection'}));for(let i=0;i<401;i++)m.positions.push(createPosition({id:'s'+i,providerId:'provider',name:'Wanted '+i,kind:'etf',quantity:1,price:10,...(i%2?{archived:true}:{})},m));const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},base);
  await p.reload();await ready();await nav('positions');const selectionBefore=await record();if(await p.locator('[data-action=select-positions]').count())await p.locator('[data-action=select-positions]').click();await p.locator('#positionSearch').fill('Wanted');
  assert.equal(await p.locator('[data-position-select]').count(),100);await cycle();await cycle();assert.match(await p.locator('#positionSelectionStatus').innerText(),/201 ausgewählt, davon 201/);
  await showArchive();assert.match(await p.locator('#positionSelectionStatus').innerText(),/201 ausgewählt, davon 201/);assert.match(await p.locator('#positionSelectionStatus').innerText(),/401/);
  await cycle();assert.match(await p.locator('#positionSelectionStatus').innerText(),/250 ausgewählt/);await cycle();assert.match(await p.locator('#positionSelectionStatus').innerText(),/401 ausgewählt/);
  await menu();await p.locator('#positionArchiveToggle').click();assert.match(await p.locator('#positionSelectionStatus').innerText(),/401 ausgewählt, davon 201.*200 ausgeblendet/);
  await p.locator('[data-action=preview-removal]').click();assert.equal(await p.locator('#positionRemovalItems').evaluate(e=>e.open),false,'bulk impact details start closed');await p.locator('#positionRemovalItems>summary').click();assert.equal(await p.locator('#dialogFields li').count(),401);assert.match(await p.locator('#dialogFields').innerText(),/Wanted 400/);await p.keyboard.press('Escape');assert.deepEqual(await record(),selectionBefore);
  // Bulk archive: exact selection, explicit consent, no financial changes, real atomic failures.
  await p.locator('[data-action=archive-selected]').click();assert.match(await p.locator('#dialogFields').innerText(),/201 werden archiviert, 200 sind bereits archiviert/);await p.keyboard.press('Escape');assert.deepEqual(await record(),selectionBefore);
  for(const width of [320,390,430,1440]){await p.setViewportSize({width,height:560});await p.locator('[data-action=archive-selected]').click();await p.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});const violations=await p.evaluate(async()=> (await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.ok(await p.locator('.dialog-footer button').evaluateAll(bs=>bs.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth;})));if(engine==='chromium')await p.screenshot({path:'artifacts/gates/bulk-archive-'+width+'.png'});await p.keyboard.press('Escape');assert.deepEqual(await record(),selectionBefore);}
  await p.locator('[data-action=archive-selected]').click();await p.locator('[name=confirmArchive]').check();
  await p.evaluate(()=>{window.bulkArchivePut=IDBObjectStore.prototype.put;});
  for(const mode of ['quota','abort']){
   await p.evaluate(mode=>{IDBObjectStore.prototype.put=function(...args){if(mode==='quota')throw new DOMException('synthetic quota','QuotaExceededError');const request=window.bulkArchivePut.apply(this,args);this.transaction.abort();return request;};},mode);
   await p.locator('#saveDialog').click();await p.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await record(),selectionBefore,mode+' bulk archive preserves exact record');
   await p.evaluate(()=>{IDBObjectStore.prototype.put=window.bulkArchivePut;});
  }
  await commit();const bulk=await record(),bulkModel=JSON.parse(bulk.raw),original=JSON.parse(selectionBefore.raw);assert.equal(bulk.revision,selectionBefore.revision+1);assert.ok(bulkModel.positions.every(p=>p.archived));
  assert.deepEqual({...bulkModel,positions:bulkModel.positions.map(({archived,...p})=>p)},{...original,positions:original.positions.map(({archived,...p})=>p)},'bulk archive changes only selected archive flags');
  await showArchive();await open('s0');await commit();assert.equal(JSON.parse((await record()).raw).positions.find(p=>p.id==='s0').archived,undefined,'existing single restore remains available');
  await p.evaluate(async({base,record})=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base));const s=new PortfolioStorage();await s.initialize();const m=JSON.parse(record.raw);m.settings=record.settings;await s.save(m);s.close();},{base,record:selectionBefore});await p.reload();await ready();await nav('positions');
  // Dashboard valuation drilldown must expose archived holdings that still count.
  await p.evaluate(async base=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base));const s=new PortfolioStorage(),m=await s.initialize();const item=m.positions.find(p=>p.id==='s1');item.price=0;item.priceExact='0';item.priceStatus='Kurs fehlt';await s.save(m);s.close();},base);
  await p.reload();await ready();await nav('dashboard');await p.locator('.hero-valuation-link').click();await menu();assert.equal(await p.locator('#positionArchiveToggle').getAttribute('aria-pressed'),'true');assert.ok(await p.locator('[data-position-select=s1]').isVisible());assert.equal(await p.locator('.position-entry [data-action=edit-position]').count(),0);await p.locator('[data-action=cancel-selection]').click();assert.ok(await p.locator('.position-row-actions [data-action=edit-position][data-id=s1]').isVisible());
  // Archive-only portfolios retain an accessible entry and reveal their rows without writes.
  await p.evaluate(async base=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base));const s=new PortfolioStorage(),m=await s.initialize();m.positions.forEach(p=>p.archived=true);await s.save(m);s.close();},base);
  await p.reload();await ready();await nav('positions');const onlyArchived=await record();assert.equal(await p.locator('[data-action=edit-position]').count(),0);await menu();assert.equal(await p.locator('#positionSelectFiltered').isDisabled(),false);await showArchive();assert.equal(await p.locator('.position-entry [data-action=edit-position]').count(),0);assert.equal(await p.locator('[data-position-select]').count(),100);await cycle();assert.ok(await p.locator('[data-action=archive-selected]').isDisabled(),'no unsupported bulk restoration is offered');assert.equal(await p.locator('[data-action=archive-selected]').innerText(),'Wiederherstellen');assert.match(await p.locator('#positionSingleRestoreHint').innerText(),/jeweils eine/);await p.locator('[data-action=cancel-selection]').click();assert.equal(await p.locator('.position-entry [data-action=edit-position]').count(),100);assert.deepEqual(await record(),onlyArchived);
  for(const width of [320,390,430,768,1440]){await p.setViewportSize({width,height:560});await menu();assert.equal(await p.locator('#positionSelectionTools details').count(),0);await p.locator('#positionArchiveToggle').scrollIntoViewIfNeeded();assert.equal(await p.locator('#positionArchiveToggle').isVisible(),true);await p.keyboard.press('Escape');}assert.deepEqual(await record(),onlyArchived);
  assert.deepEqual(errors,[]);report.engines.push({engine,status:'PASS',scans,checks:['linked positive holding visibility only/exact history and totals','cancel/Escape/focus','same ISIN separate accounts','edit retains archive','one revision archive/unarchive','actual quota and post-put transaction abort rollback','401 archive-aware UI selection before pagination','dashboard quality drilldown includes archived valued holdings','peer CAS conflict','offline archive/reload','fresh plain/encrypted UI restore']});
  console.log(engine+': archive/unarchive, unchanged economics/history, edit identity, quota/CAS, actual offline save/reload, plain/encrypted fresh UI restore, six-width Axe PASS');
 }finally{writeFileSync('artifacts/gates/position-archive.json',JSON.stringify(report,null,2)+'\n');await ctx.close();await browser.close();}
}
