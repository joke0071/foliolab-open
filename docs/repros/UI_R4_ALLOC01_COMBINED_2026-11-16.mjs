import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {waitForAppServiceWorker} from '../../tests/browser-gate-deadline.mjs';
mkdirSync('artifacts/combined',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const ctx=await browser.newContext({viewport:{width:390,height:850}});
 await ctx.addInitScript({content:readFileSync('node_modules/axe-core/axe.min.js','utf8')});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/');await waitForAppServiceWorker(p);await p.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
 await p.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{executeTransaction}=await import('/src/transactions.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'p',name:'Combined synthetic bank'}));m.accounts.push(createAccount({id:'depot',name:'Depot',type:'securities',providerId:'p'},m));
  for(const [i,amount]of [400,300,299].entries())m.positions.push(createPosition({id:'p'+i,name:'ETF '+i,kind:'etf',quantity:1,price:amount,providerId:'p',accountId:'depot'},m));
  m.positions.push(createPosition({id:'small',name:'Small cash',kind:'cash',quantity:0,price:1,providerId:'p',accountId:'depot'},m));
  executeTransaction(m,{id:'combined-deposit',type:'deposit',positionId:'small',quantity:1,unitPrice:1,date:'2026-01-02'});
  const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
 });await p.reload();await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=page=>p.locator('#mobileNav [data-page='+page+']:visible,#sidebarNav [data-page='+page+']:visible').click();
 const record=()=>p.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}});
 const rawBefore=await record(),model=JSON.parse(rawBefore.raw);assert.equal(model.journalEntries.length,1);assert.equal(model.bookings.length,1);
 await p.locator('#providerOverview .provider-accordion>summary').click();
 const read=()=>p.evaluate(()=>({total:document.getElementById('totalValue').textContent,main:document.getElementById('donut').innerHTML,legend:document.getElementById('allocationLegend').innerHTML,rings:[...document.querySelectorAll('#providerOverview .account-allocation')].map(e=>e.outerHTML)}));
 const before=await read();assert.deepEqual(await p.locator('.account-allocation>span').allTextContents(),['40 %','30 %','29,9 %','0,1 %']);
 await nav('positions');await p.locator('#positionListHead button').click();await p.locator('[data-position-select=small]').check();await p.locator('#positionValueFilter').fill('2');
 assert.equal(await p.locator('#positionList [data-position-id=small]').count(),0);assert.match(await p.locator('#positionSelectionStatus').innerText(),/1 ausgeblendet/);
 await nav('dashboard');assert.deepEqual(await read(),before,'hidden small cash leaves all account shares, main allocation and sum unchanged');assert.deepEqual(await record(),rawBefore,'real nonempty journal/bookings/quantities/revision unchanged');
 await p.screenshot({path:'artifacts/combined/390.png'});
 await nav('positions');await p.locator('#positionValueFilter').fill('');assert.equal(await p.locator('[data-position-select=small]').isChecked(),true);
 await nav('dashboard');assert.deepEqual(await read(),before);assert.deepEqual(await record(),rawBefore);assert.deepEqual(errors,[]);
 const report={result:'PASS',filterHead:'859af3942db38ef2ed3439c1767a763fc500ff1f',ringHead:'6a9c4afd035dcebed940efa46cf5981f207d16ee',engine:'chromium141',oracle:{totalEUR:1000,shares:[40,30,29.9,.1],thresholdEUR:2,journals:1,bookings:1},checks:['small selected cash hidden/restored','all four account ring markups byte-identical','main donut/legend/sum unchanged','canonical raw/revision/settings including nonempty journal unchanged'],nativeDevice:false};
 writeFileSync('artifacts/combined/result.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close();}
