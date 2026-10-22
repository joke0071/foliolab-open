/** Real, read-only browser-origin availability check. No wallet credentials or personal addresses.
 * CI records reachability; public third-party failures do NOT fail deployment.
 * Run: local HTTP server on 4173, then node tests/browser-wallet-live-audit.mjs.
 */
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
const cases=[
  {id:'ethereum:blockscout:address',method:'GET',url:'https://eth.blockscout.com/api/v2/addresses/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',validate:'coin_balance'},
  {id:'ethereum:blockscout:tokens',method:'GET',url:'https://eth.blockscout.com/api/v2/addresses/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/token-balances',validate:'array'},
  {id:'avalanche:explorer',method:'GET',url:'https://cccscan.org/api/v2/addresses/0x000000000000000000000000000000000000dEaD',validate:'coin_balance'},
  {id:'binplorer:tokens',method:'GET',url:'https://api.binplorer.com/getAddressInfo/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?apiKey=freekey',validate:'tokens'},
  {id:'bnb:balance',method:'POST',url:'https://bsc-dataseed.bnbchain.org',body:{jsonrpc:'2.0',id:1,method:'eth_getBalance',params:['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045','latest']},validate:'hex'},
  {id:'bnb:contract:decimals',method:'POST',url:'https://bsc-dataseed.bnbchain.org',body:{jsonrpc:'2.0',id:1,method:'eth_call',params:[{to:'0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',data:'0x313ce567'},'latest']},validate:'hex'},
  {id:'sonic:native',method:'POST',url:'https://rpc.soniclabs.com',body:{jsonrpc:'2.0',id:1,method:'eth_getBalance',params:['0x000000000000000000000000000000000000dEaD','latest']},validate:'hex'},
  {id:'solana:publicnode',method:'POST',url:'https://solana-rpc.publicnode.com',body:{jsonrpc:'2.0',id:1,method:'getBalance',params:['11111111111111111111111111111111',{commitment:'confirmed'}]},validate:'sol'},
  {id:'solana:official',method:'POST',url:'https://api.mainnet.solana.com',body:{jsonrpc:'2.0',id:1,method:'getBalance',params:['11111111111111111111111111111111',{commitment:'confirmed'}]},validate:'sol'},
  {id:'solana:stake-index',method:'POST',url:'https://solana-rpc.publicnode.com',body:{jsonrpc:'2.0',id:1,method:'getProgramAccounts',params:['Stake11111111111111111111111111111111111111',{encoding:'jsonParsed',filters:[{dataSize:200},{memcmp:{offset:44,bytes:'11111111111111111111111111111111'}}]}]},validate:'arrayResult'},
  {id:'cosmos:hub',method:'GET',url:'https://rest.cosmos.directory/cosmoshub/cosmos/base/tendermint/v1beta1/node_info',validate:'node_info'},
  {id:'hedera:mirror',method:'GET',url:'https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/0.0.2',validate:'hbar'},
  {id:'near:account',method:'POST',url:'https://rpc.mainnet.fastnear.com',body:{jsonrpc:'2.0',id:1,method:'query',params:{request_type:'view_account',account_id:'near',finality:'final'}},validate:'near'},
  {id:'ethereum:rocketpool-decimals',method:'POST',url:'https://ethereum-rpc.publicnode.com',body:{jsonrpc:'2.0',id:1,method:'eth_call',params:[{to:'0xae78736Cd615f374D3085123A210448E74Fc6393',data:'0x313ce567'},'latest']},validate:'hex'}
];
try{
  await page.goto('http://127.0.0.1:4173/');
  const results=await page.evaluate(async cases=>{
    const results=[];
    const validate=(data,kind)=>({
      coin_balance:typeof data?.coin_balance==='string'&&/^\d+$/.test(data.coin_balance),
      array:Array.isArray(data),tokens:Array.isArray(data?.tokens),
      hex:/^0x[\da-f]+$/i.test(data?.result||''),
      sol:Number.isSafeInteger(data?.result?.value),
      arrayResult:Array.isArray(data?.result),
      node_info:!!data?.default_node_info||!!data?.application_version,
      hbar:!!data?.account&&Number.isSafeInteger(data?.balance?.balance),
      near:typeof data?.result?.amount==='string'
    })[kind];
    for(let i=0;i<cases.length;i+=4){
      const chunk=cases.slice(i,i+4);
      const out=await Promise.all(chunk.map(async c=>{
        const controller=new AbortController(),start=performance.now(),timer=setTimeout(()=>controller.abort(),8000);
        try{
          const res=await fetch(c.url,{method:c.method,headers:c.body?{'content-type':'application/json'}:{},body:c.body?JSON.stringify(c.body):undefined,signal:controller.signal,cache:'no-store'});
          const raw=await res.text();
          let data;try{data=JSON.parse(raw)}catch{data=null}
          const good=res.ok&&validate(data,c.validate)===true;
          return {id:c.id,ok:good,status:res.status,ms:Math.round(performance.now()-start),detail:good?'valid':data?.error?.message||('unexpected schema '+raw.slice(0,90))};
        }catch(e){return {id:c.id,ok:false,ms:Math.round(performance.now()-start),detail:String(e.name||e).slice(0,90)}}
        finally{clearTimeout(timer)}
      }));
      results.push(...out);
    }
    return results;
  },cases);
  for(const r of results)console.log('WALLET_LIVE_AUDIT '+JSON.stringify(r));
  const successful=results.filter(r=>r.ok);
  console.log('WALLET_LIVE_SUMMARY '+JSON.stringify({checked:results.length,success:successful.length,failed:results.length-successful.length,realBrowser:true,publicKnownAddressesOnly:true}));
}finally{await browser.close()}
