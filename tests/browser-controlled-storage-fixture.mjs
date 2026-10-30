import assert from 'node:assert/strict';

// Establish the same real worker/controller prerequisite as the removal suite,
// before a fixture save/reload can overlap initial installation and claiming.
export async function controlledStorageFixture(page,ready,record){
 await ready();
 const blank=await record();
 assert.ok(blank?.raw&&Number.isInteger(blank.revision),'canonical blank record exists before worker acquisition');
 const controlled=()=>page.waitForFunction(async()=>{
  const registration=await navigator.serviceWorker.getRegistration();
  return registration?.active?.state==='activated'&&navigator.serviceWorker.controller===registration.active;
 });
 await controlled();
 await page.reload();await ready();
 // A new document must acquire its own activated controller; the previous
 // document's readiness does not establish this post-reload prerequisite.
 await controlled();
 const state=await page.evaluate(async()=>{
  const registration=await navigator.serviceWorker.getRegistration();
  return {controller:navigator.serviceWorker.controller?.scriptURL,active:registration?.active?.state,controlled:navigator.serviceWorker.controller===registration?.active};
 });
 assert.equal(state.controller,new URL('sw.js',page.url()).href);
 assert.equal(state.active,'activated');assert.equal(state.controlled,true);
 assert.deepEqual(await record(),blank,'worker acquisition/reload preserves exact blank raw/settings/revision');
 return state;
}
