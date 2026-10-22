/**
 * Optional, public, user-side crypto fallbacks.
 * No symbol-based discovery: each CoinGecko ID is explicitly matched to one
 * CoinPaprika ID and expected ticker; never guess a DeFi token by its name.
 * CoinPaprika free data requires attribution and is licensed for personal use.
 */
import {requestJSON,TTL} from './request-cache.js';
import {exchangeRateQuote} from './market.js';
const PAIRS=Object.freeze({
 'bitcoin':['btc-bitcoin','BTC'],'ethereum':['eth-ethereum','ETH'],
 'solana':['sol-solana','SOL'],'ripple':['xrp-xrp','XRP'],
 'chainlink':['link-chainlink','LINK'],'avalanche-2':['avax-avalanche','AVAX'],
 'cardano':['ada-cardano','ADA'],'dogecoin':['doge-dogecoin','DOGE'],
 'polkadot':['dot-polkadot','DOT'],'litecoin':['ltc-litecoin','LTC'],
 'bitcoin-cash':['bch-bitcoin-cash','BCH'],'stellar':['xlm-stellar','XLM'],
 'uniswap':['uni-uniswap','UNI'],'aave':['aave-aave','AAVE'],
 'near':['near-near-protocol','NEAR'],'sui':['sui-sui','SUI']
});
const stampValid=(date,now=Date.now(),maxAge=7*864e5)=>{
 const time=Date.parse(String(date||''));
 return Number.isFinite(time)&&time<=now+864e5&&time>=now-maxAge;
};
export function coinPaprikaMapping(p){
 const info=PAIRS[String(p?.coinId||'')];
 return info&&String(p?.symbol||'').trim().toUpperCase()===info[1]?{id:info[0],symbol:info[1]}:null;
}
function validPositivePrice(n){return Number.isFinite(n)&&n>0&&n<1e9;}
export async function coinPaprikaCurrentQuote(p,fetcher=globalThis.fetch){
 const m=coinPaprikaMapping(p);
 if(!m)throw Error('Keine bestätigte CoinPaprika-ID für diesen Coin.');
 const url='https://api.coinpaprika.com/v1/tickers/'+encodeURIComponent(m.id)+'?quotes=EUR';
 const data=await requestJSON(url,{fetcher,ttlMs:TTL.crypto,attempts:1});
 const price=Number(data?.quotes?.EUR?.price);
 if(data?.id!==m.id||String(data?.symbol||'').toUpperCase()!==m.symbol||!validPositivePrice(price))
  throw Error('CoinPaprika-Identität oder EUR-Kurs weicht ab.');
 if(!stampValid(data.last_updated))throw Error('CoinPaprika-Kursdatum fehlt oder ist veraltet.');
 return {price,source:'CoinPaprika',asOf:data.last_updated,quality:'provider-timestamp'};
}
export async function coinPaprikaHistoricalQuote(p,fetcher=globalThis.fetch,now=Date.now()){
 const m=coinPaprikaMapping(p);
 if(!m)throw Error('Keine bestätigte CoinPaprika-ID.');
 const url=new URL('https://api.coinpaprika.com/v1/tickers/'+encodeURIComponent(m.id)+'/historical');
 url.searchParams.set('start',new Date(now-366*864e5).toISOString().slice(0,10));
 url.searchParams.set('end',new Date(now).toISOString().slice(0,10));
 url.searchParams.set('interval','1d');
 url.searchParams.set('quote','EUR');
 const data=await requestJSON(url.toString(),{fetcher,ttlMs:TTL.history,attempts:1});
 if(!Array.isArray(data))throw Error('CoinPaprika-Historie fehlt oder ist im Tarif nicht freigeschaltet.');
 const values=new Map();
 for(const row of data){
  const when=Date.parse(String(row?.timestamp||'')),v=Number(row?.price);
  if(!Number.isFinite(when)||when>now+864e5||when<now-367*864e5||!validPositivePrice(v))continue;
  const day=new Date(when).toISOString().slice(0,10);
  if(values.has(day)&&values.get(day)!==v)throw Error('CoinPaprika hat widersprüchliche Tageskurse geliefert.');
  values.set(day,v);
 }
 const points=[...values].sort(([a],[b])=>a.localeCompare(b)).map(([date,total])=>({date,total}));
 if(points.length<2)throw Error('Zu wenige bestätigte EUR-Kurstage von CoinPaprika.');
 return {kind:'market',currency:'EUR',source:'CoinPaprika',points};
}
const DEFILLAMA_CHAINS=Object.freeze({1:'ethereum',10:'optimism',137:'polygon',42161:'arbitrum',43114:'avax',8453:'base'});
export function defiLlamaContractKey(p){
 if(p?.kind!=='crypto'||!['liquid-staking','lending','vault','wrapped'].includes(p.economicRole))return null;
 const w=p.wallet;
 if(!w?.enabled||w.chain!=='erc20'||!/^0x[0-9a-f]{40}$/i.test(String(w.contract||'')))return null;
 const chain=DEFILLAMA_CHAINS[Number(w.chainId)];
 return chain?chain+':'+w.contract.toLowerCase():null;
}
export async function defiLlamaCurrentQuote(p,fetcher=globalThis.fetch){
 const id=defiLlamaContractKey(p);
 if(!id)throw Error('DefiLlama benötigt einen eindeutig zugeordneten Token-Contract.');
 const data=await requestJSON('https://coins.llama.fi/prices/current/'+encodeURIComponent(id),{fetcher,ttlMs:TTL.crypto,attempts:1});
 const item=data?.coins?.[id];
 const priceUSD=Number(item?.price),confidence=Number(item?.confidence);
 if(!validPositivePrice(priceUSD)||!(confidence>=.8)||
    String(item?.symbol||'').toUpperCase()!==String(p.symbol||'').toUpperCase())
   throw Error('DefiLlama-Symbol, Kurs oder Datenqualität nicht ausreichend.');
 if(!stampValid(Number(item.timestamp)*1000,Date.now(),2*864e5))throw Error('DefiLlama-Tokenkurs ist veraltet.');
 const fx=await exchangeRateQuote('USD','',fetcher);
 if(!stampValid(fx.date,Date.now(),7*864e5)||!Number.isFinite(fx.rate)||fx.rate<=0)
  throw Error('Kein ausreichend aktueller EUR-Referenzwechselkurs.');
 const price=priceUSD*fx.rate;
 if(!validPositivePrice(price))throw Error('USD/EUR-Konvertierung unplausibel.');
 return {price,source:'DefiLlama + Frankfurter',asOf:new Date(Number(item.timestamp)*1000).toISOString(),quality:'provider-timestamp'};
}
export async function cryptoFallbackQuote(p,fetcher=globalThis.fetch){
 const errors=[];
 if(coinPaprikaMapping(p)){
  try{return await coinPaprikaCurrentQuote(p,fetcher);}catch(e){errors.push('CoinPaprika: '+e.message);}
 }
 if(defiLlamaContractKey(p)){
  try{return await defiLlamaCurrentQuote(p,fetcher);}catch(e){errors.push('DefiLlama: '+e.message);}
 }
 throw Error(errors.join(' · ')||'Keine eindeutig zugeordnete öffentliche Fallback-Quelle.');
}
