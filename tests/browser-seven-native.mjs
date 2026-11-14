// Isolated network fixtures; actual app UI, locks, CAS, IDB commits and readback.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base='http://127.0.0.1:4173',dir='artifacts/seven-native';
const product='883c4eb0e8137040a9f6bfd2e193bc5833aac0c2';
assert.match(process.env.FOLIOLAB_TEST_SHA||'',/^[0-9a-f]{40}$/);
await mkdir(dir,{recursive:true});
const report={product,source:process.env.FOLIOLAB_TEST_SHA,result:'NOT_REACHED',cleanup:'NOT_REACHED',cases:[],stages:[],limits:['Linux Chromium; synthetic isolated IDB contexts; service workers blocked','Provider responses intercepted only at network boundary; no save/CAS/refresh/booking-handler replacements','Drive/OAuth/decrypt/password adoption simulated in group C; no crypto or hardware acceptance','Selected cases only; not FullCI, K4 legacy/crash/quota, Main or release acceptance']};
let browser,context,page,current;
async function stage(name,state='BEGIN'){report.stages.push({name,state,at:new Date().toISOString()});console.log(JSON.stringify({kind:'SevenNativeStage',name,state}));await writeFile(dir+'/report.json',JSON.stringify(report,null,2));}
function check(label,actual,expected){current.assertions.push({label,actual,expected});assert.deepEqual(actual,expected,label);}
async function record(p){return p.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('foliolab-open-portfolio',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('records','readonly');let v;tx.objectStore('records').get('portfolio').onsuccess=e=>v=e.target.result;tx.oncomplete=()=>{db.close();resolve(v);};tx.onabort=()=>{db.close();reject(tx.error);};};}));}
async function alphaRecord(p){return p.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('foliolab-open-market-cache',1);r.onerror=()=>reject(r.error);r.onupgradeneeded=()=>r.result.createObjectStore('cache');r.onsuccess=()=>{const db=r.result,tx=db.transaction('cache','readonly');let v;tx.objectStore('cache').get('daily:VWCE.DEX').onsuccess=e=>v=e.target.result;tx.oncomplete=()=>{db.close();resolve(v??null);};tx.onabort=()=>{db.close();reject(tx.error);};};}));}
async function ready(p){await p.goto(base+'/');await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));}
async function openDetails(p,id){await p.locator('#mobileNav [data-page="more"]').click();await p.evaluate(id=>{for(let e=document.getElementById(id);e;e=e.parentElement)if(e.tagName==='DETAILS')e.open=true;},id);}
async function reopen(){await page.close();page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>current.pageErrors.push(e.message));page.on('dialog',d=>{current.dialogs.push(d.message());return d.accept();});await ready(page);return record(page);}
async function shot(name,locator){if(locator)await page.locator(locator).scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/'+name+'.png',fullPage:true});current.images.push(name+'.png');}
const day=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
const contract='0x'+'b'.repeat(40);
async function setup(spec){
 current={id:spec.id,group:spec.group,result:'NOT_REACHED',assertions:[],requests:[],unexpected:[],pageErrors:[],dialogs:[],images:[],spec};report.cases.push(current);await stage(spec.id+':context');
 context=await browser.newContext({viewport:{width:390,height:850},hasTouch:true,acceptDownloads:true,serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url()),host=u.hostname,path=u.pathname,method=route.request().method();if(u.origin===base)return route.continue();
  current.requests.push({host,path,method});let body,status=200;
  if(host==='www.googleapis.com')body=u.searchParams.get('alt')==='media'?{format:'foliolab-open-encrypted-v2',synthetic:true}:{files:[]};
  else if(host==='www.alphavantage.co')body={'Meta Data':{'2. Symbol':'VWCE.DEX','3. Last Refreshed':day(1)},'Time Series (Daily)':{[day(1)]:{'4. close':spec.value}}};
  else if(host==='api.frankfurter.dev')body={base:spec.wrongBase?'GBP':'USD',date:day(1),rates:{EUR:spec.fx??spec.value}};
  else if(host==='synthetic.workers.dev')body={schemaVersion:1,status:'ok',symbol:'VWCE.XETRA',points:[{date:day(1),close:spec.value}]};
  else if(host==='api.coingecko.com'&&path.includes('/simple/token_price/'))body={[contract]:{eur:spec.mode==='defi'?true:spec.value}};
  else if(host==='api.coingecko.com'&&path==='/api/v3/simple/price')body={bitcoin:{eur:spec.mode==='paprika'?true:spec.value,last_updated_at:Math.floor(Date.now()/1000)}};
  else if(host==='api.coinpaprika.com')body={id:'btc-bitcoin',symbol:'BTC',last_updated:new Date().toISOString(),quotes:{EUR:{price:spec.fallback??true}}};
  else if(host==='coins.llama.fi')body={coins:{['ethereum:'+contract]:{price:spec.value,confidence:.9,timestamp:Math.floor(Date.now()/1000),symbol:'STETH'}}};
  else if(['defi','token'].includes(spec.mode)&&['ethereum-rpc.publicnode.com','api.etherscan.io','eth.blockscout.com'].includes(host)){status=400;body={error:{code:-32000,message:'SYNTHETIC_WALLET_UNAVAILABLE'}};}
  else {current.unexpected.push({host,path,method});status=400;body={error:'UNEXPECTED_EXTERNAL_REQUEST'};}
  return route.fulfill({status,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'*'},contentType:'application/json',body:JSON.stringify(body)});
 });
 await context.addInitScript(()=>{
  if(location.origin!=='http://127.0.0.1:4173')return;
  localStorage.setItem('foliolab-open-drive-backup-settings-v1',JSON.stringify({clientId:'SYNTHETIC.apps.googleusercontent.com',mode:'off',retention:3}));
  window.google={accounts:{oauth2:{initTokenClient(){return {requestAccessToken(){this.callback({access_token:'SYNTHETIC-NONCREDENTIAL',expires_in:3600});}};}}}};
  window.__seven={restores:0,adoptions:0,writes:0};let mod;
  Object.defineProperty(window,'FolioDriveBackup',{configurable:true,get:()=>mod,set:v=>{mod=v;const init=v.init;v.init=async backend=>{
   const restore=backend.restoreData;backend.restoreData=async(...args)=>{window.__seven.restores++;return restore(...args);};
   backend.decryptPasswordBackup=async()=>JSON.stringify(window.__restorePayload);backend.hasPasswordVault=async()=>false;backend.adoptPasswordVault=async()=>{window.__seven.adoptions++;};
   const r=await init(backend);window.__seven.initialized=true;return r;
  };}});
 });
 page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>current.pageErrors.push(e.message));page.on('dialog',d=>{current.dialogs.push(d.message());return d.accept();});
 await page.goto(base+'/tests/storage-origin.html');
 current.fixture=await page.evaluate(async spec=>{
  const {blankModel,createProvider,createAccount,createPosition,backup,safeImport}=await import('/src/model.js');
  const {executeTransaction}=await import('/src/transactions.js');const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const m=blankModel();m.settings.autoRefresh='off';
  const provider=createProvider({id:'provider',name:'Synthetic bank'});if(spec.group!=='C'){m.providers.push(provider);m.accounts.push(createAccount({id:'account',providerId:provider.id,name:'Synthetic account',currency:spec.mode==='fx'?'USD':'EUR'},m));}
  const p={id:'asset',providerId:provider.id,accountId:'account',name:'Synthetic asset',quantity:2,price:110.25,kind:'etf',symbol:'VWCE',isin:'IE00BK5BQT80',exchange:'Xetra',mic:'XETR',currency:'EUR'};
  if(spec.group==='A'){
   if(spec.mode==='alpha'){m.settings.securitySource='alpha';m.settings.alphaVantageKey='SYNTHETIC_ALPHA_KEY';}
   if(spec.mode==='worker'){m.settings.securitySource='eodhd';m.settings.eodhdWorkerEndpoint='https://synthetic.workers.dev';m.settings.eodhdWorkerAccessToken='SYNTHETIC_WORKER_ACCESS_TOKEN_123456789';}
   if(spec.mode==='fx')Object.assign(p,{kind:'cash',symbol:'',quantity:100,price:1,currency:'USD',fxRate:spec.unknown?null:.9,fxRateExact:spec.unknown?'UNKNOWN':'0.9'});
   if(['crypto','paprika','token','defi'].includes(spec.mode))Object.assign(p,{kind:'crypto',symbol:'BTC',coinId:'bitcoin',price:100});
   if(spec.mode==='token'){p.coinId='';p.symbol='TKN';p.wallet={enabled:true,chain:'erc20',chainId:1,address:'0x'+'a'.repeat(40),contract:'0x'+'b'.repeat(40),decimals:18};}
   if(spec.mode==='defi'){p.coinId='';p.symbol='STETH';p.economicRole='liquid-staking';p.wallet={enabled:true,chain:'erc20',chainId:1,address:'0x'+'a'.repeat(40),contract:'0x'+'b'.repeat(40),decimals:18};}
   m.positions.push(createPosition(p,m));
  }else if(spec.group==='B'){
   m.positions.push(createPosition({...p,kind:'cash',symbol:'',quantity:100,price:1},m));
   const b=executeTransaction(m,{id:'booking-a',positionId:'asset',type:'deposit',quantity:20,date:'2026-01-02',unitPrice:1,fxRate:1});
   if(spec.mode==='encoded')m.positions[0].notes='{"reference":"'+String.fromCharCode(92)+'u0062ooking-a"}';
   if(spec.mode==='fees')b.feeEUR=null;if(spec.mode==='taxes')b.taxEUR=null;
  }
  const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  if(spec.mode==='alpha'){
   const {alphaCache}=await import('/src/alpha-vantage.js');const d=new Date(Date.now()-2*864e5).toISOString().slice(0,10);
   await alphaCache().update('daily:VWCE.DEX',()=>({day:d,data:{'Meta Data':{'2. Symbol':'VWCE.DEX','3. Last Refreshed':d},'Time Series (Daily)':{[d]:{'4. close':'110.25'}}}}));
  }
  const next=blankModel();next.settings.autoRefresh='off';next.providers.push(provider);next.accounts.push(createAccount({id:'next-account',providerId:provider.id,name:'Synthetic restored depot'},next));next.positions.push(createPosition({...p,accountId:'next-account',quantity:2,price:123.45,priceExact:'123.45'},next));
  const payload=JSON.parse(backup(next,{includeHistory:true}));
  if(spec.group==='C'&&spec.invalid){payload.positions[0].price=spec.value;delete payload.positions[0].priceExact;}
  return {payload,expectedRaw:spec.group==='C'&&!spec.invalid?backup(safeImport(payload),{includeHistory:true}):null};
 },spec);
 await stage(spec.id+':ready');await ready(page);await page.waitForFunction(()=>window.__seven?.initialized);
 current.before=await record(page);if(spec.mode==='alpha')current.cacheBefore=await alphaRecord(page);
 await page.evaluate(()=>{const state=window.__seven,put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...a){if(this.name==='records')state.writes++;return put.apply(this,a);};state.toasts=[];new MutationObserver(rs=>{for(const r of rs)if(r.type==='childList'){const text=[...r.addedNodes].map(n=>n.textContent??'').join('');if(text)state.toasts.push(text);}}).observe(document.getElementById('toast'),{childList:true});});
 check('initial revision',current.before.revision,2);
}
async function commonEnd(){
 check('unexpected external requests',current.unexpected,[]);check('page errors',current.pageErrors,[]);
 current.after=await record(page);await stage(current.id+':reopen');current.reopened=await reopen();check('reopened full record',current.reopened,current.after);
 current.visibleAfterReopen=await page.locator('#totalValue').innerText();
}
async function courses(spec){
 await page.locator('#mobileNav [data-page="positions"]').click();await stage(spec.id+':refresh-click');await page.locator('#refreshAll').click();
 await page.waitForFunction(()=>!document.getElementById('refreshAll').disabled&&!document.getElementById('priceInfo').textContent.includes('werden abgefragt'));
 current.status=await page.locator('#priceInfo').innerText();current.detail=await page.locator('#refreshErrorDetails').innerText();current.after=await record(page);
 current.observed=JSON.parse(current.after.raw).positions[0];current.ui=await page.locator('#positionsPage').innerText();
 const x=current.observed;
 if(spec.success){check('revision committed once',current.after.revision,current.before.revision+1);check('economic quantity',x.quantityExact,spec.mode==='fx'?'100':'2');check('expected exact price or FX',spec.mode==='fx'?x.fxRateExact:x.priceExact,String(spec.expected));check('currency preserved',x.currency,spec.mode==='fx'?'USD':'EUR');
  // Independent oracle below uses raw primitive values, not application total code.
  current.oracleEUR=spec.mode==='fx'?100*spec.expected:2*spec.expected;check('stored economic product',Number(x.quantityExact)*Number(x.priceExact)*(x.currency==='EUR'?1:Number(x.fxRateExact)),current.oracleEUR);
 }else{check('whole record retained',current.after,current.before);assert.match(current.status,/Fehler|fehlgeschlagen|aktualisiert|unverändert/i);if(spec.unknown)check('UNKNOWN FX retained',x.fxRateExact,'UNKNOWN');}
 const old=JSON.parse(current.before.raw),now=JSON.parse(current.after.raw);for(const key of ['journalEntries','externalCashFlows','bookings'])check(key+' preserved',now[key],old[key]);
 if(spec.mode==='alpha'){current.cacheAfter=await alphaRecord(page);if(!spec.success)check('old confirmed Alpha cache retained',current.cacheAfter,current.cacheBefore);else check('valid Alpha cache close',current.cacheAfter.data['Time Series (Daily)'][Object.keys(current.cacheAfter.data['Time Series (Daily)'])[0]]['4. close'],spec.value);}
 current.writes=await page.evaluate(()=>window.__seven.writes);check('canonical put count',current.writes,spec.success?1:0);
 if(spec.image){if(!spec.success)await page.locator('#refreshErrorDetails summary').click();await shot(spec.id,'#priceInfo');}
 await commonEnd();if(spec.success){const expected=new Intl.NumberFormat('de-AT',{style:'currency',currency:'EUR'}).format(current.oracleEUR);check('visible stored value after reopen',current.visibleAfterReopen.replace(/\s/g,''),expected.replace(/\s/g,''));}
}
async function bookings(spec){
 await page.locator('#mobileNav [data-page="bookings"]').click();await page.locator('[data-booking-manage="select"]').click();await stage(spec.id+':row-edit');await page.locator('[data-booking-row-action="edit"][data-id="booking-a"]').click();
 current.editor=await page.locator('#dialogFields').innerText();check('delete disabled',await page.locator('#deleteBooking').isDisabled(),spec.mode!=='allowed');
 if(spec.mode==='encoded'){check('save hidden for reference',await page.locator('#saveDialog').isVisible(),false);assert.match(current.editor,/Referenzen/);await page.locator('#dialogFields details').last().evaluate(e=>e.open=true);await shot(spec.id,'#editDialog');}
 else if(spec.mode==='fees'||spec.mode==='taxes'){
  await page.locator('#dialogFields [name="reason"]').fill('Synthetic cost receipt');await page.locator('#dialogFields [name="notes"]').fill('Checked note');await page.locator('#saveDialog').click();await page.waitForFunction(()=>document.getElementById('dialogFields').textContent.includes('Gesamtvermögen:'));
  current.preview=await page.locator('#dialogFields').innerText();assert.match(current.preview,spec.mode==='fees'?/Gebühren: unbekannt → unbekannt EUR/:/Steuern: unbekannt → unbekannt EUR/);check('unknown cost visible in preview',true,true);await shot(spec.id,'#editDialog');
 }else{
  await page.locator('#deleteBooking').click();await page.locator('#dialogFields [name="reason"]').fill('Synthetic permitted reversal');await page.locator('#saveDialog').click();await page.waitForFunction(()=>document.getElementById('dialogFields').textContent.includes('Gesamtvermögen:'));
  current.preview=await page.locator('#dialogFields').innerText();assert.match(current.preview,/120 → 100 EUR/);await page.locator('[name="confirmBookingChange"]').check();await page.locator('#saveDialog').click();await page.waitForFunction(()=>document.getElementById('toast').textContent==='Buchungsänderung gespeichert.');
 }
 current.after=await record(page);if(spec.mode!=='allowed')check('blocked/cancelled full state unchanged',current.after,current.before);else{
  check('one actual CAS revision',current.after.revision,3);const m=JSON.parse(current.after.raw);check('120 minus20 independent oracle',m.positions[0].quantityExact,'100');check('bookings removed',m.bookings.length,0);check('external flows removed',m.externalCashFlows.length,0);
 }
 current.writes=await page.evaluate(()=>window.__seven.writes);check('canonical writes',current.writes,spec.mode==='allowed'?1:0);await commonEnd();
}
async function restore(spec){
 await openDetails(page,'driveRestore');await page.evaluate(payload=>{window.__restorePayload=payload;},current.fixture.payload);await page.evaluate(()=>window.FolioDriveBackup.connect());
 await page.evaluate(()=>{const s=document.getElementById('driveBackupSelect');s.add(new Option('Synthetic backup','syntheticBackup12345'));s.value='syntheticBackup12345';document.getElementById('driveRecoveryInput').value='SYNTHETIC restore password';});
 await stage(spec.id+':restore-click');await page.locator('#driveRestore').click();await page.waitForFunction(()=>window.__seven.restores>0&&!window.FolioDriveBackup.getStatus().busy||window.FolioDriveBackup.getStatus().error);
 current.state=await page.evaluate(()=>({status:window.FolioDriveBackup.getStatus(),probe:window.__seven,password:document.getElementById('driveRecoveryInput').value}));current.after=await record(page);
 if(spec.invalid){check('invalid restore full record unchanged',current.after,current.before);check('restore rejected before callback',current.state.probe.restores,0);check('no canonical writes',current.state.probe.writes,0);check('no password adoption',current.state.probe.adoptions,0);check('failure status',current.state.status.error,true);assert.match(current.state.status.message,/Kurs|Zahl/);}
 else{check('successful revision',current.after.revision,3);check('successful exact raw',current.after.raw,current.fixture.expectedRaw);check('single restore callback',current.state.probe.restores,1);check('one actual canonical write',current.state.probe.writes,1);check('status matches commit',current.state.status.error,false);check('one portfolio toast',current.state.probe.toasts.filter(x=>x==='Portfoliodaten aus Google Drive übernommen.').length,1);assert.match(current.state.status.message,/Drive-Backup wiederhergestellt\. 1 Positionen geladen\./);assert.doesNotMatch(current.state.status.message,/Vorheriger Stand lokal gesichert/);check('no unproved rollback download',current.dialogs.some(x=>/Vorherigen|Sicherung.*erstellen/i.test(x)),false);}
 check('one media GET',current.requests.filter(r=>r.host==='www.googleapis.com'&&r.path.includes('syntheticBackup12345')).length,1);check('password input cleared',current.state.password,'');
 if(spec.image)await shot(spec.id,'#driveBackupStatus');await commonEnd();
}
const cases=[
 {group:'A',id:'alpha-valid',mode:'alpha',value:'123.45',success:true,expected:123.45},
 {group:'A',id:'alpha-boolean',mode:'alpha',value:true,image:true},
 {group:'A',id:'alpha-array',mode:'alpha',value:[123.45]},
 {group:'A',id:'fx-valid-unknown',mode:'fx',unknown:true,value:.85,success:true,expected:.85},
 {group:'A',id:'fx-boolean-known',mode:'fx',value:true},
 {group:'A',id:'fx-array-unknown',mode:'fx',unknown:true,value:[.85],image:true},
 {group:'A',id:'fx-wrong-base',mode:'fx',value:.85,wrongBase:true},
 {group:'A',id:'fx-outside-range',mode:'fx',value:1001},
 {group:'A',id:'crypto-valid',mode:'crypto',value:120,success:true,expected:120},
 {group:'A',id:'crypto-invalid',mode:'crypto',value:true,fallback:[120]},
 {group:'A',id:'paprika-valid',mode:'paprika',value:true,fallback:'120',success:true,expected:120},
 {group:'A',id:'token-valid',mode:'token',value:120,success:true,expected:120},
 {group:'A',id:'token-array',mode:'token',value:[120]},
 {group:'A',id:'worker-valid',mode:'worker',value:101.25,success:true,expected:101.25},
 {group:'A',id:'worker-decimal-underflow',mode:'worker',value:1e-20},
 {group:'A',id:'defi-valid',mode:'defi',value:100,fx:.9,success:true,expected:90},
 {group:'A',id:'defi-invalid',mode:'defi',value:true},
 {group:'B',id:'booking-encoded',mode:'encoded'},
 {group:'B',id:'booking-fees',mode:'fees'},
 {group:'B',id:'booking-taxes',mode:'taxes'},
 {group:'B',id:'booking-allowed',mode:'allowed'},
 {group:'C',id:'restore-valid',mode:'restore',value:123.45,image:true},
 {group:'C',id:'restore-boolean',mode:'restore',invalid:true,value:true,image:true},
 {group:'C',id:'restore-array',mode:'restore',invalid:true,value:[123.45]},
 {group:'C',id:'restore-object',mode:'restore',invalid:true,value:{price:123.45}}
];
try{
 await stage('launch');browser=await chromium.launch({headless:true,args:['--no-sandbox']});report.browserVersion=browser.version();report.node=process.version;
 for(const spec of cases){
  try{await setup(spec);await stage(spec.id+':action');await ({A:courses,B:bookings,C:restore}[spec.group])(spec);current.result='PASS';await stage(spec.id,'PASS');}
  catch(error){current.result='FAIL';current.error={message:error.message,stack:error.stack};await stage(spec.id,'FAIL');try{current.failureRecord=await record(page);await shot(spec.id+'-failure');}catch(e){current.captureError=String(e);}}
  finally{try{await context?.close();current.cleanup='PASS';}catch(e){current.cleanup='FAIL';current.cleanupError=String(e);}await writeFile(dir+'/'+spec.id+'.json',JSON.stringify(current,null,2));context=null;page=null;}
 }
 report.groups=Object.fromEntries(['A','B','C'].map(g=>[g,{pass:report.cases.filter(c=>c.group===g&&c.result==='PASS').length,total:cases.filter(c=>c.group===g).length,result:report.cases.filter(c=>c.group===g).every(c=>c.result==='PASS')?'PASS':'FAIL'}]));
 report.result=report.cases.every(c=>c.result==='PASS')?'PASS':'FAIL';if(report.result!=='PASS')process.exitCode=1;
}catch(e){report.result='FAIL';report.error=String(e);process.exitCode=1;}
finally{try{await context?.close();await browser?.close();report.cleanup='PASS';}catch(e){report.cleanup='FAIL';report.cleanupError=String(e);process.exitCode=1;}await stage('complete',report.result);}
