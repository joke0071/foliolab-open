import {replayWalletHistory} from './wallet-history-core.js';
/** UTC day checkpoints inside available evidence only; full event coverage proves unchanged quantities between movements. */
export function* historyDaySteps(session,{limit=365,from='0000-01-01'}={}){
 const dates=[...new Set(session.events.filter(e=>e.timestamp&&e.status!=='unconfirmed'&&e.status!=='orphaned').map(e=>e.timestamp.slice(0,10)))].sort();
 if(dates.length>15000)throw Error('Zu viele historische Tage.');
 if(!dates.length)return;
 const end=Date.parse(dates.at(-1)+'T00:00:00Z'),start=Math.max(Date.parse(dates[0]+'T00:00:00Z'),Date.parse(from+'T00:00:00Z'),end-(limit-1)*86400000);
 const calendar=[];for(let t=start;t<=end;t+=86400000)calendar.push(new Date(t).toISOString().slice(0,10));
 for(const date of calendar){
  const events=session.events.filter(e=>!e.timestamp||e.timestamp.slice(0,10)<=date);
  const streams=session.streams.map(s=>{
   const last=events.filter(e=>e.network===s.network&&e.chainId===s.chainId&&e.blockHeight!==null).sort((a,b)=>BigInt(a.blockHeight)<BigInt(b.blockHeight)?-1:1).at(-1);
   if(!last)return s;
   return {...s,throughBlock:last.blockHeight,opening:s.opening&&BigInt(s.opening.beforeBlock)<=BigInt(last.blockHeight)?s.opening:null,coverage:{...s.coverage,toBlock:last.blockHeight,tipHash:last.blockHash}};
  });
  yield replayWalletHistory({events,streams}).balances.map(b=>({date,...b}));
 }
}
export function historyDays(session,options){return [...historyDaySteps(session,options)].flat();}
export function rawQuantity(value,decimals){
 if(value===null)return 'Unbekannt';const negative=value.startsWith('-'),digits=(negative?value.slice(1):value).padStart(decimals+1,'0');
 const frac=decimals?digits.slice(-decimals).replace(/0+$/,''):'';return (negative?'-':'')+(decimals?digits.slice(0,-decimals):digits)+(frac?'.'+frac:'');
}
