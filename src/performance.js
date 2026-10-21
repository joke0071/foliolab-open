import {units,exact,mul,div} from './decimal.js';
/** Investor cashflow sign convention: deposits are negative, withdrawals positive. */
export function xirr(flows){
 if(!Array.isArray(flows)||flows.length<2)return null;
 const ordered=flows.map(x=>({date:String(x.date),amount:Number(x.amount)})).sort((a,b)=>a.date.localeCompare(b.date));
 if(ordered.some(x=>!Number.isFinite(x.amount)||Number.isNaN(Date.parse(x.date))))return null;
 if(!ordered.some(x=>x.amount>0)||!ordered.some(x=>x.amount<0))return null;
 const t0=Date.parse(ordered[0].date+'T00:00:00Z');
 const terms=ordered.map(x=>({value:x.amount,years:(Date.parse(x.date+'T00:00:00Z')-t0)/86400000/365.25}));
 const npv=r=>terms.reduce((s,x)=>s+x.value/Math.pow(1+r,x.years),0);
 let lo=-0.999999,hi=1;
 let left=npv(lo),right=npv(hi);
 for(let j=0;j<40&&Number.isFinite(right)&&left*right>0;j++){hi=hi*2+1;right=npv(hi);}
 if(!Number.isFinite(left)||!Number.isFinite(right)||left*right>0)return null;
 for(let i=0;i<180;i++){const mid=(lo+hi)/2,m=npv(mid);if(!Number.isFinite(m))return null;if(Math.abs(m)<1e-8||hi-lo<1e-10)return mid;if(m*left>0){lo=mid;left=m;}else hi=mid;}
 return (lo+hi)/2;
}
/** XIRR requires a verified starting valuation and complete external flow ledger. */
export function portfolioXirr(model,startDate,endDate){
 const snapshots=model.snapshots.filter(x=>x.date>=startDate&&x.date<=endDate).sort((a,b)=>a.date.localeCompare(b.date));
 if(snapshots.length<2||snapshots[0].date!==startDate||snapshots.at(-1).date!==endDate)return null;
 // Never use older, unverifiable or backdated-from-current snapshots for returns.
 if(!['observed','manual'].includes(snapshots[0].valuationStatus)||!['observed','manual'].includes(snapshots.at(-1).valuationStatus))return null;
 if(!Array.isArray(model.externalCashFlows))return null;
 if(model.bookings.some(x=>x.date>startDate&&x.date<=endDate&&['deposit','withdraw'].includes(x.type)&&!model.externalCashFlows.some(f=>f.id===x.id)))return null;
 const first=snapshots[0],last=snapshots.at(-1);
 const flows=[{date:first.date,amount:-first.total},...model.externalCashFlows.filter(x=>x.date>first.date&&x.date<=last.date).map(x=>({date:x.date,amount:-x.amountEUR})),{date:last.date,amount:last.total}];
 return xirr(flows);
}
/** Exact TWR only when each external cashflow has a pre-/post-flow valuation. */
export function twr(periods){
 if(!Array.isArray(periods)||!periods.length)return null;
 let product=1;
 for(const p of periods){
   if(!p||!Number.isFinite(p.start)||!Number.isFinite(p.end)||p.start<=0||p.end<0||p.hasUnvaluedExternalFlow)return null;
   product*=p.end/p.start;
 }
 return product-1;
}
/** Money-weighted approximated return; label as Modified Dietz, never TWR. */
export function modifiedDietz({start,end,netFlowEUR=0,weightedFlowEUR=0}){
 if(![start,end,netFlowEUR,weightedFlowEUR].every(Number.isFinite))return null;
 const denominator=start+weightedFlowEUR;
 return denominator>0?(end-start-netFlowEUR)/denominator:null;
}
