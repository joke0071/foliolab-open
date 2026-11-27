import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {replayVerifiedFixtureAssets,verifiedFixtureRelease} from './verified-fx-release.mjs';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/';
const proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const published=verifiedFixtureRelease(base);
const key='foliolab-open-install-hint-dismissed-v1';
mkdirSync('artifacts/gates/navigation-installation',{recursive:true});
// A queued details toggle can replace a resolved Playwright element before its
// evaluation. Query and measure the current target in the same browser task.
function measureCsvImportTarget(){
 const e=document.querySelector('.position-csv-import');
 if(!e){window.__folioNavCsvHeightFailure={viewport:{width:innerWidth,height:innerHeight,scrollY},target:null,ancestors:[],matches:[],capturedAt:performance.now()};return false;}
 const rect=e.getBoundingClientRect();
 const measured={viewport:{width:innerWidth,height:innerHeight,scrollY},target:{html:e.outerHTML,connected:e.isConnected,rect:rect.toJSON()},ancestors:[],capturedAt:performance.now()};
 const describe=node=>{const r=node.getBoundingClientRect(),style=getComputedStyle(node);return {tag:node.tagName,id:node.id,className:node.className,hidden:node.hidden,open:node.open??null,rect:r.toJSON(),display:style.display,visibility:style.visibility,minHeight:style.minHeight,height:style.height,width:style.width,boxSizing:style.boxSizing,padding:style.padding,border:style.border,lineHeight:style.lineHeight,fontSize:style.fontSize,flex:style.flex,zoom:style.zoom,transition:style.transition,animation:style.animation,transform:style.transform};};
 measured.target={...measured.target,...describe(e)};
 for(let parent=e.parentElement;parent;parent=parent.parentElement)measured.ancestors.push(describe(parent));
 measured.matches=[...document.querySelectorAll('.position-csv-import')].map(describe);
 measured.outerViewport={width:outerWidth,height:outerHeight,dpr:devicePixelRatio,visual:visualViewport?{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale}:null};
 window.__folioNavCsvHeightFailure=measured;
 return e.isConnected&&rect.width>0&&rect.height>=44&&measured.target.visibility==='visible';
}
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const contexts=[],checks=[],fixtureReuses=[];let csvMeasurementLifecycle=null,csvMeasurementControls=null,csvMeasurementControlObservations=null;
 const fresh=async(blocked='none',standalone=false)=>{
  // The complete first installation scenario uses live responses in this engine.
  // Additional worker-blocked UI fixtures can reuse only audited static bytes.
  const replay=contexts.length>0&&published;
  const c=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',ignoreHTTPSErrors:Boolean(proxy)});contexts.push(c);
  if(replay)fixtureReuses.push(await replayVerifiedFixtureAssets(c,base,published));
  await c.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
  await c.addInitScript(({key,blocked,standalone})=>{
   const originalMedia=window.matchMedia.bind(window),listeners=new Set();let installed=standalone;
   const media={media:'(display-mode: standalone)',get matches(){return installed;},addEventListener(type,f){if(type==='change')listeners.add(f);},removeEventListener(type,f){if(type==='change')listeners.delete(f);}};
   window.matchMedia=query=>query===media.media?media:originalMedia(query);
   window.__setSyntheticStandalone=value=>{installed=value;for(const f of listeners)f({matches:value,media:media.media});};
   // Fault only this display preference; portfolio persistence remains real.
   const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
   const fail=s=>blocked==='both'||(blocked==='local'&&s===localStorage);
   Storage.prototype.getItem=function(k){if(k===key&&fail(this))throw new DOMException('Synthetic preference read','SecurityError');return get.call(this,k);};
   Storage.prototype.setItem=function(k,v){if(k===key&&fail(this))throw new DOMException('Synthetic preference write','QuotaExceededError');return set.call(this,k,v);};
  },{key,blocked,standalone});
  const p=await c.newPage();await p.goto(base);await ready(p);return p;
 };
 const ready=p=>p.waitForFunction(()=>document.getElementById('appStartup').hidden&&document.getElementById('portfolioStorageState').textContent.includes('IndexedDB aktiv'));
 const record=p=>p.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}});
 const nav=async(p,page)=>p.locator((await p.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav')+' [data-page="'+page+'"]').click();
 const prompt=(p,outcome='dismissed')=>p.evaluate(outcome=>{
  const e=new Event('beforeinstallprompt',{cancelable:true});window.__installCalls=0;
  e.prompt=async()=>{window.__installCalls++;if(outcome==='error')throw Error('Synthetic prompt error');};
  e.userChoice=outcome==='pending'?new Promise(r=>window.__installResolve=r):Promise.resolve({outcome});
  window.dispatchEvent(e);return e.defaultPrevented;
 },outcome);
 const scan=async p=>{
  const violations=await p.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations);
  if(violations.length){writeFileSync(`artifacts/gates/navigation-installation/${engine}-a11y-failure.json`,JSON.stringify({engine,result:'FAIL',violations},null,2));await p.screenshot({path:`artifacts/gates/navigation-installation/${engine}-a11y-failure.png`});console.error('NAVIGATION_A11Y_FAILURE',JSON.stringify(violations));}
  assert.deepEqual(violations.map(v=>v.id),[]);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 };
 try{
  const p=await fresh(),before=await record(p);
  assert.equal(await p.locator('#sidebarInstallHint').isVisible(),false,'no sidebar offer without a direct prompt');
  await nav(p,'more');assert.equal(await p.locator('#installButton').isVisible(),false,'no icon without a browser installation offer');
  assert.equal(await prompt(p),true);await p.locator('#sidebarInstallHint').waitFor({state:'visible'});await scan(p);await p.screenshot({path:`artifacts/gates/navigation-installation/${engine}-desktop-install-hint.png`});
  await p.setViewportSize({width:1440,height:360});
  // A resize command acknowledgement is not the native viewport/focus-scroll result.
  // Wait on the actual viewport and native focused-target geometry; never force scrolling.
  await p.waitForFunction(()=>innerWidth===1440&&innerHeight===360,null,{timeout:5000});
  await p.locator('#dismissInstallHint').focus();
  try{await p.waitForFunction(()=>{const e=document.getElementById('dismissInstallHint'),r=e.getBoundingClientRect();return document.activeElement===e&&r.top>=0&&r.bottom<=innerHeight;},null,{timeout:5000});}
  catch(error){
   const geometry=await p.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight,scrollY},active:document.activeElement?.id,elements:Object.fromEntries(['.sidebar','.sidebar-footer','#sidebarNav','#sidebarInstallHint','#dismissInstallHint'].map(selector=>{const e=document.querySelector(selector),r=e.getBoundingClientRect();return[selector,{top:r.top,bottom:r.bottom,height:r.height,scrollTop:e.scrollTop,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}];}))}));
   writeFileSync(`artifacts/gates/navigation-installation/${engine}-short-sidebar-failure.json`,JSON.stringify({engine,result:'FAIL',geometry},null,2));
   await p.screenshot({path:`artifacts/gates/navigation-installation/${engine}-short-sidebar-failure.png`});throw error;
  }
  assert.ok(await p.locator('#dismissInstallHint').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'short desktop sidebar scrolls the focused dismissal action into view');
  await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.dataset.installLocation),'sidebar');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'dismissInstallHint');assert.ok(await p.locator('#dismissInstallHint').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'native keyboard focus also remains completely visible in the short sidebar');
  await p.setViewportSize({width:1440,height:300});await p.waitForFunction(()=>{const e=document.getElementById('dismissInstallHint'),r=e.getBoundingClientRect();return innerHeight===300&&document.activeElement===e&&r.top>=0&&r.bottom<=innerHeight;},null,{timeout:5000});await scan(p);await p.setViewportSize({width:1440,height:900});
  await p.locator('#dismissInstallHint').click();assert.equal(await p.locator('#sidebarInstallHint').isVisible(),false);assert.equal(await p.evaluate(()=>document.activeElement.dataset.page),'more','dismissal leaves a visible keyboard target');
  for(const page of ['dashboard','positions','more'])await nav(p,page);
  assert.equal(await p.locator('#sidebarInstallHint').isVisible(),false);await p.reload();await ready(p);await prompt(p);assert.equal(await p.locator('#sidebarInstallHint').isVisible(),false,'persistent dismissal survives reload');
  await nav(p,'more');await p.locator('#installButton').click();assert.equal(await p.evaluate(()=>window.__installCalls),1,'dismissal of hint leaves the More action available');
  for(const outcome of ['accepted','error','pending']){
   await prompt(p,outcome);await p.locator('#installButton').click();
   if(outcome==='pending'){
    assert.equal(await p.locator('#installButton').isDisabled(),true);await p.locator('#installButton').evaluate(e=>e.click());assert.equal(await p.evaluate(()=>window.__installCalls),1,'pending prompt cannot be consumed twice');await p.evaluate(()=>window.__installResolve({outcome:'dismissed'}));
   }
   await p.waitForFunction(()=>!document.getElementById('installButton').disabled);
   assert.equal(await p.evaluate(()=>window.__installCalls),1);assert.equal(await p.locator('#installButton').isVisible(),false,'consumed prompt disappears until the browser offers another');
  }
  await prompt(p);await p.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));assert.equal(await p.locator('#installButton').isVisible(),false);assert.equal(await p.locator('#sidebarInstallHint').isVisible(),false);assert.deepEqual(await record(p),before);
  checks.push('late prompt; dismissal/navigation/reload; accepted/dismissed/error/pending; single consumption; delivered appinstalled handler with synthetic event; exact IDB record unchanged');
  for(const blocked of ['local','both']){
   const q=await fresh(blocked),stored=await record(q);await prompt(q);await q.locator('#dismissInstallHint').click();await nav(q,'more');await prompt(q);assert.equal(await q.locator('#sidebarInstallHint').isVisible(),false,'blocked preference writes retain memory');
   if(blocked==='local'){await q.reload();await ready(q);await prompt(q);assert.equal(await q.locator('#sidebarInstallHint').isVisible(),false,'session fallback survives reload');}
   assert.deepEqual(await record(q),stored);
  }
  checks.push('local preference storage failure/session fallback and both stores failing/memory; portfolio bytes unchanged');
  const standalone=await fresh('none',true),standaloneBefore=await record(standalone);await nav(standalone,'more');await prompt(standalone);assert.equal(await standalone.locator('#installButton').isVisible(),false);assert.equal(await standalone.locator('#sidebarInstallHint').isVisible(),false);
  await standalone.evaluate(()=>window.__setSyntheticStandalone(false));await standalone.locator('#sidebarInstallHint').waitFor({state:'visible'});await standalone.locator('#installButton').focus();await standalone.evaluate(()=>window.__setSyntheticStandalone(true));assert.equal(await standalone.locator('#installButton').isVisible(),false);assert.equal(await standalone.evaluate(()=>document.activeElement.dataset.page),'more','hiding an installation control retains visible navigation focus');
  assert.deepEqual(await record(standalone),standaloneBefore);checks.push('synthetic initial standalone and media change hide all offers and restore visible focus; exact IDB record unchanged; no hardware claim');
  const layout=await fresh();
  for(const width of [320,390,430,768,1440]){await layout.setViewportSize({width,height:900});await nav(layout,'dashboard');await scan(layout);assert.ok(await layout.locator('.dashboard-allocation').evaluate(e=>{const legend=e.querySelector('.alloc-legend');return legend.children.length>0||legend.getBoundingClientRect().height<20;}),'empty allocation legend reserves no filler height');}
  await layout.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'nav-p',name:'Synthetic provider with a deliberately long readable name'}));m.accounts.push(createAccount({id:'nav-a',providerId:'nav-p',name:'Synthetic long securities account name',type:'securities'},m));m.positions.push(createPosition({id:'nav-etf',providerId:'nav-p',accountId:'nav-a',name:'Synthetic ETF with a long security name',kind:'etf',quantity:'123456789.123456789',price:'100'},m));
   m.positions.push(createPosition({id:'nav-unknown',providerId:'nav-p',accountId:'nav-a',name:'Synthetic USD with unknown FX',kind:'stock',currency:'USD',quantity:'2',price:'100'},m));
   if(m.positions.at(-1).fxRateExact!=='UNKNOWN'||m.positions.at(-1).fxRate!==null)throw Error('Fixture must preserve UNKNOWN FX');
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  });await layout.reload();await ready(layout);const stored=await record(layout);
  for(const [iteration,width] of [320,390,430,768,1440].entries()){
   await layout.setViewportSize({width,height:900});await nav(layout,'dashboard');
   assert.equal(await layout.locator('#providerOverview').count(),1);assert.equal(await layout.locator('#donut').count(),1);
   assert.ok(await layout.locator('.dashboard-allocation').evaluate(e=>{const content=e.querySelector('.allocation-layout').getBoundingClientRect(),box=e.getBoundingClientRect();return box.bottom-content.bottom<50;}),'allocation has no stretched empty tail');
   if(width===1440){assert.ok(await layout.locator('.dashboard-overview').evaluate(e=>{const history=e.querySelector('.dashboard-history').getBoundingClientRect(),side=e.querySelector('.dashboard-side').getBoundingClientRect();return history.right<=side.left&&Math.abs(history.top-side.top)<2;}));assert.equal(await layout.locator('#sidebarNav button.active').evaluate(e=>getComputedStyle(e).boxShadow),'none');assert.equal(await layout.locator('#sidebarNav button.active span').evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');}
   await layout.locator('#providerOverview details').evaluateAll(es=>es.forEach(e=>e.open=true));
   assert.deepEqual((await layout.locator('[data-position-id=nav-unknown]>summary').innerText()).split(/\n+/).map(line=>line.trim()).filter(Boolean),['Synthetic USD with unknown FX','Nicht bewertet','–'],'compact summary retains unknown valuation and explicitly unavailable allocation');
   const sourceMenus=layout.locator('[data-position-id] .position-period-more');
   await layout.locator('[data-position-id=nav-etf] .position-period-more').waitFor({state:'attached'});
   await layout.locator('[data-position-id=nav-unknown] .position-period-more').waitFor({state:'attached'});
   await sourceMenus.evaluateAll(elements=>elements.forEach(element=>element.open=true));
   await Promise.all(['nav-etf','nav-unknown'].map(id=>layout.locator('[data-action=import-price-history][data-id='+id+']').waitFor({state:'visible',timeout:5000})));
   assert.ok(await layout.locator('[data-action=import-price-history][data-id=nav-etf]').isVisible());
   if(width===430){
    // Use the real app listener to reproduce the old retained-node failure.
    csvMeasurementLifecycle=await layout.evaluate(()=>{
     const retained=document.querySelector('.position-csv-import');
     const before={connected:retained.isConnected,height:retained.getBoundingClientRect().height};
     document.querySelector('details[data-position-id="nav-etf"]').dispatchEvent(new Event('toggle'));
     const current=document.querySelector('.position-csv-import');
     return {before,retainedAfterRender:{connected:retained.isConnected,height:retained.getBoundingClientRect().height},currentAfterRender:{connected:current.isConnected,open:current.closest('details').open,height:current.getBoundingClientRect().height}};
    });
    assert.deepEqual(csvMeasurementLifecycle,{before:{connected:true,height:44},retainedAfterRender:{connected:false,height:0},currentAfterRender:{connected:true,open:true,height:44}});
   }
   // Keep the >=44 threshold and full diagnostics, without polling or retries.
   try{
    assert.ok(await layout.evaluate(measureCsvImportTarget));
    const measured=await layout.evaluate(()=>window.__folioNavCsvHeightFailure??null);
    writeFileSync(`artifacts/gates/navigation-installation/${engine}-csv-height-${iteration}-${width}.json`,JSON.stringify({engine,iteration,width,result:'PASS',measured},null,2));
   }catch(error){
    const measured=await layout.evaluate(()=>window.__folioNavCsvHeightFailure??null);
    writeFileSync(`artifacts/gates/navigation-installation/${engine}-csv-height-failure.json`,JSON.stringify({engine,width,result:'FAIL',error:String(error),measured},null,2));
    await layout.screenshot({path:`artifacts/gates/navigation-installation/${engine}-csv-height-failure.png`,fullPage:true});throw error;
   }
   await sourceMenus.evaluateAll(elements=>elements.forEach(element=>element.open=false));
   if(width<=430){
    assert.ok(await layout.locator('#providerOverview>.provider-accordion').first().evaluate(root=>{const row=root.querySelector(':scope>.provider-row'),name=row.querySelector('.provider-l>div');return name.getBoundingClientRect().width>=row.getBoundingClientRect().width*.55;}),'narrow provider name retains readable width beside the separate value row');
    assert.ok(await layout.locator('.provider-account-head').first().evaluate(head=>head.querySelector(':scope>div').getBoundingClientRect().width>=head.getBoundingClientRect().width*.8),'narrow account name retains a full row above value and positions action');
   }
   await scan(layout);await layout.screenshot({path:`artifacts/gates/navigation-installation/${engine}-${width}.png`});assert.deepEqual(await record(layout),stored,'disclosures/layout preserve exact portfolio record');
  }
  checks.push('five widths; long provider/account/position names and large amounts; graph/allocation/accounts arrangement; compact disclosures/CSV retained; axe/overflow; exact IDB record unchanged');
  for(const width of [980,1180]){
   await layout.setViewportSize({width,height:900});await nav(layout,'dashboard');
   assert.ok(await layout.locator('.dashboard-overview').evaluate((root,width)=>{const history=root.querySelector('.dashboard-history').getBoundingClientRect(),side=root.querySelector('.dashboard-side').getBoundingClientRect(),allocation=root.querySelector('.dashboard-allocation').getBoundingClientRect(),providers=root.querySelector('.dashboard-providers').getBoundingClientRect();return width===980?history.bottom<=side.top&&allocation.bottom<=providers.top:history.right<=side.left&&Math.abs(history.top-side.top)<2&&allocation.bottom<=providers.top;},width),'natural card arrangement at each new grid breakpoint');await scan(layout);assert.deepEqual(await record(layout),stored);
  }
  checks.push('980/1180 grid breakpoint edges; natural card alignment; no overflow or portfolio writes');
  // Isolated DOM controls use the very same measurement function. No app data
  // or asynchronous detail renderer can replace these deliberately faulty nodes.
  const negativeContext=await browser.newContext();contexts.push(negativeContext);const negative=await negativeContext.newPage();
  const targetStyle='height:44px;min-height:44px;width:200px;box-sizing:border-box;';
  await negative.setContent('<button class="position-csv-import" style="'+targetStyle+'">Synthetic CSV control</button>');
  assert.equal(await negative.evaluate(measureCsvImportTarget),true,'a real visible 44px target remains valid');
  csvMeasurementControls={};csvMeasurementControlObservations={};
  for(const [name,style]of [['height43Accepted','height:43px;min-height:0;width:200px;box-sizing:border-box;'],['displayNoneAccepted',targetStyle+'display:none;'],['visibilityHiddenAccepted',targetStyle+'visibility:hidden;']]){
   await negative.locator('.position-csv-import').evaluate((e,style)=>e.style.cssText=style,style);
   csvMeasurementControls[name]=await negative.evaluate(measureCsvImportTarget);assert.equal(csvMeasurementControls[name],false,name);
   const observed=await negative.evaluate(()=>window.__folioNavCsvHeightFailure.target);
   csvMeasurementControlObservations[name]={connected:observed.connected,height:observed.rect.height,display:observed.display,visibility:observed.visibility};
   assert.equal(observed.connected,true,name+' remains a real connected target');
   if(name==='height43Accepted'){assert.equal(observed.rect.height,43);assert.equal(observed.visibility,'visible');}
   if(name==='displayNoneAccepted'){assert.equal(observed.rect.height,0);assert.equal(observed.display,'none');}
   if(name==='visibilityHiddenAccepted'){assert.equal(observed.rect.height,44);assert.equal(observed.visibility,'hidden');}
  }
  await negative.locator('.position-csv-import').evaluate(e=>e.remove());
  csvMeasurementControls.missingAccepted=await negative.evaluate(measureCsvImportTarget);assert.equal(csvMeasurementControls.missingAccepted,false);
  assert.equal(await negative.evaluate(()=>window.__folioNavCsvHeightFailure.target),null,'missing target replaces prior diagnostic data');
  assert.deepEqual(await record(layout),stored,'measurement fault controls preserve the exact app IDB record');
  checks.push('current-DOM CSV measurement after real detail renewal; stale reference0/current44; real43px,display:none,visibility:hidden,missing controls rejected; no wait/retry/threshold relaxation');
  await layout.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{createProvider,createAccount,createPosition}=await import('/src/model.js');const s=new PortfolioStorage();const m=await s.initialize();
   for(let i=1;i<=11;i++){const providerId='nav-large-p'+i,accountId='nav-large-a'+i;m.providers.push(createProvider({id:providerId,name:'Synthetic large-list provider '+i}));m.accounts.push(createAccount({id:accountId,providerId,name:'Synthetic large-list account '+i,type:'securities'},m));for(let j=0;j<8;j++)m.positions.push(createPosition({id:'nav-large-'+i+'-'+j,providerId,accountId,name:'Synthetic readable holding '+i+' / '+j,kind:'etf',currency:'EUR',quantity:'1.23456789',price:'100'},m));}
   await s.save(m);s.close();
  });await layout.reload();await ready(layout);await nav(layout,'dashboard');const large=await record(layout);
  assert.equal(await layout.locator('#providerOverview>.provider-accordion').count(),12);assert.equal(await layout.locator('#providerOverview [data-position-id]').count(),90,'large list retains every position');
  await layout.setViewportSize({width:320,height:740});const last=layout.locator('#providerOverview>.provider-accordion').last();await last.locator(':scope>summary').click();await last.locator('[data-position-id=nav-large-11-7]>summary').click();await last.locator('[data-position-id=nav-large-11-7] .position-period-more>summary').click();const lastCsv=last.locator('[data-action=import-price-history][data-id=nav-large-11-7]');await lastCsv.waitFor({state:'visible',timeout:5000});assert.ok(await lastCsv.isVisible());await scan(layout);
  await layout.locator('#dashboardPage').evaluate(root=>{const sizes=[...root.querySelectorAll('*')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const[e,size]of sizes)e.style.fontSize=size*1.5+'px';});await scan(layout);assert.ok(await layout.locator('.donut-inner').evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1),'large amount remains inside the scaled donut centre');assert.deepEqual(await record(layout),large,'large list, actual disclosures and synthetic text scale preserve canonical record');
  checks.push('12 providers/90 positions retained; last provider/position reachable; native summary clicks; 320px synthetic 150% text; exact IDB record unchanged');
  if(published){
   const replayed=fixtureReuses.map(count=>count());
   assert.ok(replayed.length>0&&replayed.every(count=>count>0));
   const directContexts=contexts.length-replayed.length;
   console.log('Navigation fixture transport '+JSON.stringify({engine,sha:published.sha,verifiedFiles:published.count,directContexts,replayed}));
  }
  writeFileSync(`artifacts/gates/navigation-installation/${engine}.json`,JSON.stringify({engine,result:'PASS',widths:[320,390,430,768,1440],breakpoints:[980,1180],checks,csvMeasurementLifecycle,csvMeasurementControls,csvMeasurementControlObservations,syntheticInstallEvents:true,physicalAndroid:false,realInstallation:false},null,2));
 }finally{await Promise.all(contexts.map(c=>c.close()));await browser.close();}
}
