import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {waitForAppServiceWorker} from './browser-gate-deadline.mjs';
/** Actual delivered handlers; synthetic controller events, no native/hardware claim. */
export async function pwaUpdateDraftBrowserContract({p:parent,engine}){
 const context=await parent.context().browser().newContext({viewport:{width:390,height:800}}),p=await context.newPage();
 const base=new URL('./',parent.url()).href,origin=new URL(base).origin;let providerRequests=0;
 await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){providerRequests++;return route.abort();}return route.continue();});
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const more=async()=>{await p.locator('#mobileNav [data-page=more]').click();for(const name of ['publicInstrumentEndpoint','coinGeckoKey'])await p.locator('[name='+name+']').evaluate(el=>{for(let n=el.parentElement;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;});};
 const blur=()=>p.locator('#pageTitle').evaluate(el=>{el.tabIndex=-1;el.focus();});
 const update=()=>p.evaluate(()=>{setTimeout(()=>navigator.serviceWorker.dispatchEvent(new Event('controllerchange')),0);});
 const cleanReload=async()=>{await blur();const before=await record(),old=await p.evaluate(()=>performance.timeOrigin);await Promise.all([p.waitForNavigation({waitUntil:'networkidle'}),update()]);await ready();assert.notEqual(await p.evaluate(()=>performance.timeOrigin),old);assert.deepEqual(await record(),before);};
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base);await ready();await waitForAppServiceWorker(p);
  await p.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  await p.evaluate(async()=>{const {blankModel}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const m=blankModel();m.settings.autoRefresh=false;const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();});
  await p.reload();await ready();await more();await cleanReload();await more();
  const before=await record(),old=await p.evaluate(()=>performance.timeOrigin);
  await p.locator('[name=coinGeckoKey]').fill('SYNTHETIC_UPDATE_DRAFT');await blur();await update();await p.locator('#pwaUpdateNotice').waitFor();
  assert.equal(await p.evaluate(()=>performance.timeOrigin),old);assert.deepEqual(await record(),before);
  let pending=p.waitForEvent('dialog'),click=p.locator('#pwaUpdateNotice button').click(),dialog=await pending;
  assert.match(dialog.message(),/noch nicht gespeichert/);await dialog.dismiss();await click;
  assert.equal(await p.locator('[name=coinGeckoKey]').inputValue(),'SYNTHETIC_UPDATE_DRAFT');assert.equal(await p.evaluate(()=>performance.timeOrigin),old);assert.deepEqual(await record(),before);
  const navigation=p.waitForNavigation({waitUntil:'networkidle'});pending=p.waitForEvent('dialog');click=p.locator('#pwaUpdateNotice button').click();dialog=await pending;await dialog.accept();await click;await navigation;await ready();assert.deepEqual(await record(),before);await more();
  // External form-associated endpoint and key: saved normalized URL stays clean.
  await p.locator('[name=publicInstrumentEndpoint]').fill('https://EXAMPLE.invalid:443/');
  await p.locator('[name=coinGeckoKey]').fill('SYNTHETIC_SAVED_KEY');
  await p.locator('#apiSettings').evaluate(form=>form.requestSubmit());
  await p.waitForFunction(()=>document.getElementById('toast').textContent==='Datenquellen und Zugänge lokal gespeichert.');
  assert.equal(JSON.parse((await record()).raw).settings.publicInstrumentEndpoint,'https://example.invalid');
  await cleanReload();await more();
  await p.locator('[name=coinGeckoKey]').fill('');await p.locator('#apiSettings').evaluate(form=>form.requestSubmit());
  await p.waitForFunction(()=>document.getElementById('toast').textContent==='Datenquellen und Zugänge lokal gespeichert.');
  assert.equal(JSON.parse((await record()).raw).settings.coinGeckoKey,'');await cleanReload();await more();
  // One actual failed IDB put; rollback must not mark the still-visible draft clean.
  const beforeFailure=await record(),failureDocument=await p.evaluate(()=>performance.timeOrigin);
  await p.locator('[name=coinGeckoKey]').fill('SYNTHETIC_FAILED_SAVE_DRAFT');
  await p.evaluate(()=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){IDBObjectStore.prototype.put=original;throw new DOMException('Browserspeicher voll (SYNTHETIC)','QuotaExceededError');};});
  await p.locator('#apiSettings').evaluate(form=>form.requestSubmit());
  await p.waitForFunction(()=>document.getElementById('toast').textContent.includes('Browserspeicher voll'));
  assert.deepEqual(await record(),beforeFailure);assert.equal(await p.locator('[name=coinGeckoKey]').inputValue(),'SYNTHETIC_FAILED_SAVE_DRAFT');
  await blur();await update();await p.locator('#pwaUpdateNotice').waitFor();assert.equal(await p.evaluate(()=>performance.timeOrigin),failureDocument);assert.deepEqual(await record(),beforeFailure);
  assert.deepEqual(errors,[]);assert.equal(providerRequests,0,'no provider or synthetic credential requests');
  await mkdir('artifacts/gates/update-drafts',{recursive:true});await writeFile(`artifacts/gates/update-drafts/${engine}.json`,JSON.stringify({engine,result:'PASS',base,syntheticControllerChange:true,nativeWorkerOrHardwareClaim:false,checks:['unfocused draft retained','explicit cancel retains document and draft','explicit discard reloads without canonical writes','fresh, saved normalized endpoint and saved empty credential reload cleanly','failed actual IDB put preserves exact record/revision and unsaved draft'],providerRequests:0},null,2));
 }finally{await context.close();}
}
