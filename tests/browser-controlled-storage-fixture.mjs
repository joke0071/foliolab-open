import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';

// Establish the same real worker/controller prerequisite as the removal suite,
// before a fixture save/reload can overlap initial installation and claiming.
export async function controlledStorageFixture(page,ready,record){
 const context=page.context(),engine=context.browser().browserType().name();
 const out='artifacts/gates/storage-fixture/'+engine+'-'+Date.now();
 mkdirSync('artifacts/gates/storage-fixture',{recursive:true});
 const diagnostics={engine,caller:new Error('fixture caller').stack,events:[],stages:[]};
 const navigation=frame=>{if(frame===page.mainFrame())diagnostics.events.push({event:'navigation',url:frame.url(),time:Date.now()});};
 const load=()=>diagnostics.events.push({event:'load',url:page.url(),time:Date.now()});
 page.on('framenavigated',navigation);page.on('load',load);
 const state=()=>page.evaluate(async()=>{
  const describe=worker=>worker?{script:worker.scriptURL,state:worker.state}:null;
  const registration=await navigator.serviceWorker.getRegistration();
  return {url:location.href,timeOrigin:performance.timeOrigin,documentState:document.readyState,
   controller:describe(navigator.serviceWorker.controller),active:describe(registration?.active),
   installing:describe(registration?.installing),waiting:describe(registration?.waiting),
   controlled:!!registration?.active&&navigator.serviceWorker.controller===registration.active,
   caches:await caches.keys(),storage:document.getElementById('portfolioStorageState')?.textContent,fixture:window.__folioControlledFixture};
 });
 await context.tracing.start({screenshots:true,snapshots:true,sources:true});
 try{
 await ready();
 diagnostics.stages.push({stage:'initial-ready',state:await state()});
 const blank=await record();
 assert.ok(blank?.raw&&Number.isInteger(blank.revision),'canonical blank record exists before worker acquisition');
 const controlled=async stage=>{
  // waitForFunction treats a returned Promise as truthy before it resolves.
  // Observe real lifecycle events, then poll a synchronous boolean instead.
  await page.evaluate(()=>{
   const fixture=window.__folioControlledFixture={ready:false,error:null};
   void navigator.serviceWorker.ready.then(registration=>{
    const watched=new WeakSet();
    const check=()=>{
     for(const worker of [registration.active,registration.installing,registration.waiting]){
      if(worker&&!watched.has(worker)){watched.add(worker);worker.addEventListener('statechange',check);}
     }
     fixture.ready=registration.active?.state==='activated'&&navigator.serviceWorker.controller===registration.active;
    };
    registration.addEventListener('updatefound',check);
    navigator.serviceWorker.addEventListener('controllerchange',check);check();
   }).catch(error=>{fixture.error=String(error);});
  });
  const result=await page.waitForFunction(()=>window.__folioControlledFixture?.ready===true);
  const waitResult=await result.jsonValue();await result.dispose();
  diagnostics.stages.push({stage,waitResult,state:await state()});
  assert.equal(waitResult,true,'the lifecycle predicate actually reached true');
 };
 await controlled('before-reload');
 await page.reload();await ready();
 // A new document must acquire its own activated controller; the previous
 // document's readiness does not establish this post-reload prerequisite.
 await controlled('after-reload');
 const verified=await page.evaluate(async()=>{
  const registration=await navigator.serviceWorker.getRegistration();
  return {controller:navigator.serviceWorker.controller?.scriptURL,active:registration?.active?.state,controlled:navigator.serviceWorker.controller===registration?.active};
 });
 diagnostics.stages.push({stage:'assertions',state:await state(),verified});
 assert.equal(verified.controller,new URL('sw.js',page.url()).href);
 assert.equal(verified.active,'activated');assert.equal(verified.controlled,true);
 assert.deepEqual(await record(),blank,'worker acquisition/reload preserves exact blank raw/settings/revision');
 diagnostics.result='PASS';return verified;
 }catch(error){
  diagnostics.result='FAIL';diagnostics.error=String(error);diagnostics.stack=error.stack;
  diagnostics.final=await state().catch(e=>({error:String(e)}));
  await page.screenshot({path:out+'.png',fullPage:true}).catch(e=>{diagnostics.screenshotError=String(e);});
  throw error;
 }finally{
  page.off('framenavigated',navigation);page.off('load',load);
  await context.tracing.stop(diagnostics.result==='FAIL'?{path:out+'-trace.zip'}:{}).catch(e=>{diagnostics.traceError=String(e);});
  writeFileSync(out+'.json',JSON.stringify(diagnostics,null,2));
  console.log('STORAGE FIXTURE '+engine+' '+diagnostics.result+' '+JSON.stringify(diagnostics.stages));
 }
}
