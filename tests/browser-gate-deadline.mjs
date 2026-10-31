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
 await page.evaluate(()=>new Promise((resolve,reject)=>{
  let worker,settled=false;
  const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);worker?.removeEventListener('statechange',changed);if(error)reject(error);else resolve();};
  const changed=()=>{if(worker.state==='activated')finish();else if(worker.state==='redundant')finish(Error('Application service worker became redundant before activation.'));};
  const timer=setTimeout(()=>finish(Error('Application service worker did not activate within 60000ms.')),60000);
  navigator.serviceWorker.ready.then(registration=>{
   if(settled)return;
   worker=registration.active;
   if(!worker){finish(Error('Application service worker registration has no active worker.'));return;}
   worker.addEventListener('statechange',changed);changed();
  }).catch(finish);
 }));
}
