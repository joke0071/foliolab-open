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
  const ids=['historyCoverage','performanceDetails','snapshotManager'];
  await nav('history');for(const id of ids)assert.equal(await p.locator('#'+id).evaluate(e=>e.open),false,'closed default '+id);
  assert.match(await p.locator('#snapshotManager>summary').innerText(),/Historische Referenzwerte/);
  assert.deepEqual(await p.locator('#historyBasis option').evaluateAll(es=>es.map(e=>[e.value,e.textContent])),[['auto','Automatisch – belegte Quellen'],['observed','Erfasste Stichtage'],['partial','Rekonstruierte Positionen']]);
  assert.equal(await p.locator('#historyBasis').inputValue(),'auto');
  assert.deepEqual(await p.locator('#chartPeriods button').allTextContents(),['7 T','1 M','3 M','6 M','1 J','3 J','5 J','Max']);
  for(const width of [320,390,768,1024,1440]){
   await p.setViewportSize({width,height:900});await nav('history');
   assert.ok(await p.locator('#historyBasis').isVisible());
   const control=await p.locator('.history-basis').evaluate(e=>{const r=e.getBoundingClientRect(),s=e.querySelector('select').getBoundingClientRect();return {width:r.width,height:r.height,selectHeight:s.height,right:r.right};});
   assert.ok(control.width<=331&&control.height<=(width<=360?70:60)&&control.selectHeight>=44&&control.right<=width,'compact accessible source control '+JSON.stringify(control));
   const icons=await p.locator('.history-disclosure-icon svg').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return [r.width,r.height,e.getAttribute('stroke-width'),c.color,e.getAttribute('aria-hidden')];}));
   assert.equal(icons.length,3);for(const i of icons){assert.deepEqual(i,icons[0]);assert.deepEqual(i.slice(0,3),[17,17,'1.8']);assert.equal(i[4],'true');}
   for(const id of ids){const summary=p.locator('#'+id+'>summary');await summary.focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#'+id).evaluate(e=>e.open),true);if(id==='snapshotManager')assert.match(await p.locator('#snapshotList').innerText(),/historisch ungeprüft/);await scan();await summary.focus();await p.keyboard.press('Space');assert.equal(await p.locator('#'+id).evaluate(e=>e.open),false);}
   await p.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});await scan();await p.screenshot({path:'artifacts/gates/history-followup/'+engine+'-history-'+width+'.png',fullPage:true});
   for(const basis of ['observed','partial','auto']){await p.locator('#historyBasis').selectOption(basis);assert.ok((await p.locator('#historySourceStatus').innerText()).length);assert.deepEqual(await record(),before,'basis only changes view');}
   await nav('dashboard');const cash=p.locator('#cashTermsOverview');assert.ok(await cash.isVisible());assert.equal(await cash.count(),1);assert.equal(await cash.evaluate(e=>e.open),false);await cash.locator('summary').click();assert.equal(await cash.locator('.cash-term-row').count(),2);await scan();
   for(const open of [false,true]){for(const summary of await p.locator('.provider-accordion>summary').all())if(await summary.evaluate(e=>e.parentElement.open)!==open)await summary.click();const borders=await p.locator('.provider-accordion').evaluateAll(es=>es.map(e=>({outer:getComputedStyle(e).borderBottomWidth,summary:getComputedStyle(e.querySelector('summary')).borderBottomWidth})));assert.equal(borders[0].outer,'1px','intermediate separator retained');assert.equal(borders[1].outer,'0px','no extra end separator before liquidity');if(!open)for(const b of borders)assert.equal(b.summary,'0px','no duplicate closed summary separator');}
   await p.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});await scan();await p.screenshot({path:'artifacts/gates/history-followup/'+engine+'-liquidity-'+width+'.png',fullPage:true});await cash.locator('summary').click();assert.equal(await cash.evaluate(e=>e.open),false);assert.deepEqual(await record(),before,'all disclosures preserve canonical record/revision');
  }
  // Empty provider list and source-only observations keep the original render conditions.
  await p.evaluate(async()=>{const {blankModel,snapshot}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const m=blankModel();m.settings.autoRefresh=false;snapshot(m,'2023-01-01','SYNTHETIC observation only',{manualTotalEUR:'100'});const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();});await p.reload();await ready();const emptyBefore=await record();assert.equal(await p.locator('.provider-accordion,#cashTermsOverview').count(),0);await nav('history');assert.equal(await p.locator('#historyBasis').isVisible(),false);await scan();assert.deepEqual(await record(),emptyBefore);assert.deepEqual(errors,[]);
  console.log(engine+': history follow-up 5 widths, keyboard/axe/icons/basis/provenance/provider separators/liquidity/empty/zero writes PASS');
 }finally{await browser.close();}
}
