/** @typedef {{symbol:string,exchange:string,currency:string}} Listing */
/** @typedef {{id:string,key:string,kind:string,name:string,isin:string,coinId:string,listings:Listing[]}} Asset */
const lower=x=>String(x??'').trim().toLowerCase();
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
   if(/^[A-Z]{2}[A-Z0-9]{10}$/.test(String(p.isin||'').toUpperCase()))return 'security:isin:'+lower(p.isin);
   return 'security:unverified:'+lower(p.name)+':'+lower(p.symbol)+':'+lower(p.currency);
 }
 return 'other:'+kind+':'+lower(p.name);
}
export function rebuildAssets(model){
 const assets=new Map();
 for(const p of model.positions){
   const key=assetKey(p),id='asset:'+encodeURIComponent(key),listing={symbol:String(p.symbol||''),exchange:String(p.exchange||''),currency:String(p.currency||'EUR')};
   let asset=assets.get(key);
   if(!asset){asset={id,key,kind:p.kind,name:String(p.name||''),isin:String(p.isin||''),coinId:String(p.coinId||''),listings:[]};assets.set(key,asset);}
   if(listing.symbol&&!asset.listings.some(l=>l.symbol===listing.symbol&&l.exchange===listing.exchange&&l.currency===listing.currency))asset.listings.push(listing);
   p.assetId=id;
 }
 model.assets=[...assets.values()];
 return model.assets;
}
