import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844}});
const ISIN='IE00BK5BQT80';
const depotCSV=[
 'Buchtag;Valuta;ISIN;Bezeichnung;Nominal;Buchungsinformationen;TA-Nr.;Kurs;Depot',
 '20.10.2026;21.10.2026;'+ISIN+';ETF;2;ORDER Kauf;4711;100,25;123'
].join('\n');
const accountCSV=[
 'Buchungstag;Valuta;Zahlungspfl.;Buchungsinformationen;TA.Nr.;Betrag',
 '20.10.2026;21.10.2026;AT123;ORDER Kauf '+ISIN+';4711;-201,50'
].join('\n');
const files=[
 {name:'depot.csv',mimeType:'text/csv',buffer:Buffer.from(depotCSV)},
 {name:'konto.csv',mimeType:'text/csv',buffer:Buffer.from(accountCSV)}
];
try{
 await page.goto('http://127.0.0.1:4173/');
 const ids=await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel();
  const f=createProvider({name:'Flatex Österreich'}),o=createProvider({name:'Anderer Broker'});
  m.providers.push(f,o);
  const fdep=createAccount({providerId:f.id,name:'Wertpapierdepot',type:'securities'},m);
  const odep=createAccount({providerId:o.id,name:'Anderes Depot',type:'securities'},m);
  m.accounts.push(fdep,odep);
  const p=createPosition({providerId:f.id,accountId:fdep.id,kind:'etf',name:'VWCE',isin:'IE00BK5BQT80',quantity:0,price:100},m);
  const q=createPosition({providerId:o.id,accountId:odep.id,kind:'etf',name:'VWCE anderer Broker',isin:'IE00BK5BQT80',quantity:0,price:100},m);
  m.positions.push(p,q);persist(m);
  return {fdep:fdep.id,p:p.id,q:q.id};
 });
 await page.reload();
 const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
 await page.locator(nav+' [data-page="bookings"]').click();
 await page.locator('#openCSVImport').click();
 await page.locator('#csvFile').setInputFiles(files);
 await page.locator('#csvBrokerAccount').waitFor();
 await page.locator('#csvBrokerAccount').selectOption(ids.fdep);
 await page.locator('#csvBrokerConfirm').check();
 await page.waitForFunction(()=>document.querySelector('#csvReview')?.textContent.includes('1 bereit'));
 assert.equal(await page.locator('#saveDialog').isDisabled(),false);
 await page.locator('#saveDialog').click();
 await page.waitForFunction(id=>{const m=JSON.parse(localStorage.getItem('foliolab-open-v1')||'{}');return m.positions?.find(x=>x.id===id)?.quantityExact==='2';},ids.p);
 const m=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.equal(m.positions.find(x=>x.id===ids.p).quantityExact,'2');
 assert.equal(m.positions.find(x=>x.id===ids.q).quantityExact,'0');
 assert.equal(m.bookings.length,1);
 assert.equal(m.externalCashFlows.length,0);
 await page.locator('#openCSVImport').click();
 await page.locator('#csvFile').setInputFiles(files);
 await page.locator('#csvBrokerAccount').selectOption(ids.fdep);
 await page.locator('#csvBrokerConfirm').check();
 await page.waitForFunction(()=>document.querySelector('#csvReview')?.textContent.includes('1 bereits vorhanden'));
 assert.equal(await page.locator('#saveDialog').isDisabled(),true);
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#cancelDialog').click();
 console.log('Flatex mobile browser: custody scope, statement quarantine, atomic import, repeated import PASS');
}finally{await browser.close();}
