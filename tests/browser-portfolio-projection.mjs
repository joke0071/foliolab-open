import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as playwright from 'playwright';
import {controlledStorageFixture} from './browser-controlled-storage-fixture.mjs';

const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
for(const engine of (process.env.PROJECTION_ENGINES||'chromium').split(',')){
 const browser=await playwright[engine].launch();
 try{
  const context=await browser.newContext({viewport:{width:320,height:850}});
  await context.addInitScript({content:await readFile('node_modules/axe-core/axe.min.js','utf8')});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(new URL('?page=history',base).href);
  const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState').textContent.includes('IndexedDB aktiv'));
  const read=()=>page.evaluate(async()=>{
   const {openPortfolioDB,readPortfolioRecord}=await import('./src/atomic-storage.js');
   const db=await openPortfolioDB();
   try{return await readPortfolioRecord(db);}finally{db.close();}
  });
  await controlledStorageFixture(page,ready,read);
  await page.evaluate(async()=>{
   const {blankModel,createProvider,createAccount,createPosition}=await import('./src/model.js');
   const {PortfolioStorage}=await import('./src/browser-portfolio-storage.js');
   const store=new PortfolioStorage();
   await store.initialize();
   try{
    const model=blankModel(),provider=createProvider({id:'projection-cash',name:'Synthetic deposit'});
    model.providers.push(provider);
    const account=createAccount({providerId:provider.id,id:'projection-account',name:'Synthetic account',type:'checking'},model);
    model.accounts.push(account);
    model.positions.push(createPosition({providerId:provider.id,accountId:account.id,kind:'cash',
     name:'Synthetic cash',symbol:'EUR',quantity:'1000',price:'1',currency:'EUR'},model));
    model.settings.autoRefresh='off';
    await store.save(model);
   }finally{store.close();}
  });
  const original=await read();
  await context.setOffline(true);
  await page.reload();
  await ready();
  const projection=page.locator('#portfolioProjection');
  await projection.locator(':scope > summary').click();
  const copy=projection.getByRole('button',{name:'Belegten Portfoliowert übernehmen'});
  await copy.click();
  assert.equal(await projection.locator('[name="start"]').inputValue(),'1000,00');
  await projection.locator('[name="monthly"]').fill('25');
  await projection.getByRole('button',{name:'Szenarien berechnen'}).click();
  assert.equal(await projection.locator('.projection-result').count(),3);
  assert.match(await projection.locator('.projection-results').innerText(),/Kaufkraft heute/);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:850});
   assert.ok(await projection.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Projection overflow at '+width);
  }
  await page.setViewportSize({width:320,height:850});
  const scaled=await projection.evaluate(section=>{
   const fonts=[...section.querySelectorAll('*')].map(node=>[node,node.style.fontSize,parseFloat(getComputedStyle(node).fontSize)]);
   for(const [node,,size] of fonts)node.style.fontSize=(2*size)+'px';
   try{return {width:innerWidth,scroll:document.documentElement.scrollWidth};}
   finally{for(const [node,original] of fonts)node.style.fontSize=original;}
  });
  assert.ok(scaled.scroll<=scaled.width+1,'Open projection overflows the page with doubled font sizes');
  assert.deepEqual(await page.evaluate(async()=> (await axe.run('#portfolioProjection')).violations.map(v=>v.id)),[]);
  await projection.locator('[name="low"]').fill('10');
  await projection.getByRole('button',{name:'Szenarien berechnen'}).click();
  assert.match(await projection.locator('[role="alert"]').innerText(),/aufsteigend/);
  assert.equal(await projection.locator('.projection-result').count(),0);
  assert.deepEqual(await read(),original,'Scenario input and calculation must leave complete IDB record unchanged');
  assert.deepEqual(errors,[]);
  console.log('Future scenarios: '+engine+' actual controlled offline UI, valuation opt-in, responsive/Axe, invalid inputs and unchanged native record PASS');
 }finally{await browser.close();}
}
