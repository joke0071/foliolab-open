/** Strict, offline historical closing-price CSV import; never reads or changes holdings. */
const MAX_BYTES=1500000,MAX_POINTS=6500;
const ISO=/^\d{4}-\d{2}-\d{2}$/;
const dateOK=d=>ISO.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d&&d<=new Date().toISOString().slice(0,10);
const header=x=>String(x??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function rowsCSV(text,delimiter){
 const rows=[];let cells=[],field='',quotes=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){
   if(quotes&&text[i+1]==='"'){field+='"';i++;}
   else if(!quotes&&field.trim()==='')quotes=true;
   else if(quotes)quotes=false;
   else throw Error('Fehlerhaftes CSV-Anführungszeichen.');
  }else if(c===delimiter&&!quotes){cells.push(field.trim());field='';}
  else if((c==='\r'||c==='\n')&&!quotes){
   cells.push(field.trim());field='';if(cells.some(Boolean))rows.push(cells);
   cells=[];if(c==='\r'&&text[i+1]==='\n')i++;
   if(rows.length>MAX_POINTS+40)throw Error('Zu viele CSV-Zeilen.');
  }else field+=c;
 }
 if(quotes)throw Error('CSV-Datei enthält unvollständige Anführungszeichen.');
 cells.push(field.trim());if(cells.some(Boolean))rows.push(cells);
 return rows;
}
function parseDate(raw){
 let s=String(raw??'').trim();
 if(/^\d{4}-\d{2}-\d{2}T/.test(s))s=s.slice(0,10);
 if(/^\d{1,2}[./]\d{1,2}[./]\d{4}$/.test(s)){
  const [day,month,year]=s.split(/[./]/);s=year+'-'+month.padStart(2,'0')+'-'+day.padStart(2,'0');
 }
 if(!dateOK(s))throw Error('Ungültiges oder zukünftiges Kursdatum: '+s.slice(0,24));
 return s;
}
function parseNumber(raw){
 let s=String(raw??'').trim().replace(/\s/g,'').replace(/[€$£]/g,'');
 if(!s||/[a-z]/i.test(s)||s.includes('%'))throw Error('Kurswert fehlt oder ist ungültig.');
 if(s.includes(',')&&s.includes('.')){
  if(s.lastIndexOf(',')>s.lastIndexOf('.'))s=s.replace(/\./g,'').replace(',','.');
  else s=s.replace(/,/g,'');
 }else if(s.includes(','))s=s.replace(',','.');
 if(!/^\d+(?:\.\d+)?$/.test(s))throw Error('Ungültiges Kurszahlenformat.');
 const n=Number(s);if(!Number.isFinite(n)||n<=0||n>1000000000)throw Error('Kurs muss größer als null und plausibel sein.');
 return n;
}
function matchColumn(cols,exact,partial=[]){
 for(const word of exact){const idx=cols.indexOf(word);if(idx>=0)return idx;}
 for(const word of partial){const idx=cols.findIndex(x=>x.startsWith(word));if(idx>=0)return idx;}
 return -1;
}
export function parseHistoricalPriceCSV(text,position){
 if(typeof text!=='string'||text.length>MAX_BYTES||text.length<12)throw Error('CSV fehlt oder ist zu groß (max. 1,5 MB).');
 const input=text.replace(/^\uFEFF/,'');
 const first=input.split(/\r?\n/,1)[0];
 const candidate=[',',';','\t'].map(d=>[d,rowsCSV(first,d)[0]?.length||0]).sort((a,b)=>b[1]-a[1])[0];
 const delimiter=candidate?.[1]>=2?candidate[0]:null;
 if(!delimiter)throw Error('CSV benötigt getrennte Spalten (Komma, Semikolon oder Tab).');
 const rows=rowsCSV(input,delimiter);
 if(rows.length<3)throw Error('Mindestens zwei Kursdaten und eine Kopfzeile erforderlich.');
 const h=rows[0].map(header);
 const date=matchColumn(h,['datum','date','datetime','tradingdate','handelsdatum','zeitstempel','timestamp']);
 const price=matchColumn(h,['schlusskurs','schluss','close','closingprice','schlusskursbereinigt','kurs','price','last','wert','adjclose','adjustedclose']);
 const curr=matchColumn(h,['currency','wahrung','kurswahrung','waehrung']);
 const symbol=matchColumn(h,['ticker','symbol','borsenkurzel','boersenkurzel']);
 const isin=matchColumn(h,['isin']);
 if(date<0||price<0||date===price)throw Error('Spalten „Datum/Date“ und „Schlusskurs/Close“ fehlen.');
 const requestedCurrency=String(position.currency||'EUR').toUpperCase();
 const points=new Map();
 for(let i=1;i<rows.length;i++){
  const r=rows[i];if(r.length!==h.length)throw Error('CSV hat in Zeile '+(i+1)+' eine abweichende Spaltenzahl.');
  const d=parseDate(r[date]),v=parseNumber(r[price]);
  if(curr>=0&&String(r[curr]).trim().toUpperCase()!==requestedCurrency)throw Error('CSV-Kurswährung weicht von der Position ab (Zeile '+(i+1)+').');
  if(symbol>=0&&position.symbol&&String(r[symbol]).trim().toUpperCase()!==String(position.symbol).trim().toUpperCase())throw Error('CSV-Ticker passt nicht zur gewählten Position.');
  if(isin>=0&&position.isin&&String(r[isin]).trim().toUpperCase()!==String(position.isin).trim().toUpperCase())throw Error('CSV-ISIN passt nicht zur gewählten Position.');
  if(points.has(d)&&points.get(d)!==v)throw Error('Widersprüchliche CSV-Kurse am '+d+'.');
  points.set(d,v);
 }
 if(points.size<2)throw Error('Mindestens zwei unterschiedliche Kurstage erforderlich.');
 const ordered=[...points].sort(([a],[b])=>a.localeCompare(b)).map(([date,total])=>({date,total}));
 return validateImportedPriceHistory({currency:requestedCurrency,source:'CSV (selbst geprüft)',points:ordered},position);
}
export function validateImportedPriceHistory(history,position){
 if(!history||typeof history!=='object'||Array.isArray(history)||history.source!=='CSV (selbst geprüft)')throw Error('Ungültige CSV-Kurshistorie.');
 const currency=String(history.currency||'').toUpperCase();
 if(!/^[A-Z]{3}$/.test(currency)||(position&&currency!==String(position.currency||'EUR').toUpperCase()))throw Error('Kurshistorie und Position haben unterschiedliche Währungen.');
 if(!Array.isArray(history.points)||history.points.length<2||history.points.length>MAX_POINTS)throw Error('Historische Kurse überschreiten die Datenlimits.');
 let last='';
 const points=history.points.map(row=>{
  const d=String(row?.date||''),n=Number(row?.total);
  if(!dateOK(d)||d<=last||!Number.isFinite(n)||n<=0||n>1000000000)throw Error('Beschädigte oder unsortierte historische Kurse.');
  last=d;
  return {date:d,total:n};
 });
 return {currency,source:'CSV (selbst geprüft)',points};
}
export function importedHistoryForPeriod(model,position,days=30,now=Date.now()){
 const data=model.priceHistories?.[position.id];
 if(!data)return null;
 const valid=validateImportedPriceHistory(data,position);
 if(![7,30,90,365,1826,'max'].includes(days))throw Error('Unbekannter Diagrammzeitraum.');
 const start=days==='max'?'0000-01-01':new Date(now-(days-1)*86400000).toISOString().slice(0,10),end=new Date(now).toISOString().slice(0,10);
 return {kind:'market',source:'CSV (selbst geprüft)',currency:valid.currency,
  points:valid.points.filter(p=>p.date>=start&&p.date<=end)};
}
