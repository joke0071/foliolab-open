/** @typedef {{id:string,symbol:string,mic:string,exchange:string,currency:string}} Listing */
/** @typedef {{id:string,key:string,kind:string,name:string,isin:string,coinId:string,listings:Listing[]}} Asset */
const lower=x=>String(x??'').trim().toLowerCase();
const upper=x=>String(x??'').trim().toUpperCase();
/** An ISIN identifies a security, not the stock-exchange listing or trading currency. */
export function listingId(p){
 const symbol=upper(p.symbol),mic=upper(p.mic),exchange=upper(p.exchange),currency=upper(p.currency||'EUR');
 if(!symbol)return null;
 return 'listing:'+encodeURIComponent([assetKey(p),mic||exchange||'unspecified',symbol,currency].join('|'));
}
export function assetKey(p){
 const kind=p.kind||'other';
 if(kind==='crypto'){
   const w=p.wallet;
   if(w?.enabled){
     const net=w.chain==='evm'||w.chain==='erc20'?'evm:'+(w.chainId||1):w.chain==='sol'||w.chain==='spl'?'solana':w.chain;
     return 'crypto:'+net+':'+(w.contract?lower(w.contract):'native');
   }
   if(p.coinId)return 'crypto:cg:'+lower(p.coinId);
   return 'crypto:manual:'+lower(p.symbol)+':'+lower(p.name);
 }
 if(kind==='cash')return 'fiat:'+lower(p.currency||'EUR');
 if(['etf','stock','fund'].includes(kind)){
   if(/^[A-Z]{2}[A-Z0-9]{10}$/.test(upper(p.isin)))return 'security:isin:'+lower(p.isin);
   return 'security:unverified:'+lower(p.name)+':'+lower(p.symbol)+':'+lower(p.currency);
 }
 return 'other:'+kind+':'+lower(p.name);
}
export function rebuildAssets(model){
 const assets=new Map();
 for(const p of model.positions){
   const key=assetKey(p),id='asset:'+encodeURIComponent(key);
   const listing={id:listingId(p),symbol:upper(p.symbol),mic:upper(p.mic),exchange:String(p.exchange||''),currency:upper(p.currency||'EUR')};
   let asset=assets.get(key);
   if(!asset){asset={id,key,kind:p.kind,name:String(p.name||''),isin:upper(p.isin),coinId:String(p.coinId||''),listings:[]};assets.set(key,asset);}
   if(listing.id&&!asset.listings.some(l=>l.id===listing.id))asset.listings.push(listing);
   p.assetId=id;p.listingId=listing.id;
 }
 model.assets=[...assets.values()];
 return model.assets;
}
