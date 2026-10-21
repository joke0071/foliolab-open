/** Economic valuation links are explicit user choices, never inferred from tickers. */
export const ECONOMIC_ROLES=['standard','collateral','liquid-staking','vault','liquidity-pool','lending','borrowed','wrapped'];
export const VALUATION_MODES=['included','excluded','liability'];
export function validateEconomicPosition(position,model){
 const role=String(position.economicRole||'standard'),mode=String(position.valuationMode||'included');
 if(!ECONOMIC_ROLES.includes(role)||!VALUATION_MODES.includes(mode))throw Error('Unbekannte wirtschaftliche Position.');
 const target=String(position.representedByPositionId||'');
 if(target){
  if(position.id===target)throw Error('Ein Asset kann sich nicht selbst repräsentieren.');
  const related=model.positions.find(p=>p.id===target);
  if(!related)throw Error('Verknüpfte wirtschaftliche Position fehlt.');
  // Cycles are not meaningful and could conceal counted assets.
  const visited=new Set([position.id]);let next=related;
  while(next){
   if(visited.has(next.id))throw Error('Zyklische DeFi-Verknüpfung.');
   visited.add(next.id);next=model.positions.find(p=>p.id===next.representedByPositionId);
  }
 }
 if(mode==='excluded'&&!target)throw Error('Ausgeschlossene Position braucht eine Referenz zur angerechneten Position.');
 if(mode==='liability'&&role!=='borrowed')throw Error('Schuldposition erfordert den Typ „Geborgtes Asset / Verbindlichkeit“.');
 return {economicRole:role,valuationMode:mode,representedByPositionId:target||null};
}
export function valueSign(position){return position.valuationMode==='excluded'?0:position.valuationMode==='liability'?-1:1;}
export function economicSummary(model){
 let counted=0,excluded=0,liabilities=0;
 for(const p of model.positions){
  if(p.valuationMode==='excluded')excluded++;
  else if(p.valuationMode==='liability')liabilities++;
  else counted++;
 }
 return {counted,excluded,liabilities};
}
