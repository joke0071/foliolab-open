export const A='11111111111111111111111111111111',B='22222222222222222222222222222222',M='33333333333333333333333333333333',ATA='44444444444444444444444444444444',HASH='55555555555555555555555555555555';
export const SIG=n=>String(n).repeat(64);
export const wallets=[{accountId:'sol-wallet',address:A}];
export function transaction(n=1,{failed=false,tokens=false,version0=false,closed=false,unknownOwner=false}={}){
 const tx={slot:10,blockTime:1700000000,version:version0?0:'legacy',txIndex:n-1,blockhash:HASH,transaction:{signatures:[SIG(n)],message:{accountKeys:version0?[A,B]:[A,B,ATA]}},meta:{err:failed?{InstructionError:[0,'fixture']}:null,fee:5,preBalances:[100,0,0],postBalances:[failed?95:85,failed?0:10,0],preTokenBalances:[],postTokenBalances:[],...(version0?{loadedAddresses:{writable:[ATA],readonly:[]}}:{})}};
 if(tokens){const b={accountIndex:2,mint:M,...(unknownOwner?{}:{owner:A}),programId:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',uiTokenAmount:{amount:'1000000000000000000000000000',decimals:24}};tx.meta.preTokenBalances=[b];tx.meta.postTokenBalances=closed?[]:[{...b,uiTokenAmount:{amount:'1000000000000000000000000007',decimals:24}}];}
 return tx;
}
export function provider({transactions=[transaction()],nullTx=false,status=null}={}){
 const calls=[];let failure=false;
 const fetcher=async(url,opts)=>{
  const {method,params}=JSON.parse(opts.body);calls.push({method,params});
  if(status&&!failure){failure=true;return {ok:false,status,headers:new Headers({'Retry-After':'0'})};}
  let result;
  if(method==='getGenesisHash')result='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';
  else if(method==='getSlot')result=10;
  else if(method==='getBlock')result={blockhash:HASH,signatures:transactions.map(t=>t.transaction.signatures[0])};
  else if(method==='getTokenAccountsByOwner')result={context:{slot:10},value:[]};
  else if(method==='getBalance')result={context:{slot:10},value:transactions.at(-1)?.meta.postBalances[0]??0};
  else if(method==='getTransaction'){result=nullTx?null:transactions.find(t=>t.transaction.signatures[0]===params[0]);if(result){result=structuredClone(result);delete result.blockhash;delete result.txIndex;}}
  else if(method==='getSignaturesForAddress'){const all=params[0]===A?transactions.map(t=>({signature:t.transaction.signatures[0],slot:10,confirmationStatus:'finalized',err:t.meta.err})):[];const before=params[1].before,start=before?all.findIndex(r=>r.signature===before)+1:0;result=all.slice(start,start+params[1].limit);}
  else throw Error('unsupported fixture '+method);
  return {ok:true,status:200,json:async()=>({jsonrpc:'2.0',id:1,result})};
 };return {fetcher,calls};
}
