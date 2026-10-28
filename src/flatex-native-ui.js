/** Existing disclosure UI; source documents never become financial transactions. */
import {escapeHTML as esc} from './model.js';
const labels={'order-buy':'ORDER Kauf','order-sell':'ORDER Verkauf',accumulation:'Thesaurierung','custody-change':'Lagerstellenwechsel',split:'Split',merger:'Fusion','fusion-cancellation':'Storno Fusion',cancellation:'Storno',unclassified:'Ungeklärt'};
export function flatexNativeMarkup(documents,{limit=50}={}){
 if(!Array.isArray(documents)||!documents.length||documents.length>20||documents.some(f=>f?.document?.kind!=='flatex-native-document-preview'||f.document.writeEnabled!==false||f.document.ready!==false||!['depot','account'].includes(f.document.type))||!Number.isSafeInteger(limit)||limit<1||limit>5000)throw Error('Ungültige Flatex-Originalformatanzeige.');
 const all=documents.flatMap(f=>f.document.rows.map(row=>({name:f.name,document:f.document,row})));
 if(all.length>5000)throw Error('Flatex: insgesamt maximal 5.000 Datenzeilen je Vorschau.');
 const show=v=>esc(v==null||v===''?'unbekannt':String(v).length>300?String(v).slice(0,300)+' (Anzeige gekürzt)':String(v));
 const counts=documents.reduce((s,f)=>{s[f.document.type]+=f.document.rows.length;return s;},{depot:0,account:0});
 const dates=all.flatMap(({row})=>row.dates.bookingDate?[row.dates.bookingDate]:[]).sort();
 const rows=all.slice(0,limit).map(({name,document:d,row:r})=>{
  const v=r.values,n=r.numbers,depot=d.type==='depot',type=depot?'Depot':'Konto';
  const amount=depot?(n.nominal??'unbekannt')+' '+v.unit:(n.amount??'unbekannt')+' '+v.amountCurrency;
  return '<details class="performance-details"><summary><span>'+show(type+' · '+(r.dates.bookingDate||v.bookingDate)+' · '+labels[r.kind]+' · '+amount)+'</span></summary><div class="performance-details-body">'+
   '<p>'+show(name)+' · Zeile '+r.line+' · '+show(d.encoding)+'</p>'+
   '<p>Buchtag: '+show(r.dates.bookingDate)+' · Valuta: '+show(r.dates.valueDate)+'</p>'+
   '<p>Bank-Transaktionsreferenz: '+show(v.transactionReference)+' · Orderreferenz im Quelltext: '+show(r.order?.reference)+'. Keine bestätigte Gegenbuchung.</p>'+
   (depot?'<p>Nominal laut Export: '+show(n.nominal)+' '+show(v.unit)+' · Kurs laut Export: '+show(n.rate)+' '+show(v.priceCurrency)+'</p>':'<p>Betrag laut Export: '+show(n.amount)+' '+show(v.amountCurrency)+'. Keine bestätigte externe Ein- oder Auszahlung.</p>')+
   '<details><summary>Geparste Quellfelder</summary><dl>'+d.columns.map(c=>'<dt>'+esc(c.header||({unit:'Einheit',priceCurrency:'Kurswährung',amountCurrency:'Betragswährung'}[c.key]||c.key)+' (ohne Spaltenüberschrift)')+'</dt><dd>'+show(v[c.key])+'</dd>').join('')+'</dl></details>'+
   (r.issues.length?'<ul>'+r.issues.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>':'')+'</div></details>';
 }).join('');
 return '<div class="ledger-live-preview flatex-native-preview"><h3>Flatex Originalformat – lokale Vorschau</h3><p>'+counts.depot+' Depotzeilen · '+counts.account+' Kontozeilen · '+Math.min(limit,all.length)+' von '+all.length+' angezeigt.</p>'+
  (dates.length?'<p>Gültige Buchtage: '+esc(dates[0])+' bis '+esc(dates.at(-1))+'. Ungeklärte Datumsangaben bleiben in den Quellzeilen sichtbar.</p>':'')+
  '<p class="small-help">Keine Buchungsübernahme. Dateien und mögliche Überlappungen bleiben getrennt; Order- und Cashzuordnung sind noch nicht bestätigt. Für getrennte Uploads „Flatex Originalformat – Vorschau“ wählen.</p>'+rows+
  (all.length>limit?'<button type="button" id="flatexNativeShowMore" class="btn outline">Weitere '+Math.min(50,all.length-limit)+' Zeilen anzeigen</button>':'')+'</div>';
}
