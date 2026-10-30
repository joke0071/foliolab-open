/** Failure-only evidence for isolated synthetic browser profiles. Never changes a gate or retries. */
export function observeBrowserFailures(page){
 const network=[],consoleErrors=[];
 const path=url=>{try{const u=new URL(url);return u.origin+u.pathname;}catch{return '[invalid URL]';}};
 const keep=(list,row)=>{list.push(row);if(list.length>60)list.shift();};
 page.on('requestfailed',r=>keep(network,{url:path(r.url()),error:r.failure()?.errorText}));
 page.on('response',r=>{if(r.status()>=400)keep(network,{url:path(r.url()),status:r.status()});});
 page.on('console',m=>{if(m.type()==='error')keep(consoleErrors,m.text().replace(/https?:\/\/[^\s'"\)]+/g,path).slice(0,1000));});
 return async()=>{
  const state=await page.evaluate(async()=>{
   const r=await navigator.serviceWorker?.getRegistration();
   const worker=w=>w?{scriptURL:w.scriptURL,state:w.state}:null;
   const cachesState=[];
   for(const name of await caches.keys())cachesState.push({name,count:(await(await caches.open(name)).keys()).length});
   return {url:location.origin+location.pathname,readyState:document.readyState,
    storageState:document.getElementById('portfolioStorageState')?.textContent??null,
    bodyText:document.body.innerText.slice(0,5000),controller:worker(navigator.serviceWorker?.controller),
    registration:r?{active:worker(r.active),installing:worker(r.installing),waiting:worker(r.waiting)}:null,
    caches:cachesState};
  }).catch(error=>({captureError:String(error)}));
  return {state,network,consoleErrors};
 };
}
