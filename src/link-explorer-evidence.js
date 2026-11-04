/** Bounded LINK explorer execution + Beacon finality. Never an RPC receipt. */
import {sourceDigest} from './import-identity.js';
import {validateHistoryEvent} from './wallet-history-core.js';
import {validateHistorySession} from './wallet-history-state.js';
export const LINK_CONTRACT='0x514910771af9ca656af840dff83e8264ecf986ca';
const TRANSFER='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const fail=()=>{throw Error('LINK-Beleg unvollständig, verändert oder nicht eindeutig.');};
const hash=v=>typeof v==='string'&&/^0x[0-9a-f]{64}$/.test(v);
const addr=v=>{if(typeof v!=='string'||!/^0x[0-9a-f]{40}$/i.test(v))fail();return v.toLowerCase();};
const integer=v=>{if(typeof v==='number'){if(!Number.isSafeInteger(v)||v<0)fail();return BigInt(v);}if(typeof v!=='string'||!/^(0|[1-9]\d{0,77})$/.test(v))fail();return BigInt(v);};
/** Preserve unambiguous captured JSON, including escaped duplicate member names. */
function parseJSON(text){
 const value=JSON.parse(text),stack=[],tokens=/"(?:\\[\s\S]|[^"\\])*"|[{}\[\]:,]/g;let match;
 while((match=tokens.exec(text))){const token=match[0];if(token==='{'||token==='['){if(stack.length>=128)fail();stack.push(token==='{'?new Set():null);}else if(token==='}'||token===']')stack.pop();else if(token[0]==='"'&&text.slice(tokens.lastIndex).trimStart()[0]===':'){const set=stack.at(-1),key=JSON.parse(token);if(!set||set.has(key))fail();set.add(key);}}
 return value;
}
const keys=(v,s)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join()!==s.split(' ').sort().join())fail();};
export const linkWallet=p=>p?.kind==='crypto'&&p.coinId==='chainlink'&&p.symbol==='LINK'&&p.wallet?.enabled&&p.wallet.chain==='erc20'&&Number(p.wallet.chainId)===1&&p.wallet.contract?.toLowerCase()===LINK_CONTRACT&&Number(p.wallet.decimals)===18;
export function linkWalletScope(p){if(!linkWallet(p))fail();return sourceDigest(JSON.stringify([p.id,p.accountId,p.kind,p.coinId,p.symbol,p.wallet.chain,String(p.wallet.chainId),addr(p.wallet.address),LINK_CONTRACT,String(p.wallet.decimals)]));}
/** Revalidate the portable projection. Raw hashes certify ingestion, not a raw rehash on restore. */
export function validateLinkExecution(v){
 keys(v,'type chainId contract decimals txid from destination quantityRaw logIndex blockHash blockNumber txIndex timestamp gasUsed gasPrice feeWei slot genesisTime validatorsRoot finalized executionOptimistic captures');
 if(v.type!=='blockscout-v2-execution+beacon-v2-finality'||v.chainId!=='1'||v.contract!==LINK_CONTRACT||v.decimals!==18||!hash(v.txid)||!hash(v.blockHash)||addr(v.from)!==v.from||addr(v.destination)!==v.destination||v.from===v.destination||v.finalized!==true||v.executionOptimistic!==false||v.genesisTime!=='1606824023'||v.validatorsRoot!=='0x4b363db94e286120d76eb905340fdd4e54bfe9f06bf33ff6cf5ad27f511bfe95')fail();
 if(integer(v.quantityRaw)<=0n||integer(v.gasUsed)<=0n||integer(v.gasPrice)<=0n||integer(v.feeWei)!==integer(v.gasUsed)*integer(v.gasPrice)||!/^\d{4}-\d\d-\d\dT/.test(v.timestamp)||new Date(v.timestamp).toISOString()!==v.timestamp||BigInt(Date.parse(v.timestamp)/1000)!==integer(v.genesisTime)+integer(v.slot)*12n)fail();
 for(const k of ['logIndex','blockNumber','txIndex'])integer(v[k]);
 keys(v.captures,'transaction logs blockByHash blockByNumber blockTransactions beacon genesis');
 const paths={transaction:'/api/v2/transactions/'+v.txid,logs:'/api/v2/transactions/'+v.txid+'/logs',blockByHash:'/api/v2/blocks/'+v.blockHash,blockByNumber:'/api/v2/blocks/'+v.blockNumber,blockTransactions:'/api/v2/blocks/'+v.blockHash+'/transactions',beacon:'/eth/v2/beacon/blocks/'+v.slot,genesis:'/eth/v1/beacon/genesis'};
 for(const [k,c] of Object.entries(v.captures)){
  keys(c,'url method startedAt finishedAt status sha256 bytes');
  if(c.method!=='GET'||c.status!==200||typeof c.sha256!=='string'||!/^[0-9a-f]{64}$/.test(c.sha256)||!Number.isSafeInteger(c.bytes)||c.bytes<=0||c.bytes>1000000||!Number.isFinite(Date.parse(c.startedAt))||!Number.isFinite(Date.parse(c.finishedAt))||Date.parse(c.finishedAt)<Date.parse(c.startedAt))fail();
  const url=new URL(c.url);if(url.protocol!=='https:'||url.hostname!==(['beacon','genesis'].includes(k)?'lodestar-mainnet.chainsafe.io':'eth.blockscout.com')||url.pathname!==paths[k]||url.search||url.hash||url.username||url.password||url.port)fail();
 }
 return v;
}
/** Explicit local input only. No fetch, key, session authority or storage mutation. */
export function parseLinkEvidence(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>1000000)fail();const raw=parseJSON(text);keys(raw,'format chainId captures');keys(raw.captures,'transaction logs blockByHash blockByNumber blockTransactions beacon genesis');if(raw.format!=='foliolab-link-explorer-beacon-v1'||raw.chainId!=='1')fail();
 const data={},captures={};
 for(const [k,item] of Object.entries(raw.captures)){
  keys(item,'capture body');const c=item.capture;if(typeof item.body!=='string'||new TextEncoder().encode(item.body).length>1000000||sourceDigest(item.body)!==c.sha256||c.method!=='GET'||![200,'200'].includes(c.httpStatus??c.status)||c.tlsVerification!==true||c.redirectsFollowed!==false||c.retries!==0||c.error||c.exitCode!==undefined&&c.exitCode!==0)fail();
  const bytes=new TextEncoder().encode(item.body).length;if(c.bytes!==undefined&&c.bytes!==bytes)fail();data[k]=parseJSON(item.body);captures[k]={url:c.url,method:'GET',startedAt:c.startedAt,finishedAt:c.finishedAt,status:200,sha256:c.sha256,bytes};
 }
 const {transaction:t,logs,blockByHash:b,blockByNumber:c,blockTransactions:bt,beacon,genesis}=data,g=genesis.data,m=beacon.data?.message,x=m?.body?.execution_payload;
 if(!t||t.status!=='ok'||t.result!=='success'||t.is_pending_update!==false||t.revert_reason||t.created_contract||t.has_error_in_internal_transactions||t.token_transfers_overflow===true||t.value!=='0'||![0,1,2].includes(t.type)||addr(t.to?.hash)!==LINK_CONTRACT||!Array.isArray(logs.items)||logs.items.length!==1||logs.next_page_params!==null||!Array.isArray(bt.items)||bt.items.length>100||!x||!g||genesis.execution_optimistic===true)fail();
 const l=logs.items[0],topics=l.topics;if(l.removed===true||!Array.isArray(topics)||topics.length!==4||topics[3]!==null||topics[0]!==TRANSFER||topics.slice(1,3).some(t=>typeof t!=='string'||!/^0x0{24}[0-9a-f]{40}$/i.test(t))||!/^0x[0-9a-f]{64}$/i.test(l.data))fail();
 const from=addr('0x'+topics[1].slice(-40)),destination=addr('0x'+topics[2].slice(-40)),quantity=BigInt(l.data),blockNumber=integer(b.height).toString(),blockHash=b.hash;
 if(!hash(t.hash)||!hash(blockHash)||addr(l.address?.hash)!==LINK_CONTRACT||addr(t.from?.hash)!==from||l.transaction_hash!==t.hash||l.block_hash!==blockHash||integer(l.block_number)!==integer(blockNumber)||integer(t.block_number)!==integer(blockNumber)||c.hash!==blockHash||integer(c.height)!==integer(blockNumber)||b.timestamp!==c.timestamp||t.timestamp!==b.timestamp||l.block_timestamp!==b.timestamp||b.is_pending_update!==false||c.is_pending_update!==false||b.type!=='block'||c.type!=='block')fail();
 const input='0xa9059cbb'+'0'.repeat(24)+destination.slice(2)+quantity.toString(16).padStart(64,'0');if(t.raw_input.toLowerCase()!==input||t.fee?.type!=='actual'||integer(t.fee.value)!==integer(t.gas_used)*integer(t.gas_price)||integer(t.gas_used)>integer(t.gas_limit))fail();
 const included=bt.items.filter(a=>a.hash===t.hash);if(included.length!==1||included[0].is_pending_update===true||included[0].status!=='ok'||included[0].result!=='success'||integer(included[0].position)!==integer(t.position)||integer(included[0].block_number)!==integer(blockNumber))fail();
 if(beacon.finalized!==true||beacon.execution_optimistic!==false||x.block_hash!==blockHash||integer(x.block_number)!==integer(blockNumber)||integer(x.timestamp)!==BigInt(Date.parse(b.timestamp)/1000)||integer(x.timestamp)!==integer(g.genesis_time)+integer(m.slot)*12n)fail();
 return validateLinkExecution({type:'blockscout-v2-execution+beacon-v2-finality',chainId:'1',contract:LINK_CONTRACT,decimals:18,txid:t.hash,from,destination,quantityRaw:quantity.toString(),logIndex:integer(l.index).toString(),blockHash,blockNumber,txIndex:integer(t.position).toString(),timestamp:new Date(b.timestamp).toISOString(),gasUsed:integer(t.gas_used).toString(),gasPrice:integer(t.gas_price).toString(),feeWei:integer(t.fee.value).toString(),slot:integer(m.slot).toString(),genesisTime:g.genesis_time,validatorsRoot:g.genesis_validators_root,finalized:beacon.finalized,executionOptimistic:beacon.execution_optimistic,captures});
}
export function linkHistoryEvent(p,execution,{observedAt=new Date().toISOString()}={}){
 const v=validateLinkExecution(execution);if(!linkWallet(p)||addr(p.wallet.address)!==v.destination)fail();
 return validateHistoryEvent({network:'ethereum',chainId:'1',accountId:p.accountId,walletId:p.accountId,assetId:LINK_CONTRACT,contract:LINK_CONTRACT,mint:null,decimals:18,txid:v.txid,locator:{kind:'log',index:v.logIndex,subindex:'1'},blockHeight:v.blockNumber,blockHash:v.blockHash,txIndex:v.txIndex,timestamp:v.timestamp,quantityBaseUnits:v.quantityRaw,type:'incoming',status:'confirmed',finality:'finalized',coverage:'verified',qualityCode:'explorer-execution-beacon-finality',source:'eth.blockscout.com',observedAt});
}
export function partialLinkHistory(model,positionId,execution){
 const p=model.positions.find(p=>p.id===positionId),event=linkHistoryEvent(p,execution);const existing=(model.walletHistory?.sessions||[]).filter(s=>s.walletKey===positionId);
 if(existing.length)throw Error('Vorhandene Historie bleibt erhalten. LINK-Beleg mit dem vorhandenen Ereignis abgleichen.');
 return validateHistorySession({id:'wallet-history:'+positionId,chain:'eth',walletKey:positionId,acceptedAt:new Date().toISOString(),events:[event],streams:[{network:'ethereum',chainId:'1',accountId:p.accountId,assetId:LINK_CONTRACT,contract:LINK_CONTRACT,mint:null,decimals:18,throughBlock:execution.blockNumber,opening:null,coverage:{status:'partial',fromBlock:execution.blockNumber,toBlock:execution.blockNumber,tipHash:execution.blockHash,source:'eth.blockscout.com'}}],issues:['single-link-event-only','missing-opening']});
}
