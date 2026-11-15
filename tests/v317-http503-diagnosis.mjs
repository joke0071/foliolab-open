import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const out='artifacts/v317-http503';mkdirSync(out,{recursive:true});
const base='https://foliolab.unperfekt.at/',release='a53856e385ef1d9fd65d8710618244e80b8341e7';
const hash=b=>createHash('sha256').update(b).digest('hex');
const sw=readFileSync('sw.js','utf8'),assets=JSON.parse(sw.match(/const ASSETS=(\[[^\n]+\]);/)[1].replaceAll("'",'"')),paths=[...assets,'./sw.js'];
const report={release,diagnosticHead:process.env.GITHUB_SHA,originalRun:43713836553,originalJob:132819643122,originalFailure:'wallet-visibility.js HTTP503; original response headers/body unavailable',original503RootCause:'UNKNOWN; successful current probes do not retrospectively identify the original edge cause',startedAt:new Date().toISOString(),node:process.version,httpsProxyPresent:!!process.env.HTTPS_PROXY,productHashes:{'src/app.js':hash(readFileSync('src/app.js')),'sw.js':hash(Buffer.from(sw))},parallelism:8,parallel:[],controls:[],pageResponses:[],failures:[],result:'PENDING'};
assert.equal(report.httpsProxyPresent,false,'same ordinary TLS prerequisite as original');
assert.equal(report.productHashes['src/app.js'],'1670dc517cab83bd134b66e44554e54c2d24d27431d6f8122d8cbacfaf2318e0');
assert.equal(report.productHashes['sw.js'],'87a78a1b47651b89a801c97fcf117d93ce80a2fc0727b4b9b3c90815fdc6d706');
const persist=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
persist();const browser=await chromium.launch({headless:true});let context;
try{
 report.browserVersion=browser.version();context=await browser.newContext({viewport:{width:390,height:900},acceptDownloads:true});
 const p=await context.newPage();await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 p.on('response',r=>{if(r.url().includes('wallet-visibility.js'))report.pageResponses.push({url:r.url(),status:r.status(),headers:r.headers()});});
 const response=await p.goto(base,{waitUntil:'networkidle'});report.navigation={url:p.url(),status:response.status()};
 const probe=async(path,query=true)=>{
  const url=new URL(path,base);if(query)url.searchParams.set('release-check',release);
  const start=Date.now(),entry={path,url:url.href,query,startedAt:new Date(start).toISOString()};
  try{const r=await context.request.get(url.href);entry.status=r.status();entry.headers=r.headers();const body=await r.body();entry.bytes=body.length;entry.sha256=hash(body);entry.expectedSHA256=hash(readFileSync(path==='./'?'index.html':path.replace(/^\.\//,'')));entry.matches=entry.status===200&&entry.sha256===entry.expectedSHA256;if(entry.status!==200)entry.errorBody=body.subarray(0,8192).toString('utf8');}
  catch(error){entry.error=String(error);entry.matches=false;}
  entry.elapsedMs=Date.now()-start;return entry;
 };
 let next=0;await Promise.all(Array.from({length:8},async()=>{while(next<paths.length){const path=paths[next++];report.parallel.push(await probe(path));persist();}}));
 for(const [path,query]of [['./src/wallet-visibility.js',true],['./src/wallet-visibility.js',false],['./sw.js',true]]){report.controls.push(await probe(path,query));persist();}
 report.startup=await p.evaluate(()=>({url:location.href,ready:document.getElementById('appStartup')?.hidden,storage:document.getElementById('portfolioStorageState')?.textContent}));
 await p.screenshot({path:out+'/fresh-empty-production.png',fullPage:true});
 report.failures=[...report.parallel,...report.controls].filter(r=>!r.matches);report.result=report.failures.length?'FAIL':'PASS';report.finishedAt=new Date().toISOString();persist();
 assert.equal(report.parallel.length,155);assert.deepEqual(report.failures,[],'current published bytes and HTTP availability, no request retries');
 console.log('V317_HTTP503_DIAG '+JSON.stringify({result:report.result,parallelRequests:report.parallel.length,controls:report.controls.length,browser:report.browserVersion,originalRootCause:report.original503RootCause}));
}finally{await context?.close();await browser.close();persist();}
