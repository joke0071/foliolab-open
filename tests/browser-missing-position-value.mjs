import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {blankModel,createProvider,createAccount,createPosition,money} from '../src/model.js';
const out='artifacts/gates/missing-position-value';mkdirSync(out,{recursive:true});
const report={engines:[]};const axe=readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8');
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true}),context=await browser.newContext(),p=await context.newPage();
 await p.addInitScript({content:axe});
 await p.addInitScript(()=>{
  window.__allocationTrace=[];
  for(const type of ['pointerover','pointerout','focusin','focusout','pointerdown','pointerup','click'])document.addEventListener(type,event=>{
   const target=event.target.closest?.('[data-allocation-index],.allocation-center');if(!target)return;
   queueMicrotask(()=>{window.__allocationTrace.push({type,target:target.className?.baseVal??target.className,index:target.dataset.allocationIndex,share:document.getElementById('donutShare')?.textContent,active:document.activeElement?.className?.baseVal??document.activeElement?.className});if(window.__allocationTrace.length>80)window.__allocationTrace.shift();});
  },true);
 });const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'p',name:'SYNTHETIC missing quote'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'SYNTHETIC depot',type:'securities'},m));
 for(const [id,kind,quantity,price,quoteSource] of [['missing-etf','etf',2.5,0,null],['missing-crypto','crypto',3,0,null],['zero-holding','etf',0,0,null],['sourced-zero','etf',2,0,'SYNTHETIC source'],['positive','cash',3,1,null]])m.positions.push(createPosition({id,providerId:'p',accountId:'a',name:'SYNTHETIC '+id,kind,quantity,price,quoteSource},m));
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=tab=>p.locator('#mobileNav [data-page="'+tab+'"]:visible,#sidebarNav [data-page="'+tab+'"]:visible').click();
 const state=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 try{
  await p.goto(process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/');await ready();await p.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},m);await p.reload();await ready();const before=await state();
  for(const width of [320,360,390,412,430,768,1440]){
   await p.setViewportSize({width,height:900});await nav('positions');
   for(const id of ['missing-etf','missing-crypto','zero-holding','sourced-zero','positive']){
    const row=p.locator('.position-entry').filter({has:p.locator('[data-action="edit-position"][data-id="'+id+'"]')});
    assert.equal(await row.locator('.holding-money').innerText(),id.startsWith('missing-')?'Nicht bewertet':money(id==='positive'?3:0));
   }
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:`${out}/${engine}-${width}-positions.png`,fullPage:true});
   await nav('dashboard');
   assert.match(await p.locator('#heroValueLabel').innerText(),/Bekannte Teilsumme/);assert.equal(await p.locator('#totalValue').innerText(),money(3));
   assert.match(await p.locator('#summaryStats').innerText(),/Bekannte Teilsumme · 1 Position ohne Kurs/);assert.equal(await p.locator('#donutShare').innerText(),'Teilsumme');
   assert.match(await p.locator('#allocationLegend').innerText(),/2 Positionen ohne Kurs/);
   await p.locator('#heroReviewToggle').click();assert.match(await p.locator('#heroQualitySummary').innerText(),/Bekannte Teilsumme · 2 Positionen ohne Kurs/);await p.locator('#heroReviewToggle').click();
   await p.locator('[data-provider-id="p"]>summary').click();
   for(const id of ['missing-etf','missing-crypto','zero-holding','sourced-zero','positive'])assert.equal(await p.locator('[data-position-id="'+id+'"] .provider-holding-right strong').innerText(),id.startsWith('missing-')?'Nicht bewertet':money(id==='positive'?3:0));
   assert.match(await p.locator('.aggregate-provider-note').innerText(),/Bekannte Teilsumme · 2 Positionen ohne Kurs/);assert.match(await p.locator('.aggregate-account-note').innerText(),/2 Positionen ohne Kurs/);
   assert.deepEqual(await p.evaluate(async()=>(await axe.run('#dashboardPage',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))),[]);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await p.locator('#allocationLegend [data-allocation-key="cash"]').click();await p.locator('#donut .allocation-center').click();try{await p.waitForFunction(()=>document.getElementById('donutShare')?.textContent==='Teilsumme'&&document.activeElement?.classList.contains('allocation-center'));}catch(error){console.log('ALLOCATION_RESET_DIAGNOSTIC '+JSON.stringify({engine,width,...await p.evaluate(()=>({trace:window.__allocationTrace,share:document.getElementById('donutShare')?.textContent,active:document.activeElement?.outerHTML?.slice(0,600),pressed:[...document.querySelectorAll('[data-allocation-index][aria-pressed=true]')].map(n=>({tag:n.tagName,index:n.dataset.allocationIndex})),center:document.querySelector('.allocation-center')?.outerHTML}))}));await p.screenshot({path:`${out}/${engine}-${width}-reset-failure.png`,fullPage:true});throw error;}assert.equal(await p.locator('#donutShare').innerText(),'Teilsumme');
   await p.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});await p.screenshot({path:`${out}/${engine}-${width}-dashboard.png`,fullPage:true});await p.locator('[data-provider-id="p"]>summary').click();
  }
  assert.deepEqual(await state(),before,'presentation and navigation preserve the exact IndexedDB record/revision');const missingOnly=structuredClone(m);missingOnly.positions=missingOnly.positions.filter(p=>p.id.startsWith('missing-'));
  for(const sourced of [false,true]){
   const fixture=structuredClone(missingOnly);if(sourced)for(const position of fixture.positions)position.quoteSource='SYNTHETIC proven zero';
   await p.evaluate(async fixture=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(fixture);s.close();},fixture);await p.reload();await ready();const unchanged=await state();
   assert.equal(await p.locator('#totalValue').innerText(),sourced?money(0):'Nicht bewertet');
   assert.match(await p.locator('#heroValueLabel').innerText(),sourced?/Gesamtvermögen/:/Vermögen nicht bewertet/);
   assert.equal(await p.locator('#donutTotal').innerText(),sourced?'€ 0':'–');
   assert.equal(await p.locator('#donutTotal').getAttribute('title'),sourced?money(0):'Nicht bewertet');
   assert.equal(await p.locator('#donutShare').innerText(),sourced?'Gesamtwert':'Nicht bewertet');
   assert.equal(await p.locator('.provider-total').innerText(),sourced?money(0):'Nicht bewertet');
   await p.locator('[data-provider-id="p"]>summary').click();assert.match(await p.locator('.aggregate-account-value').innerText(),sourced?/0,00/:/Nicht bewertet/);
   assert.deepEqual(await state(),unchanged,'unknown vs sourced zero display leaves record and revision exact');
   await p.setViewportSize({width:320,height:900});await p.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});await p.screenshot({path:`${out}/${engine}-320-${sourced?'sourced-zero':'all-unknown'}.png`,fullPage:true});
  }
  report.engines.push({engine,status:'PASS'});
 }catch(error){report.engines.push({engine,status:'FAIL',error:String(error)});throw error;}finally{writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await context.close();await browser.close();}
}
