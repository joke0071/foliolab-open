import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.FLH03_UI_BASE||'http://127.0.0.1:4173/',engines={chromium,firefox,webkit},live=base.startsWith('https:'),proxy=live&&process.env.HTTPS_PROXY;
const previousDoc=new URL(live?'/':'/tests/storage-origin.html',base);if(!live)previousDoc.hostname=previousDoc.hostname==='127.0.0.1'?'localhost':'127.0.0.1';
const axeSource=readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8');
for(const engine of (process.env.FLH03_UI_ENGINES||'chromium').split(',')){
 const browser=await engines[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,ignoreHTTPSErrors:live});
 await ctx.addInitScript({content:axeSource});// Intercept external traffic only: routing app requests can stall Firefox
 // after a native beforeunload rejection (Playwright #38731).
 await ctx.route(url=>![new URL(base).origin,previousDoc.origin].includes(url.origin),r=>r.abort());
 let p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const nav=async name=>p.locator((await p.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav')+' [data-page="'+name+'"]').click();
 const scan=async label=>{assert.deepEqual(await p.evaluate(async()=> (await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))),[],label);const overflow=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,nodes:[...document.querySelectorAll('body *')].flatMap(el=>{const r=el.getBoundingClientRect();return r.width&&r.right>innerWidth+1?[{tag:el.tagName,id:el.id,className:String(el.className).slice(0,100),right:Math.round(r.right),width:Math.round(r.width),text:el.children.length?'':el.textContent?.slice(0,80)}]:[];}).slice(-25)}));assert.ok(overflow.scroll<=overflow.width+1,label+' overflow '+JSON.stringify(overflow));};
 const read=()=>p.evaluate(async base=>{const {openPortfolioDB,readUnverifiedRecord}=await import(new URL('src/atomic-storage.js',base));const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}},base);
 try{
  await p.goto(base);await p.waitForFunction(()=>document.getElementById('portfolioStorageState').textContent.includes('IndexedDB aktiv'));
  assert.equal(await p.locator('#onboarding').isVisible(),true);assert.match(await p.locator('#totalValue').innerText(),/0,00/);
  const recovery=await p.evaluate(async base=>{
   const {openPortfolioDB}=await import(new URL('src/atomic-storage.js',base)),{blankModel,createProvider,backup}=await import(new URL('src/model.js',base));
   const m=blankModel();m.providers.push(createProvider({name:'Synthetic recovered'}));m.settings.autoRefresh=false;
   const db=await openPortfolioDB();await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put({schemaVersion:1,revision:7,raw:'{damaged',settings:{},deleted:false,updatedAt:'2026-10-25'},'portfolio');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();return backup(m);
  },base);
  const original=await read();await p.reload();await p.locator('#downloadRaw').waitFor();
  for(const [width,height] of [[320,360],[390,844],[430,740],[667,320],[768,500],[1024,768],[1440,900]]){
   await p.setViewportSize({width,height});await nav('dashboard');
   assert.equal(await p.locator('#onboarding').isVisible(),false);assert.equal(await p.locator('#summaryStats').isVisible(),false);
   assert.equal(await p.locator('#totalValue').textContent(),'–');
   for(const id of ['localPortfolioStatus','mobilePortfolioStatus'])assert.match(await p.locator('#'+id).textContent(),/nicht verfügbar/);
   await scan('recovery '+width+'x'+height);
  }
  for(const tab of ['positions','bookings','more']){await nav(tab);for(const id of tab==='positions'?['addWizard','addWallet','refreshAll']:tab==='bookings'?['addBooking','openCSVImport']:['addProvider','addAccount','deleteAll'])assert.ok(await p.locator('#'+id).isDisabled(),id+' recovery gate');}
  await p.evaluate(()=>document.querySelector('#addProvider').dispatchEvent(new MouseEvent('click',{bubbles:true})));
  assert.equal(await p.locator('#editDialog').isVisible(),false);assert.equal(await p.locator('#wizardDialog').isVisible(),false);
  assert.deepEqual(await read(),original,'Read-only recovery does not rewrite original bytes');
  const download=p.waitForEvent('download');await p.locator('#downloadRaw').click();const saved=await download;
  const bytes=JSON.parse(readFileSync(await saved.path(),'utf8'));assert.equal(bytes.raw,'{damaged');
  p.once('dialog',d=>d.accept());await p.locator('#backupFile').setInputFiles({name:'synthetic-restore.json',mimeType:'application/json',buffer:Buffer.from(recovery)});
  await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  assert.match(await p.locator('#localPortfolioStatus').textContent(),/lokal gespeichert/);await nav('more');assert.ok(await p.locator('#addProvider').isEnabled());
  assert.equal(JSON.parse((await read()).raw).providers[0].name,'Synthetic recovered');
  console.log(engine+': A recovery/empty distinction, safe actions, 7 geometries/full axe, unchanged original download and controlled restore PASS');
  // B: independent source fixture, no observations, one existing FLH02 projection.
  await p.evaluate(async base=>{
   const {blankModel,createProvider,createPosition}=await import(new URL('src/model.js',base)),{executeTransaction}=await import(new URL('src/transactions.js',base)),{PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base));
   const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'provider',name:'Synthetic'}));
   m.positions.push(createPosition({id:'cash',providerId:'provider',name:'Cash',symbol:'A',kind:'cash',quantity:1000,price:1},m),createPosition({id:'etf',providerId:'provider',name:'ETF',symbol:'ETF',kind:'etf',quantity:0,price:100},m));
   executeTransaction(m,{positionId:'etf',cashPositionId:'cash',date:'2023-01-02',type:'buy',quantity:6,unitPrice:100,feeEUR:1,taxEUR:0});m.openingPositions.find(p=>p.positionId==='cash').asOf='2023-01-01';m.priceHistories.etf={currency:'EUR',source:'CSV (selbst geprüft)',points:[{date:'2023-01-02',total:100},{date:'2023-01-03',total:110}]};
   const store=new PortfolioStorage();await store.initialize();await store.save(m);store.close();
  },base);
  await p.reload();await nav('dashboard');const proven=await read();
  assert.match(await p.locator('#summaryStats .stat').last().innerText(),/60,00/);assert.match(await p.locator('#summaryStats .stat').last().innerText(),/inkl. Geldflüsse · keine Rendite/);
  assert.ok(!(await p.locator('#summaryStats').innerText()).includes('Stichtage nötig'));assert.deepEqual(await read(),proven);
  await p.evaluate(async base=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base));const s=new PortfolioStorage(),m=await s.initialize();m.openingPositions.find(p=>p.positionId==='cash').asOf=null;await s.save(m);s.close();},base);
  await p.reload();await nav('dashboard');assert.match(await p.locator('#summaryStats .stat').last().innerText(),/Teilportfolio/);assert.equal(await p.locator('#summaryStats .stat-value').last().innerText(),'–');
  await p.evaluate(async ({base,record})=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base)),{safeImport}=await import(new URL('src/model.js',base));const s=new PortfolioStorage();await s.initialize();const m=safeImport(JSON.parse(record.raw));m.settings=record.settings;await s.save(m);s.close();},{base,record:proven});
  await p.reload();await nav('dashboard');const provenRestored=await read();
  // C: all relevant nested disclosures actually open, including seven reported nodes.
  await nav('more');await p.evaluate(()=>{for(const id of ['marketSettings','blockchainSettings','googleDriveBackupSetup','backupPasswordSetup']){const root=document.getElementById(id);root.open=true;root.querySelectorAll('details').forEach(d=>d.open=true);}});
  const help=await p.locator('.source-detail .field small,.drive-footer-note').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().height).map(n=>({color:getComputedStyle(n).color,text:n.textContent})));
  assert.ok(help.length>=7,'The reported help nodes are expanded');assert.ok(help.every(n=>n.color==='rgb(77, 103, 86)'));
  for(const [width,height] of [[320,360],[390,844],[768,500],[1440,900]]){await p.setViewportSize({width,height});await scan('expanded settings '+width);}
  assert.deepEqual(await read(),provenRestored,'Disclosure/summary changes are read-only');
  console.log(engine+': B proven 999→1059 change/no return and C expanded settings/7 help nodes/full axe PASS');
  // D: native reload/back confirmation plus the shared handler's exact dirty lifecycle.
  await p.setViewportSize({width:390,height:844});
  const unloadSignal=()=>p.evaluate(()=>{const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;});
  const refuseReload=async(label,field,expected)=>{
   assert.equal(await unloadSignal(),true,label+' dirty handler');let dialogs=0;
   const dismiss=async d=>{if(d.type()==='beforeunload'){dialogs++;await d.dismiss();}else await d.accept();};p.on('dialog',dismiss);
   const warning=p.waitForEvent('dialog',{predicate:d=>d.type()==='beforeunload',timeout:5000});
   await p.evaluate(()=>{setTimeout(()=>location.reload(),0);});await warning;p.off('dialog',dismiss);
   assert.ok(dialogs>0,label+' actual reload warning');assert.equal(await field.inputValue(),expected,label+' rejected reload retains draft');
  };
  await p.locator('#addProvider').click();assert.equal(await unloadSignal(),false,'Clean provider has no unload guard');
  await p.locator('#providerName').fill('Synthetic dirty provider');
  for(const [width,height] of [[320,360],[667,320],[1440,900]]){await p.setViewportSize({width,height});await scan('dirty provider '+width);}await p.setViewportSize({width:390,height:844});await refuseReload('provider',p.locator('#providerName'),'Synthetic dirty provider');
  p.once('dialog',d=>d.accept());await p.keyboard.press('Escape');assert.equal(await unloadSignal(),false);assert.equal(await p.evaluate(()=>document.activeElement.id),'addProvider');
  await nav('positions');await p.locator('#addWizard').click();await p.locator('#wizardName').fill('Synthetic dirty asset');await refuseReload('wizard',p.locator('#wizardName'),'Synthetic dirty asset');
  p.once('dialog',d=>d.accept());await p.keyboard.press('Escape');assert.equal(await unloadSignal(),false);
  await nav('bookings');await p.locator('#openCSVImport').click();await p.locator('#csvFile').setInputFiles({name:'draft.csv',mimeType:'text/csv',buffer:Buffer.from('date;type;position;quantity;price;id\n2023-01-04;deposit;A;1;1;draft')});await p.waitForFunction(()=>document.getElementById('csvReviewStatus').textContent.includes('1 bereit'));
  await refuseReload('CSV preview',p.locator('#csvFile'),await p.locator('#csvFile').inputValue());assert.ok(await p.locator('#editDialog').isVisible());
  p.once('dialog',d=>d.accept());await p.locator('#cancelDialog').click();assert.equal(await unloadSignal(),false);assert.deepEqual(await read(),provenRestored,'Discarded drafts never modify portfolio');
  await p.goto(base);await nav('more');await p.locator('#addProvider').click();await p.locator('#providerName').fill('Synthetic saved');await p.locator('#saveDialog').click();await p.waitForFunction(()=>!document.getElementById('editDialog').open);assert.equal(await unloadSignal(),false,'Successful save clears unload protection');
  let cleanWarnings=0;const countClean=async d=>{cleanWarnings++;await d.accept();};p.on('dialog',countClean);await p.reload();p.off('dialog',countClean);assert.equal(cleanWarnings,0);
  console.log(engine+': D clean/dirty/saved provider/wizard/import, native denied reload and focus PASS; Back still pending');
  // E: valid empty versus existing positions with missing evidence, never zero curves.
  await p.evaluate(async base=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base)),{blankModel}=await import(new URL('src/model.js',base));const s=new PortfolioStorage();await s.initialize();const m=blankModel();m.settings.autoRefresh=false;await s.save(m);s.close();},base);
  await p.reload();await nav('history');assert.equal(await p.locator('#historyChart .chart-plot').count(),0);assert.equal(await p.locator('#chartPeriods').isVisible(),false);assert.equal(await p.locator('#historyCalendarDisclosure > summary').isVisible(),true);assert.equal((await p.locator('#historyPage').innerText()).split('Historische Werte noch nicht belegbar').length-1,0);
  await p.locator('#historyChart [data-action="start-wizard"]').click();assert.ok(await p.locator('#wizardDialog').isVisible());await p.keyboard.press('Escape');
  await p.evaluate(async base=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base)),{blankModel,createProvider,createPosition}=await import(new URL('src/model.js',base));const s=new PortfolioStorage();await s.initialize();const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'p',name:'Synthetic'}));m.positions.push(createPosition({providerId:'p',name:'Unproven ETF',symbol:'UNK',kind:'etf',quantity:2,price:100},m));await s.save(m);s.close();},base);
  await p.reload();await nav('history');assert.match(await p.locator('#historyChart').innerText(),/Bestandsnachweise, Tageskurse und EUR-Wechselkurse/);
  for(const [width,height] of [[320,360],[390,844],[768,500],[1440,900]]){await p.setViewportSize({width,height});await scan('empty history '+width);}
  await p.locator('#historyChart [data-action="history-positions"]').click();assert.ok(await p.locator('#positionsPage').isVisible());
  console.log(engine+': E contextual empty/missing-history actions, compact layout/no fake curves/full axe PASS');
  // A runtime read failure must not trap an already-open dirty modal over rescue.
  await nav('more');await p.locator('#addProvider').click();await p.locator('#providerName').fill('Must not overwrite');
  await p.evaluate(async base=>{const {openPortfolioDB}=await import(new URL('src/atomic-storage.js',base));const db=await openPortfolioDB();await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put({schemaVersion:1,revision:99,raw:'{runtime-unreadable',settings:{},deleted:false,updatedAt:'2026-10-25'},'portfolio');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();},base);
  const runtimeOriginal=await read();await p.locator('#saveDialog').click();await p.locator('#downloadRaw').waitFor({state:'attached'});
  assert.ok(await p.locator('#saveDialog').isDisabled());assert.ok(await p.locator('#cancelDialog').isEnabled());
  p.once('dialog',d=>d.accept());await p.locator('#cancelDialog').click();assert.ok(await p.locator('#downloadRaw').isVisible());assert.deepEqual(await read(),runtimeOriginal);assert.equal(await unloadSignal(),false);
  console.log(engine+': A runtime failed save/read retains bytes, blocks writer and preserves modal escape/rescue PASS');
  // Complete independent E/runtime-recovery coverage before the unresolved Back gate.
  // Restore only through the same original-download + explicit UI restore path.
  const runtimeDownload=p.waitForEvent('download');await p.locator('#downloadRaw').click();
  const runtimeSaved=await runtimeDownload;
  assert.equal(JSON.parse(readFileSync(await runtimeSaved.path(),'utf8')).raw,runtimeOriginal.raw);
  p.once('dialog',d=>d.accept());await p.locator('#backupFile').setInputFiles({name:'synthetic-runtime-restore.json',mimeType:'application/json',buffer:Buffer.from(recovery)});
  await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await nav('more');assert.ok(await p.locator('#addProvider').isEnabled());
  // Test accept and reject as independent native traversal cases. Firefox's
  // cancelled session-history traversal cannot reliably be retried by automation.
  const openBackDraft=async()=>{
   const old=p;p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await old.close();
   await p.goto(previousDoc.href);await p.evaluate(()=>{document.body.innerHTML='<button id=previousDocument>Previous synthetic document</button>';});await p.locator('#previousDocument').click();assert.equal(p.url(),previousDoc.href);
   await p.goto(base);await nav('more');await p.locator('#addProvider').click();await p.locator('#providerName').fill('Synthetic back draft');
  };
  await openBackDraft();let backWarnings=0;const rejectBack=async d=>{if(d.type()==='beforeunload'){backWarnings++;await d.dismiss();}else await d.accept();};
  p.on('dialog',rejectBack);const backWarning=p.waitForEvent('dialog',{predicate:d=>d.type()==='beforeunload',timeout:5000});if(engine==='webkit')await p.goBack({timeout:2500}).catch(()=>{});else await p.evaluate(()=>{setTimeout(()=>history.back(),0);});await backWarning;p.off('dialog',rejectBack);
  assert.ok(backWarnings>0,'Actual browser Back warning');assert.equal(await p.locator('#providerName').inputValue(),'Synthetic back draft');
  p.once('dialog',d=>d.accept());await p.keyboard.press('Escape');assert.equal(await unloadSignal(),false);
  await openBackDraft();let acceptedBack=false;
  p.once('dialog',async d=>{assert.equal(d.type(),'beforeunload');acceptedBack=true;await d.accept();});
  await Promise.all([p.waitForURL(previousDoc.href),engine==='webkit'?p.goBack():p.evaluate(()=>{setTimeout(()=>history.back(),0);})]);assert.ok(acceptedBack);assert.equal(p.url(),previousDoc.href,'Confirmed discard can navigate');
  console.log(engine+': D native denied Back retains draft and confirmed discard reaches exact preceding document PASS');
  assert.deepEqual(errors,[]);
 }finally{await ctx.close();await browser.close();}
}
