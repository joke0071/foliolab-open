import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
/** The existing 1000 EUR integration oracle, now executed at the final PR/Main/live head. */
export async function combinedFilterAllocationBrowserContract({p,record,engine}){
 const dir='artifacts/gates/combined-filter-allocation';mkdirSync(dir,{recursive:true});
 await p.context().setOffline(false);await p.setViewportSize({width:390,height:850});
 await p.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js'),{executeTransaction}=await import('/src/transactions.js'),{PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const m=blankModel();m.settings.autoRefresh=false;m.providers.push(createProvider({id:'p',name:'Combined synthetic bank'}));m.accounts.push(createAccount({id:'depot',name:'Depot',type:'securities',providerId:'p'},m));
  for(const [i,amount]of [400,300,299].entries())m.positions.push(createPosition({id:'p'+i,name:'ETF '+i,kind:'etf',quantity:1,price:amount,providerId:'p',accountId:'depot'},m));
  m.positions.push(createPosition({id:'small',name:'Small cash',kind:'cash',quantity:0,price:1,providerId:'p',accountId:'depot'},m));
  executeTransaction(m,{id:'combined-deposit',type:'deposit',positionId:'small',quantity:1,unitPrice:1,date:'2026-01-02'});
  const s=new PortfolioStorage();await s.initialize();await s.save(m);s.close();
 });await p.reload();await p.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=page=>p.locator('#mobileNav [data-page='+page+']:visible,#sidebarNav [data-page='+page+']:visible').click();
 await nav('dashboard');
 const rawBefore=await record(),model=JSON.parse(rawBefore.raw);assert.equal(model.journalEntries.length,1);assert.equal(model.bookings.length,1);
 await p.locator('#providerOverview .provider-accordion>summary').click();
 const read=()=>p.evaluate(()=>({total:document.getElementById('totalValue').textContent,main:document.getElementById('donut').innerHTML,legend:document.getElementById('allocationLegend').innerHTML,rings:[...document.querySelectorAll('#providerOverview .account-allocation')].map(e=>e.outerHTML)}));
 const before=await read();assert.match(before.total,/1[.\s\u00a0]?000,00/,'total remains exactly 1000 EUR');assert.deepEqual(await p.locator('.account-allocation>span').allTextContents(),['40 %','30 %','29,9 %','0,1 %']);
 await nav('positions');await p.locator('#positionListHead button').click();await p.locator('[data-position-select=small]').check();await p.locator('#positionValueFilter').fill('2');
 assert.equal(await p.locator('#positionList [data-position-id=small]').count(),0);assert.match(await p.locator('#positionSelectionStatus').innerText(),/1 ausgeblendet/);
 await nav('dashboard');assert.deepEqual(await read(),before,'hidden small cash leaves all account shares, main allocation and sum unchanged');assert.deepEqual(await record(),rawBefore,'real nonempty journal/bookings/quantities/revision unchanged');
 await p.screenshot({path:dir+'/'+engine+'-390.png'});
 await nav('positions');await p.locator('#positionValueFilter').fill('');assert.equal(await p.locator('[data-position-select=small]').isChecked(),true);
 await nav('dashboard');assert.deepEqual(await read(),before);assert.deepEqual(await record(),rawBefore);

 const report={result:'PASS',engine,oracle:{totalEUR:1000,shares:[40,30,29.9,.1],thresholdEUR:2,journals:1,bookings:1},checks:['selected 1 EUR position hidden at 2 EUR and selected after clearing','all four account ring markups unchanged','main donut/legend/sum unchanged','canonical raw/revision/settings and nonempty journal/bookings/quantities unchanged'],nativeDevice:false};
 writeFileSync(dir+'/'+engine+'.json',JSON.stringify(report,null,2));console.log('COMBINED_FILTER_ALLOCATION_PASS '+engine);
}
