import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.ETF_SOURCE_BASE||'http://127.0.0.1:4173/',engines=(process.env.ETF_SOURCE_ENGINES||'chromium').split(','),results=[];
const password='Synthetic-retirement-password-123';
const deadline=setTimeout(()=>{console.error('Provider-retirement suite deadline exceeded');process.exit(1);},180000);
for(const engine of engines){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',acceptDownloads:true}),page=await context.newPage(),requests=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));await context.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===new URL(base).origin)return route.continue();requests.push(u.hostname);return route.fulfill({status:503,contentType:'application/json',body:'{}'});});
 const ready=p=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const record=p=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 try{
  await page.goto(base);await ready(page);
  console.log(engine+': retirement seed/abort check');
  const original=await page.evaluate(async()=>{
   const {blankModel,backup,createProvider,createAccount,createPosition}=await import('/src/model.js'),{openPortfolioDB,retirePortfolioCredentials,readPortfolioRecord}=await import('/src/atomic-storage.js');
   const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic retirement broker'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic depot',type:'securities'},m));m.positions.push(createPosition({id:'asset',providerId:'p',accountId:'a',kind:'etf',name:'Vanguard FTSE All-World',symbol:'VWCE',isin:'IE00BK5BQT80',mic:'XETR',exchange:'Xetra',quantity:'1.123456789012345678',price:100,quoteSource:'FMP',quoteAsOf:'2026-10-30',fmpSymbol:'VWCE.DE',eodhdSymbol:'VWCE.XETRA'},m));
   const settings={...m.settings,autoRefresh:false,securitySource:'twelve',fmpKey:'SYNTHETIC_REMOVED_FMP',twelveKey:'SYNTHETIC_REMOVED_TWELVE',eodhdKey:'SYNTHETIC_REMOVED_EODHD',alphaVantageKey:'SYNTHETIC_ACTIVE_ALPHA',marketstackKey:'SYNTHETIC_ACTIVE_MARKETSTACK',coinGeckoKey:'SYNTHETIC_ACTIVE_CG',eodhdWorkerEndpoint:'https://own.workers.dev',eodhdWorkerAccessToken:'SYNTHETIC_ACTIVE_WORKER_TOKEN_12345'};
   const db=await openPortfolioDB(),original={schemaVersion:1,revision:7,raw:backup(m),settings,deleted:false,updatedAt:'2026-10-30T12:00:00Z'};
   await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put(original,'portfolio');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});
   const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('synthetic quota','QuotaExceededError');};
   let rejected=false;try{await retirePortfolioCredentials(db,7);}catch{rejected=true;}finally{IDBObjectStore.prototype.put=put;}if(!rejected)throw Error('Quota must reject retirement');
   const after=await readPortfolioRecord(db);if(JSON.stringify(after)!==JSON.stringify(original))throw Error('Aborted cleanup changed stored bytes');db.close();return original;
  });
  console.log(engine+': retirement physical cleanup');
  await page.reload();await ready(page);const clean=await record(page);assert.equal(clean.revision,8);assert.equal(clean.raw,original.raw,'Credential-only IDB cleanup must preserve exact financial bytes');
  for(const key of ['fmpKey','twelveKey','eodhdKey'])assert.equal(Object.hasOwn(clean.settings,key),false);assert.equal(clean.settings.securitySource,'auto');assert.equal(clean.settings.eodhdWorkerAccessToken,original.settings.eodhdWorkerAccessToken);assert.equal(clean.settings.marketstackKey,original.settings.marketstackKey);
  const stale=await page.evaluate(async settings=>{const {openPortfolioDB,commitPortfolioRecord,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{const current=await readPortfolioRecord(db);try{await commitPortfolioRecord(db,{expectedRevision:7,raw:current.raw,settings});return false;}catch(e){return /anderen Tab/.test(e.message);}}finally{db.close();}},original.settings);assert.equal(stale,true);assert.deepEqual(await record(page),clean);
  await page.reload();await ready(page);assert.deepEqual(await record(page),clean,'Repeated startup has no cleanup write');
  await page.locator('#mobileNav [data-page="more"]').click();await page.locator('#marketSettings').evaluate(e=>e.open=true);
  assert.equal(await page.locator('[name=fmpKey],[name=twelveKey],[name=eodhdKey]').count(),0);assert.equal(await page.locator('[name=securitySource] option[value=fmp],[name=securitySource] option[value=twelve]').count(),0);
  const beforeEyes=await record(page);for(const name of ['alphaVantageKey','marketstackKey']){const input=page.locator('[name='+name+']'),value=await input.inputValue();await input.locator('xpath=following-sibling::button').click();assert.equal(await input.inputValue(),value);await input.locator('xpath=following-sibling::button').click();}assert.deepEqual(await record(page),beforeEyes);
  for(const width of [320,360,390,412,430,768,1440]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));if(width===320||width===1440){mkdirSync('artifacts/gates/provider-retirement',{recursive:true});await page.locator('#marketSettings').screenshot({path:'artifacts/gates/provider-retirement/'+engine+'-'+width+'.png'});}}
  assert.deepEqual((await page.evaluate(()=>axe.run(document.querySelector('#morePage'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}))).violations.map(x=>x.id),[]);
  // Legacy encrypted input deliberately bypasses the new writer to represent a genuine pre-retirement backup.
  console.log(engine+': retirement encrypted restore/reexport');
  const encrypted=await page.evaluate(async({original,password})=>{const {configureBackupPassword,encryptWithBackupPassword}=await import('/src/backup-vault.js');await configureBackupPassword(password,password);return encryptWithBackupPassword(JSON.stringify({kind:'FolioLabCompleteBackup',backupVersion:1,data:JSON.parse(original.raw),configuration:{settings:original.settings,drive:{}}}));},{original,password});
  const fresh=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',acceptDownloads:true}),restored=await fresh.newPage();
  try{
   await fresh.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
   restored.on('dialog',d=>d.accept(d.type()==='prompt'?password:undefined));await restored.goto(base);await ready(restored);await restored.locator('#backupFile').setInputFiles({name:'synthetic-legacy-providers.json',mimeType:'application/json',buffer:Buffer.from(encrypted)});await restored.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Backup wiederhergestellt'));
   const restoredRecord=await record(restored);assert.deepEqual(JSON.parse(restoredRecord.raw).positions,JSON.parse(original.raw).positions);assert.ok(!JSON.stringify(restoredRecord).includes('SYNTHETIC_REMOVED'));assert.equal(restoredRecord.settings.alphaVantageKey,original.settings.alphaVantageKey);
   await restored.reload();await ready(restored);assert.deepEqual(await record(restored),restoredRecord);
   await fresh.setOffline(true);await restored.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();try{const m=await s.initialize();m.settings.fmpKey='SYNTHETIC_REMOVED_OFFLINE';await s.save(m);}finally{s.close();}});await fresh.setOffline(false);assert.ok(!JSON.stringify(await record(restored)).includes('SYNTHETIC_REMOVED'));
   await restored.locator('#mobileNav [data-page="more"]').click();await restored.locator('#backupPasswordSetup').evaluate(e=>e.open=true);await restored.locator('#fullBackupIncludeSettings').check();await restored.waitForFunction(()=>!document.getElementById('exportEncryptedBackup').disabled);
   const event=restored.waitForEvent('download');await restored.locator('#exportEncryptedBackup').click();const download=await event;const stream=await download.createReadStream(),chunks=[];for await(const c of stream)chunks.push(c);const bytes=Buffer.concat(chunks).toString();
   const output=await restored.evaluate(async({bytes,password})=>{const {decryptPasswordBackup}=await import('/src/backup-vault.js');return JSON.parse(await decryptPasswordBackup(JSON.parse(bytes),password));},{bytes,password});assert.ok(!JSON.stringify(output).includes('SYNTHETIC_REMOVED'));assert.equal(output.configuration.settings.alphaVantageKey,original.settings.alphaVantageKey);assert.deepEqual(output.data.positions,JSON.parse(original.raw).positions);
  }finally{await fresh.close();}
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[],'No startup/provider probe consumes quota');results.push({engine,physicalCleanup:true,financialBytesUnchanged:true,quotaRollback:true,oldRevisionRejected:true,idempotentStartup:true,legacyEncryptedUIRestore:true,actualEncryptedUIReexport:true,offlineSave:true,widths:7,axeViolations:0,providerRequests:0});console.log(engine+': retired provider physical IDB/CAS/quota/legacy v2 UI restore+reexport/offline/7 widths/Axe PASS');
 }finally{await context.close();await browser.close();}
}
mkdirSync('artifacts/gates',{recursive:true});writeFileSync('artifacts/gates/provider-retirement.json',JSON.stringify({base,results},null,2));

clearTimeout(deadline);
