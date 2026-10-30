import {setTimeout as pause} from 'node:timers/promises';

// Read-only observations: await the browser result in Node instead of treating
// an unresolved browser-side Promise as a truthy polling result. No action retry.
export async function waitForAsyncReadiness(page,predicate,arg,{timeout=30000}={}){
 const started=performance.now(),deadline=started+timeout;
 let timer,polls=0;
 const error=new Error('Browser readiness did not become true within '+timeout+'ms');
 error.name='TimeoutError';
 const expired=new Promise((_,reject)=>{timer=setTimeout(()=>reject(error),timeout);});
 try{
  while(performance.now()<deadline){
   let value;
   try{value=await Promise.race([page.evaluate(predicate,arg),expired]);polls++;}
   catch(cause){
    // controllerchange intentionally reloads the document in this fixture.
    // Other errors, including application/assertion/closed-page errors, fail.
    if(!/Execution context was destroyed|Cannot find context with specified id/.test(String(cause)))throw cause;
   }
   if(value===true)return {value:true,polls,elapsedMs:performance.now()-started,timeoutMs:timeout};
   await Promise.race([pause(Math.min(50,Math.max(0,deadline-performance.now()))),expired]);
  }
  throw error;
 }finally{clearTimeout(timer);}
}
