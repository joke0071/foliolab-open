// Isolated local server; never inject failures into production.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';
assert.equal(process.env.LIVE_WORKER_DIAGNOSTICS,'1');
const root=resolve('.'),dir=process.env.LIVE_WORKER_DIAGNOSTICS_DIR||'artifacts/gates/worker-diagnostics';
mkdirSync(dir,{recursive:true});
const results=[];
for(const fail of [false,true]){
 const before=new Set(readdirSync(dir));
 const server=createServer((request,response)=>{
  const path=new URL(request.url,'http://localhost').pathname;
  if(fail&&path==='/icons/flask-maskable-512.png'){response.writeHead(503,{'Content-Type':'text/plain','X-FolioLab-QA':'controlled-install-failure'});response.end('SYNTHETIC installation failure');return;}
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(root+'/')){response.writeHead(403);response.end();return;}
  try{const body=readFileSync(file);response.writeHead(200,{'Content-Type':({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[extname(file)]||'application/octet-stream'});response.end(body);}
  catch{response.writeHead(404);response.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,timeout:20000});
 let fixtureError=null,elapsed;
 try{
  const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();page.setDefaultTimeout(20000);
  await page.goto(base+'?page=bookings');
  const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
  const start=Date.now();
  try{await controlledStorageFixture(page,ready,record);}catch(error){fixtureError=error;}
  elapsed=Date.now()-start;
  if(fail){assert.equal(fixtureError?.name,'TimeoutError');assert.ok(elapsed>=19000,'original 20-second deadline remains effective');}
  else assert.equal(fixtureError,null);
  await context.close();
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 const files=readdirSync(dir).filter(name=>!before.has(name)&&name.endsWith('.jsonl'));
 assert.equal(files.length,1);
 const events=readFileSync(dir+'/'+files[0],'utf8').trim().split('\n').map(line=>JSON.parse(line));
 assert.equal(events.filter(e=>e.event==='instrumentationError').length,0,'no missing observation silently accepted');
 assert.ok(events.some(e=>e.event==='workerCaptureReady'));
 const requested=events.filter(e=>e.method==='Network.requestWillBeSent'),responses=events.filter(e=>e.method==='Network.responseReceived');
 assert.ok(requested.some(e=>e.params.request.url===base+'icons/flask-maskable-512.png'));
 assert.ok(responses.some(e=>e.params.response.url===base+'icons/flask-maskable-512.png'&&e.params.response.status===(fail?503:200)));
 const versions=events.filter(e=>e.event==='ServiceWorker.workerVersionUpdated').flatMap(e=>e.versions);
 assert.ok(versions.some(v=>v.status==='installing'));
 assert.ok(versions.some(v=>v.status===(fail?'redundant':'activated')),'actual worker terminal state captured');
 if(fail)assert.equal(versions.some(v=>v.status==='activated'),false);
 results.push({case:fail?'controlled-install-503':'successful-install',result:'PASS',fixture:fixtureError?'expected 20-second timeout':'PASS before/after reload, exact blank record preserved',elapsedMs:elapsed,networkRequests:requested.length,networkResponses:responses.length,states:[...new Set(versions.map(v=>v.status))],file:files[0]});
}
writeFileSync(dir+'/qa-result.json',JSON.stringify({result:'PASS',scope:'synthetic diagnostics validation; no conclusion about historical production cause',results},null,2));
console.log(JSON.stringify(results));
