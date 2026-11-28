import {returnFromSection} from './browser-disclosures.mjs';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
mkdirSync('artifacts/gates/history-followup',{recursive:true});
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({viewport:{width:390,height:900},ignoreHTTPSErrors:Boolean(proxy)});
 await ctx.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=key=>p.locator('#mobileNav [data-page="'+key+'"]:visible,#sidebarNav [data-page="'+key+'"]:visible').click();
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const scan=async()=>{await p.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});assert.deepEqual(await p.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));};
 try{
  await p.goto(base);await ready();await p.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition,snapshot}=await import('/src/model.js'),{captureOpenings}=await import('/src/transactions.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=false;
   for(const id of ['first','last']){m.providers.push(createProvider({id,name:'Synthetic '+id+' provider'}));m.accounts.push(createAccount({id,providerId:id,name:'Synthetic '+id+' account',type:'cash',cashTerms:{version:1,status:'free',fixedTerm:false,outcome:'unconfirmed'}},m));m.positions.push(createPosition({id,providerId:id,accountId:id,name:'Synthetic '+id+' cash',kind:'cash',quantity:100,price:1},m));}
   captureOpenings(m);for(const o of m.openingPositions)o.asOf='2023-01-01';
   snapshot(m,'2023-01-01','SYNTHETIC historical reference',{manualTotalEUR:'180'});snapshot(m,'2023-01-02','SYNTHETIC manual reference',{manualTotalEUR:'200'});
   m.snapshots[0].valuationStatus='legacy-unverified';
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  });await p.reload();await ready();const before=await record();
  const ids=['historyCoverage','performanceDetails','snapshotManager','portfolioProjection'];
  await nav('history');for(const id of ids)assert.equal(await p.locator('#'+id).evaluate(e=>e.open),id==='historyCoverage','initial visibility '+id);
  assert.match(await p.locator('#snapshotManager>summary').innerText(),/Historische Referenzwerte/);
  assert.deepEqual(await p.locator('#historyBasis option').evaluateAll(es=>es.map(e=>[e.value,e.textContent])),[['auto','Automatisch – belegte Quellen'],['observed','Erfasste Stichtage'],['partial','Rekonstruierte Positionen'],['model','Modellverlauf · heutiger Bestand']]);
  assert.equal(await p.locator('#historyBasis').inputValue(),'auto');
  const historyPeriods=['7 T','1 M','3 M','6 M','1 J','3 J','5 J'];
  const expectedPeriods=width=>[...historyPeriods,...(width<=720?['Kalender']:[]),'Max'];
  assert.deepEqual(await p.locator('#chartPeriods button').allTextContents(),expectedPeriods(390));
  for(const width of [320,390,768,1024,1440]){
   await p.setViewportSize({width,height:900});await nav('history');
   const detailsGroup=p.locator('#historyPage .history-insights');
   assert.deepEqual(await detailsGroup.locator(':scope > details').evaluateAll(nodes=>nodes.map(node=>node.id)),ids.slice(1));
   assert.ok(await p.locator('#historyCoverage').evaluate(el=>el.previousElementSibling?.id==='historyChart'&&el.parentElement.nextElementSibling.matches('.history-insights')),'coverage belongs to the chart before the other analyses');
   assert.ok(await detailsGroup.evaluate(el=>el.classList.contains('section-obscured')&&!el.contains(document.getElementById('historyChart'))),'outline groups the disclosures below the chart');
   assert.deepEqual(await p.locator('#chartPeriods button').allTextContents(),expectedPeriods(width),'history presets and mobile calendar at '+width);
   const more=p.locator('#chartPeriods .period-more>summary');
   assert.equal(await p.locator('#historyBasis').isVisible(),false);
   await more.click();
   assert.ok(await p.locator('#historyBasis').isVisible());
   const control=await p.locator('.history-options-fields .field').first().evaluate(e=>{const r=e.getBoundingClientRect(),s=e.querySelector('select').getBoundingClientRect();return {width:r.width,height:r.height,selectHeight:s.height,right:r.right};});
   assert.ok(control.width<=331&&control.height<=74&&control.selectHeight>=44&&control.right<=width,'compact accessible source control '+JSON.stringify(control));
   await p.keyboard.press('Escape');
   assert.equal(await more.evaluate(e=>e===document.activeElement),true);
   const coverage=p.locator('#historyCoverage>summary');
   await coverage.focus();await p.keyboard.press('Enter');
   const covered=await p.locator('#historyCoverage').evaluate(e=>e.open);
   await coverage.press('Space');assert.notEqual(await p.locator('#historyCoverage').evaluate(e=>e.open),covered);
   for(const id of ids.slice(1)){
    const link=p.locator('[data-section="'+id+'"]');await link.focus();await p.keyboard.press('Enter');
    assert.equal(await p.locator('#'+id).evaluate(e=>e.open),true);
    if(id==='snapshotManager')assert.match(await p.locator('#snapshotList').innerText(),/historisch ungeprüft/);
    await scan();await returnFromSection(p);assert.equal(await p.locator('#'+id).evaluate(e=>e.open),false);
   }
   await p.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});await scan();await p.screenshot({path:'artifacts/gates/history-followup/'+engine+'-history-'+width+'.png',fullPage:true});
   await more.click();
   for(const basis of ['observed','partial','auto']){await p.locator('#historyBasis').selectOption(basis);assert.ok((await p.locator('#historySourceStatus').innerText()).length);assert.deepEqual(await record(),before,'basis only changes view');}
   await nav('dashboard');const cash=p.locator('#cashTermsOverview');assert.ok(await cash.isVisible());assert.equal(await cash.count(),1);assert.equal(await cash.evaluate(e=>e.open),false);await cash.locator('summary').click();assert.equal(await cash.locator('.cash-term-row').count(),2);await scan();
   for(const open of [false,true]){
    for(const summary of await p.locator('.provider-accordion>summary').all()){
     if(await summary.evaluate(e=>e.parentElement.open)!==open)await summary.click();
    }
    const providers=p.locator('.provider-accordion');
    assert.equal(await providers.count(),2);
    assert.ok(await providers.evaluateAll(nodes=>nodes.every(e=>
     getComputedStyle(e).borderBottomWidth==='0px'&&getComputedStyle(e.querySelector('summary')).borderBottomWidth==='0px'
    )), 'both open and closed provider tiles use spacing without rules');
    assert.ok(await providers.nth(1).evaluate(e=>e.getBoundingClientRect().top-e.previousElementSibling.getBoundingClientRect().bottom>=4));
   }
   await p.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});await scan();await p.screenshot({path:'artifacts/gates/history-followup/'+engine+'-liquidity-'+width+'.png',fullPage:true});await cash.locator('summary').click();assert.equal(await cash.evaluate(e=>e.open),false);assert.deepEqual(await record(),before,'all disclosures preserve canonical record/revision');
  }
  // Empty provider list and source-only observations keep the original render conditions.
  await p.evaluate(async()=>{const {blankModel,snapshot}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const m=blankModel();m.settings.autoRefresh=false;snapshot(m,'2023-01-01','SYNTHETIC observation only',{manualTotalEUR:'100'});const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();});await p.reload();await ready();const emptyBefore=await record();assert.equal(await p.locator('.provider-accordion,#cashTermsOverview').count(),0);await nav('history');assert.equal(await p.locator('#historyBasis').isVisible(),false);await scan();assert.deepEqual(await record(),emptyBefore);assert.deepEqual(errors,[]);
  console.log(engine+': history follow-up 5 widths, keyboard/axe/icons/basis/provenance/provider separators/liquidity/empty/zero writes PASS');
 }finally{await browser.close();}
}
