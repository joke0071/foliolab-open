import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),pr=createProvider({name:'Sample Broker'});m.providers.push(pr);
  const a=createAccount({name:'Sample Depot',providerId:pr.id},m);m.accounts.push(a);
  const p=createPosition({name:'Synthetic ETF',kind:'etf',symbol:'SYN',isin:'IE0000000001',quantityExact:'0.123456789',price:22,accountId:a.id,providerId:pr.id},m);
  p.quoteSource='EODHD';p.quoteAsOf='2026-10-21';p.updatedAt='2026-10-15T10:00:00Z';
  m.positions.push(p);persist(m);
 });
 await page.reload();await page.locator('#mobileNav [data-page="positions"]').click();
 const entry=page.locator('.position-entry').first();
 const summary=await entry.locator('.holding-note').innerText();
 assert.match(summary,/EODHD/);assert.match(summary,/21/);
 assert.doesNotMatch(summary,/15\.10/,'Do not print edit date as another quote date');
 assert.equal(await entry.locator('.holding-facts').isVisible(),false);
 await entry.locator('summary').click();
 assert.equal(await entry.locator('.holding-facts').isVisible(),true);
 const details=await entry.locator('.holding-facts').innerText();
 assert.match(details,/0\.123456789/);
 assert.match(details,/IE0000000001/);
 assert.match(details,/Position zuletzt geändert/);
 for(const width of [320,390,430,768,1024,1280,1440]){
  await page.setViewportSize({width,height:850});
  const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
  await page.locator(nav+' [data-page="positions"]').click();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=1,'Holding details overflow at '+width+': '+overflow);
 }
 console.log('POSITION DETAILS: one quote date, full precision, keyboard-native accordion and seven widths PASS');
}finally{await browser.close();}
