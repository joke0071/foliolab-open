import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
/** Real canonical IDB fixture; shared by regular UI-quality PR/Main/live runs. */
export async function accountAllocationBrowserContract({p,record,engine}){
 const dir='artifacts/gates/account-allocation';mkdirSync(dir,{recursive:true});
 await p.context().setOffline(false);
 const setup=async variant=>{
  await p.evaluate(async variant=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js');
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=false;
   m.providers.push(createProvider({id:'alloc-provider',name:'Synthetische Testbank'}));
   for(const [id,name,type]of [['alloc-depot','Depot','securities'],['alloc-cash','Tagesgeld','savings'],['alloc-empty','Leeres Depot','securities']])m.accounts.push(createAccount({id,name,type,providerId:'alloc-provider'},m));
   for(const [i,amount]of [400,300,200,100].entries())m.positions.push(createPosition({id:'alloc-'+i,name:i===0?'Synthetischer ETF mit sehr langem Namen und eindeutigem Depotbezug':'ETF '+i,kind:i===3?'cash':'etf',quantity:1,price:amount,providerId:'alloc-provider',accountId:'alloc-depot'},m));
   m.positions.push(createPosition({id:'alloc-savings',name:'Separates Guthaben',kind:'cash',quantity:5000,price:1,providerId:'alloc-provider',accountId:'alloc-cash'},m));
   if(variant==='unknown')Object.assign(m.positions[0],{currency:'USD',fxRate:null,fxRateExact:'UNKNOWN'});
   if(variant==='separate'){
    m.positions.push(createPosition({id:'alloc-excluded',name:'Ausgeschlossen',kind:'etf',quantity:1,price:900,valuationMode:'excluded',representedByPositionId:'alloc-0',providerId:'alloc-provider',accountId:'alloc-depot'},m));
    m.positions.push(createPosition({id:'alloc-debt',name:'Verbindlichkeit',kind:'etf',quantity:1,price:70,valuationMode:'liability',economicRole:'borrowed',providerId:'alloc-provider',accountId:'alloc-depot'},m));
   }
   if(variant==='empty')m.positions=[];
   const store=new PortfolioStorage();await store.initialize();await store.save(m);store.close();
  },variant);
  await p.reload();await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await p.locator('#mobileNav [data-page=dashboard]:visible,#sidebarNav [data-page=dashboard]:visible').click();
  const summary=p.locator('#providerOverview .provider-accordion>summary');
  if(await summary.locator('..').getAttribute('open')===null)await summary.click();
 };
 const rows=p.locator('#providerOverview .has-account-allocation');
 await setup('known');const before=await record();
 assert.equal(await rows.count(),4);
 assert.deepEqual(await rows.locator('.account-allocation>span').allTextContents(),['40 %','30 %','20 %','10 %']);
 assert.equal(await p.locator('#providerOverview .simple-cash-account').count(),1);
 assert.match(await p.locator('#providerOverview').innerText(),/Leeres Depot/);
 const scans=[];
 for(const width of [320,360,390,412,430,768,1440]){
  await p.setViewportSize({width,height:850});
  const geometry=await rows.evaluateAll(nodes=>nodes.map(el=>{
   const r=el.getBoundingClientRect(),parts=[...el.querySelectorAll('.provider-holding-name,.provider-holding-right>strong,.account-allocation,.provider-position-chevron')].map(n=>n.getBoundingClientRect());
   return {height:r.height,inside:parts.every(part=>part.left>=r.left-1&&part.right<=r.right+1&&part.top>=r.top-1&&part.bottom<=r.bottom+1)};
  }));
  assert.ok(geometry.every(g=>g.inside&&g.height>=44),JSON.stringify({width,geometry}));
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+width);
  assert.deepEqual(await p.evaluate(async()=>(await axe.run('#providerOverview',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);
  await rows.first().scrollIntoViewIfNeeded();await p.screenshot({path:dir+'/'+engine+'-'+width+'.png'});scans.push({width,result:'PASS'});
 }
 const first=rows.first();await first.focus();await p.keyboard.press('Enter');assert.equal(await first.locator('..').getAttribute('open'),'');
 await p.keyboard.press('Enter');assert.equal(await first.locator('..').getAttribute('open'),null);
 await first.tap();assert.equal(await first.locator('..').getAttribute('open'),'');await first.tap();
 assert.equal(await first.locator('.account-allocation button,.account-allocation [tabindex]').count(),0);
 await p.setViewportSize({width:320,height:850});
 await p.evaluate(()=>document.documentElement.style.fontSize='200%');
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% CSS system-text approximation overflow');
 assert.deepEqual(await record(),before,'all quantities/journals/raw/revision/settings unchanged');
 await setup('unknown');const unknownBefore=await record();
 assert.deepEqual(await rows.locator('.account-allocation>span').allTextContents(),['–','–','–','–']);
 assert.match(await p.locator('.account-allocation-note').innerText(),/Gewichtung unvollständig/);
 assert.match(await rows.first().getAttribute('aria-label'),/nicht verfügbar/);
 await p.screenshot({path:dir+'/'+engine+'-unknown.png'});assert.deepEqual(await record(),unknownBefore);
 await setup('separate');const separateBefore=await record();
 assert.deepEqual(await rows.locator('.account-allocation>span').allTextContents(),['40 %','30 %','20 %','10 %','–','–']);
 assert.match(await p.locator('.account-allocation-note').innerText(),/Verbindlichkeiten ohne Anteil/);
 assert.deepEqual(await record(),separateBefore);
 await setup('empty');const emptyBefore=await record();assert.equal(await rows.count(),0);
 assert.doesNotMatch(await p.locator('#providerOverview').innerText(),/NaN|Infinity/);assert.deepEqual(await record(),emptyBefore);
 writeFileSync(dir+'/'+engine+'.json',JSON.stringify({engine,result:'PASS',scope:'UI-ALLOC01 canonical IDB read-only account/depot rings',scans,checks:['40/30/20/10 including depot cash; separate savings excluded from denominator','UNKNOWN suppresses every share in its account','excluded/liability no share; no denominator dilution','empty account no fabricated shares','keyboard/click/detail retained; no new focus stops','exact complete IDB invariance; enlarged text'],nativeDevice:false},null,2));
}
