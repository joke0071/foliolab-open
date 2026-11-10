import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {diagnosticURL,observeLiveStartup} from './live-startup-diagnostics.mjs';
const base='https://example.test/';
function page(evaluate){const handlers={};return {handlers,on(name,fn){handlers[name]=fn;},async addInitScript(){},evaluate};}
test('failure request evidence removes credentials, query and fragment and rejects other origins',()=>{
 assert.equal(diagnosticURL('https://user:password@example.test/src/app.js?key=secret#private',base),'https://example.test/src/app.js');
 assert.equal(diagnosticURL('https://other.test/secret',base),null);
 assert.equal(diagnosticURL('https://[invalid',base),null);
});
test('pending, failed and HTTP errors are distinguished without retaining request objects or query secrets',async()=>{
 const p=page(async()=>({startup:{text:'Lokale Daten werden vorbereitet …'},mobileNav:{buttons:0}}));const capture=await observeLiveStartup(p,base);
 const req=n=>({url:()=>base+'src/'+n+'.js?token=secret',resourceType:()=>'script',failure:()=>({errorText:'net::ERR_FAILED'})});
 const pending=req('pending'),finished=req('finished'),failed=req('failed');for(const r of [pending,finished,failed])p.handlers.request(r);p.handlers.requestfinished(finished);p.handlers.requestfailed(failed);
 p.handlers.response({url:()=>base+'src/bad.js?key=secret',status:()=>503});
 const r=await capture();assert.equal(r.pendingCount,1);assert.equal(r.pendingRequests[0].url,base+'src/pending.js');assert.equal(r.failedRequests[0].url,base+'src/failed.js');assert.deepEqual(r.badResponses,[{url:base+'src/bad.js',status:503}]);assert.equal(JSON.stringify(r).includes('secret'),false);assert.equal(r.state.mobileNav.buttons,0);
});
test('failed-request evidence is bounded even when the browser produces many errors',async()=>{
 const p=page(async()=>({}));const capture=await observeLiveStartup(p,base);
 for(let i=0;i<80;i++)p.handlers.requestfailed({url:()=>base+i,resourceType:()=>'script',failure:()=>({errorText:'failed'})});
 assert.equal((await capture()).failedRequests.length,30);
});
test('the full 152-asset startup graph is retained so a late pending module is not hidden',async()=>{
 const p=page(async()=>({}));const capture=await observeLiveStartup(p,base);
 for(let i=0;i<151;i++)p.handlers.request({url:()=>base+'src/module-'+i+'.js',resourceType:()=>'script'});
 p.handlers.request({url:()=>base+'src/atomic-storage.js',resourceType:()=>'script'});
 const report=await capture();assert.equal(report.pendingCount,152);assert.ok(report.pendingRequests.some(r=>r.url.endsWith('/atomic-storage.js')));
});
test('closed or unresponsive page cannot replace the original gate result with a successful snapshot',async()=>{
 const closed=await observeLiveStartup(page(async()=>{throw Error('page closed');}),base);assert.match((await closed()).state.captureError,/page closed/);
 const hung=await observeLiveStartup(page(()=>new Promise(()=>{})),base,{captureBudget:10});assert.match((await hung()).state.captureError,/exceeded diagnostic budget/);
});
test('pre-existing live assertions and deadlines remain byte-identical except the explicit K2 frequency transport',()=>{
 let source=readFileSync(new URL('./browser-live-acceptance.mjs',import.meta.url),'utf8');
 const additions=["import {observeLiveStartup} from './live-startup-diagnostics.mjs';\n",'let diagnoseStartup=null;\n',' diagnoseStartup=await observeLiveStartup(p,base);\n','if(diagnoseStartup)report.startupDiagnostics=await diagnoseStartup();'];
 for(const line of additions){assert.equal(source.split(line).length,2);source=source.replace(line,'');}
 // The checkbox became one canonical frequency select. Require these exact
 // replacements, then retain the original hash for every unrelated gate byte.
 const frequencyDeltas=[
  ["await p.locator('#autoRefresh').selectOption('off');await p.waitForFunction(()=>document.getElementById('autoRefresh').value==='off');","await p.locator('#autoRefresh').uncheck();await p.waitForFunction(()=>!document.getElementById('autoRefresh').checked);"],
  ["assert.equal(restored.settings.autoRefresh,'off');","assert.equal(restored.settings.autoRefresh,false);"]
 ];
 for(const [current,previous] of frequencyDeltas){assert.equal(source.split(current).length,2);source=source.replace(current,previous);}
 assert.equal(createHash('sha256').update(source).digest('hex'),'f5fa53b9d3272b2ea0f16f38e9730b25288d906383d115864e7732c92965a7c3');
});
