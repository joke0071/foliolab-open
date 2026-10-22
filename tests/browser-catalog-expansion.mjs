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
 assert.equal(await page.locator('#wizardFundImport').count(),0);
 assert.equal(await page.locator('a:has-text("OeKB")').count(),0);
 assert.equal(await page.locator('#wizardCatalogTools').count(),1);
 assert.equal(await page.locator('#wizardCatalogTools').getAttribute('open'),null);
 assert.equal(await page.locator('a:has-text("Xetra-Downloadseite")').isVisible(),false);
 await page.locator('#wizardCatalogTools summary').click();
 const xetra=page.locator('#wizardCatalogTools a').first();
 assert.equal(await xetra.isVisible(),true);
 assert.match(await xetra.getAttribute('href'),/xetra-downloads/);
 assert.equal(await page.locator('#wizardCatalogTools a[href$="nasdaqlisted.txt"]').count(),1);
 assert.equal(await page.locator('#wizardCatalogTools a[href$="otherlisted.txt"]').count(),1);
 assert.equal(await page.locator('#wizardDirectoryImport').isVisible(),true);
 await page.locator('#wizardCatalogTools summary').click();
 assert.equal(await xetra.isVisible(),false);
 const appState=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1'))||{positions:[]});
 assert.equal(appState.positions.length,0,'Searching/importing catalogs never creates holdings');
 console.log('CATALOG BROWSER: live Top100, extended crypto search, local OeKB-style CSV, explicit currency and no portfolio mutation PASS');
}finally{await browser.close();}
