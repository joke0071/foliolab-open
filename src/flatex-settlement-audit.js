import {units,exact,mul,SCALE} from './decimal.js';
import {pairFlatexSettlements,inspectNativeFlatexOrderLinks} from './flatex-settlements.js';
import {inspectNativeFlatexSourceIdentities} from './import-identity.js';

// Shared arithmetic only. Native evidence must not hide a rounded product;
// the existing legacy comparison keeps its established fixed-point behavior.
function compareAmounts(quantity,unitPrice,amount,type,{rejectRounding=false}={}){
 const q=units(quantity),p=units(unitPrice),cash=units(amount);
 if(rejectRounding&&(q*p)%SCALE!==0n)throw Error('precision');
 const gross=mul(q,p),difference=cash-(type==='buy'?-gross:gross);
 return {grossExact:exact(gross),cashExact:exact(cash),differenceExact:exact(difference),
  status:difference===0n?'gross-equal':'unexplained-difference'};
}

/**
 * Read-only trade/settlement comparison. An account export's currency is not
 * inferred from the cash amount. The user must explicitly confirm it is EUR.
 *
 * A difference between gross execution and a net account movement is NOT
 * proof of charges: taxes, currency conversion, partial fills and broker
 * corrections may affect it. This module does not post or classify costs.
 */
export function auditFlatexSettlementAmounts(prepared,model,accountId,{accountAmountsEUR=false}={}){
 const pairings=pairFlatexSettlements(prepared);
 const securities=(model?.accounts||[]).find(a=>a.id===accountId&&a.type==='securities');
 if(!securities)throw Error('Für den Flatex-Abrechnungsabgleich ein Wertpapierdepot wählen.');
 const positions=(model?.positions||[]).filter(p=>p.accountId===accountId);
 const audited=pairings.paired.map(({trade,accountMovement,evidence})=>{
  const hits=positions.filter(p=>String(p.isin||'').toUpperCase()===trade.isin);
  const base={date:trade.date,isin:trade.isin,kind:trade.type,reference:trade.reference||'',
   cashDate:accountMovement.date,accountReference:accountMovement.reference||'',
   cashAccount:accountMovement.account||'',evidence,
   grossExact:null,cashExact:accountMovement.amount,differenceExact:null,
   status:'review',message:''};
  if(hits.length!==1){base.message='Anlage im ausgewählten Depot nicht eindeutig gefunden.';return base;}
  const pos=hits[0];
  if(pos.currency!=='EUR'){
   base.message='Handelswährung '+pos.currency+': tatsächlicher historischer EUR-Wechselkurs fehlt oder ist nicht bestätigt.';
   return base;
  }
  if(!accountAmountsEUR){
   base.message='Währung der Kontoumsätze bitte anhand des Flatex-Auszuges als EUR bestätigen.';
   return base;
  }
  try{
   Object.assign(base,compareAmounts(trade.quantity,trade.unitPrice,accountMovement.amount,trade.type));
   if(base.status==='gross-equal'){
    base.message='Bruttobetrag und Kontobewegung stimmen rechnerisch überein. Vollständigkeit nicht bestätigt.';
   }else{
    base.status='unexplained-difference';
    base.message='Differenz nicht aufteilbar: Gebühren, Steuern, Kursumrechnung oder sonstige Korrekturen können enthalten sein.';
   }
  }catch{
   base.message='Menge, Kurs oder Abrechnungsbetrag kann nicht exakt verglichen werden.';
  }
  return base;
 });
 const cashAccounts=new Set((prepared?.cashItems||[]).map(x=>x.account).filter(Boolean));
 return {entries:audited,
  counts:{equal:audited.filter(x=>x.status==='gross-equal').length,
   unexplained:audited.filter(x=>x.status==='unexplained-difference').length,
   pending:audited.filter(x=>x.status==='review').length,
   ambiguous:pairings.uncertain.length,unpairedTrades:pairings.unmatched.length,
   unpairedCash:pairings.unmatchedCash.length},
  distinctAccountIdentifiers:[...cashAccounts],
  note:'Ausschließlich rechnerische Gegenüberstellung. Keine automatische Gebühren-/Steuerzuordnung, keine Geldbuchung und kein bestätigter Anschaffungswert.'};
}

/** Documentary native 1:1 amount evidence, never a financial import preview. */
export function auditNativeFlatexSettlementAmounts(documents,{maxDays=7}={}){
 const links=inspectNativeFlatexOrderLinks(documents,{maxDays});
 const identities=inspectNativeFlatexSourceIdentities(documents);
 const key=x=>JSON.stringify([x.sourceIndex,x.line]);
 const sources=new Map(identities.rows.map(x=>[key(x),x]));
 const rows=new Map(documents.flatMap((d,sourceIndex)=>d.rows.map(row=>[key({sourceIndex,line:row.line}),row])));
 const entries=links.groups.map(group=>{
  const entry={...group,groupStatus:group.status,status:'review',currency:null,
   grossExact:null,cashExact:null,differenceExact:null,reasons:[...group.reasons]};
  if(group.status!=='possible-single')return entry;
  const locators=[group.depot[0],group.cash[0]];
  if(locators.some(l=>sources.get(key(l))?.status!=='candidate-source')){
   entry.reasons.push('Quellevidenz ungeklärt; keine Betragsfreigabe.');return entry;
  }
  const [depot,cash]=locators.map(l=>rows.get(key(l)));
  if(depot.values.unit!=='Stk.'){
   entry.reasons.push('Nur ausdrücklich belegte Stücknotierung; keine Prozent- oder Nennwertannahme.');return entry;
  }
  const nominal=units(depot.numbers.nominal);
  if(group.type==='buy'?nominal<=0n:nominal>=0n){
   entry.reasons.push('Nominalrichtung widerspricht dem Kauf-/Verkaufsbeleg.');return entry;
  }
  // Order/source guards already require exact dates, positive price, matching
  // declared currencies and cash direction. No EUR, FX or ownership inference.
  try{
   const comparison=compareAmounts(exact(nominal<0n?-nominal:nominal),depot.numbers.rate,cash.numbers.amount,group.type,{rejectRounding:true});
   Object.assign(entry,comparison,{currency:depot.values.priceCurrency});
   entry.reasons.push(entry.status==='gross-equal'
    ?'Rechnerisch gleich; Kosten, Vollständigkeit und Buchungswirkung bleiben ungeprüft.'
    :'Ungeklärte Differenz; keine automatische Gebühren-, Steuer- oder FX-Zuordnung.');
  }catch{
   entry.reasons.push('Produkt nicht innerhalb von 18 Nachkommastellen exakt darstellbar; keine gerundete Gleichheit.');
  }
  return entry;
 });
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
 return freeze({kind:'flatex-native-amount-audit',version:1,ready:false,writeEnabled:false,costsVerified:false,
  rows:links.rows,entries,unassigned:links.unassigned,
  note:'Nur dokumentarische Betragsprüfung. Keine Kontoeigentümerschaft, Kostenbasis, Gebühren, Steuern, Buchungen oder bestätigte Historien-/Cashflow-/Performanceaussage.'});
}
