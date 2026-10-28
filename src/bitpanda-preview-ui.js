/** Documentary source display using existing disclosure styles. No financial writes. */
import {escapeHTML as esc} from './model.js';
export function bitpandaMarkup(preview,{limit=50}={}){
 if(preview?.kind!=='bitpanda-document-preview'||preview.writeEnabled!==false||!Number.isSafeInteger(limit)||limit<1||limit>5000)throw Error('Ungültige Bitpanda-Anzeige.');
 const show=v=>esc(v==null||v===''?'unbekannt':String(v).length>300?String(v).slice(0,300)+' (Anzeige gekürzt)':String(v));
 const rows=preview.rows.slice(0,limit).map(row=>{
  const v=row.values,n=row.numbers;
  return '<details class="performance-details"><summary><span>'+show('Zeile '+row.line+' · '+v.Timestamp+' · '+v['Transaction Type']+' · '+(n['Amount Asset']??'unbekannt')+' '+v.Asset)+'</span></summary><div class="performance-details-body">'+
   '<p>Transaktions-ID: '+show(v['Transaction ID'])+' · Richtung laut Export: '+show(v['In/Out'])+'</p>'+
   '<p>Assetmenge laut Export: '+show(n['Amount Asset'])+' '+show(v.Asset)+' · Fiatbetrag laut Export: '+show(n['Amount Fiat'])+' '+show(v.Fiat)+'</p>'+
   '<p>Gebühr laut Export: '+show(n.Fee)+' '+show(v['Fee asset'])+' · Gebührenprozent laut Export: '+show(n['Fee percent'])+'</p>'+
   '<p>Marktpreis laut Export: '+show(n['Asset market price'])+' '+show(v['Asset market price currency'])+' · Spread laut Export: '+show(n.Spread)+' '+show(v['Spread Currency'])+'</p>'+
   '<p>Tax Fiat laut Export: '+show(n['Tax Fiat'])+(row.fieldCount===17?' (Quellfeld fehlt)':'')+'. Ungeprüfte Quellangabe, kein bestätigter Steuerwert.</p>'+
   '<p>Produkt-ID: '+show(v['Product ID'])+' · Assetklasse: '+show(v['Asset class'])+'</p>'+
   '<details><summary>Geparste Quellfelder</summary><dl>'+Object.entries(v).map(([key,value])=>'<dt>'+esc(key)+'</dt><dd>'+show(value)+'</dd>').join('')+'</dl></details>'+
   (row.issues.length?'<ul>'+row.issues.map(issue=>'<li>'+esc(issue)+'</li>').join('')+'</ul>':'')+'</div></details>';
 }).join('');
 return '<div class="ledger-live-preview bitpanda-preview"><h3>Bitpanda erkannt – lokale Vorschau</h3><p>'+esc(preview.reason)+'</p><p>'+preview.rows.length+' Quellzeilen · '+Math.min(limit,preview.rows.length)+' angezeigt. Doppelte und ungeklärte Zeilen bleiben erhalten.</p><p class="small-help">Zeit einschließlich Offset laut Export. Assetcodes, Produkt und Richtung bestätigen keine Positions- oder Transferzuordnung. Fehlende Steuer-, Gebühren- und Spreadwerte bleiben unbekannt.</p>'+rows+(preview.rows.length>limit?'<button type="button" id="bitpandaShowMore" class="btn outline">Weitere '+Math.min(50,preview.rows.length-limit)+' Zeilen anzeigen</button>':'')+'</div>';
}
