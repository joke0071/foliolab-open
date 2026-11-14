const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(process.env.K4_ROOT),out=path.resolve(process.env.K4_OUT);
const sha='1f05aac57c6f94cdcf2c0a84ba73963e1bb1c728',tree='6ad04c0d9e295b4c8c116fb90a139f7f7c0b0e34';
fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=(n,x)=>fs.writeFileSync(path.join(out,n),typeof x==='string'?x:JSON.stringify(x,null,2));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const report={status:'TEST_SETUP_ERROR',source:sha,tree,scope:'Linux Chromium SIGKILL after committed revision7 only',started:new Date().toISOString(),runtime:{node:process.version,playwright:require('playwright/package.json').version,platform:process.platform,os:require('node:os').release()},preflight:{status:'NOT_RUN'},k4:{status:'NOT_RUN'},processes:[],requests:[]};
const live=new Set();let server;
async function bounded(p,label,ms=15000){let t;try{return await Promise.race([p,new Promise((_,j)=>{t=setTimeout(()=>j(Error(label+' timeout')),ms)})])}finally{clearTimeout(t)}}
async function start(profile,label){
 fs.mkdirSync(profile,{recursive:true});
 const args=['--no-sandbox','--headless','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-dev-shm-usage','about:blank'];
 const child=spawn(process.env.CHROMIUM_EXECUTABLE,args,{stdio:['ignore','pipe','pipe']});
 const row={label,pid:child.pid,profile,args,started:new Date().toISOString(),exit:null};report.processes.push(row);live.add(child);
 const exited=new Promise(resolve=>child.once('exit',(code,signal)=>{row.exit={code,signal,at:new Date().toISOString()};live.delete(child);write('report.json',report);resolve(row.exit)}));
 let stderr='';const endpoint=new Promise((resolve,reject)=>{child.once('error',reject);child.stderr.on('data',b=>{stderr+=b;fs.appendFileSync(path.join(out,label+'.stderr.log'),b);const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)resolve(m[1])});child.once('exit',()=>reject(Error('Browser exited before CDP: '+stderr)))});
 child.stdout.on('data',b=>fs.appendFileSync(path.join(out,label+'.stdout.log'),b));
 const ws=await bounded(endpoint,'launch '+label);const browser=await chromium.connectOverCDP(ws);const ctx=browser.contexts()[0];ctx.setDefaultTimeout(10000);
 row.browser=browser.version();row.procCmdline=fs.readFileSync('/proc/'+child.pid+'/cmdline','utf8').split('\0').filter(Boolean);assert(row.procCmdline.includes('--user-data-dir='+profile));assert(!row.procCmdline.some(x=>x.startsWith('--type=')));
 write('report.json',report);return {child,row,exited,browser,ctx};
}
async function closeProcess(b){const session=await b.browser.newBrowserCDPSession();await session.send('Browser.close').catch(e=>{b.row.closeTransportError=e.message});await bounded(b.exited,'explicit Browser.close exit');assert.equal(b.row.exit.code,0)}
async function kill(b){b.row.signalRequested={signal:'SIGKILL',at:new Date().toISOString(),pid:b.child.pid};assert.equal(b.child.kill('SIGKILL'),true);const exit=await bounded(b.exited,'SIGKILL exit');assert.equal(exit.signal,'SIGKILL');assert.equal(exit.code,null);assert.equal(fs.existsSync('/proc/'+b.child.pid),false);write('report.json',report)}
async function marker(p){return p.evaluate(async()=>{const db=await new Promise((r,j)=>{const q=indexedDB.open('k4-preflight-marker',1);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});try{return await new Promise((r,j)=>{const q=db.transaction('marker').objectStore('marker').get('value');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)})}finally{db.close()}})}
async function state(p){return p.evaluate(async()=>{
 const a=await import('/src/atomic-storage.js'),db=await a.openPortfolioDB();let record;const meta={name:db.name,version:db.version,stores:[...db.objectStoreNames]};try{record=await a.readPortfolioRecord(db)}finally{db.close()}
 const b=await import('/src/browser-portfolio-storage.js');const regs=await navigator.serviceWorker.getRegistrations();
 return {record,recordBytes:JSON.stringify(record),raw:record.raw,settings:record.settings,db:meta,mode:{key:b.MODE_KEY,value:localStorage.getItem(b.MODE_KEY)},serviceWorker:{controller:navigator.serviceWorker.controller?.scriptURL||null,registrations:regs.map(r=>({scope:r.scope,active:r.active?.scriptURL||null,state:r.active?.state||null})),caches:await caches.keys()}};
})}
async function ui(p,label){await p.goto(origin+'/?page=positions');try{await p.waitForFunction(()=>document.querySelector('#portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));const view=await p.locator('#positionsPage').innerText();await p.screenshot({path:path.join(out,label+'.png')});return {storage:await p.locator('#portfolioStorageState').innerText(),view,visible:await p.locator('#positionsPage').isVisible()}}finally{const snapshot=await state(p);report.k4[label==='before'?'before':'after']=snapshot;write(label+'.json',snapshot)}}
let origin;
(async()=>{
 assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),sha);assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),tree);
 const manifest={};for(const f of execFileSync('git',['-C',root,'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean)){const data=fs.readFileSync(path.join(root,f));manifest[f]={sha256:hash(data),bytes:data.length}}
 write('source-manifest.json',manifest);
 server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;if(name==='/seed'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>K4 synthetic seed</title>');return}const file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+'/')||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}const data=fs.readFileSync(file);report.requests.push({path:path.relative(root,file),sha256:hash(data),bytes:data.length});res.setHeader('Content-Type',({js:'application/javascript',mjs:'application/javascript',html:'text/html',css:'text/css',webmanifest:'application/manifest+json',png:'image/png',svg:'image/svg+xml'})[file.split('.').pop()]||'application/octet-stream');res.end(data)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;report.origin=origin;
 // Same job, disposable profile. Failure prevents any product fixture setup.
 const disposable=path.join(process.env.RUNNER_TEMP,'k4-disposable-'+process.env.GITHUB_RUN_ID);
 let b=await start(disposable,'pre-before');let p=await b.ctx.newPage();await p.goto(origin+'/seed');await p.evaluate(async()=>{const db=await new Promise((r,j)=>{const q=indexedDB.open('k4-preflight-marker',1);q.onupgradeneeded=()=>q.result.createObjectStore('marker');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});await new Promise((r,j)=>{const tx=db.transaction('marker','readwrite',{durability:'strict'});tx.objectStore('marker').put('synthetic-marker-v1','value');tx.oncomplete=r;tx.onabort=()=>j(tx.error)});db.close()});report.preflight.beforeMarker=await marker(p);assert.equal(report.preflight.beforeMarker,'synthetic-marker-v1');await kill(b);
 let r=await start(disposable,'pre-after');assert.notEqual(r.row.pid,b.row.pid);p=await r.ctx.newPage();await p.goto(origin+'/seed');report.preflight.afterMarker=await marker(p);assert.equal(report.preflight.afterMarker,'synthetic-marker-v1');report.preflight.status='PASS';await closeProcess(r);write('report.json',report);
 // Fresh persistent profile and unchanged native revision7 setup from run43603315041.
 const profile=path.join(process.env.RUNNER_TEMP,'k4-product-'+process.env.GITHUB_RUN_ID);b=await start(profile,'k4-before');
 await b.ctx.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 p=await b.ctx.newPage();await p.goto(origin+'/seed');
 report.k4.oracle={revision:7,provider:'p',account:'a',asset:'asset',name:'Synthetic ETF',quantity:2,quantityExact:'2',price:100,priceExact:'100',currency:'EUR',totalEUR:'200',settings:'exactly unchanged from confirmed pre-crash record'};write('oracle.json',report.k4.oracle);
 report.k4.setup=await p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{fixture}=await import('/tests/restore-position-fixture.mjs');const store=new PortfolioStorage();await store.initialize();const m=fixture();for(let i=1;i<7;i++)await store.save(m);return {fixture:m,confirmedSaves:6}});write('fixture.json',report.k4.setup);
 report.k4.beforeUI=await ui(p,'before');report.k4.before=await state(p);write('before.json',report.k4.before);assert.equal(report.k4.before.record.revision,7);assert.equal(report.k4.before.mode.value,'idb-v1');
 const m=JSON.parse(report.k4.before.raw),pos=m.positions[0];assert.deepEqual([pos.id,pos.name,pos.quantity,pos.quantityExact,pos.price,pos.priceExact,pos.currency],['asset','Synthetic ETF',2,'2',100,'100','EUR']);
 assert.match(report.k4.beforeUI.view,/Synthetic ETF/);assert.match(report.k4.beforeUI.view,/(?:^|\n)€\u00a0200,00(?:\n|$)/);assert(report.k4.beforeUI.visible);
 report.k4.commitConfirmedAt=new Date().toISOString();write('report.json',report);await kill(b);
 r=await start(profile,'k4-after');assert.notEqual(r.row.pid,b.row.pid);await r.ctx.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());p=await r.ctx.newPage();
 report.k4.afterUI=await ui(p,'after');report.k4.after=await state(p);write('after.json',report.k4.after);
 report.k4.comparison={sameProfile:r.row.profile===b.row.profile,newPID:r.row.pid!==b.row.pid,recordBytes:report.k4.after.recordBytes===report.k4.before.recordBytes,raw:report.k4.after.raw===report.k4.before.raw,settings:JSON.stringify(report.k4.after.settings)===JSON.stringify(report.k4.before.settings),revision:report.k4.after.record.revision};write('comparison.json',report.k4.comparison);
 assert.deepEqual(report.k4.after.record,report.k4.before.record);assert.equal(report.k4.after.recordBytes,report.k4.before.recordBytes);assert.equal(report.k4.after.record.revision,7);assert.equal(report.k4.after.mode.value,'idb-v1');assert.match(report.k4.afterUI.view,/Synthetic ETF/);assert.match(report.k4.afterUI.view,/(?:^|\n)€\u00a0200,00(?:\n|$)/);assert(report.k4.afterUI.visible);
 for(const request of report.requests)assert.equal(request.sha256,manifest[request.path].sha256);report.k4.status='PASS';report.status='PASS';await closeProcess(r);
})().catch(e=>{report.error=e.stack;report.failureStage=report.preflight.status==='PASS'?'K4':'PREFLIGHT';report.status='TEST_SETUP_ERROR_OR_PRODUCT_DEVIATION_REQUIRES_REVIEW';process.exitCode=1}).finally(async()=>{for(const c of live){c.kill('SIGKILL')}report.completed=new Date().toISOString();write('report.json',report);if(server)await new Promise(r=>server.close(r));console.log(JSON.stringify({status:report.status,preflight:report.preflight.status,k4:report.k4.status,error:report.error}));});
