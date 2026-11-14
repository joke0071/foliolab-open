const {chromium}=require('playwright');
const fs=require('node:fs'), http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve('k4'),out=path.resolve('native/evidence'),pw='SYNTHETIC_PASSWORD';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const write=(name,value)=>fs.writeFileSync(path.join(out,name),typeof value==='string'?value:JSON.stringify(value,null,2));
const server=http.createServer((req,res)=>{
 let name=new URL(req.url,'http://localhost').pathname;
 if(name==='/seed'){res.end('<!doctype html><title>Native fixture</title>');return}
 let file=path.join(root,name==='/'?'index.html':name);
 if(!file.startsWith(root+'/')||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'js':'application/javascript','mjs':'application/javascript','html':'text/html','css':'text/css','webmanifest':'application/manifest+json','png':'image/png'})[file.split('.').pop()]||'application/octet-stream');res.end(fs.readFileSync(file));
});
async function record(p){return p.evaluate(async()=>{const m=await import('/src/atomic-storage.js');const db=await m.openPortfolioDB();try{return await m.readPortfolioRecord(db)}finally{db.close()}})}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true});
 const results=[];try{
 write('runtime.json',{chromium:browser.version(),node:process.version,playwright:require('playwright/package.json').version,candidate:'5db3803509cfd0824dad5dd12532a1168c161e32',platform:process.platform});
 const generator=await browser.newContext();const gen=await generator.newPage();await gen.goto(url+'/seed');
 const fixtures=await gen.evaluate(async pw=>{
 const {fixture}=await import('/tests/restore-position-fixture.mjs'),v=await import('/src/backup-vault.js'),{createCompleteBackup}=await import('/src/complete-backup.js');
 await v.configureBackupPassword(pw,pw);let result={};
 for(const variant of ['valid','unknown','quantity','fx']){
 const payload=createCompleteBackup(fixture()),p=payload.data.positions[0];Object.assign(p,{price:123.45,priceExact:'123.45'});
 if(variant==='unknown')Object.assign(p,{quantity:17,quantityExact:'17.000000000000000005',currency:'USD',fxRate:null,fxRateExact:'UNKNOWN'});
 if(variant==='quantity')p.quantityExact=[3];
 if(variant==='fx')Object.assign(p,{currency:'USD',fxRate:[1.2],fxRateExact:[1.2]});
 result[variant]=await v.encryptWithBackupPassword(JSON.stringify(payload));
 }return result},pw);await generator.close();
 for(const [k,v] of Object.entries(fixtures))write(k+'.encrypted.json',v);
 for(const scenario of ['valid','unknown','quantity','fx','conflict','vault','display'])for(const route of ['file','drive']){
 const key=route+'-'+scenario,bytes=fixtures[scenario]||fixtures.valid,ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:1120,height:840}});ctx.setDefaultTimeout(8000);
 const receipt={key,inputSHA256:hash(bytes),dialogs:[],media:[],errors:[]};let p;
 try{
 await ctx.addInitScript(()=>{window.google={accounts:{oauth2:{initTokenClient(){return {requestAccessToken(){this.callback({access_token:'SYNTHETIC',expires_in:3600})}}}}}}});
 await ctx.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin===url)return r.continue();
 if(u.hostname!=='www.googleapis.com'||r.request().method()!=='GET')return r.abort();
 let body;if(u.searchParams.get('alt')==='media'){receipt.media.push(hash(bytes));body=bytes}
 else body=JSON.stringify({files:u.searchParams.get('q')?.includes('in parents')?[{id:'backup123456789',name:'FolioLab-2026-11-14T00-00-00Z.encrypted.json',appProperties:{foliolabBackup:'foliolab-open-v3'}}]:[{id:'folder123456789',name:'FolioLab Backups'}]});
 return r.fulfill({body,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'}})});
 const other=await ctx.newPage();await other.goto(url+'/seed');
 await other.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{fixture}=await import('/tests/restore-position-fixture.mjs');
 const store=new PortfolioStorage();await store.initialize();const m=fixture();for(let i=1;i<7;i++)await store.save(m);
 window.newer=async()=>{m.positions[0].name='Newer tab';await store.save(m)};
 localStorage.setItem('foliolab-open-drive-backup-settings-v1',JSON.stringify({clientId:'123456789-abc.apps.googleusercontent.com',mode:'off',retention:3}));});
 receipt.before=await record(other);assert.equal(receipt.before.revision,7);
 p=await ctx.newPage();p.on('pageerror',e=>receipt.errors.push(e.message));p.on('dialog',async d=>{receipt.dialogs.push(d.message());await d.accept(d.type()==='prompt'?pw:undefined)});
 await p.goto(url+'/?page=more');await p.waitForFunction(()=>document.querySelector('#portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 await p.evaluate(()=>{document.querySelector('[name=coinGeckoKey]').value='SYNTHETIC_DRAFT';});
 if(route==='drive'){
 await p.evaluate(()=>{for(let n=document.querySelector('#driveRestore');n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;});
 await p.locator('#driveConnect').click();await p.waitForFunction(()=>document.querySelector('#driveBackupSelect').value==='backup123456789');await p.locator('#driveRecoveryInput').fill(pw);}
 if(scenario==='conflict'){
 await p.exposeFunction('commitInOtherTab',async()=>{await other.evaluate(()=>window.newer());receipt.winner=await record(other)});
 await p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const save=PortfolioStorage.prototype.save;PortfolioStorage.prototype.save=async function(m){PortfolioStorage.prototype.save=save;await window.commitInOtherTab();return save.call(this,m)}});
 }
 if(scenario==='vault')await p.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){const req=put.apply(this,args);if(this.transaction.db.name==='foliolab-open-backup-password-v1'){this.transaction.abort();window.fault='vault abort'}return req}});
 if(scenario==='display')await p.evaluate(route=>{const node=document.getElementById(route==='file'?'toast':'driveBackupStatus');const desc=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');Object.defineProperty(node,'textContent',{configurable:true,get(){return desc.get.call(this)},set(v){if(!window.fault&&/^(Backup wiederhergestellt|Drive-Backup wiederhergestellt)/.test(v)){window.fault='final status';throw Error('SYNTHETIC_DISPLAY_FAILURE')}desc.set.call(this,v)}})},route);
 if(route==='file')await p.locator('#backupFile').setInputFiles({name:'synthetic.encrypted.json',mimeType:'application/json',buffer:Buffer.from(bytes)});else await p.locator('#driveRestore').click();
 const selector=route==='file'?'#toast':'#driveBackupStatus';
 const pattern=({valid:'wiederhergestellt',unknown:'wiederhergestellt',quantity:'Positionsmenge',fx:'Wechselkurs',conflict:'anderen Tab',vault:'nicht erneut importieren',display:'nicht erneut importieren'})[scenario];
 await p.waitForFunction(({selector,pattern})=>new RegExp(pattern,'i').test(document.querySelector(selector).textContent),{selector,pattern});
 receipt.notice=await p.locator(selector).innerText();assert(await p.locator(selector).isVisible());receipt.draft=await p.locator('[name=coinGeckoKey]').inputValue();assert.equal(receipt.draft,'SYNTHETIC_DRAFT');
 receipt.after=await record(other);receipt.fault=await p.evaluate(()=>window.fault||null);
 if(route==='drive')assert.deepEqual(receipt.media,[hash(bytes)]);
 if(scenario==='vault')assert.equal(receipt.fault,'vault abort');if(scenario==='display')assert.equal(receipt.fault,'final status');
 await p.locator(selector).scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'cases',key+'.png')});
 await p.evaluate(()=>document.querySelector('[data-page="positions"]').click());receipt.openView=await p.locator('#positionsPage').innerText();
 await p.close();p=await ctx.newPage();await p.goto(url+'/?page=positions');await p.waitForFunction(()=>document.querySelector('#portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));receipt.reopened=await record(p);assert.deepEqual(receipt.reopened,receipt.after);receipt.reopenedView=await p.locator('#positionsPage').innerText();
 const m=JSON.parse(receipt.reopened.raw),pos=m.positions[0];receipt.values=await p.evaluate(async raw=>{const m=await import('/src/model.js');return m.totalExactEUR(m.safeImport(JSON.parse(raw)))},receipt.reopened.raw);
 if(['quantity','fx'].includes(scenario)){assert.deepEqual(receipt.after,receipt.before);assert.equal(receipt.values,'200')}
 else if(scenario==='conflict'){assert.deepEqual(receipt.after,receipt.winner);assert.equal(receipt.after.revision,8);assert.equal(receipt.values,'200');for(const view of [receipt.openView,receipt.reopenedView])assert.match(view,/Newer tab/)}
 else {assert.equal(receipt.after.revision,8);assert.deepEqual([pos.quantity,pos.quantityExact,pos.price,pos.priceExact,pos.currency,pos.fxRate,pos.fxRateExact,receipt.values],scenario==='unknown'?[17,'17.000000000000000005',123.45,'123.45','USD',null,'UNKNOWN',null]:[2,'2',123.45,'123.45','EUR',1,'1','246.9']);assert.deepEqual(receipt.after.settings,receipt.before.settings)}
 assert.deepEqual(receipt.errors,[]);receipt.status='PASS';
 }catch(e){receipt.status='FAIL';receipt.error=e.stack;if(p&&!p.isClosed())receipt.diagnostic=await p.locator('body').innerText().catch(()=>null)}
 finally{write('cases/'+key+'.json',receipt);results.push([key,receipt.status,receipt.error?.split('\n')[0]]);console.log(results.at(-1));await ctx.close();}
 }
 write('results.json',results);if(results.some(x=>x[1]!=='PASS'))process.exitCode=1;
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
