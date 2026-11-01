import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.ETF_SOURCE_BASE||'http://127.0.0.1:4173/';
const pairs=[['VWCE','IE00BK5BQT80'],['XDEM','IE00BL25JP72'],['XDEQ','IE00BL25JL35'],['5MVL','IE00BG0SKF03']];
const date=new Date(Date.now()-864e5).toISOString().slice(0,10),previous=new Date(Date.now()-2*864e5).toISOString().slice(0,10);
const report={base,synthetic:true,liveProviderVerification:false,engines:[]};
const deadline=setTimeout(()=>{console.error('Alpha Vantage browser deadline exceeded');process.exit(1);},180000);deadline.unref();
mkdirSync('artifacts/gates/alpha-vantage',{recursive:true});
for(const engine of (process.env.ETF_SOURCE_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),p=await context.newPage(),calls=[],errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.origin===new URL(base).origin)return route.continue();
  const call={host:u.hostname,function:u.searchParams.get('function'),symbol:u.searchParams.get('symbol'),time:Date.now()};calls.push(call);
  const fulfill=(status,body)=>route.fulfill({status,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify(body)});
  if(u.hostname==='www.alphavantage.co'){
   assert.equal(u.searchParams.get('apikey'),'SYNTHETIC_ALPHA_KEY');assert.equal(u.searchParams.get('function'),'TIME_SERIES_DAILY');assert.equal(u.searchParams.get('outputsize'),'compact');
   const index=pairs.findIndex(([symbol])=>symbol+'.DEX'===u.searchParams.get('symbol'));assert.ok(index>=0);
   if(index===0)await new Promise(resolve=>setTimeout(resolve,3000));
   call.respondedAt=Date.now();
   return fulfill(200,{'Meta Data':{'2. Symbol':pairs[index][0]+'.DEX','3. Last Refreshed':date},untrustedDiagnostics:{echoedKey:'SYNTHETIC_ALPHA_KEY'},'Time Series (Daily)':{[previous]:{'4. close':String(100+index)},[date]:{'4. close':String(110+index),'5. adjusted close':'9999'}}});
  }
  if(u.hostname==='financialmodelingprep.com')return fulfill(402,{message:'Synthetic plan denial'});
  if(u.hostname==='api.twelvedata.com')return fulfill(404,{code:404,status:'error',message:'This symbol is available starting with the Grow or Venture plan. SYNTHETIC_PRIVATE_RESPONSE'});
  return route.abort();
 });
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const nav=async tab=>p.locator((p.viewportSize().width<720?'#mobileNav':'#sidebarNav')+' [data-page="'+tab+'"]').click();
 const refresh=async()=>{await nav('positions');await p.locator('#refreshAll').click();await p.waitForFunction(()=>!document.getElementById('refreshAll').disabled);};
 try{
  await p.goto(base);await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await p.evaluate(async pairs=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.providers.push(createProvider({id:'p',name:'SYNTHETIC ETF broker'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'SYNTHETIC depot',type:'securities'},m));
   for(const [symbol,isin]of pairs)m.positions.push(createPosition({id:symbol,providerId:'p',accountId:'a',name:'SYNTHETIC '+symbol,kind:'etf',symbol,isin,currency:'EUR',mic:'XETR',exchange:'Xetra',quantity:'3.141592653589793238',price:0},m));
   m.settings.autoRefresh=false;const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  },pairs);
  await p.reload();await nav('more');await p.locator('#marketSettings').evaluate(e=>e.open=true);
  assert.equal(await p.locator('[name=alphaVantageKey]').getAttribute('type'),'password');await p.locator('[name=alphaVantageKey]').fill('SYNTHETIC_ALPHA_KEY');
  await p.locator('#apiSettings button[type=submit]').click();await p.waitForFunction(()=>document.getElementById('toast')?.textContent==='Datenquellen und Zugänge lokal gespeichert.');
  const saved=await record();assert.equal(saved.settings.alphaVantageKey,'SYNTHETIC_ALPHA_KEY');assert.ok(!saved.raw.includes('SYNTHETIC_ALPHA_KEY'));
  await refresh();const first=await record(),model=JSON.parse(first.raw);
  assert.deepEqual(model.positions.map(x=>x.price),[110,111,112,113]);assert.ok(model.positions.every(x=>x.quantityExact==='3.141592653589793238'&&x.quoteSource==='Alpha Vantage · Xetra EOD'&&x.quoteAsOf===date));
  assert.deepEqual(model.bookings,[]);assert.deepEqual(model.journalEntries,[]);assert.deepEqual(model.externalCashFlows,[]);
  assert.equal(calls.length,4);for(let i=1;i<4;i++)assert.ok(calls[i].time-calls[i-1].respondedAt>=2300,'Requests must leave the complete gap after a slow response');
  const history=await p.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{fetchSecurityHistory}=await import('/src/security-sources.js');const s=new PortfolioStorage();try{const m=await s.initialize();return await fetchSecurityHistory(m.positions[0],m.settings,30);}finally{s.close();}});
  assert.equal(history.priceType,'close');assert.equal(history.points.at(-1).total,110);assert.equal(calls.length,4,'Quote/history share daily data');
  await p.reload();await refresh();assert.equal(calls.length,4,'Cache survives reload');
  const cache=await p.evaluate(async()=>{const {alphaCache,alphaKeyId}=await import('/src/alpha-vantage.js');const s=alphaCache();return {budget:await s.read('budget:'+await alphaKeyId('SYNTHETIC_ALPHA_KEY')),quote:await s.read('daily:VWCE.DEX')};});
  assert.equal(cache.budget.used,4);assert.ok(!JSON.stringify(cache).includes('SYNTHETIC_ALPHA_KEY'));
  await nav('more');await p.locator('#marketSettings').evaluate(e=>e.open=true);await p.locator('#checkMarketSources').click();await p.waitForFunction(()=>document.getElementById('marketDiagnosticStatus')?.textContent.includes('Diagnose beendet'));
  const baseline=await record();assert.match(await p.locator('#marketDiagnosticStatus').innerText(),/Alpha Vantage · Tageskurs aus lokalem Cache/);assert.equal(calls.length,4);
  for(const width of [320,360,390,412,430,768,1440]){
   await p.setViewportSize({width,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const result=await p.evaluate(()=>axe.run('#marketSettings',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));assert.deepEqual(result.violations.map(x=>x.id),[]);
  }
  assert.deepEqual(await record(),baseline,'Diagnosis/layout leaves canonical bytes/revision unchanged');
  await p.setViewportSize({width:390,height:844});
  // Exhausted persisted budget stops network and preserves the last good prices.
  await p.evaluate(async pairs=>{const {alphaCache,alphaKeyId}=await import('/src/alpha-vantage.js');const store=alphaCache();const id=await alphaKeyId('SYNTHETIC_ALPHA_KEY');await store.update('budget:'+id,old=>({...old,used:25}));for(const [symbol]of pairs)await store.update('daily:'+symbol+'.DEX',()=>({day:'1900-01-01'}));},pairs);
  await refresh();assert.equal(calls.length,4);await p.locator('#refreshErrorDetails > summary').click();assert.match(await p.locator('#refreshErrorDetails').innerText(),/Anfragelimit/);
  const after=JSON.parse((await record()).raw);assert.deepEqual(after.positions,JSON.parse(baseline.raw).positions);assert.deepEqual(after.journalEntries,model.journalEntries);
  // A confirmed denial survives reload, but a manual recheck can probe again.
  const denied=()=>p.evaluate(async()=>{const {fetchSecurityQuote}=await import('/src/security-sources.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();try{const m=await s.initialize();for(const source of ['fmp','twelve'])try{await fetchSecurityQuote(m.positions[0],{...m.settings,securitySource:source,fmpKey:'SYNTHETIC_FMP',twelveKey:'SYNTHETIC_TWELVE'});}catch(e){if(!/tarif/i.test(e.message)||e.message.includes('SYNTHETIC_'))throw e;}}finally{s.close();}});
  const beforeDenied=await record();await denied();assert.equal(calls.length,6);await p.reload();await denied();assert.equal(calls.length,6);assert.deepEqual(await record(),beforeDenied);
  const repeat=await p.evaluate(async()=>{const {fetchSecurityQuote}=await import('/src/security-sources.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();try{const m=await s.initialize();try{await fetchSecurityQuote(m.positions[0],{...m.settings,securitySource:'twelve',twelveKey:'SYNTHETIC_TWELVE',recheckProviderAccess:true});}catch(e){return e.message;}}finally{s.close();}});
  assert.match(repeat,/tarif/i);assert.equal(calls.length,7);assert.deepEqual(await record(),beforeDenied);
  assert.deepEqual(errors,[]);report.engines.push({engine,status:'PASS',fourQuotes:true,rawClose:true,exactHoldings:true,sharedHistory:true,persistentCache:true,hashedBudget:true,serialThrottle:true,budgetExhaustionPreservesQuotes:true,persistentPlanDenial:true,manualRecheck:true,diagnosticReadOnly:true,widths:[320,360,390,412,430,768,1440],axe:true});
  console.log(engine+': ALPHA-266 four ETF raw EOD/actual IDB/daily cache/shared history/2.5s serial/25-day budget/retention/plan cooldown/recheck/7 widths/Axe PASS');
 }catch(error){console.log('ALPHA_SYNTHETIC_FAILURE '+JSON.stringify({engine,calls,errors,ui:await p.evaluate(()=>({info:document.getElementById('priceInfo')?.textContent,errors:document.getElementById('refreshErrorDetails')?.textContent})).catch(()=>null)}));throw error;}
 finally{writeFileSync('artifacts/gates/alpha-vantage.json',JSON.stringify(report,null,2));await context.close();await browser.close();}
}
clearTimeout(deadline);
