export const A='0x'+'1'.repeat(40),B='0x'+'2'.repeat(40),C='0x'+'3'.repeat(40),T='0x'+'4'.repeat(40);
export const H=n=>'0x'+n.toString(16).padStart(64,'0');
export const wallets=[{accountId:'a',address:A}];
export const tokens=[{contract:T,decimals:18,balanceModel:'transfer'}];
export const now='2026-10-24T12:00:00.000Z';
export const block={hash:H(10),number:'0xa',timestamp:'0x6553f100'};
export function transaction(n=1,{from=B,to=A,value='100',success=true}={}){
 const hash=H(n),rpc={hash,from,to,value:'0x'+BigInt(value).toString(16),input:'0x',blockHash:block.hash,blockNumber:block.number,gasPrice:'0x2'};
 const receipt={transactionHash:hash,blockHash:block.hash,blockNumber:block.number,transactionIndex:'0x0',status:success?'0x1':'0x0',gasUsed:'0x3',effectiveGasPrice:'0x2',logs:[]};
 const tx={hash,from:{hash:from,is_contract:false},to:{hash:to,is_contract:false},value,block_number:10,fee:{type:'actual',value:'6'},status:success?'ok':'error',token_transfers:[]};
 return {tx,evidence:{receipt,transaction:rpc,block}};
}
export function transfer(n=0,{from=B,to=A,value='7',contract=T}={}){
 const topics=['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef','0x'+from.slice(2).padStart(64,'0'),'0x'+to.slice(2).padStart(64,'0')];
 return {item:{transaction_hash:H(1),block_hash:block.hash,log_index:n,from:{hash:from},to:{hash:to},token:{address_hash:contract,decimals:'18',type:'ERC-20'},token_type:'ERC-20',total:{decimals:'18',value}},log:{transactionHash:H(1),blockHash:block.hash,logIndex:'0x'+n.toString(16),address:contract,topics,data:'0x'+BigInt(value).toString(16).padStart(64,'0'),removed:false}};
}
export function fixture(){const t=transaction(),l=transfer();t.evidence.receipt.logs.push(l.log);return {wallets:structuredClone(wallets),tokens:structuredClone(tokens),transactions:[t.tx],transfers:[l.item],internals:[],evidence:{[H(1)]:t.evidence},observedAt:now};}
export function provider({pages=false,status=null,reorg=false,mismatch=false,internalsFail=false}={}){
 const f=fixture(),calls=[];let failed=false;
 const fetcher=async(url,options={})=>{
  calls.push({url,method:options.method});let data;
  if(options.method==='POST'){
   const {method,params}=JSON.parse(options.body);let result;
   if(method==='eth_chainId')result='0x1';
   else if(method==='eth_getBlockByNumber')result={...block,...(reorg&&params[0]==='0xa'?{hash:H(11)}:{})};
   else if(method==='eth_getTransactionReceipt')result=f.evidence[params[0]]?.receipt;
   else if(method==='eth_getTransactionByHash')result=f.evidence[params[0]]?.transaction;
   else if(method==='eth_getBalance')result='0x64';
   else if(method==='eth_call')result=params[0].data==='0x313ce567'?'0x12':mismatch?'0x8':'0x7';
   else throw Error('unexpected rpc '+method);
   data={jsonrpc:'2.0',id:1,result};
  }else{
   const u=new URL(url),p=u.pathname;
   if(status&&p.endsWith('/transactions')&&!failed){failed=true;return {ok:false,status,headers:new Headers({'Retry-After':'0'})};}
   if(internalsFail&&p.endsWith('/internal-transactions'))return {ok:false,status:403};
   if(p.includes('/tokens/'))data={address_hash:T,type:'ERC-20',decimals:'18'};
   else if(p.endsWith('/token-balances'))data=[{token:{address_hash:T,decimals:'18'},value:mismatch?'8':'7'}];
   else if(p.endsWith('/token-transfers'))data={items:u.searchParams.has('index')?[]:f.transfers,next_page_params:pages&&!u.searchParams.has('index')?{index:1,block_number:10}:null};
   else if(p.endsWith('/internal-transactions'))data={items:[],next_page_params:null};
   else if(p.endsWith('/transactions'))data={items:f.transactions,next_page_params:null};
   else if(p.includes('/transactions/'))data=f.transactions[0];
   else if(p.includes('/addresses/'))data={coin_balance:'100'};
   else throw Error('unexpected '+p);
  }
  return {ok:true,status:200,json:async()=>structuredClone(data)};
 };return {fetcher,calls};
}
export const openings=[{accountId:'a',contract:null,quantityBaseUnits:'0',beforeBlock:'0',source:'fixture-opening'},{accountId:'a',contract:T,quantityBaseUnits:'0',beforeBlock:'0',source:'fixture-opening'}];
