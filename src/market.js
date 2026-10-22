import {requestJSON,TTL} from './request-cache.js';
import {readTrustLines,readTrustLineBalance} from './xrpl-assets.js';
import {scanBitcoinAccount} from './bitcoin-hd.js';
import {atomicDecimal,units,exact} from './decimal.js';
import {discoverCosmos,cosmosLiquidExact,cosmosStakeExact,discoverHedera,hederaBalanceExact,discoverNear,nearAccountBalances,discoverBnb,bnbLiquidExact} from './native-staking-networks.js';
import {SAVAX_CONTRACT,AVALANCHE_RPC,SONIC_RPC,evmTokenBalanceExact,discoverSonicWallet,sonicNativeBalanceExact,sonicStakeBalanceExact,discoverSolanaStakes,solanaStakeBalanceExact} from './staking-discovery.js';
import {discoverBnbTokens,bnbBep20BalanceExact} from './bnb-token-scanner.js';
import {solanaRpcRead} from './solana-rpc.js';
import {ethereumNativeExact,ethereumTokenExact,discoverEthereumLsts} from './ethereum-fallback.js';
const DEFAULT_SOL_RPC='https://solana-rpc.publicnode.com';
export const POPULAR_COINS=[['bitcoin','BTC','Bitcoin'],['ethereum','ETH','Ethereum'],['solana','SOL','Solana'],['ripple','XRP','XRP'],['tether','USDT','Tether'],['usd-coin','USDC','USDC'],['binancecoin','BNB','BNB'],['cardano','ADA','Cardano'],['dogecoin','DOGE','Dogecoin'],['tron','TRX','TRON'],['chainlink','LINK','Chainlink'],['avalanche-2','AVAX','Avalanche'],['polkadot','DOT','Polkadot'],['litecoin','LTC','Litecoin'],['bitcoin-cash','BCH','Bitcoin Cash'],['stellar','XLM','Stellar'],['uniswap','UNI','Uniswap'],['aave','AAVE','Aave'],['near','NEAR','NEAR Protocol'],['sui','SUI','Sui'],['pepe','PEPE','Pepe'],['shiba-inu','SHIB','Shiba Inu'],['render-token','RENDER','Render'],['cosmos','ATOM','Cosmos'],['arbitrum','ARB','Arbitrum'],['optimism','OP','Optimism']].map(([id,symbol,name])=>({id,symbol,name}));
async function json(url,opts={},fetcher=globalThis.fetch){return requestJSON(url,{...opts,fetcher});}
function cgHeaders(key){return key?{'x-cg-demo-api-key':key}:{};}
export async function coinCatalog(key='',fetcher=globalThis.fetch){const a=await json('https://api.coingecko.com/api/v3/coins/list?include_platform=false',{headers:cgHeaders(key),ttlMs:TTL.catalog},fetcher);if(!Array.isArray(a))throw Error('Ungültiger CoinGecko-Katalog.');return a.map(x=>({id:String(x.id||''),symbol:String(x.symbol||'').toUpperCase(),name:String(x.name||'')}));}
export function searchCatalog(catalog,query){const q=query.trim().toLowerCase();if(!q)return catalog.slice(0,16);return catalog.filter(c=>c.id.toLowerCase().includes(q)||c.symbol.toLowerCase().includes(q)||c.name.toLowerCase().includes(q)).sort((a,b)=>Number(b.symbol.toLowerCase()===q)-Number(a.symbol.toLowerCase()===q)).slice(0,30);}
/** Quote freshness is based on provider time, not the time the app last fetched it. */
export function coinQuoteFreshness(item,now=Date.now()){
 const reported=Number(item?.last_updated_at);
 if(!Number.isFinite(reported)||reported<=0)return {ok:true,dated:false};
 const timestamp=reported*1000;
 if(timestamp>now+86400000)return {ok:false,reason:'CoinGecko-Kursdatum liegt in der Zukunft.'};
 if(now-timestamp>7*86400000)return {ok:false,reason:'CoinGecko-Kurs vom '+new Date(timestamp).toISOString().slice(0,10)+' ist älter als 7 Tage.'};
 return {ok:true,dated:true};
}
export async function cryptoPrices(ids,key='',fetcher=globalThis.fetch){
 const unique=[...new Set(ids.filter(Boolean))].slice(0,500);
 if(!unique.length)return {};
 const result={},failures=[];let passed=0;
 for(let i=0;i<unique.length;i+=75){
   const url=new URL('https://api.coingecko.com/api/v3/simple/price');
   url.searchParams.set('ids',unique.slice(i,i+75).join(','));url.searchParams.set('vs_currencies','eur');url.searchParams.set('include_last_updated_at','true');
   try{Object.assign(result,await json(url.toString(),{headers:cgHeaders(key),ttlMs:TTL.crypto},fetcher));passed++;}
   catch(e){failures.push(e.message);}
 }
 if(!passed&&failures.length)throw Error(failures[0]);
 if(failures.length)Object.defineProperty(result,'partialFailures',{value:failures,enumerable:false});
 return result;
}
export async function searchSecurities(term,key,fetcher=globalThis.fetch){if(!key)throw Error('Für die Wertpapiersuche bitte in „Mehr“ einen eigenen Twelve-Data-Schlüssel hinterlegen.');const url=new URL('https://api.twelvedata.com/symbol_search');url.searchParams.set('symbol',term);url.searchParams.set('apikey',key);const res=await json(url.toString(),{ttlMs:TTL.catalog},fetcher);if(!Array.isArray(res.data))return [];
  const ranking=x=>{const exchange=String(x.exchange||'').toLowerCase(),type=String(x.instrument_type||x.type||'').toLowerCase();
    return (type.includes('etf')?0:10)+(exchange.includes('xetra')?0:exchange.includes('vienna')||exchange.includes('wien')?1:exchange.includes('euronext')?2:exchange.includes('nasdaq')||exchange.includes('nyse')?8:4);
  };
  return res.data.slice().sort((a,b)=>ranking(a)-ranking(b)).slice(0,30);}
export async function securityPrice(symbol,key,fetcher=globalThis.fetch){if(!key)throw Error('Twelve-Data-Schlüssel fehlt.');const url=new URL('https://api.twelvedata.com/price');url.searchParams.set('symbol',symbol);url.searchParams.set('apikey',key);const res=await json(url.toString(),{ttlMs:TTL.security},fetcher);const price=Number(res.price);if(!Number.isFinite(price)||price<0)throw Error('Kein gültiger Kurs geliefert.');return price;}
/**
 * A strictly matched Twelve Data quote. Ticker alone must never certify a listing.
 * /quote supplies symbol, exchange, currency, datetime and usually a close price.
 * Returns a rejected promise rather than quietly applying a different listing.
 */
export async function securityQuote(listing,key,fetcher=globalThis.fetch){
 if(!key)throw Error('Twelve-Data-Schlüssel fehlt.');
 const symbol=String(listing?.symbol||'').trim().toUpperCase();
 const expectedCurrency=String(listing?.currency||'').trim().toUpperCase();
 const exchange=String(listing?.exchange||'').trim();
 const mic=String(listing?.mic||'').trim().toUpperCase();
 if(!symbol||!expectedCurrency||(!exchange&&!mic))throw Error('Handelsplatz (oder MIC) und Kurswährung müssen für automatische Kurse bestätigt sein.');
 const url=new URL('https://api.twelvedata.com/quote');
 url.searchParams.set('symbol',symbol);
 if(exchange)url.searchParams.set('exchange',exchange);
 if(mic)url.searchParams.set('mic_code',mic);
 url.searchParams.set('apikey',key);
 const data=await json(url.toString(),{ttlMs:TTL.security},fetcher);
 const price=Number(data.close??data.price);
 if(!Number.isFinite(price)||price<=0)throw Error('Kein gültiger Wertpapierkurs.');
 if(String(data.symbol||'').trim().toUpperCase()!==symbol)throw Error('Ticker der Kursantwort passt nicht zur Position.');
 if(String(data.currency||'').trim().toUpperCase()!==expectedCurrency)throw Error('Kurswährung weicht ab; Aktualisierung nicht übernommen.');
 const returnedMIC=String(data.mic_code||data.mic||'').trim().toUpperCase();
 const returnedExchange=String(data.exchange||'').trim().toUpperCase();
 if(mic&&returnedMIC!==mic)throw Error('Börsen-MIC konnte nicht eindeutig bestätigt werden.');
 if(exchange&&(!returnedExchange||returnedExchange!==exchange.toUpperCase()))throw Error('Handelsplatz stimmt nicht mit der Kursantwort überein.');
 const reportedIsin=String(data.isin||'').trim().toUpperCase();
 if(reportedIsin&&listing.isin&&reportedIsin!==String(listing.isin).toUpperCase())throw Error('ISIN der Kursantwort weicht ab.');
 return {price,currency:expectedCurrency,exchange:data.exchange||exchange,mic:returnedMIC||mic,
  asOf:String(data.datetime||data.timestamp||data.date||'')||null,source:'Twelve Data',quality:'verified-listing'};
}
/** Daily reference rate with its actual publication date; not a broker execution rate. */
export async function exchangeRateQuote(from,key='',fetcher=globalThis.fetch){
 if(from==='EUR')return {rate:1,date:new Date().toISOString().slice(0,10),source:'identity',reference:true};
 if(!/^[A-Z]{3}$/.test(from))throw Error('Ungültige Währung.');
 if(!key){
   const url=new URL('https://api.frankfurter.dev/v1/latest');
   url.searchParams.set('base',from);url.searchParams.set('symbols','EUR');
   const data=await json(url.toString(),{ttlMs:TTL.fx},fetcher);
   const rate=Number(data.rates?.EUR);
   if(!(rate>0)||!/^(?:19|20)\d{2}-\d{2}-\d{2}$/.test(String(data.date||'')))throw Error('Kein datierter kostenloser Tageswechselkurs verfügbar.');
   return {rate,date:data.date,source:'Frankfurter',reference:true};
 }
 const url=new URL('https://api.twelvedata.com/exchange_rate');
 url.searchParams.set('symbol',`${from}/EUR`);url.searchParams.set('apikey',key);
 const data=await json(url.toString(),{ttlMs:TTL.fx},fetcher);
 const rate=Number(data.rate);
 if(!(rate>0))throw Error(`Kein Wechselkurs für ${from}/EUR.`);
 return {rate,date:String(data.datetime||data.date||'')||null,source:'Twelve Data',reference:false};
}
export async function exchangeRate(from,key='',fetcher=globalThis.fetch){
 // The numeric compatibility method remains available for v1/v2 clients/tests.
 if(from==='EUR')return 1;
 if(!/^[A-Z]{3}$/.test(from))throw Error('Ungültige Währung.');
 if(!key){
  const url=new URL('https://api.frankfurter.dev/v1/latest');
  url.searchParams.set('base',from);url.searchParams.set('symbols','EUR');
  const data=await json(url.toString(),{ttlMs:TTL.fx},fetcher);
  const rate=Number(data.rates?.EUR);
  if(!(rate>0))throw Error('Kein kostenloser Tageswechselkurs verfügbar.');
  return rate;
 }
 const url=new URL('https://api.twelvedata.com/exchange_rate');
 url.searchParams.set('symbol',`${from}/EUR`);url.searchParams.set('apikey',key);
 const data=await json(url.toString(),{ttlMs:TTL.fx},fetcher);
 const rate=Number(data.rate);
 if(!(rate>0))throw Error(`Kein Wechselkurs für ${from}/EUR.`);
 return rate;
}
/** Uses Frankfurter historical DAILY reference rate, including previous workday fallback. */
export async function historicalExchangeRate(from,date,fetcher=globalThis.fetch){
 if(!/^(?:19|20)\d{2}-\d{2}-\d{2}$/.test(String(date))||Number.isNaN(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Historisches Datum ungültig.');
 if(date>new Date().toISOString().slice(0,10))throw Error('Wechselkursdatum liegt in der Zukunft.');
 if(from==='EUR')return {rate:1,date,requestedDate:date,source:'identity',reference:true};
 if(!/^[A-Z]{3}$/.test(from))throw Error('Ungültige Währung.');
 const url=new URL('https://api.frankfurter.dev/v1/'+date);
 url.searchParams.set('base',from);url.searchParams.set('symbols','EUR');
 const data=await json(url.toString(),{ttlMs:TTL.history},fetcher),rate=Number(data.rates?.EUR);
 const actual=String(data.date||'');
 if(!(rate>0)||!/^(?:19|20)\d{2}-\d{2}-\d{2}$/.test(actual)||actual>date||(Date.parse(date)-Date.parse(actual))/86400000>7)throw Error('Kein gültiger historischer Tagesreferenzkurs verfügbar.');
 return {rate,date:actual,requestedDate:date,source:'Frankfurter',reference:true};
}
export async function xrpBalance(address,fetcher=globalThis.fetch){
 if(!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(String(address)))throw Error('Ungültige XRP-Adresse.');
 const data=await json('https://xrplcluster.com',{ttlMs:TTL.wallet,method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'account_info',params:[{account:address,ledger_index:'validated'}]})},fetcher);
 if(data.result?.error)throw Error('XRPL: '+String(data.result.error_message||data.result.error));
 const drops=data.result?.account_data?.Balance;
 if(!/^\d+$/.test(String(drops??'')))throw Error('XRPL-Guthaben fehlt – vorhandene Daten bleiben erhalten.');
 return Number(drops)/1e6;
}
export async function btcBalance(address,fetcher=globalThis.fetch){const data=await json('https://blockstream.info/api/address/'+encodeURIComponent(address),{ttlMs:TTL.wallet},fetcher);const c=data.chain_stats,m=data.mempool_stats;if(!c||!m||![c.funded_txo_sum,c.spent_txo_sum,m.funded_txo_sum,m.spent_txo_sum].every(n=>Number.isSafeInteger(n)&&n>=0))throw Error('Unvollständige Bitcoin-Antwort. Letzter Bestand bleibt erhalten.');const sats=c.funded_txo_sum-c.spent_txo_sum+m.funded_txo_sum-m.spent_txo_sum;if(!Number.isFinite(sats)||sats<0)throw Error('Ungültiger Bitcoin-Kontostand.');return sats/1e8;}
async function etherscan(params,key,fetcher){if(!key)throw Error('Für EVM-Wallets bitte einen eigenen Etherscan-Schlüssel unter „Mehr“ eintragen.');const url=new URL('https://api.etherscan.io/v2/api');for(const [k,v]of Object.entries(params))url.searchParams.set(k,String(v));url.searchParams.set('apikey',key);const r=await json(url.toString(),{},fetcher);if(r.status==='0')throw Error(String(r.result||r.message||'Etherscan-Fehler'));return r.result;}
export async function evmBalance(wallet,key,fetcher=globalThis.fetch){const query={chainid:wallet.chainId||1,module:'account',action:wallet.chain==='erc20'?'tokenbalance':'balance',address:wallet.address,tag:'latest'};if(wallet.chain==='erc20')query.contractaddress=wallet.contract;const balance=await etherscan(query,key,fetcher);if(!/^\d+$/.test(String(balance)))throw Error('Ungültige Blockchain-Antwort.');return Number(balance)/10**Number(wallet.decimals||18);}
export async function solBalance(wallet,rpc=DEFAULT_SOL_RPC,fetcher=globalThis.fetch){const url=new URL(rpc);if(url.protocol!=='https:')throw Error('Solana-RPC muss HTTPS verwenden.');const method=wallet.chain==='spl'?'getTokenAccountsByOwner':'getBalance';const params=wallet.chain==='spl'?[wallet.address,{mint:wallet.contract},{encoding:'jsonParsed'}]:[wallet.address,{commitment:'confirmed'}];const r=await json(url.toString(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})},fetcher);if(r.error)throw Error(r.error.message||'Solana-RPC-Fehler');if(wallet.chain==='spl'){const accounts=r.result?.value;if(!Array.isArray(accounts))throw Error('Unvollständige Solana-Token-Antwort.');return accounts.reduce((sum,a)=>{const amount=Number(a.account?.data?.parsed?.info?.tokenAmount?.uiAmountString);if(!Number.isFinite(amount)||amount<0)throw Error('Ungültiger Token-Bestand.');return sum+amount;},0);}const balance=r.result?.value;if(!Number.isSafeInteger(balance)||balance<0)throw Error('Unvollständige Solana-Antwort.');return balance/1e9;}
export async function walletBalance(wallet,settings,fetcher=globalThis.fetch){if(!wallet?.enabled)throw Error('Kein Wallet konfiguriert.');if(['sol','spl','sol-stake','sonic-stake','cosmos','cosmos-stake','cosmos-unbonding','hedera','near','near-locked'].includes(wallet.chain)||(['evm','erc20'].includes(wallet.chain)&&Number(wallet.chainId)===56)||Number(wallet.chainId)===146||(Number(wallet.chainId)===43114&&String(wallet.contract||'').toLowerCase()===SAVAX_CONTRACT))return Number(await walletBalanceExact(wallet,settings,fetcher));switch(wallet.chain){case 'btc':return btcBalance(wallet.address,fetcher);case 'btc-hd':return Number((await scanBitcoinAccount(wallet.address,{fetcher})).quantityExact);case 'xrp':return xrpBalance(wallet.address,fetcher);case 'xrp-token':return Number(await readTrustLineBalance(wallet.address,wallet.contract,fetcher));case 'evm':case 'erc20':{if(PUBLIC_EVM_NETWORKS[wallet.chainId]?.explorer!==false){const chain=PUBLIC_EVM_NETWORKS[wallet.chainId];if(chain){const address=encodeURIComponent(wallet.address);if(wallet.chain==='evm'){const data=await json(chain.host+'/api/v2/addresses/'+address,{ttlMs:TTL.wallet},fetcher);if(!/^\d+$/.test(String(data.coin_balance??'')))throw Error('Unvollständige Blockchain-Antwort.');const amount=Number(data.coin_balance)/1e18;if(Number.isFinite(amount)&&amount>=0)return amount;throw Error('Ungültiger öffentlicher Explorer-Saldo.');}const list=await json(chain.host+'/api/v2/addresses/'+address+'/token-balances',{ttlMs:TTL.wallet},fetcher);if(!Array.isArray(list))throw Error('Token-Saldo ungültig.');const item=list.find(t=>String(t.token?.address_hash||t.token?.address||'').toLowerCase()===String(wallet.contract||'').toLowerCase());return item?Number(item.value)/10**Number(item.token?.decimals??wallet.decimals):0;}}return evmBalance(wallet,settings.etherscanKey,fetcher);}case 'sol':case 'spl':return solBalance(wallet,settings.solanaRpc||DEFAULT_SOL_RPC,fetcher);default:throw Error('Blockchain noch nicht unterstützt.');}}

// Public explorer instances (not the paid Blockscout PRO API). These endpoints
// have their own rate limits and may be inaccessible from some browsers.
export const PUBLIC_EVM_NETWORKS = {
  1: {name:'Ethereum', host:'https://eth.blockscout.com', symbol:'ETH', coinId:'ethereum'},
  8453: {name:'Base', host:'https://base.blockscout.com', symbol:'ETH', coinId:'ethereum'},
  42161: {name:'Arbitrum', host:'https://arbitrum.blockscout.com', symbol:'ETH', coinId:'ethereum'},
  10: {name:'Optimism', host:'https://optimism.blockscout.com', symbol:'ETH', coinId:'ethereum'},
  137: {name:'Polygon', host:'https://polygon.blockscout.com', symbol:'POL', coinId:'polygon-ecosystem-token'},
  43114:{name:'Avalanche C-Chain',host:'https://cccscan.org',symbol:'AVAX',coinId:'avalanche-2'},
  146:{name:'Sonic Mainnet',rpc:SONIC_RPC,symbol:'S',coinId:'sonic-3',explorer:false},
  56: {name:'BNB Smart Chain', host:'https://bscscan.com', symbol:'BNB', coinId:'binancecoin', explorer:false}
};
const isEvmAddress=a=>/^0x[0-9a-fA-F]{40}$/.test(a);
/** Official Avalanche C-Chain fallback; invalid RPC data must never turn into zero. */
export async function avalancheNativeBalanceExact(address,fetcher=globalThis.fetch){
 if(!isEvmAddress(address))throw Error('Ungültige öffentliche Avalanche-Adresse.');
 const payload={jsonrpc:'2.0',id:1,method:'eth_getBalance',params:[address,'latest']};
 const response=await json('https://api.avax.network/ext/bc/C/rpc',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify(payload),ttlMs:TTL.wallet
 },fetcher);
 if(response?.error)throw Error('Avalanche-RPC: '+String(response.error.message||'Blockchain-Abfrage fehlgeschlagen.'));
 if(!/^0x[0-9a-f]+$/i.test(String(response?.result??'')))throw Error('Avalanche-RPC: Unvollständiger Saldo. Bestehender Bestand bleibt erhalten.');
 return atomicDecimal(BigInt(response.result).toString(),18);
}
const solanaPrograms=['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'];
const rpcCall=async (rpc, method, params, fetcher)=>{
  const url=new URL(rpc);
  if(url.protocol!=='https:' || url.username || url.password)throw Error('Nur HTTPS-RPC ohne URL-Zugangsdaten unterstützt.');
  const result=await json(url.toString(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})},fetcher);
  if(result.error)throw Error(result.error.message||'RPC-Abfrage fehlgeschlagen');
  if(!result.result)throw Error('Leere Blockchain-Antwort');
  return result.result;
};
// Returns discovered holdings, not wallet secrets or signed transactions.
export async function discoverWallet(network,address,settings={},fetcher=globalThis.fetch){
  const a=String(address||'').trim();
  if(/^(xprv|yprv|zprv)/i.test(a)||/\b(seed|mnemonic|private key)\b/i.test(a))throw Error('Niemals private Schlüssel oder Seed-Phrases eingeben.');
  if(network==='btc-hd'){
    const result=await scanBitcoinAccount(a,{fetcher,addressType:settings.hdAddressType||'auto'});
    const quantity=Number(result.quantityExact);
    return quantity>0?[{name:'Bitcoin HD (Watch-only)',symbol:'BTC',coinId:'bitcoin',quantity,quantityExact:result.quantityExact,chain:'btc-hd',addressType:result.addressType,decimals:8,complete:result.complete}]:[];
  }
  if(network==='btc'){
    if(!/^(bc1[ac-hj-np-z02-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{24,47})$/.test(a))throw Error('Bitte eine gültige einzelne Bitcoin-Adresse eingeben (kein xpub).');
    const quantityExact=await walletBalanceExact({enabled:true,chain:'btc',address:a},settings,fetcher);
    const quantity=Number(quantityExact);
    return quantity>0?[{name:'Bitcoin',symbol:'BTC',coinId:'bitcoin',quantity,quantityExact,chain:'btc',decimals:8}]:[];
  }
  if(network==='xrp'){
    if(!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a))throw Error('Ungültige XRP-Adresse.');
    const quantityExact=await walletBalanceExact({enabled:true,chain:'xrp',address:a},settings,fetcher);
    const quantity=Number(quantityExact);
    const result=quantity>0?[{name:'XRP',symbol:'XRP',coinId:'ripple',quantity,quantityExact,chain:'xrp',decimals:6}]:[];
    try{result.push(...await readTrustLines(a,fetcher));}
    catch(e){if(!result.length)throw e;result.partial=true;result.warning='XRP bekannt, aber Trust-Line-Scan fehlgeschlagen: '+e.message;}
    return result;
  }
  if(network==='cosmos')return discoverCosmos(a,fetcher);
  if(network==='hedera')return discoverHedera(a,fetcher);
  if(network==='near')return discoverNear(a,fetcher);
  if(String(network)==='56')return discoverBnbTokens(a,settings,fetcher);
  if(String(network)==='146')return discoverSonicWallet(a,fetcher);
  if(network==='sol'){
    if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a))throw Error('Ungültige Solana-Adresse.');
    const rpc=settings.solanaRpc||DEFAULT_SOL_RPC;
    let fallbackUsed=false;
    const read=async(method,params)=>{const r=await solanaRpcRead(rpc,method,params,fetcher);if(r.fallback)fallbackUsed=true;return r.result;};
    const native=await read('getBalance',[a,{commitment:'confirmed'}]);
    const assets=[];const quantityExact=atomicDecimal(native?.value,9),quantity=Number(quantityExact);
    if(quantity>0)assets.push({name:'Solana',symbol:'SOL',coinId:'solana',quantity,quantityExact,chain:'sol',decimals:9});
    let successfulPrograms=0;const failures=[];
    for(const programId of solanaPrograms){
      try{
        const data=await read('getTokenAccountsByOwner',[a,{programId},{encoding:'jsonParsed'}]);
        if(!Array.isArray(data?.value))throw Error('Solana-Tokenkonten unvollständig.');
        successfulPrograms++;
        for(const row of data.value){
          const info=row.account?.data?.parsed?.info;const mint=info?.mint;
          if(!mint||!String(mint).match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/))continue;
          const decimals=Number(info.tokenAmount?.decimals);
          if(!Number.isInteger(decimals)||decimals<0||decimals>30)throw Error('Ungültige SPL-Token-Decimals.');
          const tokenExact=atomicDecimal(info.tokenAmount?.amount,decimals);
          if(units(tokenExact)<=0n)continue;
          const existing=assets.find(x=>x.chain==='spl'&&x.contract===mint);
          if(existing){
            if(existing.decimals!==decimals)throw Error('Widersprüchliche SPL-Token-Decimals.');
            existing.quantityExact=exact(units(existing.quantityExact)+units(tokenExact));
            existing.quantity=Number(existing.quantityExact);
          }else assets.push({name:'Solana Token '+mint.slice(0,6)+'…',symbol:mint.slice(0,6)+'…',coinId:'',quantity:Number(tokenExact),quantityExact:tokenExact,chain:'spl',contract:mint,decimals});
        }
      }catch(error){failures.push(error.message);}
    }
    try{assets.push(...await discoverSolanaStakes(a,rpc,fetcher));}
    catch(error){failures.push('Stake-Accounts: '+error.message+' · Für natives Solana-Staking unter Mehr einen eigenen, für getProgramAccounts freigeschalteten Solana-RPC eintragen.');}
    if(!successfulPrograms&&!assets.length)throw Error('Solana-Token und Staking konnten nicht abgerufen werden: '+failures.join(' / '));
    if(failures.length){assets.partial=true;assets.warning='Solana-Teilscan unvollständig ('+failures.join(' · ')+'). Vorhandene Bestände bleiben erhalten.';}
    else if(fallbackUsed)assets.warning='Solana: öffentlicher Ersatz-RPC erfolgreich verwendet; eigener RPC unter Mehr konfigurierbar.';
    return assets;
  }
  const chainId=Number(network);
  const chain=PUBLIC_EVM_NETWORKS[chainId];
  if(!chain?.explorer && chain?.explorer!==undefined)throw Error('Für dieses Netzwerk steht aktuell kein öffentlicher Explorer-Import zur Verfügung.');
  if(!chain||!isEvmAddress(a))throw Error('Bitte ein unterstütztes EVM-Netzwerk und eine gültige öffentliche 0x-Adresse wählen.');
  const base=chain.host+'/api/v2/addresses/'+encodeURIComponent(a);
  let info=null,explorerIssue=null;
  try{info=await json(base,{ttlMs:TTL.wallet},fetcher);}catch(error){explorerIssue=error;}
  if(explorerIssue&&chainId!==43114&&chainId!==1)throw explorerIssue;
  let raw=[],tokenFailure='';try{raw=await json(base+'/token-balances',{ttlMs:TTL.wallet,attempts:1,timeoutMs:8500},fetcher);if(!Array.isArray(raw))throw Error('Unerwartete Token-Antwort.');}catch(e){raw=[];tokenFailure=e.message;}
  const assets=[];let nativeExact;
  try{nativeExact=atomicDecimal(info?.coin_balance,18);}
  catch(error){
    if(chainId===43114)nativeExact=await avalancheNativeBalanceExact(a,fetcher);
    else if(chainId===1)nativeExact=await ethereumNativeExact(a,fetcher);
    else throw error;
  }
  const native=Number(nativeExact);
  if(native>0)assets.push({name:chain.name==='Polygon'?'POL':chain.symbol,symbol:chain.symbol,coinId:chain.coinId,quantity:native,quantityExact:nativeExact,chain:'evm',chainId,decimals:18});
  let tokenIssues=0;
  for(const row of raw.slice(0,500)){
    const token=row.token||{};
    const contract=String(token.address_hash||token.address||'');
    const decimals=Number(token.decimals);
    if(token.type!=='ERC-20')continue;
    if(!isEvmAddress(contract)||!Number.isInteger(decimals)||decimals<0||decimals>30){tokenIssues++;continue;}
    let quantityExact;
    try{quantityExact=atomicDecimal(row.value,decimals);}catch{tokenIssues++;continue;}
    if(units(quantityExact)<=0n)continue;
    const symbol=String(token.symbol||'Token').slice(0,32);
    assets.push({name:String(token.name||symbol).slice(0,100),symbol,coinId:'',quantity:Number(quantityExact),quantityExact,chain:'erc20',chainId,contract,decimals,reputation:String(token.reputation||'')});
  }
  if(chainId===43114&&!assets.some(x=>x.chain==='erc20'&&String(x.contract).toLowerCase()===SAVAX_CONTRACT)){
    try{
      const sav=await evmTokenBalanceExact(AVALANCHE_RPC,SAVAX_CONTRACT,a,fetcher);
      if(Number(sav)>0)assets.push({name:'BENQI Staked AVAX',symbol:'sAVAX',coinId:'',quantity:Number(sav),quantityExact:sav,chain:'erc20',chainId:43114,contract:SAVAX_CONTRACT,decimals:18});
    }catch(e){tokenFailure=[tokenFailure,'BENQI sAVAX: '+e.message].filter(Boolean).join(' · ');}
  }
  if(chainId===1&&tokenFailure){
    try{
      const {assets:known,errors:lstErrors}=await discoverEthereumLsts(a,fetcher);
      for(const token of known)if(!assets.some(x=>x.chain==='erc20'&&String(x.contract||'').toLowerCase()===token.contract))assets.push(token);
      if(lstErrors.length)tokenFailure+=' · LST-Contract-Abfragen: '+lstErrors.length+' fehlgeschlagen';
    }catch(error){tokenFailure+=' · Ethereum-LST-RPC: '+error.message;}
  }
  if(tokenFailure&& !assets.length)throw Error('Token-Liste nicht verfügbar: '+tokenFailure);
  if(tokenFailure||raw.length>=500||tokenIssues){
    assets.partial=true;
    assets.warning=[tokenFailure&&'Token-Abfrage fehlgeschlagen',raw.length>=500&&'Tokenliste möglicherweise abgeschnitten',tokenIssues&&'einzelne Token-Rohwerte ungültig'].filter(Boolean).join(' · ')+'. Vollständigkeit nicht bestätigt.';
  }
  return assets;
}

// Keyless market-data requests, with strict boundaries: this does not imply
// every token will have a quote or that public endpoints guarantee uptime.
export async function evmContractPrices(chainId,contracts,key='',fetcher=globalThis.fetch){
  const platform={1:'ethereum',8453:'base',42161:'arbitrum-one',10:'optimistic-ethereum',137:'polygon-pos',43114:'avalanche',146:'sonic',56:'binance-smart-chain'}[Number(chainId)];
  if(!platform)return {};
  const items=[...new Set(contracts.map(c=>String(c||'').toLowerCase()).filter(isEvmAddress))];
  if(!items.length)return {};
  const result={};
  for(let i=0;i<items.length;i+=30){
    const url=new URL('https://api.coingecko.com/api/v3/simple/token_price/'+platform);
    url.searchParams.set('contract_addresses',items.slice(i,i+30).join(','));url.searchParams.set('vs_currencies','eur');
    Object.assign(result,await json(url.toString(),{headers:cgHeaders(key),ttlMs:TTL.crypto},fetcher));
  }
  return result;
}

/** Exact string balances: no JS Number conversion before parsing blockchain atomics. */
export async function walletBalanceExact(wallet,settings={},fetcher=globalThis.fetch){
 if(!wallet?.enabled)throw Error('Kein Wallet konfiguriert.');
 if(wallet.chain==='cosmos')return cosmosLiquidExact(wallet.address,fetcher);
 if(['cosmos-stake','cosmos-unbonding'].includes(wallet.chain))return cosmosStakeExact(wallet.address,wallet.contract,wallet.chain,fetcher);
 if(wallet.chain==='hedera')return hederaBalanceExact(wallet.address,fetcher);
 if(['near','near-locked'].includes(wallet.chain)){const values=await nearAccountBalances(wallet.address,fetcher);return wallet.chain==='near'?values.liquid:values.locked;}
 if(wallet.chain==='evm'&&Number(wallet.chainId)===56)return bnbLiquidExact(wallet.address,fetcher);
 if(wallet.chain==='erc20'&&Number(wallet.chainId)===56)return (await bnbBep20BalanceExact(wallet.contract,wallet.address,fetcher,wallet.decimals)).quantityExact;
 if(wallet.chain==='sol')return atomicDecimal((await solanaRpcRead(settings.solanaRpc||DEFAULT_SOL_RPC,'getBalance',[wallet.address,{commitment:'confirmed'}],fetcher)).result.value,9);
 if(wallet.chain==='spl'){
  const {result}=await solanaRpcRead(settings.solanaRpc||DEFAULT_SOL_RPC,'getTokenAccountsByOwner',[wallet.address,{mint:wallet.contract},{encoding:'jsonParsed'}],fetcher);
  let total=0n,decimals=null;
  for(const row of result.value){
   const token=row.account?.data?.parsed?.info?.tokenAmount;
   if(!token||!/^\d+$/.test(String(token.amount))||!Number.isInteger(token.decimals))throw Error('Solana-SPL-Rohbetrag unvollständig.');
   if(decimals!==null&&decimals!==token.decimals)throw Error('Solana-SPL-Decimals widersprüchlich.');
   decimals=token.decimals;total+=BigInt(token.amount);
  }
  return atomicDecimal(total.toString(),decimals??wallet.decimals??9);
 }
 if(wallet.chain==='sol-stake')return solanaStakeBalanceExact(wallet,settings.solanaRpc||DEFAULT_SOL_RPC,fetcher);
 if(wallet.chain==='sonic-stake')return sonicStakeBalanceExact(wallet.address,wallet.contract,fetcher);
 if(wallet.chain==='evm'&&Number(wallet.chainId)===146)return sonicNativeBalanceExact(wallet.address,fetcher);
 if(wallet.chain==='erc20'&&Number(wallet.chainId)===146)return evmTokenBalanceExact(SONIC_RPC,wallet.contract,wallet.address,fetcher,Number(wallet.decimals??18));
 if(wallet.chain==='erc20'&&Number(wallet.chainId)===43114&&String(wallet.contract||'').toLowerCase()===SAVAX_CONTRACT)return evmTokenBalanceExact(AVALANCHE_RPC,SAVAX_CONTRACT,wallet.address,fetcher);
 if(wallet.chain==='btc-hd')return (await scanBitcoinAccount(wallet.address,{fetcher,addressType:wallet.addressType||'auto'})).quantityExact;
 if(wallet.chain==='xrp-token')return readTrustLineBalance(wallet.address,wallet.contract,fetcher);
 if(wallet.chain==='btc'){
  const d=await json('https://blockstream.info/api/address/'+encodeURIComponent(wallet.address),{ttlMs:TTL.wallet},fetcher),c=d.chain_stats,m=d.mempool_stats;
  if(!c||!m||![c.funded_txo_sum,c.spent_txo_sum,m.funded_txo_sum,m.spent_txo_sum].every(x=>Number.isSafeInteger(x)&&x>=0))throw Error('Bitcoin-Explorer-Saldo unvollständig.');
  const sat=BigInt(c.funded_txo_sum)-BigInt(c.spent_txo_sum)+BigInt(m.funded_txo_sum)-BigInt(m.spent_txo_sum);
  if(sat<0n)throw Error('Unplausibler Bitcoin-Saldo.');
  return atomicDecimal(sat.toString(),8);
 }
 if(wallet.chain==='xrp'){
  const d=await json('https://xrplcluster.com',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'account_info',params:[{account:wallet.address,ledger_index:'validated'}]}),ttlMs:TTL.wallet},fetcher);
  if(d.result?.error)throw Error('XRPL: '+String(d.result.error_message||d.result.error));
  return atomicDecimal(d.result?.account_data?.Balance,6);
 }
 if(wallet.chain==='evm'||wallet.chain==='erc20'){
  const chain=PUBLIC_EVM_NETWORKS[wallet.chainId||1];
  if(!chain||chain.explorer===false){
   if(!settings.etherscanKey)throw Error('Ohne öffentlichen Explorer wird ein eigener Etherscan-Key benötigt.');
   const query={chainid:wallet.chainId||1,module:'account',action:wallet.chain==='erc20'?'tokenbalance':'balance',address:wallet.address,tag:'latest'};
   if(wallet.chain==='erc20')query.contractaddress=wallet.contract;
   return atomicDecimal(await etherscan(query,settings.etherscanKey,fetcher),wallet.chain==='erc20'?Number(wallet.decimals):18);
  }
  const base=chain.host+'/api/v2/addresses/'+encodeURIComponent(wallet.address);
  if(wallet.chain==='evm'){
   try{const d=await json(base,{ttlMs:TTL.wallet},fetcher);return atomicDecimal(d?.coin_balance,18);}
   catch(error){
    if(Number(wallet.chainId||1)===43114)return avalancheNativeBalanceExact(wallet.address,fetcher);
    if(Number(wallet.chainId||1)===1)return ethereumNativeExact(wallet.address,fetcher);
    throw error;
   }
  }
  let list;
  try{
   list=await json(base+'/token-balances',{ttlMs:TTL.wallet,attempts:1,timeoutMs:8500},fetcher);
   if(!Array.isArray(list)||list.length>=500)throw Error('Explorer-Tokenliste nicht vollständig.');
  }catch(error){
   if(Number(wallet.chainId||1)===1)return ethereumTokenExact(wallet.address,wallet.contract,Number(wallet.decimals),fetcher);
   throw error;
  }
  const item=list.find(t=>String(t.token?.address_hash||t.token?.address||'').toLowerCase()===String(wallet.contract||'').toLowerCase());
  return item?atomicDecimal(item.value,Number(item.token?.decimals??wallet.decimals)):'0';
 }
 if(['sol','spl'].includes(wallet.chain)){
  const url=new URL(settings.solanaRpc||DEFAULT_SOL_RPC);
  if(url.protocol!=='https:'||url.username||url.password)throw Error('Solana-RPC muss HTTPS ohne URL-Schlüssel nutzen.');
  const isToken=wallet.chain==='spl';
  const method=isToken?'getTokenAccountsByOwner':'getBalance';
  const params=isToken?[wallet.address,{mint:wallet.contract},{encoding:'jsonParsed'}]:[wallet.address,{commitment:'confirmed'}];
  const r=await json(url.toString(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),ttlMs:TTL.wallet},fetcher);
  if(r.error)throw Error(r.error.message||'Solana-RPC-Fehler.');
  if(!isToken)return atomicDecimal(r.result?.value,9);
  const list=r.result?.value;if(!Array.isArray(list))throw Error('SPL-Tokenkonten unvollständig.');
  const decimalCount=list[0]?.account?.data?.parsed?.info?.tokenAmount?.decimals??Number(wallet.decimals);
  let raw=0n;
  for(const row of list){
   const amount=row.account?.data?.parsed?.info?.tokenAmount;
   if(!amount||amount.decimals!==decimalCount||!/^\d+$/.test(String(amount.amount||'')))throw Error('SPL-Rohdaten unvollständig.');
   raw+=BigInt(amount.amount);
  }
  return atomicDecimal(raw.toString(),decimalCount);
 }
 throw Error('Blockchain nicht unterstützt.');
}
