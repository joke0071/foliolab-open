import assert from 'node:assert/strict';
import {firefox} from 'playwright';
import {installAlphaIDBLifecycleProbe} from '../../tests/alpha-idb-lifecycle-probe.mjs';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('.');
const server=createServer(async(req,res)=>{try{if(req.url==='/probe'){res.setHeader('content-type','text/html');res.end('<!doctype html><title>Synthetic IDB lifecycle</title>');return;}const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);assert.ok(path.startsWith(root+'/'));res.setHeader('content-type',path.endsWith('.js')?'text/javascript':'text/plain');res.end(await readFile(path));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await firefox.launch({headless:true}),results=[];
try{
 for(const scenario of ['normal','queued-upgrade','queued-delete','version-error']){
  const context=await browser.newContext();await context.addInitScript(installAlphaIDBLifecycleProbe);const page=await context.newPage();
  try{
   await page.goto(base+'/probe');
   const result=await page.evaluate(async scenario=>{
    const {alphaCache}=await import('/src/alpha-vantage.js'),name='foliolab-open-market-cache';
    const success=request=>new Promise((resolve,reject)=>{request.addEventListener('success',()=>resolve(request.result));request.addEventListener('error',()=>reject(request.error));});
    if(scenario==='normal'){
     const s=alphaCache();await s.update('synthetic',()=>({value:7}));const value=await s.read('synthetic');await s.clear();
     return {scenario,value,afterClear:await s.read('synthetic')??null,state:__foliolabAlphaIDBProbe.snapshot()};
    }
    const initial=indexedDB.open(name,scenario==='version-error'?2:1);initial.onupgradeneeded=()=>initial.result.createObjectStore('cache');const held=await success(initial);
    if(scenario==='version-error'){
     held.close();let error=null;try{await alphaCache().read('synthetic');}catch(e){error=e.message;}
     return {scenario,error,state:__foliolabAlphaIDBProbe.snapshot()};
    }
    // Deliberately retain v1 through versionchange: a controlled queue blocker.
    const blocker=scenario==='queued-upgrade'?indexedDB.open(name,2):indexedDB.deleteDatabase(name),blockerDone=success(blocker);
    await new Promise(resolve=>blocker.addEventListener('blocked',resolve));
    let lateResolve;const late=new Promise(resolve=>lateResolve=resolve);let changes=0;
    const factory={open(...args){const r=indexedDB.open(...args);r.addEventListener('success',()=>lateResolve({type:'success'}));r.addEventListener('error',()=>lateResolve({type:'error',name:r.error.name}));return r;}};
    let error=null;const started=performance.now();
    try{await alphaCache(factory).update('synthetic',()=>{changes++;return {value:9};});}catch(e){error=e.message;}
    const elapsed=performance.now()-started,beforeRelease=__foliolabAlphaIDBProbe.snapshot();
    held.close();const upgraded=await blockerDone;if(upgraded)upgraded.close();const lateResult=await late;
    // Promise callbacks can resume between native event listeners. Observe the
    // next task after the unchanged product's late-close handler has run.
    // This is observation only: no retry or second Alpha operation.
    await new Promise(resolve=>setTimeout(resolve,0));
    return {scenario,error,elapsed,changes,beforeRelease,lateResult,state:__foliolabAlphaIDBProbe.snapshot()};
   },scenario);
   if(scenario==='normal'){assert.deepEqual(result.value,{value:7});assert.equal(result.afterClear,null);assert.ok(result.state.events.some(e=>e.type==='upgradeneeded'));}
   else{
    assert.match(result.error,/Kurscache nicht verfügbar/);
    if(scenario==='version-error')assert.ok(result.state.events.some(e=>e.type==='error'&&e.errorName==='VersionError'));
    else{
     assert.ok(result.elapsed>=4900);assert.equal(result.changes,0);assert.equal(result.beforeRelease.pending.filter(x=>x.kind==='open').length,scenario==='queued-upgrade'?2:1);
     const queued=result.beforeRelease.pending.at(-1).id;assert.ok(!result.beforeRelease.events.some(e=>e.id===queued&&['blocked','error','success','upgradeneeded'].includes(e.type)));
     assert.equal(result.lateResult.type,scenario==='queued-upgrade'?'error':'success');
     if(scenario==='queued-delete')assert.ok(result.state.events.some(e=>e.type==='close-call'&&e.id===queued));
    }
   }
   results.push({...result,result:'PASS'});console.log(scenario+' PASS'+(result.elapsed?' '+Math.round(result.elapsed)+'ms':''));
  }finally{await context.close();}
 }
 await mkdir('artifacts/gates',{recursive:true});await writeFile('artifacts/gates/alpha-idb-lifecycle.json',JSON.stringify({result:'PASS',synthetic:true,sourceMain:'43d4e7ad42ceb36b12ebd377d3a299173a421f93',runtime:browser.version(),originalFailureCause:'UNKNOWN; controlled queue mechanisms are not evidence they occurred in CI',results},null,2));
}finally{await browser.close();server.close();}
