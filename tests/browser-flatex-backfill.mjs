import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844}});
const isin='IE00BK5BQT80';
const depotCSV=[
 'Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Buchungsinformationen;TA-Nr.;Kurs;Depot',
 '20.10.2026;21.10.2026;'+isin+';ETF;10;ORDER Kauf;TX10;101;A',
 '22.10.2026;23.10.2026;'+isin+';ETF;-3;ORDER Verkauf;TX11;102;A'
].join('\n');
try{
 await page.goto('http://127.0.0.1:4173/');
 const ids=await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),f=createProvider({name:'Flatex Österreich',type:'broker'}),other=createProvider({name:'Broker 2',type:'broker'});
  m.providers.push(f,other);
  const a=createAccount({providerId:f.id,name:'Wertpapierdepot A',type:'securities'},m);
  const b=createAccount({providerId:other.id,name:'Fremddepot',type:'securities'},m);
  m.accounts.push(a,b);
  const p=createPosition({providerId:f.id,accountId:a.id,kind:'etf',name:'ETF Flatex',isin:'IE00BK5BQT80',quantity:7,price:120},m);
  const q=createPosition({providerId:other.id,accountId:b.id,kind:'etf',name:'ETF anderer Broker',isin:'IE00BK5BQT80',quantity:9,price:120},m);
  m.positions.push(p,q);persist(m);
  return {depot:a.id,position:p.id,other:q.id};
 });
 await page.reload();
 const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
 await page.locator(nav+' [data-page="bookings"]').click();
 await page.locator('#openCSVImport').click();
 await page.locator('#csvFile').setInputFiles({name:'flatex-depot.csv',mimeType:'text/csv',buffer:Buffer.from(depotCSV)});
 await page.locator('#csvBrokerAccount').selectOption(ids.depot);
 await page.locator('#csvBackfill').waitFor();
 assert.equal(await page.locator('#saveDialog').isDisabled(),true,'Existing manual holdings may not be doubled');
 await page.locator('#csvBackfill').check();
 await page.waitForFunction(()=>document.querySelector('#csvReview')?.textContent.includes('2 bereit'));
 assert.equal(await page.locator('#saveDialog').isDisabled(),false);
 await page.locator('#saveDialog').click();
 await page.waitForFunction(id=>{
  const model=JSON.parse(localStorage.getItem('foliolab-open-v1')||'{}');
  return model.bookings?.length===2&&model.openingPositions?.find(p=>p.positionId===id)?.quantityExact==='0';
 },ids.position);
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(state.positions.find(p=>p.id===ids.position).quantityExact,'7');
 assert.equal(state.positions.find(p=>p.id===ids.other).quantityExact,'9');
 assert.equal(state.positions.find(p=>p.id===ids.position).costBasisExact,null);
 assert.equal(state.externalCashFlows.length,0);
 assert.equal(state.journalEntries.length,2);
 const audit=await page.evaluate(async()=>{
  const {ledgerQuantityAudit}=await import('/src/transactions.js');
  return ledgerQuantityAudit(JSON.parse(localStorage.getItem('foliolab-open-v1'))).ok;
 });
 assert.equal(audit,true);
 console.log('FLATEX BACKFILL MOBILE: manual opening replaced atomically, quantity preserved, other broker untouched PASS');
}finally{await browser.close();}
