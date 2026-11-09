import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
/** Runs against the delivered modules in the existing isolated synthetic profile.
 * Shared by the required UI gate on localhost and the actual production URL. */
export async function structuredQualityBrowserContract({p,nav,record,scan,engine,scans}){
 // UI-R3: the delivered inline entry uses the existing grouped review, at every cardinality.
 const out='artifacts/gates/structured-quality';await mkdir(out,{recursive:true});
 for(const count of [0,1,5]){
  await p.evaluate(async count=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'r3-provider',name:'SYNTHETIC R3 Provider'}));m.accounts.push(createAccount({id:'r3-account',providerId:'r3-provider',name:'SYNTHETIC R3 Account',type:'securities'},m));
   m.positions.push(createPosition({id:'r3-cash',providerId:'r3-provider',accountId:'r3-account',name:'SYNTHETIC Cash',kind:'cash',quantity:100,price:1},m));
   for(let i=0;i<count;i++)m.positions.push(createPosition({id:'r3-'+i,providerId:'r3-provider',accountId:'r3-account',name:'SYNTHETIC Review '+i,kind:'etf',quantity:1,price:0,archived:i===0},m));
   const store=new PortfolioStorage();await store.initialize();await store.save(m);store.close();
  },count);
  await p.reload();await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));await nav('dashboard');
  const untouched=await record(),entry=p.locator('#dashboardReview');
  for(const width of [320,360,390,412,430,768,1440]){
   await p.setViewportSize({width,height:900});await nav('dashboard');
   assert.equal(await p.locator('.dashboard-review-entry').count(),0,'no freestanding container, even when hidden');
   assert.equal(await p.locator('.dashboard-current>#dashboardReview').count(),1,'review belongs directly to current wealth');
   const box=await entry.boundingBox();
   if(!count){assert.equal(box,null,'zero warnings occupy no layout space');assert.ok(await entry.evaluate(el=>el.hidden));}
   else{
    assert.equal((await entry.innerText()).trim(),count+' Position'+(count===1?'':'en')+' prüfen');
    assert.equal(await entry.getAttribute('aria-label'),count+' Position'+(count===1?'':'en')+' prüfen · Prüfbereich öffnen');
    assert.equal(await entry.locator('svg[aria-hidden=true]').count(),2,'warning and navigation icon are decorative');
    assert.ok(box.height>=44&&box.width>=44,'whole row has a sufficient touch target');
    assert.ok(await entry.evaluate(el=>{const b=el.getBoundingClientRect(),v=document.getElementById('totalValue').getBoundingClientRect(),card=el.closest('.panel').getBoundingClientRect();return b.top>=v.bottom&&b.left>=card.left&&b.right<=card.right;}),'entry follows amount and stays within wealth card');
    await p.keyboard.press('Tab');await entry.focus();assert.ok(await entry.evaluate(el=>el.matches(':focus-visible')&&getComputedStyle(el).outlineStyle!=='none'),'visible keyboard focus');
    await p.keyboard.press(width===390?'Space':'Enter');assert.equal(await p.locator('.quality-review-card').count(),count);assert.equal(await p.locator('#qualityReviewKind').inputValue(),'all');assert.equal(await p.locator('#qualityReviewAccount').inputValue(),'');
    assert.ok(await p.locator('#qualityReviewHeading').evaluate(el=>el===document.activeElement));
    await p.locator('[data-action=close-quality-review]').click();assert.ok(await entry.evaluate(el=>el===document.activeElement),'return focuses the integrated entry');
   }
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'responsive inline review layout');
   await scan('UI-R3 review '+count+' / '+width);scans.push({page:'UI-R3-review',count,width,height:900});
   if(width===390||width===1440)await p.screenshot({path:`${out}/${engine}-r3-${count}-${width}.png`,fullPage:true});
  }
  await p.setViewportSize({width:320,height:800});
  await p.evaluate(()=>{const nodes=[...document.querySelectorAll('#dashboardPage, #dashboardPage *')],sizes=nodes.map(el=>parseFloat(getComputedStyle(el).fontSize));nodes.forEach((el,i)=>el.style.fontSize=sizes[i]*2+'px');});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% computed text reflows without horizontal overflow');
  if(count)assert.ok(await entry.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'200% review text remains fully visible');
  assert.ok(await p.locator('#miniChartPeriods').evaluate(el=>[...el.querySelectorAll('button,summary')].filter(n=>n.getBoundingClientRect().width&&n.getBoundingClientRect().height).every(n=>{const b=n.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(n);return [...r.getClientRects()].every(t=>t.width===0||t.left>=b.left-1&&t.right<=b.right+1);})), '200% period labels stay inside their own targets');
  await scan('UI-R3 200% review '+count);await p.screenshot({path:`${out}/${engine}-r3-${count}-200pct.png`,fullPage:true});
  assert.deepEqual(await record(),untouched,'review navigation and visual stress preserve exact portfolio bytes/revision');
 }
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
 for(const width of [320,360,390,412,430,768,1440]){
  await p.setViewportSize({width,height:900});await nav('dashboard');
  const toggle=p.locator('#dashboardReview');assert.match(await toggle.innerText(),/4 Positionen prüfen/);assert.equal(await toggle.getAttribute('aria-expanded'),null);
  assert.ok(await p.locator('#totalValue').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const card=el.closest('.dashboard-metrics').getBoundingClientRect();return [...range.getClientRects()].every(r=>r.left>=card.left&&r.right<=card.right&&r.top>=card.top&&r.bottom<=card.bottom);}),'entire large compact amount fits');
  await toggle.focus();await p.keyboard.press('Enter');assert.ok(await p.locator('#qualityReviewPanel').isVisible());assert.equal(await p.locator('#qualityReviewHeading').evaluate(el=>el===document.activeElement),true);
  assert.equal(await p.locator('.quality-review-card').count(),4,'three valuation issues and one additional provenance issue');assert.ok(await p.locator('[data-review-position=quality-missing]').isVisible(),'archived warning is included independently of normal view');
  assert.match(await p.locator('#qualityReviewSummary').innerText(),/Aktuelle Bewertung: 3 Positionen/);assert.equal(await p.locator('#positionSearch').inputValue(),'SYNTHETIC unmatched search');assert.equal(await p.locator('#positionSort').inputValue(),'name');assert.equal(await p.locator('#positionArchiveFilter').inputValue(),'active');
  assert.equal(await p.locator('#positionList .holding-expand[open]').count(),0);await scan('dedicated quality review '+width);scans.push({page:'structured-quality',width,height:900});
  await mkdir('artifacts/gates/structured-quality',{recursive:true});await p.screenshot({path:'artifacts/gates/structured-quality/'+engine+'-'+width+'.png',fullPage:true});
  await p.locator('[data-action=close-quality-review]').click();assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);assert.equal(await toggle.getAttribute('aria-expanded'),null);
 }
 assert.deepEqual(await record(),before,'all direct review/return/filters are read-only');
 await p.locator('#dashboardReview').click();
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
 console.log(engine+': actual delivered quality review,7 widths/Axe/archived/source scopes/focus/offline/no writes; explicit editor correction/progress/one revision PASS');
}
