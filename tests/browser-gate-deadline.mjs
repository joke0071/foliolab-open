/** Bound test orchestration only. A stalled phase fails; no assertion or retry
 * is bypassed, and no application runtime code imports this module. */
export function browserGateDeadline(phase,milliseconds=300000){
 console.log('BROWSER_GATE_START '+phase);
 const timer=setTimeout(()=>{console.error('BROWSER_GATE_TIMEOUT '+phase+' after '+milliseconds+'ms');process.exit(1);},milliseconds);
 timer.unref();
 return ()=>clearTimeout(timer);
}

/** Observe the application's own registration; never register a test worker or
 * replace a pending assertion with a successful fallback. */
export async function waitForAppServiceWorker(page){
 // The polling predicate itself must stay synchronous: a Promise is truthy
 // even when its eventual value is false. Keep native readiness per document;
 // Playwright can then observe a real app navigation without losing the wait.
 const ready=await page.waitForFunction(()=>{
  const key=Symbol.for('foliolab.test.app-worker-activation');
  let state=globalThis[key];
  if(!state){
   state={ready:false,error:null};globalThis[key]=state;
   navigator.serviceWorker.ready.then(registration=>{
    const worker=registration.active;
    if(!worker){state.error='Application service worker registration has no active worker.';return;}
    const changed=()=>{
     if(worker.state==='activated'){state.ready=true;worker.removeEventListener('statechange',changed);}
     else if(worker.state==='redundant'){state.error='Application service worker became redundant before activation.';worker.removeEventListener('statechange',changed);}
    };
    worker.addEventListener('statechange',changed);changed();
   }).catch(error=>{state.error=String(error);});
  }
  if(state.error)throw Error(state.error);
  return state.ready;
 },null,{timeout:60000});
 await ready.dispose();
}
