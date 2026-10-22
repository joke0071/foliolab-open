/**
 * BNB Smart Chain BEP-20 watch-only: Binplorer address index for discovery,
 * read-only on-chain balanceOf/decimals as authoritative amounts.
 * The public Binplorer "freekey" is a DEVELOPMENT fallback and is rate-limited.
 * Unknown contracts are never blessed solely by ticker.
 */
import {atomicDecimal} from './decimal.js';
import {requestJSON,TTL} from './request-cache.js';
import {BNB_RPC,bnbLiquidExact,validateNativeStakingAddress} from './native-staking-networks.js';

export const BINPLORER='https://api.binplorer.com';
export const BNB_CURATED_TOKENS=Object.freeze([
 Object.freeze({contract:'0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',name:'Wrapped BNB',symbol:'WBNB',decimals:18}),
 Object.freeze({contract:'0x55d398326f99059ff775485246999027b3197955',name:'Binance-Peg BSC-USD',symbol:'USDT',decimals:18}),
 Object.freeze({contract:'0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',name:'Binance-Peg USD Coin',symbol:'USDC',decimals:18}),
 Object.freeze({contract:'0x7130d2a12b9bcBFAe4f2634d864A1Ee1Ce3Ead9c'.toLowerCase(),name:'BTCB Token',symbol:'BTCB',decimals:18})
]);
const addressRE=/^0x[0-9a-f]{40}$/i;
const decimalsRE=/^0x[0-9a-f]+$/i;
const encodeAddress=a=>a.slice(2).toLowerCase().padStart(64,'0');
async function rpc(to,data,fetcher) {
 const body={jsonrpc:'2.0',id:1,method:'eth_call',params:[{to,data},'latest']};
 const r=await requestJSON(BNB_RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),ttlMs:TTL.wallet,fetcher,attempts:1,timeoutMs:8500});
 if(r?.error)throw Error('BSC-RPC: '+String(r.error.message||'eth_call fehlgeschlagen'));
 if(!decimalsRE.test(String(r?.result||'')))throw Error('BSC-Contract-Rohwert ungültig.');
 return BigInt(r.result);
}
export async function bnbBep20BalanceExact(contract,address,fetcher=globalThis.fetch,expectedDecimals=null){
 if(!addressRE.test(String(contract)))throw Error('Ungültiger BEP-20-Contract.');
 validateNativeStakingAddress('bnb',address);
 const decimalsRaw=await rpc(contract,'0x313ce567',fetcher);
 const decimals=Number(decimalsRaw);
 if(!Number.isInteger(decimals)||decimals<0||decimals>30)throw Error('BEP-20-Decimals ungültig.');
 if(expectedDecimals!=null&&decimals!==Number(expectedDecimals))throw Error('BEP-20-Decimals haben sich unerwartet geändert; Bestand bleibt erhalten.');
 const raw=await rpc(contract,'0x70a08231'+encodeAddress(address),fetcher);
 return {quantityExact:atomicDecimal(raw.toString(),decimals),decimals};
}
function indexedCandidates(body,address){
 if(String(body?.address||'').toLowerCase()!==address.toLowerCase())throw Error('Binplorer-Adresse stimmt nicht mit Wallet überein.');
 if(!Array.isArray(body.tokens))throw Error('Binplorer lieferte kein überprüfbares Tokeninventar.');
 const incomplete=body.tokens.length>80;
 const entries=[];const seen=new Set();let malformed=0;
 for(const row of body.tokens.slice(0,80)){
  const info=row?.tokenInfo||{},contract=String(info.address||'').toLowerCase();
  if(!addressRE.test(contract)||seen.has(contract)){malformed++;continue;}
  seen.add(contract);
  if(typeof row.rawBalance!=='string'||!/^\d+$/.test(row.rawBalance)){malformed++;continue;}
  if(BigInt(row.rawBalance)===0n)continue;
  const decimals=Number(info.decimals);
  if(!Number.isInteger(decimals)||decimals<0||decimals>30){malformed++;continue;}
  const symbol=String(info.symbol||'Token').slice(0,32),name=String(info.name||symbol).slice(0,100);
  entries.push({contract,symbol,name,decimals,indexerRaw:row.rawBalance});
 }
 return {entries,malformed,incomplete};
}
/** BNB native + indexed BEP-20 contracts, each positive balance verified by eth_call.
 * Partial flag is always set because the indexer can omit holdings or restrict free users.
 */
export async function discoverBnbTokens(address,{binplorerKey=''}={},fetcher=globalThis.fetch){
 const a=validateNativeStakingAddress('bnb',address);
 const quantityExact=await bnbLiquidExact(a,fetcher),assets=[];
 if(Number(quantityExact)>0)assets.push({name:'BNB Smart Chain',symbol:'BNB',coinId:'binancecoin',quantity:Number(quantityExact),quantityExact,chain:'evm',chainId:56,decimals:18});
 let indexed=[],indexIssue='',invalid=0,truncated=false;
 try{
  const key=String(binplorerKey||'freekey').trim();
  if(!/^[A-Za-z0-9_-]{3,128}$/.test(key))throw Error('Binplorer-Schlüssel ungültig.');
  const url=BINPLORER+'/getAddressInfo/'+encodeURIComponent(a)+'?apiKey='+encodeURIComponent(key);
  const info=await requestJSON(url,{fetcher,ttlMs:TTL.wallet,attempts:1,timeoutMs:7000});
  const parsed=indexedCandidates(info,a);
  indexed=parsed.entries;invalid=parsed.malformed;truncated=parsed.incomplete;
 }catch(e){indexIssue=e.message;}
 const tokenMap=new Map(BNB_CURATED_TOKENS.map(t=>[t.contract,{...t,curated:true}]));
 for(const token of indexed)if(!tokenMap.has(token.contract))tokenMap.set(token.contract,{...token,curated:false});
 const errors=[];
 // Perform bounded, parallel requests, rate-limited by shared request-cache.
 const candidates=[...tokenMap.values()];
 const settled=await Promise.allSettled(candidates.map(async token=>{
  const b=await bnbBep20BalanceExact(token.contract,a,fetcher,token.decimals);
  return {...token,...b};
 }));
 for(let i=0;i<settled.length;i++){
  const item=settled[i],token=candidates[i];
  if(item.status==='rejected'){errors.push(token.symbol+': '+String(item.reason?.message||item.reason));continue;}
  const t=item.value;
  if(Number(t.quantityExact)<=0)continue;
  assets.push({name:t.name,symbol:t.symbol,coinId:'',quantity:Number(t.quantityExact),quantityExact:t.quantityExact,chain:'erc20',chainId:56,contract:t.contract,decimals:t.decimals,reputation:''});
 }
 // Never present "no holdings" as verified when both sources failed.
 if(!assets.length&&indexIssue&&errors.length===candidates.length)throw Error('BNB/BEP-20-Abfrage nicht vollständig: '+indexIssue+' · '+errors.slice(0,2).join(' · '));
 assets.partial=true;
 const details=[indexIssue&&'Indexer nicht verfügbar ('+indexIssue+')',invalid&&invalid+' ungültige Token-Datensätze',truncated&&'Token-Liste >80 (gekürzt)',errors.length&&errors.length+' Contract-Abfragen fehlgeschlagen'];
 assets.warning=['BNB: Freies Guthaben und bestätigte BEP-20-Bestände, ohne Gewähr für vollständige Token-/DeFi-/Staking-Erkennung',...details.filter(Boolean)].join(' · ')+'.';
 return assets;
}
