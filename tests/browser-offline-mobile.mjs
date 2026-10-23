import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Synthetic, throttled-browser proxy for a slower mobile device; this is NOT
// a measurement on physical Android/iOS hardware.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:360,height:780}});
const page=await context.newPage();
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 const values=await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),provider=createProvider({name:'Synthetic offline mobile broker'});
  m.providers.push(provider);
  const account=createAccount({name:'Mobile test depot',providerId:provider.id},m);
  m.accounts.push(account);m.settings.autoRefresh=false;
  for(let i=0;i<240;i++)
   m.positions.push(createPosition({
    id:'mobile-position-'+i,providerId:provider.id,accountId:account.id,
    kind:'etf',name:'Synthetic mobile ETF '+i,symbol:'T'+i,
    quantity:1,price:10,currency:'EUR'
   },m));
  for(let i=0;i<730;i++){
   const date=new Date(Date.UTC(2024,0,1+i)).toISOString().slice(0,10);
   m.snapshots.push({id:'mobile-snapshot-'+i,date,total:2400,totalEURExact:'2400',
    valuationStatus:'manual',source:'manual',byAccount:null,byPosition:null,
    quoteTimes:[],revisions:[],note:''});
  }
  persist(m);
  return {positions:m.positions.length,snapshots:m.snapshots.length};
 });
 assert.deepEqual(values,{positions:240,snapshots:730});
 await page.reload();
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:20000});
 const cpu=await context.newCDPSession(page);
 await cpu.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.locator('#totalValue').waitFor();
 assert.match(await page.locator('#totalValue').innerText(),/2.400/);
 await page.locator('#mobileNav [data-page="positions"]').click();
 assert.match(await page.locator('#quoteQualitySummary').innerText(),/Kurse:/);
 await page.locator('#positionSearch').fill('Synthetic mobile ETF 125');
 assert.match(await page.locator('#positionList').innerText(),/Synthetic mobile ETF 125/);
 for(const width of [320,360,390,430]){
  await page.setViewportSize({width,height:780});
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(dims.scroll<=dims.viewport+1,'Mobile horizontal overflow at '+width+': '+JSON.stringify(dims));
 }
 await page.locator('#positionSearch').fill('');
 // Verify that the app shell, local state and navigation work after the
 // service worker has cached first-party modules and the network goes offline.
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#mobileNav [data-page="positions"]').click();
 assert.match(await page.locator('#positionList').innerText(),/Synthetic mobile ETF/);
 await page.locator('#mobileNav [data-page="dashboard"]').click();
 assert.match(await page.locator('#totalValue').innerText(),/2.400/);
 await page.locator('#mobileNav [data-page="history"]').click();
 assert.equal(await page.locator('#historyPage').isVisible(),true);
 const saved=await page.evaluate(()=>{
  const m=JSON.parse(localStorage.getItem('foliolab-open-v1'));
  return {positions:m.positions.length,snapshots:m.snapshots.length,quantity:m.positions[0].quantityExact};
 });
 assert.deepEqual(saved,{positions:240,snapshots:730,quantity:'1'});
 await context.setOffline(false);
 await cpu.send('Emulation.setCPUThrottlingRate',{rate:1});
 console.log('OFFLINE MOBILE: 4x CPU throttle, 240 holdings, 730 snapshots, offline reload, data integrity, 320-430px PASS');
}finally{
 await context.setOffline(false).catch(()=>{});
 await context.close();
 await browser.close();
}
