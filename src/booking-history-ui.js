import {retainedHistoryDraft,historyIdentity} from './history-evidence-cache.js';
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
// Display rounding only; exact stored quantities remain available on focus/hover.
export const historicalNumber=value=>new Intl.NumberFormat('de-AT',{maximumSignificantDigits:8,notation:Number(value)!==0&&Math.abs(Number(value))<0.000001?'scientific':'standard'}).format(value);
// Axis labels describe the selected metric; quantities never inherit a currency.
export function historicalAxisLabel(value,currency=null){
 const n=Number(value);if(!Number.isFinite(n))return '–';
 return new Intl.NumberFormat('de-AT',{maximumSignificantDigits:3,notation:n!==0&&Math.abs(n)<0.000001?'scientific':'compact',...(currency?{style:'currency',currency,currencyDisplay:'narrowSymbol'}:{})}).format(n);
}
const historicalCell=(label,value,fallback)=>'<td data-label="'+esc(label)+'"'+(value==null?'':' tabindex="0" title="Exakter Wert: '+esc(value)+'" aria-label="'+esc(label+': '+historicalNumber(value)+'. Exakter Wert: '+value)+'"')+'>'+esc(value==null?fallback:historicalNumber(value))+'</td>';
const historicalDate=date=>date.split('-').reverse().join('.');
const signed=q=>q===null?'Änderung unbekannt':(units(q)>0n?'+':'')+q;
export function bookingRowMarkup(b,model,{archived=false,managementReason='',editAction='',transferAction='',counterpartLabel=''}={}){
 const name=b.positionName||model.positions.find(p=>p.id===b.positionId)?.name||'Historische Position';
 const account=model.accounts.find(a=>a.id===(b.accountId||model.positions.find(p=>p.id===b.positionId)?.accountId));
 const entry=model.journalEntries.find(e=>e.id===(b.journalEntryId??b.id)),position=model.positions.find(p=>p.id===b.positionId);
 const source=b.importSource||b.importFingerprint||entry?.source==='csv'?'CSV-/Brokerimport':position?.wallet?.enabled||['wallet','blockchain'].includes(entry?.source)?'Wallet-/Blockchain-Nachweis':b.technical?'Technischer Journalabgleich':entry?.source==='manual'?'Manuell':'Herkunft ungeklärt';
 const details=[['Bearbeitungshinweis',managementReason],['Transferbeleg',b.transferMatch?.reference],['Gegenbuchungen',counterpartLabel],['Konto',account?.name],['Notiz',b.notes],['Buchungs-ID',b.id],['Journal-ID',b.journalEntryId],['Quelle',source],['Zielposition',b.targetPositionId?model.positions.find(p=>p.id===b.targetPositionId)?.name||'Historische Position':null]];
 return '<div class="history-row booking-compact"><div class="booking-main"><time datetime="'+esc(b.date)+'">'+esc(b.date)+'</time><strong>'+esc(name)+'</strong><span>'+esc(b.transferMatch?'Interner Transfer · '+(b.type==='withdraw'?'Ausgang':'Eingang'):TX_TYPES[b.type]||b.type)+(b.technical?' · technisch':'')+'</span><span>'+esc(signed(b.deltaExact))+'</span><strong>'+(b.technical?'Kein Handel':b.tradeExactEUR!==null?money(Number(b.tradeExactEUR)):'Kein belegter Handelswert')+'</strong><small class="booking-origin">'+esc(source+(archived?' · archiviert':''))+'</small></div><div class="detail-action-row booking-detail-actions"><details class="booking-meta"><summary aria-label="Buchungsdetails für '+esc(name)+' am '+esc(b.date)+'">Buchungsdetails</summary><dl class="holding-facts">'+details.filter(([,v])=>v).map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+(b.type==='correction'?'<div><dt>Bestandsabgleich</dt><dd>Mengenänderung aus dem Journal. Kein Kauf, Ertrag oder externer Geldfluss.</dd></div>':'')+'</dl>'+transferAction+'</details>'+editAction+'</div></div>';
}
export function createBookingHistoryUI({getModel,commit}){
 let dialog,trigger,positionId,limit,lastLoaded;const loaded=new Map();
 const el=k=>dialog.querySelector('[data-booking-history="'+k+'"]');
 function render(){
  const model=getModel(),p=model.positions.find(p=>p.id===positionId);if(!p)return;
  const local=localHistoricalPrices(model,p);el('load').textContent=local&&local.currency!=='EUR'&&commit?'EUR-Wechselkurse laden & behalten':'Historische Kurse laden';
  const history=positionHistory(model,p.id),events=filterChartPeriod(history.events,'wealth',el('period').value),view=el('view').value;
  el('quality').textContent='Brutto-Kaufvolumen: '+money(Number(history.grossBuysExactEUR))+(history.unknownBuys?' · '+history.unknownBuys+' Käufe ohne belegten Betrag':'')+'. Gebührenlücken und fehlende frühe Vorgänge erlauben keine Rendite- oder Steueraussage. '+(history.openingUndated?'Eröffnungsbestand ohne belegtes Datum. ':'')+'Unbekannte Bestände bleiben offen; keine Fortschreibung heutiger Kurse.';
  let prices=new Map();try{const imported=model.priceHistories?.[p.id];if(imported&&p.currency==='EUR')prices=new Map(validateImportedPriceHistory(imported,p).points.map(x=>[x.date,x.total]));}catch{}
  const rows=events.slice(0,limit);
  if(view==='events')el('output').innerHTML=rows.map(b=>bookingRowMarkup(b,model)).join('')||'<p>Keine Vorgänge in diesem Zeitraum.</p>';
  else{
   const key=JSON.stringify([positionId,historyIdentity(p),model.settings,model.priceHistories?.[positionId]]);
   const marketHistory=localHistoricalPrices(model,p)??loaded.get(key)??null;
   const projection=projectHistoricalPosition(model,p.id,{marketHistory});
   const rows=filterChartPeriod(projection.rows,'wealth',el('period').value);
   const points=view==='price'&&marketHistory?filterChartPeriod(marketHistory.points,'wealth',el('period').value).map(point=>({date:point.date,priceExact:String(point.total),quantityExact:null,fxExact:null,fxDate:null,valueEURExact:null,source:marketHistory.source})):rows.filter(r=>view==='balances'?r.quantityExact!==null:view==='price'?r.priceExact!==null:r.valueEURExact!==null);
   const segmentByDate=new Map(projection.segments.flatMap((segment,index)=>segment.map(r=>[r.date,index])));
   const samples=points.map((r,index)=>({date:r.date,detail:view==='price'?'Kursbeobachtung · '+r.source:'Bestand '+(r.quantityExact??'unbekannt')+' · Kurs '+(r.priceExact??'fehlt')+' '+(marketHistory?.currency||p.currency)+' · EUR-Faktor '+(r.fxExact??'fehlt')+' vom '+(r.fxDate??'unbekannt')+' · '+r.source,total:Number(view==='balances'?r.quantityExact:view==='price'?r.priceExact:r.valueEURExact),breakBefore:index>0&&(view==='price'?(Date.parse(r.date)-Date.parse(points[index-1].date))/864e5>(p.kind==='crypto'?1:4):(rows.indexOf(r)!==rows.indexOf(points[index-1])+1||(view==='balances'?(Date.parse(r.date)-Date.parse(points[index-1].date))/864e5>(p.kind==='crypto'?1:4):segmentByDate.get(r.date)!==segmentByDate.get(points[index-1].date))))}));
   const unitsLabel=view==='balances'?'Bestand':view==='price'?'Kurs ('+(marketHistory?.currency||p.currency)+')':'Positionswert (€)';
   const hasGaps=view==='price'?points.some((r,i)=>i&&(Date.parse(r.date)-Date.parse(points[i-1].date))/864e5>(p.kind==='crypto'?1:4)):rows.some(r=>view==='balances'?r.quantityExact===null:view==='price'?r.priceExact===null:r.valueEURExact===null)||(view==='balances'?samples.some(sample=>sample.breakBefore):projection.segments.length>1);
   const fmt=view==='balances'?v=>String(v):view==='price'?v=>historicalNumber(v)+' '+(marketHistory?.currency||p.currency):money;
   const axisFormat=view==='balances'?v=>historicalAxisLabel(v):view==='price'?v=>historicalAxisLabel(v,marketHistory?.currency||p.currency):undefined;
   // Keep metric-specific evidence boundaries; never interpolate unknown values.
   el('output').innerHTML='<h3>'+esc(p.name)+' · '+esc(unitsLabel)+'</h3>'+
    (samples.length>=2?drawInteractiveChart(samples,{money:fmt,esc,dateLabel:historicalDate,axisFormat,disjoint:hasGaps}):'<p>'+esc(projection.reason||'Weniger als zwei belegte Punkte in diesem Zeitraum. Anderen Zeitraum wählen.')+'</p>')+
    (hasGaps?'<p class="small-help">Teilweise verfügbar · Lücken werden nicht verbunden.</p>':'')+'<p class="small-help">'+esc(view==='balances'?'Datierte Bestandsnachweise':marketHistory?.source||'Lokale Nachweise')+(view==='price'?' · Datierte Kursbeobachtungen. Keine Positionsbewertung.':view==='balances'?' · Keine Positionsbewertung.':' · damaliger EOD-Bestand × damaliger Schlusskurs × historischer EUR-Faktor. Keine Rendite.')+'</p>'+
    '<p class="small-help historical-number-note">Anzeige gerundet · exakte Mengen, Kurse und EUR-Faktoren durch Antippen oder Tastaturfokus auf die Zahl.</p><div class="wallet-history-table booking-value-table"><table role="table" aria-label="Historische Positionswerte"><thead><tr><th scope="col">Datum</th><th scope="col">Bestand</th><th scope="col">Kurs</th><th scope="col">EUR-Faktor</th><th scope="col">Positionswert</th></tr></thead><tbody>'+rows.slice(-limit).reverse().map(r=>'<tr><td data-label="Datum"><time datetime="'+esc(r.date)+'">'+esc(historicalDate(r.date))+'</time></td>'+historicalCell('Bestand',r.quantityExact,'Unbekannt')+historicalCell('Kurs',r.priceExact,'Fehlt')+historicalCell('EUR-Faktor',r.fxExact,'Fehlt')+'<td data-label="Positionswert">'+esc(r.valueEURExact===null?'Unbekannt':money(Number(r.valueEURExact)))+'</td></tr>').join('')+'</tbody></table></div>';
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
   const m=getModel(),p=m.positions.find(p=>p.id===positionId),key=JSON.stringify([positionId,historyIdentity(p),m.settings,m.priceHistories?.[positionId]]),requestedId=positionId,baseline=JSON.stringify(m);
   el('load').disabled=true;el('load-status').textContent='Historische Kurse werden geladen …';
   try{const local=localHistoricalPrices(m,p);if(local&&local.currency!=='EUR'&&commit){const fxPoints=await historicalExchangeRates(local.currency,local.points[0].date,local.points.at(-1).date);if(!fxPoints.length)throw Error('Keine historischen EUR-Wechselkurse verfügbar.');if(JSON.stringify(getModel())!==baseline||positionId!==requestedId)throw Error('Portfolio geändert. Wechselkurse erneut laden.');const clean=validateImportedPriceHistory({...local,fxPoints},p);await commit({...m,priceHistories:{...m.priceHistories,[p.id]:clean}});render();el('load-status').textContent='Historische EUR-Wechselkurse lokal gespeichert. Fehlende Tage bleiben offen; Buchungen und Bestände unverändert.';return;}const period=CHART_PERIODS.wealth.find(x=>x.value===el('period').value),days=period?.days&&period.days<=1826?period.days:365;const h=await fetchPositionMarketHistory(p,m.settings,days);if(h.currency!=='EUR'&&h.points.length){try{h.fxPoints=await historicalExchangeRates(h.currency,h.points[0].date,h.points.at(-1).date);}catch{h.fxPoints=[];}}lastLoaded={positionId:requestedId,history:h,baseline};el('retain').hidden=!commit;loaded.set(key,{...h,priceType:p.kind==='crypto'?'crypto-daily':'close'});if(loaded.size>20)loaded.delete(loaded.keys().next().value);if(positionId===requestedId&&getModel()===m){render();el('load-status').textContent='Geladene Quelle: '+h.source+'. Tatsächliche Abdeckung wird angezeigt.';}}catch(error){if(positionId===requestedId)el('load-status').textContent=(commit&&m.priceHistories?.[requestedId]?.currency&&m.priceHistories[requestedId].currency!=='EUR')?'EUR-Wechselkurse nicht übernommen. Verbindung und unverändertes Portfolio prüfen; später erneut laden. Vorhandene Daten bleiben erhalten.':(/429|Limit|quota/i.test(error.message)?'Anbieterlimit erreicht. ':/401|403|Tarif/i.test(error.message)?'Anbieterzugriff verweigert. ':'')+'Kurse nicht verfügbar. API-Schlüssel, Tarif und Börsennotierung prüfen oder lokale Kurs-CSV importieren. Vorhandene Daten bleiben erhalten.';}finally{el('load').disabled=false;}
  };
  el('save-prices').onclick=async()=>{if(!lastLoaded||!commit)return;try{if(JSON.stringify(getModel())!==lastLoaded.baseline||lastLoaded.positionId!==positionId)throw Error('Portfolio geändert. Kurse erneut laden.');const draft=retainedHistoryDraft(getModel(),positionId,lastLoaded.history,{rightsConfirmed:el('rights').checked,replace:el('replace').checked});await commit(draft);lastLoaded=null;el('retain').hidden=true;render();el('load-status').textContent='Kursdaten lokal gespeichert. Buchungen und Bestände unverändert.';}catch(error){el('load-status').textContent='Nicht gespeichert: '+error.message;}};
  el('more').onclick=()=>{limit+=100;render();};
 }
 return {open(id,button){if(!dialog)mount();positionId=id;trigger=button;limit=100;lastLoaded=null;el('retain').hidden=true;el('period').value='all';el('view').value='eur';el('load-status').textContent='';render();dialog.showModal();dialog.querySelector('h2').focus();}};
}
