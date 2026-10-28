/** Entirely invented records. No private export values, IDs or account metadata. */
export const bitpandaHeaders=['Transaction ID','Timestamp','Transaction Type','In/Out','Amount Fiat','Fiat','Amount Asset','Asset','Asset market price','Asset market price currency','Asset class','Product ID','Fee','Fee asset','Fee percent','Spread','Spread Currency','Tax Fiat'];
export function bitpandaCSV(changes=[{}],{preamble=['SYNTHETIC EXPORT','Owner,SYNTHETIC OWNER'],headers=bitpandaHeaders,newline='\n'}={}){
 const quote=v=>{const s=String(v??'');return /[,"\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;};
 return [...preamble,headers.map(quote).join(','),...changes.map((change,i)=>{
  const row={'Transaction ID':'SYNTHETIC-BP-'+i,Timestamp:'1999-01-02T12:00:00+01:00','Transaction Type':'buy','In/Out':'incoming','Amount Fiat':'500',Fiat:'EUR','Amount Asset':'0.01',Asset:'BTC','Asset market price':'50000','Asset market price currency':'EUR','Asset class':'Cryptocurrency','Product ID':'SYNTHETIC-PRODUCT',Fee:'0.00001','Fee asset':'BTC','Fee percent':'0.1',Spread:'0.5','Spread Currency':'EUR','Tax Fiat':'0',...change};
  return headers.slice(0,change.omitTax?-1:undefined).map(h=>quote(row[h])).join(',');
 })].join(newline);
}
