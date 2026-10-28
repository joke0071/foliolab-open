/** Existing disclosure/CSV styles; source values are always escaped text. */
import {escapeHTML as esc} from './model.js';
export function krakenLedgerMarkup(preview,{limit=50}={}){
 if(preview?.kind!=='kraken-ledger-preview'||preview.writeEnabled!==false||!Number.isSafeInteger(limit)||limit<1||limit>5000)throw Error('Ungültige Kraken-Anzeige.');
 const show=v=>esc(v==null||v===''?'unbekannt':String(v).length>300?String(v).slice(0,300)+' (Anzeige gekürzt)':String(v));
 const counts=new Map();for(const group of preview.groups)for(const line of group.lines)counts.set(line,group.lines.length);
 const rows=preview.rows.slice(0,limit).map(row=>{
  const v=row.values,n=row.numbers;
  return '<details class="performance-details"><summary><span>'+show('Zeile '+row.line+' · '+v.time+' · '+v.type+' · '+(n.amount??'unbekannt')+' '+v.asset)+'</span></summary><div class="performance-details-body">'+
   '<p>'+show(row.meaning)+'</p><p>Ledger-ID: '+show(v.txid)+' · Referenzgruppe: '+show(v.refid)+' · '+counts.get(row.line)+' Zeile(n) dieser Gruppe. Keine feste Handelszuordnung.</p>'+
   '<p>Klasse / Subklasse: '+show(v.aclass)+' / '+show(v.subclass)+' · Wallet laut Export: '+show(v.wallet)+' · Subtyp: '+show(v.subtype)+'</p>'+
   '<p>Menge laut Export: '+show(n.amount)+' '+show(v.asset)+' · Gebühr laut Export: '+show(n.fee)+' '+show(v.feecurrency)+' · Folgesaldo laut Export: '+show(n.balance)+' '+show(v.asset)+'. Kein unabhängiger Bestandsnachweis.</p>'+
   '<p>USD-Zusatzwerte laut Export (Menge / Gebühr / Saldo): '+show(n.amountusd)+' / '+show(n.feeusd)+' / '+show(n.balanceusd)+'. Keine EUR-, Kurs- oder Einstandsumrechnung.</p>'+
   '<details><summary>Geparste Quellfelder</summary><dl>'+Object.entries(v).map(([k,value])=>'<dt>'+esc(k)+'</dt><dd>'+show(value)+'</dd>').join('')+'</dl></details>'+
   (row.issues.length?'<ul>'+row.issues.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>':'')+'</div></details>';
 }).join('');
 return '<div class="ledger-live-preview kraken-ledger-preview"><h3>Kraken Ledger erkannt – lokale Vorschau</h3><p>'+esc(preview.reason)+'</p><p>'+preview.rows.length+' Ledgerzeilen · '+preview.groups.length+' dokumentlokale Referenzgruppen · '+Math.min(limit,preview.rows.length)+' angezeigt. Doppelte und ungeklärte Zeilen bleiben erhalten.</p><p class="small-help">Zeit laut Export; Kraken dokumentiert UTC. Keine lokale Zeitzonenannahme. Assetcodes und Walletbezeichnungen sind keine bestätigte Positionszuordnung.</p>'+rows+(preview.rows.length>limit?'<button type="button" id="krakenShowMore" class="btn outline">Weitere '+Math.min(50,preview.rows.length-limit)+' Zeilen anzeigen</button>':'')+'</div>';
}
