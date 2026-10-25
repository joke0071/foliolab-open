import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.FLH03_BASE_URL||'http://127.0.0.1:4173/';
const live=base.startsWith('https:');
const engines={chromium,firefox,webkit};
for(const engine of (process.env.FLH03_ENGINES||'chromium').split(',')){
 const browser=await engines[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const ctx=await browser.newContext({viewport:{width:390,height:844},ignoreHTTPSErrors:live}),p=await ctx.newPage();
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 // No real financial/account data or external market services in this test.
 await ctx.route('**/*',route=>route.request().url().startsWith(base)||route.request().url().startsWith('blob:')?route.continue():route.abort());
 try{
  await p.goto(base+'tests/storage-origin.html').catch(()=>{});
  await p.goto(base);
  await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  await p.evaluate(async()=>{
   const root=new URL('.',location.href),{PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',root)),{blankModel,createProvider,createAccount,createPosition}=await import(new URL('src/model.js',root));
   const m=blankModel(),provider=createProvider({name:'Synthetic FLH03',type:'broker'});m.settings.autoRefresh=false;m.providers.push(provider);
   const account=createAccount({providerId:provider.id,name:'Test account',type:'checking'},m);m.accounts.push(account);
   m.positions.push(createPosition({providerId:provider.id,accountId:account.id,name:'Synthetic Cash',symbol:'A',kind:'cash',quantity:0,price:1},m));
   const store=new PortfolioStorage();await store.initialize();await store.save(m);store.close();
  });
  await p.reload();
  const read=()=>p.evaluate(async()=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',location.href));const s=new PortfolioStorage();try{const m=await s.initialize();return {m,revision:s.revision};}finally{s.close();}});
  const before=await read();
  const nav=()=>p.locator('#mobileNav [data-page="bookings"]').click();await nav();
  const files=['overlap.csv','january.csv'].map(name=>({name,mimeType:'text/csv',buffer:readFileSync(new URL('./fixtures/flh03/'+name,import.meta.url))}));
  const choose=async()=>{await p.locator('#openCSVImport').click();await p.locator('#csvFile').setInputFiles(files);await p.waitForFunction(()=>document.getElementById('csvReviewStatus').textContent.includes('3 bereit'));};
  await choose();
  assert.match(await p.locator('#csvReview').innerText(),/3 bereit · 1 bereits vorhanden · 0 zu prüfen/);
  assert.deepEqual(await read(),before,'Preview never writes');
  await p.getByText('Auswirkung und Datenabdeckung prüfen',{exact:true}).click();
  assert.match(await p.locator('#csvReview').innerText(),/90.123456789012345678/);
  assert.match(await p.locator('#csvReview').innerText(),/keine lückenlose Historie/);
  await p.evaluate(readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')); 
  for(const width of [320,390,430,768,1024,1440]){
   await p.setViewportSize({width,height:900});
   const violations=await p.evaluate(async()=> (await axe.run(document.querySelector('#editDialog'))).violations);
   assert.deepEqual(violations,[],width+' axe');
   assert.ok(await p.evaluate(()=>document.querySelector('#editDialog').scrollWidth<=document.querySelector('#editDialog').clientWidth+1),width+' dialog overflow');
  }
  await p.setViewportSize({width:390,height:844});
  if(process.env.FLH03_SCREENSHOT)await p.screenshot({path:process.env.FLH03_SCREENSHOT,fullPage:true});
  await p.locator('#saveDialog').click();await p.waitForFunction(()=>!document.getElementById('editDialog').open);
  const committed=await read();assert.equal(committed.revision,before.revision+1);assert.equal(committed.m.bookings.length,3);assert.equal(committed.m.positions[0].quantityExact,'90.123456789012345678');
  await p.locator('#undoCSVImport').click();await p.locator('#cancelDialog').click();assert.deepEqual(await read(),committed,'Cancel rollback changes nothing');
  await p.locator('#undoCSVImport').click();await p.locator('#saveDialog').click();await p.waitForFunction(()=>!document.getElementById('editDialog').open);
  const undone=await read();assert.deepEqual(undone.m,before.m);assert.equal(undone.revision,committed.revision+1);
  await choose();await p.locator('#saveDialog').click();await p.waitForFunction(()=>!document.getElementById('editDialog').open);
  await p.reload();await nav();assert.equal(await p.locator('#undoCSVImport').isVisible(),false,'No persistent shadow portfolio or stale receipt');
  await p.locator('#openCSVImport').click();await p.locator('#csvFile').setInputFiles([...files].reverse());await p.waitForFunction(()=>document.getElementById('csvReviewStatus').textContent.includes('0 bereit, 4 bereits vorhanden'));
  assert.ok(await p.locator('#saveDialog').isDisabled());p.once('dialog',d=>d.accept());await p.locator('#cancelDialog').click();
  // Independent storage-level regression with the actual new preview and old CAS.
  const atomic=await p.evaluate(async()=>{
   const root=new URL('.',location.href),{PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',root)),{prepareCSVBatch}=await import(new URL('src/csv-batch.js',root)),{previewCSV,inferMapping,importCSV}=await import(new URL('src/csv-import.js',root));
   const a=new PortfolioStorage(),b=new PortfolioStorage();const ma=await a.initialize(),mb=await b.initialize();
   const prepare=m=>{const {parsed}=prepareCSVBatch([{name:'delta.csv',text:'date;type;position;quantity;price;id\n2025-03-01;deposit;A;5;1;delta'}]);return previewCSV(m,parsed,inferMapping(parsed.headers));};
   importCSV(ma,prepare(ma));importCSV(mb,prepare(mb));
   const results=await Promise.allSettled([a.save(ma),b.save(mb)]);a.close();b.close();
   const c=new PortfolioStorage(),m=await c.initialize();c.close();return {success:results.filter(r=>r.status==='fulfilled').length,quantity:m.positions[0].quantityExact,bookings:m.bookings.length};
  });
  assert.deepEqual(atomic,{success:1,quantity:'95.123456789012345678',bookings:4});
  assert.deepEqual(errors,[]);console.log(engine+': FLH03 batch preview/6 widths/a11y/atomic commit/cancel/undo/reload/replay/CAS PASS'+(live?' (actual Pages; TLS inspection exception enabled)':''));
 }finally{await ctx.close();await browser.close();}
}
