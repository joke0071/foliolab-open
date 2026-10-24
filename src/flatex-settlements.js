/**
 * Read-only cash-settlement matching. This function never posts cash,
 * attributes fees, or assumes an unmatched bank movement is an external flow.
 *
 * A match is only a plausible correspondence, not proof of net settlement or
 * a permission to change the journal. Uniqueness is enforced on both sides.
 */
export function pairFlatexSettlements(prepared,{maxDays=7}={}){
 if(!Number.isInteger(maxDays)||maxDays<0||maxDays>30)throw Error('Ungültiger Zeitraum für den Abrechnungsabgleich.');
 const trades=(prepared?.sourceTrades||[]).filter(x=>['buy','sell'].includes(x.type));
 const cash=(prepared?.cashItems||[]).filter(x=>x.kind==='settlement');
 const day=s=>Date.parse(String(s)+'T12:00:00Z');
 const dayGap=(a,b)=>Math.abs(day(a)-day(b))/86400000;
 const candidates=trades.map((trade,i)=>{
  const matches=[];
  for(let j=0;j<cash.length;j++){
   const movement=cash[j];
   if(!(dayGap(trade.date,movement.date)<=maxDays))continue;
   const amount=Number(movement.amount);
   if(!Number.isFinite(amount)||amount===0)continue;
   if(trade.type==='buy'&&amount>=0||trade.type==='sell'&&amount<=0)continue;
   const reportedIsins=String(movement.details||'').toUpperCase().match(/\b[A-Z]{2}[A-Z0-9]{10}\b/g)||[];
   // Matching references do NOT override an explicit conflicting security ID.
   if(reportedIsins.length&&!reportedIsins.includes(String(trade.isin||'').toUpperCase()))continue;
   const reference=Boolean(trade.reference&&movement.reference&&
    trade.reference.trim()===movement.reference.trim());
   const isin=Boolean(trade.isin&&reportedIsins.includes(trade.isin.toUpperCase()));
   if(!reference&&!isin)continue;
   matches.push({cashIndex:j,evidence:reference&&isin?'Referenz und ISIN':reference?'Transaktionsreferenz':'ISIN im Buchungstext',reference});
  }
  // If a real booking reference agrees, it takes precedence over coincidental
  // ISIN mentions in other account movements. Never invent a best guess.
  const referenced=matches.filter(m=>m.reference);
  return {tradeIndex:i,matches:referenced.length?referenced:matches};
 });
 const incomingCounts=new Map();
 for(const x of candidates)for(const m of x.matches)incomingCounts.set(m.cashIndex,(incomingCounts.get(m.cashIndex)||0)+1);
 const paired=[],uncertain=[],unmatched=[];
 const used=new Set();
 for(const x of candidates){
  const trade=trades[x.tradeIndex];
  const sole=x.matches.length===1?x.matches[0]:null;
  if(sole&&incomingCounts.get(sole.cashIndex)===1){
   used.add(sole.cashIndex);
   paired.push({trade,accountMovement:cash[sole.cashIndex],evidence:sole.evidence,status:'possible'});
  }else if(x.matches.length){
   uncertain.push({trade,candidates:x.matches.length,reason:'Mehrere mögliche Zuordnungen'});
  }else unmatched.push(trade);
 }
 return {paired,uncertain,unmatched,unmatchedCash:cash.filter((x,i)=>!used.has(i)),
  otherCash:(prepared?.cashItems||[]).filter(x=>x.kind!=='settlement'),
  note:'Eine Zuordnung zeigt nur mögliche zusammengehörige Belege. Abgerechnete Gebühren, Steuern und Cashkontobewegungen werden damit nicht automatisch gebucht.'};
}
