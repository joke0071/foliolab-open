import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {revealAction} from './browser-disclosures.mjs';
const base=process.env.UI_BASE||'http://127.0.0.1:4173/';
const results=[];mkdirSync('artifacts/gates/price-csv-tools',{recursive:true});
for(const engine of (process.env.UI_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true});
 try{
  const p=await browser.newPage({viewport:{width:320,height:850}});await p.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
  const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('./src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db);}finally{db.close();}});
  await p.goto(base);await ready();await p.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('./src/model.js'),{captureOpenings}=await import('./src/transactions.js'),{PortfolioStorage}=await import('./src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'p',name:'SYNTHETIC provider'}));m.accounts.push(createAccount({id:'a',name:'SYNTHETIC depot',providerId:'p'},m));
   for(const [id,isin]of [['csv-a','IE00BK5BQT80'],['csv-b','IE00B4L5Y983']])m.positions.push(createPosition({id,name:'SYNTHETIC '+id,providerId:'p',accountId:'a',kind:'etf',symbol:id,isin,exchange:'Xetra',mic:'XETR',currency:'EUR',quantity:10,price:100},m));
   captureOpenings(m);const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  });await p.reload();await ready();
  await p.locator('#mobileNav [data-page=more]:visible,#sidebarNav [data-page=more]:visible').click();
  const root=p.locator('#historicalPriceCSVTools'),select=root.locator('#priceCSVPosition');await revealAction(select);
  const before=await record();assert.equal(await select.inputValue(),'','No inferred position or source choice');assert.ok(await root.locator('[data-action=import-price-history]').isDisabled());
  await select.selectOption('csv-a');assert.match(await root.innerText(),/IE00BK5BQT80.*EUR/);assert.deepEqual(await record(),before,'Choosing and reading a source is read-only');
  const upload=async(close,accept)=>{
   const chooser=p.waitForEvent('filechooser');await root.locator('[data-action=import-price-history]').click();
   const decision=new Promise((resolve,reject)=>p.once('dialog',async d=>{try{assert.equal(d.type(),'confirm');assert.match(d.message(),/SYNTHETIC csv-a/);await(accept?d.accept():d.dismiss());resolve();}catch(error){reject(error);}}));
   await(await chooser).setFiles({name:'synthetic.csv',mimeType:'text/csv',buffer:Buffer.from('date;close;currency\n2025-01-01;'+close+';EUR\n2025-01-02;'+(close+1)+';EUR\n')});await decision;
  };
  await upload(100,false);assert.deepEqual(await record(),before,'Cancel import preserves exact record');
  await upload(100,true);await p.waitForFunction(()=>document.getElementById('priceCSVSource').textContent.includes('CSV (selbst geprüft)'));
  let imported=await record();assert.equal(imported.revision,before.revision+1);assert.deepEqual(JSON.parse(imported.raw).priceHistories['csv-a'].points,[{date:'2025-01-01',total:100},{date:'2025-01-02',total:101}]);assert.equal(JSON.parse(imported.raw).priceHistories['csv-b'],undefined);assert.match(await root.locator('[data-action=import-price-history]').innerText(),/ersetzen/);
  await upload(101,true);await p.waitForFunction(async revision=>{const {openPortfolioDB,readPortfolioRecord}=await import('./src/atomic-storage.js');const db=await openPortfolioDB();try{return(await readPortfolioRecord(db)).revision===revision;}finally{db.close();}},imported.revision+1);
  const replaced=await record();assert.notDeepEqual(JSON.parse(replaced.raw).priceHistories['csv-a'],JSON.parse(imported.raw).priceHistories['csv-a']);
  p.once('dialog',d=>d.dismiss());await root.locator('[data-action=remove-price-history]').click();assert.deepEqual(await record(),replaced,'Cancel remove preserves exact record');
  for(const width of [320,768,1440]){await p.setViewportSize({width,height:900});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(await p.evaluate(async()=>(await axe.run('#historicalPriceTools',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);await p.screenshot({path:'artifacts/gates/price-csv-tools/'+engine+'-'+width+'.png'});}
  p.once('dialog',d=>d.accept());await root.locator('[data-action=remove-price-history]').click();await p.waitForFunction(()=>document.getElementById('priceCSVSource').textContent.includes('Noch keine lokale'));
  const final=await record(),a=JSON.parse(before.raw),b=JSON.parse(final.raw);for(const key of ['positions','accounts','providers','bookings','journalEntries','openingPositions','snapshots','externalCashFlows','settings'])assert.deepEqual(b[key],a[key],key+' unchanged by historical quote management');assert.equal(b.priceHistories?.['csv-a'],undefined);
  results.push({engine,result:'PASS'});console.log(engine+': Mehr price CSV explicit position/source/import-cancel/replace/remove-cancel/three widths/Axe/unchanged finances PASS');
 }finally{await browser.close();}
}
writeFileSync('artifacts/gates/price-csv-tools/report.json',JSON.stringify({results},null,2));
