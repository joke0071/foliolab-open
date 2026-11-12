import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {observeLiveStartup} from './live-startup-diagnostics.mjs';
const base=process.env.ETF_SOURCE_BASE||'http://127.0.0.1:4173/';
const origin=new URL(base).protocol==='https:'?new URL(base).origin:'https://frequency.example.test';
const stateKey='foliolab-open-auto-refresh-v2',results=[];
mkdirSync('artifacts/gates/refresh-frequency',{recursive:true});
const deadline=setTimeout(()=>{console.error('Refresh-frequency browser deadline exceeded');process.exit(1);},240000);deadline.unref();
for(const engine of (process.env.ETF_SOURCE_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[],...(process.env.K2_CHROMIUM_EXECUTABLE&&engine==='chromium'?{executablePath:process.env.K2_CHROMIUM_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[],calls=[];
 let mode='success',release=null,held=null;
 await context.addInitScript(()=>Object.defineProperty(navigator,'onLine',{get:()=>localStorage.getItem('synthetic-offline')!=='1'}));
 await context.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin===origin){
   if(origin===new URL(base).origin)return route.continue();
   return route.fulfill({path:process.cwd()+(u.pathname==='/'?'/index.html':u.pathname)});
  }
  calls.push({host:u.hostname,ids:u.searchParams.get('ids')});
  const json=(status,body)=>route.fulfill({status,headers:{'access-control-allow-origin':'*','retry-after':'1'},contentType:'application/json',body:JSON.stringify(body)});
  if(u.hostname==='api.coingecko.com'&&u.pathname.endsWith('/simple/price')){
   if(held){const wait=held;held=null;await wait;}
   if(mode==='429'||mode==='402')return json(Number(mode),{});
   if(mode==='network')return route.abort('internetdisconnected');
   const ids=u.searchParams.get('ids').split(','),quotes={};
   for(const id of ids)if(mode!=='partial'||id==='bitcoin')quotes[id]={eur:123,last_updated_at:Math.floor(Date.now()/1000)};
   return json(200,quotes);
  }
  if(u.hostname==='blockstream.info')return json(200,{chain_stats:{funded_txo_sum:100000000,spent_txo_sum:0},mempool_stats:{funded_txo_sum:0,spent_txo_sum:0}});
  return json(403,{}); // Synthetic responses only: never spend a real quota.
 });
 const ready=p=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const record=p=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const storedState=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),stateKey);
 const more=async()=>{await page.locator(innerNav()).click();};
 const innerNav=()=>page.viewportSize().width<1000?'#mobileNav [data-page="more"]':'#sidebarNav [data-page="more"]';
 const seed=async(frequency='daily',coins=[])=>{
  await page.evaluate(async({frequency,coins,key})=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=frequency;
   m.providers.push(createProvider({id:'synthetic-refresh-provider',name:'SYNTHETIC refresh'}));
   m.accounts.push(createAccount({id:'synthetic-refresh-account',providerId:m.providers[0].id,name:'Synthetic account',type:'exchange'},m));
   for(const coin of coins)m.positions.push(createPosition({id:'synthetic-'+coin,providerId:m.providers[0].id,accountId:m.accounts[0].id,name:'Synthetic '+coin,kind:'crypto',coinId:coin,symbol:coin==='bitcoin'?'BTC':'ETH',quantity:'1.123456789012345678',price:10},m));
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();localStorage.removeItem(key);
  },{frequency,coins,key:stateKey});
  await page.reload();await ready(page);
 };
 const settled=async success=>{await page.waitForFunction(({key,success})=>{const s=JSON.parse(localStorage.getItem(key));return !!s&&(success?s.lastSuccessAt!==null:s.failures>0)&&!document.getElementById('refreshAll').disabled;},{key:stateKey,success},{timeout:45000});};
 let startupCapture=null;
 try{
  startupCapture=await observeLiveStartup(page,base);
  await page.goto(origin+'/');await ready(page);
  // Real old IDB records: normalization must not create a revision or rewrite bytes.
  for(const [legacy,want] of [[false,'off'],[true,'daily'],[null,'daily']]){
   await page.evaluate(async legacy=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB(),r=await readPortfolioRecord(db);if(legacy===null)delete r.settings.autoRefresh;else r.settings.autoRefresh=legacy;await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put(r,'portfolio');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();},legacy);
   const before=await record(page);await page.reload();await ready(page);await more();
   assert.equal(await page.locator('#autoRefresh').inputValue(),want);assert.deepEqual(await record(page),before);
  }
  for(const value of ['off','daily','6h','30m']){
   await page.locator('#autoRefresh').selectOption(value);
   await page.waitForFunction(value=>document.getElementById('autoRefresh').value===value&&!document.getElementById('autoRefresh').disabled&&document.getElementById('toast').textContent.includes(value==='off'?'deaktiviert':'gespeichert'),value);
   assert.equal((await record(page)).settings.autoRefresh,value);
   assert.equal(await page.locator('#autoRefreshQuota').isVisible(),['6h','30m'].includes(value));
  }
  await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.settings.autoRefresh='6h';await s.save(m);s.close();});
  const concurrent=await record(page);await page.locator('#autoRefresh').selectOption('off');
  await page.waitForFunction(()=>document.getElementById('autoRefresh').value==='6h');
  assert.deepEqual(await record(page),concurrent,'Stale preference save cannot overwrite concurrent bytes or revision');
  await page.reload();await ready(page);await more();await page.locator('#autoRefresh').selectOption('30m');
  await page.waitForFunction(()=>document.getElementById('toast').textContent==='Aktualisierungsintervall gespeichert.');
  const beforeQuota=await record(page);
  await page.evaluate(()=>{window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('synthetic quota','QuotaExceededError');};});
  await page.locator('#autoRefresh').selectOption('off');
  await page.waitForFunction(()=>document.getElementById('autoRefresh').value==='30m');
  await page.evaluate(()=>{IDBObjectStore.prototype.put=window.originalPut;delete window.originalPut;});
  assert.deepEqual(await record(page),beforeQuota,'Quota preserves exact record and restores visible preference');
  for(const width of [320,360,390,412,430,768,1440]){
   await page.setViewportSize({width,height:900});
   const bounds=await page.locator('#autoRefresh').boundingBox();assert.ok(bounds.height>=44);assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   const a11y=await page.evaluate(()=>axe.run('#dataSourcesPanel',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));assert.deepEqual(a11y.violations.map(x=>x.id),[]);
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#autoRefresh').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.getElementById('toast').classList.contains('hidden'));
  await page.evaluate(()=>{const nodes=[...document.querySelectorAll('#dataSourcesPanel,#dataSourcesPanel *')];const fonts=nodes.map(el=>[el,el.style.fontSize,parseFloat(getComputedStyle(el).fontSize)]);for(const [el,,size]of fonts)el.style.fontSize=(size*2)+'px';window.restoreRefreshFonts=()=>{for(const [el,size]of fonts)el.style.fontSize=size;};});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'200% text must not overflow');
  await page.locator('#autoRefresh').scrollIntoViewIfNeeded();
  await page.screenshot({path:'artifacts/gates/refresh-frequency/'+engine+'-390-200.png'});
  await page.evaluate(()=>{window.restoreRefreshFonts();delete window.restoreRefreshFonts;});
  await page.locator('#autoRefresh').scrollIntoViewIfNeeded();
  await page.screenshot({path:'artifacts/gates/refresh-frequency/'+engine+'-390.png'});
  await page.locator('#autoRefresh').focus();assert.equal(await page.locator('#autoRefresh').evaluate(el=>el===document.activeElement),true);
  await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  // A blocked second tab cannot issue the same automatic request.
  held=new Promise(resolve=>{release=resolve;});await seed('daily',['bitcoin']);
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.lastAttemptAt!=null,stateKey);
  const other=await context.newPage();await other.goto(origin+'/');await ready(other);
  await other.waitForTimeout(1200);assert.equal(calls.filter(x=>x.host==='api.coingecko.com').length,1);
  release();await settled(true);await other.close();
  const complete=await record(page),success=await storedState();assert.ok(success.lastSuccessAt);assert.equal(JSON.parse(complete.raw).positions[0].quantityExact,'1.123456789012345678');
  const count=calls.length;await page.reload();await ready(page);await page.waitForTimeout(1200);assert.equal(calls.length,count);assert.deepEqual(await record(page),complete);
  // Successful partial quotes survive reload without repeating that source.
  mode='partial';calls.length=0;await seed('daily',['bitcoin','ethereum']);await settled(false);
  assert.equal((await storedState()).lastSuccessAt,null);
  assert.equal(JSON.parse((await record(page)).raw).positions.find(p=>p.coinId==='bitcoin').price,123);
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.nextAttemptAt=0;localStorage.setItem(key,JSON.stringify(s));},stateKey);
  calls.length=0;mode='success';await page.reload();await ready(page);await settled(true);
  assert.deepEqual(calls.filter(x=>x.host==='api.coingecko.com').map(x=>x.ids),['ethereum']);
  for(const quoted of [false,true]){
   await seed('off',['bitcoin']);
   await page.evaluate(async quoted=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();Object.assign(m.positions[0],{coinId:quoted?'bitcoin':'',quantity:1,quantityExact:'1',price:17,priceExact:'17',wallet:{enabled:true,chain:'btc',address:'1BoatSLRHtKNngkdXEeobR76b53LETtpyT'}});m.settings.autoRefresh='daily';await s.save(m);s.close();},quoted);
   await page.reload();await ready(page);await settled(true);
   const wallet=JSON.parse((await record(page)).raw).positions[0];assert.equal(wallet.quantityExact,'1');assert.equal(wallet.price,quoted?123:17);
  }
  // Actual offline/denial/save-failure paths never create a full-success timestamp.
  for(const failure of ['offline','402','429','network','save']){
   mode=failure==='save'?'success':failure;await seed('off',['bitcoin']);
   await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage(),m=await s.initialize();m.settings.autoRefresh='daily';await s.save(m);s.close();});
   const before=await record(page);calls.length=0;
   if(failure==='offline')await page.evaluate(()=>localStorage.setItem('synthetic-offline','1'));
   if(failure==='save')await context.addInitScript(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='records')throw new DOMException('synthetic quota','QuotaExceededError');return put.apply(this,args);};});
   await page.reload();await ready(page);
   if(failure==='offline'){
    await page.waitForTimeout(1200);assert.equal((await storedState())?.lastSuccessAt??null,null);assert.equal(calls.length,0);await page.evaluate(()=>localStorage.removeItem('synthetic-offline'));
   }else{await ready(page);await settled(false);assert.equal((await storedState()).lastSuccessAt,null);assert.deepEqual(await record(page),before);}
   if(failure==='save')break;
  }
  assert.deepEqual(errors,[]);results.push({engine,result:'PASS',legacyReadOnly:true,frequencies:4,widths:[320,360,390,412,430,768,1440],axe:true,quota:true,multitab:true,partialNoRepeat:true,stalePreferenceNonmutation:true,walletWithAndWithoutQuote:true,offlineDenialNetworkSaveFailure:true,textScale200:true});
  writeFileSync('artifacts/gates/refresh-frequency/'+engine+'.json',JSON.stringify(results.at(-1),null,2));
  console.log('K2 '+engine+' assertions PASS');
 }catch(error){
  const failure={engine,result:'FAIL',scope:'Refresh-frequency failure diagnostics only; all original assertions and deadlines retained',error:String(error)};
  if(startupCapture)try{failure.startupDiagnostics=await startupCapture();}catch(captureError){failure.diagnosticError=String(captureError);}
  writeFileSync('artifacts/gates/refresh-frequency/'+engine+'-failure.json',JSON.stringify(failure,null,2));
  await page.screenshot({path:'artifacts/gates/refresh-frequency/'+engine+'-failure.png',timeout:5000}).catch(()=>{});
  throw error;
 }finally{await context.unrouteAll({behavior:'ignoreErrors'});await context.close();await browser.close();}
}
mkdirSync('artifacts/gates/refresh-frequency',{recursive:true});writeFileSync('artifacts/gates/refresh-frequency/report.json',JSON.stringify({base,synthetic:true,results},null,2));
console.log('K2 refresh-frequency: '+results.map(x=>x.engine+' PASS').join(', '));
clearTimeout(deadline);
