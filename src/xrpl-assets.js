import {units,exact} from './decimal.js';
import {requestJSON,TTL} from './request-cache.js';
const addressRe=/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const currencyRe=/^(?:[A-Z0-9]{3}|[A-Fa-f0-9]{40})$/;
/** Read ONLY verified XRPL trust lines. Marker must be consumed to avoid false completeness. */
export async function readTrustLines(address,fetcher=globalThis.fetch,{maxPages=15}={}){
 if(!addressRe.test(String(address)))throw Error('Ungültige öffentliche XRPL-Adresse.');
 const items=[];let marker,ledger=null,pages=0;
 do {
  if(++pages>maxPages)throw Error('XRPL-Tokenliste überschreitet Scanlimit; kein vollständiger Scan.');
  const params={account:address,limit:200,ledger_index:ledger??'validated'};
  if(marker!==undefined)params.marker=marker;
  const data=await requestJSON('https://xrplcluster.com',{fetcher,method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'account_lines',params:[params]}),ttlMs:TTL.wallet});
  const result=data?.result;if(!result||result.error||!Array.isArray(result.lines))throw Error('XRPL Trust Lines konnten nicht verlässlich gelesen werden.');
  if(result.validated===false)throw Error('XRPL meldet einen nicht validierten Ledger.');
  if(ledger==null&&Number.isInteger(result.ledger_index))ledger=result.ledger_index;
  for(const row of result.lines){
   if(!addressRe.test(String(row.account))||!currencyRe.test(String(row.currency)))continue;
   const qty=exact(units(row.balance));
   if(units(qty)<=0n)continue; // Debts and zero-value lines must not inflate holdings.
   items.push({name:'XRPL '+row.currency+' · '+row.account.slice(0,8),symbol:row.currency.length===3?row.currency:'XRPL Token',
    quantity:Number(qty),quantityExact:qty,coinId:'',chain:'xrp-token',contract:row.account+':'+row.currency,
    issuer:row.account,currencyCode:row.currency,decimals:18,price:0});
  }
  marker=result.marker;
 }while(marker!==undefined&&marker!==null);
 return items;
}
export async function readTrustLineBalance(address,contract,fetcher=globalThis.fetch){
 const found=/^(r[1-9A-HJ-NP-Za-km-z]{24,34}):([A-Za-z0-9]{3}|[A-Fa-f0-9]{40})$/.exec(String(contract));
 if(!found)throw Error('Ungültiger XRP-Token-Identifier aus Issuer und Currency.');
 const rows=await readTrustLines(address,fetcher);
 const item=rows.find(r=>r.issuer===found[1]&&r.currencyCode.toUpperCase()===found[2].toUpperCase());
 // A VERIFIED full scan can assert a token is absent; no empty list on network errors.
 return item?.quantityExact||'0';
}
