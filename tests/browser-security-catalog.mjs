import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#addWizard').click();
 const rows=['Market: XETR','Date Last Update: 22.10.2026','Product Status;Instrument Status;Instrument;ISIN;Mnemonic;Currency;Instrument Type'];
 rows.push('Active;Active;Vanguard FTSE All-World UCITS ETF;IE00BK5BQT80;VWCE;EUR;ETF');
 for(let i=0;i<6000;i++)rows.push('Active;Active;Example European Stock '+String(i).padStart(5,'0')+';DE'+String(1000000000+i)+';ST'+i+';EUR;Shares');
 await page.locator('#wizardDirectoryFile').setInputFiles({name:'t7-xetr-allTradableInstruments.csv',mimeType:'text/csv',buffer:Buffer.from(rows.join('\n'))});
 await page.locator('#wizardQuery').fill('Example European Stock 01234');
 await page.locator('#wizardKind').selectOption('stock');
 await page.locator('#wizardQuery').fill('Example European Stock 01234');
 await page.locator('#wizardMatches [data-wizard-pick="0"]').waitFor();
 assert.match(await page.locator('#wizardMatches').innerText(),/Example European Stock 01234/);
 await page.locator('#wizardMatches [data-wizard-pick="0"]').click();
 assert.equal(await page.locator('#wizardCurrency').inputValue(),'EUR');
 assert.equal(await page.locator('#wizardSymbol').inputValue(),'ST1234');
 await page.locator('#wizardClose').click();
 await page.reload();
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#addWizard').click();
 await page.locator('#wizardKind').selectOption('stock');
 await page.locator('#wizardQuery').fill('ST5678');
 await page.locator('#wizardMatches [data-wizard-pick="0"]').waitFor();
 assert.match(await page.locator('#wizardMatches').innerText(),/Example European Stock 05678/);
 // Verify another provider can be added without silently removing the Xetra catalogue.
 await page.locator('#wizardDirectoryFile').setInputFiles({name:'nasdaqlisted.txt',mimeType:'text/plain',
 buffer:Buffer.from('Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares\n'+
  'AAPL|Apple Inc. Common Stock|Q|N|N|100|N|N\nQQQM|Invesco Nasdaq 100 ETF|Q|N|N|100|Y|N\n')});
 await page.locator('#wizardQuery').fill('AAPL');
 await page.locator('#wizardMatches [data-wizard-pick="0"]').waitFor();
 assert.match(await page.locator('#wizardMatches').innerText(),/Apple Inc/);
 await page.locator('#wizardMatches [data-wizard-pick="0"]').click();
 assert.equal(await page.locator('#wizardCurrency').inputValue(),'','No imaginary currency from Nasdaq directory');
 await page.locator('#wizardClose').click();
 await page.reload();
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#addWizard').click();
 await page.locator('#wizardKind').selectOption('stock');
 await page.locator('#wizardQuery').fill('ST5678');
 await page.locator('#wizardMatches [data-wizard-pick="0"]').waitFor();
 assert.match(await page.locator('#wizardMatches').innerText(),/Stock 05678/);
 const catalogs=await page.evaluate(()=>new Promise((resolve,reject)=>{
  const req=indexedDB.open('foliolab-open-reference-catalog-v1');
  req.onsuccess=()=>{
   const db=req.result,g=db.transaction('catalogs').objectStore('catalogs').getAll();
   g.onsuccess=()=>{resolve(g.result.filter(c=>c.format==='security-directory-v1').map(c=>c.entries.length));db.close();};
   g.onerror=()=>reject(g.error);
  };req.onerror=()=>reject(req.error);
 }));
 assert.deepEqual(catalogs.sort((a,b)=>a-b),[2,6001]);
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1'))||{positions:[]});
 assert.equal(state.positions.length,0);
 for(const width of [320,390,430,768,1024,1280,1440]){
  await page.setViewportSize({width,height:830});
  const over=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(over<=1,'Horizontal page overflow at '+width+': '+over);
 }
 console.log('SECURITY CATALOG: 6001 Xetra rows, Nasdaq TXT, currency provenance, persistence and 320-1440px PASS');
}finally{await browser.close();}
