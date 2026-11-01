import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
/** Runs against the delivered modules in the existing isolated synthetic profile.
 * Shared by the required UI gate on localhost and the actual production URL. */
export async function structuredQualityBrowserContract({p,nav,record,scan,engine,scans}){
 await p.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'quality-provider',name:'SYNTHETIC Quality Provider'}));m.accounts.push(createAccount({id:'quality-account',providerId:'quality-provider',name:'SYNTHETIC Quality Account',type:'securities'},m));
  const today=new Date().toISOString().slice(0,10),stale=new Date(Date.now()-30*864e5).toISOString().slice(0,10);
  for(const values of [
   {id:'quality-cash',name:'SYNTHETIC Large Cash',kind:'cash',quantity:12345678900,price:1},
   {id:'quality-missing',name:'SYNTHETIC Missing Archived',kind:'etf',price:0,archived:true},
   {id:'quality-stale',name:'SYNTHETIC Stale',kind:'etf',quoteAsOf:stale},
   {id:'quality-derived',name:'SYNTHETIC Derived',kind:'etf',priceStatus:'Aus Stichtag abgeleitet'},
   {id:'quality-source',name:'SYNTHETIC Source Only',kind:'crypto',coinId:'ethereum',quoteAsOf:today}
  ])m.positions.push(createPosition({providerId:'quality-provider',accountId:'quality-account',quantity:1,price:10,...values},m));
  const store=new PortfolioStorage();await store.initialize();await store.save(m);store.close();
 });
 await p.reload();await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 await nav('positions');await p.locator('#positionSearch').fill('SYNTHETIC unmatched search');await p.locator('#positionSort').selectOption('name');await p.locator('#positionArchiveFilter').selectOption('active');
 const before=await record();
 for(const width of [320,360,390,412,430,1440]){
  await p.setViewportSize({width,height:900});await nav('dashboard');
  const toggle=p.locator('#heroReviewToggle');assert.match(await toggle.innerText(),/3 Positionen prüfen/);assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  assert.ok(await p.locator('#totalValue').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const card=el.closest('.hero').getBoundingClientRect();return [...range.getClientRects()].every(r=>r.left>=card.left&&r.right<=card.right&&r.top>=card.top&&r.bottom<=card.bottom);}),'entire large hero amount fits');
  await toggle.focus();await p.keyboard.press('Enter');assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.ok(await p.locator('#dashboardPage').isVisible(),'disclosure does not navigate');
  await p.locator('[data-action=open-quality-review]').click();assert.ok(await p.locator('#qualityReviewPanel').isVisible());assert.equal(await p.locator('#qualityReviewHeading').evaluate(el=>el===document.activeElement),true);
  assert.equal(await p.locator('.quality-review-card').count(),4,'three valuation issues and one additional provenance issue');assert.ok(await p.locator('[data-review-position=quality-missing]').isVisible(),'archived warning is included independently of normal view');
  assert.match(await p.locator('#qualityReviewSummary').innerText(),/Aktuelle Bewertung: 3 Positionen/);assert.equal(await p.locator('#positionSearch').inputValue(),'SYNTHETIC unmatched search');assert.equal(await p.locator('#positionSort').inputValue(),'name');assert.equal(await p.locator('#positionArchiveFilter').inputValue(),'active');
  assert.equal(await p.locator('#positionList .holding-expand[open]').count(),0);await scan('dedicated quality review '+width);scans.push({page:'structured-quality',width,height:900});
  await mkdir('artifacts/gates/structured-quality',{recursive:true});await p.screenshot({path:'artifacts/gates/structured-quality/'+engine+'-'+width+'.png',fullPage:true});
  await p.locator('[data-action=close-quality-review]').click();assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'false');
 }
 assert.deepEqual(await record(),before,'all disclosure/review/return/filters are read-only');
 await p.locator('#heroReviewToggle').click();await p.locator('[data-action=open-quality-review]').click();
 await p.context().setOffline(true);await nav('positions');await p.locator('[data-filter=__review]').click();assert.ok(await p.locator('[data-action=refresh-quality-sources]').isDisabled(),'offline source action is disabled');await p.context().setOffline(false);
 assert.deepEqual(await record(),before,'offline navigation does not write');
 await p.locator('[data-review-position=quality-missing] [data-action=edit-position]').click();await p.locator('#dialogFields [name=price]').fill('42');
 // Native close queues its close event after hiding the dialog. Focus restoration
 // belongs to that event; wait for it, then retain the exact focus assertion below.
 await p.evaluate(()=>{window.__qualityEditorClosed=false;document.getElementById('editDialog').addEventListener('close',()=>{window.__qualityEditorClosed=true;},{once:true});});
 await p.locator('#saveDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});
 await p.waitForFunction(()=>window.__qualityEditorClosed===true,null,{timeout:5000});
 assert.match(await p.locator('#qualityReviewProgress').innerText(),/1 von 3 Positionen/);assert.match(await p.locator('#qualityReviewSummary').innerText(),/Aktuelle Bewertung: 2 Positionen/);assert.equal(await p.locator('.quality-review-card').count(),4,'manual price does not invent source confirmation');
 assert.equal(await p.evaluate(()=>document.activeElement.dataset.id),'quality-missing','focus returns to the matching refreshed card');
 const after=await record(),old=JSON.parse(before.raw),updated=JSON.parse(after.raw);assert.equal(after.revision,before.revision+1);assert.equal(updated.positions.find(x=>x.id==='quality-missing').priceExact,'42');assert.ok(!updated.positions.find(x=>x.id==='quality-missing').quoteQuality);
 assert.deepEqual(updated.positions.filter(x=>x.id!=='quality-missing'),old.positions.filter(x=>x.id!=='quality-missing'));for(const key of ['journalEntries','bookings','externalCashFlows','openingPositions'])assert.deepEqual(updated[key],old[key],'existing editor preserves '+key);
 console.log(engine+': actual delivered quality review,6 widths/Axe/archived/source scopes/focus/offline/no writes; explicit editor correction/progress/one revision PASS');
}
