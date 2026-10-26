import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.FLH03_08_BASE||'http://127.0.0.1:4173/';
const live=base.startsWith('https:'),useProxy=live&&Boolean(process.env.HTTPS_PROXY);
for(const engine of (process.env.FLH03_08_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(useProxy?['--ignore-certificate-errors']:[])]:[],...(useProxy?{proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}}:{})});
 const context=await browser.newContext({acceptDownloads:true,ignoreHTTPSErrors:live}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}});
 const button=action=>page.locator('[data-action="'+action+'"]');
 const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const axe=async()=>{await page.evaluate(async()=>{for(let i=0;i<3;i++){const animations=document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)&&a.playState==='running');if(!animations.length)break;await Promise.all(animations.map(a=>a.finished.catch(()=>{})));}await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});await page.evaluate(readFileSync('node_modules/axe-core/axe.min.js','utf8')); const r=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));if(r.violations.length)console.error(engine+': contrast CSS '+JSON.stringify(await page.evaluate(()=>['saveDialog','addWizard'].map(id=>{const e=document.getElementById(id),s=getComputedStyle(e);return {id,disabled:e.disabled,colour:s.color,bg:s.backgroundColor,opacity:s.opacity,dialog:document.getElementById('editDialog').open};}))));assert.deepEqual(r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html,checks:n.any}))})),[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));};
 try{
  await page.goto(base);await ready();
  await page.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js');
   const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'broker',name:'Synthetic broker'}));
   for(const id of ['a','b'])m.accounts.push(createAccount({id,providerId:'broker',name:'Depot '+id,type:'securities'},m));
   for(let i=0;i<401;i++)m.positions.push(createPosition({id:'p-'+i,providerId:'broker',accountId:i%2?'b':'a',name:(i%2?'Other ':'Wanted ')+i,isin:'IE00B4L5Y983',symbol:'SAME',kind:'etf',quantity:1,price:10},m));
   m.snapshots.push({id:'retained',date:'2023-01-01',source:'current',total:10,totalEURExact:'10',byPosition:{'p-0':'10'}});
   const store=new PortfolioStorage();await store.initialize();await store.save(m);store.close();
  });
  await page.reload();await ready();
  // Establish the actual offline prerequisite BEFORE deliberate storage fault injections.
  // Readiness alone does not prove that this document has an active controller.
  await page.waitForFunction(async()=>{const registration=await navigator.serviceWorker.getRegistration();return registration?.active?.state==='activated';});
  await page.reload();await ready();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  console.log(engine+': UI fixture active worker/controller before quota/abort '+JSON.stringify(await page.evaluate(async()=>({controller:navigator.serviceWorker.controller?.scriptURL,active:(await navigator.serviceWorker.getRegistration())?.active?.state,caches:await caches.keys()}))));
  await page.locator('#sidebarNav [data-page=positions]').click();
  const before=await record();assert.equal(await page.locator('[data-position-select]').count(),0);
  await button('select-positions').click();await page.locator('#positionSearch').fill('Wanted');
  assert.equal(await page.locator('[data-position-select]').count(),100);await button('select-filtered').click();
  assert.match(await page.locator('#positionSelectionStatus').innerText(),/201 ausgewählt, davon 201/);
  await page.locator('#positionSearch').fill('Other');assert.match(await page.locator('#positionSelectionStatus').innerText(),/201 ausgewählt, davon 0.*201 ausgeblendet/);
  await button('preview-removal').click();assert.equal(await page.locator('#dialogFields li').count(),201);assert.match(await page.locator('#dialogFields').innerText(),/Wanted 400/);
  assert.equal(await page.locator('#cancelDialog').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#editDialog').evaluate(e=>e.open),false);
  assert.equal(await button('preview-removal').evaluate(e=>e===document.activeElement),true);
  assert.deepEqual(await record(),before,'selection and preview write nothing');
  await page.locator('#positionSearch').fill('no-match');assert.equal(await button('select-filtered').isDisabled(),true);
  await page.locator('#positionSearch').fill('');await button('select-all').click({trial:true});
  page.once('dialog',d=>d.dismiss());await button('select-all').click();assert.match(await page.locator('#positionSelectionStatus').innerText(),/201 ausgewählt/);
  page.once('dialog',d=>d.accept());await button('select-all').click();assert.match(await page.locator('#positionSelectionStatus').innerText(),/401 ausgewählt/);
  await button('clear-selection').click();assert.equal(await button('preview-removal').isDisabled(),true);
  // Same security in two accounts remains independently selectable by position ID.
  await page.locator('#positionSearch').fill('Wanted 0');await page.locator('[data-position-select="p-0"]').check();
  await page.locator('#positionSearch').fill('Other 1');await page.locator('[data-position-select="p-1"]').check();await page.locator('#positionSearch').fill('');
  for(const width of [320,390,430,768,1024,1440]){
   console.log(engine+': selection/preview width '+width);await page.setViewportSize({width,height:560});await axe();await button('preview-removal').click();await axe();
   assert.match(await page.locator('#dialogFields').innerText(),/1 unverbundene Positionen löschbar, 1 gesperrt/);
   assert.equal(await page.locator('#saveDialog').evaluate(e=>e.classList.contains('primary')),false,'Destructive consent must never retain primary green styling');
   assert.equal(await page.locator('#saveDialog').evaluate(e=>getComputedStyle(e).transitionDuration),'0s','Destructive styling must be immediate, without a low-contrast color crossfade');
   const geometry=await page.locator('#editDialog').evaluate(d=>{const r=d.getBoundingClientRect();return [...d.querySelectorAll('.dialog-footer button')].map(b=>{const q=b.getBoundingClientRect();return {id:b.id,inside:q.left>=r.left&&q.right<=r.right&&q.top>=r.top&&q.bottom<=r.bottom};});});assert.ok(geometry.every(b=>b.inside),'Every cancel/confirm target must fit the actual dialog at '+width+': '+JSON.stringify(geometry));
   assert.match(await page.locator('#dialogFields').innerText(),/Historische Stichtage/);await page.locator('#cancelDialog').click();
  }
  await button('preview-removal').click();
  const downloadPromise=page.waitForEvent('download');await page.locator('#removalBackup').click();const dl=await downloadPromise;
  const backup=JSON.parse(readFileSync(await dl.path(),'utf8'));assert.equal(backup.positions.length,401);assert.equal(backup.settings.eodhdKey,'');
  // Exercise the real readwrite transaction: quota before put AND abort after put.
  await page.evaluate(()=>{window.originalRemovalPut=IDBObjectStore.prototype.put;});
  await page.locator('[name=confirmRemoval]').check();
  for(const mode of ['quota','abort']){
   await page.evaluate(mode=>{IDBObjectStore.prototype.put=function(...args){
    if(mode==='quota')throw new DOMException('synthetic quota','QuotaExceededError');
    const request=window.originalRemovalPut.apply(this,args);this.transaction.abort();return request;
   };},mode);
   await page.locator('#saveDialog').click();await page.locator('#dialogError:not(.hidden)').waitFor();
   assert.deepEqual(await record(),before,mode+' transaction failure retains exact committed data');
   await page.evaluate(()=>{IDBObjectStore.prototype.put=window.originalRemovalPut;});
  }
  page.once('dialog',d=>d.accept());await page.locator('#cancelDialog').click();
  await button('preview-removal').click();await page.locator('[name=confirmRemoval]').check();
  console.log(engine+': UI before-offline controller '+JSON.stringify(await page.evaluate(async()=>({controller:navigator.serviceWorker.controller?.scriptURL,active:(await navigator.serviceWorker.getRegistration())?.active?.state,caches:await caches.keys()}))));
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);
  await page.evaluate(()=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){document.getElementById('refreshAll').click();return original.apply(this,args);};window.finalRemovalPut=original;});
  await page.locator('#saveDialog').click();await page.waitForFunction(()=>!document.getElementById('editDialog').open);
  await page.evaluate(()=>{IDBObjectStore.prototype.put=window.finalRemovalPut;});assert.equal(await page.locator('#priceInfo').evaluate(e=>e.classList.contains('hidden')),true,'Refresh cannot start inside destructive commit');
  const after=await record(),m=JSON.parse(after.raw);assert.equal(after.revision,before.revision+1);
  assert.equal(m.positions.length,400);assert.ok(m.positions.some(p=>p.id==='p-0'));assert.ok(!m.positions.some(p=>p.id==='p-1'));
  assert.deepEqual(m.snapshots,JSON.parse(before.raw).snapshots);assert.deepEqual(m.bookings,JSON.parse(before.raw).bookings);assert.deepEqual(m.accounts,JSON.parse(before.raw).accounts);
  assert.equal(await page.locator('[data-position-select]').count(),0);assert.equal(await button('select-positions').evaluate(e=>e===document.activeElement),true);
  await page.reload();await ready();assert.deepEqual(await record(),after,'Confirmed delete survives reload');
  await page.locator('#sidebarNav [data-page=dashboard]').click();assert.match(await page.locator('#totalValue').innerText(),/4.000/);await context.setOffline(false);
  // Exact preimage + CAS refuse a preview after a genuine competing writer.
  await page.locator('#sidebarNav [data-page=positions]').click();await button('select-positions').click();
  await page.locator('#positionSearch').fill('Other 3');await page.locator('[data-position-select="p-3"]').check();
  await button('preview-removal').click();await page.locator('[name=confirmRemoval]').check();
  const second=await context.newPage();await second.goto(base);await second.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await second.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();const m=await s.initialize();m.positions.find(p=>p.id==='p-4').notes='competing tab';await s.save(m);s.close();});
  const winner=await record();await page.locator('#saveDialog').click();await page.locator('#dialogError:not(.hidden)').waitFor();
  assert.deepEqual(await record(),winner,'Stale destructive preview never overwrites competing writer');await second.close();
  page.once('dialog',d=>d.accept());await page.locator('#cancelDialog').click();
  // Real file input restores both the offered pre-delete backup and encrypted post-delete data.
  const password='synthetic-only-password';
  const encrypted=await page.evaluate(async raw=>{const {configureBackupPassword,encryptWithBackupPassword}=await import('/src/backup-vault.js');const {createCompleteBackup}=await import('/src/complete-backup.js');await configureBackupPassword('synthetic-only-password','synthetic-only-password');return encryptWithBackupPassword(JSON.stringify(createCompleteBackup(JSON.parse(raw))));},after.raw);
  for(const [bytes,count,deleted] of [[JSON.stringify(backup),401,false],[encrypted,400,true]]){
   const rc=await browser.newContext({ignoreHTTPSErrors:live}),rp=await rc.newPage();
   try{await rp.goto(base);await rp.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
    rp.on('dialog',d=>d.accept(d.type()==='prompt'?password:undefined));
    await rp.locator('#backupFile').setInputFiles({name:'synthetic-removal.json',mimeType:'application/json',buffer:Buffer.from(bytes)});
    try{await rp.waitForFunction(()=>document.getElementById('toast').textContent.includes('Backup wiederhergestellt'));}catch(error){console.error(engine+': restore '+(deleted?'encrypted-post':'plain-pre')+' '+await rp.locator('#toast').innerText());throw error;}
    await rp.reload();await rp.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
    const restored=await rp.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();try{return await s.initialize();}finally{s.close();}});
    assert.equal(restored.positions.length,count);assert.equal(restored.positions.some(p=>p.id==='p-1'),!deleted);assert.deepEqual(restored.snapshots,m.snapshots);assert.deepEqual(restored.bookings,m.bookings);
   }finally{await rc.close();}
  }
  assert.deepEqual(errors,[]);console.log(engine+': FLH03-08 UI 201/401 full-filter/hidden/all/cancel/focus, 12 full axe scans at six widths/small heights, quota/actual transaction abort rollback, competing-tab CAS, plain pre-delete/encrypted post-delete UI restore and one revision OFFLINE delete/reload PASS');
 }finally{await context.close();await browser.close();}
}
