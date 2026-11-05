/** Large synthetic pair selection through the real existing import/IDB UI. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {fixture} from './flatex-net-fixture.mjs';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {waitForAppServiceWorker,browserGateDeadline} from './browser-gate-deadline.mjs';
const finish=browserGateDeadline('flatex-net-selection'),base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/';
const dir='artifacts/gates/flatex-net-selection',report={scope:'41 synthetic pairs plus one unmatched depot row; explicit selection only, existing financial core',engines:[]};mkdirSync(dir,{recursive:true});
const f=fixture();f.model.settings.autoRefresh=false;Object.assign(f.model.positions.find(p=>p.id==='cash'),{quantity:10000,quantityExact:'10000'});
const depots=[],cash=[];
for(let i=0;i<41;i++){
 const detail='ORDER Kauf IE00SYNTH001 '+(1000+i);
 depots.push({5:'2',9:'10',7:detail,8:'SYN-SELECT-DEPOT-'+i});
 cash.push({6:'-21,75',4:detail,5:'SYN-SELECT-CASH-'+i});
}
depots.push({5:'2',9:'10',7:'ORDER Kauf IE00SYNTH001 9999',8:'SYN-SELECT-UNMATCHED'});
const texts=[nativeFlatexCSV('depot',depots),nativeFlatexCSV('account',cash)];
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:900}});await context.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const disclose=async id=>{if(!await page.locator('#'+id).evaluate(e=>e.open))await page.locator('#'+id+'>summary').click();};
 const open=async(mode='net')=>{
  await page.locator('#mobileNav [data-page=bookings]:visible,#sidebarNav [data-page=bookings]:visible').click();await page.locator('#openCSVImport').click();await page.locator('#csvSource').selectOption('flatex-native');
  for(const [i,id]of [[0,'csvFlatexDepot'],[1,'csvFlatexAccount']])await page.locator('#'+id).setInputFiles({name:'synthetic-selection-'+i+'.csv',mimeType:'text/csv',buffer:Buffer.from(texts[i])});
  await disclose('flatexNativeBindings');for(const [i,id]of [[0,'d'],[1,'c']]){await page.locator('#flatexBindingAccount-'+i).selectOption(id);await page.waitForFunction(i=>!document.getElementById('flatexBindingConfirm-'+i).disabled,i);await page.locator('#flatexBindingConfirm-'+i).check();}
  await disclose('flatexNativeSimulation');await page.locator('#flatexSimulationMode').selectOption(mode);
 };
 const simulate=async()=>{await page.locator('#flatexSimulationRun').click();await page.locator('#flatexNativeBackup').waitFor();};
 const approve=async()=>{const dl=page.waitForEvent('download');await page.locator('#flatexNativeBackup').click();await dl;await page.locator('#flatexNativeAccept').check();};
 const commit=async()=>{await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});};
 try{
  await page.goto(base);await ready();await waitForAppServiceWorker(page);await page.evaluate(async model=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(model);s.close();},f.model);await page.reload();await ready();const before=await read();await open();
  assert.equal(await page.locator('[data-flatex-net]').count(),20);assert.match(await page.locator('#flatexNetSelectionStatus').innerText(),/0 von 41/);
  await page.locator('#flatexNetSelectAll').click();assert.match(await page.locator('#flatexNetSelectionStatus').innerText(),/41 von 41/);assert.equal(await page.locator('[data-flatex-net]:checked').count(),20);assert.equal(await page.evaluate(()=>document.activeElement.id),'flatexNetSelectAll');assert.deepEqual(await read(),before);
  await page.locator('#flatexNetMore').click();assert.equal(await page.locator('[data-flatex-net]:checked').count(),40);await page.locator('#flatexNetSelectNone').click();assert.match(await page.locator('#flatexNetSelectionStatus').innerText(),/0 von 41/);assert.equal(await page.locator('[data-flatex-net]:checked').count(),0);await page.locator('#flatexNetMore').click();assert.equal(await page.locator('[data-flatex-net]').count(),41);assert.equal(await page.locator('[data-flatex-net]:checked').count(),0);
  await page.locator('[data-flatex-net]').first().check();assert.match(await page.locator('#flatexNetSelectionStatus').innerText(),/1 von 41/);await page.locator('#flatexNetSelectAll').click();
  await page.locator('#flatexNetOpeningDate').fill('1999-01-01');await page.locator('#flatexNetOpeningDate').dispatchEvent('change');await page.locator('#flatexNetOpeningConfirmed').check();await simulate();await approve();
  // A selection change must revoke a previously approved whole-batch plan.
  await page.locator('#flatexNetSelectNone').click();assert.equal(await page.locator('#flatexNativeAccept').count(),0);assert.ok(await page.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);assert.equal(await page.evaluate(()=>document.activeElement.id),'flatexNetSelectNone');
  await page.locator('#flatexNetSelectAll').click();await simulate();await approve();
  for(const width of [320,390,430,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.deepEqual(await page.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);}await page.setViewportSize({width:390,height:900});await page.locator('#flatexNetSelectAll').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/'+engine+'-390.png'});
  await commit();const saved=await read(),m=JSON.parse(saved.raw);assert.equal(saved.revision,before.revision+1);assert.equal(m.bookings.length,41);assert.deepEqual(m.positions.map(p=>p.quantityExact),['82','9108.25']);assert.equal(m.externalCashFlows.length,0);assert.ok(m.bookings.every(b=>b.feeEUR===null&&b.taxEUR===null));
  await page.locator('#undoCSVImport').click();await commit();assert.equal((await read()).raw,before.raw);await open();await page.locator('#flatexNetSelectAll').click();await page.locator('#flatexNetOpeningDate').fill('1999-01-01');await page.locator('#flatexNetOpeningDate').dispatchEvent('change');await page.locator('#flatexNetOpeningConfirmed').check();await simulate();await approve();await commit();await page.reload();await ready();
  await open('net-remove');assert.match(await page.locator('#flatexNetSelectionStatus').innerText(),/0 von 41/);await page.locator('#flatexNetSelectAll').click();await simulate();await approve();await commit();const removed=JSON.parse((await read()).raw);assert.equal(removed.bookings.length,0);assert.equal(removed.flatexNetRemovals.length,41);assert.deepEqual(removed.positions.map(p=>p.quantityExact),['0','10000']);
  assert.deepEqual(errors,[]);report.engines.push({engine,version:browser.version(),result:'PASS',checks:['41 pairs selected including offscreen rows; unmatched source not selected','clear all including hidden rows; explicit single selection retained','no mutation before commit; selection revokes backup and consent','one existing CAS commit; independent 82 shares and EUR9108.25; costs unknown','actual Undo/recommit/reload/full-group withdrawal,41 tombstones','five widths/Axe/focus']});console.log(engine+': LARGE NET SELECTION PASS');
 }finally{await context.close();await browser.close();}
}
report.result='PASS';writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));finish();

await import('./browser-shared-import.mjs');
