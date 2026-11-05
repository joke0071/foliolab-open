import {contextDocuments,quote as contextQuote} from './flatex-context-fixture.mjs';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
const scoped=process.env.FLATEX_CONTEXT_DIALECTS==='1',artifactDir=scoped?'flatex-context':'flatex-net-settlement';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {fixture,laterDocuments} from './flatex-net-fixture.mjs';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {waitForAppServiceWorker,browserGateDeadline} from './browser-gate-deadline.mjs';
const finish=browserGateDeadline(artifactDir);
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',report={scope:'Synthetic full native EUR pair economics; no private data',engines:[]};
mkdirSync('artifacts/gates/'+artifactDir,{recursive:true});
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:900}});await context.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
 const page=await context.newPage(),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const disclose=async id=>{if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+'>summary').click();};
 const sourceTexts=[nativeFlatexCSV('depot',[{5:'2',9:'10'}]),nativeFlatexCSV('account',[{6:'-21,75'}])];
 const open=async()=>{
  await page.locator('#mobileNav [data-page=bookings]:visible,#sidebarNav [data-page=bookings]:visible').click();await page.locator('#openCSVImport').click();await page.locator('#csvSource').selectOption(scoped?'auto':'flatex-native');
  const texts=scoped?contextDocuments(sourceTexts.map(parseFlatexNativeCSV),{bound:false}).map(d=>[d.columns.map(c=>contextQuote(c.header)).join(';'),...d.rows.map(r=>r.fields.map(contextQuote).join(';'))].join('\n')):sourceTexts;
  if(scoped)await page.locator('#csvFile').setInputFiles(texts.map((text,i)=>({name:'synthetic-context-'+i+'.csv',mimeType:'text/csv',buffer:Buffer.from(text,'latin1')})));
  else{
   await page.locator('#csvFlatexDepot').setInputFiles({name:'synthetic-depot.csv',mimeType:'text/csv',buffer:Buffer.from(texts[0])});
   await page.locator('#csvFlatexAccount').setInputFiles({name:'synthetic-account.csv',mimeType:'text/csv',buffer:Buffer.from(texts[1])});
  }
  await page.locator('#flatexNativeBindings').waitFor();await disclose('flatexNativeBindings');
  if(scoped){
   assert.ok(await page.locator('#flatexBindingAccount-0').isDisabled());
   for(const [i,scope] of [[0,'SYN-DECLARED-DEPOT'],[1,'SYN-DECLARED-CASH']]){await page.locator('#flatexScope-'+i).fill(scope);await page.locator('#flatexScopeConfirm-'+i).check();await page.locator('[data-flatex-scope=\"'+i+'\"]').click();assert.equal(await page.evaluate(()=>document.activeElement?.dataset.flatexScopeEdit),String(i));}
  }
  for(const [i,account]of [[0,'d'],[1,'c']]){await page.locator('#flatexBindingAccount-'+i).selectOption(account);await page.waitForFunction(i=>!document.getElementById('flatexBindingConfirm-'+i).disabled,i);await page.locator('#flatexBindingConfirm-'+i).check();}
  await disclose('flatexNativeSimulation');
 };
 const select=async(mode='net')=>{await page.locator('#flatexSimulationMode').selectOption(mode);await page.locator('[data-flatex-net]').check();if(mode==='net'){await page.locator('#flatexNetOpeningDate').fill('1999-01-01');await page.locator('#flatexNetOpeningDate').dispatchEvent('change');await page.locator('#flatexNetOpeningConfirmed').check();}};
 const simulate=async()=>{await page.locator('#flatexSimulationRun').click();await page.locator('#flatexNativeBackup').waitFor().catch(async error=>{throw Error(error.message+'; '+await page.locator('#flatexSimulationResult').innerText());});};
 const approve=async()=>{const download=page.waitForEvent('download');await page.locator('#flatexNativeBackup').click();const file=await download;const content=JSON.parse(readFileSync(await file.path(),'utf8'));assert.ok(content.positions.length===2);await page.waitForFunction(()=>!document.getElementById('flatexNativeAccept').disabled);await page.locator('#flatexNativeAccept').check();assert.equal(await page.locator('#saveDialog').isDisabled(),false);};
 try{
  // Controlled timeline: a persisted reference after the first trade must stay
  // before the later trade. Real later reference balances remain protected.
  await page.clock.install({time:new Date('1999-01-05T12:00:00Z')});
  await page.goto(base);await ready();await waitForAppServiceWorker(page);const f=fixture();
  await page.evaluate(async model=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');model.settings.autoRefresh=false;const s=new PortfolioStorage();await s.initialize();await s.save(model);s.close();},f.model);await page.reload();await ready();const before=await read();
  context.on('request',r=>{if(new URL(r.url()).origin!==new URL(base).origin&&!r.url().startsWith('blob:'))external.push(r.url());});
  await open();await select();await simulate();
  await page.locator('#editorForm').evaluate(e=>e.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await page.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await read(),before);
  await approve();
  if(scoped){
   assert.ok(await page.locator('#flatexScope-0').isDisabled());
   await page.locator('[data-flatex-scope-edit="0"]').click();assert.equal(await page.locator('#flatexNativeAccept').count(),0);assert.ok(await page.locator('#saveDialog').isDisabled());assert.ok(await page.locator('#flatexBindingAccount-0').isDisabled());assert.deepEqual(await read(),before);assert.equal(await page.evaluate(()=>document.activeElement?.id),'flatexScope-0');
   await page.locator('#cancelDialog').click();await open();await select();await simulate();await approve();
  }
  for(const width of [320,360,390,412,430,768,1440]){
   await page.setViewportSize({width,height:900});assert.ok(await page.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.deepEqual(await page.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);
   await page.screenshot({path:'artifacts/gates/'+artifactDir+'/'+engine+'-'+width+'.png'});
  }
  await page.setViewportSize({width:390,height:900});await page.locator('#flatexNetOpeningConfirmed').uncheck();assert.equal(await page.locator('#flatexNativeAccept').count(),0);assert.ok(await page.locator('#saveDialog').isDisabled());await page.locator('#flatexNetOpeningConfirmed').check();await simulate();await approve();
  await page.evaluate(()=>{window.netPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='records'&&args[1]==='portfolio')throw new DOMException('Synthetic quota','QuotaExceededError');return window.netPut.apply(this,args);};});await page.locator('#saveDialog').click();await page.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await read(),before);assert.equal(await page.locator('#flatexNativeAccept').count(),0);
  await page.evaluate(()=>IDBObjectStore.prototype.put=window.netPut);await simulate();await approve();
  await page.evaluate(()=>{IDBObjectStore.prototype.put=function(...args){const r=window.netPut.apply(this,args);if(this.name==='records'&&args[1]==='portfolio')r.addEventListener('success',()=>this.transaction.abort(),{once:true});return r;};});await page.locator('#saveDialog').click();await page.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await read(),before);await page.evaluate(()=>IDBObjectStore.prototype.put=window.netPut);
  await simulate();await approve();await context.setOffline(true);await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});let changed=await read(),m=JSON.parse(changed.raw);
  assert.equal(changed.revision,before.revision+1);assert.equal(m.bookings.length,1);assert.equal(m.positions.find(p=>p.id==='etf').quantityExact,'2');assert.equal(m.positions.find(p=>p.id==='cash').quantityExact,'78.25');assert.equal(m.externalCashFlows.length,0);assert.equal(m.bookings[0].feeEUR,null);assert.equal(m.bookings[0].taxEUR,null);
  if(scoped){
   await page.locator('#undoCSVImport').click();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
   const undone=await read();assert.equal(undone.raw,before.raw);assert.equal(undone.revision,changed.revision+1);
   await open();await select();await simulate();await approve();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});changed=await read();m=JSON.parse(changed.raw);
  }
  await page.reload();await ready();assert.equal((await read()).raw,changed.raw);
  // Add a later original pair through the same actual UI, without a new opening.
  const initial=changed,initialModel=m,later=laterDocuments(),quote=v=>'"'+v.replaceAll('"','""')+'"';
  for(let i=0;i<2;i++)sourceTexts[i]=[later[i].columns.map(c=>quote(c.header)).join(';'),...later[i].rows.map(r=>r.fields.map(quote).join(';'))].join('\n');
  await open();await select();await page.locator('#flatexNetOpeningConfirmed').uncheck();await simulate();await approve();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
  changed=await read();m=JSON.parse(changed.raw);assert.equal(changed.revision,initial.revision+1);assert.equal(m.bookings.length,2);assert.equal(m.positions.find(p=>p.id==='etf').quantityExact,'3');assert.equal(m.positions.find(p=>p.id==='cash').quantityExact,'66');assert.deepEqual(m.openingPositions,initialModel.openingPositions);assert.deepEqual(m.bookings.find(b=>b.id===initialModel.bookings[0].id),initialModel.bookings[0]);assert.deepEqual(m.journalEntries.find(j=>j.id===initialModel.journalEntries[0].id),initialModel.journalEntries[0]);
  await page.reload();await ready();assert.equal((await read()).raw,changed.raw);
  const restored=await page.evaluate(async raw=>{const {safeImport,backup}=await import('/src/model.js'),{encryptBackup,decryptBackup}=await import('/src/crypto-backup.js');return backup(safeImport(JSON.parse(await decryptBackup(JSON.parse(await encryptBackup(raw,'synthetic-net-password')),'synthetic-net-password'))));},changed.raw);assert.equal(JSON.parse(restored).bookings[0].netSettlement.id,m.bookings[0].netSettlement.id);
  const envelope=await page.evaluate(async raw=>{const {configureBackupPassword,encryptWithBackupPassword}=await import('/src/backup-vault.js');await configureBackupPassword('Synthetic net restore 2026!','Synthetic net restore 2026!');return encryptWithBackupPassword(raw);},changed.raw);
  const restoreContext=await browser.newContext({viewport:{width:390,height:900}}),restorePage=await restoreContext.newPage();
  try{
   restorePage.on('dialog',d=>d.accept(d.type()==='prompt'?'Synthetic net restore 2026!':undefined));await restorePage.goto(base);await restorePage.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   await restorePage.locator('#backupFile').setInputFiles({name:'synthetic-net-v5.json',mimeType:'application/json',buffer:Buffer.from(envelope)});await restorePage.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Backup wiederhergestellt'));
   await waitForAppServiceWorker(restorePage);await restoreContext.setOffline(true);await restorePage.reload();await restorePage.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   const restoredModel=await restorePage.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return JSON.parse((await readPortfolioRecord(db)).raw);}finally{db.close();}});
   assert.deepEqual(restoredModel.bookings,m.bookings);assert.deepEqual(restoredModel.journalEntries,m.journalEntries);assert.deepEqual(restoredModel.positions,m.positions);
  }finally{await restoreContext.close();}
  await open();await select();await page.locator('#flatexSimulationRun').click();await page.locator('#flatexSimulationResult').waitFor();assert.match(await page.locator('#flatexSimulationResult').innerText(),/0 neue Buchungen · 1 bereits vorhanden/);assert.ok(await page.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),changed);
  await page.locator('#flatexSimulationMode').selectOption('net-remove');await simulate();await approve();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
  const removed=await read(),rm=JSON.parse(removed.raw);assert.deepEqual(rm.bookings,initialModel.bookings);assert.equal(rm.positions.find(p=>p.id==='cash').quantityExact,'78.25');assert.equal(rm.positions.find(p=>p.id==='etf').quantityExact,'2');assert.equal(rm.flatexNetRemovals.length,1);await page.reload();await ready();
  await open();await select();await page.locator('#flatexSimulationRun').click();await page.locator('#flatexSimulationResult').waitFor();assert.match(await page.locator('#flatexSimulationResult').innerText(),/Wiederimport gesperrt/);assert.ok(await page.locator('#saveDialog').isDisabled());await page.locator('#cancelDialog').click();
  // Real second-writer CAS at the actual storage boundary, with a fresh model/profile.
  sourceTexts[0]=nativeFlatexCSV('depot',[{5:'2',9:'10'}]);sourceTexts[1]=nativeFlatexCSV('account',[{6:'-21,75'}]);
  await context.setOffline(false);await page.evaluate(async model=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(model);s.close();},f.model);await page.reload();await ready();await open();await select();await simulate();await approve();
  await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),save=PortfolioStorage.prototype.save;PortfolioStorage.prototype.save=function(model){return new Promise((resolve,reject)=>window.releaseNetSave=()=>save.call(this,model).then(resolve,reject));};});await page.locator('#saveDialog').click();await page.waitForFunction(()=>Boolean(window.releaseNetSave));
  const other=await context.newPage();await other.goto(base);await other.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));await other.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.settings.showSmall=!m.settings.showSmall;await s.save(m);s.close();});await other.close();const concurrent=await read();await page.evaluate(()=>window.releaseNetSave());await page.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await read(),concurrent);assert.equal(await page.locator('#flatexNativeAccept').count(),0);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);report.engines.push({engine,version:browser.version(),result:'PASS',checks:['full actual UI net commit/one CAS revision',...(scoped?['per-file explicit scopes/edit invalidation/actual UI Undo/recommit/cp1252 automatic upload']:[]),'later pair commit without replacing existing opening or booking/journal; exact 3 shares/cash66','exact gross/net/unresolved posting; unknown costs/no external flows','seven widths/Axe','backup/confirmation reset/forced submit','quota/post-put abort exact no mutation','offline reload/actual fresh-profile v2-encrypted v5 UI restore/replay','persistent later-group withdrawal preserves first group/reimport tombstone','real second writer CAS at storage boundary']});console.log(engine+': NATIVE FLATEX NET ECONOMICS PASS');
 }finally{await context.close();await browser.close();}
}
report.result='PASS';writeFileSync('artifacts/gates/'+artifactDir+'/report.json',JSON.stringify(report,null,2));finish();

if(!scoped){await import('./browser-flatex-net-augmentation.mjs');await import('./browser-flatex-context.mjs');await import('./browser-flatex-net-backfill.mjs');}
