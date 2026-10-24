export const A='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',B='1BitcoinEaterAddressDontSendf59kuE';
export const H=n=>n.toString(16).padStart(64,'0');
export const wallets=[{chain:'btc',address:A,accountId:'a'}];
export const tx=(n,value=100)=>({txid:H(n),fee:0,vin:[{txid:H(999),vout:n,prevout:{scriptpubkey_address:B,value}}],vout:[{scriptpubkey_address:A,value}],status:{confirmed:true,block_height:10,block_hash:H(10),block_time:1700000000}});
export function provider(txs,{mempool=[],fail=null,tipChange=false,override=null}={}){
 let tipCalls=0;const calls=[];
 const fetcher=async(url,options={})=>{
  calls.push(url);if(options.method!=='GET')throw Error('not read only');
  const path=new URL(url).pathname.replace('/api','');let data;
  if(fail&&path.includes(fail.path))return {ok:false,status:fail.status,headers:new Headers()};
  if(path==='/blocks/tip/hash')data=H(tipChange&&tipCalls++?11:10);
  else if(path.startsWith('/tx/'))data=txs.find(t=>t.txid===path.split('/').at(-1));
  else if(path.startsWith('/block/'))data={id:path.split('/').at(-1),height:10};
  else if(path.startsWith('/block-height/'))data=H(10);
  else if(path.endsWith('/txs/mempool'))data=mempool;
  else if(path.includes('/txs/chain')){const last=path.split('/chain/')[1];const start=last?txs.findIndex(t=>t.txid===last)+1:0;data=txs.slice(start,start+25);}
  else if(path.startsWith('/address/')){
   const address=decodeURIComponent(path.split('/')[2]);
   const sum=(list,key)=>list.reduce((s,t)=>s+(key==='funded'?t.vout.filter(v=>v.scriptpubkey_address===address).reduce((a,v)=>a+v.value,0):t.vin.filter(v=>v.prevout?.scriptpubkey_address===address).reduce((a,v)=>a+v.prevout.value,0)),0);
   const stats=list=>({tx_count:list.filter(t=>t.vout.some(v=>v.scriptpubkey_address===address)||t.vin.some(v=>v.prevout?.scriptpubkey_address===address)).length,funded_txo_count:sum(list,'funded')?1:0,funded_txo_sum:sum(list,'funded'),spent_txo_sum:sum(list,'spent')});
   data={chain_stats:stats(txs),mempool_stats:stats(mempool)};
  }else throw Error('unexpected '+path);
  if(override)data=override(path,data);
  return {ok:true,status:200,json:async()=>structuredClone(data),text:async()=>String(data)};
 };return {fetcher,calls};
}
