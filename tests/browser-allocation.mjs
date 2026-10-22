import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:850}});
const page=await context.newPage();
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),provider=createProvider({name:'Testbank'});m.providers.push(provider);
  const account=createAccount({name:'Konto',providerId:provider.id},m);m.accounts.push(account);
  for(const [name,kind,quantity,price,mode,role] of [
    ['ETF','etf',2,100,'included','standard'],
    ['Guthaben','cash',1,500,'included','standard'],
    ['Bitcoin','crypto',1,50,'included','standard'],
    ['Verbindlichkeit','crypto',1,50,'liability','borrowed']
  ])m.positions.push(createPosition({name,kind,quantity,price,providerId:provider.id,accountId:account.id,valuationMode:mode,economicRole:role},m));
  persist(m);
 });
 await page.reload();
 assert.equal(await page.locator('#donut .allocation-segment').count(),3);
 assert.equal(await page.locator('#allocationLegend button[data-allocation-index]').count(),3);
 assert.match(await page.locator('#allocationLegend').innerText(),/Verbindlichkeiten/);
 assert.match(await page.locator('#donutShare').innerText(),/Nettovermögen/);
 const selection=page.locator('#allocationLegend button[data-allocation-key="etf"]');
 await selection.click();
 assert.match(await page.locator('#donutLabel').innerText(),/ETF/);
 assert.match(await page.locator('#donutShare').innerText(),/26,7\s*%/);
 assert.equal(await selection.getAttribute('aria-pressed'),'true');
 await selection.click();
 assert.match(await page.locator('#donutLabel').innerText(),/Portfolio/);
 // Select sector with keyboard and move focus to adjacent sector.
 const sector=page.locator('#donut .allocation-segment[data-allocation-key="etf"]');
 await sector.focus();await page.keyboard.press('Enter');
 assert.equal(await sector.getAttribute('aria-pressed'),'true');
 await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('#donutLabel').innerText(),'Kryptowährungen');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#donutLabel').innerText(),'Portfolio');
 const saved=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  const rect=await page.evaluate(()=>{
   const pie=document.querySelector('#donut').getBoundingClientRect();
   const legend=document.querySelector('#allocationLegend').getBoundingClientRect();
   const panel=document.querySelector('#donut').closest('.panel').getBoundingClientRect();
   const outer=document.documentElement.scrollWidth;
   return {pieLeft:pie.left,pieRight:pie.right,legendLeft:legend.left,legendRight:legend.right,panelLeft:panel.left,panelRight:panel.right,scrollWidth:outer};
  });
  assert.ok(rect.scrollWidth<=width+1,'Horizontal overflow at '+width+': '+JSON.stringify(rect));
  assert.ok(rect.pieLeft>=rect.panelLeft-1&&rect.pieRight<=rect.panelRight+1,'Pie escapes card at '+width);
  assert.ok(rect.legendLeft>=rect.panelLeft-1&&rect.legendRight<=rect.panelRight+1,'Legend escapes card at '+width);
 }
 // Mobile touch should pin selection without depending on hover.
 const mobile=await browser.newContext({viewport:{width:390,height:850},isMobile:true,hasTouch:true});
 try{
  const touch=await mobile.newPage();await touch.goto('http://127.0.0.1:4173/');
  await touch.evaluate(value=>localStorage.setItem('foliolab-open-v1',value),saved);await touch.reload();
  await touch.locator('#allocationLegend [data-allocation-key="crypto"]').tap();
  assert.equal(await touch.locator('#donutLabel').innerText(),'Kryptowährungen');
  await touch.locator('#donut .allocation-center').tap();
  assert.equal(await touch.locator('#donutLabel').innerText(),'Portfolio');
 }finally{await mobile.close();}
 console.log('INTERACTIVE ALLOCATION: euro + share, liability handling, touch, keyboard, seven widths PASS');
}finally{await context.close();await browser.close();}
