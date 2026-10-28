/** Entirely invented data. No private export rows or financial references. */
export const krakenHeaders=['txid','refid','time','type','subtype','aclass','subclass','asset','wallet','amount','fee','balance','amountusd','feeusd','balanceusd','feecurrency'];
export function krakenCSV(changes=[{}],headers=krakenHeaders){
 const quote=v=>{const s=String(v??'');return /[,"\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;};
 return [headers.join(','),...changes.map((change,i)=>{
  const row={txid:'SYNTHETIC-LEDGER-'+i,refid:'SYNTHETIC-GROUP',time:'1999-01-02 12:00:00',type:'trade',subtype:'tradespot',aclass:'currency',subclass:'crypto',asset:'BTC',wallet:'spot',amount:'0.01',fee:'0.00001',balance:'0.01',amountusd:'500',feeusd:'0.5',balanceusd:'500',feecurrency:'BTC',...change};
  return headers.map(h=>quote(row[h])).join(',');
 })].join('\n');
}
