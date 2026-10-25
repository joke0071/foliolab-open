import {positionHistory} from './booking-history.js';
import {escapeHTML as esc,money} from './model.js';
import {TX_TYPES} from './transactions.js';
import {CHART_PERIODS,filterChartPeriod} from './chart-periods.js';
import {validateImportedPriceHistory} from './historical-csv.js';
import {units,exact,mul} from './decimal.js';
const signed=q=>q===null?'Änderung unbekannt':(units(q)>0n?'+':'')+q;
export function bookingRowMarkup(b,model){
 const name=b.positionName||model.positions.find(p=>p.id===b.positionId)?.name||'Historische Position';
 const account=model.accounts.find(a=>a.id===(b.accountId||model.positions.find(p=>p.id===b.positionId)?.accountId));
 const details=[['Transferbeleg',b.transferMatch?.reference],['Konto',account?.name],['Notiz',b.notes],['Buchungs-ID',b.id],['Journal-ID',b.journalEntryId],['Quelle',b.importFingerprint?'CSV-Import':'Lokal erfasst'],['Zielposition',b.targetPositionId?model.positions.find(p=>p.id===b.targetPositionId)?.name||'Historische Position':null]];
 return '<div class="history-row booking-compact"><div class="booking-main"><time datetime="'+esc(b.date)+'">'+esc(b.date)+'</time><strong>'+esc(name)+'</strong><span>'+esc(b.transferMatch?'Interner Transfer · '+(b.type==='withdraw'?'Ausgang':'Eingang'):TX_TYPES[b.type]||b.type)+(b.technical?' · technisch':'')+'</span><span>'+esc(signed(b.deltaExact))+'</span><strong>'+(b.technical?'Kein Handel':b.tradeExactEUR!==null?money(Number(b.tradeExactEUR)):'Kein belegter Handelswert')+'</strong></div><details class="booking-meta"><summary>Buchungsdetails</summary><dl class="holding-facts">'+details.filter(([,v])=>v).map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+(b.type==='correction'?'<div><dt>Bestandsabgleich</dt><dd>Mengenänderung aus dem Journal. Kein Kauf, Ertrag oder externer Geldfluss.</dd></div>':'')+'</dl></details></div>';
}
export function createBookingHistoryUI({getModel}){
 let dialog,trigger,positionId,limit;
 const el=k=>dialog.querySelector('[data-booking-history="'+k+'"]');
 function render(){
  const model=getModel(),p=model.positions.find(p=>p.id===positionId);if(!p)return;
  const history=positionHistory(model,p.id),events=filterChartPeriod(history.events,'wealth',el('period').value),view=el('view').value;
  el('quality').textContent='Brutto-Kaufvolumen: '+money(Number(history.grossBuysExactEUR))+(history.unknownBuys?' · '+history.unknownBuys+' Käufe ohne belegten Betrag':'')+'. Gebührenlücken und fehlende frühe Vorgänge erlauben keine Rendite- oder Steueraussage. '+(history.openingUndated?'Eröffnungsbestand ohne belegtes Datum. ':'')+'Unbekannte Bestände bleiben offen; keine Fortschreibung heutiger Kurse.';
  let prices=new Map();try{const imported=model.priceHistories?.[p.id];if(imported&&p.currency==='EUR')prices=new Map(validateImportedPriceHistory(imported,p).points.map(x=>[x.date,x.total]));}catch{}
  const rows=events.slice(0,limit);
  if(view==='events')el('output').innerHTML=rows.map(b=>bookingRowMarkup(b,model)).join('')||'<p>Keine Vorgänge in diesem Zeitraum.</p>';
  else{
   // End-of-day balance, not a misleading series of intraday closing values.
   const perDay=new Map();for(const e of [...events].reverse()){
    if(!perDay.has(e.date))perDay.set(e.date,[]);perDay.get(e.date).push(e);
   }
   const journalOrder=new Map((model.journalEntries||[]).map(e=>[e.id,e.sequence||0]));
   const daily=[...perDay].sort(([a],[b])=>b.localeCompare(a)).slice(0,limit).map(([date,items])=>{
    const ordered=items.sort((a,b)=>(journalOrder.get(a.journalEntryId??a.id)||0)-(journalOrder.get(b.journalEntryId??b.id)||0));
    const balance=ordered.at(-1).balanceExact,price=prices.get(date);
    const value=balance!==null&&price!=null?exact(mul(units(balance),units(price))):null;
    return '<tr><td>'+esc(date)+'</td><td>'+esc(view==='balances'?balance??'Unbekannt':value===null?'Unbekannt':money(Number(value)))+'</td></tr>';
   });
   el('output').innerHTML='<p class="small-help">'+(view==='balances'?'Belegte Bestände nach dem letzten Journalvorgang des Tages.':'EUR-Werte nur an belegten Vorgangstagen mit passendem lokalem EUR-Schlusskurs. Keine Schätzung zwischen Datenpunkten.')+'</p><div class="wallet-history-table"><table><thead><tr><th scope="col">Datum</th><th scope="col">'+(view==='balances'?'Bestand':'EUR-Wert')+'</th></tr></thead><tbody>'+daily.join('')+'</tbody></table></div>';
  }
  el('more').hidden=events.length<=limit;
 }
 function mount(){
  dialog=document.createElement('dialog');dialog.className='edit-dialog wallet-history-dialog';dialog.id='bookingHistoryDialog';dialog.setAttribute('aria-labelledby','bookingHistoryTitle');
  dialog.innerHTML='<div class="dialog-head"><h2 id="bookingHistoryTitle" tabindex="-1">Historie</h2><button type="button" class="icon-close" data-booking-history="close" aria-label="Historie schließen">×</button></div><div class="wallet-history-body"><div class="wallet-history-controls"><label class="field"><span>Anzeigezeitraum</span><select data-booking-history="period">'+CHART_PERIODS.wealth.map(p=>'<option value="'+p.value+'"'+(p.value==='all'?' selected':'')+'>'+p.label+'</option>').join('')+'</select></label><label class="field"><span>Ansicht</span><select data-booking-history="view"><option value="events">Transaktionen / Ereignisse</option><option value="balances">Bestände</option><option value="eur">EUR-Wert</option></select></label></div><p class="small-help" data-booking-history="quality"></p><section data-booking-history="output" aria-label="Buchungshistorie"></section><button type="button" class="btn outline" data-booking-history="more">Weitere Vorgänge anzeigen</button></div>';
  document.body.append(dialog);
  const close=()=>{dialog.close();if(trigger?.isConnected)trigger.focus();};
  el('close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  for(const k of ['period','view'])el(k).onchange=()=>{limit=100;render();};
  el('more').onclick=()=>{limit+=100;render();};
 }
 return {open(id,button){if(!dialog)mount();positionId=id;trigger=button;limit=100;el('period').value='all';el('view').value='events';render();dialog.showModal();dialog.querySelector('h2').focus();}};
}
