import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
try{
 await page.goto('http://127.0.0.1:4173/');
 const checks=[
  {name:'Frankfurter FX',url:'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR'},
   {name:'Frankfurter historical FX',url:'https://api.frankfurter.dev/v1/2026-10-20?base=USD&symbols=EUR'},
  {name:'Blockstream Bitcoin',url:'https://blockstream.info/api/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'},
  {name:'Blockscout Ethereum',url:'https://eth.blockscout.com/api/v2/addresses/0x000000000000000000000000000000000000dEaD'},
  {name:'Blockscout ERC20 token inventory',url:'https://eth.blockscout.com/api/v2/addresses/0x000000000000000000000000000000000000dEaD/token-balances'},
  {name:'OpenFIGI search',url:'https://api.openfigi.com/v3/search',method:'POST',body:JSON.stringify({query:'Vanguard FTSE All-World UCITS ETF'})},
  {name:'Solana public RPC',url:'https://api.mainnet-beta.solana.com',method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getBalance',params:['11111111111111111111111111111111']})},
  {name:'XRPL public CORS JSON-RPC',url:'https://xrplcluster.com',method:'POST',body:JSON.stringify({method:'account_info',params:[{account:'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',ledger_index:'validated'}]})},
  {name:'Avalanche C-Chain Blockscout',url:'https://cccscan.org/api/v2/addresses/0x000000000000000000000000000000000000dEaD'},
  {name:'Avalanche official C-Chain RPC balance',url:'https://api.avax.network/ext/bc/C/rpc',method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getBalance',params:['0x000000000000000000000000000000000000dEaD','latest']})},
  {name:'BNB Blockscout candidate',url:'https://bsc.blockscout.com/api/v2/addresses/0x000000000000000000000000000000000000dEaD'},
  {name:'Solana PublicNode RPC',url:'https://solana-rpc.publicnode.com',method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getBalance',params:['11111111111111111111111111111111']})},
  {name:'Solana PublicNode SPL account scan',url:'https://solana-rpc.publicnode.com',method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getTokenAccountsByOwner',params:['11111111111111111111111111111111',{programId:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'},{encoding:'jsonParsed'}]})},
  {name:'Solana dRPC',url:'https://solana.drpc.org',method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getBalance',params:['11111111111111111111111111111111']})},
  {name:'Solana OnFinality',url:'https://solana.api.onfinality.io/public',method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getBalance',params:['11111111111111111111111111111111']})},
  {name:'Solana SubQuery',url:'https://solana.rpc.subquery.network/public',method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getBalance',params:['11111111111111111111111111111111']})}
 ];
 const results=await page.evaluate(async checks=>Promise.all(checks.map(async q=>{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
  try{const res=await fetch(q.url,{method:q.method||'GET',headers:q.body?{'content-type':'application/json'}:{},body:q.body,signal:controller.signal});
    const body=await res.text();return {api:q.name,status:res.status,cors:'success',data:body.slice(0,110)};}
  catch(err){return {api:q.name,cors:'blocked/unavailable',error:String(err).slice(0,150)}}
  finally{clearTimeout(timer)}
 })),checks);
 for(const r of results)console.log('LIVE-PROBE '+JSON.stringify(r));
 // External APIs are inherently transient; a failed probe is reported, never misrepresented as verified.
}finally{await browser.close()}
