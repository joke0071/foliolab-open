import assert from 'node:assert/strict';
export async function pwaUpdateDraftNativeContract({browser,base,setGeneration,cache}){
 setGeneration('previous');
 const context=await browser.newContext({viewport:{width:390,height:700}}),p=await context.newPage();
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 try{
  await p.goto(base,{waitUntil:'networkidle'});await ready();
  await p.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
  await p.evaluate(async()=>{const {blankModel}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const m=blankModel();m.settings.autoRefresh=false;const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();});
  await p.reload({waitUntil:'networkidle'});await ready();
  await p.locator('#mobileNav [data-page=more]').click();
  await p.locator('[name=coinGeckoKey]').evaluate(el=>{for(let n=el.parentElement;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;});
  await p.locator('[name=coinGeckoKey]').fill('SYNTHETIC_UNSAVED_UPDATE_DRAFT');
  await p.locator('#pageTitle').evaluate(el=>{el.tabIndex=-1;el.focus();});
  const before=await record(),timeOrigin=await p.evaluate(()=>performance.timeOrigin);
  assert.equal(await p.evaluate(()=>document.activeElement.id),'pageTitle');
  setGeneration('current');
  await p.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update();});
  await p.waitForFunction(async expected=>{const r=await navigator.serviceWorker.getRegistration();return r.active?.state==='activated'&&navigator.serviceWorker.controller===r.active&&(await caches.keys()).filter(k=>k.startsWith('foliolab-open-')).join()===expected;},cache,{timeout:60000});
  await p.locator('#pwaUpdateNotice').waitFor();
  assert.equal(await p.evaluate(()=>performance.timeOrigin),timeOrigin,'native controllerchange preserves unfocused draft document');
  assert.equal(await p.locator('[name=coinGeckoKey]').inputValue(),'SYNTHETIC_UNSAVED_UPDATE_DRAFT');
  assert.deepEqual(await record(),before);
  const button=p.locator('#pwaUpdateNotice button');
  let pending=p.waitForEvent('dialog'),click=button.click(),question=await pending;
  assert.match(question.message(),/noch nicht gespeichert/);await question.dismiss();await click;
  assert.equal(await p.evaluate(()=>performance.timeOrigin),timeOrigin);assert.deepEqual(await record(),before);
  assert.equal(await p.locator('[name=coinGeckoKey]').inputValue(),'SYNTHETIC_UNSAVED_UPDATE_DRAFT');
  const navigation=p.waitForNavigation({waitUntil:'networkidle'});
  pending=p.waitForEvent('dialog');click=button.click();question=await pending;await question.accept();await click;await navigation;await ready();
  assert.notEqual(await p.evaluate(()=>performance.timeOrigin),timeOrigin);assert.deepEqual(await record(),before);
  assert.equal(await p.locator('[name=coinGeckoKey]').inputValue(),'');
  return {result:'PASS',nativeControllerChange:true,focusLost:true,cancelPreservesDocumentAndDraft:true,explicitDiscardReloads:true,canonicalBytesAndRevisionUnchanged:true};
 }finally{await context.close();setGeneration('current');}
}
