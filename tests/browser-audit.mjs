import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#addWallet').click();
 await page.locator('#scanNetwork').selectOption('btc-hd');
 assert.equal(await page.locator('#hdPrivacyHint').isVisible(),true);
 assert.match(await page.locator('#hdPrivacyHint').innerText(),/zusammengehörige/);
 await page.locator('#scanNetwork').selectOption('1');
 assert.equal(await page.locator('#hdPrivacyHint').isVisible(),false);
 page.once('dialog',d=>d.accept()); // Network controls were touched.
 await page.locator('#closeDialog').click();
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),provider=createProvider({name:'Audit'});m.providers.push(provider);
  const account=createAccount({providerId:provider.id,name:'Depot',type:'securities'},m);m.accounts.push(account);
  for(let i=0;i<100;i++)m.positions.push(createPosition({id:'test-'+i,providerId:provider.id,accountId:account.id,name:i===0?'<img src=x onerror=window.__auditXss=true>':'ETF '+i,kind:'etf',symbol:'T'+i,quantity:1,price:50},m));
  persist(m);
 });
 await page.reload();
 for(const width of [320,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const nav=(await page.locator('#mobileNav').isVisible())?'#mobileNav':'#sidebarNav';
  for(const section of ['positions','dashboard','history','more']){
   await page.locator(nav+' [data-page="'+section+'"]').click();
   if(section==='history'){
    const comparison=await page.evaluate(()=>{
     const details=document.getElementById('performanceDetails');
     const toggle=document.getElementById('compareCapital'),hint=document.getElementById('capitalCompareHelp');
     return {nested:details.contains(toggle)&&details.contains(hint),title:details.querySelector('summary span')?.textContent,closed:!details.open};
    });
    assert.equal(comparison.nested,true,'Capital comparison must be inside return details');
    assert.match(comparison.title,/Rendite & Geldflüsse/);
    if(width===320)assert.equal(comparison.closed,true,'Performance section should remain collapsed by default');
    await page.locator('#performanceDetails').evaluate(el=>el.open=true);
   }
   const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
   assert.ok(dimensions.scroll<=dimensions.width+1,section+' horizontal overflow at '+width+': '+JSON.stringify(dimensions));
   if(section==='history')await page.locator('#performanceDetails').evaluate(el=>el.open=false);
  }
 }
 assert.equal(await page.evaluate(()=>window.__auditXss),undefined,'HTML injection in asset name');
 assert.equal(await page.locator('#positionList img').count(),0,'Asset name escaped');
 await page.evaluate(async()=>{
  const {load,persist}=await import('/src/model.js'),m=load();
  const unknown=m.positions.find(p=>p.id==='test-2');unknown.price=0;unknown.priceExact='0';
  persist(m);
 });
 await page.reload();
 await page.locator('#sidebarNav [data-page="dashboard"]').click();
 assert.match(await page.locator('#totalHint button').innerText(),/1 Position prüfen/);
  assert.match(await page.locator('#totalHint button').getAttribute('title'),/Bewertung eingeschränkt: 1 ohne Kurs/);
 await page.evaluate(async()=>{
  const {load,persist}=await import('/src/model.js'),{executeTransaction}=await import('/src/transactions.js');
  const m=load();
  executeTransaction(m,{type:'buy',positionId:'test-0',date:new Date().toISOString().slice(0,10),quantity:1,unitPrice:50});
  persist(m);
 });
 await page.reload();
 await page.locator('#sidebarNav [data-page="positions"]').click();
 await page.locator('[data-action="edit-position"][data-id="test-0"]').click();
 await page.locator('#deletePosition').click();
 assert.match(await page.locator('#toast').innerText(),/kann nicht gelöscht/);
 await page.locator('#closeDialog').click();
 page.once('dialog',d=>d.accept());
 await page.locator('[data-action="edit-position"][data-id="test-1"]').click();
 await page.locator('#deletePosition').click();
 await page.evaluate(async()=>{
  const {safeImport}=await import('/src/model.js');
  safeImport(JSON.parse(localStorage.getItem('foliolab-open-v1')));
 });
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).positions.length),99);
 console.log('AUDIT-BROWSER 100 holdings, six viewports, four pages, HD privacy, XSS and ledger deletion guards PASS');
}finally{await browser.close();}
