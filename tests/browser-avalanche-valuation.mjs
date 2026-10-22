import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
const addr='0x'+'a'.repeat(40);
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(address=>{
  return import('/src/model.js').then(({blankModel,createProvider,createAccount,createPosition,persist})=>{
   const m=blankModel(),provider=createProvider({name:'Testbank'});m.providers.push(provider);
   const account=createAccount({providerId:provider.id,name:'Depot',type:'wallet'},m);m.accounts.push(account);
   m.positions.push(createPosition({providerId:provider.id,accountId:account.id,name:'AVAX',kind:'crypto',price:10,quantity:5,
     wallet:{enabled:true,chain:'evm',chainId:43114,address},coinId:'',priceStatus:'Preis aus gesichertem Stichtagswert abgeleitet'},m));
   persist(m);
  });
 },addr);
 await page.reload();
 await page.locator('#totalHint').waitFor();
 const initial=await page.locator('#totalHint').innerText();
 assert.match(initial,/1 aus Stichtag abgeleitet/);
 assert.doesNotMatch(initial,/veraltet/);
 await page.route('https://cccscan.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({coin_balance:null})}));
 await page.route('https://api.avax.network/**',r=>{
  const payload=r.request().postDataJSON();
  assert.equal(payload.method,'eth_getBalance');
  assert.equal(payload.params[0],addr);
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:1,result:'0xde0b6b3a7640000'})});
 });
 await page.locator('#mobileNav [data-page="positions"]').click();
 await page.locator('#refreshAll').click();
 await page.waitForFunction(()=>document.querySelector('#priceInfo').textContent.includes('Datenupdates'));
 const balance=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).positions[0].quantityExact);
 assert.equal(balance,'1');
 assert.equal(await page.locator('#priceInfo').evaluate(el=>el.classList.contains('refresh-warning')),false);
 console.log('AVALANCHE/VALUATION browser: historical derived price label and explorer to official RPC fallback PASS');
}finally{await browser.close();}
