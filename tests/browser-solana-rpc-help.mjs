import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844}});
const calls=[];
await page.route(/https:\/\/rpc-(ok|limited)\.example\.test\//,async route=>{
 const url=route.request().url(),req=JSON.parse(route.request().postData()||'{}');
 calls.push({url,method:req.method});
 if(req.method==='getBalance')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:1,result:{value:0}})});
 if(req.method==='getProgramAccounts'){
  if(url.includes('limited'))return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'No index permissions'})});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:1,result:[]})});
 }
 throw Error('Unapproved RPC '+req.method);
});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="more"]').click();
 await page.locator('#blockchainSettings').evaluate(el=>el.open=true);
 const setup=page.locator('#solanaRpcSetup');
 await setup.locator(':scope > summary').click();
 assert.match(await setup.innerText(),/Helius/);
 assert.match(await setup.innerText(),/Mainnet-HTTPS-RPC-Adresse/);
 assert.match(await setup.innerText(),/nativ gestakte SOL/);
 assert.equal(await setup.locator('a[href="https://dashboard.helius.dev/"]').count(),0,'No external API-provider link in Mehr');
 assert.equal(await page.locator('#solanaRpc').getAttribute('type'),'password','RPC URL with API key is masked');
 await page.locator('#solanaRpc').fill('https://rpc-ok.example.test/solana?api-key=dummy-test');
 await page.locator('#testSolanaRpc').click();
 await page.locator('#solanaRpcTestStatus').getByText(/Verbindung erfolgreich/).waitFor();
 assert.match(await page.locator('#solanaRpcTestStatus').innerText(),/native Solana-Staking-Abfragen/);
 assert.ok(calls.some(c=>c.method==='getBalance'));
 assert.ok(calls.some(c=>c.method==='getProgramAccounts'));
 assert.doesNotMatch(await page.locator('#solanaRpcTestStatus').innerText(),/dummy-test/);
 const settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1'))?.settings?.solanaRpc);
 assert.match(settings,/rpc-ok/);
 await page.locator('#solanaRpc').fill('https://rpc-limited.example.test/solana?api-key=another-test');
 await page.locator('#testSolanaRpc').click();
 await page.locator('#solanaRpcTestStatus').getByText(/Staking-Abfrage ist blockiert/).waitFor();
 assert.doesNotMatch(await page.locator('#solanaRpcTestStatus').innerText(),/another-test/);
 const size=await page.evaluate(()=>document.documentElement.scrollWidth);
 assert.ok(size<=391,'No horizontal overflow at 390px: '+size);
 console.log('SOLANA RPC ONBOARDING: quick steps, saved URL, permission check, no key disclosure, mobile layout PASS');
}finally{await browser.close()}
