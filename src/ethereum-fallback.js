/** Small, read-only public Ethereum fallback when an explorer is slow or unreachable.
 * It never claims to enumerate every ERC-20. Contracts are keyed by chain and address.
 */
import {atomicDecimal} from './decimal.js';
import {requestJSON,TTL} from './request-cache.js';

export const ETH_RPC='https://ethereum-rpc.publicnode.com';
export const ETH_LST_CONTRACTS=Object.freeze([
 Object.freeze({contract:'0xae7ab96520de3a18e5e111b5eaab095312d7fe84',name:'Lido Staked Ether',symbol:'stETH',decimals:18}),
 Object.freeze({contract:'0xae78736cd615f374d3085123a210448e74fc6393',name:'Rocket Pool ETH',symbol:'rETH',decimals:18}),
 Object.freeze({contract:'0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',name:'Wrapped Staked Ether',symbol:'wstETH',decimals:18})
]);
const evm=/^0x[0-9a-fA-F]{40}$/;
const addressWord=s=>s.slice(2).toLowerCase().padStart(64,'0');
async function ethRead(method,params,fetcher){
 const data=await requestJSON(ETH_RPC,{fetcher,method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),ttlMs:TTL.wallet,attempts:1,timeoutMs:8500});
 if(data?.error)throw Error('Ethereum-RPC: '+String(data.error.message||'Verbindungsfehler').slice(0,140));
 if(!/^0x[0-9a-f]+$/i.test(String(data?.result??'')))throw Error('Ethereum-RPC: unvollständiger on-chain Rohbetrag.');
 return BigInt(data.result);
}
export async function ethereumNativeExact(address,fetcher=globalThis.fetch){
 if(!evm.test(address))throw Error('Ungültige öffentliche Ethereum-Adresse.');
 return atomicDecimal((await ethRead('eth_getBalance',[address,'latest'],fetcher)).toString(),18);
}
export async function ethereumTokenExact(address,contract,decimals=18,fetcher=globalThis.fetch){
 if(!evm.test(address)||!evm.test(contract))throw Error('Ungültige Ethereum-Tokenadresse.');
 if(!Number.isInteger(decimals)||decimals<0||decimals>30)throw Error('Token-Decimals ungültig.');
 const data='0x70a08231'+addressWord(address);
 const raw=await ethRead('eth_call',[{to:contract,data},'latest'],fetcher);
 return atomicDecimal(raw.toString(),decimals);
}
/** Bounded, whitelist-only discovery. Returns evidence of partial scope. */
export async function discoverEthereumLsts(address,fetcher=globalThis.fetch){
 if(!evm.test(address))throw Error('Ungültige öffentliche Ethereum-Adresse.');
 const settled=await Promise.allSettled(ETH_LST_CONTRACTS.map(async t=>({...t,quantityExact:await ethereumTokenExact(address,t.contract,t.decimals,fetcher)})));
 const assets=[],errors=[];
 for(let i=0;i<settled.length;i++){
  const item=settled[i];if(item.status==='rejected'){errors.push(ETH_LST_CONTRACTS[i].symbol+': '+String(item.reason?.message||item.reason));continue;}
  const t=item.value;
  if(BigInt(t.quantityExact.replace('.',''))===0n)continue;
  assets.push({name:t.name,symbol:t.symbol,coinId:'',quantity:Number(t.quantityExact),quantityExact:t.quantityExact,chain:'erc20',chainId:1,contract:t.contract,decimals:t.decimals});
 }
 return {assets,errors};
}
