import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {verifiedFXRelease} from './verified-fx-release.mjs';

// Normal UI refresh, real Web Lock and native IndexedDB. Every response and the
// publication clock are fixed; no provider traffic or legacy storage double.
const base=process.env.ETF_SOURCE_BASE||'http://127.0.0.1:4173/';
const origin=new URL(base).protocol==='https:'?new URL(base).origin:'https://fx-age.example.test';
const dir=process.env.FX_AGE_OUTPUT_DIR||'artifacts/gates/fx-age';mkdirSync(dir,{recursive:true});
const clock='2026-11-15T18:00:00.000Z',stateKey='foliolab-open-auto-refresh-v2';
const cases=[
 {id:'old-known',date:'2000-01-03',known:true,accept:false},
 {id:'old-unknown',date:'2000-01-03',known:false,accept:false},
 {id:'eight-days-known',date:'2026-11-07',known:true,accept:false},
 {id:'today',date:'2026-11-15',known:false,accept:true},
 {id:'weekend-friday',date:'2026-11-13',known:false,accept:true},
 {id:'seven-days-boundary',date:'2026-11-08',known:false,accept:true},
 {id:'old-known-other-fx-saved',date:'2000-01-03',known:true,accept:false,mixed:true},
 {id:'old-unknown-other-fx-saved',date:'2000-01-03',known:false,accept:false,mixed:true}
];
const replay=process.env.FX_AGE_VERIFIED_RELEASE?verifiedFXRelease(process.env.FX_AGE_VERIFIED_RELEASE,{base}):null;
const domainControl=process.env.FX_AGE_DOMAIN_CONTROL==='1';
const selected=domainControl?cases.filter(f=>['today','old-unknown-other-fx-saved'].includes(f.id)):cases;
assert.equal(selected.length,domainControl?2:8);
const deadline=setTimeout(()=>{console.error('FX age browser deadline exceeded');process.exit(1);},180000);deadline.unref();
for(const engine of (process.env.ETF_SOURCE_ENGINES||'chromium').split(',')){
 const browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const results=[],transport={mode:replay?'verified-published-byte-replay':'original',releaseSHA:replay?.sha??null,verifiedFiles:replay?.count??null,sameOriginRequests:0,productionRequests:[],replayedRequests:0};
 try{for(const fixture of selected){
  const event=(stage,detail={})=>appendFileSync(dir+'/'+engine+'-stages.jsonl',JSON.stringify({engine,case:fixture.id,stage,...detail})+'\n');
  event('BEGIN');
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.clock.setFixedTime(new Date(clock));
   await context.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.origin===origin){
     transport.sameOriginRequests++;
     if(replay){const bytes=replay.files.get(u.pathname);assert.ok(bytes,'Unverified application resource '+u.pathname);transport.replayedRequests++;return route.fulfill({body:bytes,contentType:u.pathname.endsWith('.js')?'text/javascript':u.pathname.endsWith('.css')?'text/css':u.pathname.endsWith('.png')?'image/png':u.pathname.endsWith('.svg')?'image/svg+xml':u.pathname.endsWith('.woff2')?'font/woff2':u.pathname.endsWith('.webmanifest')?'application/manifest+json':'text/html'});}
     if(origin===new URL(base).origin){transport.productionRequests.push({url:u.href,at:Date.now()});return route.continue();}
     return route.fulfill({path:process.cwd()+(u.pathname==='/'?'/index.html':u.pathname)});
    }
    assert.equal(u.hostname,'api.frankfurter.dev');assert.equal(u.pathname,'/v1/latest');
    const currency=u.searchParams.get('base');requests.push(currency);
    return route.fulfill({json:{base:currency,date:currency==='GBP'?'2026-11-13':fixture.date,rates:{EUR:currency==='GBP'?'1.1':fixture.accept?'0.85':'0.1'}}});
   });
   const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
   const record=()=>page.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
   const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),stateKey);
   // Only the direct production control may recover from an explicit transient
   // response before fixture state is written. The original request still uses
   // the production origin and any failure on the second navigation fails.
   if(domainControl&&!replay&&origin===new URL(base).origin){
    const startupFailures=[];
    const observeStartup=response=>{
     const request=response.request(),url=new URL(response.url());
     if(url.origin===origin&&request.resourceType()==='script'&&response.status()>=400)
      startupFailures.push({path:url.pathname,status:response.status(),retryAfter:response.headers()['retry-after']??null});
    };
    page.on('response',observeStartup);
    try{
     await page.goto(origin+'/');
     if(startupFailures.length===1&&startupFailures[0].path==='/src/reference-management.js'&&startupFailures[0].status===503&&startupFailures[0].retryAfter==='0'){
      event('STARTUP_ORIGIN_RETRY',startupFailures.pop());
      await page.reload();
     }
     assert.deepEqual(startupFailures,[],'Direct production startup module responses');
     await ready();
    }finally{page.off('response',observeStartup);}
   }else{
    await page.goto(origin+'/');await ready();
   }
   await page.evaluate(async({known,mixed,key})=>{
    const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
    const m=blankModel();m.settings.autoRefresh='off';
    m.providers.push(createProvider({id:'p',name:'SYNTHETIC FX'}));
    m.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic cash',type:'exchange'},m));
    const p=createPosition({id:'usd',providerId:'p',accountId:'a',kind:'cash',name:'Synthetic USD',currency:'USD',quantity:100,price:1,fxRate:known?0.9:null,fxRateExact:known?'0.9':null},m);
    if(known)Object.assign(p,{fxSource:'Frankfurter',fxRateDate:'2026-11-12',fxUpdatedAt:'2026-11-12T18:00:00.000Z'});
    m.positions.push(p);
    if(mixed)m.positions.push(createPosition({id:'gbp',providerId:'p',accountId:'a',kind:'cash',name:'Synthetic GBP',currency:'GBP',quantity:10,price:1,fxRate:null,fxRateExact:null},m));
    const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();localStorage.removeItem(key);
   },{...fixture,key:stateKey});
   await page.reload();await ready();const before=await record();event('SEEDED',{revision:before.revision??before._revision??null});
   await page.locator('#mobileNav [data-page="positions"]').click();
   await page.locator('#refreshAll').click();
   await page.waitForFunction(key=>{const s=JSON.parse(localStorage.getItem(key));return s&&(s.lastSuccessAt!==null||s.failures>0)&&!document.getElementById('refreshAll').disabled;},stateKey);
   const after=await record(),attempt=await state(),ui=await page.locator('#priceInfo').innerText(),toast=await page.locator('#toast').innerText();
   const afterModel=JSON.parse(after.raw),beforeModel=JSON.parse(before.raw);
   const current=afterModel.positions.find(p=>p.id==='usd'),previous=beforeModel.positions.find(p=>p.id==='usd');
   event('REFRESHED',{ui,attempt});
   if(fixture.accept){
    assert.equal(current.fxRateExact,'0.85');assert.equal(current.fxRateDate,fixture.date);assert.equal(current.fxUpdatedAt,clock);
    assert.equal(attempt.lastSuccessAt,Date.parse(clock));assert.equal(attempt.completed['fx:USD'],Date.parse(clock));assert.equal(attempt.failures,0);
    assert.equal(toast,'Portfolio aktualisiert.');assert.match(ui,/^1 Datenupdates · \d{2}:\d{2}$/);assert.notDeepEqual(after,before);
   }else{
    assert.deepEqual(current,previous,'Rejected FX cannot overwrite any position field');
    assert.equal(attempt.lastSuccessAt,null);assert.equal(attempt.completed['fx:USD'],undefined);assert.equal(attempt.failures,1);
    assert.notEqual(toast,'Portfolio aktualisiert.');
    if(fixture.mixed){assert.equal(attempt.completed['fx:GBP'],Date.parse(clock));assert.equal(afterModel.positions.find(p=>p.id==='gbp').fxRateExact,'1.1');}
    else{assert.deepEqual(after,before,'No save/revision/snapshot on rejected-only refresh');assert.match(ui,/^0 Datenupdates · 1 Abfragen prüfen/);assert.deepEqual(attempt.completed,{});}
    if(!fixture.known){assert.equal(current.fxRate,null);assert.equal(current.fxRateExact,'UNKNOWN');}
   }
   assert.deepEqual(afterModel.journalEntries,beforeModel.journalEntries);assert.deepEqual(afterModel.externalCashFlows,beforeModel.externalCashFlows);
   await page.reload();await ready();const reopened=await record();assert.deepEqual(reopened,after,'Reopen must preserve the complete native record');assert.deepEqual(await state(),attempt);
   assert.deepEqual(errors,[]);assert.deepEqual(requests.sort(),fixture.mixed?['GBP','USD']:['USD']);
   results.push({fixture,result:'PASS',before:previous,after:current,attempt,ui,toast,nativeRecordReopenEqual:true,journalUnchanged:true,requests,errors});
   event('RESULT',{result:'PASS'});
  }finally{event('CLEANUP_BEGIN');await context.close();event('CLEANUP_DONE');}
 }}finally{await browser.close();}
 writeFileSync(dir+'/'+engine+'.json',JSON.stringify({engine,base,clock,storage:'native IndexedDB',serviceWorkers:'blocked; existing separate PWA gates retained',synthetic:true,transport,results},null,2));
 console.log('FX age '+engine+': '+results.length+' native refresh/reopen cases '+'PASS');
}
clearTimeout(deadline);
