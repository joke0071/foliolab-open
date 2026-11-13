// Prepared targeted UI qualification. Running requires the explicit native approval.
// Retained legacy installation fixture: never claim IDB/restore/device coverage.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
import {legacyContext} from './legacy-browser-fixture.mjs';
const engine=process.env.BROWSER||'chromium',engines={chromium,firefox,webkit};
assert.ok(Object.hasOwn(engines,engine),'BROWSER must be chromium/firefox/webkit');
assert.match(process.env.FOLIOLAB_TEST_SHA||'',/^[0-9a-f]{40}$/,'Supply exact candidate FOLIOLAB_TEST_SHA');
const dir='artifacts/account-allocation-'+engine;
await mkdir(dir,{recursive:true});
const report={engine,sourceSHA:process.env.FOLIOLAB_TEST_SHA,scope:'UI-ALLOC01',storage:'explicit existing legacy fixture',fixture:{depotEUR:[400,300,200,100],separateCashEUR:5000,shares:[40,30,20,10]},nativeDevice:false,stages:[],result:'NOT_REACHED',cleanup:'NOT_REACHED'};
async function stage(name,state='BEGIN'){
 report.stages.push({name,state});console.log(JSON.stringify({scope:report.scope,name,state}));
 await writeFile(dir+'/report.json',JSON.stringify(report,null,2));
}
let browser,context;
try{
 await stage('launch');browser=await engines[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 context=await legacyContext(browser,{viewport:{width:390,height:850},hasTouch:true});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.abort());
 await stage('fixture');await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel();m.settings.autoRefresh='off';
  const p=createProvider({name:'Synthetische Testbank'});m.providers.push(p);
  const a=createAccount({name:'Depot',type:'securities',providerId:p.id},m),cash=createAccount({name:'Tagesgeld',type:'savings',providerId:p.id},m);m.accounts.push(a,cash);
  for(const [i,amount]of [400,300,200,100].entries())m.positions.push(createPosition({name:i===0?'Synthetischer ETF mit sehr langem Namen und eindeutigem Depotbezug':'ETF '+i,kind:'etf',quantity:1,price:amount,providerId:p.id,accountId:a.id},m));
  m.positions.push(createPosition({name:'Cash',kind:'cash',quantity:5000,price:1,providerId:p.id,accountId:cash.id},m));
  persist(m);
 });
 await page.reload();await page.locator('#providerOverview .provider-accordion>summary').click();
 const rows=page.locator('#providerOverview .has-account-allocation');
 assert.equal(await rows.count(),4);
 const raw=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 assert.deepEqual(await rows.locator('.account-allocation>span').allTextContents(),['40 %','30 %','20 %','10 %']);
 for(const width of [320,360,390,412,430,768,1440]){
  await stage('width-'+width);await page.setViewportSize({width,height:850});
  const geometry=await rows.evaluateAll(nodes=>nodes.map(el=>{
   const r=el.getBoundingClientRect(),parts=[...el.querySelectorAll('.provider-holding-name,.provider-holding-right>strong,.account-allocation,.provider-position-chevron')].map(n=>n.getBoundingClientRect());
   return {height:r.height,inside:parts.every(p=>p.left>=r.left-1&&p.right<=r.right+1&&p.top>=r.top-1&&p.bottom<=r.bottom+1)};
  }));
  assert.ok(geometry.every(g=>g.inside&&g.height>=44),JSON.stringify({width,geometry}));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+width);
  await page.screenshot({path:dir+'/width-'+width+'.png',fullPage:true});
  await stage('width-'+width,'PASS');
 }
 await stage('keyboard-touch-zoom');
 const first=rows.first();await first.focus();await page.keyboard.press('Enter');
 assert.equal(await first.locator('..').getAttribute('open'),'');
 await page.keyboard.press('Enter');assert.equal(await first.locator('..').getAttribute('open'),null);
 await first.tap();assert.equal(await first.locator('..').getAttribute('open'),'');await first.tap();
 assert.equal(await first.locator('.account-allocation button,.account-allocation [tabindex]').count(),0);
 await page.addStyleTag({content:'html{font-size:200%}'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% CSS system-text approximation overflow');
 // Browser/system zoom and physical Android remain separate operator evidence.
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),raw);
 await stage('unknown-countercase');
 await page.evaluate(async()=>{
  const {load,persist}=await import('/src/model.js'),m=load();
  Object.assign(m.positions[0],{currency:'USD',fxRate:null,fxRateExact:'UNKNOWN'});persist(m);
 });
 await page.reload();await page.locator('#providerOverview .provider-accordion>summary').click();
 const unknownRaw=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 assert.deepEqual(await rows.locator('.account-allocation>span').allTextContents(),['–','–','–','–']);
 assert.match(await page.locator('.account-allocation-note').innerText(),/Gewichtung unvollständig/);
 assert.match(await rows.first().getAttribute('aria-label'),/nicht verfügbar/);
 await page.screenshot({path:dir+'/unknown.png',fullPage:true});
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),unknownRaw);
 report.result='PASS';await stage('targeted-ui','PASS');
}catch(error){report.result='FAIL';report.error=String(error);await stage('targeted-ui','FAIL');throw error;}
finally{
 // Cleanup is a separate outcome and never retroactively fabricates a UI result.
 try{await stage('cleanup');await context?.close();await browser?.close();report.cleanup='PASS';}
 catch(error){report.cleanup='FAIL';report.cleanupError=String(error);process.exitCode=1;}
 await writeFile(dir+'/report.json',JSON.stringify(report,null,2));
}
