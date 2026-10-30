import assert from 'node:assert/strict';

// Establish the same real worker/controller prerequisite as the removal suite,
// before a fixture save/reload can overlap initial installation and claiming.
export async function controlledStorageFixture(page,ready,record){
 await ready();
 const blank=await record();
 assert.ok(blank?.raw&&Number.isInteger(blank.revision),'canonical blank record exists before worker acquisition');
 await page.waitForFunction(async()=>{
  const registration=await navigator.serviceWorker.getRegistration();
  return registration?.active?.state==='activated'&&navigator.serviceWorker.controller===registration.active;
 });
 await page.reload();await ready();
 const state=await page.evaluate(async()=>{
  const registration=await navigator.serviceWorker.getRegistration();
  return {controller:navigator.serviceWorker.controller?.scriptURL,active:registration?.active?.state,controlled:navigator.serviceWorker.controller===registration?.active};
 });
 assert.equal(state.controller,new URL('sw.js',page.url()).href);
 assert.equal(state.active,'activated');assert.equal(state.controlled,true);
 assert.deepEqual(await record(),blank,'worker acquisition/reload preserves exact blank raw/settings/revision');
 return state;
}
