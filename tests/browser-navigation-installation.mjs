import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/';
const proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const key='foliolab-open-install-hint-dismissed-v1';
mkdirSync('artifacts/gates/navigation-installation',{recursive:true});
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const contexts=[],checks=[];
 const fresh=async(blocked='none',standalone=false)=>{
  const c=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',ignoreHTTPSErrors:Boolean(proxy)});contexts.push(c);
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
  await nav(p,'more');assert.equal(await p.locator('#installButton').innerText(),'App installieren');await p.locator('#installButton').click();assert.equal(await p.locator('#dialogTitle').innerText(),'FolioLab als App verwenden');await p.locator('#cancelDialog').click();
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
   assert.equal(await p.evaluate(()=>window.__installCalls),1);assert.equal(await p.locator('#installButton').getAttribute('data-install-mode'),'help');assert.equal(await p.locator('#installAppSection').isVisible(),true,'choice alone never claims installed');
  }
  await p.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));assert.equal(await p.locator('#installAppSection').isVisible(),false);assert.equal(await p.locator('#sidebarInstallHint').isVisible(),false);assert.deepEqual(await record(p),before);
  checks.push('late prompt; manual help; dismissal/navigation/reload; accepted/dismissed/error/pending; single consumption; delivered appinstalled handler with synthetic event; exact IDB record unchanged');
  for(const blocked of ['local','both']){
   const q=await fresh(blocked),stored=await record(q);await prompt(q);await q.locator('#dismissInstallHint').click();await nav(q,'more');await prompt(q);assert.equal(await q.locator('#sidebarInstallHint').isVisible(),false,'blocked preference writes retain memory');
   if(blocked==='local'){await q.reload();await ready(q);await prompt(q);assert.equal(await q.locator('#sidebarInstallHint').isVisible(),false,'session fallback survives reload');}
   assert.deepEqual(await record(q),stored);
  }
  checks.push('local preference storage failure/session fallback and both stores failing/memory; portfolio bytes unchanged');
  const standalone=await fresh('none',true),standaloneBefore=await record(standalone);await nav(standalone,'more');await prompt(standalone);assert.equal(await standalone.locator('#installAppSection').isVisible(),false);assert.equal(await standalone.locator('#sidebarInstallHint').isVisible(),false);
  await standalone.evaluate(()=>window.__setSyntheticStandalone(false));await standalone.locator('#sidebarInstallHint').waitFor({state:'visible'});await standalone.locator('#installButton').focus();await standalone.evaluate(()=>window.__setSyntheticStandalone(true));assert.equal(await standalone.locator('#installAppSection').isVisible(),false);assert.equal(await standalone.evaluate(()=>document.activeElement.dataset.page),'more','hiding an installation control retains visible navigation focus');
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
  for(const width of [320,390,430,768,1440]){
   await layout.setViewportSize({width,height:900});await nav(layout,'dashboard');
   assert.equal(await layout.locator('#providerOverview').count(),1);assert.equal(await layout.locator('#donut').count(),1);
   assert.ok(await layout.locator('.dashboard-allocation').evaluate(e=>{const content=e.querySelector('.allocation-layout').getBoundingClientRect(),box=e.getBoundingClientRect();return box.bottom-content.bottom<50;}),'allocation has no stretched empty tail');
   if(width===1440){assert.ok(await layout.locator('.dashboard-overview').evaluate(e=>{const history=e.querySelector('.dashboard-history').getBoundingClientRect(),side=e.querySelector('.dashboard-side').getBoundingClientRect();return history.right<=side.left&&Math.abs(history.top-side.top)<2;}));assert.equal(await layout.locator('#sidebarNav button.active').evaluate(e=>getComputedStyle(e).boxShadow),'none');assert.equal(await layout.locator('#sidebarNav button.active span').evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');}
   await layout.locator('#providerOverview details').evaluateAll(es=>es.forEach(e=>e.open=true));
   assert.equal(await layout.locator('[data-position-id=nav-unknown]>summary').innerText(),'Synthetic USD with unknown FX\nNicht bewertet','compact summary never invents an EUR valuation for unknown FX');
   assert.ok(await layout.locator('[data-action=import-price-history][data-id=nav-etf]').isVisible());
   assert.ok(await layout.locator('.position-csv-import').first().evaluate(e=>e.getBoundingClientRect().height>=44));
   await scan(layout);await layout.screenshot({path:`artifacts/gates/navigation-installation/${engine}-${width}.png`});assert.deepEqual(await record(layout),stored,'disclosures/layout preserve exact portfolio record');
  }
  checks.push('five widths; long provider/account/position names and large amounts; graph/allocation/accounts arrangement; compact disclosures/CSV retained; axe/overflow; exact IDB record unchanged');
  for(const width of [980,1180]){
   await layout.setViewportSize({width,height:900});await nav(layout,'dashboard');
   assert.ok(await layout.locator('.dashboard-overview').evaluate((root,width)=>{const history=root.querySelector('.dashboard-history').getBoundingClientRect(),side=root.querySelector('.dashboard-side').getBoundingClientRect(),allocation=root.querySelector('.dashboard-allocation').getBoundingClientRect(),providers=root.querySelector('.dashboard-providers').getBoundingClientRect();return width===980?history.bottom<=side.top&&allocation.bottom<=providers.top:history.right<=side.left&&Math.abs(history.top-side.top)<2&&allocation.bottom<=providers.top;},width),'natural card arrangement at each new grid breakpoint');await scan(layout);assert.deepEqual(await record(layout),stored);
  }
  checks.push('980/1180 grid breakpoint edges; natural card alignment; no overflow or portfolio writes');
  await layout.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{createProvider,createAccount,createPosition}=await import('/src/model.js');const s=new PortfolioStorage();const m=await s.initialize();
   for(let i=1;i<=11;i++){const providerId='nav-large-p'+i,accountId='nav-large-a'+i;m.providers.push(createProvider({id:providerId,name:'Synthetic large-list provider '+i}));m.accounts.push(createAccount({id:accountId,providerId,name:'Synthetic large-list account '+i,type:'securities'},m));for(let j=0;j<8;j++)m.positions.push(createPosition({id:'nav-large-'+i+'-'+j,providerId,accountId,name:'Synthetic readable holding '+i+' / '+j,kind:'etf',currency:'EUR',quantity:'1.23456789',price:'100'},m));}
   await s.save(m);s.close();
  });await layout.reload();await ready(layout);await nav(layout,'dashboard');const large=await record(layout);
  assert.equal(await layout.locator('#providerOverview>.provider-accordion').count(),12);assert.equal(await layout.locator('#providerOverview [data-position-id]').count(),90,'large list retains every position');
  await layout.setViewportSize({width:320,height:740});const last=layout.locator('#providerOverview>.provider-accordion').last();await last.locator(':scope>summary').click();await last.locator('[data-position-id=nav-large-11-7]>summary').click();const lastCsv=last.locator('[data-action=import-price-history][data-id=nav-large-11-7]');await lastCsv.waitFor({state:'visible',timeout:5000});assert.ok(await lastCsv.isVisible());await scan(layout);
  await layout.locator('#dashboardPage').evaluate(root=>{const sizes=[...root.querySelectorAll('*')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const[e,size]of sizes)e.style.fontSize=size*1.5+'px';});await scan(layout);assert.ok(await layout.locator('.donut-inner').evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1),'large amount remains inside the scaled donut centre');assert.deepEqual(await record(layout),large,'large list, actual disclosures and synthetic text scale preserve canonical record');
  checks.push('12 providers/90 positions retained; last provider/position reachable; native summary clicks; 320px synthetic 150% text; exact IDB record unchanged');
  writeFileSync(`artifacts/gates/navigation-installation/${engine}.json`,JSON.stringify({engine,result:'PASS',widths:[320,390,430,768,1440],breakpoints:[980,1180],checks,syntheticInstallEvents:true,physicalAndroid:false,realInstallation:false},null,2));
 }finally{await Promise.all(contexts.map(c=>c.close()));await browser.close();}
}
