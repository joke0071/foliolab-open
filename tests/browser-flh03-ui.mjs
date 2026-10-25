import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.FLH03_UI_BASE||'http://127.0.0.1:4173/',engines={chromium,firefox,webkit},live=base.startsWith('https:'),proxy=live&&process.env.HTTPS_PROXY;
const axeSource=readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8');
for(const engine of (process.env.FLH03_UI_ENGINES||'chromium').split(',')){
 const browser=await engines[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,ignoreHTTPSErrors:live});
 await ctx.addInitScript({content:axeSource});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const nav=async name=>p.locator((await p.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav')+' [data-page="'+name+'"]').click();
 const scan=async label=>{assert.deepEqual(await p.evaluate(async()=> (await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))),[],label);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow');};
 const read=()=>p.evaluate(async base=>{const {openPortfolioDB,readUnverifiedRecord}=await import(new URL('src/atomic-storage.js',base));const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}},base);
 try{
  await p.goto(base);await p.waitForFunction(()=>document.getElementById('portfolioStorageState').textContent.includes('IndexedDB aktiv'));
  assert.equal(await p.locator('#onboarding').isVisible(),true);assert.match(await p.locator('#totalValue').innerText(),/0,00/);
  const recovery=await p.evaluate(async base=>{
   const {openPortfolioDB}=await import(new URL('src/atomic-storage.js',base)),{blankModel,createProvider,backup}=await import(new URL('src/model.js',base));
   const m=blankModel();m.providers.push(createProvider({name:'Synthetic recovered'}));m.settings.autoRefresh=false;
   const db=await openPortfolioDB();await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put({schemaVersion:1,revision:7,raw:'{damaged',settings:{},deleted:false,updatedAt:'2026-10-25'},'portfolio');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();return backup(m);
  },base);
  const original=await read();await p.reload();await p.locator('#downloadRaw').waitFor();
  for(const [width,height] of [[320,360],[390,844],[430,740],[667,320],[768,500],[1024,768],[1440,900]]){
   await p.setViewportSize({width,height});await nav('dashboard');
   assert.equal(await p.locator('#onboarding').isVisible(),false);assert.equal(await p.locator('#summaryStats').isVisible(),false);
   assert.equal(await p.locator('#totalValue').textContent(),'–');
   for(const id of ['localPortfolioStatus','mobilePortfolioStatus'])assert.match(await p.locator('#'+id).textContent(),/nicht verfügbar/);
   await scan('recovery '+width+'x'+height);
  }
  for(const tab of ['positions','bookings','more']){await nav(tab);for(const id of tab==='positions'?['addWizard','addWallet','refreshAll']:tab==='bookings'?['addBooking','openCSVImport']:['addProvider','addAccount','deleteAll'])assert.ok(await p.locator('#'+id).isDisabled(),id+' recovery gate');}
  await p.evaluate(()=>document.querySelector('#addProvider').dispatchEvent(new MouseEvent('click',{bubbles:true})));
  assert.equal(await p.locator('#editDialog').isVisible(),false);assert.equal(await p.locator('#wizardDialog').isVisible(),false);
  assert.deepEqual(await read(),original,'Read-only recovery does not rewrite original bytes');
  const download=p.waitForEvent('download');await p.locator('#downloadRaw').click();const saved=await download;
  const bytes=JSON.parse(readFileSync(await saved.path(),'utf8'));assert.equal(bytes.raw,'{damaged');
  p.once('dialog',d=>d.accept());await p.locator('#backupFile').setInputFiles({name:'synthetic-restore.json',mimeType:'application/json',buffer:Buffer.from(recovery)});
  await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
  assert.match(await p.locator('#localPortfolioStatus').textContent(),/lokal gespeichert/);await nav('more');assert.ok(await p.locator('#addProvider').isEnabled());
  assert.equal(JSON.parse((await read()).raw).providers[0].name,'Synthetic recovered');
  console.log(engine+': A recovery/empty distinction, safe actions, 7 geometries/full axe, unchanged original download and controlled restore PASS');
  assert.deepEqual(errors,[]);
 }finally{await ctx.close();await browser.close();}
}
