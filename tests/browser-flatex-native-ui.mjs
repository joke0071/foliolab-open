import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {nativeFlatexCSV as csv,syntheticCP1252,depotHeaders} from './flatex-native-fixture.mjs';
import {ledgerModel} from './ledger-live-fixture.mjs';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const report={base,scope:'Synthetic native Flatex Originalformat read-only CSV preview',engines:[]};
mkdirSync('artifacts/gates/flatex-native-ui',{recursive:true});
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({viewport:{width:390,height:900},ignoreHTTPSErrors:Boolean(proxy)});
 await ctx.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
 const p=await ctx.newPage(),errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const read=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return {record:await readPortfolioRecord(db),prefs:Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])};}finally{db.close();}});
 const open=async()=>{await p.locator('#mobileNav [data-page=bookings]:visible,#sidebarNav [data-page=bookings]:visible').click();await p.locator('#openCSVImport').click();};
 const close=async(key='cancel')=>{if(key==='Escape')await p.keyboard.press('Escape');else await p.locator('#cancelDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});assert.equal(await p.evaluate(()=>document.activeElement.id),'openCSVImport');};
 const file=(text,name='synthetic-flatex.csv')=>({name,mimeType:'text/csv',buffer:Buffer.from(syntheticCP1252(text))});
 const preview=()=>p.waitForFunction(()=>document.getElementById('csvReviewStatus')?.textContent.includes('Flatex Originalformat:'));
 try{
  await p.goto(base);await ready();const seed=ledgerModel();seed.settings.autoRefresh=false;
  await p.evaluate(async m=>{const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();},seed);
  await p.goto(base);await ready();await p.evaluate(()=>navigator.serviceWorker.ready);
  // Ready registration alone may predate control of the current navigation.
  // Establish a controlled document before the baseline; retain the later strict offline gate.
  await p.reload();await ready();await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  console.log(engine+': native preview controlled baseline '+JSON.stringify(await p.evaluate(async()=>({controller:navigator.serviceWorker.controller?.scriptURL,active:(await navigator.serviceWorker.getRegistration())?.active?.state,caches:await caches.keys()}))));const before=await read();
  ctx.on('request',r=>{const u=new URL(r.url());if(u.origin!==new URL(base).origin&&u.protocol!=='blob:')external.push(r.url());});
  await open();await p.locator('#csvFile').setInputFiles(file(csv('depot',[{4:'Öl und € <img src=x onerror=alert(1)>',5:'0,000000000000000001'},{7:'Thesaurierung',5:'-'},{7:'Future',9:'-'}])));await preview();
  assert.ok(await p.locator('#saveDialog').isDisabled());assert.equal(await p.locator('#csvMap-date').count(),0);assert.equal(await p.locator('#csvReview .performance-details').count(),3);
  await p.locator('#csvReview .performance-details').first().locator('summary').first().click();
  await p.locator('#csvReview .performance-details').nth(1).locator('summary').first().click();
  const review=await p.locator('#csvReview').innerText();assert.match(review,/2.5 EUR/);assert.match(review,/Nominal laut Export: unbekannt/);assert.match(review,/0,000000000000000001|0.000000000000000001/);assert.match(review,/0009007199254740993/);await p.locator('#csvReview .performance-details details').first().locator('summary').click();assert.match(await p.locator('#csvReview').innerText(),/Öl und €/);assert.match(review,/0.000000000000000001/);assert.equal(await p.locator('#csvReview img').count(),0);
  for(const width of [320,390,430,768,1440]){
   await p.setViewportSize({width,height:900});await p.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await p.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   for(const id of ['cancelDialog','saveDialog'])assert.ok((await p.locator('#'+id).boundingBox()).height>=44);
   assert.deepEqual(await p.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(x=>({id:x.id,targets:x.nodes.map(n=>n.target)}))),[]);
   await p.screenshot({path:'artifacts/gates/flatex-native-ui/'+engine+'-'+width+'.png'});
  }
  await p.setViewportSize({width:390,height:900});assert.deepEqual(await read(),before);
  await p.locator('#editorForm').evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await p.locator('#dialogError:not(.hidden)').waitFor();assert.match(await p.locator('#dialogError').innerText(),/Flatex-Originalformat bleibt/);assert.ok(await p.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);await close('Escape');
  await open();assert.equal(await p.locator('#csvReview .performance-details').count(),0);await p.locator('#csvFile').setInputFiles(file(csv('depot',Array.from({length:75},()=>({})))));await preview();assert.equal(await p.locator('#csvReview .performance-details').count(),50);await p.locator('#flatexNativeShowMore').click();assert.equal(await p.locator('#csvReview .performance-details').count(),75);assert.equal(await p.locator('#flatexNativeShowMore').count(),0);assert.ok(await p.locator('#csvReview .performance-details').nth(50).locator('summary').first().evaluate(e=>e===document.activeElement));
  await p.locator('#csvSource').selectOption('generic');await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('native Flatex-Vorschau'));assert.ok(await p.locator('#saveDialog').isDisabled());assert.equal(await p.locator('#csvMap-feeEUR').count(),0);
  for(const mode of ['flatex','ledger','kraken','bitpanda']){await p.locator('#csvSource').selectOption(mode);await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('native Flatex-Vorschau'));assert.ok(await p.locator('#saveDialog').isDisabled());}
  await p.locator('#csvSource').selectOption('auto');await preview();await p.locator('#csvFile').setInputFiles([file(csv()),file('date;type;quantity\n1999-01-01;buy;1','synthetic-generic.csv')]);await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('12-Spalten'));assert.ok(await p.locator('#saveDialog').isDisabled());assert.equal(await p.locator('#csvMap-date').count(),0);
  await p.locator('#csvSource').selectOption('flatex-native');assert.ok(await p.locator('#csvFile').isHidden());assert.equal(await p.locator('#csvFile').evaluate(e=>e.files.length),0);
  await p.locator('#csvFlatexDepot').setInputFiles(file(csv()));await preview();assert.match(await p.locator('#csvReview').innerText(),/1 Depotzeilen · 0 Kontozeilen/);
  await p.locator('#csvFlatexAccount').setInputFiles(file(csv('account')));await preview();await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('1 Depotzeilen · 1 Kontozeilen'));
  for(const width of [320,390,430,768,1440]){await p.setViewportSize({width,height:900});await p.locator('#csvFlatexDepot').scrollIntoViewIfNeeded();assert.ok(await p.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.deepEqual(await p.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(x=>x.id)),[]);await p.screenshot({path:'artifacts/gates/flatex-native-ui/'+engine+'-inputs-'+width+'.png'});}await p.setViewportSize({width:390,height:900});
  assert.equal(await p.locator('#csvReview .performance-details').count(),2);await p.locator('#csvReview .performance-details').nth(1).locator('summary').first().click();assert.match(await p.locator('#csvReview').innerText(),/-3086.25 EUR/);
  await p.locator('#csvFlatexDepot').setInputFiles([file(csv(),'synthetic-part-a.csv'),file(csv(),'synthetic-part-b.csv')]);await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('2 Depotzeilen · 1 Kontozeilen'));assert.equal(await p.locator('#csvReview .performance-details').count(),3);
  // Relationship UI uses the real categorized inputs and unchanged native parser/helper.
  const nativeOrder=i=>'ABR ORDER Kauf IE00SYNTH001 '+i;
  const relationCases=[
   [[{}],[{}],'Mögliche 1:1-Beziehung'],
   [[{}],[{5:'SYN-A'},{5:'SYN-B'}],'Mehrere Kontobelege prüfen'],
   [[{8:'SYN-A'},{8:'SYN-B'}],[{}],'Mehrere Depotausführungen prüfen'],
   [[{8:'SYN-A'},{8:'SYN-A',1:'03.01.1999'}],[{}],'Widerspruch prüfen'],
   [[{},{}],[{}],'Überlappung prüfen'],
   [[{7:'Storno '+nativeOrder('0009007199254740993')}],[{}],'Storno prüfen'],
   [[{}],[{5:'SYN-A'},{5:'SYN-B',9:'SYN-OTHER'}],'Quellkontexte prüfen'],
   [[{}],[{7:'CHF'}],'Quellangaben prüfen']
  ];
  for(const [depot,cash,label]of relationCases){
   await p.locator('#csvFlatexDepot').setInputFiles(file(csv('depot',depot),'synthetic-same.csv'));await p.locator('#csvFlatexAccount').setInputFiles(file(csv('account',cash),'synthetic-same.csv'));
   await p.waitForFunction(label=>document.querySelector('#flatexOrderGroup-0')?.textContent.includes(label),label);
   assert.equal(await p.locator('#flatexNativeOrders').getAttribute('open'),null,'file changes reset disclosure');
   await p.locator('#flatexNativeOrders > summary').click();await p.locator('#flatexOrderGroup-0 > summary').click();
   const text=await p.locator('#flatexOrderGroup-0').innerText();assert.match(text,/Datei 1 · synthetic-same.csv/);assert.match(text,/Datei 2 · synthetic-same.csv/);assert.match(text,/Bankreferenz:/);assert.match(text,/Orderreferenz:/);assert.match(text,/Buchtag: 1999-01-02/);assert.match(text,/Valuta: 1999-01-04/);
   assert.equal(await p.locator('#flatexOrderGroup-0 ol > li').count(),depot.length+cash.length);assert.ok(await p.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);
   if(label==='Mögliche 1:1-Beziehung'){for(const width of [320,1440]){await p.setViewportSize({width,height:900});await p.locator('#flatexOrderGroup-0').scrollIntoViewIfNeeded();await p.screenshot({path:'artifacts/gates/flatex-native-ui/'+engine+'-order-pair-'+width+'.png'});}await p.setViewportSize({width:390,height:900});}
  }
  // Expanded group stays responsive, escaped and accessible across all existing widths.
  await p.locator('#csvFlatexDepot').setInputFiles(file(csv('depot',[{4:'Synthetic <img src=x onerror=alert(1)>',11:'SYN-'+('X'.repeat(160))}]),'synthetic-<svg>.csv'));await p.locator('#csvFlatexAccount').setInputFiles(file(csv('account')));await preview();
  await p.locator('#flatexNativeOrders > summary').click();await p.locator('#flatexOrderGroup-0 > summary').click();assert.equal(await p.locator('#flatexNativeOrders img,#flatexNativeOrders svg').count(),0);
  for(const width of [320,390,430,768,1440]){
   await p.setViewportSize({width,height:900});await p.locator('#flatexOrderGroup-0').scrollIntoViewIfNeeded();
   assert.ok(await p.locator('#editDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.ok((await p.locator('#flatexOrderGroup-0 > summary').boundingBox()).height>=44);
   assert.deepEqual(await p.evaluate(async()=>(await axe.run('#editDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(x=>({id:x.id,targets:x.nodes.map(n=>n.target)}))),[]);
   await p.screenshot({path:'artifacts/gates/flatex-native-ui/'+engine+'-orders-'+width+'.png'});
  }
  await p.setViewportSize({width:390,height:900});
  await p.locator('#csvFlatexAccount').setInputFiles([]);await p.locator('#csvFlatexDepot').setInputFiles(file(csv('depot',Array.from({length:45},(_,i)=>({7:nativeOrder(i),8:'SYN-'+i})))));await preview();
  await p.locator('#flatexNativeOrders > summary').click();assert.equal(await p.locator('.flatex-order-group').count(),20);await p.locator('#flatexOrderGroup-0 > summary').click();await p.locator('#flatexOrdersShowMore').click();assert.equal(await p.locator('.flatex-order-group').count(),40);assert.equal(await p.evaluate(()=>document.activeElement.parentElement.id),'flatexOrderGroup-20');assert.equal(await p.locator('#flatexOrderGroup-0').getAttribute('open'),'');await p.locator('#flatexOrdersShowMore').click();assert.equal(await p.locator('.flatex-order-group').count(),45);assert.equal(await p.locator('#flatexOrdersShowMore').count(),0);
  await p.locator('#csvFlatexDepot').setInputFiles(file(csv()));await p.locator('#csvFlatexAccount').setInputFiles(file(csv('account',Array.from({length:45},(_,i)=>({5:'SYN-'+i})))));await preview();await p.locator('#flatexNativeOrders > summary').click();await p.locator('#flatexOrderGroup-0 > summary').click();assert.equal(await p.locator('#flatexOrderGroup-0 ol > li').count(),20);
  await p.locator('[data-flatex-order-legs="0"]').click();assert.equal(await p.locator('#flatexOrderGroup-0 ol > li').count(),40);assert.equal(await p.evaluate(()=>document.activeElement.id),'flatexOrderLeg-0-20');await p.locator('[data-flatex-order-legs="0"]').click();assert.equal(await p.locator('#flatexOrderGroup-0 ol > li').count(),46);assert.equal(await p.locator('[data-flatex-order-legs]').count(),0);assert.equal(await p.locator('#flatexOrderGroup-0').getAttribute('open'),'');
  await p.locator('#editorForm').evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await p.locator('#dialogError:not(.hidden)').waitFor();assert.match(await p.locator('#dialogError').innerText(),/Flatex-Originalformat bleibt/);assert.deepEqual(await read(),before);
  await p.locator('#csvFlatexDepot').setInputFiles(file(csv('depot',[{7:'Thesaurierung'}])));await p.locator('#csvFlatexAccount').setInputFiles([]);await preview();await p.locator('#flatexNativeOrders > summary').click();assert.match(await p.locator('#flatexNativeOrders').innerText(),/0 Gruppen/);assert.match(await p.locator('#flatexNativeOrders').innerText(),/1 Zeilen ohne Orderreferenz/);assert.equal(await p.locator('.flatex-order-group').count(),0);
  await p.locator('#csvFlatexAccount').setInputFiles(file(csv('account')));await preview();
  await p.locator('#csvFlatexDepot').setInputFiles(file(csv('account')));await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('falsche Dateikategorie'));assert.ok(await p.locator('#saveDialog').isDisabled());
  await p.locator('#csvFlatexDepot').setInputFiles([]);await preview();assert.match(await p.locator('#csvReview').innerText(),/0 Depotzeilen · 1 Kontozeilen/);
  await p.locator('#flatexNativeOrders > summary').click();assert.match(await p.locator('#flatexNativeOrders').innerText(),/Depotbeleg fehlt/);
  await p.locator('#csvFlatexAccount').setInputFiles(file(csv('depot',[{}],{headers:depotHeaders.map((h,i)=>i===6?'Unit':h)})));await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('12-Spalten'));
  await p.locator('#csvFlatexAccount').setInputFiles([]);await p.locator('#csvFlatexDepot').setInputFiles(Array.from({length:21},(_,i)=>file(csv(),'synthetic-limit-'+i+'.csv')));await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('Maximal 20 Dateien'));assert.ok(await p.locator('#saveDialog').isDisabled());
  await p.locator('#csvFlatexDepot').setInputFiles(file(csv('depot',Array.from({length:3000},()=>({})))));await preview();await p.locator('#csvFlatexAccount').setInputFiles(file(csv('account',Array.from({length:2001},()=>({})))));await p.waitForFunction(()=>document.getElementById('csvReview')?.textContent.includes('insgesamt maximal 5.000'));assert.ok(await p.locator('#saveDialog').isDisabled());assert.deepEqual(await read(),before);
  await p.locator('#csvSource').selectOption('generic');assert.equal(await p.locator('#csvFlatexAccount').evaluate(e=>e.files.length),0);await p.locator('#csvFile').setInputFiles(file('date;type;position;quantity;unitPrice;notes\n1999-01-01;buy;SYNTHETIC;1;2;"a,b"'));await p.locator('#csvMap-date').waitFor();assert.equal(await p.locator('.flatex-native-preview').count(),0);
  await p.evaluate(()=>{window.releaseSyntheticReads=[];const original=File.prototype.arrayBuffer;File.prototype.arrayBuffer=function(){if(this.name==='synthetic-slow.csv')return new Promise(resolve=>{window.releaseSyntheticReads.push(()=>original.call(this).then(resolve));});return original.call(this);};});
  await p.locator('#csvFile').setInputFiles(file(csv(),'synthetic-slow.csv'));await p.waitForFunction(()=>window.releaseSyntheticReads.length>0);assert.ok(await p.locator('#saveDialog').isDisabled());await p.locator('#csvSource').selectOption('auto');await p.locator('#csvFile').setInputFiles(file(csv('depot',[{8:'SYN-FAST'}]),'synthetic-fast.csv'));await preview();
  await p.evaluate(async()=>{await Promise.all(window.releaseSyntheticReads.map(release=>release()));await new Promise(r=>setTimeout(r,50));});await p.locator('#csvReview .performance-details').first().locator('summary').first().click();assert.match(await p.locator('#csvReview').innerText(),/synthetic-fast.csv/);assert.doesNotMatch(await p.locator('#csvReview').innerText(),/synthetic-slow.csv/);await close();assert.deepEqual(await read(),before);
  await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await ctx.setOffline(true);await p.reload();await ready();await open();await p.locator('#csvFile').setInputFiles(file(csv()));await preview();assert.ok(await p.locator('#saveDialog').isDisabled());await p.locator('#flatexNativeOrders > summary').click();assert.match(await p.locator('#flatexNativeOrders').innerText(),/Kontobeleg fehlt/);await close();assert.deepEqual(await read(),before);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  report.engines.push({engine,result:'PASS',checks:['native CP1252/blank-header auto/explicit recognition','two categorized inputs/separate/combined/partial files/schema/mixed/mode quarantine/generation guard','exact quantities/currencies/separate references','hostile source escaping','50/100 source paging and focus','order statuses/reasons/all legs/duplicate filenames/separate references','independent group/leg paging/focus/disclosure preservation/reset','expanded order groups at 5 widths/Axe/44px','5 widths/Axe/44px','forced submit/Escape/cancel/reopen','actual offline reload with order display','exact IDB/revision/settings zero mutation','no external preview requests']});
  console.log(engine+': FLATEX NATIVE UI native preview/declared fees/guards/5widths/Axe/focus/offline/exact zero writes PASS');
 }finally{await ctx.close();await browser.close();}
}
writeFileSync('artifacts/gates/flatex-native-ui/report.json',JSON.stringify(report,null,2));
