// Synthetic-data screenshot capture for #288/#289. Usage: node capture.mjs <before|after> [engines]
import {chromium,firefox} from 'playwright';
import {mkdirSync} from 'node:fs';
const tag=process.argv[2]||'after',base=process.env.UI_BASE||'http://127.0.0.1:4173/';
const out='/root/foliolab-open/docs/ui-copilot-2026-11-03/img/';mkdirSync(out,{recursive:true});
export async function seed(p){
 await p.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,snapshot}=await import('/src/model.js'),{captureOpenings,executeTransaction}=await import('/src/transactions.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const m=blankModel();m.settings.autoRefresh=false;
  m.providers.push(createProvider({id:'p',name:'Synthetic provider with an extremely long display name for layout checks'}));
  m.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic cash account with a very long account name',type:'checking'},m));
  for(let i=0;i<8;i++)m.positions.push(createPosition({id:'pos-'+i,providerId:'p',accountId:'a',name:i===0?'Synthetic cash position with an unusually long name 1234567890':'Synthetic cash '+i,kind:'cash',quantity:1000+i,price:1},m));
  captureOpenings(m);m.openingPositions.forEach(o=>o.asOf='2020-01-01');
  for(let i=0;i<8;i++)executeTransaction(m,{id:'bk-'+i,type:'deposit',positionId:'pos-'+(i%3),date:'2025-01-0'+(i+1),quantity:1234567.891+i,unitPrice:1,notes:'Synthetic booking '+i});
  for(let i=0;i<5;i++){const date='2024-0'+(i+1)+'-01';snapshot(m,date,'SYNTHETIC reference '+i,{manualTotalEUR:String(100000+i*1111)});m.snapshots.find(s=>s.date===date).id='ref-'+i;}
  const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
 });
}
export const ready=p=>p.waitForFunction(()=>document.getElementById('appStartup').hidden&&document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
export const nav=(p,page)=>p.locator('#mobileNav [data-page="'+page+'"]:visible,#sidebarNav [data-page="'+page+'"]:visible').first().click();
if(process.argv[1]===new URL(import.meta.url).pathname){
 for(const engine of (process.argv[3]||'chromium').split(',')){
  const browser=await({chromium,firefox}[engine]).launch({args:engine==='chromium'?['--no-sandbox']:[]});
  for(const w of [320,390,1440]){
   const ctx=await browser.newContext({viewport:{width:w,height:900},serviceWorkers:'block'}),p=await ctx.newPage();
   await p.goto(base);await ready(p);await seed(p);await p.reload();await ready(p);
   const shot=async n=>p.screenshot({path:`${out}${tag}-${engine}-${w}-${n}.png`,fullPage:false});
   await nav(p,'positions');await p.locator('#positionList').scrollIntoViewIfNeeded();await shot('positions-normal');
   await p.locator('#positionListHead [data-action="select-positions"]').click();await shot('positions-manage');
   await p.locator('#positionListHead [data-action="cancel-selection"]').click();
   await nav(p,'bookings');await p.locator('#bookingList').scrollIntoViewIfNeeded();await shot('bookings-normal');
   await p.locator('#bookingListHead [data-booking-manage="select"]').click();await shot('bookings-manage');
   await p.locator('#bookingListHead [data-booking-manage="cancel"],#bookingManagementTools [data-booking-manage="cancel"]').first().click();
   await nav(p,'history');if(!await p.locator('#snapshotManager').evaluate(e=>e.open))await p.locator('#snapshotManager>summary').click();await p.locator('#snapshotManager').scrollIntoViewIfNeeded();await shot('history-normal');
   await p.locator('#manageReferences').click();await shot('history-manage');
   await p.locator('#manageReferences').click();
   await nav(p,'more');await shot('more-top');
   await nav(p,'dashboard');await shot('dashboard');
   await ctx.close();
  }
  await browser.close();
 }
}
