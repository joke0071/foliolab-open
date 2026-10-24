import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:790}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="positions"]').click();
 const opener=page.locator('#addWallet');
 await opener.click();
 await page.locator('#walletStakingOptions > summary').click();
 assert.match(await page.locator('#walletStakingOptions > summary').innerText(),/Staking-Unterstützung prüfen/);
 assert.match(await page.locator('#walletStakingOptions').innerText(),/filtert den Scan nicht/);
 assert.equal(await page.locator('#scanAsset').getAttribute('aria-describedby'),'scanAssetInfo');
 assert.equal(await page.locator('#scanAssetInfo').getAttribute('role'),'status');
 assert.equal(await page.locator('#scanWalletStatus').innerText(),'Noch keine Suche gestartet.');
 await page.locator('#scanAddress').fill('0x'+'a'.repeat(40));
 await page.locator('#scanAsset').selectOption('11'); // Cosmos: network-only support, partial staking.
 assert.equal(await page.locator('#scanNetwork').inputValue(),'cosmos');
 assert.equal(await page.locator('#scanAddress').inputValue(),'','An incompatible stale address is cleared');
 assert.match(await page.locator('#scanAssetInfo').innerText(),/alle vom Netzwerk unterstützten Guthaben/);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/Netzwerk automatisch/);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/Adresse wurde geleert/);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/Unbonding/);
 assert.equal(await page.locator('#scanWalletButton').isDisabled(),false);
 assert.equal(await page.locator('#scanWalletStatus').innerText(),'Noch keine Suche gestartet.','No premature scan-status warning');
 await page.locator('#scanAddress').fill('cosmos1'+('b'.repeat(38)));
 await page.locator('#scanNetwork').selectOption('sol');
 assert.equal(await page.locator('#scanAsset').inputValue(),'','Manual network change clears stale staking selection');
 assert.equal(await page.locator('#scanAddress').inputValue(),'','Manual network change clears incompatible address');
 assert.match(await page.locator('#scanAssetInfo').innerText(),/Staking-Vorauswahl zurückgesetzt/);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/Adresse wurde aus Sicherheitsgründen geleert/);
 await page.locator('#scanAsset').selectOption('13'); // Unsupported Sui staking
 assert.equal(await page.locator('#scanWalletButton').isDisabled(),true);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/Kein automatischer Scan/);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/Position hinzufügen/);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/gRPC\/GraphQL/);
 await page.locator('#scanAsset').selectOption('23'); // Fantom -> Sonic migration
 assert.equal(await page.locator('#scanWalletButton').isDisabled(),true);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/Migration/);
 await page.locator('#scanAsset').selectOption('17'); // Hedera
 assert.equal(await page.locator('#scanNetwork').inputValue(),'hedera');
 assert.equal(await page.locator('#scanWalletButton').isDisabled(),false);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/nicht zusätzlich/);
 // All 50 reference assets must match their documented modes; none may appear
 // to have a targeted scanner when only a general network scanner is known.
 const catalog=await page.evaluate(async()=>{
  const {STAKING_ASSETS}=await import('/src/staking-catalog.js');
  return STAKING_ASSETS.map(a=>({id:String(a.id),supported:Boolean(a.scannerNetwork),network:a.scannerNetwork,mode:a.mode}));
 });
 assert.equal(catalog.length,50);
 for(const asset of catalog){
  await page.locator('#scanAsset').selectOption(asset.id);
  assert.equal(await page.locator('#scanWalletButton').isDisabled(),!asset.supported,
   'Scan button must reflect actual availability for asset '+asset.id);
  if(asset.supported){
   assert.equal(await page.locator('#scanNetwork').inputValue(),asset.network);
   assert.match(await page.locator('#scanAssetInfo').innerText(),/alle vom Netzwerk unterstützten Guthaben/);
  }else{
   assert.match(await page.locator('#scanAssetInfo').innerText(),/Kein automatischer Scan/);
  }
 }
 await page.locator('#scanAsset').selectOption('');
 assert.equal(await page.locator('#scanWalletButton').isDisabled(),false);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/keine Auswahl eines einzelnen Assets/);
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:720});
  const box=await page.locator('#editDialog').evaluate(el=>{
   const d=el.getBoundingClientRect(),f=el.querySelector('.dialog-footer').getBoundingClientRect();
   return {left:d.left,right:d.right,top:d.top,bottom:d.bottom,footerBottom:f.bottom,scroll:document.documentElement.scrollWidth};
  });
  assert.ok(box.left>=-1&&box.right<=width+1&&box.top>=-1&&box.bottom<=721&&box.footerBottom<=721,
    'Staking dialog fits '+width+': '+JSON.stringify(box));
  assert.ok(box.scroll<=width+1,'No horizontal overflow '+width);
 }
 const before=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 page.once('dialog',d=>d.dismiss());
 await page.locator('#cancelDialog').click();
 assert.equal(await page.locator('#editDialog').isVisible(),true,'Changed staking selection requires discard confirmation');
 page.once('dialog',d=>d.accept());
 await page.locator('#cancelDialog').click();
 assert.equal(await page.locator('#editDialog').isVisible(),false);
 assert.equal(await opener.evaluate(el=>document.activeElement===el),true);
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),before,'Configuration preview cannot mutate portfolio');
 console.log('STAKING DIALOG SCOPE: 50 capabilities, manual/legacy, automatic and manual network resets, a11y, 7 widths PASS');
}finally{await browser.close();}
