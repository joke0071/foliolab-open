import {returnFromSection} from './browser-disclosures.mjs';
import assert from 'node:assert/strict';
import * as playwright from 'playwright';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const destinations=[
 ['Diagramm','historyDiagram',''],
 ['Datenabdeckung','historyCoverage',' > summary'],
 ['Rendite','performanceDetails',' > summary'],
 ['Stichtage','snapshotManager',' > summary'],
 ['Szenarien','portfolioProjection',' > summary'],
];

for(const engine of (process.env.UI_ENGINES||'chromium').split(',')){
 const browser=await playwright[engine].launch();
 try{
  const context=await browser.newContext({viewport:{width:320,height:800},hasTouch:true});
  const page=await context.newPage();
  const failures=[];
  page.on('pageerror',error=>failures.push(error.message));
  const summary=id=>page.locator('#'+id+' > summary');
  const ready=()=>page.waitForFunction(()=>!document.querySelector('.layout').inert);
  const read=()=>page.evaluate(async()=>{
   const {openPortfolioDB,readPortfolioRecord}=await import('./src/atomic-storage.js');
   const db=await openPortfolioDB();
   try{return await readPortfolioRecord(db);}finally{db.close();}
  });
  async function reached([label,id,child]){
   const target=['performanceDetails','snapshotManager','portfolioProjection'].includes(id)?'#pageTitle':'#'+id+child;
   await page.waitForFunction(selector=>document.activeElement===document.querySelector(selector),target, {timeout:5000}).catch(async error=>{
    throw new Error('Focus after navigating to '+id+' was '+await page.evaluate(()=>document.activeElement.outerHTML.slice(0,120)),{cause:error});
   });
   const measure=await page.locator(target).evaluate(node=>({
    top:node.getBoundingClientRect().top,
    header:document.querySelector('.mobile-header').getBoundingClientRect().bottom,
    width:document.documentElement.clientWidth,
    scroll:document.documentElement.scrollWidth,
   }));
   assert.ok(measure.top>=measure.header,label+' must clear the sticky header');
   assert.ok(measure.scroll<=measure.width+1,label+' must not overflow the page');

   if(child)assert.equal(await page.locator('#'+id).evaluate(node=>node.open),true);
  }
  await page.goto(new URL('?page=history',base).href);
  await ready();
  await controlledStorageFixture(page,ready,read);
  const empty=await read();
  assert.equal(await page.locator('#historyPage nav').count(),0);
  await summary('historyCoverage').tap();
  assert.equal(await page.locator('#historyCoverage').evaluate(node=>node.open),true);
  await summary('historyCoverage').tap();
  assert.deepEqual(await read(),empty,'Empty portfolio record must stay untouched');

  await page.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('./src/model.js');
   const {PortfolioStorage}=await import('./src/browser-portfolio-storage.js');
   const store=new PortfolioStorage();
   await store.initialize();
   try{
    const model=blankModel();
    const provider=createProvider({id:'nav-cash',name:'Synthetic deposit'});
    model.providers.push(provider);
    const account=createAccount({providerId:provider.id,id:'nav-account',name:'Synthetic account',type:'checking'},model);
    model.accounts.push(account);
    model.positions.push(createPosition({providerId:provider.id,accountId:account.id,kind:'cash',
     name:'Synthetic cash',symbol:'EUR',quantity:'1000',price:'1',currency:'EUR'},model));
    model.settings.autoRefresh='off';
    await store.save(model);
   }finally{store.close();}
  });
  const populated=await read();
  await context.setOffline(true);
  await page.goto(new URL('?page=history#portfolioProjection',base).href);
  await page.reload();
  await ready();
  await reached(destinations[4]);
  await page.locator('#portfolioProjection [name=start]').fill('1234');
  await page.locator('.skip-to-content').focus();
  await page.keyboard.press('Enter');
  assert.equal(new URL(page.url()).hash,'#portfolioProjection');
  assert.equal(await page.locator('#mainContent').evaluate(el=>document.activeElement===el),true);
  for(const width of [320,390]){
   await page.setViewportSize({width,height:800});
   for(const dest of destinations){
    await page.evaluate(id=>{location.hash=id;},dest[1]);
    await reached(dest);
   }
  }
  const projectionSummary=summary('portfolioProjection');
  await returnFromSection(page);
  assert.equal(await page.locator('#portfolioProjection').evaluate(node=>node.open),false);
  await projectionSummary.press('Enter');
  assert.equal(await page.locator('#portfolioProjection [name=start]').inputValue(),'1234');
  await page.locator('#mobileNav [data-page=positions]').click();
  assert.equal(await page.locator('#positionsPage').isVisible(),true);
  await page.goBack();
  await reached(destinations[4]);
  await page.goBack();
  await projectionSummary.waitFor({state:'visible'});
  await page.goForward();
  await reached(destinations[4]);
  await page.goForward();
  await page.waitForFunction(()=>document.getElementById('positionsPage').classList.contains('active'));
  assert.deepEqual(await read(),populated,'Navigation must not persist portfolio changes');
  await page.locator('#mobileNav [data-page=more]').click();
  assert.equal(await page.locator('#morePage nav').count(),0);
  await page.evaluate(()=>{location.hash='moreSources';});
  await page.waitForFunction(()=>document.activeElement?.id==='moreSources');
  await page.setViewportSize({width:360,height:900});
  const exportButton=page.locator('#exportBackup');
  await exportButton.evaluate(button=>window.scrollBy({top:button.getBoundingClientRect().top-68,behavior:'instant'}));
  assert.ok(await exportButton.evaluate(button=>{
   const rect=button.getBoundingClientRect();
   return [4,rect.height/2,rect.height-4].every(y=>button.contains(document.elementFromPoint(rect.left+rect.width/2,rect.top+y)));
  }),'the backup action remains tappable across its height after scrolling');
  assert.deepEqual(await read(),populated,'reading settings sections must keep the saved portfolio intact');
  assert.deepEqual(failures,[]);
  console.log('History disclosures and deep links: '+engine+' touch, keyboard, fragments, back/forward and offline record preservation PASS');
 }finally{await browser.close();}
}
