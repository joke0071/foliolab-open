import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import {observeBrowserFailures} from './browser-failure-diagnostics.mjs';
const base=process.env.UI_QUALITY_BASE||'http://127.0.0.1:4173/',proxy=base.startsWith('https:')&&process.env.HTTPS_PROXY;
const out='artifacts/gates/chart-tooltip';mkdirSync(out,{recursive:true});
const report={base,scope:'Synthetic real dashboard/history and shared native component tooltip geometry; no physical Android claim',engines:[]};
for(const engine of (process.env.UI_QUALITY_ENGINES||'chromium').split(',')){
 const browser=await({chromium,firefox,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox',...(proxy?['--ignore-certificate-errors']:[])]:[],...(proxy?{proxy:{server:proxy}}:{})});
 const context=await browser.newContext({viewport:{width:390,height:560},ignoreHTTPSErrors:Boolean(proxy)}),p=await context.newPage();
 await context.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const failureDiagnostics=observeBrowserFailures(p);let phase='initial-load';
 const ready=()=>p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=tab=>p.locator('#mobileNav [data-page='+tab+']:visible,#sidebarNav [data-page='+tab+']:visible').click();
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readPortfolioRecord(db)}finally{db.close()}});
 const bounded=async(plot,label)=>{
  const boxes=await plot.evaluate(root=>{const tip=root.querySelector('.chart-tooltip'),a=root.getBoundingClientRect(),b=tip.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,plotLeft:a.left,plotRight:a.right,plotTop:a.top,plotBottom:a.bottom,viewport:innerWidth,scrollHeight:tip.scrollHeight,clientHeight:tip.clientHeight}});
  assert.ok(boxes.left>=boxes.plotLeft-1&&boxes.right<=boxes.plotRight+1&&boxes.left>=0&&boxes.right<=boxes.viewport+1,label+' horizontal '+JSON.stringify(boxes));
  assert.ok(boxes.top>=boxes.plotTop-1&&boxes.bottom<=boxes.plotBottom+1,label+' vertical '+JSON.stringify(boxes));
  assert.ok(boxes.width<=221,label+' narrow tooltip');return boxes;
 };
 try{
  await p.goto(base);await ready();await p.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition,snapshot}=await import('/src/model.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'p',name:'SYNTHETIC chart'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'SYNTHETIC cash',type:'cash'},m));m.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',name:'SYNTHETIC cash',kind:'cash',quantity:198000,price:1},m));
   for(const [date,total]of [['2026-10-01','193652.38'],['2026-10-02','196883.12'],['2026-10-28','199059.98']])snapshot(m,date,'SYNTHETIC reference',{manualTotalEUR:total});
   const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
  });phase='fixture-reload';await p.reload();await ready();const before=await record();phase='chart-interactions';
  for(const tab of ['dashboard','history']){
   await nav(tab);const id=tab==='dashboard'?'miniChart':'historyChart',plot=p.locator('#'+id+' .chart-plot');await plot.scrollIntoViewIfNeeded();await plot.focus();await p.keyboard.press('End');
   const points=JSON.parse(await plot.getAttribute('data-chart-points'));assert.equal(points.length,3);
   assert.ok(Math.abs((points[1].x-points[0].x)/(points[2].x-points[0].x)-1/27)<1e-9,'actual '+tab+' elapsed-time ratio');
   const bounds=await plot.boundingBox();await plot.dispatchEvent('pointerdown',{pointerType:'touch',clientX:bounds.x+bounds.width*points[1].x/600,clientY:bounds.y+bounds.height-8});
   assert.match(await plot.locator('.chart-tooltip').innerText(),/196\.883,12/,'actual '+tab+' sparse touch selects nearest real observation');
   await plot.focus();await p.keyboard.press('End');
   const text=await plot.locator('.chart-tooltip').innerText();assert.match(text,/199\.059,98/);assert.doesNotMatch(text,/interpolierte Tagesbewertung/);
   assert.doesNotMatch(await p.locator('#'+id+' .chart-y-labels').innerText(),/Tsd\./);
   await bounded(plot,'actual '+tab);
   if(tab==='history')await p.screenshot({path:out+'/'+engine+'-history-390.png'});
  }
  assert.match(await p.locator('#historyCoverageBody').textContent(),/Erfasste Kontrollpunkte sind keine interpolierte Tagesbewertung/,'explanation retained in coverage');
  // Exercise the same renderer in its native main/position/wallet styling
  // contexts. Existing required suites retain full wallet/position flows.
  await p.evaluate(async()=>{
   const {drawInteractiveChart,attachChartInteractions}=await import('/src/dashboard-ui.js'),{money,escapeHTML}=await import('/src/model.js');
   const host=document.createElement('div');host.id='tooltipComponentFixtures';
   for(const [id,classes]of [['main',''],['position','position-history-plot'],['wallet','wallet-history-dialog']]){
    const wrapper=document.createElement('div');wrapper.className=classes;wrapper.style.cssText='width:100%;max-width:100%;margin:20px 0';
    const mount=document.createElement('div');mount.id='tooltip-'+id;mount.className='chart-area';mount.style.height='240px';
    mount.innerHTML=drawInteractiveChart([{date:'2026-10-01',total:196883.12,detail:'SYNTHETIC '+('Vollständiger notwendiger Herkunftshinweis '.repeat(16))},{date:'2026-10-02',total:196900,detail:'SYNTHETIC belegte Kursbeobachtung'},{date:'2026-10-28',total:199059.98,detail:'SYNTHETIC '+('Vollständiger notwendiger Herkunftshinweis '.repeat(16))}],{money,esc:escapeHTML,dateLabel:d=>d});wrapper.append(mount);host.append(wrapper);attachChartInteractions(mount);
   }
   document.getElementById('historyPage').append(host);
  });
  const widths=[320,360,390,412,430,768,1440];
  for(const width of widths){
   await p.setViewportSize({width,height:560});
   for(const id of ['main','position','wallet']){
    const plot=p.locator('#tooltip-'+id+' .chart-plot'),tip=plot.locator('.chart-tooltip');await plot.evaluate(e=>e.scrollIntoView({block:'center'}));await plot.focus();await p.keyboard.press('Home');await bounded(plot,id+' first '+width);
    const a=await plot.boundingBox(),y=a.y+a.height-8;
    const points=JSON.parse(await plot.getAttribute('data-chart-points'));assert.deepEqual(points.map(p=>p.date),['2026-10-01','2026-10-02','2026-10-28']);
    assert.ok(Math.abs(points[1].x-(5+590/27))<1e-9,id+' actual day spacing '+width);
    await p.mouse.move(a.x+a.width*points[1].x/600,y);assert.match(await tip.innerText(),/196\.900,00/,id+' sparse mouse nearest '+width);
    await plot.dispatchEvent('pointerdown',{pointerType:'touch',clientX:a.x+a.width*points[1].x/600,clientY:y});assert.match(await tip.innerText(),/196\.900,00/,id+' sparse touch nearest '+width);
    await plot.focus();await p.keyboard.press('Home');await p.keyboard.press('ArrowRight');assert.match(await tip.innerText(),/196\.900,00/,id+' chronological keyboard '+width);
    assert.ok(await plot.evaluate((root,{x,y})=>root.contains(document.elementFromPoint(x,y)),{x:a.x+a.width-3,y}),'uncovered mouse target '+id+' '+width);
    // Move from left to right even if the previous fixture occupied exactly
    // the same viewport coordinates; a stationary mouse emits no movement.
    await p.mouse.move(a.x+3,y);await p.mouse.move(a.x+a.width-3,y);await bounded(plot,id+' mouse last '+width);
    assert.match(await tip.innerText(),/199\.059,98/,id+' mouse last '+width);
    await plot.dispatchEvent('pointerdown',{pointerType:'touch',clientX:a.x+3,clientY:a.y+a.height-8});await bounded(plot,id+' synthetic touch '+width);assert.match(await tip.innerText(),/196\.883,12/);
    const detail=tip.locator('.chart-tooltip-detail');
    await plot.focus();await p.keyboard.press('End');await p.keyboard.press('Tab');assert.ok(await detail.evaluate(e=>document.activeElement===e),'long details keyboard focus');
    const outerScroll=await p.evaluate(()=>scrollY);await p.keyboard.press('Home');
    assert.equal(await detail.evaluate(e=>e.scrollTop),0,'detail Home scrolls only details');assert.match(await tip.innerText(),/199\.059,98/,'detail keys preserve selected point');
    await p.keyboard.press('End');
    await p.waitForFunction(id=>{const e=document.querySelector('#tooltip-'+id+' .chart-tooltip-detail');return e.scrollHeight>e.clientHeight&&e.scrollTop>0},id,{timeout:3000});
    assert.ok(await detail.evaluate(e=>e.scrollHeight>e.clientHeight&&e.scrollTop>0),'full long details scroll via keyboard');assert.match(await tip.textContent(),/Herkunftshinweis/);
    assert.ok(await tip.evaluate(root=>{const a=root.getBoundingClientRect();return [...root.querySelectorAll(':scope>span,:scope>strong')].every(e=>{const r=e.getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom})}),'date and exact value always visible while details scroll');
    assert.equal(await p.evaluate(()=>scrollY),outerScroll,'detail keys do not scroll the surrounding page');
    if(width===320&&id==='wallet')await p.screenshot({path:out+'/'+engine+'-wallet-320.png'});
   }
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+width);
   assert.deepEqual(await p.evaluate(async()=>(await axe.run('#tooltipComponentFixtures',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[],'fixture Axe '+width);
  }
  await p.setViewportSize({width:320,height:360});const plot=p.locator('#tooltip-main .chart-plot');await plot.scrollIntoViewIfNeeded();await plot.focus();await p.keyboard.press('End');await plot.locator('.chart-tooltip').evaluate(root=>{for(const e of root.querySelectorAll('span,strong'))e.style.fontSize=parseFloat(getComputedStyle(e).fontSize)*2+'px'});await bounded(plot,'synthetic200percent short height');
  assert.deepEqual(await record(),before,'chart navigation, pointer, tooltip and disclosure preserve exact raw/settings/revision');assert.deepEqual(errors,[]);
  report.engines.push({engine,result:'PASS',widths,checks:['real dashboard/history actual elapsed-time ratio1/27 and nearest observed touch point','sparse native main/position/wallet coordinates and nearest mouse/touch/chronological keyboard at7widths','real dashboard/history exact values and readable axes','observed explanation once in coverage','native main/position/wallet component edge bounds','mouse/synthetic touch/keyboard','full long details keyboard scroll','7widths/Axe/short height/synthetic200percent text','exact canonical record unchanged']});
  console.log(engine+': CHART TOOLTIP actual time spacing/nearest real observation/readable axes/bounds/exact values/full details/7widths/Axe/zero writes PASS');
 }catch(error){report.engines.push({engine,result:'FAIL',phase,error:String(error).slice(0,1500),pageErrors:errors,diagnostics:await failureDiagnostics()});throw error;}
 finally{await browser.close();writeFileSync(out+'/report.json',JSON.stringify(report,null,2));}
}
