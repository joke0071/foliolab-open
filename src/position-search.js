/** Deterministic UI-only search/sort: never mutate persisted positions. */
import {units,exact} from './decimal.js';
import {signedPositionValueExact} from './fx-state.js';
import {hasMissingPositionValue} from './quote-quality.js';
export function searchAndSortPositions(positions,model,query='',order='value',valueEUR){
 const q=String(query).trim().toLocaleLowerCase('de');
 const providers=new Map((model.providers||[]).map(x=>[x.id,x.name]));
 const accounts=new Map((model.accounts||[]).map(x=>[x.id,x.name]));
 const matched=positions.filter(p=>!q||[p.name,p.isin,p.symbol,providers.get(p.providerId),accounts.get(p.accountId)]
  .some(x=>String(x||'').toLocaleLowerCase('de').includes(q)));
 const byName=(a,b)=>String(a.name).localeCompare(String(b.name),'de');
 const compare=(a,b)=>{
  switch(order){
   case 'name':return byName(a,b);
   case 'provider':return String(providers.get(a.providerId)||'').localeCompare(String(providers.get(b.providerId)||''),'de')||byName(a,b);
   case 'kind':return String(a.kind).localeCompare(String(b.kind),'de')||byName(a,b);
   case 'freshness':return (Date.parse(b.quoteAsOf)||0)-(Date.parse(a.quoteAsOf)||0)||byName(a,b);
   default:return valueEUR(b)-valueEUR(a)||byName(a,b);
  }
 };
 return matched.slice().sort(compare);
}

/** Only the primary list is scoped. Never use this for valuation or import identity. */
export function positionListScope(positions,{includeArchived=false,view=includeArchived?'all':'active'}={}){
 if(!['active','archived','all'].includes(view))throw Error('Ungültige Positionsansicht.');
 return positions.filter(p=>view==='all'||(view==='archived'?p.archived===true:p.archived!==true));
}

/** Session-only list filter. Never use its output for totals or economic actions. */
export function positionValueThreshold(raw=''){
 const text=String(raw).trim();
 if(!text)return '0';
 if(text.length>60||!/^\d+(?:[.,]\d{0,18})?$/.test(text))throw Error('Bitte einen nicht negativen EUR-Betrag mit höchstens 18 Nachkommastellen eingeben.');
 return exact(units(text.replace(',','.')));
}
export function filterSmallPositionValues(positions,threshold='0'){
 const limit=units(positionValueThreshold(threshold));
 if(limit===0n)return positions.slice();
 return positions.filter(p=>{
  // An excluded contribution, liability or unknown valuation is never dust.
  if(p.valuationMode==='excluded'||p.valuationMode==='liability'||hasMissingPositionValue(p))return true;
  try{const value=signedPositionValueExact(p);return value===null||units(value)<0n||units(value)>=limit;}
  catch{return true;}
 });
}
