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
 const ready=await page.waitForFunction(async()=>{
  const registration=await navigator.serviceWorker.getRegistration();
  return registration?.active?.state==='activated';
 },null,{timeout:60000});
 await ready.dispose();
}
