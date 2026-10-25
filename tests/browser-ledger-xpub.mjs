import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const X='xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V';
const FIRST='bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu';
const empty={chain_stats:{funded_txo_count:0,funded_txo_sum:0,spent_txo_sum:0},mempool_stats:{funded_txo_count:0,funded_txo_sum:0,spent_txo_sum:0}};
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(x=>{
  const init=async()=>{
   const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
   const m=blankModel(),p=createProvider({name:'Test Ledger'});m.providers.push(p);
   const a=createAccount({name:'Kryptowallet',type:'wallet',providerId:p.id},m);m.accounts.push(a);
   m.positions.push(createPosition({kind:'crypto',name:'Bitcoin',symbol:'BTC',providerId:p.id,accountId:a.id,quantity:'0.12620376',price:100,coinId:'',wallet:{enabled:true,chain:'btc-hd',address:x}},m));
   persist(m);
  };
  return init();
 },X);
 await page.reload();
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('[data-action="edit-position"]').first().click();
 await page.locator('#walletHdType').waitFor({state:'visible'});
 assert.equal(await page.locator('#walletHdType').inputValue(),'auto','Older backups select safe automatic detection');
 assert.match(await page.locator('#walletGroup').innerText(),/Native SegWit/);
 await page.locator('#closeDialog').click();
 await page.locator('#addWallet').click();
 await page.locator('#scanNetwork').selectOption('btc-hd');
 assert.equal(await page.locator('#scanHdField').isVisible(),true);
 assert.equal(await page.locator('#hdPrivacyHint').isVisible(),true);
 await page.locator('#scanHdType').selectOption('p2wpkh');
 page.once('dialog',d=>d.accept()); // Discard changed Wallet import settings.
 await page.locator('#closeDialog').click();
 let calls=0;
 await page.route('https://blockstream.info/api/address/**',route=>{
  calls++;
  const data=route.request().url().endsWith(FIRST)?
    {chain_stats:{funded_txo_count:1,funded_txo_sum:12620376,spent_txo_sum:0},mempool_stats:empty.mempool_stats}:empty;
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.locator('#refreshAll').click();
 await page.waitForFunction(()=>document.querySelector('#priceInfo').textContent.includes('Datenupdates'),null,{timeout:70000});
 const position=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).positions[0]);
 assert.equal(position.quantityExact,'0.12620376');
 assert.equal(position.wallet.addressType,'p2wpkh');
 assert.ok(calls>=40,'Full 20-address gap on receive/change chains was scanned');
 console.log('LEDGER XPUB BROWSER: legacy backup auto-detects native SegWit, preserves precise BTC and persists format PASS');
}finally{await browser.close();}
