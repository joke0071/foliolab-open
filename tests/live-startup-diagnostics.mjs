// Read-only failure evidence for isolated synthetic release profiles.
// Never waits for readiness, retries navigation, reads portfolio bytes or changes a gate.
export function diagnosticURL(value,base){
 try{const url=new URL(value,base);return url.origin===new URL(base).origin?url.origin+url.pathname:null;}catch{return null;}
}
export async function observeLiveStartup(page,base,{captureBudget=2000}={}){
 const started=Date.now(),pending=new Map(),failed=[],badResponses=[];
 const entry=request=>{const url=diagnosticURL(request.url(),base);return url?{url,type:request.resourceType(),startedMs:Date.now()-started}:null;};
 page.on('request',request=>{const data=entry(request);if(data)pending.set(request,data);});
 page.on('requestfinished',request=>pending.delete(request));
 page.on('requestfailed',request=>{const data=pending.get(request)||entry(request);if(data&&failed.length<30)failed.push({...data,error:String(request.failure()?.errorText||'request failed').slice(0,160)});pending.delete(request);});
 page.on('response',response=>{if(response.status()>=400&&badResponses.length<30){const url=diagnosticURL(response.url(),base);if(url)badResponses.push({url,status:response.status()});}});
 await page.addInitScript(()=>{
  window.__foliolabLiveStartup={readyAt:null};
  window.addEventListener('foliolab:ready',()=>{window.__foliolabLiveStartup.readyAt=performance.now();},{once:true});
 });
 return async()=>{
  const transport={elapsedMs:Date.now()-started,pendingRequests:[...pending.values()].slice(0,200),pendingCount:pending.size,failedRequests:failed,badResponses};
  let timer;
  try{
   const state=await Promise.race([
    page.evaluate(()=>{
     const node=id=>document.getElementById(id),text=id=>String(node(id)?.textContent||'').slice(0,240);
     const nav=id=>{const el=node(id),rect=el?.getBoundingClientRect();return {exists:!!el,buttons:el?.querySelectorAll('button[data-page]').length||0,more:!!el?.querySelector('[data-page="more"]'),display:el?getComputedStyle(el).display:null,width:rect?.width??null,height:rect?.height??null};};
     return {url:location.origin+location.pathname,documentState:document.readyState,readyAt:window.__foliolabLiveStartup?.readyAt??null,startup:{exists:!!node('appStartup'),hidden:node('appStartup')?.hidden??null,text:text('appStartupText'),helpHidden:node('appStartupHelp')?.hidden??null},storageText:text('portfolioStorageState'),mobileNav:nav('mobileNav'),sidebarNav:nav('sidebarNav'),serviceWorkerControlled:!!navigator.serviceWorker?.controller};
    }),
    new Promise(resolve=>{timer=setTimeout(()=>resolve({captureError:'Read-only browser snapshot exceeded diagnostic budget'}),captureBudget);})
   ]);
   return {...transport,state};
  }catch(error){return {...transport,state:{captureError:String(error).slice(0,240)}};}
  finally{clearTimeout(timer);}
 };
}
