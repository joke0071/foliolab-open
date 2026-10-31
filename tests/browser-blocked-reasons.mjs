import assert from 'node:assert/strict';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const out='artifacts/gates/blocked-reasons';mkdirSync(out,{recursive:true});
const report={base,scope:'Synthetic grouped blocker presentation; original eligibility and exact stored record unchanged',engines:[]};
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const c=await browser.newContext({viewport:{width:390,height:900},ignoreHTTPSErrors:Boolean(proxy)}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await c.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=tab=>p.locator('#mobileNav [data-page='+tab+']:visible,#sidebarNav [data-page='+tab+']:visible').click();
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const d=await openPortfolioDB();try{return await readPortfolioRecord(d);}finally{d.close();}});
 const scan=async label=>{
  await p.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});
  const fits=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
  if(!fits){
   const geometry=await p.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].filter(e=>e.checkVisibility()).map(e=>{
    const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,id:e.id,className:String(e.className),left:r.left,right:r.right,width:r.width,display:s.display,overflow:s.overflow,minWidth:s.minWidth,flex:s.flex};
   }).filter(e=>e.right>innerWidth+1||e.left<-1)}));
   const file=out+'/'+engine+'-'+label.replace(/[^a-z0-9]+/gi,'-');
   writeFileSync(file+'-overflow.json',JSON.stringify({label,...geometry},null,2));
   await p.screenshot({path:file+'-overflow.png',fullPage:true});
   console.error('BLOCKED REASONS OVERFLOW',JSON.stringify({label,...geometry}));
  }
  assert.ok(fits,label+' overflow');
  assert.ok(await p.locator('.blocked-reasons summary,#positionRemovalItems>summary').evaluateAll(es=>es.filter(e=>e.checkVisibility()).every(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.width>=44;})),label+' visible disclosure44px');
  assert.deepEqual(await p.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[],label+' Axe');
 };
 try{
  await p.goto(base);const worker=await controlledStorageFixture(p,ready,record);
  console.log(engine+': BLOCKED REASONS actual controlled worker before fixture '+JSON.stringify(worker));
  await p.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{executeTransaction}=await import('/src/transactions.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'p',name:'SYNTHETIC blocker test'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'SYNTHETIC cash',type:'cash'},m));m.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',name:'SYNTHETIC cash',kind:'cash',quantity:1000,price:1},m));
   for(let i=0;i<205;i++){const b=executeTransaction(m,{id:'blocked-'+i,positionId:'cash',type:'deposit',date:'2023-01-02',quantity:1,unitPrice:1,notes:'SYNTHETIC '+i});m.journalEntries.find(e=>e.id===b.journalEntryId).source='csv';}
   for(let i=0;i<8;i++)m.snapshots.push({id:'legacy-'+i,date:'2024-01-0'+(i+1),total:1205,totalEURExact:'1205',valuationStatus:'legacy-unverified',source:'legacy',byAccount:null,byPosition:null,quoteTimes:[],revisions:[],note:'SYNTHETIC migrated original'});
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  });
  await p.reload();await ready();const before=await record();
  await nav('history');await p.locator('#snapshotManager').evaluate(e=>e.open=true);await p.locator('#manageReferences').click();await p.locator('#referenceSelectVisible').click();
  assert.match(await p.locator('#referenceSelectionStatus').innerText(),/^8 ausgewählt · 8 gefiltert$/);
  assert.match(await p.locator('#referenceDeleteReason').innerText(),/8 geschützte Originalwerte/);
  assert.equal(await p.locator('#referenceDeleteReason>details').evaluate(e=>e.open),false);assert.ok(await p.locator('[data-reference-manage=remove]').isDisabled());assert.equal(await p.locator('[data-reference-manage=remove]').getAttribute('aria-describedby'),'referenceDeleteReasonSummary');
  const scans=[];
  for(const width of [320,390,430,768,1440]){
   await p.setViewportSize({width,height:560});await scan('references '+width);
   const summary=p.locator('#referenceDeleteReason .blocked-reasons-summary');
   assert.ok(await summary.evaluate(e=>e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).lineHeight)*3+1),'at most three normal text lines');
   await p.locator('#referenceDeleteReason').scrollIntoViewIfNeeded();await p.screenshot({path:out+'/'+engine+'-references-'+width+'.png'});scans.push(width);
  }
  await p.setViewportSize({width:320,height:560});const textStyles=await p.locator('#referenceDeleteReason').evaluate(root=>[...root.querySelectorAll('p,h4,summary')].map(e=>{const before=e.getAttribute('style'),size=parseFloat(getComputedStyle(e).fontSize);return {e,before,size};}).map(x=>{x.e.style.fontSize=(x.size*2)+'px';x.e.style.lineHeight='1.5';return x.before;}));await scan('200 percent synthetic reference text enlargement');await p.locator('#referenceDeleteReason').evaluate((root,styles)=>[...root.querySelectorAll('p,h4,summary')].forEach((e,i)=>styles[i]===null?e.removeAttribute('style'):e.setAttribute('style',styles[i])),textStyles);
  await p.setViewportSize({width:390,height:900});await p.locator('#referenceDeleteReason>details>summary').focus();await p.keyboard.press('Enter');
  assert.equal(await p.locator('#referenceDeleteReason section>p').count(),1,'eight exact reasons appear once');
  await p.locator('#referenceDeleteReason .blocked-reason-identities>summary').click();assert.match(await p.locator('#referenceDeleteReason').innerText(),/legacy-7/);await scan('expanded references');
  await nav('bookings');await p.locator('[data-booking-manage=select]').click();await p.locator('#bookingSelectFiltered').click();
  assert.match(await p.locator('#bookingSelectionStatus').innerText(),/^100 ausgewählt · 205 gefiltert$/);assert.ok(await p.locator('[data-booking-manage=remove]').isDisabled());
  assert.ok((await p.locator('#bookingBlocked-remove .blocked-reasons-summary').innerText()).length<180);assert.match(await p.locator('#bookingBlocked-remove .blocked-reasons-summary').innerText(),/100 Einträge mit Herkunftsschutz.*100 Einträge mit Stichtagsbezug/);assert.ok(await p.locator('#bookingBlocked-remove .blocked-reasons-summary').evaluate(e=>e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).lineHeight)*3+1),'booking reasons at most three normal text lines');
  assert.equal(await p.locator('#bookingBlocked-remove>details').evaluate(e=>e.open),false);
  for(const width of [320,390,430,768,1440]){await p.setViewportSize({width,height:560});
   // Inspect the actionable management heading, rather than a previous tab's
   // inherited scroll offset leaving this row underneath the sticky header.
   const done=p.locator('[data-booking-manage=cancel]');await done.evaluate(e=>e.scrollIntoView({block:'center'}));await done.focus();
   assert.ok(await done.evaluate(e=>{const r=e.getBoundingClientRect(),header=document.querySelector('.mobile-header'),nav=document.getElementById('mobileNav'),top=header.checkVisibility()?header.getBoundingClientRect().bottom:0,bottom=nav.checkVisibility()?nav.getBoundingClientRect().top:innerHeight;return r.top>=top&&r.bottom<=bottom&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e;}),'management action is truly visible and clickable between fixed bars');
   await scan('bookings '+width);await p.locator('#bookingBlocked-remove').scrollIntoViewIfNeeded();await p.screenshot({path:out+'/'+engine+'-bookings-'+width+'.png'});}
  await p.locator('#bookingSelectFiltered').click();assert.match(await p.locator('#bookingSelectionStatus').innerText(),/^205 ausgewählt/);assert.match(await p.locator('#bookingBlocked-remove').innerText(),/Höchstens 200/);assert.ok(await p.locator('[data-booking-manage=remove]').isDisabled());
  await p.locator('#bookingSelectFiltered').click();assert.match(await p.locator('#bookingSelectionStatus').innerText(),/^0 ausgewählt/);
  await nav('positions');await p.locator('[data-action=select-positions]').click();await p.locator('#positionSelectFiltered').click();await p.locator('[data-action=preview-removal]').click();
  assert.equal(await p.locator('#positionRemovalItems').evaluate(e=>e.open),false);assert.equal(await p.locator('#positionPreviewBlocked>details').evaluate(e=>e.open),false);assert.ok(await p.locator('[name=confirmRemoval]').isDisabled());await scan('blocked position preview');await p.keyboard.press('Escape');
  assert.deepEqual(await record(),before,'all selection, grouping, disclosure and blocked previews preserve exact raw/settings/revision');assert.deepEqual(errors,[]);
  report.engines.push({engine,result:'PASS',widths:scans,checks:['8 identical legacy reasons once','100 imported booking blockers compact','205 check cap and Gmail reset intact','mixed categories count unique identities','position preview closed and nondeletable','five widths/small height/synthetic 200% text/44px/keyboard/Axe/exact record unchanged']});
  console.log(engine+': BLOCKED REASONS counted categories/8legacy/100bookings/205cap/closed details/5widths/Axe/zero writes PASS');
 }finally{writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await c.close();await browser.close();}
}
