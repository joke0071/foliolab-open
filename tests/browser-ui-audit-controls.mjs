import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/';
const proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const out='artifacts/gates/ui-audit-controls';mkdirSync(out,{recursive:true});
const report={base,scope:'synthetic presentation controls; exact IndexedDB nonmutation',engines:[]};
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const ctx=await browser.newContext({viewport:{width:390,height:900},ignoreHTTPSErrors:Boolean(proxy)});
 await ctx.addInitScript({content:readFileSync(new URL('../node_modules/axe-core/axe.min.js',import.meta.url),'utf8')});
 const p=await ctx.newPage(),errors=[],scans=[];p.on('pageerror',e=>errors.push(e.message));
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=async page=>p.locator((await p.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav')+' [data-page='+page+']').click();
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}});
 const geometry=async selector=>{
  const boxes=await p.locator(selector).evaluateAll(es=>es.filter(e=>e.checkVisibility({checkVisibilityCSS:true})).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.trim(),width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
  assert.ok(boxes.length,'targets exist: '+selector);
  assert.ok(boxes.every(r=>r.width>=44&&r.height>=44),'real44px targets '+JSON.stringify(boxes));
  for(const [i,a]of boxes.entries())for(const b of boxes.slice(i+1))assert.ok(a.right<=b.left+.1||b.right<=a.left+.1||a.bottom<=b.top+.1||b.bottom<=a.top+.1,'distinct nonoverlapping targets');
  return boxes;
 };
 const scan=async label=>{
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' page overflow');
  assert.deepEqual(await p.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[],label+' Axe');scans.push(label);
 };
 try{
  await p.goto(base);await ready();
  for(const filled of [false,true]){
   if(filled){
    await p.evaluate(async()=>{const {blankModel,createProvider,createAccount,createPosition,snapshot}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'audit-provider',name:'SYNTHETIC UI audit'}));m.accounts.push(createAccount({id:'audit-account',providerId:'audit-provider',name:'SYNTHETIC account',type:'securities'},m));for(const [id,kind,price]of [['cash','cash',1010],['etf','etf',1059],['crypto','crypto',983.1]])m.positions.push(createPosition({id,providerId:'audit-provider',accountId:'audit-account',name:'SYNTHETIC '+kind,kind,quantity:1,price},m));for(const [date,value]of [['2024-01-01','1000'],['2024-02-01','1010'],['2024-03-01','1059']])snapshot(m,date,'SYNTHETIC',{manualTotalEUR:value});const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();});await p.reload();await ready();
   }
   const before=await record();
   for(const width of [320,390,430,768,1440]){
    await p.setViewportSize({width,height:900});
    for(const page of ['dashboard','history','positions','bookings','more']){
     await nav(page);await scan((filled?'filled':'empty')+' '+page+' '+width);
     if(page==='dashboard'){
      await geometry('#dashboardPage .link-button');
      if(!filled)await geometry('#onboarding .btn');
      else{
       const segment=p.locator('.allocation-segment[data-allocation-key=cash]');await p.keyboard.press('Tab');await segment.focus();
       assert.equal(await p.locator('#donutTotal').innerText(),'€ 1,01 Tsd.');
       assert.match(await p.locator('.allocation-center').getAttribute('aria-label'),/1\.010,00/);
       assert.equal(await segment.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
       assert.ok(await segment.evaluate(e=>parseFloat(getComputedStyle(e).outlineWidth)>=3));
       await p.screenshot({path:out+'/'+engine+'-focus-'+width+'.png'});
      }
     }
     if(page==='positions')await geometry('#positionsPage .action-group .responsive-action,#positionsPage .filter-list .filter');
     if(page==='bookings')await geometry('#bookingsPage .panel-actions .responsive-action');
     if(page==='history'&&filled){
      const periods=await geometry('#chartPeriods button');
      assert.equal(periods.length,width>=721?8:width<=374?5:6,'visible presets; remaining ones sit in "Mehr" on phones');
      assert.equal(new Set(periods.map(b=>b.top)).size,1,'compact single-row presets');
      const toggle=p.locator('#historyCalendarDisclosure>summary');await toggle.click();
      await geometry('#historyCalendarDisclosure>summary');await geometry('#historyCalendarPanel button');
      assert.ok(await p.locator('#historyCalendarPanel').evaluate(e=>{const r=e.getBoundingClientRect();return e.scrollWidth<=e.clientWidth&&r.left>=0&&r.right<=innerWidth;}),'bounded seven-day calendar');
      const contrast=await p.locator('.history-calendar-weekdays,#historyCalendarHint').evaluateAll(es=>es.map(e=>{
       const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
       let bg=e;while(bg.parentElement&&getComputedStyle(bg).backgroundColor==='rgba(0, 0, 0, 0)')bg=bg.parentElement;
       const a=lum(rgb(getComputedStyle(e).color)),b=lum(rgb(getComputedStyle(bg).backgroundColor));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      }));assert.ok(contrast.every(r=>r>=4.5),'actual small calendar text contrast '+contrast);
      const month=await p.locator('#historyCalendarMonth').innerText();await p.locator('#historyCalendarPrev').click();assert.notEqual(await p.locator('#historyCalendarMonth').innerText(),month);
      await scan('open calendar '+width);await p.screenshot({path:out+'/'+engine+'-calendar-'+width+'.png'});
      await p.keyboard.press('Escape');assert.ok(await toggle.evaluate(e=>document.activeElement===e));
     }
    }
   }
   assert.deepEqual(await record(),before,'navigation,focus,calendar and labels preserve exact record/settings/revision');
  }
  await p.setViewportSize({width:320,height:360});await nav('history');await p.locator('#historyCalendarDisclosure>summary').click();
  await p.locator('#historyCalendarPanel').evaluate(root=>{for(const [e,size]of [...root.querySelectorAll('*')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]))e.style.fontSize=size*1.5+'px';});
  await geometry('#historyCalendarPanel button');await p.locator('#historyCalendarReset').focus();await p.locator('#historyCalendarReset').scrollIntoViewIfNeeded();
  assert.ok(await p.locator('#historyCalendarReset').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'short enlarged-text reset remains reachable');
  await scan('320x360 synthetic150percent calendar text');await p.keyboard.press('Escape');assert.deepEqual(errors,[]);
  report.engines.push({engine,result:'PASS',scans,checks:['50empty/filled views','real44px nonoverlapping scoped controls','seven-day320px calendar','balanced4+4 wealth presets','calendar4.5contrast','exact accessible donor amount and visible SVG focus','short height/enlarged text/reset/Escape focus','exact IndexedDB nonmutation']});
  console.log(engine+': UI audit precision/44px/calendar/periods/contrast/focus/50views/Axe/zero writes PASS');
 }finally{await browser.close();}
}
writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
