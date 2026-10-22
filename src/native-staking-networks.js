import {atomicDecimal} from './decimal.js';
import {requestJSON,TTL} from './request-cache.js';

/** Strict read-only, keyless public endpoints. Endpoint uptime and browser CORS are NOT guaranteed. */
export const COSMOS_LCD='https://rest.cosmos.directory/cosmoshub';
export const HEDERA_MIRROR='https://mainnet-public.mirrornode.hedera.com/api/v1';
export const NEAR_RPC='https://rpc.mainnet.fastnear.com';
export const BNB_RPC='https://bsc-dataseed.bnbchain.org';

const addressPatterns={
 cosmos:/^cosmos1[023456789acdefghjklmnpqrstuvwxyz]{20,80}$/,
 hedera:/^0\.0\.[0-9]{1,18}$/,
 near:/^(?=.{2,64}$)[a-z0-9]+(?:[-_.][a-z0-9]+)*$/,
 bnb:/^0x[0-9a-fA-F]{40}$/
};
export function validateNativeStakingAddress(network,address){
 const a=String(address||'').trim();
 if(!addressPatterns[network]?.test(a))throw Error('Öffentliche Adresse passt nicht zum Netzwerk '+network+'.');
 return a;
}
async function get(url,fetcher){
 return requestJSON(url,{fetcher,ttlMs:TTL.wallet});
}
async function postRpc(url,method,params,fetcher){
 const response=await requestJSON(url,{fetcher,method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),ttlMs:TTL.wallet});
 if(response?.error)throw Error(String(response.error.message||'RPC-Abfrage fehlgeschlagen'));
 if(response?.result==null)throw Error('RPC-Antwort unvollständig.');
 return response.result;
}
function nonnegativeRaw(value){
 if(typeof value!=='string'&&!Number.isSafeInteger(value))throw Error('Blockchain-Bestand nicht exakt dargestellt.');
 const raw=String(value??'');
 if(!/^\d+$/.test(raw))throw Error('Blockchain-Rohbestand ungültig.');
 return BigInt(raw);
}
function amount(value,decimals){return atomicDecimal(nonnegativeRaw(value).toString(),decimals);}
function asset({name,symbol,coinId,quantityExact,chain,contract='',decimals,stakingLabel=''}) {
 return {name,symbol,coinId,quantity:Number(quantityExact),quantityExact,chain,contract,decimals,stakingLabel};
}
const ensureArray=(value,label)=>{if(!Array.isArray(value))throw Error(label+' unvollständig.');return value;};
async function pagedCosmos(path,field,fetcher){
 let key='',pages=0;const all=[];
 do{
  if(++pages>10)throw Error('Cosmos-Seitenlimit erreicht. Bestand nicht vollständig.');
  const url=new URL(COSMOS_LCD+path);
  url.searchParams.set('pagination.limit','100');
  if(key)url.searchParams.set('pagination.key',key);
  const data=await get(url.toString(),fetcher);
  all.push(...ensureArray(data[field],field));
  if(all.length>1000)throw Error('Cosmos-Positionslimit erreicht.');
  const next=data.pagination?.next_key;
  if(next!=null&&typeof next!=='string')throw Error('Cosmos-Paginierung fehlerhaft.');
  if(next&&next===key)throw Error('Cosmos-Paginierung wiederholt dieselbe Seite.');
  key=next||'';
 }while(key);
 return all;
}
const denom='uatom';
export async function cosmosLiquidExact(address,fetcher=globalThis.fetch){
 const a=validateNativeStakingAddress('cosmos',address);
 const d=await get(COSMOS_LCD+'/cosmos/bank/v1beta1/balances/'+encodeURIComponent(a)+'/by_denom?denom='+denom,fetcher);
 if(!d?.balance||d.balance.denom!==denom)throw Error('ATOM-Banksaldo nicht verifiziert.');
 return amount(d.balance.amount,6);
}
export async function cosmosStakeExact(address,validator,kind,fetcher=globalThis.fetch){
 const a=validateNativeStakingAddress('cosmos',address);
 if(!/^cosmosvaloper1[023456789acdefghjklmnpqrstuvwxyz]{20,80}$/.test(String(validator)))throw Error('Ungültiger Cosmos-Validator.');
 if(!['cosmos-stake','cosmos-unbonding'].includes(kind))throw Error('Unbekannte Cosmos-Staking-Art.');
 const rows=await pagedCosmos(kind==='cosmos-stake'?'/cosmos/staking/v1beta1/delegations/'+encodeURIComponent(a):'/cosmos/staking/v1beta1/delegators/'+encodeURIComponent(a)+'/unbonding_delegations',
  kind==='cosmos-stake'?'delegation_responses':'unbonding_responses',fetcher);
 let total=0n;
 for(const row of rows){
  const v=kind==='cosmos-stake'?row?.delegation?.validator_address:row?.validator_address;
  if(v!==validator)continue;
  if(kind==='cosmos-stake'){
   if(row.balance?.denom!==denom)throw Error('Delegation in unerwartetem Denom.');
   total+=nonnegativeRaw(row.balance.amount);
  }else for(const entry of ensureArray(row.entries,'Unbonding-Einträge'))total+=nonnegativeRaw(entry.balance);
 }
 return amount(total.toString(),6);
}
export async function discoverCosmos(address,fetcher=globalThis.fetch){
 const a=validateNativeStakingAddress('cosmos',address),result=[],errors=[];
 try{const q=await cosmosLiquidExact(a,fetcher);if(Number(q)>0)result.push(asset({name:'Cosmos Hub',symbol:'ATOM',coinId:'cosmos',quantityExact:q,chain:'cosmos',decimals:6}));}
 catch(e){errors.push('freie ATOM: '+e.message);}
 const types=[['cosmos-stake','/cosmos/staking/v1beta1/delegations/'+encodeURIComponent(a),'delegation_responses'],
 ['cosmos-unbonding','/cosmos/staking/v1beta1/delegators/'+encodeURIComponent(a)+'/unbonding_delegations','unbonding_responses']];
 for(const [kind,path,field] of types){
  try{
   const rows=await pagedCosmos(path,field,fetcher),byValidator=new Map();
   for(const row of rows){
    const validator=kind==='cosmos-stake'?row?.delegation?.validator_address:row?.validator_address;
    if(!/^cosmosvaloper1[023456789acdefghjklmnpqrstuvwxyz]{20,80}$/.test(String(validator)))throw Error('Validator-ID fehlerhaft.');
    if(kind==='cosmos-stake'&&row.balance?.denom!==denom)throw Error('Nicht-ATOM-Staking-Bestand.');
    const val=kind==='cosmos-stake'?nonnegativeRaw(row.balance.amount):ensureArray(row.entries,'Unbonding-Einträge').reduce((sum,e)=>sum+nonnegativeRaw(e.balance),0n);
    byValidator.set(validator,(byValidator.get(validator)||0n)+val);
   }
   for(const [validator,value] of byValidator)if(value>0n)result.push(asset({name:(kind==='cosmos-stake'?'ATOM delegiert':'ATOM in Freigabe')+' · '+validator.slice(0,16)+'…',
    symbol:'ATOM',coinId:'cosmos',quantityExact:amount(value.toString(),6),chain:kind,contract:validator,decimals:6,stakingLabel:kind==='cosmos-stake'?'delegiert':'Unbonding'}));
  }catch(e){errors.push((kind==='cosmos-stake'?'Delegationen':'Unbonding')+': '+e.message);}
 }
 result.partial=true;
 result.warning=['ATOM: freie, delegierte und unbondende Bestände getrennt; ausstehende Rewards und weitere Cosmos-Assets nicht vollständig abgedeckt',...errors].join(' · ');
 if(errors.length===3&&!result.length)throw Error('Cosmos-Bestände nicht überprüfbar: '+errors.join(' / '));
 return result;
}
export async function hederaBalanceExact(address,fetcher=globalThis.fetch){
 const a=validateNativeStakingAddress('hedera',address);
 const d=await get(HEDERA_MIRROR+'/accounts/'+encodeURIComponent(a),fetcher);
 if(d?.deleted===true||d?.account!==a)throw Error('Hedera-Konto nicht bestätigt.');
 return amount(d?.balance?.balance,8);
}
export async function discoverHedera(address,fetcher=globalThis.fetch){
 const a=validateNativeStakingAddress('hedera',address);
 const data=await get(HEDERA_MIRROR+'/accounts/'+encodeURIComponent(a),fetcher);
 if(data?.account!==a||data?.deleted===true)throw Error('Hedera-Konto nicht verifiziert.');
 const q=amount(data?.balance?.balance,8),stake=data.staked_node_id!=null||Boolean(data.staked_account_id);
 const items=Number(q)>0?[asset({name:stake?'Hedera HBAR (Staking aktiviert)':'Hedera HBAR',symbol:'HBAR',coinId:'hedera-hashgraph',quantityExact:q,chain:'hedera',decimals:8,
 stakingLabel:stake?'Saldo enthält gestakte HBAR – keine Doppelzählung':''})]:[];
 items.partial=true;
 items.warning='HBAR: Staking ist Teil des normalen Kontos; nicht doppelt zählen. Ausstehende Rewards werden nicht als verfügbarer Bestand importiert.';
 return items;
}
export async function nearAccountBalances(address,fetcher=globalThis.fetch){
 const a=validateNativeStakingAddress('near',address);
 const d=await postRpc(NEAR_RPC,'query',{request_type:'view_account',account_id:a,finality:'final'},fetcher);
 return {liquid:amount(d.amount,24),locked:amount(d.locked,24)};
}
export async function discoverNear(address,fetcher=globalThis.fetch){
 const q=await nearAccountBalances(address,fetcher),items=[];
 if(Number(q.liquid)>0)items.push(asset({name:'NEAR (Kontoguthaben)',symbol:'NEAR',coinId:'near',quantityExact:q.liquid,chain:'near',decimals:24}));
 if(Number(q.locked)>0)items.push(asset({name:'NEAR im Konto gesperrt',symbol:'NEAR',coinId:'near',quantityExact:q.locked,chain:'near-locked',decimals:24}));
 items.partial=true;
 items.warning='NEAR: Konto-Balance und direkt gesperrte Beträge; externe Staking-Pools und Delegationen sind über die bloße Wallet-Adresse nicht vollständig auffindbar.';
 return items;
}
export async function bnbLiquidExact(address,fetcher=globalThis.fetch){
 const a=validateNativeStakingAddress('bnb',address);
 const hex=await postRpc(BNB_RPC,'eth_getBalance',[a,'latest'],fetcher);
 if(!/^0x[0-9a-f]+$/i.test(String(hex)))throw Error('BNB-Rohsaldo ungültig.');
 return amount(BigInt(hex).toString(),18);
}
export async function discoverBnb(address,fetcher=globalThis.fetch){
 const q=await bnbLiquidExact(address,fetcher);
 const result=Number(q)>0?[asset({name:'BNB Smart Chain',symbol:'BNB',coinId:'binancecoin',quantityExact:q,chain:'evm',decimals:18})]:[];
 if(result.length)result[0].chainId=56;
 result.partial=true;
 result.warning='BNB: Nur freies BNB auf der BNB Smart Chain erfasst. Delegationen, Beacon Chain und BEP-20-Vaults sind nicht vollständig scanbar.';
 return result;
}
