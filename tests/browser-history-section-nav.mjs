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
  const nav=page.getByRole('navigation',{name:'Abschnitte im Verlauf'});
  const ready=()=>page.waitForFunction(()=>!document.querySelector('.layout').inert);
  const read=()=>page.evaluate(async()=>{
   const {openPortfolioDB,readPortfolioRecord}=await import('./src/atomic-storage.js');
   const db=await openPortfolioDB();
   try{return await readPortfolioRecord(db);}finally{db.close();}
  });
  async function reached([label,id,child]){
   await page.waitForFunction(({id,child})=>document.activeElement===document.querySelector('#'+id+child),{id,child});
   const measure=await page.locator('#'+id+child).evaluate(node=>({
    top:node.getBoundingClientRect().top,
    header:document.querySelector('.mobile-header').getBoundingClientRect().bottom,
    width:document.documentElement.clientWidth,
    scroll:document.documentElement.scrollWidth,
   }));
   assert.ok(measure.top>=measure.header,label+' must clear the sticky header');
   assert.ok(measure.scroll<=measure.width+1,label+' must not overflow the page');
   assert.equal(await nav.locator('[aria-current="location"]').innerText(),label);
   if(child)assert.equal(await page.locator('#'+id).evaluate(node=>node.open),true);
  }
  await page.goto(new URL('?page=history',base).href);
  await ready();
  await controlledStorageFixture(page,ready,read);
  const empty=await read();
  await nav.getByRole('link',{name:'Datenabdeckung'}).tap();
  await reached(destinations[1]);
  await page.goBack();
  await page.waitForFunction(()=>location.hash==='');
  await page.waitForFunction(()=>document.activeElement?.textContent==='Datenabdeckung');
  assert.equal(await nav.locator('[aria-current="location"]').count(),0);
  await page.goForward();
  await reached(destinations[1]);
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
  for(const width of [320,390]){
   await page.setViewportSize({width,height:800});
   for(const dest of destinations){
    const link=nav.getByRole('link',{name:dest[0],exact:true});
    if(width===320){await link.focus();await page.keyboard.press('Enter');}
    else await link.tap();
    await reached(dest);
   }
  }
  assert.equal(await page.locator('#portfolioProjection [name=start]').inputValue(),'1234');
  await page.locator('#mobileNav [data-page=positions]').click();
  assert.equal(await page.locator('#positionsPage').isVisible(),true);
  await page.goBack();
  await reached(destinations[4]);
  await page.goBack();
  await reached(destinations[3]);
  await page.goForward();
  await reached(destinations[4]);
  await page.goForward();
  await page.waitForFunction(()=>document.getElementById('positionsPage').classList.contains('active'));
  assert.deepEqual(await read(),populated,'Navigation must not persist portfolio changes');
  assert.deepEqual(failures,[]);
  console.log('History section links: '+engine+' touch, keyboard, fragments, back/forward and offline record preservation PASS');
 }finally{await browser.close();}
}
