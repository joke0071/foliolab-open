import assert from 'node:assert/strict';
import {clickDisclosed} from './browser-disclosures.mjs';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
// Deliberately unresolved module keeps document load pending; no web fonts are used.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.LOADING_BASE||'http://127.0.0.1:4173/';
const proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const engines=(process.env.LOADING_ENGINES||'chromium').split(',');
mkdirSync('artifacts/gates/loading-pwa',{recursive:true});
for(const engine of engines){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const axe=readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8');
 const contexts=[];const fresh=async options=>{const c=await browser.newContext({viewport:{width:320,height:740},serviceWorkers:'block',ignoreHTTPSErrors:Boolean(proxy),...options});contexts.push(c);await c.addInitScript({content:axe});return c.newPage();};
 const interactive=p=>p.waitForFunction(()=>document.getElementById('appStartup').hidden&&!document.querySelector('.layout').inert);
 const record=p=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('./src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 try{
  // A slow module graph must never expose a writable empty portfolio.
  const p=await fresh();let release,started;const waiting=new Promise(r=>started=r),hold=new Promise(r=>release=r);
  await p.route('**/src/app.js',async route=>{started();await hold;await route.continue();});
  await p.clock.install();await p.goto(base,{waitUntil:'commit'});await waiting;await p.waitForTimeout(450);
  assert.ok(await p.locator('#appStartup').isVisible());assert.ok(await p.locator('.layout').evaluate(e=>e.inert));
  assert.equal(await p.locator('#appStartup .lab-bubble').count(),3);
  assert.deepEqual(await p.evaluate(async()=>(await axe.run('#appStartup',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations),[]);
  await p.screenshot({path:`artifacts/gates/loading-pwa/${engine}-startup-320.png`});
  // Timer does not reject/cancel IndexedDB or start a second initialization.
  await p.clock.runFor(12500);
  assert.ok(await p.locator('#appStartupHelp').isVisible());assert.equal(await p.locator('#appStartup .lab-bubble').first().evaluate(e=>getComputedStyle(e).animationName),'none');
  release();await interactive(p);const before=await record(p);await p.reload();await interactive(p);assert.deepEqual(await record(p),before);
  assert.equal(await p.title(),'FolioLab');
  assert.ok(await p.evaluate(async()=>{const {setLoading}=await import('./src/loading-ui.js');const a=document.createElement('p'),b=document.createElement('p');a.textContent='Kurse werden aktualisiert …';b.textContent='Wallet wird geprüft …';document.body.append(a,b);setLoading(a,true);setLoading(a,true);setLoading(b,true);const valid=a.querySelectorAll('svg').length===1&&a.getAttribute('role')==='status'&&a.querySelector('clipPath').id!==b.querySelector('clipPath').id;setLoading(a,false);const ended=!a.querySelector('svg')&&a.textContent==='Kurse werden aktualisiert …';a.remove();b.remove();return valid&&ended;}));
  await p.locator('#mobileNav [data-page="more"]').click();
  // The large install card is gone; a compact icon exists only while a usable prompt is held and is never automatic.
  assert.equal(await p.locator('#pwaHelp').count(),0);assert.equal(await p.locator('[data-install-action]:visible').count(),0);
  assert.ok(await p.evaluate(()=>{window.__prompts=0;const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{window.__prompts++;};e.userChoice=Promise.resolve({outcome:'dismissed'});window.dispatchEvent(e);return e.defaultPrevented;}));
  assert.equal(await p.evaluate(()=>window.__prompts),0,'prompt must wait for a user tap');
  const install=p.locator('#installButtonMobile');assert.ok(await install.isVisible());assert.equal(await install.getAttribute('aria-label'),'FolioLab als App installieren');
  assert.ok(await install.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.right<=innerWidth;}));
  await install.click();assert.equal(await p.evaluate(()=>window.__prompts),1);assert.equal(await p.locator('[data-install-action]:visible').count(),0,'icon hidden after use');
  await p.evaluate(()=>{const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{};e.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(e);});assert.ok(await install.isVisible());
  await p.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));assert.equal(await p.locator('[data-install-action]:visible').count(),0,'appinstalled hides icon');
  await p.evaluate(()=>{Object.defineProperty(navigator,'standalone',{value:true,configurable:true});const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{};e.userChoice=new Promise(()=>{});window.dispatchEvent(e);});assert.equal(await p.locator('[data-install-action]:visible').count(),0,'standalone hides icon');
  await p.evaluate(()=>{delete navigator.standalone;});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const manifest=await p.evaluate(async()=>await(await fetch('./manifest.webmanifest')).json());
  assert.equal(manifest.name,'FolioLab');assert.equal(manifest.short_name,'FolioLab');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');assert.equal(manifest.id,undefined);
  for(const icon of manifest.icons.filter(i=>i.type==='image/png')){const dimensions=await p.evaluate(async src=>{const i=new Image();i.src=src;await i.decode();return [i.naturalWidth,i.naturalHeight];},icon.src);assert.equal(dimensions.join('x'),icon.sizes);}
  // A real refresh followed by failed persistence ends visibly; exact stored data survives.
  const quota=await fresh();await quota.route('https://api.coingecko.com/**',r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({bitcoin:{eur:123,last_updated_at:Math.floor(Date.now()/1000)}})}));await quota.goto(base);await interactive(quota);
  await quota.evaluate(async()=>{const {blankModel,createProvider,createAccount,createPosition}=await import('./src/model.js'),{PortfolioStorage}=await import('./src/browser-portfolio-storage.js');const m=blankModel();m.providers.push(createProvider({id:'loading-p',name:'Synthetic loading provider'}));m.accounts.push(createAccount({id:'loading-a',providerId:'loading-p',name:'Synthetic loading account',type:'exchange'},m));m.positions.push(createPosition({id:'loading-btc',providerId:'loading-p',accountId:'loading-a',kind:'crypto',coinId:'bitcoin',symbol:'BTC',name:'Synthetic Bitcoin',currency:'EUR',quantity:'1',price:'100'},m));m.settings.autoRefresh=false;const store=new PortfolioStorage();await store.initialize();await store.save(m);store.close();});
  await quota.reload();await interactive(quota);const stored=await record(quota);await quota.evaluate(async()=>{const {PortfolioStorage}=await import('./src/browser-portfolio-storage.js');PortfolioStorage.prototype.save=async()=>{throw new DOMException('Synthetic quota','QuotaExceededError');};});
  await quota.locator('#mobileNav [data-page="positions"]').click();await quota.locator('#refreshAll').click();await quota.waitForFunction(()=>!document.getElementById('refreshAll').disabled);assert.match(await quota.locator('#priceInfo').innerText(),/Aktualisierung fehlgeschlagen/);assert.equal(await quota.locator('#priceInfo .lab-flask').count(),0);assert.deepEqual(await record(quota),stored);
  // The watchdog is optional for completion: its own failed download cannot trap a ready app.
  const watchdog=await fresh();await watchdog.route('**/src/startup.js',r=>r.abort());await watchdog.goto(base);await interactive(watchdog);assert.ok(await watchdog.locator('#mobileNav [data-page=positions]').isEnabled());
  // Module download failure gives actionable feedback without unlocking controls.
  const failed=await fresh();await failed.route('**/src/app.js',r=>r.abort());await failed.goto(base);await failed.locator('#appStartupHelp').waitFor();assert.match(await failed.locator('#appStartupText').innerText(),/nicht vollständig/);assert.ok(await failed.locator('.layout').evaluate(e=>e.inert));
  const reduced=await fresh({reducedMotion:'reduce'});await reduced.route('**/src/app.js',r=>r.abort());await reduced.goto(base);assert.equal(await reduced.locator('.lab-liquid').first().evaluate(e=>getComputedStyle(e).animationName),'none');
  // Delay inside actual initialization, after all app modules loaded.
  const dbSlow=await fresh();await dbSlow.route('**/src/browser-portfolio-storage.js',async r=>{const response=await r.fetch();const body=(await response.text()).replace('async initialize(){','async initialize(){await new Promise(resolve=>setTimeout(resolve,1200));');await r.fulfill({response,body});});
  await dbSlow.goto(base,{waitUntil:'commit'});await dbSlow.waitForFunction(()=>document.getElementById('appStartupText').textContent.includes('Lokale Daten'));assert.ok(await dbSlow.locator('.layout').evaluate(e=>e.inert));await dbSlow.waitForTimeout(350);assert.ok(await dbSlow.locator('#appStartup').isVisible());await interactive(dbSlow);
  // Failed storage uses existing read-only recovery, never a blank writable model.
  const storage=await fresh();await storage.addInitScript(()=>{localStorage.setItem('foliolab-open-storage-mode','idb-v1');});await storage.goto(base);await interactive(storage);assert.match(await storage.locator('#notice').innerText(),/nicht lesbar/);assert.ok(await storage.locator('#addWizard').isDisabled());
  const timed=await fresh();await timed.goto(base);await interactive(timed);const coldMs=await timed.evaluate(()=>performance.getEntriesByName('foliolab-interactive')[0].startTime);await timed.reload();await interactive(timed);const warmMs=await timed.evaluate(()=>performance.getEntriesByName('foliolab-interactive')[0].startTime);await timed.evaluate(()=>{setTimeout(()=>{const d=document.createElement('details');d.id='loadingLateDisclosure';const s=document.createElement('summary');s.textContent='Synthetic late action';const b=document.createElement('button');b.dataset.loadingLate='true';b.textContent='Synthetic action';b.onclick=()=>b.dataset.clicked='true';d.append(s,b);document.getElementById('onboarding').append(d);},100);});await clickDisclosed(timed.locator('[data-loading-late]'));assert.equal(await timed.locator('[data-loading-late]').getAttribute('data-clicked'),'true');await timed.locator('#loadingLateDisclosure').evaluate(e=>e.remove());
  writeFileSync(`artifacts/gates/loading-pwa/${engine}.json`,JSON.stringify({engine,result:'PASS',coldMs,warmMs,checks:['watchdog download failure','refresh persistence failure/exact record','delayed IndexedDB initialization','inline loader deduplication','slow module graph','300ms visibility','timeout then late completion','read-only module error','storage failure recovery','reduced motion','320px/axe','record-preserving reload','manifest identity/PNG dimensions','compact install icon states'],androidHardware:false}));
  console.log(engine+' loading/PWA PASS');
 }finally{await Promise.all(contexts.map(c=>c.close()));await browser.close();}
}
