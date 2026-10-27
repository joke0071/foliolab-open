// Synthetic native export; no private original rows/addresses/hashes are retained.
export const nativeHeader='Operation Date,Status,Currency Ticker,Operation Type,Operation Amount,Operation Fees,Operation Hash,Account Name,Account xpub,Countervalue Ticker,Countervalue at Operation Date,Countervalue at CSV Export';
export const owner='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',txid='a'.repeat(64),at='2025-01-01T12:00:00.000Z';
export function ledgerCSV(rows=[{}]){
 const fields=nativeHeader.split(',');
 const defaults={'Operation Date':at,Status:'Confirmed','Currency Ticker':'BTC','Operation Type':'IN','Operation Amount':'0.0248','Operation Fees':'','Operation Hash':txid,'Account Name':'Synthetic wallet','Account xpub':owner,'Countervalue Ticker':'USD','Countervalue at Operation Date':'1700','Countervalue at CSV Export':'2300'};
 const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
 return nativeHeader+'\r\n'+rows.map(row=>fields.map(f=>quote({...defaults,...row}[f])).join(',')).join('\r\n');
}
