import {units,exact} from './decimal.js';

/**
 * Read-only quantity reconciliation for one broker custody account.
 *
 * The transaction set is only a candidate history. A matching quantity does
 * not prove completeness (transfers, splits, omissions and opening holdings
 * require independent confirmation).
 */
export function reconcileFlatexPositions(prepared,model,accountId){
 const account=(model?.accounts||[]).find(a=>a.id===accountId&&a.type==='securities');
 if(!account)throw Error('Für den Depotabgleich ein vorhandenes Wertpapierdepot wählen.');
 const positions=(model.positions||[]).filter(p=>p.accountId===account.id&&!p.wallet?.enabled);
 const byIsin=new Map();
 for(const p of positions){
  const isin=String(p.isin||'').toUpperCase();
  if(isin&&!byIsin.has(isin))byIsin.set(isin,[]);
  if(isin)byIsin.get(isin).push(p);
 }
 const grouped=new Map();
 for(const row of prepared?.parsed?.rows||[]){
  if(!['buy','sell'].includes(row.type))continue;
  const isin=String(row.position||'').toUpperCase();
  if(!grouped.has(isin))grouped.set(isin,[]);
  grouped.get(isin).push(row);
 }
 const results=[];
 for(const [isin,rows] of grouped){
  const matches=byIsin.get(isin)||[];
  const chronological=[...rows].sort((a,b)=>a.date.localeCompare(b.date)||a.externalId.localeCompare(b.externalId));
  let net=0n,min=0n,buys=0,sells=0;
  for(const r of chronological){
   const amount=units(r.quantity);
   net+=r.type==='buy'?amount:-amount;
   if(net<min)min=net;
   if(r.type==='buy')buys++;else sells++;
  }
  const matched=matches.length===1?matches[0]:null;
  const current=matched?units(matched.quantityExact??matched.quantity):null;
  const opening=current===null?null:current-net;
  const earliest=chronological[0]?.date||null;
  const status=matches.length===0?'unmatched':
   matches.length>1?'ambiguous':
   opening<0n?'inconsistent':
   opening>0n||min<0n?'opening-review':'arithmetically-aligned';
  results.push({
   isin,positionId:matched?.id||null,name:matched?.name||isin,
   accountId:account.id,earliest,buys,sells,events:chronological.length,
   netQuantityExact:exact(net),currentQuantityExact:current===null?null:exact(current),
   impliedOpeningExact:opening===null?null:exact(opening),
   hasNegativeInterim:min<0n,status
  });
 }
 results.sort((a,b)=>a.isin.localeCompare(b.isin));
 const counts=Object.fromEntries(['arithmetically-aligned','opening-review','inconsistent','unmatched','ambiguous']
  .map(status=>[status,results.filter(x=>x.status===status).length]));
 return {accountId:account.id,results,counts,
  // "Aligned" is deliberately *not* a certified broker balance.
  note:'Nur rechnerischer Vergleich mit aktuell erfassten Beständen. Unvollständige Historie, Überträge, Splits und Abrechnungsbelege müssen getrennt geprüft werden.'};
}

/** Broker imports never silently enter a different provider's account. */
export function flatexCustodyAccounts(model){
 const providers=new Set((model?.providers||[])
  .filter(p=>/flatex/i.test(String(p.name||''))).map(p=>p.id));
 return (model?.accounts||[]).filter(a=>a.type==='securities'&&providers.has(a.providerId));
}
