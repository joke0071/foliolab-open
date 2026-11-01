import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {referenceSearch} from '../src/reference-listings.js';
const base=process.env.ETF_SOURCE_BASE||'http://127.0.0.1:4173/';
const pairs=[['VWCE','IE00BK5BQT80'],['XDEM','IE00BL25JP72'],['XDEQ','IE00BL25JL35'],['5MVL','IE00BG0SKF03']];
const date=new Date(Date.now()-864e5).toISOString().slice(0,10),previous=new Date(Date.now()-2*864e5).toISOString().slice(0,10);
const report={base,synthetic:true,realProviderProof:false,engines:[]};
const deadline=setTimeout(()=>{console.error('Marketstack/secret-input browser deadline exceeded');process.exit(1);},240000);deadline.unref();
mkdirSync('artifacts/gates/marketstack',{recursive:true});
for(const engine of (process.env.ETF_SOURCE_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit}[engine]).launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),calls=[],errors=[];
 await context.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.origin===new URL(base).origin)return route.continue();
  if(u.hostname!=='api.marketstack.com')return route.abort();
  assert.equal(u.pathname,'/v2/eod');assert.equal(u.searchParams.get('access_key'),'SYNTHETIC_MARKETSTACK_KEY');assert.equal(u.searchParams.get('exchange'),'XETR');
  const symbol=u.searchParams.get('symbols'),index=pairs.findIndex(([s])=>s+'.DE'===symbol);assert.ok(index>=0);calls.push(symbol);
  await route.fulfill({status:200,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify({pagination:{count:4,total:4},untrustedDiagnostics:{echoedKey:'SYNTHETIC_MARKETSTACK_KEY'},data:[new Date(Date.now()-4*864e5).toISOString().slice(0,10),new Date(Date.now()-3*864e5).toISOString().slice(0,10),previous,date].map((d,i)=>({symbol,name:referenceSearch(pairs[index][0])[0].name,exchange:'XETR',price_currency:'EUR',date:d+'T00:00:00+0000',close:i===0?0:i===1?null:100+index+(i-2)*10,adj_close:9999}))})});
 });
 const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js'),db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 const nav=tab=>page.locator((page.viewportSize().width<720?'#mobileNav':'#sidebarNav')+' [data-page="'+tab+'"]').click();
 const refresh=async()=>{await nav('positions');await page.locator('#refreshAll').click();await page.waitForFunction(()=>!document.getElementById('refreshAll').disabled);};
 try{
  await page.goto(base);await page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await page.evaluate(async pairs=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.providers.push(createProvider({id:'p',name:'SYNTHETIC ETF broker'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'SYNTHETIC depot',type:'securities'},m));
   for(const [symbol,isin]of pairs)m.positions.push(createPosition({id:symbol,providerId:'p',accountId:'a',name:'SYNTHETIC '+symbol,kind:'etf',symbol,isin,currency:'EUR',mic:'XETR',exchange:'Xetra',quantity:'3.141592653589793238',price:0},m));
   m.settings.autoRefresh=false;m.settings.securitySource='marketstack';const store=new PortfolioStorage();await store.initialize();await store.save(m);store.close();
  },pairs);
  await page.reload();await nav('more');
  // Every real secret field, including opt-in backup passwords and worker/RPC
  // inputs, receives the same local-only button. No value/event/storage effects.
  const beforeEyes=await record();
  const secretCount=await page.locator('.credential-control input').count();assert.ok(secretCount>=11);
  for(let i=0;i<secretCount;i++){
   const input=page.locator('.credential-control input').nth(i);
   await input.evaluate(el=>{for(const d of el.closest('section')?.querySelectorAll('details')||[])d.open=true;for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
   if(!await input.isVisible())continue;
   const original=await input.inputValue(),toggle=input.locator('xpath=following-sibling::button[contains(@class,"credential-toggle")]');
   assert.equal(await input.getAttribute('type'),'password');assert.equal(await toggle.count(),1);assert.equal(await toggle.getAttribute('aria-controls'),await input.getAttribute('id'));
   assert.match(await toggle.getAttribute('aria-label'),/anzeigen/);
   const draft=await input.getAttribute('id')==='solanaRpc'?original:'SYNTHETIC_VISIBILITY_VALUE';
   if(draft!==original)await input.fill(draft);
   await input.evaluate(el=>{el.visibilityEvents=0;el.addEventListener('input',()=>el.visibilityEvents++);el.addEventListener('change',()=>el.visibilityEvents++);});
   const formBefore=await input.evaluate(el=>el.form?JSON.stringify([...new FormData(el.form)]):null);
   await toggle.click();assert.equal(await input.getAttribute('type'),'text');assert.equal(await toggle.getAttribute('aria-pressed'),'true');assert.match(await toggle.getAttribute('aria-label'),/verbergen/);
   assert.equal(await input.inputValue(),draft);assert.equal(await input.evaluate(el=>el.visibilityEvents),0);
   assert.equal(await input.evaluate(el=>el.form?JSON.stringify([...new FormData(el.form)]):null),formBefore);
   if(draft!==original)await input.fill(original);
   await toggle.focus();await input.evaluate(el=>el.visibilityEvents=0);
   await toggle.press('Space');assert.equal(await input.getAttribute('type'),'password');
   await toggle.press('Enter');assert.equal(await input.getAttribute('type'),'text');
   await toggle.press('Space');assert.equal(await input.getAttribute('type'),'password');
   assert.equal(await input.inputValue(),original);assert.equal(await input.evaluate(el=>el.visibilityEvents),0);
  }
  assert.deepEqual(await record(),beforeEyes,'Visibility must not save, revise or change canonical data');
  await page.locator('#marketSettings').evaluate(el=>el.open=true);
  await page.locator('[name=marketstackKey]').fill('SYNTHETIC_MARKETSTACK_KEY');await page.locator('#apiSettings button[type=submit]').click();
  await page.waitForFunction(()=>document.getElementById('toast')?.textContent==='Datenquellen und Zugänge lokal gespeichert.');
  const settings=await record();assert.equal(settings.settings.marketstackKey,'SYNTHETIC_MARKETSTACK_KEY');assert.ok(!settings.raw.includes('SYNTHETIC_MARKETSTACK_KEY'));
  await refresh();const fetched=await record(),model=JSON.parse(fetched.raw);
  assert.deepEqual(model.positions.map(p=>p.price),[110,111,112,113]);assert.ok(model.positions.every(p=>p.quantityExact==='3.141592653589793238'&&p.quoteSource==='Marketstack · Xetra EOD'&&p.quoteAsOf===date));assert.equal(calls.length,4);
  const gapError=await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{fetchSecurityHistory}=await import('/src/security-sources.js'),s=new PortfolioStorage();try{const m=await s.initialize();try{await fetchSecurityHistory(m.positions[0],m.settings,30);return '';}catch(e){return e.message;}}finally{s.close();}});
  assert.match(gapError,/2 fehlende oder Null-Schlusskurse/);assert.equal(calls.length,4);
  // Repair only this synthetic disposable cache to also verify the complete
  // history path. Production never silently repairs provider gaps.
  await page.evaluate(async()=>{const {alphaCache}=await import('/src/alpha-vantage.js');for(const symbol of ['VWCE','XDEM','XDEQ','5MVL'])await alphaCache().update('daily:marketstack:'+symbol+'.DE',old=>({...old,data:{data:old.data.data.filter(row=>row.close!==null)}}));});
  const history=await page.evaluate(async()=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js'),{fetchSecurityHistory}=await import('/src/security-sources.js');const s=new PortfolioStorage();try{const m=await s.initialize();return await fetchSecurityHistory(m.positions[0],m.settings,30);}finally{s.close();}});
  assert.equal(history.priceType,'close');assert.equal(history.points.at(-1).total,110);assert.equal(calls.length,4);
  await page.reload();await refresh();assert.equal(calls.length,4);
  await nav('more');await page.locator('#marketSettings').evaluate(el=>el.open=true);
  assert.equal(await page.locator('[name=marketstackKey]').getAttribute('type'),'password');
  await page.locator('#checkMarketSources').click();await page.waitForFunction(()=>document.getElementById('marketDiagnosticStatus').textContent.includes('Diagnose beendet'));
  assert.match(await page.locator('#marketDiagnosticStatus').innerText(),/Marketstack · Tageskurs aus lokalem Cache/);assert.equal(calls.length,4);
  const baseline=await record();
  for(const width of [320,360,390,412,430,768,1440]){
   await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   const violations=await page.evaluate(async()=> (await axe.run('#morePage',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations);assert.deepEqual(violations.map(v=>v.id),[]);
   for(const name of ['alphaVantageKey','marketstackKey','coinGeckoKey']){
    const button=page.locator('[name="'+name+'"] + button'),box=await button.boundingBox(),style=await button.evaluate(el=>({width:getComputedStyle(el).width,height:getComputedStyle(el).height}));
    // Firefox subtracts fractional transformed coordinates (43.9999389 for
    // exactly 44 CSS px). Keep the 44px CSS contract and only allow float noise.
    assert.ok(parseFloat(style.width)>=44&&parseFloat(style.height)>=44&&box.width>=43.999&&box.height>=43.999,JSON.stringify({engine,width,name,box,style}));
   }
  }
  assert.deepEqual(await record(),baseline);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/gates/marketstack/'+engine+'-390.png',fullPage:true});
  await page.locator('#marketSettings').screenshot({path:'artifacts/gates/marketstack/'+engine+'-secret-fields.png'});
  await page.evaluate(async()=>{const {alphaCache,alphaKeyId}=await import('/src/alpha-vantage.js'),store=alphaCache(),id=await alphaKeyId('SYNTHETIC_MARKETSTACK_KEY');await store.update('budget:marketstack:'+id,old=>({...old,used:100}));for(const symbol of ['VWCE','XDEM','XDEQ','5MVL'])await store.update('daily:marketstack:'+symbol+'.DE',()=>({day:'1900-01-01'}));});
  await refresh();assert.equal(calls.length,4);const after=JSON.parse((await record()).raw);assert.deepEqual(after.positions,JSON.parse(baseline.raw).positions);
  assert.deepEqual(after.journalEntries,[]);assert.deepEqual(after.bookings,[]);assert.deepEqual(after.externalCashFlows,[]);
  const beforeRace=await record();
  await page.evaluate(async()=>{const {alphaCache,alphaKeyId}=await import('/src/alpha-vantage.js');await alphaCache().update('budget:marketstack:'+await alphaKeyId('SYNTHETIC_MARKETSTACK_KEY'),old=>({...old,used:99,nextAt:0,blockedUntil:0}));});
  const other=await context.newPage();await other.goto(base);await other.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const race=(target,symbol)=>target.evaluate(async symbol=>{const {referenceSearch}=await import('/src/reference-listings.js'),{marketstackQuoteBars}=await import('/src/marketstack.js');try{await marketstackQuoteBars(referenceSearch(symbol)[0],'SYNTHETIC_MARKETSTACK_KEY');return 'reserved';}catch(e){if(!/Monatskontingent/.test(e.message))throw e;return 'blocked';}},symbol);
  assert.deepEqual((await Promise.all([race(page,'VWCE'),race(other,'XDEM')])).sort(),['blocked','reserved']);assert.equal(calls.length,5);assert.deepEqual(await record(),beforeRace);await other.close();
  if(engine==='chromium'){
   const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   try{const touch=await touchContext.newPage();await touch.goto(base);await touch.locator('#mobileNav [data-page="more"]').click();await touch.locator('#marketSettings').evaluate(el=>el.open=true);const input=touch.locator('[name=alphaVantageKey]');await input.fill('SYNTHETIC_TOUCH_SECRET');await touch.locator('[name=alphaVantageKey] + button').tap();assert.equal(await input.inputValue(),'SYNTHETIC_TOUCH_SECRET');assert.equal(await input.getAttribute('type'),'text');await touch.locator('[name=alphaVantageKey] + button').tap();assert.equal(await input.getAttribute('type'),'password');}finally{await touchContext.close();}
  }
  // The RPC has an existing blur/change autosave. Revealing an unfinished
  // address must preserve its draft and must not invoke that handler.
  await nav('more');await page.locator('#blockchainSettings').evaluate(el=>el.open=true);await page.locator('#solanaRpcSetup').evaluate(el=>el.open=true);
  const beforeRPC=await record(),rpc=page.locator('#solanaRpc');await rpc.fill('SYNTHETIC_UNFINISHED_RPC');
  await page.locator('#solanaRpc + button').click();assert.equal(await rpc.inputValue(),'SYNTHETIC_UNFINISHED_RPC');assert.deepEqual(await record(),beforeRPC);
  assert.deepEqual(errors,[]);report.engines.push({engine,pass:true,secretFields:secretCount,secretTogglesPreserveValuesEventsFormDataAndIDB:true,keyboard:true,fourQuotes:true,sharedHistory:true,persistentCache:true,monthlyBudget:true,historicalGapsBlocked:true,widths:7,axeScans:7});
  console.log(engine+': MARKETSTACK + SECRET INPUTS: four raw EOD quotes despite historical zero/null gaps/strict history rejection/IDB/shared history/reload/month budget; all secret fields value+FormData+event+record preservation/keyboard/7 widths/44px/Axe PASS');
 }catch(error){await page.screenshot({path:'artifacts/gates/marketstack/'+engine+'-failure.png',fullPage:true}).catch(()=>{});throw error;}
 finally{writeFileSync('artifacts/gates/marketstack.json',JSON.stringify(report,null,2));await context.close();await browser.close();}
}
