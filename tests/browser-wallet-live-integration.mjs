/** Exercise actual FolioLab discovery logic against publicly documented addresses in a real browser.
 * Privacy: no user addresses, no storage writes, no transaction signing, and no keys.
 */
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
try{
 await page.goto('http://127.0.0.1:4173/');
 const results=await page.evaluate(async()=>{
  const {discoverWallet,walletBalanceExact}=await import('/src/market.js');
  const cases=[
   {name:'Ethereum public address',network:'1',address:'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'},
   {name:'BNB public address',network:'56',address:'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'},
   {name:'Solana system program',network:'sol',address:'11111111111111111111111111111111'},
   {name:'Avalanche burn address',network:'43114',address:'0x000000000000000000000000000000000000dEaD'}
  ];
  const output=[];
  for(const c of cases){
   const start=performance.now();
   try{
    const assets=await discoverWallet(c.network,c.address,{});
    const correctlyTyped=assets.every(a=>typeof a.quantityExact==='string'&&Number.isFinite(a.quantity)&&a.quantity>=0);
    output.push({name:c.name,ok:correctlyTyped,count:assets.length,partial:Boolean(assets.partial),warning:(assets.warning||'').slice(0,190),ms:Math.round(performance.now()-start)});
   }catch(e){output.push({name:c.name,ok:false,reason:String(e.message||e).slice(0,190),ms:Math.round(performance.now()-start)})}
  }
  return output;
 });
 for(const item of results)console.log('WALLET_INTEGRATION_AUDIT '+JSON.stringify(item));
 console.log('WALLET_INTEGRATION_SUMMARY '+JSON.stringify({attempted:results.length,successful:results.filter(x=>x.ok).length,allReadOnly:true}));
}finally{await browser.close()}
