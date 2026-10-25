import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const axeScript=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const engines={chromium,firefox,webkit};
// Bound even unresolved service-worker/platform promises; never hang a CI job.
const deadline=setTimeout(()=>{console.error('Cash comparison browser deadline exceeded');process.exit(1);},180000);
deadline.unref();
for(const name of (process.env.CASH_ENGINES||'chromium').split(',')){
 console.log('CASH RECONCILIATION '+name+': starting');
 const browser=await engines[name].launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  // Inject the test helper before navigation; no routed script request crosses the app's Service Worker.
  await page.addInitScript({content:axeScript});
  await page.goto('http://127.0.0.1:4173/');
  // Finish initial shell installation before navigating to the synthetic portfolio.
  await page.evaluate(async()=>{await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Initial service worker not ready')),30000))]);});
  await page.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
   const m=blankModel(),provider=createProvider({name:'Testbank',type:'bank'});m.providers.push(provider);m.settings.autoRefresh=false;
   for(const [id,currency,quantity] of [['first','EUR','100'],['second','EUR','250'],['usd','USD','20.1']]){
    const a=createAccount({id,providerId:provider.id,name:id,type:'savings',currency},m);m.accounts.push(a);
    m.positions.push(createPosition({id:id+'-cash',providerId:provider.id,accountId:id,name:id,kind:'cash',quantity,price:1,currency,fxRate:0.9},m));
   }
   persist(m);
  });
  await page.reload();await page.locator('#mobileNav [data-page="positions"]').click();
  // Use the app's existing account and position disclosure, just like a user.
  const button=page.locator('[data-action="check-cash-balance"][data-id="first-cash"]');
  for(const details of await button.locator('xpath=ancestor::details').all())await details.evaluate(el=>{el.open=true;});
  const before=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
  await button.click();assert.match(await page.locator('#dialogFields').innerText(),/Testbank.*first.*EUR/s);
  assert.equal(await page.locator('#saveDialog').innerText(),'Prüfen');
  await page.locator('#saveDialog').click();assert.match(await page.locator('#dialogError').innerText(),/bestätigen/);
  await page.locator('#cashReferenceCurrent').check();await page.locator('#saveDialog').click();
  assert.match(await page.locator('#dialogError').innerText(),/eingeben/);
  await page.locator('#cashReference').fill('100.000000000000000001');await page.locator('#saveDialog').click();
  assert.match(await page.locator('#cashComparisonResult').innerText(),/0,000000000000000001 EUR/);
  assert.match(await page.locator('#cashComparisonResult').innerText(),/keine automatische Einzahlung/);
  assert.equal(await page.locator('#editDialog').evaluate(e=>e.open),true);
  // Changing the reference invalidates the previous result.
  await page.locator('#cashReference').fill('100');assert.equal(await page.locator('#cashComparisonResult').innerText(),'');
  await page.locator('#saveDialog').click();assert.match(await page.locator('#cashComparisonResult').innerText(),/stimmen rechnerisch überein/);
  if(process.env.CASH_SCREENSHOT&&name==='chromium')await page.screenshot({path:process.env.CASH_SCREENSHOT});
  for(const width of [320,390,430,768,1440]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow at '+width);
   assert.ok(await page.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),name+' dialog overflow at '+width);
  }
  const violations=await page.evaluate(async()=>(await window.axe.run(document.querySelector('#editDialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,impact:v.impact})));
  assert.deepEqual(violations,[],name+' cash dialog WCAG rules');
  let confirms=0;page.on('dialog',async d=>{confirms++;await d.dismiss();});
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#editDialog').open);
  assert.equal(confirms,0,'read-only input is not an unsaved financial edit');
  assert.equal(await button.evaluate(e=>document.activeElement===e),true,'focus returns');
  assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),before,'comparison cannot persist a correction');
  // Selected foreign-currency account, no conversion; reset label on normal editors.
  await page.setViewportSize({width:390,height:844});
  const usd=page.locator('[data-action="check-cash-balance"][data-id="usd-cash"]');
  for(const details of await usd.locator('xpath=ancestor::details').all())await details.evaluate(el=>{el.open=true;});
  await usd.click();await page.locator('#cashReference').fill('-1');await page.locator('#cashReferenceCurrent').check();
  await page.locator('#saveDialog').click();assert.match(await page.locator('#cashComparisonResult').innerText(),/-21,1 USD/);
  await page.locator('#cancelDialog').click();
  await page.locator('#mobileNav [data-page="more"]').click();await page.locator('#addProvider').click();
  assert.equal(await page.locator('#cancelDialog').innerText(),'Abbrechen');assert.equal(await page.locator('#saveDialog').innerText(),'Anbieter speichern');
  await page.locator('#closeDialog').click();
  // Block all network requests; the complete cached app shell must still reload.
  await page.evaluate(async()=>{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Service worker not ready')),15000))]);});
  await page.waitForFunction(()=>navigator.serviceWorker.controller);
  await context.route('**/*',route=>route.abort('internetdisconnected'));await page.reload({waitUntil:'domcontentloaded'});await page.locator('#mobileNav [data-page="positions"]').click();
  const offline=page.locator('[data-action="check-cash-balance"][data-id="second-cash"]');
  for(const details of await offline.locator('xpath=ancestor::details').all())await details.evaluate(el=>{el.open=true;});
  await offline.click();await page.locator('#cashReference').fill('250');await page.locator('#cashReferenceCurrent').check();
  await page.locator('#saveDialog').click();assert.match(await page.locator('#cashComparisonResult').innerText(),/stimmen rechnerisch überein/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),before);
  // An actual second-tab write invalidates the visible result and blocks stale checks.
  const peer=await context.newPage();await peer.goto('http://127.0.0.1:4173/');
  const peerRaw=await peer.evaluate(()=>{const m=JSON.parse(localStorage.getItem('foliolab-open-v1'));m.providers[0].name='Updated Testbank';const raw=JSON.stringify(m);localStorage.setItem('foliolab-open-v1',raw);return raw;});
  await page.waitForFunction(()=>document.querySelector('#cashComparisonResult').textContent.includes('Datenstand'));
  await page.locator('#saveDialog').click();
  assert.match(await page.locator('#dialogError').innerText(),/neu laden/);
  assert.equal(await page.locator('#cashComparisonResult').innerText(),'');
  assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),peerRaw);await peer.close();
  assert.deepEqual(errors,[]);
  console.log('CASH RECONCILIATION '+name+': exact/read-only/account/FX/dialog/mobile/offline PASS');
 }finally{await context.setOffline(false).catch(()=>{});await context.close();await browser.close();}
}
