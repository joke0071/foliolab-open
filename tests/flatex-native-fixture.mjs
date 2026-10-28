/** Entirely invented records; no original values, references or private dates. */
export const depotHeaders=['Nummer','Buchtag','Valuta','ISIN','Bezeichnung','Nominal','','Buchungsinformationen','TA-Nr.','Kurs','','Depot'];
export const accountHeaders=['Buchtag','Valuta','BIC / BLZ','IBAN / Kontonummer','Buchungsinformationen','TA-Nr.','Betrag','','Auftraggeberkonto','Konto'];
export function nativeFlatexCSV(type='depot',changes=[{}],{headers=type==='depot'?depotHeaders:accountHeaders,newline='\n'}={}){
 const quote=v=>{const s=String(v??'');return /[;"\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;};
 const defaults=type==='depot'?['0007','02.01.1999','04.01.1999','IE00SYNTH001','Synthetischer Öl-Test','1.234,500000000000000001','Stk.','ABR ORDER Kauf IE00SYNTH001 0009007199254740993','00070000000000000001','2,5','EUR','SYN-DEPOT']:['02.01.1999','04.01.1999','SYN-BIC','SYN-COUNTERPARTY','ABR ORDER Kauf IE00SYNTH001 0009007199254740993','00080000000000000001','-3.086,25','EUR','SYN-ORIGIN','SYN-ACCOUNT'];
 return [headers.map(quote).join(';'),...changes.map(change=>defaults.map((v,i)=>quote(Object.hasOwn(change,i)?change[i]:v)).join(';'))].join(newline);
}
export function syntheticCP1252(text){
 return Uint8Array.from([...text].map(c=>{if(c==='€')return 128;if(c.charCodeAt(0)<=255)return c.charCodeAt(0);throw Error('Synthetic fixture encoding unsupported');}));
}
