const DEFAULT_SOL_RPC='https://solana-rpc.publicnode.com';
export const POPULAR_COINS=[['bitcoin','BTC','Bitcoin'],['ethereum','ETH','Ethereum'],['solana','SOL','Solana'],['ripple','XRP','XRP'],['tether','USDT','Tether'],['usd-coin','USDC','USDC'],['binancecoin','BNB','BNB'],['cardano','ADA','Cardano'],['dogecoin','DOGE','Dogecoin'],['tron','TRX','TRON'],['chainlink','LINK','Chainlink'],['avalanche-2','AVAX','Avalanche'],['polkadot','DOT','Polkadot'],['litecoin','LTC','Litecoin'],['bitcoin-cash','BCH','Bitcoin Cash'],['stellar','XLM','Stellar'],['uniswap','UNI','Uniswap'],['aave','AAVE','Aave'],['near','NEAR','NEAR Protocol'],['sui','SUI','Sui'],['pepe','PEPE','Pepe'],['shiba-inu','SHIB','Shiba Inu'],['render-token','RENDER','Render'],['cosmos','ATOM','Cosmos'],['arbitrum','ARB','Arbitrum'],['optimism','OP','Optimism']].map(([id,symbol,name])=>({id,symbol,name}));
const timeout=13000;
async function json(url,opts={},fetcher=globalThis.fetch){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);try{const response=await fetcher(url,{...opts,signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error(response.status===429?'Ratenlimit erreicht – später erneut versuchen.':`Abruf fehlgeschlagen (HTTP ${response.status})`);const data=await response.json();if(data?.status==='error'||data?.status==='ERROR')throw Error(String(data.message||'API-Fehler'));return data;}catch(e){if(e.name==='AbortError')throw Error('Zeitüberschreitung beim Abruf.');throw e;}finally{clearTimeout(timer);}}
function cgHeaders(key){return key?{'x-cg-demo-api-key':key}:{};}
export async function coinCatalog(key='',fetcher=globalThis.fetch){const a=await json('https://api.coingecko.com/api/v3/coins/list?include_platform=false',{headers:cgHeaders(key)},fetcher);if(!Array.isArray(a))throw Error('Ungültiger CoinGecko-Katalog.');return a.map(x=>({id:String(x.id||''),symbol:String(x.symbol||'').toUpperCase(),name:String(x.name||'')}));}
export function searchCatalog(catalog,query){const q=query.trim().toLowerCase();if(!q)return catalog.slice(0,16);return catalog.filter(c=>c.id.toLowerCase().includes(q)||c.symbol.toLowerCase().includes(q)||c.name.toLowerCase().includes(q)).sort((a,b)=>Number(b.symbol.toLowerCase()===q)-Number(a.symbol.toLowerCase()===q)).slice(0,30);}
export async function cryptoPrices(ids,key='',fetcher=globalThis.fetch){const unique=[...new Set(ids.filter(Boolean))].slice(0,100);if(!unique.length)return {};const url=new URL('https://api.coingecko.com/api/v3/simple/price');url.searchParams.set('ids',unique.join(','));url.searchParams.set('vs_currencies','eur');url.searchParams.set('include_last_updated_at','true');return json(url.toString(),{headers:cgHeaders(key)},fetcher);}
export async function searchSecurities(term,key,fetcher=globalThis.fetch){if(!key)throw Error('Für die Wertpapiersuche bitte in „Mehr“ einen eigenen Twelve-Data-Schlüssel hinterlegen.');const url=new URL('https://api.twelvedata.com/symbol_search');url.searchParams.set('symbol',term);url.searchParams.set('apikey',key);const res=await json(url.toString(),{},fetcher);if(!Array.isArray(res.data))return [];
  const ranking=x=>{const exchange=String(x.exchange||'').toLowerCase(),type=String(x.instrument_type||x.type||'').toLowerCase();
    return (type.includes('etf')?0:10)+(exchange.includes('xetra')?0:exchange.includes('vienna')||exchange.includes('wien')?1:exchange.includes('euronext')?2:exchange.includes('nasdaq')||exchange.includes('nyse')?8:4);
  };
  return res.data.slice().sort((a,b)=>ranking(a)-ranking(b)).slice(0,30);}
export async function securityPrice(symbol,key,fetcher=globalThis.fetch){if(!key)throw Error('Twelve-Data-Schlüssel fehlt.');const url=new URL('https://api.twelvedata.com/price');url.searchParams.set('symbol',symbol);url.searchParams.set('apikey',key);const res=await json(url.toString(),{},fetcher);const price=Number(res.price);if(!Number.isFinite(price)||price<0)throw Error('Kein gültiger Kurs geliefert.');return price;}
export async function exchangeRate(from,key,fetcher=globalThis.fetch){if(from==='EUR')return 1;if(!/^[A-Z]{3}$/.test(from))throw Error('Ungültige Währung.');if(!key){const url=new URL('https://api.frankfurter.dev/v1/latest');url.searchParams.set('base',from);url.searchParams.set('symbols','EUR');const daily=await json(url.toString(),{},fetcher);const rate=Number(daily.rates?.EUR);if(!(rate>0))throw Error('Kein kostenloser Tageswechselkurs verfügbar.');return rate;}const url=new URL('https://api.twelvedata.com/exchange_rate');url.searchParams.set('symbol',`${from}/EUR`);url.searchParams.set('apikey',key);const data=await json(url.toString(),{},fetcher);const rate=Number(data.rate);if(!(rate>0))throw Error(`Kein Wechselkurs für ${from}/EUR.`);return rate;}
export async function btcBalance(address,fetcher=globalThis.fetch){const data=await json('https://blockstream.info/api/address/'+encodeURIComponent(address),{},fetcher);const c=data.chain_stats,m=data.mempool_stats;if(!c||!m||![c.funded_txo_sum,c.spent_txo_sum,m.funded_txo_sum,m.spent_txo_sum].every(n=>Number.isSafeInteger(n)&&n>=0))throw Error('Unvollständige Bitcoin-Antwort. Letzter Bestand bleibt erhalten.');const sats=c.funded_txo_sum-c.spent_txo_sum+m.funded_txo_sum-m.spent_txo_sum;if(!Number.isFinite(sats)||sats<0)throw Error('Ungültiger Bitcoin-Kontostand.');return sats/1e8;}
async function etherscan(params,key,fetcher){if(!key)throw Error('Für EVM-Wallets bitte einen eigenen Etherscan-Schlüssel unter „Mehr“ eintragen.');const url=new URL('https://api.etherscan.io/v2/api');for(const [k,v]of Object.entries(params))url.searchParams.set(k,String(v));url.searchParams.set('apikey',key);const r=await json(url.toString(),{},fetcher);if(r.status==='0')throw Error(String(r.result||r.message||'Etherscan-Fehler'));return r.result;}
export async function evmBalance(wallet,key,fetcher=globalThis.fetch){const query={chainid:wallet.chainId||1,module:'account',action:wallet.chain==='erc20'?'tokenbalance':'balance',address:wallet.address,tag:'latest'};if(wallet.chain==='erc20')query.contractaddress=wallet.contract;const balance=await etherscan(query,key,fetcher);if(!/^\d+$/.test(String(balance)))throw Error('Ungültige Blockchain-Antwort.');return Number(balance)/10**Number(wallet.decimals||18);}
export async function solBalance(wallet,rpc=DEFAULT_SOL_RPC,fetcher=globalThis.fetch){const url=new URL(rpc);if(url.protocol!=='https:')throw Error('Solana-RPC muss HTTPS verwenden.');const method=wallet.chain==='spl'?'getTokenAccountsByOwner':'getBalance';const params=wallet.chain==='spl'?[wallet.address,{mint:wallet.contract},{encoding:'jsonParsed'}]:[wallet.address,{commitment:'confirmed'}];const r=await json(url.toString(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})},fetcher);if(r.error)throw Error(r.error.message||'Solana-RPC-Fehler');if(wallet.chain==='spl'){const accounts=r.result?.value;if(!Array.isArray(accounts))throw Error('Unvollständige Solana-Token-Antwort.');return accounts.reduce((sum,a)=>{const amount=Number(a.account?.data?.parsed?.info?.tokenAmount?.uiAmountString);if(!Number.isFinite(amount)||amount<0)throw Error('Ungültiger Token-Bestand.');return sum+amount;},0);}const balance=r.result?.value;if(!Number.isSafeInteger(balance)||balance<0)throw Error('Unvollständige Solana-Antwort.');return balance/1e9;}
export async function walletBalance(wallet,settings,fetcher=globalThis.fetch){if(!wallet?.enabled)throw Error('Kein Wallet konfiguriert.');switch(wallet.chain){case 'btc':return btcBalance(wallet.address,fetcher);case 'evm':case 'erc20':{if(PUBLIC_EVM_NETWORKS[wallet.chainId]?.explorer!==false){const chain=PUBLIC_EVM_NETWORKS[wallet.chainId];if(chain){const address=encodeURIComponent(wallet.address);if(wallet.chain==='evm'){const data=await json(chain.host+'/api/v2/addresses/'+address,{},fetcher);if(!/^\d+$/.test(String(data.coin_balance??'')))throw Error('Unvollständige Blockchain-Antwort.');const amount=Number(data.coin_balance)/1e18;if(Number.isFinite(amount)&&amount>=0)return amount;throw Error('Ungültiger öffentlicher Explorer-Saldo.');}const list=await json(chain.host+'/api/v2/addresses/'+address+'/token-balances',{},fetcher);if(!Array.isArray(list))throw Error('Token-Saldo ungültig.');const item=list.find(t=>String(t.token?.address_hash||t.token?.address||'').toLowerCase()===String(wallet.contract||'').toLowerCase());return item?Number(item.value)/10**Number(item.token?.decimals??wallet.decimals):0;}}return evmBalance(wallet,settings.etherscanKey,fetcher);}case 'sol':case 'spl':return solBalance(wallet,settings.solanaRpc||DEFAULT_SOL_RPC,fetcher);default:throw Error('Blockchain noch nicht unterstützt.');}}

// Public explorer instances (not the paid Blockscout PRO API). These endpoints
// have their own rate limits and may be inaccessible from some browsers.
export const PUBLIC_EVM_NETWORKS = {
  1: {name:'Ethereum', host:'https://eth.blockscout.com', symbol:'ETH', coinId:'ethereum'},
  8453: {name:'Base', host:'https://base.blockscout.com', symbol:'ETH', coinId:'ethereum'},
  42161: {name:'Arbitrum', host:'https://arbitrum.blockscout.com', symbol:'ETH', coinId:'ethereum'},
  10: {name:'Optimism', host:'https://optimism.blockscout.com', symbol:'ETH', coinId:'ethereum'},
  137: {name:'Polygon', host:'https://polygon.blockscout.com', symbol:'POL', coinId:'polygon-ecosystem-token'},
  56: {name:'BNB Smart Chain', host:'https://bscscan.com', symbol:'BNB', coinId:'binancecoin', explorer:false}
};
const isEvmAddress=a=>/^0x[0-9a-fA-F]{40}$/.test(a);
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
  if(network==='btc'){
    if(!/^(bc1[ac-hj-np-z02-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{24,47})$/.test(a))throw Error('Bitte eine gültige einzelne Bitcoin-Adresse eingeben (kein xpub).');
    const quantity=await btcBalance(a,fetcher);
    return quantity>0?[{name:'Bitcoin',symbol:'BTC',coinId:'bitcoin',quantity,chain:'btc',decimals:8}]:[];
  }
  if(network==='sol'){
    if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a))throw Error('Ungültige Solana-Adresse.');
    const rpc=settings.solanaRpc||DEFAULT_SOL_RPC;
    const native=await rpcCall(rpc,'getBalance',[a,{commitment:'confirmed'}],fetcher);
    const assets=[];const quantity=Number(native.value||0)/1e9;
    if(quantity>0)assets.push({name:'Solana',symbol:'SOL',coinId:'solana',quantity,chain:'sol',decimals:9});
    let successfulPrograms=0;const failures=[];
    for(const programId of solanaPrograms){
      try{
        const data=await rpcCall(rpc,'getTokenAccountsByOwner',[a,{programId},{encoding:'jsonParsed'}],fetcher);
        successfulPrograms++;
        for(const row of data.value||[]){
          const info=row.account?.data?.parsed?.info;const mint=info?.mint;
          if(!mint||!String(mint).match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/))continue;
          const decimals=Number(info.tokenAmount?.decimals);
          const amount=Number(info.tokenAmount?.uiAmountString??0);
          if(!(amount>0)||!Number.isFinite(amount)||decimals<0||decimals>30)continue;
          const existing=assets.find(x=>x.chain==='spl'&&x.contract===mint);
          if(existing)existing.quantity+=amount;
          else assets.push({name:'Solana Token '+mint.slice(0,6)+'…',symbol:mint.slice(0,6)+'…',coinId:'',quantity:amount,chain:'spl',contract:mint,decimals});
        }
      }catch(error){failures.push(error.message);}
    }
    if(!successfulPrograms&&!assets.length)throw Error('Solana-Token konnten nicht abgerufen werden: '+failures.join(' / '));
    if(failures.length){assets.partial=true;assets.warning='Ein Solana-Token-Programm konnte nicht vollständig gelesen werden. Vorhandene Bestände bleiben erhalten.';}
    return assets;
  }
  const chainId=Number(network);
  const chain=PUBLIC_EVM_NETWORKS[chainId];
  if(!chain?.explorer && chain?.explorer!==undefined)throw Error('Für dieses Netzwerk steht aktuell kein öffentlicher Explorer-Import zur Verfügung.');
  if(!chain||!isEvmAddress(a))throw Error('Bitte ein unterstütztes EVM-Netzwerk und eine gültige öffentliche 0x-Adresse wählen.');
  const base=chain.host+'/api/v2/addresses/'+encodeURIComponent(a);
  const info=await json(base,{},fetcher);
  let raw=[],tokenFailure='';try{raw=await json(base+'/token-balances',{},fetcher);if(!Array.isArray(raw))throw Error('Unerwartete Token-Antwort.');}catch(e){raw=[];tokenFailure=e.message;}
  const assets=[];const native=Number(info.coin_balance||0)/1e18;
  if(native>0)assets.push({name:chain.name==='Polygon'?'POL':chain.symbol,symbol:chain.symbol,coinId:chain.coinId,quantity:native,chain:'evm',chainId,decimals:18});
  for(const row of raw.slice(0,500)){
    const token=row.token||{};
    const contract=String(token.address_hash||token.address||'');
    const decimals=Number(token.decimals);
    const value=Number(row.value)/10**decimals;
    if(token.type!=='ERC-20'||!isEvmAddress(contract)||!Number.isInteger(decimals)||decimals<0||decimals>30||!(value>0)||!Number.isFinite(value))continue;
    const symbol=String(token.symbol||'Token').slice(0,32);
    assets.push({name:String(token.name||symbol).slice(0,100),symbol,coinId:'',quantity:value,chain:'erc20',chainId,contract,decimals});
  }
  if(tokenFailure){if(!assets.length)throw Error('Token-Liste nicht verfügbar: '+tokenFailure);assets.partial=true;assets.warning='Native Coin erkannt, Token-Abfrage war nicht verfügbar: '+tokenFailure;}
  return assets;
}

// Keyless market-data requests, with strict boundaries: this does not imply
// every token will have a quote or that public endpoints guarantee uptime.
export async function evmContractPrices(chainId,contracts,key='',fetcher=globalThis.fetch){
  const platform={1:'ethereum',8453:'base',42161:'arbitrum-one',10:'optimistic-ethereum',137:'polygon-pos'}[Number(chainId)];
  if(!platform)return {};
  const items=[...new Set(contracts.map(c=>String(c||'').toLowerCase()).filter(isEvmAddress))];
  if(!items.length)return {};
  const result={};
  for(let i=0;i<items.length;i+=30){
    const url=new URL('https://api.coingecko.com/api/v3/simple/token_price/'+platform);
    url.searchParams.set('contract_addresses',items.slice(i,i+30).join(','));url.searchParams.set('vs_currencies','eur');
    Object.assign(result,await json(url.toString(),{headers:cgHeaders(key)},fetcher));
  }
  return result;
}
