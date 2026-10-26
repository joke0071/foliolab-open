import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',live=base.startsWith('https:'),proxy=live&&process.env.HTTPS_PROXY;
const report={base,scope:'presentation only: actions/spacing/liquidity/history/income/coverage',engines:[]};mkdirSync('artifacts/gates',{recursive:true});
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({viewport:{width:390,height:560},ignoreHTTPSErrors:live});
 await ctx.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=async page=>p.locator((await p.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav')+' [data-page="'+page+'"]').click();
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}});
 const scan=async label=>{await p.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});assert.deepEqual(await p.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[],label);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' page overflow');};
 try{
  await p.goto(base);await ready();await p.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{executeTransaction}=await import('/src/transactions.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'provider',name:'Synthetic UI provider'}));m.accounts.push(createAccount({id:'a',name:'Synthetic account',providerId:'provider',type:'securities',cashTerms:{version:1,status:'free',fixedTerm:false,outcome:'unconfirmed'}},m));
   m.positions.push(createPosition({id:'cash',providerId:'provider',accountId:'a',name:'Synthetic cash',kind:'cash',quantity:1000,price:1},m));m.positions.push(createPosition({id:'etf',providerId:'provider',accountId:'a',name:'Synthetic ETF with a long readable title',kind:'etf',quantity:0,price:100},m));m.positions.push(createPosition({id:'crypto',providerId:'provider',accountId:'a',name:'Synthetic crypto',kind:'crypto',quantity:1,price:10},m));executeTransaction(m,{positionId:'etf',cashPositionId:'cash',date:'2023-01-02',type:'buy',quantity:2.123456789,unitPrice:100,feeEUR:0,taxEUR:0});m.openingPositions.find(o=>o.positionId==='cash').asOf='2023-01-01';m.priceHistories.etf={currency:'EUR',source:'CSV (selbst geprüft)',points:[{date:'2023-01-02',total:100},{date:'2023-01-03',total:105},{date:'2023-01-04',total:110}]};const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  });await p.reload();await ready();const before=await record(),scans=[];
  assert.equal(await p.locator('#cashTermsOverview').evaluate(e=>!!e.previousElementSibling?.matches('.provider-accordion')),true,'liquidity below providers');assert.equal(await p.locator('#cashTermsOverview').getAttribute('open'),null);
  for(const width of [320,390,430,768,1440]){
   await p.setViewportSize({width,height:560});
   for(const page of ['dashboard','history','positions','bookings','more']){await nav(page);await scan(page+' '+width);scans.push({page,width,height:560});}
   await nav('positions');assert.equal(await p.locator('.position-actions [data-action=archive-position]:visible').count(),3);
   if(process.env.UI_QUALITY_SCREENSHOTS&&engine==='chromium'&&[390,1440].includes(width))await p.screenshot({path:'artifacts/gates/ui-positions-'+width+'.png',fullPage:true});
   const geometry=await p.locator('.position-entry').evaluateAll(rows=>rows.map(row=>{const rr=row.getBoundingClientRect(),buttons=[...row.querySelectorAll('.position-actions button')].map(b=>{const r=b.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,height:r.height};});return {bottom:rr.bottom,buttons};}));
   for(const row of geometry)for(const [i,b] of row.buttons.entries()){assert.ok(b.height>=44);assert.ok(b.x>=0&&b.right<=width);assert.ok(row.bottom-b.bottom>=8,'button/focus clear of separator');for(const c of row.buttons.slice(i+1))assert.ok(b.right<=c.x||c.right<=b.x||b.bottom<=c.y||c.bottom<=b.y,'no action overlaps');}
   await p.locator('[data-action=booking-history][data-id=etf]').click();const d=p.locator('#bookingHistoryDialog');await d.waitFor();await scan('history dialog '+width);assert.equal(await d.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
   assert.equal(await d.locator('.booking-value-table tr').last().locator('td').count(),5);assert.equal(await d.locator('.booking-value-table tr').last().evaluate(e=>getComputedStyle(e).display),width<=720?'grid':'table-row');
   const cell=d.locator('td[data-label="Bestand"]').first();await cell.focus();assert.match(await cell.innerText(),/2,1234568/);assert.match(await cell.getAttribute('title'),/Exakter Wert: 2\.123456789/);assert.match(await cell.evaluate(e=>getComputedStyle(e,'::after').content),/Exakter Wert: 2\.123456789/);
   if(process.env.UI_QUALITY_SCREENSHOTS&&engine==='chromium'&&width===390)await p.screenshot({path:'artifacts/gates/ui-history-records-390.png'});
   assert.equal(await d.locator('h3').evaluate(e=>getComputedStyle(e).fontSize),'14px');
   await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.dataset.action),'booking-history');
  }
  // Targeted enlarged-text stress test, not a claim of physical Android OS testing.
  await p.setViewportSize({width:320,height:360});await nav('positions');await p.evaluate(()=>{const els=[...document.querySelectorAll('#positionsPage *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,size]of els)e.style.fontSize=size*1.5+'px';});await scan('150percent synthetic text scale,320x360');
  assert.deepEqual(await record(),before,'presentation and navigation make zero portfolio writes');assert.deepEqual(errors,[]);
  report.engines.push({engine,status:'PASS',scans,textScale:'synthetic 150% computed-text stress,320x360; not physical Android',checks:['all five pages','archive visible without detail disclosure','44px actions,separator and focus clearance,no overlaps','liquidity below providers and closed','mobile labeled history records/desktop table','focused exact decimal disclosure','Escape/focus return','zero exact IndexedDB record mutations']});console.log(engine+': UI presentation,5pages/5widths/Axe,actions/spacing,history responsive/exact focus,150% text stress,zero IDB writes PASS');
 }finally{writeFileSync('artifacts/gates/ui-quality.json',JSON.stringify(report,null,2)+'\n');await ctx.close();await browser.close();}
}
