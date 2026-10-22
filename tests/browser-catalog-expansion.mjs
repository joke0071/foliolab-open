import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.route('https://api.coingecko.com/api/v3/coins/markets**',route=>{
  const coins=Array.from({length:100},(_,i)=>({id:'synthetic-'+i,symbol:'SC'+i,name:'Synthetic Coin '+i,market_cap_rank:i+1}));
  route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(coins)});
 });
 await page.route('https://api.coingecko.com/api/v3/coins/list**',route=>
  route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([
    {id:'synthetic-extended',symbol:'SX',name:'Synthetic Extended Token'},
    {id:'bitcoin',symbol:'BTC',name:'Bitcoin'}
  ])})
 );
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#addWizard').click();
 await page.locator('#wizardKind').selectOption('crypto');
 await page.locator('#wizardMatches [data-wizard-pick="99"]').waitFor();
 assert.equal(await page.locator('#wizardMatches [data-wizard-pick]').count(),100);
 assert.match(await page.locator('#wizardMatches').innerText(),/Synthetic Coin 99/);
 await page.locator('#wizardQuery').fill('Synthetic Extended');
 await page.locator('#wizardMatches [data-wizard-pick="0"]').waitFor();
 assert.match(await page.locator('#wizardMatches').innerText(),/Synthetic Extended Token/);
 await page.locator('#wizardMatches [data-wizard-pick="0"]').click();
 assert.equal(await page.locator('#wizardCoinId').inputValue(),'synthetic-extended');
 await page.locator('#wizardKind').selectOption('etf');
 await page.locator('#wizardFundFile').setInputFiles({
  name:'Liste_KESt-Meldefonds.csv',mimeType:'text/csv',
  buffer:Buffer.from('ISIN;Fondsbezeichnung\r\nIE00BK5BQT80;Vanguard FTSE All-World UCITS ETF\r\nIE00BL25JL35;Xtrackers MSCI World Quality UCITS ETF\r\nIE0000012345;Synthetic Austrian ETF\r\n')
 });
 await page.locator('#wizardQuery').fill('Synthetic Austrian');
 await page.locator('#wizardMatches [data-wizard-pick="0"]').waitFor();
 await page.locator('#wizardMatches [data-wizard-pick="0"]').click();
 assert.equal(await page.locator('#wizardIsin').inputValue(),'IE0000012345');
 assert.equal(await page.locator('#wizardCurrency').inputValue(),'','Imported fund list must not guess listing currency');
 const count=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-fund-catalog-v1')).entries.length);
 assert.equal(count,3);
 const appState=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1'))||{positions:[]});
 assert.equal(appState.positions.length,0,'Searching/importing catalogs never creates holdings');
 console.log('CATALOG BROWSER: live Top100, extended crypto search, local OeKB-style CSV, explicit currency and no portfolio mutation PASS');
}finally{await browser.close();}
