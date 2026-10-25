import {retainedHistoryDraft} from './history-evidence-cache.js';
import {historicalExchangeRates} from './market.js';
import {projectHistoricalPosition,localHistoricalPrices} from './historical-position-value.js';
import {drawInteractiveChart,attachChartInteractions} from './dashboard-ui.js';
import {fetchPositionMarketHistory} from './position-history.js';
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
 return '<div class="history-row booking-compact"><div class="booking-main"><time datetime="'+esc(b.date)+'">'+esc(b.date)+'</time><strong>'+esc(name)+'</strong><span>'+esc(b.transferMatch?'Interner Transfer · '+(b.type==='withdraw'?'Ausgang':'Eingang'):TX_TYPES[b.type]||b.type)+(b.technical?' · technisch':'')+'</span><span>'+esc(signed(b.deltaExact))+'</span><strong>'+(b.technical?'Kein Handel':b.tradeExactEUR!==null?money(Number(b.tradeExactEUR)):'Kein belegter Handelswert')+'</strong></div><details class="booking-meta"><summary aria-label="Buchungsdetails für '+esc(name)+' am '+esc(b.date)+'">Buchungsdetails</summary><dl class="holding-facts">'+details.filter(([,v])=>v).map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+(b.type==='correction'?'<div><dt>Bestandsabgleich</dt><dd>Mengenänderung aus dem Journal. Kein Kauf, Ertrag oder externer Geldfluss.</dd></div>':'')+'</dl></details></div>';
}
export function createBookingHistoryUI({getModel,commit}){
 let dialog,trigger,positionId,limit,lastLoaded;const loaded=new Map();
 const el=k=>dialog.querySelector('[data-booking-history="'+k+'"]');
 function render(){
  const model=getModel(),p=model.positions.find(p=>p.id===positionId);if(!p)return;
  const history=positionHistory(model,p.id),events=filterChartPeriod(history.events,'wealth',el('period').value),view=el('view').value;
  el('quality').textContent='Brutto-Kaufvolumen: '+money(Number(history.grossBuysExactEUR))+(history.unknownBuys?' · '+history.unknownBuys+' Käufe ohne belegten Betrag':'')+'. Gebührenlücken und fehlende frühe Vorgänge erlauben keine Rendite- oder Steueraussage. '+(history.openingUndated?'Eröffnungsbestand ohne belegtes Datum. ':'')+'Unbekannte Bestände bleiben offen; keine Fortschreibung heutiger Kurse.';
  let prices=new Map();try{const imported=model.priceHistories?.[p.id];if(imported&&p.currency==='EUR')prices=new Map(validateImportedPriceHistory(imported,p).points.map(x=>[x.date,x.total]));}catch{}
  const rows=events.slice(0,limit);
  if(view==='events')el('output').innerHTML=rows.map(b=>bookingRowMarkup(b,model)).join('')||'<p>Keine Vorgänge in diesem Zeitraum.</p>';
  else{
   const key=JSON.stringify([positionId,model.settings,model.priceHistories?.[positionId]]);
   const marketHistory=localHistoricalPrices(model,p)??loaded.get(key)??null;
   const projection=projectHistoricalPosition(model,p.id,{marketHistory});
   const rows=filterChartPeriod(projection.rows,'wealth',el('period').value);
   const points=rows.filter(r=>view==='balances'?r.quantityExact!==null:view==='price'?r.priceExact!==null:r.valueEURExact!==null);
   const segmentByDate=new Map(projection.segments.flatMap((segment,index)=>segment.map(r=>[r.date,index])));
   const samples=points.map((r,index)=>({date:r.date,detail:'Bestand '+(r.quantityExact??'unbekannt')+' · Kurs '+(r.priceExact??'fehlt')+' '+p.currency+' · EUR-Faktor '+(r.fxExact??'fehlt')+' · '+r.source,total:Number(view==='balances'?r.quantityExact:view==='price'?r.priceExact:r.valueEURExact),breakBefore:index>0&&(rows.indexOf(r)!==rows.indexOf(points[index-1])+1||segmentByDate.get(r.date)!==segmentByDate.get(points[index-1].date))}));
   const unitsLabel=view==='balances'?'Bestand':view==='price'?'Kurs ('+p.currency+')':'Positionswert (€)';
   const hasGaps=rows.some(r=>view==='balances'?r.quantityExact===null:view==='price'?r.priceExact===null:r.valueEURExact===null)||projection.segments.length>1;
   const fmt=view==='balances'?v=>String(v):view==='price'?v=>new Intl.NumberFormat('de-AT',{style:'currency',currency:p.currency}).format(v):money;
   // Until the shared chart renders disjoint segments, keep unknown intervals
   // as explicit tabular observations instead of joining them with a false line.
   el('output').innerHTML='<h3>'+esc(p.name)+' · '+esc(unitsLabel)+'</h3>'+
    (samples.length>=2?drawInteractiveChart(samples,{money:fmt,esc,dateLabel:d=>d,disjoint:hasGaps}):'<p>'+esc(hasGaps?'Teilweise verfügbar. Unbekannte Abschnitte werden nicht verbunden. '+projection.reason:projection.reason||'Weniger als zwei belegte Punkte in diesem Zeitraum. Anderen Zeitraum wählen.')+'</p>')+
    (hasGaps?'<p class="small-help">Teilweise verfügbar · Lücken werden nicht verbunden.</p>':'')+'<p class="small-help">'+esc(marketHistory?.source||'Lokale Nachweise')+' · damaliger EOD-Bestand × damaliger Schlusskurs × historischer EUR-Faktor. Keine Rendite.</p>'+
    '<div class="wallet-history-table"><table><thead><tr><th scope="col">Datum</th><th scope="col">Bestand</th><th scope="col">Kurs</th><th scope="col">EUR-Faktor</th><th scope="col">Positionswert</th></tr></thead><tbody>'+rows.slice(-limit).reverse().map(r=>'<tr><td>'+esc(r.date)+'</td><td>'+esc(r.quantityExact??'Unbekannt')+'</td><td>'+esc(r.priceExact??'Fehlt')+'</td><td>'+esc(r.fxExact??'Fehlt')+'</td><td>'+esc(r.valueEURExact===null?'Unbekannt':money(Number(r.valueEURExact)))+'</td></tr>').join('')+'</tbody></table></div>';
   attachChartInteractions(el('output'));
  }
  el('more').hidden=view!=='events'||events.length<=limit;
 }
 function mount(){
  dialog=document.createElement('dialog');dialog.className='edit-dialog wallet-history-dialog';dialog.id='bookingHistoryDialog';dialog.setAttribute('aria-labelledby','bookingHistoryTitle');
  dialog.innerHTML='<div class="dialog-head"><h2 id="bookingHistoryTitle" tabindex="-1">Historie</h2><button type="button" class="icon-close" data-booking-history="close" aria-label="Historie schließen">×</button></div><div class="wallet-history-body"><div class="wallet-history-controls"><label class="field"><span>Anzeigezeitraum</span><select data-booking-history="period">'+CHART_PERIODS.wealth.map(p=>'<option value="'+p.value+'"'+(p.value==='all'?' selected':'')+'>'+p.label+'</option>').join('')+'</select></label><label class="field"><span>Ansicht</span><select data-booking-history="view"><option value="eur">Wert (€)</option><option value="price">Kurs</option><option value="balances">Bestand</option><option value="events">Transaktionen</option></select></label></div><button type="button" class="btn outline" data-booking-history="load">Historische Kurse laden</button><p role="status" data-booking-history="load-status"></p><details data-booking-history="retain" hidden><summary>Kurse lokal behalten</summary><label><input type="checkbox" data-booking-history="rights"> Ich darf diese Kursdaten lokal speichern.</label><label><input type="checkbox" data-booking-history="replace"> Abweichende lokale Quelle ausdrücklich ersetzen</label><button type="button" class="btn outline" data-booking-history="save-prices">Kurse behalten</button><p class="small-help">Keine Änderung an Buchungen oder Beständen. Gespeicherte Kurse bleiben offline und im Backup erhalten.</p></details><p class="small-help" data-booking-history="quality"></p><section data-booking-history="output" aria-label="Buchungshistorie"></section><button type="button" class="btn outline" data-booking-history="more">Weitere Vorgänge anzeigen</button></div>';
  document.body.append(dialog);
  const close=()=>{dialog.close();if(trigger?.isConnected)trigger.focus();};
  el('close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  for(const k of ['period','view'])el(k).onchange=()=>{limit=100;render();};
  el('load').onclick=async()=>{
   const m=getModel(),p=m.positions.find(p=>p.id===positionId),key=JSON.stringify([positionId,m.settings,m.priceHistories?.[positionId]]),requestedId=positionId;
   el('load').disabled=true;el('load-status').textContent='Historische Kurse werden geladen …';
   try{const period=CHART_PERIODS.wealth.find(x=>x.value===el('period').value),days=period?.days&&period.days<=1826?period.days:365;const h=await fetchPositionMarketHistory(p,m.settings,days);if(h.currency!=='EUR'&&h.points.length){try{h.fxPoints=await historicalExchangeRates(h.currency,h.points[0].date,h.points.at(-1).date);}catch{h.fxPoints=[];}}lastLoaded={positionId:requestedId,history:h,baseline:JSON.stringify(m)};el('retain').hidden=!commit;loaded.set(key,{...h,priceType:p.kind==='crypto'?'crypto-daily':'close'});if(loaded.size>20)loaded.delete(loaded.keys().next().value);if(positionId===requestedId&&getModel()===m){render();el('load-status').textContent='Geladene Quelle: '+h.source+'. Tatsächliche Abdeckung wird angezeigt.';}}catch(error){if(positionId===requestedId)el('load-status').textContent=(/429|Limit|quota/i.test(error.message)?'Anbieterlimit erreicht. ':/401|403|Tarif/i.test(error.message)?'Anbieterzugriff verweigert. ':'')+'Kurse nicht verfügbar. API-Schlüssel, Tarif und Börsennotierung prüfen oder lokale Kurs-CSV importieren. Vorhandene Daten bleiben erhalten.';}finally{el('load').disabled=false;}
  };
  el('save-prices').onclick=async()=>{if(!lastLoaded||!commit)return;try{if(JSON.stringify(getModel())!==lastLoaded.baseline||lastLoaded.positionId!==positionId)throw Error('Portfolio geändert. Kurse erneut laden.');const draft=retainedHistoryDraft(getModel(),positionId,lastLoaded.history,{rightsConfirmed:el('rights').checked,replace:el('replace').checked});await commit(draft);lastLoaded=null;el('retain').hidden=true;render();el('load-status').textContent='Kursdaten lokal gespeichert. Buchungen und Bestände unverändert.';}catch(error){el('load-status').textContent='Nicht gespeichert: '+error.message;}};
  el('more').onclick=()=>{limit+=100;render();};
 }
 return {open(id,button){if(!dialog)mount();positionId=id;trigger=button;limit=100;lastLoaded=null;el('retain').hidden=true;el('period').value='all';el('view').value='eur';el('load-status').textContent='';render();dialog.showModal();dialog.querySelector('h2').focus();}};
}
