/**
 * Simple, strictly booked cash-income overview. No tax estimates, withholding
 * assumptions, unrealised profits or derived broker fees.
 */
export function bookedIncomeSummary(bookings){
 const totals={dividend:0,interest:0,fee:0,tax:0};
 const counts={dividend:0,interest:0,fee:0,tax:0};
 let unavailable=0;
 for(const b of bookings||[]){
  if(!Object.hasOwn(totals,b?.type))continue;
  const amount=Number(b.amountEUR);
  if(b.amountEUR==null||!Number.isFinite(amount)||amount<0){unavailable++;continue;}
  totals[b.type]+=amount;
  counts[b.type]++;
 }
 return {
  ...totals,counts,unavailable,
  income:totals.dividend+totals.interest,
  deductions:totals.fee+totals.tax,
  net:totals.dividend+totals.interest-totals.fee-totals.tax
 };
}
