import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,snapshot,persist}=await import('/src/model.js');
  const m=blankModel(),pr=createProvider({name:'Sample Broker'});m.providers.push(pr);
  const a=createAccount({name:'Sample Depot',providerId:pr.id},m);m.accounts.push(a);
  const p=createPosition({name:'Synthetic ETF',kind:'etf',symbol:'SYN',isin:'IE0000000001',quantityExact:'0.123456789',price:22,accountId:a.id,providerId:pr.id},m);
  p.quoteSource='EODHD';p.quoteAsOf='2026-10-21';p.updatedAt='2026-10-15T10:00:00Z';
  m.positions.push(p);
  const today=new Date().toISOString().slice(0,10);
  const previous=new Date(Date.now()-864e5).toISOString().slice(0,10);
  snapshot(m,previous,'Alter Portfolio-Wert',{manualTotalEUR:'100.50'});
  snapshot(m,today,'Startnotiz');
  persist(m);
 });
 await page.reload();await page.locator('#mobileNav [data-page="positions"]').click();
 const entry=page.locator('.position-entry').first();
 const summary=await entry.locator('.holding-note').innerText();
 assert.match(summary,/EODHD/);assert.match(summary,/21/);
 assert.doesNotMatch(summary,/15\.10/,'Do not print edit date as another quote date');
 assert.equal(await entry.locator('.holding-facts').isVisible(),false);
 await entry.locator('summary').click();
 assert.equal(await entry.locator('.holding-facts').isVisible(),true);
 const details=await entry.locator('.holding-facts').innerText();
 assert.match(details,/0,123456789/);
 assert.match(details,/IE0000000001/);
 assert.match(details,/Position zuletzt geändert/);
 for(const width of [320,390,430,768,1024,1280,1440]){
  await page.setViewportSize({width,height:850});
  const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
  await page.locator(nav+' [data-page="positions"]').click();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=1,'Holding details overflow at '+width+': '+overflow);
 }
 await page.setViewportSize({width:390,height:850});
 await page.locator('#mobileNav [data-page="history"]').click();
 assert.equal(await page.locator('#snapshotManager').getAttribute('open'),null);
 await page.locator('#snapshotManager>summary').click();
 const list=page.locator('#snapshotList .history-row');
 assert.equal(await list.count(),2);
 assert.equal(await list.locator('[data-action="delete-snapshot"],.row-btn,svg').count(),0,'normal references have no destructive or icon actions');assert.equal(await list.last().locator('[data-action="edit-snapshot"]').innerText(),'Bearbeiten');
 const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).snapshots);
 await page.locator('#manageReferences').click();
 assert.equal(await list.first().locator('[data-action="edit-snapshot"]').count(),0,'observed original is source-protected');
 assert.match(await list.first().innerText(),/Herkunft geschützt/);
 assert.equal(await page.locator('[data-reference-manage=remove]').isDisabled(),true,'dependent references cannot be deleted');
 assert.equal(await list.locator('[data-action="edit-snapshot"]').count(),0,'editing is hidden during management');await page.locator('#manageReferences').click();
 await list.last().locator('[data-action="edit-snapshot"]').click();
 assert.equal(await page.locator('#dialogTitle').innerText(),'Referenzwert bearbeiten');
 await page.locator('#editorForm [name="note"]').fill('Korrigierte Notiz');
 await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
 assert.match(await list.last().innerText(),/Korrigierte Notiz/);
 const afterNote=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).snapshots);
 assert.deepEqual(afterNote.at(-1),original.at(-1),'protected observed per-position original unchanged');
 assert.equal(afterNote[0].source,'manual');assert.equal(afterNote[0].totalEURExact,'100.5');
 await list.last().locator('[data-action="edit-snapshot"]').click();
 await page.locator('#editorForm [name="manualTotalEUR"]').fill('142,75');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
 const corrected=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).snapshots[0]);
 assert.equal(corrected.totalEURExact,'142.75');assert.equal(corrected.valuationStatus,'manual');assert.equal(corrected.byPosition,null);assert.ok(corrected.revisions.length>=2);
 // New archive replaces the superseded direct dependent-snapshot deletion expectation.
 await page.locator('#manageReferences').click();assert.equal(await page.locator('#manageReferences').innerText(),'Fertig');
 await list.last().locator('[data-reference-select]').check();await page.locator('[data-reference-manage=archive]').click();await page.locator('[name=confirmReferenceArchive]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
 assert.equal(await list.count(),1);await page.locator('#referenceArchiveFilter').selectOption('archived');assert.equal(await list.count(),1);assert.match(await list.innerText(),/142,75/);
 await page.locator('#manageReferences').click();await list.locator('[data-reference-select]').check();await page.locator('[data-reference-manage=archive]').click();await page.locator('[name=confirmReferenceArchive]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});await page.locator('#referenceArchiveFilter').selectOption('active');assert.equal(await list.count(),2);
 await page.locator('#mobileNav [data-page="positions"]').click();
 const remaining=page.locator('.position-entry').first();
 assert.equal(await remaining.locator('[data-action="edit-position"]').count(),1);
 assert.equal(await remaining.locator('[data-action="delete-position"]').count(),0,'no permanent destructive row icon');
 await remaining.locator('[data-action="edit-position"]').click();assert.ok(await page.locator('#deletePosition').isVisible(),'the existing permitted individual delete remains reachable through its editor');
 const protectedBefore=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 await page.locator('#deletePosition').click();assert.ok(await page.locator('#saveDialog').isDisabled(),'referenced position uses shared conservative removal guard');await page.locator('#positionPreviewBlocked>details>summary').click();assert.match(await page.locator('#positionPreviewBlocked').innerText(),/Historische Stichtage/);await page.keyboard.press('Escape');await page.locator('#editDialog').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),protectedBefore,'blocked individual preview preserves exact model');
 await page.evaluate(async()=>{const {load,persist,createPosition}=await import('/src/model.js');const m=load(),p=m.positions[0];m.positions.push(createPosition({id:'unreferenced-delete',name:'Synthetic unreferenced',kind:'etf',quantity:1,price:10,accountId:p.accountId,providerId:p.providerId},m));persist(m);});await page.reload();await page.locator('#mobileNav [data-page="positions"]').click();await page.locator('[data-action="edit-position"][data-id="unreferenced-delete"]').click();await page.locator('#deletePosition').click();await page.locator('[name=confirmRemoval]').check();await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
 const finalModel=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(finalModel.positions.length,1);assert.equal(finalModel.positions.some(p=>p.id==='unreferenced-delete'),false);
 assert.equal(finalModel.snapshots.length,2,'Deleting a position does not erase historical dates');
 // The position-list facts are a separate renderer from provider details.
 // Exercise the real canonical missing-price default in this view as well.
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel();m.settings.autoRefresh=false;
  m.providers.push(createProvider({id:'p',name:'Synthetic quote facts'}));
  m.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic depot',type:'securities'},m));
  for(const props of [
   {id:'missing-quote',name:'Missing quote'},
   {id:'zero-quote',name:'Recorded zero',price:0,quoteSource:'Manuell'},
   {id:'unknown-source',name:'Positive quote',price:123.45},
   {id:'exact-quote',name:'Exact quote',price:123.45,priceExact:'123.4567890123456789',quoteSource:'EODHD'}
  ])m.positions.push(createPosition({...props,providerId:'p',accountId:'a',kind:'etf',symbol:'SYN',quantity:1},m));
  persist(m);
 });
 await page.reload();await page.locator('#mobileNav [data-page="positions"]').click();
 const record=()=>page.evaluate(async()=>{
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}
 });
 const beforeFacts=await record();
 const quoteCases=[
  ['missing-quote','Nicht verfügbar','Unbekannt'],
  ['zero-quote','0 EUR','Manuell'],
  ['unknown-source','123,45 EUR','Unbekannt'],
  ['exact-quote','123,4567890123456789 EUR','EODHD']
 ];
 for(const [id,price,source] of quoteCases){
  const row=page.locator('.position-entry').filter({has:page.locator('[data-action="edit-position"][data-id="'+id+'"]')});
  await row.locator('summary').click();
  const fact=label=>row.locator('.holding-facts>div').filter({has:page.getByText(label,{exact:true})}).locator('dd');
  assert.equal(await fact('Kurs je Einheit').innerText(),price,id+' honest quote with original exact precision');
  assert.equal(await fact('Kursquelle').innerText(),source,id+' recorded source only');
 }
 for(const width of [320,390,430,768,1024,1280,1440]){
  await page.setViewportSize({width,height:850});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'quote facts overflow '+width);
  if(width===320)await page.screenshot({path:'artifacts/gates/position-facts-320.png',fullPage:true});
 }
 assert.deepEqual(await record(),beforeFacts,'fact disclosure and viewport changes preserve exact IndexedDB record/settings/revision');
 console.log('POSITION DETAILS: one quote date, full precision, honest missing/zero/unknown-source facts, exact IndexedDB preservation and seven widths PASS');
}finally{await browser.close();}
