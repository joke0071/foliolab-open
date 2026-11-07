import assert from 'node:assert/strict';
import {firefox} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('.'),results=[];
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/probe'){res.setHeader('content-type','text/html');res.end('<!doctype html><title>Isolated synthetic scheduling</title>');return;}
  const file=resolve(root,'.'+pathname);assert.ok(file.startsWith(root+'/'));
  res.setHeader('content-type','text/javascript');res.end(await readFile(file));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await firefox.launch({headless:true});
try{
 for(const scenario of ['held-connection','active-write','close-pending-write','main-thread-gap']){
  const context=await browser.newContext();
  await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  const page=await context.newPage();
  try{
   await page.goto(base+'/probe');
   const result=await page.evaluate(async scenario=>{
    const {alphaCache}=await import('/src/alpha-vantage.js');
    const name='foliolab-open-market-cache',events=[];
    const log=(type,detail={})=>events.push({type,at:performance.now(),...detail});
    const request=indexedDB.open(name,1);request.onupgradeneeded=()=>request.result.createObjectStore('cache');
    const held=await new Promise((r,j)=>{request.onsuccess=()=>r(request.result);request.onerror=()=>j(request.error);});
    const store=alphaCache();await store.update('synthetic',()=>({value:7}));
    let maxGap=0,last=performance.now(),ticks=0;
    const heartbeat=setInterval(()=>{const now=performance.now();maxGap=Math.max(maxGap,now-last);last=now;ticks++;},50);
    // This factory observes the real request without replacing its handlers.
    let serial=0;
    const factory={open(...args){
     const req=indexedDB.open(...args),id=++serial;log('open',{id});
     for(const type of ['success','error','blocked','upgradeneeded'])req.addEventListener(type,()=>log(type,{id}));
     return req;
    }};
    let heldDone=Promise.resolve(),requests=0;
    if(scenario==='active-write'||scenario==='close-pending-write'){
     const tx=held.transaction('cache','readwrite'),s=tx.objectStore('cache'),until=performance.now()+6200;
     heldDone=new Promise((r,j)=>{tx.oncomplete=()=>{log('held-complete');r();};tx.onabort=()=>j(tx.error);});
     const keep=()=>{const req=s.get('synthetic');req.onsuccess=()=>{requests++;if(performance.now()<until)keep();};};
     keep();log('held-write-start');
     if(scenario==='close-pending-write'){held.close();log('held-close-call');}
    }
    if(scenario==='main-thread-gap'){
     await new Promise(r=>setTimeout(r,60));
     held.close();
    }
    const started=performance.now();let value=null,error=null;
    const operation=alphaCache(factory).read('synthetic');
    // Deliberately block only this isolated synthetic page after native open.
    if(scenario==='main-thread-gap'){
     const until=performance.now()+5300;while(performance.now()<until){}
     log('main-thread-released');
    }
    try{value=await operation;}catch(e){error=e.message;log('operation-rejected');}
    const operationMs=performance.now()-started;
    await heldDone;held.close();await new Promise(r=>setTimeout(r,100));clearInterval(heartbeat);
    return {scenario,value,error,operationMs,maxGap,ticks,heldRequests:requests,events};
   },scenario);
   if(scenario!=='main-thread-gap'){
    assert.equal(result.error,null);assert.deepEqual(result.value,{value:7});
    const opened=result.events.find(e=>e.type==='open'),success=result.events.find(e=>e.type==='success');
    assert.ok(success.at-opened.at<5000);
    if(scenario!=='held-connection')assert.ok(result.operationMs>=6000);
   }else if(result.error)assert.match(result.error,/Kurscache nicht verfügbar/);
   results.push(result);console.log(JSON.stringify(result));
  }finally{await context.close();}
 }
 await mkdir('artifacts/gates',{recursive:true});
 await writeFile('artifacts/gates/alpha-idb-scheduling.json',JSON.stringify({runtime:browser.version(),sourceMain:'43d4e7ad42ceb36b12ebd377d3a299173a421f93',synthetic:true,originalCause:'UNKNOWN',results},null,2));
}finally{await browser.close();server.close();}
