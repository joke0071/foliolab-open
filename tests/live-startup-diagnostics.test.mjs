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
const liveSource=readFileSync(new URL('./browser-live-acceptance.mjs',import.meta.url),'utf8');
function assertHistoricalLiveContract(source){
 // Require one exact additive offline projection gate. The original
 // contract fingerprint below still seals every pre-existing assertion.
 const projectionGate=source.match(/^ const beforeProjection=await state\(p\);\n[\s\S]*?^ report\.checks\.push\('actual controlled offline projection changes no portfolio data'\);\n/gm);
 assert.equal(projectionGate?.length,1);
 assert.equal(createHash('sha256').update(projectionGate[0]).digest('hex'),'bf79687eca2a0e5b9f2d49779847ddfc0b6d7623fb560bcae15a37e5e0a01144');
 source=source.replace(projectionGate[0],'');
 const sectionNavigationGate=source.match(/^ const sectionLinks=p.getByRole\('navigation',\{name:'Abschnitte im Verlauf'\}\);\n[\s\S]*?^ report\.checks\.push\('actual controlled offline history section links preserve portfolio and projection input'\);\n/gm);
 assert.equal(sectionNavigationGate?.length,1);
 assert.equal(createHash('sha256').update(sectionNavigationGate[0]).digest('hex'),'fd4e5755a4d97c549e10d8772cc620808ed86a75c419dc3ab062b1af3600f656');
 source=source.replace(sectionNavigationGate[0],'');
 const positionPeriodGate=source.match(/^ const shortHistoryId=h\.ids\[0\];\n[\s\S]*?^ report\.checks\.push\('controlled offline position chart shows only evidenced periods and accessible read-only CSV menu'\);\n/gm);
 assert.equal(positionPeriodGate?.length,1);
 assert.equal(createHash('sha256').update(positionPeriodGate[0]).digest('hex'),'4c6571a74b010b110d65c4586f90604d433da1da91424103d451d4b0976e5ae5');
 source=source.replace(positionPeriodGate[0],'');
 const wealthModelGate=source.match(/^ await seedWealthModelHistory\(p\);\n[\s\S]*?^ report\.checks\.push\('controlled offline model history is opt-in, honors gaps and preserves the exact portfolio record'\);\n/gm);
 const wealthModelImport="import {seedWealthModelHistory} from './browser-wealth-model-history.mjs';\n";
 assert.equal(wealthModelGate?.length,1);
 assert.equal(source.split(wealthModelImport).length,2);
 assert.equal(createHash('sha256').update(wealthModelGate[0]).digest('hex'),'25528dfe17f7b02946e87a0e78e59b7091b472034850128486d8713ee3f899eb');
 source=source.replace(wealthModelGate[0],'').replace(wealthModelImport,'');
 const estimateGate=source.match(/^ await historyOptions\.press\('Enter'\);\n[\s\S]*?^ report\.checks\.push\('controlled offline opt-in estimate is graphically distinct and never persists values'\);\n/gm);
 const estimateImport="import {seedHistoryEstimate,verifyHistoryEstimate} from './browser-history-display-estimates.mjs';\n";
 assert.equal(estimateGate?.length,1);
 assert.equal(source.split(estimateImport).length,2);
 assert.equal(createHash('sha256').update(estimateGate[0]).digest('hex'),'6ee1b54c2c8bda9d5739802b8f96078f01ec7c823cbc68bbd78a96ff460c246a');
 source=source.replace(estimateGate[0],'').replace(estimateImport,'');
 // Reverse only the two exact asset-observation deltas; keep every gate byte.
 const assetDiagnosticDeltas=[
  ['assetHashes:[],assetResponses:[],loadedAssets:[]','assetHashes:[],loadedAssets:[]'],
  ["const observation={path,url:url.href,requestedAt:Date.now()};report.assetResponses.push(observation);let r;try{r=await c.request.get(url.href);observation.status=r.status();observation.headers=r.headers();if(r.status()!==200)observation.body=(await r.text()).slice(0,2048);}catch(error){observation.networkError=String(error);throw error;}","const r=await c.request.get(url.href);"]
 ];
 for(const [current,previous] of assetDiagnosticDeltas){assert.equal(source.split(current).length,2,'Exact asset diagnostic delta required once');source=source.replace(current,previous);}
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
}
test('pre-existing live assertions and deadlines remain byte-identical after sealed additive deltas',()=>assertHistoricalLiveContract(liveSource));
test('asset observation contract rejects missing or duplicated diagnostics and unrelated assertion changes',()=>{
 for(const changed of [
  liveSource.replace("await projection.locator('[name=\"start\"]').fill('1000');","await projection.locator('[name=\"start\"]').fill('0');"),
  liveSource.replace("name:'Stichtage'","name:'Rendite'"),
  liveSource.replace('data-position-range="365"','data-position-range="30"'),
  liveSource.replace("'70,00','79,00','88,00','97,00'","'70,00','79,00','90,00','97,00'"),
  liveSource.replace("await verifyHistoryEstimate(p,{scan:()=>scan(p,'#chartPeriods','controlled offline estimated chart overlay')});",''),
  liveSource.replace('assetResponses:[],',''),
  liveSource.replace('assetResponses:[],','assetResponses:[],assetResponses:[],'),
  liveSource.replace('assert.equal(r.status(),200,path);','assert.equal(r.status(),503,path);'),
  liveSource.replace("assert.equal(actual,expected,'published bytes '+path);","assert.equal(actual,actual,'published bytes '+path);")
 ])assert.throws(()=>assertHistoricalLiveContract(changed));
});
