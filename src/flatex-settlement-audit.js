import {units,exact,mul} from './decimal.js';
import {pairFlatexSettlements} from './flatex-settlements.js';

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
   const gross=mul(units(trade.quantity),units(trade.unitPrice));
   const cash=units(accountMovement.amount);
   // EUR cash debit has a negative sign; sale proceeds have a positive sign.
   const expected=trade.type==='buy'?-gross:gross;
   const difference=cash-expected;
   base.grossExact=exact(gross);base.cashExact=exact(cash);
   base.differenceExact=exact(difference);
   if(difference===0n){
    base.status='gross-equal';
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
