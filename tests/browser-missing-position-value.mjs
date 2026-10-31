import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {blankModel,createProvider,createAccount,createPosition,money} from '../src/model.js';
const out='artifacts/gates/missing-position-value';mkdirSync(out,{recursive:true});
const report={engines:[]};
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true}),context=await browser.newContext(),p=await context.newPage();
 const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'p',name:'SYNTHETIC missing quote'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'SYNTHETIC depot',type:'securities'},m));
 for(const [id,kind,quantity,price,quoteSource] of [['missing-etf','etf',2.5,0,null],['missing-crypto','crypto',3,0,null],['zero-holding','etf',0,0,null],['sourced-zero','etf',2,0,'SYNTHETIC source'],['positive','cash',3,1,null]])m.positions.push(createPosition({id,providerId:'p',accountId:'a',name:'SYNTHETIC '+id,kind,quantity,price,quoteSource},m));
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=tab=>p.locator('#mobileNav [data-page="'+tab+'"]:visible,#sidebarNav [data-page="'+tab+'"]:visible').click();
 const state=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
 try{
  await p.goto(process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/');await ready();await p.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},m);await p.reload();await ready();const before=await state();
  for(const width of [320,390,768,1440]){
   await p.setViewportSize({width,height:900});await nav('positions');
   for(const id of ['missing-etf','missing-crypto','zero-holding','sourced-zero','positive']){
    const row=p.locator('.position-entry').filter({has:p.locator('[data-action="edit-position"][data-id="'+id+'"]')});
    assert.equal(await row.locator('.holding-money').innerText(),id.startsWith('missing-')?'Nicht bewertet':money(id==='positive'?3:0));
   }
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:`${out}/${engine}-${width}-positions.png`,fullPage:true});
   await nav('dashboard');await p.locator('[data-provider-id="p"]>summary').click();
   for(const id of ['missing-etf','missing-crypto','zero-holding','sourced-zero','positive'])assert.equal(await p.locator('[data-position-id="'+id+'"] .provider-holding-right strong').innerText(),id.startsWith('missing-')?'Nicht bewertet':money(id==='positive'?3:0));
   await p.screenshot({path:`${out}/${engine}-${width}-dashboard.png`,fullPage:true});await p.locator('[data-provider-id="p"]>summary').click();
  }
  assert.deepEqual(await state(),before,'presentation and navigation preserve the exact IndexedDB record/revision');report.engines.push({engine,status:'PASS'});
 }catch(error){report.engines.push({engine,status:'FAIL',error:String(error)});throw error;}finally{writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await context.close();await browser.close();}
}
