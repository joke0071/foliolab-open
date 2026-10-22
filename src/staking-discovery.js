import {atomicDecimal} from './decimal.js';
import {requestJSON,TTL} from './request-cache.js';

export const SAVAX_CONTRACT='0x2b2c81e08f1af8835a78bb2a90ae924ace0ea4be';
export const STS_CONTRACT='0xe5da20f15420ad15de0fa650600afc998bbe3955';
export const SONIC_RPC='https://rpc.soniclabs.com';
export const AVALANCHE_RPC='https://api.avax.network/ext/bc/C/rpc';
export const SONIC_SFC='0xFC00FACE00000000000000000000000000000000';
export const SOLANA_STAKE_PROGRAM='Stake11111111111111111111111111111111111111';
const SOL_RE= /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM_RE=/^0x[0-9a-fA-F]{40}$/;
const word=n=>BigInt(n).toString(16).padStart(64,'0');
const addressWord=a=>String(a).slice(2).toLowerCase().padStart(64,'0');
const quantityFromHex=(s,decimals)=>{
 if(!/^0x[0-9a-f]+$/i.test(String(s)))throw Error('Blockchain-RPC lieferte keinen gültigen Hex-Rohbetrag.');
 return atomicDecimal(BigInt(s).toString(),decimals);
};
async function rpc(url,method,params,fetcher){
 const u=new URL(url);
 if(u.protocol!=='https:'||u.username||u.password)throw Error('RPC muss HTTPS ohne Zugangsdaten verwenden.');
 const r=await requestJSON(u.toString(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),fetcher,ttlMs:TTL.wallet});
 if(r?.error)throw Error(String(r.error.message||'RPC-Fehler'));
 if(!r||!Object.hasOwn(r,'result')||r.result==null)throw Error('Blockchain-RPC-Antwort unvollständig.');
 return r.result;
}
async function evmCall(url,to,data,fetcher){
 return rpc(url,'eth_call',[{to,data},'latest'],fetcher);
}
export async function evmTokenBalanceExact(rpcUrl,contract,address,fetcher=globalThis.fetch,decimals=18){
 if(!EVM_RE.test(contract)||!EVM_RE.test(address))throw Error('Ungültige öffentliche EVM-Adresse.');
 return quantityFromHex(await evmCall(rpcUrl,contract,'0x70a08231'+addressWord(address),fetcher),decimals);
}
export async function sonicNativeBalanceExact(address,fetcher=globalThis.fetch){
 if(!EVM_RE.test(address))throw Error('Ungültige Sonic-Adresse.');
 return quantityFromHex(await rpc(SONIC_RPC,'eth_getBalance',[address,'latest'],fetcher),18);
}
export async function sonicStakeBalanceExact(address,validatorId,fetcher=globalThis.fetch){
 if(!EVM_RE.test(address)||!/^[1-9]\d{0,5}$/.test(String(validatorId)))throw Error('Ungültige Sonic-Staking-Zuordnung.');
 const data='0xcfd47663'+addressWord(address)+word(validatorId); // SFC.getStake(address,uint256)
 return quantityFromHex(await evmCall(SONIC_RPC,SONIC_SFC,data,fetcher),18);
}
const sonicTokens=[
 {contract:STS_CONTRACT,name:'Beets Staked Sonic',symbol:'stS',decimals:18},
 {contract:'0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38',name:'Wrapped Sonic',symbol:'wS',decimals:18},
 {contract:'0x29219dd400f2bf60e5a23d13be72b486d4038894',name:'USDC',symbol:'USDC',decimals:6},
 {contract:'0x6047828dc181963ba44974801ff68e538da5eaf9',name:'Bridged USDT',symbol:'USDT',decimals:6}
];
/** Public key only; native S, known ERC20 and direct SFC delegations. No signing. */
export async function discoverSonicWallet(address,fetcher=globalThis.fetch){
 if(!EVM_RE.test(address))throw Error('Ungültige Sonic-Adresse.');
 const balance=await sonicNativeBalanceExact(address,fetcher);
 const assets=[];
 if(Number(balance)>0)assets.push({name:'Sonic',symbol:'S',coinId:'sonic-3',quantity:Number(balance),quantityExact:balance,chain:'evm',chainId:146,decimals:18});
 const problems=[];
 const tokenResults=await Promise.allSettled(sonicTokens.map(async token=>({...token,quantityExact:await evmTokenBalanceExact(SONIC_RPC,token.contract,address,fetcher,token.decimals)})));
 for(let i=0;i<tokenResults.length;i++){
  const result=tokenResults[i];
  if(result.status!=='fulfilled'){problems.push(sonicTokens[i].symbol+'-Contract nicht lesbar');continue;}
  const token=result.value;
  if(Number(token.quantityExact)>0)assets.push({name:token.name,symbol:token.symbol,coinId:'',quantity:Number(token.quantityExact),quantityExact:token.quantityExact,chain:'erc20',chainId:146,contract:token.contract,decimals:token.decimals});
 }
 try{
  const latest=BigInt(await evmCall(SONIC_RPC,SONIC_SFC,'0xc7be95de',fetcher)); // lastValidatorID()
  if(latest>256n)problems.push('Validatorenliste über Scanlimit (256)');
  const max=Number(latest>256n?256n:latest);
  for(let first=1;first<=max;first+=16){
   const ids=Array.from({length:Math.min(16,max-first+1)},(_,i)=>first+i);
   const outcomes=await Promise.allSettled(ids.map(id=>sonicStakeBalanceExact(address,id,fetcher)));
   outcomes.forEach((o,i)=>{
    if(o.status==='rejected'){problems.push('Validator '+ids[i]+' nicht lesbar');return;}
    if(Number(o.value)>0)assets.push({name:'Sonic delegiert · Validator '+ids[i],symbol:'S',coinId:'sonic-3',quantity:Number(o.value),quantityExact:o.value,chain:'sonic-stake',contract:String(ids[i]),decimals:18});
   });
  }
 }catch(e){problems.push('SFC-Staking-Abfrage fehlgeschlagen: '+e.message);}
 // Pending withdrawal requests are not discoverable from this snapshot.
 assets.partial=true;
 assets.warning=['Sonic: Bekannte Tokens und aktive Delegationen; offene Auszahlungsanträge und weitere DeFi-Contracts nicht vollständig abgedeckt',...problems].join(' · ')+'.';
 return assets;
}
/** Only withdraw-authorized stake accounts are economically attributed to this wallet. */
export async function discoverSolanaStakes(owner,rpcUrl,fetcher=globalThis.fetch){
 if(!SOL_RE.test(owner))throw Error('Ungültige Solana-Adresse.');
 const rows=await rpc(rpcUrl,'getProgramAccounts',[SOLANA_STAKE_PROGRAM,{encoding:'jsonParsed',commitment:'confirmed',filters:[{dataSize:200},{memcmp:{offset:44,bytes:owner}}]}],fetcher);
 if(!Array.isArray(rows))throw Error('Solana-Stake-Accounts nicht vollständig lesbar.');
 if(rows.length>500)throw Error('Solana-Stake-Scanlimit erreicht.');
 const result=[],seen=new Set();
 for(const row of rows){
  const pubkey=String(row?.pubkey||''),account=row?.account,info=account?.data?.parsed?.info;
  if(!SOL_RE.test(pubkey)||account?.owner!==SOLANA_STAKE_PROGRAM||seen.has(pubkey))continue;
  if(info?.meta?.authorized?.withdrawer!==owner)throw Error('Stake-Account ohne bestätigte Auszahlungsberechtigung.');
  const lamports=account.lamports;
  if(!Number.isSafeInteger(lamports)||lamports<0)throw Error('Solana-Stake-Account ohne vollständigen Rohsaldo.');
  if(!lamports)continue;
  const quantityExact=atomicDecimal(String(lamports),9);
  seen.add(pubkey);
  result.push({name:'Solana Stake-Account '+pubkey.slice(0,6)+'…',symbol:'SOL',coinId:'solana',quantity:Number(quantityExact),quantityExact,chain:'sol-stake',contract:pubkey,decimals:9});
 }
 return result;
}
export async function solanaStakeBalanceExact(wallet,rpcUrl,fetcher=globalThis.fetch){
 if(!SOL_RE.test(String(wallet?.address||''))||!SOL_RE.test(String(wallet?.contract||'')))throw Error('Ungültiger Solana-Stake-Account.');
 const account=await rpc(rpcUrl,'getAccountInfo',[wallet.contract,{encoding:'jsonParsed',commitment:'confirmed'}],fetcher);
 if(!account.value)throw Error('Stake-Account nicht mehr vorhanden; vorherigen Bestand nicht ungeprüft auf null setzen.');
 const a=account.value;
 if(a.owner!==SOLANA_STAKE_PROGRAM||a.data?.parsed?.info?.meta?.authorized?.withdrawer!==wallet.address)throw Error('Stake-Account nicht mehr der angegebenen Wallet zugeordnet.');
 if(!Number.isSafeInteger(a.lamports)||a.lamports<0)throw Error('Stake-Account-Rohsaldo unvollständig.');
 return atomicDecimal(String(a.lamports),9);
}
