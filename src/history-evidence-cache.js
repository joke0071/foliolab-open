/** Bounded price retention in the EXISTING priceHistories record, never a second store. */
import {sourceDigest} from './import-identity.js';
import {validateImportedPriceHistory} from './historical-csv.js';
export const historyIdentity=p=>sourceDigest(JSON.stringify([p.kind,p.isin||'',p.symbol||'',p.exchange||'',p.mic||'',p.currency,p.coinId||'',p.eodhdSymbol||'',p.fmpSymbol||'',p.wallet?.chain||'',p.wallet?.contract||'']));
export function retainedHistoryDraft(model,positionId,history,{rightsConfirmed=false,replace=false}={}){
 if(!rightsConfirmed)throw Error('Bitte bestätigen, dass du diese Kursdaten lokal speichern darfst.');
 const p=model.positions.find(p=>p.id===positionId);if(!p)throw Error('Position nicht mehr vorhanden.');
 const provider=/^EODHD/.test(history.source)?'eodhd':/^Twelve Data/.test(history.source)?'twelve':/^Financial Modeling Prep/.test(history.source)?'fmp':/^CoinGecko/.test(history.source)?'coingecko':/^CoinPaprika/.test(history.source)?'coinpaprika':null;
 if(!provider)throw Error('Diese Kursquelle kann nicht als Anbieterhistorie gespeichert werden.');
 const incoming={...history,priceType:p.kind==='crypto'?'crypto-daily':'close',provenance:{schema:1,provider,identity:historyIdentity(p),retention:'user-confirmed'}};
 const old=model.priceHistories?.[positionId];
 if(old){
  const compatible=old.provenance?.identity===incoming.provenance.identity&&old.provenance?.provider===provider&&old.priceType===incoming.priceType&&old.currency===incoming.currency;
  if(!compatible&&!replace)throw Error('Andere lokale Quelle vorhanden. Ersetzen ausdrücklich bestätigen; Quellen werden nicht vermischt.');
  if(compatible){
   const points=new Map(old.points.map(r=>[r.date,r]));for(const r of incoming.points){if(points.has(r.date)&&points.get(r.date).total!==r.total&&!replace)throw Error('Abweichender Kurs am selben Tag. Ersetzen ausdrücklich bestätigen.');points.set(r.date,r);}
   incoming.points=[...points.values()].sort((a,b)=>a.date.localeCompare(b.date));
   const fx=new Map((old.fxPoints||[]).map(r=>[r.date,r]));for(const r of incoming.fxPoints||[])fx.set(r.date,r);incoming.fxPoints=[...fx.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }
 }
 const clean=validateImportedPriceHistory(incoming,p),draft={...model,priceHistories:{...model.priceHistories,[positionId]:clean}};
 if(Object.values(draft.priceHistories).reduce((n,h)=>n+h.points.length,0)>100000)throw Error('Lokales Kurslimit erreicht. Bestehende Daten bleiben erhalten.');
 return draft;
}
