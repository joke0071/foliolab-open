// Bounded D/P2 product contract. Original strict cross-origin Back failures/tests
// remain unchanged in closed/unmerged PR151. No cross-origin warning guarantee.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.DIALOG_NATIVE_BASE||'http://127.0.0.1:4173/',live=base.startsWith('https:'),proxy=live&&process.env.HTTPS_PROXY;
const engines={chromium,firefox,webkit},report={base,contract:'D/P2 internal discard plus supported native unload warnings; no universal cross-origin Back guarantee',engines:[]};
mkdirSync('artifacts/gates',{recursive:true});
for(const engine of (process.env.DIALOG_NATIVE_ENGINES||'chromium').split(',')){
 const browser=await engines[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({viewport:{width:390,height:560},ignoreHTTPSErrors:live});
 await ctx.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
 // Actual first-party delivery/SW traffic, never route or replace app documents.
 // No Playwright request interception: Firefox can stall after refusing beforeunload
 // when interception is enabled, even if only external URLs are routed.
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const ready=()=>p.waitForFunction(()=>document.querySelector('#portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=async name=>p.locator((await p.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav')+' [data-page="'+name+'"]').click();
 const record=()=>p.evaluate(async base=>{const {openPortfolioDB,readUnverifiedRecord}=await import(new URL('src/atomic-storage.js',base));const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}},base);
 const nativeReload=async accept=>{
  const event=p.waitForEvent('dialog',{predicate:d=>d.type()==='beforeunload'});
  await p.evaluate(()=>{setTimeout(()=>location.reload(),0);});
  const d=await event;assert.equal(d.type(),'beforeunload');
  if(accept){try{await Promise.all([p.waitForEvent('load'),d.accept()]);await ready();}catch(error){console.log(engine+': ACCEPTED RELOAD DIAGNOSTIC '+JSON.stringify(await p.evaluate(()=>({href:location.href,state:document.readyState,timeOrigin:performance.timeOrigin,dialogs:[...document.querySelectorAll('dialog')].map(d=>({id:d.id,open:d.open})),navigation:performance.getEntriesByType('navigation').map(n=>({type:n.type,domComplete:n.domComplete,load:n.loadEventEnd}))}))));throw error;}}else await d.dismiss();
 };
 const cleanReload=async()=>{
  const unexpected=[];const handler=async d=>{unexpected.push(d.type());await d.accept();};p.on('dialog',handler);
  try{await p.reload();await ready();assert.deepEqual(unexpected,[],'clean/saved dialog must not request discard');}finally{p.off('dialog',handler);}
 };
 try{
  await p.goto(base);await ready();
  await p.evaluate(async base=>{
   const {blankModel,createProvider,createPosition}=await import(new URL('src/model.js',base));
   const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base));
   const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'provider',name:'Synthetic native navigation'}));
   m.positions.push(createPosition({id:'cash',providerId:'provider',name:'Synthetic cash',symbol:'D',kind:'cash',quantity:10,price:1},m));
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  },base);await cleanReload();const original=await record();
  const cases=[
   {name:'provider',tab:'more',opener:'#addProvider',dialog:'#editDialog',field:'#providerName',open:async()=>{await p.locator('#addProvider').click();await p.locator('#providerName').fill('Synthetic unsaved provider');}},
   {name:'wizard',tab:'positions',opener:'#addWizard',dialog:'#wizardDialog',field:'#wizardName',open:async()=>{await p.locator('#addWizard').click();await p.locator('#wizardName').fill('Synthetic unsaved asset');}},
   {name:'CSV preview',tab:'bookings',opener:'#openCSVImport',dialog:'#editDialog',field:'#csvReviewStatus',open:async()=>{await p.locator('#openCSVImport').click();await p.locator('#csvFile').setInputFiles({name:'synthetic-draft.csv',mimeType:'text/csv',buffer:Buffer.from('date;type;position;quantity;price;id\n2023-01-04;deposit;D;1;1;native-draft')});await p.waitForFunction(()=>document.getElementById('csvReviewStatus').textContent.includes('1 bereit'));}}
  ];
  const scans=[];
  for(const c of cases){
   await nav(c.tab);await c.open();
   const value=()=>c.name==='CSV preview'?p.locator(c.field).textContent():p.locator(c.field).inputValue();
   const before=await value();await nativeReload(false);
   assert.ok(await p.locator(c.dialog).isVisible(),c.name+' rejected reload preserves dialog');assert.equal(await value(),before);
   assert.deepEqual(await record(),original,'native rejection does not persist draft');
   const reject=p.waitForEvent('dialog');p.once('dialog',d=>d.dismiss());await p.keyboard.press('Escape');assert.equal((await reject).type(),'confirm');assert.equal(await value(),before);
   for(const width of [320,390,430,768,1024,1440]){
    await p.setViewportSize({width,height:560});
    await p.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
    const violations=await p.evaluate(async()=> (await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
    assert.deepEqual(violations,[],c.name+' '+width);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));scans.push({form:c.name,width,height:560,status:'PASS'});
   }
   p.once('dialog',d=>d.accept());await p.keyboard.press('Escape');await p.locator(c.dialog).waitFor({state:'hidden'});
   assert.equal(await p.evaluate(()=>document.activeElement.id),c.opener.slice(1),'discard restores opener focus');
   await cleanReload();assert.deepEqual(await record(),original);
   await nav(c.tab);await c.open();await nativeReload(true);
   assert.equal(await p.locator(c.dialog).isVisible(),false,'confirmed native discard actually leaves the document');
   assert.deepEqual(await record(),original,'accepted discard stores no draft');
   console.log(engine+': '+c.name+' native reload reject/accept, unchanged IDB, local Escape reject/accept/focus, six-width full Axe PASS');
  }
  await nav('more');await p.locator('#addProvider').click();await cleanReload();
  await nav('positions');await p.locator('#addWizard').click();await cleanReload();
  await nav('bookings');await p.locator('#openCSVImport').click();await cleanReload();
  await nav('more');await p.locator('#addProvider').click();await p.locator('#providerName').fill('Synthetic saved provider');await p.locator('#saveDialog').click();await p.locator('#editDialog').waitFor({state:'hidden'});
  const saved=await record();assert.ok(JSON.parse(saved.raw).providers.some(x=>x.name==='Synthetic saved provider'));await cleanReload();assert.deepEqual(await record(),saved);
  assert.deepEqual(errors,[]);report.engines.push({engine,result:'PASS',scans,checks:['native reload rejection retains draft','accepted reload exits','local Escape reject/accept/focus','clean three forms no warning','saved no warning/exact persistence','no draft persistence']});
  console.log(engine+': bounded D/P2 PASS; no cross-origin warning guarantee asserted');
 }finally{writeFileSync('artifacts/gates/dialog-native-navigation.json',JSON.stringify(report,null,2)+'\n');await ctx.close();await browser.close();}
}
