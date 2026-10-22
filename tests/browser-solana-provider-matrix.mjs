import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
const wallet='11111111111111111111111111111111',stake='Stake11111111111111111111111111111111';
const providers=[
 ['PublicNode','https://solana-rpc.publicnode.com'],
 ['Solana Labs old','https://api.mainnet-beta.solana.com'],
 ['Solana Labs','https://api.mainnet.solana.com'],
 ['dRPC','https://solana.drpc.org'],
 ['OnFinality','https://solana.api.onfinality.io/public'],
 ['SubQuery','https://solana.rpc.subquery.network/public'],
 ['Ankr','https://rpc.ankr.com/solana']
];
try{
 await page.goto('http://127.0.0.1:4173/');
 const matrix=await page.evaluate(async ({providers,wallet,stake})=>{
  const tasks=providers.flatMap(([name,url])=>['getBalance','getProgramAccounts'].map(method=>({name,url,method,params:method==='getBalance'?[wallet,{commitment:'confirmed'}]:[stake,{encoding:'jsonParsed',filters:[{dataSize:200},{memcmp:{offset:44,bytes:wallet}}]}]})));
  const results=[];
  for(let n=0;n<tasks.length;n+=5){
   const group=await Promise.all(tasks.slice(n,n+5).map(async q=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000),start=performance.now();
    try{
     const response=await fetch(q.url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:q.method,params:q.params}),signal:controller.signal});
     const body=await response.text();let data=null;
     try{data=JSON.parse(body)}catch{}
     const valid=q.method==='getBalance'?Number.isSafeInteger(data?.result?.value):Array.isArray(data?.result);
     return {name:q.name,method:q.method,ok:response.ok&&valid,status:response.status,ms:Math.round(performance.now()-start),reason:valid?'valid':String(data?.error?.message||body).slice(0,90)};
    }catch(e){return {name:q.name,method:q.method,ok:false,ms:Math.round(performance.now()-start),reason:String(e.name||e)}}
    finally{clearTimeout(timer)}
   }));
   results.push(...group);
  }
  return results;
 },{providers,wallet,stake});
 for(const r of matrix)console.log('SOL_PROVIDER_CHECK '+JSON.stringify(r));
 console.log('SOL_PROVIDER_SUMMARY '+JSON.stringify({providers:providers.length,reads:matrix.filter(x=>x.method==='getBalance'&&x.ok).map(x=>x.name),stakeIndex:matrix.filter(x=>x.method==='getProgramAccounts'&&x.ok).map(x=>x.name)}));
}finally{await browser.close()}
