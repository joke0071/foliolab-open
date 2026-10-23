import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#addWallet').click();
 assert.equal(await page.locator('#walletStakingOptions').getAttribute('open'),null,'Optional staking details begin collapsed');
 await page.locator('#walletStakingOptions').evaluate(el=>el.open=true);
 const options=await page.locator('#scanAsset option').count();
 assert.equal(options,51,'50 reference assets plus optional empty selection');
 await page.locator('#scanAsset').selectOption('11');
 assert.equal(await page.locator('#scanNetwork').inputValue(),'cosmos');
 assert.match(await page.locator('#scanAssetInfo').innerText(),/Unbonding/);
 await page.locator('#scanAsset').selectOption('13'); // Sui — old public JSON-RPC is deprecated
 assert.equal(await page.locator('#scanWalletButton').isDisabled(),true);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/gRPC\/GraphQL/);
 await page.locator('#scanAsset').selectOption('17'); // Hedera
 assert.equal(await page.locator('#scanNetwork').inputValue(),'hedera');
 assert.equal(await page.locator('#scanWalletButton').isDisabled(),false);
 assert.match(await page.locator('#scanAssetInfo').innerText(),/nicht zusätzlich/);
 await page.locator('#scanAsset').selectOption('');
 assert.equal(await page.locator('#scanWalletButton').isDisabled(),false);
 console.log('Browser staking-capability guidance passed');
}finally{await browser.close();}
