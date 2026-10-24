import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:850}});
const page=await context.newPage();
try{
 await page.goto('http://127.0.0.1:4173/?page=history');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 // The second navigation is controlled by the installed worker.
 await page.reload();
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 await page.evaluate(()=>localStorage.setItem('pwa-version-test','preserved'));

 // Do not reload while a modal editor contains unsaved input.
 await page.locator('#addSnapshot').click();
 await page.locator('#editorForm [name="note"]').fill('Nicht gespeichert');
 await page.evaluate(()=>navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));
 await page.locator('#pwaUpdateNotice').waitFor();
 assert.equal(await page.locator('#editDialog').isVisible(),true);
 assert.equal(await page.locator('#editorForm [name="note"]').inputValue(),'Nicht gespeichert');

 // The modal remains in front of the update notice: no update action
 // can interrupt an unsaved entry. After closing it, the user may reload.
 assert.equal(await page.locator('#pwaUpdateNotice').count(),1);
 assert.equal(await page.locator('#editorForm [name="note"]').inputValue(),'Nicht gespeichert');
 page.once('dialog',d=>d.accept()); // Explicitly discard the unsaved snapshot before PWA update.
 await page.locator('#cancelDialog').click();
 await Promise.all([
  page.waitForEvent('load',{timeout:15000}),
  page.locator('#pwaUpdateNotice button').click()
 ]);
 assert.equal(await page.evaluate(()=>localStorage.getItem('pwa-version-test')),'preserved');
 assert.equal(await page.locator('#pwaUpdateNotice').count(),0);

 // Once idle, the new service worker automatically reloads the app.
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 await Promise.all([
  page.waitForEvent('load',{timeout:15000}),
  page.evaluate(()=>navigator.serviceWorker.dispatchEvent(new Event('controllerchange')))
 ]);
 assert.equal(await page.evaluate(()=>localStorage.getItem('pwa-version-test')),'preserved');
 assert.match(await page.locator('#pageTitle').innerText(),/Vermögensentwicklung/);
 assert.equal(await page.locator('#historyPage .history-panel > .panel-head').count(),0,'No redundant title in the chart card');
 assert.equal(await page.locator('#snapshotManager').getAttribute('open'),null);

 console.log('PWA UPDATE: idle pages reload, active editor is protected and browser data survives PASS');
}finally{
 await context.close();
 await browser.close();
}
