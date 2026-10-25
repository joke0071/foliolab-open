import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
const token='SYNTHETIC_WORKER_ACCESS_TOKEN_123456789012';
const date=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
let workerCalls=0,directCalls=0;
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),p=createProvider({name:'Synthetic Broker'});m.providers.push(p);
  const a=createAccount({name:'ETF Depot',providerId:p.id},m);m.accounts.push(a);
  m.positions.push(createPosition({id:'market-worker-test',providerId:p.id,accountId:a.id,
   name:'Synthetic All World',kind:'etf',symbol:'VWCE',isin:'IE00BK5BQT80',mic:'XETR',exchange:'Xetra',
   currency:'EUR',quantity:'10',price:'100'},m));
  m.settings.autoRefresh=false;
  persist(m);
 });
 await page.route('https://eodhd.com/api/eod/**',route=>{directCalls++;return route.abort('failed');});
 await page.route('https://my-owned-worker.workers.dev/api/market/eodhd',async route=>{
  const req=route.request();
  const headers={'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'authorization, content-type'};
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  workerCalls++;
  assert.equal(req.method(),'POST');
  assert.equal(req.headers().authorization,'Bearer '+token);
  const body=req.postDataJSON();
  assert.equal(body.symbol,'VWCE.XETRA');
  assert.equal(body.api_token,undefined);
  return route.fulfill({status:200,headers:{...headers,'content-type':'application/json'},body:JSON.stringify({
   schemaVersion:1,status:'ok',source:'EODHD',symbol:body.symbol,
   points:[{date:date(2),close:101.25},{date:date(1),close:102.75}]
  })});
 });
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 assert.equal(await page.locator('#marketWorkerSetup').evaluate(el=>el.open),false);
 assert.equal(await page.locator('#marketWorkerSetup').textContent().then(x=>x.includes('Eigener EODHD-Kursdienst')),true);
 await page.locator('#optionalConnections').evaluate(el=>el.open=true);await page.locator('#marketWorkerSetup').evaluate(el=>el.open=true);
 await page.locator('#marketSettings').evaluate(el=>el.open=true);
 await page.locator('[name="securitySource"]').selectOption('eodhd');
 await page.locator('[name="eodhdWorkerEndpoint"]').fill('https://my-owned-worker.workers.dev');
 assert.equal(await page.locator('#marketWorkerSetup .credential-toggle').count(),1,'Worker token gets the same visibility eye as other keys');
 await page.locator('#marketWorkerSetup .credential-toggle').click();
 assert.equal(await page.locator('[name="eodhdWorkerAccessToken"]').getAttribute('type'),'text');
 await page.locator('#marketWorkerSetup .credential-toggle').click();
 assert.equal(await page.locator('[name="eodhdWorkerAccessToken"]').getAttribute('type'),'password');
 await page.locator('[name="eodhdWorkerAccessToken"]').fill('short');
 await page.locator('#optionalConnections > button[type="submit"]').click();
 assert.match(await page.locator('#toast').innerText(),/24 bis 128 Zeichen/);
 await page.locator('[name="eodhdWorkerAccessToken"]').fill(token);
 await page.locator('#optionalConnections > button[type="submit"]').click();
 // Wait for the successful settings write before inspecting stored worker access.
 await page.waitForFunction(()=>document.getElementById('toast')?.textContent==='Datenquellen und Zugänge lokal gespeichert.');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).settings.eodhdKey),'','Never require local EODHD token');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).settings.eodhdWorkerEndpoint),'https://my-owned-worker.workers.dev');
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#refreshAll').click();
 await page.waitForFunction(()=>document.querySelector('#priceInfo')?.textContent?.includes('Datenupdates'));
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(saved.positions[0].price,102.75,'Worker quote failed. Calls='+workerCalls+' direct='+directCalls+'; settings='+JSON.stringify({source:saved.settings.securitySource,hasWorker:!!saved.settings.eodhdWorkerEndpoint,hasToken:!!saved.settings.eodhdWorkerAccessToken})+'; UI='+await page.locator('#priceInfo').innerText()+'; errors='+await page.locator('#refreshErrorDetails').innerText());
 assert.equal(saved.positions[0].quantityExact,'10');
 assert.equal(directCalls,0,'Configured worker must prevent direct EODHD requests');
 await page.locator('#mobileNav [data-page="dashboard"]').click();
 const provider=page.locator('#providerOverview .provider-accordion').first();
 await provider.locator(':scope > summary').click();
 const position=page.locator('#providerOverview [data-position-id="market-worker-test"]');
 await position.locator(':scope > summary').click();
 await position.locator('.position-history-chart .chart-plot').waitFor();
 assert.match(await position.innerText(),/eigener Worker/);
 assert.ok(workerCalls>=2,'Worker fetched both current quote and historical chart');
 await page.locator('#mobileNav [data-page="history"]').click();
 const perf=page.locator('#performanceDetails');
 assert.equal(await perf.getAttribute('open'),null,'Returns are quiet and collapsed by default');
 assert.equal(await page.locator('#performanceSummary').textContent(),'','Unavailable return is explained only on opening');
 await perf.locator('summary').click();
 assert.match(await page.locator('#performanceInfo').innerText(),/XIRR/);
 assert.equal(await page.locator('#startPerformance').isVisible(),true);
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#blockchainSettings').evaluate(el=>el.open=true);
 assert.doesNotMatch(await page.locator('#blockchainSettings').innerText(),/Entwicklungszugang gelten enge Limits\. Binplorer/);
 assert.equal(await page.locator('#dataSourcesPanel #legacyQuoteAudit').count(),0,'Precision diagnosis belongs in concrete data-quality review');
 for(const width of [320,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=1,'Unexpected overflow at '+width+': '+overflow);
 }
 console.log('OPTIONAL MARKET WORKER: config, auth, quote, native history, privacy, returns disclosure and 320–1440px PASS');
}finally{await browser.close();}
