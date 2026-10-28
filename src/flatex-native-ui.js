/** Existing disclosure UI; source documents never become financial transactions. */
import {escapeHTML as esc} from './model.js';
const labels={'order-buy':'ORDER Kauf','order-sell':'ORDER Verkauf',accumulation:'Thesaurierung','custody-change':'Lagerstellenwechsel',split:'Split',merger:'Fusion','fusion-cancellation':'Storno Fusion',cancellation:'Storno',unclassified:'Ungeklärt'};
const orderLabels={'possible-single':'Mögliche 1:1-Beziehung','multiple-cash-review':'Mehrere Kontobelege prüfen','multiple-depot-review':'Mehrere Depotausführungen prüfen','missing-depot':'Depotbeleg fehlt','missing-cash':'Kontobeleg fehlt',conflict:'Widerspruch prüfen','overlap-review':'Überlappung prüfen','cancelled-review':'Storno prüfen','scope-review':'Quellkontexte prüfen','source-review':'Quellangaben prüfen'};
const show=v=>esc(v==null||v===''?'unbekannt':String(v).length>300?String(v).slice(0,300)+' (Anzeige gekürzt)':String(v));
export function flatexNativeOrderMarkup(documents,links,{limit=20,legLimits={}}={}){
 if(links?.kind!=='flatex-native-order-links'||links.ready!==false||links.writeEnabled!==false||!Object.isFrozen(links)||!Number.isSafeInteger(limit)||limit<1||limit>5000)throw Error('Ungültige Flatex-Orderanzeige.');
 const possible=links.groups.filter(g=>g.status==='possible-single').length;
 const sourceRows=documents.map(f=>new Map(f.document.rows.map(r=>[r.line,r])));
 const groups=links.groups.slice(0,limit).map((g,i)=>{
  const legLimit=legLimits[i]??20;if(!Number.isSafeInteger(legLimit)||legLimit<1||legLimit>5000)throw Error('Ungültige Flatex-Beleganzeige.');
  const legs=[...g.depot,...g.cash];
  const items=legs.slice(0,legLimit).map((l,j)=>{
   const f=documents[l.sourceIndex],r=sourceRows[l.sourceIndex].get(l.line),v=r.values,n=r.numbers,depot=l.sourceType==='depot';
   return '<li id="flatexOrderLeg-'+i+'-'+j+'" tabindex="-1"><p>'+(depot?'Depot':'Konto')+' · Datei '+(l.sourceIndex+1)+' · '+show(f.name)+' · Zeile '+l.line+'</p><p>Bankreferenz: '+show(l.bankReference)+' · Orderreferenz: '+show(l.orderReference)+' · Quellkontext: '+show(l.sourceScope)+'</p><p>Buchtag: '+show(r.dates.bookingDate)+' · Valuta: '+show(r.dates.valueDate)+'</p><p>'+(depot?'Nominal laut Export: '+show(n.nominal)+' '+show(v.unit)+' · Kurs laut Export: '+show(n.rate)+' '+show(v.priceCurrency):'Betrag laut Export: '+show(n.amount)+' '+show(v.amountCurrency))+'</p></li>';
  }).join('');
  return '<details id="flatexOrderGroup-'+i+'" class="flatex-order-group"><summary>Order '+show(g.orderReference)+' · '+show(g.type==='buy'?'Kauf':g.type==='sell'?'Verkauf':'Typ ungeklärt')+' · '+show(g.isin)+' · '+esc(orderLabels[g.status])+' · '+g.depot.length+' Depotbelege / '+g.cash.length+' Kontobelege</summary><ul>'+g.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul><p>'+Math.min(legLimit,legs.length)+' von '+legs.length+' Belegen angezeigt.</p><ol>'+items+'</ol>'+(legs.length>legLimit?'<button type="button" class="btn outline" data-flatex-order-legs="'+i+'">Weitere '+Math.min(20,legs.length-legLimit)+' Belege anzeigen</button>':'')+'</details>';
 }).join('');
 return '<details id="flatexNativeOrders" class="flatex-order-review"><summary>Orderbeziehungen · '+links.groups.length+' Gruppen · '+possible+' mögliche Paare · '+(links.groups.length-possible)+' Prüffälle</summary><p class="small-help">Nur mögliche Quellenbeziehungen, keine bestätigte Abrechnung oder Kontoeigentümerschaft. Keine Buchungsübernahme, Summierung oder Gebühren-/Steueraufteilung.</p><p>'+links.unassigned.length+' Zeilen ohne Orderreferenz bleiben in den Quellzeilen sichtbar. '+Math.min(limit,links.groups.length)+' von '+links.groups.length+' Gruppen angezeigt.</p>'+groups+(links.groups.length>limit?'<button type="button" class="btn outline" id="flatexOrdersShowMore">Weitere '+Math.min(20,links.groups.length-limit)+' Gruppen anzeigen</button>':'')+'</details>';
}
export function flatexNativeMarkup(documents,{limit=50,orderLinks=null,orderLimit=20,legLimits={}}={}){
 if(!Array.isArray(documents)||!documents.length||documents.length>20||documents.some(f=>f?.document?.kind!=='flatex-native-document-preview'||f.document.writeEnabled!==false||f.document.ready!==false||!['depot','account'].includes(f.document.type))||!Number.isSafeInteger(limit)||limit<1||limit>5000)throw Error('Ungültige Flatex-Originalformatanzeige.');
 const all=documents.flatMap(f=>f.document.rows.map(row=>({name:f.name,document:f.document,row})));
 if(all.length>5000)throw Error('Flatex: insgesamt maximal 5.000 Datenzeilen je Vorschau.');
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
  '<p class="small-help">Keine Buchungsübernahme. Dateien und mögliche Überlappungen bleiben getrennt; Order- und Cashzuordnung sind noch nicht bestätigt. Für getrennte Uploads „Flatex Originalformat – Vorschau“ wählen.</p>'+(orderLinks?flatexNativeOrderMarkup(documents,orderLinks,{limit:orderLimit,legLimits}):'')+rows+
  (all.length>limit?'<button type="button" id="flatexNativeShowMore" class="btn outline">Weitere '+Math.min(50,all.length-limit)+' Zeilen anzeigen</button>':'')+'</div>';
}
