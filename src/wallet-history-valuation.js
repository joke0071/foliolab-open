import {units,exact} from './decimal.js';
export const historyAssetKey=v=>JSON.stringify([v.network,v.chainId,v.assetId,v.contract??null,v.mint??null]);
export function validateHistoryQuotes(quotes,streams){
 if(!Array.isArray(quotes)||quotes.length>50000)throw Error('Ungültige historische Kurse.');
 const allowed=new Map(streams.map(s=>[historyAssetKey(s),s])),seen=new Map();
 return quotes.map(q=>{
  const s=allowed.get(historyAssetKey(q));
  if(!s||q.binding==='native-network'&&(s.contract||s.mint)||q.currency!=='EUR'||!['native-network','user-confirmed-asset'].includes(q.binding)||typeof q.date!=='string'||!/^\d{4}-\d\d-\d\d$/.test(q.date)||new Date(q.date+'T00:00:00Z').toISOString().slice(0,10)!==q.date)throw Error('Kursdatum oder Asset-Zuordnung nicht belegt.');
  const priceExact=exact(units(q.priceExact));if(units(priceExact)<=0n)throw Error('Fehlender oder ungültiger historischer Kurs.');
  const id=historyAssetKey(s)+q.date;if(seen.has(id)&&seen.get(id)!==priceExact)throw Error('Widersprüchliche historische Kurse.');seen.set(id,priceExact);
  if(typeof q.source!=='string'||!q.source||q.source.length>180)throw Error('Historische Kursquelle fehlt.');
  const source=q.source.includes('://')?new URL(q.source).hostname:q.source.replace(/[^a-zA-Z0-9 .:_-]/g,'').slice(0,180)||'market-history';
  return {network:s.network,chainId:s.chainId,assetId:s.assetId,contract:s.contract,mint:s.mint,date:q.date,currency:'EUR',priceExact,source,binding:q.binding,quality:'estimated'};
 });
}
function decimal(raw,places){
 const negative=raw<0n,mag=(negative?-raw:raw).toString().padStart(places+1,'0');const fraction=places?mag.slice(-places).replace(/0+$/,''):'';
 return (negative?'-':'')+(places?mag.slice(0,-places):mag)+(fraction?'.'+fraction:'');
}
/** Never supply a zero quote or interpolate across a missing date/identity. */
export function valueHistoryRows(rows,quotes){
 const map=new Map(quotes.map(q=>[historyAssetKey(q)+q.date,q]));
 return rows.map(row=>{
  const q=map.get(historyAssetKey(row)+row.date);
  if(row.coverage!=='verified'||row.quantityBaseUnits===null)return {...row,eurExact:null,valueStatus:'partial balance'};
  if(!q||q.currency!=='EUR'||!['native-network','user-confirmed-asset'].includes(q.binding)||q.binding==='native-network'&&(row.contract||row.mint))return {...row,eurExact:null,valueStatus:'missing quote'};
  let price;try{price=units(q.priceExact);}catch{return {...row,eurExact:null,valueStatus:'missing quote'};}
  if(price<=0n)return {...row,eurExact:null,valueStatus:'missing quote'};
  return {...row,eurExact:decimal(BigInt(row.quantityBaseUnits)*price,row.decimals+18),valueStatus:'estimated EUR',quoteSource:q.source};
 });
}
function matches(row,p){const w=p.wallet;
 return row.network==='bitcoin'&&['btc','btc-hd'].includes(w.chain)||row.network==='ethereum'&&Number(w.chainId||1)===1&&(row.contract?w.chain==='erc20'&&w.contract?.toLowerCase()===row.contract:w.chain==='evm')||row.network==='solana'&&(row.mint?w.chain==='spl'&&w.contract===row.mint:w.chain==='sol');
}
/** Explicit CSV binding or existing native CoinGecko/CoinPaprika EUR history path. */
export async function loadHistoryQuotes(session,position,model,{confirmLocal=false,fetcher=globalThis.fetch}={}){
 const assets=[...new Map(session.streams.filter(s=>matches(s,position)).map(s=>[historyAssetKey(s),s])).values()];
 if(!assets.length)throw Error('Asset und Wallet-Historie stimmen nicht überein.');
 const local=model.priceHistories?.[position.id];let history,binding;
 if(confirmLocal&&local){if(local.currency!=='EUR')throw Error('Lokale Kurse müssen in EUR vorliegen.');history=local;binding='user-confirmed-asset';}
 else{
  if(assets.some(a=>a.contract||a.mint))throw Error('Tokenkurse benötigen lokale EUR-Kurse mit ausdrücklich bestätigter Contract-/Mint-Zuordnung.');
  const coinId=assets[0].network==='bitcoin'?'bitcoin':assets[0].network==='ethereum'?'ethereum':'solana';
  const {fetchPositionMarketHistory}=await import('./position-history.js');
  history=await fetchPositionMarketHistory({...position,kind:'crypto',coinId},model.settings,365,fetcher);binding='native-network';
 }
 if(history.currency!=='EUR')throw Error('Keine datierten EUR-Kurse verfügbar.');
 const quotes=assets.flatMap(asset=>history.points.map(p=>({...asset,date:p.date,currency:'EUR',priceExact:exact(units(String(p.total))),source:history.source,binding})));
 return validateHistoryQuotes(quotes,session.streams);
}
/** Chart only a single asset with no missing calendar day or value. No bridging gaps. */
export function historyChartSeries(rows){
 if(rows.length<2||new Set(rows.map(historyAssetKey)).size!==1||rows.some(r=>r.eurExact===null))return [];
 const sorted=[...rows].sort((a,b)=>a.date.localeCompare(b.date));
 if(sorted.some((r,i)=>i&&Date.parse(r.date)-Date.parse(sorted[i-1].date)!==86400000))return [];
 return sorted.map(r=>({date:r.date,totalEURExact:r.eurExact}));
}
