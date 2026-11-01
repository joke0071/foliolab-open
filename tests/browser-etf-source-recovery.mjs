import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.ETF_SOURCE_BASE||'http://127.0.0.1:4173/';
const engines=(process.env.ETF_SOURCE_ENGINES||'chromium').split(',');
const pairs=[['VWCE','IE00BK5BQT80'],['XDEM','IE00BL25JP72'],['XDEQ','IE00BL25JL35'],['5MVL','IE00BG0SKF03']];
const date=new Date(Date.now()-864e5).toISOString().slice(0,10),results=[];
for(const engine of engines){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();
 const errors=[],requests=[];let failing=false;
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 // Isolate provider mocks from Service Worker routing (WebKit otherwise bypasses
 // Playwright routes). Separate mandatory PWA/offline/update suites retain real SW.
 // All financial data and access tokens are synthetic. This is a contract/UI
 // regression, explicitly not live-provider coverage, CORS or hardware evidence.
 await context.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.origin===new URL(base).origin)return route.continue();
  requests.push({host:u.hostname,path:u.pathname,symbol:u.searchParams.get('symbol')});
  if(u.hostname==='financialmodelingprep.com'&&!failing){
   const index=pairs.findIndex(([s])=>s+'.DE'===u.searchParams.get('symbol'));
   assert.ok(index>=0,'No guessed symbol or foreign venue');
   return route.fulfill({status:200,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify([{symbol:pairs[index][0]+'.DE',exchange:'XETR',currency:'EUR',date,price:101+index}])});
  }
  return route.fulfill({status:404,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify({status:'error',code:404,message:'Not available'})});
 });
 const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 try{
  await page.goto(base);await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await page.evaluate(async pairs=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel(),p=createProvider({id:'p',name:'Synthetic Broker'});m.providers.push(p);
   m.accounts.push(createAccount({id:'a',name:'Synthetic Depot',providerId:p.id,type:'securities'},m));
   for(const [symbol,isin]of pairs)m.positions.push(createPosition({id:symbol,providerId:'p',accountId:'a',kind:'etf',name:'SYNTH. ABBR. '+symbol,symbol,isin,currency:'EUR',exchange:'Xetra',mic:'XETR',quantity:'3.14159',price:0},m));
   m.settings.autoRefresh=false;m.settings.eodhdKey='SYNTHETIC_LEGACY_PRESERVE';m.settings.fmpKey='SYNTHETIC_FMP';m.settings.twelveKey='SYNTHETIC_TWELVE';
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  },pairs);
  await page.reload();await page.locator('#mobileNav [data-page="more"]').click();
  assert.equal(await page.locator('[name="eodhdKey"]').count(),0,'No EODHD direct setup field');
  assert.match(await page.locator('#marketSupplyStatus').innerText(),/eingeschränkt/);
  await page.locator('#marketSettings').evaluate(el=>el.open=true);
  await page.locator('#apiSettings button[type="submit"]').click();
  await page.waitForFunction(()=>document.getElementById('toast')?.textContent==='Datenquellen und Zugänge lokal gespeichert.');
  assert.equal((await record()).settings.eodhdKey,'SYNTHETIC_LEGACY_PRESERVE','Absent form field cannot erase old secret');
  await page.locator('#mobileNav [data-page="positions"]').click();await page.locator('#refreshAll').click();
  await page.waitForFunction(()=>!document.getElementById('refreshAll').disabled);
  assert.match(await page.locator('#priceInfo').innerText(),/4 Datenupdates/,'Four source updates required; '+await page.locator('#refreshErrorDetails').innerText());
  const after=await record(),m=JSON.parse(after.raw);
  assert.deepEqual(m.positions.map(p=>p.price),[101,102,103,104]);
  assert.ok(m.positions.every(p=>p.quoteAsOf===date&&p.quoteSource==='FMP'&&p.quantityExact==='3.14159'));
  await page.locator('#mobileNav [data-page="more"]').click();
  assert.match(await page.locator('#marketSupplyStatus').innerText(),/funktioniert/);
  await page.locator('#checkMarketSources').click();await page.waitForFunction(()=>document.querySelector('#marketDiagnosticStatus')?.textContent.includes('Diagnose beendet'));
  const diagnosis=await page.locator('#marketDiagnosticStatus').innerText();
  for(const [symbol]of pairs)assert.ok(diagnosis.includes(symbol));
  assert.match(diagnosis,/FMP · Kursabruf erfolgreich/);assert.match(diagnosis,/HTTP 404/);assert.match(diagnosis,/deaktiviert/);
  assert.doesNotMatch(diagnosis,/SYNTHETIC_/);assert.deepEqual(await record(),after,'Read-only diagnosis preserves exact IDB record/revision');
  for(const width of [320,360,390,412,430,768,1440]){
   await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No overflow at '+width);
  }
  const axe=await page.evaluate(()=>axe.run(document.querySelector('#morePage'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  assert.deepEqual(axe.violations.map(v=>v.id),[]);
  // Return to mobile before using its navigation; the width matrix ends at desktop.
  await page.setViewportSize({width:390,height:844});
  failing=true;await page.reload();await page.locator('#mobileNav [data-page="positions"]').click();await page.locator('#refreshAll').click();
  await page.waitForFunction(()=>!document.getElementById('refreshAll').disabled);
  const failed=JSON.parse((await record()).raw);
  assert.deepEqual(failed.positions,m.positions,'HTTP 404 must preserve all last confirmed quotes and financial fields');
  assert.ok(requests.every(r=>!r.host.includes('eodhd')&&!r.host.includes('eodhistoricaldata')&&!r.host.includes('workers.dev')),'Worker-free path only');
  assert.deepEqual(errors,[]);results.push({engine,synthetic:true,holdings:4,source:'FMP direct',asOf:date,legacyKeyPreserved:true,diagnosisReadOnly:true,failedRefreshPreservesQuotes:true,widths:[320,360,390,412,430,768,1440],axeViolations:0});
  console.log(engine+': ETF-SOURCE-266 synthetic four-listing direct fetch, IDB, old-key preservation, 404 fallback, diagnostics, widths/Axe PASS');
 }catch(error){
  console.log('ETF_SOURCE_SYNTHETIC_FAILURE '+JSON.stringify({engine,requests,errors,state:await page.evaluate(()=>({priceInfo:document.getElementById('priceInfo')?.textContent,errors:document.getElementById('refreshErrorDetails')?.textContent,toast:document.getElementById('toast')?.textContent})).catch(()=>null)}));
  throw error;
 }finally{await context.close();await browser.close();}
}
mkdirSync('artifacts/gates',{recursive:true});writeFileSync('artifacts/gates/etf-source-recovery.json',JSON.stringify({base,liveProviderVerification:false,results},null,2));
// The existing mandatory ETF gate also verifies the additional direct provider.
await import('./browser-alpha-vantage.mjs');
