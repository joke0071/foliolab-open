import {calendarDateLabel,exactQuantityLabel,svg} from './format.js';
import {projectHistoricalPosition} from './historical-position-value.js';
import {marketHistoryCapability,fetchPositionMarketHistory,availablePositionPeriods,observedPositionPeriods,filterHistoryByDays} from './position-history.js';
import {renderChartPeriodButtons,syncChartPeriodButtons} from './chart-periods.js';
import {drawInteractiveChart,attachChartInteractions} from './dashboard-ui.js';
import {importedHistoryForPeriod} from './historical-csv.js';
import {positionBookingTimeline} from './position-bookings.js';
import {displayQuotePrice,positionValueLabel,hasMissingPositionValue} from './quote-quality.js';

/** Browser exceptions cannot distinguish a CORS rejection from a network blocker.
 * Always display a complete, credential-safe explanation rather than a raw
 * truncated provider exception. */
export function safeHistoryError(error,{security=false}={}){
 const reason=String(error?.message||error||'');
 if(/EODHD im Browser|Netzwerk|CORS|NetworkError|Failed to fetch|Load failed|Zeitüberschreitung/i.test(reason))
  return 'Der Kursanbieter ist aus diesem Browser nicht erreichbar. Möglich sind CORS, Netzwerkfilter oder eine Verbindungssperre. '+(security?'Der API-Schlüssel konnte deshalb nicht überprüft werden.':'Es wurden keine historischen Kurse übernommen.');
 if(/HTTP 401|HTTP 403|HTTP 402|Zugang|Tarif/i.test(reason))
  return 'Der Kursanbieter hat den Abruf abgelehnt. Bitte API-Schlüssel, Tarif und freigeschaltete Börsen prüfen.';
 if(/429|Ratenlimit|rate limit|quota/i.test(reason))
  return 'Das Abruflimit ist erreicht. Bitte später erneut versuchen oder den API-Tarif prüfen.';
 if(/Zu wenige|weniger als zwei|nicht genügend|keine.*Kursdaten/i.test(reason))
  return 'Für den ausgewählten Zeitraum liegen nicht genug historische Kurse vor. Bitte einen längeren Zeitraum wählen.';
 return 'Der Kursanbieter konnte aktuell keinen verlässlichen Kursverlauf liefern. Bitte Datenquelle, Börsenkürzel und Verbindung prüfen.';
}
function collapsedHistory(message,{esc,id='',retry=false}){
 const action=retry?'<button type="button" class="position-history-retry" data-action="retry-price-chart" data-id="'+esc(id)+'">Erneut prüfen</button>':'';
 return '<details class="position-history-compact"><summary>Kursverlauf nicht verfügbar</summary><p class="position-history-unavailable">'+esc(message)+'</p>'+action+'</details>';
}

const quoteCurrency=(value,currency)=>new Intl.NumberFormat('de-AT',{style:'currency',currency,maximumFractionDigits:currency==='JPY'?0:6}).format(value);
const securityKind=p=>['etf','stock','fund'].includes(p.kind);
const positionCharts=new WeakMap();
function positionChartTools(p,model,esc){
 if(!securityKind(p)&&p.kind!=='crypto')return '';
 const imported=model.priceHistories?.[p.id];
 const csv=securityKind(p)?'<div class="position-csv-actions"><button class="position-csv-import" type="button" data-action="import-price-history" data-id="'+esc(p.id)+'">'+
  svg('folder',14)+(imported?'CSV-Kursverlauf ersetzen':'CSV-Kursverlauf importieren')+'</button>'+
  (imported?'<button type="button" class="position-csv-remove" data-action="remove-price-history" data-id="'+esc(p.id)+'">'+svg('trash',14)+'CSV-Kursverlauf entfernen</button>':'')+
  '</div><p class="position-csv-help">Datum und Schlusskurs in der Handelswährung dieser Position. Die Datei bleibt lokal.</p>':'';
 return '<div class="chart-period position-period" role="group" aria-label="Zeitraum des Kursverlaufs">'+
  '<div class="position-period-presets"></div><details class="position-period-more"'+(csv?'':' hidden')+
  '><summary aria-label="Weitere Zeiträume und Kursdaten" title="Weitere Zeiträume und Kursdaten">⋯</summary>'+
  '<div class="position-period-popover"><div class="position-period-extended"></div>'+csv+'</div></details></div>';
}

export function positionDetailMarkup(p,model,{esc,money,quant,valueEUR}){
 // Provider allocation reflects the provider heading above all its accounts.
 // Account allocation would show a misleading 100% for every single-holding
 // savings or term-deposit account at the same provider.
 const account=model.accounts.find(a=>a.id===p.accountId);
 const providerAccountIds=new Set(model.accounts.filter(a=>a.providerId===(account?.providerId||p.providerId)).map(a=>a.id));
 const providerTotal=model.positions.filter(x=>providerAccountIds.has(x.accountId)).reduce((sum,x)=>sum+valueEUR(x),0);
 const amount=valueEUR(p),weight=providerTotal>0&&amount!==null&&amount>=0&&!model.positions.some(x=>providerAccountIds.has(x.accountId)&&hasMissingPositionValue(x))?100*amount/providerTotal:null;
 const cost=p.costBasisEUR==null?'–':money(p.costBasisEUR);
 const quotePrice=displayQuotePrice(p);
 const price=quotePrice===null?'Nicht verfügbar':quoteCurrency(quotePrice,p.currency||'EUR');
 const quote=String(p.quoteSource||'').trim()?esc(p.quoteSource):'Unbekannt',date=p.quoteAsOf?' · '+esc(p.quoteAsOf):'';
 const quoteCredit=p.quoteSource==='CoinPaprika'?'<a class="position-history-external" href="https://coinpaprika.com/" target="_blank" rel="noopener noreferrer">Powered by CoinPaprika</a>':'';
 const meta='<div class="position-detail-grid">'+
   [['Bestand',quant(Number(p.quantityExact??p.quantity))+' '+(p.symbol||'Stk.')],
    ['Kurs je Einheit',price],['Positionswert',positionValueLabel(p,amount,money)],['Einstandswert',cost]]
   .map(([name,value])=>'<div class="position-detail-stat"><span>'+esc(name)+'</span><strong>'+esc(value)+'</strong></div>').join('')+'</div>';
 const allocation=weight==null?'<p class="position-detail-note">Anteil am Anbieter nicht sinnvoll bestimmbar (Nullsaldo oder Verbindlichkeit).</p>':
   '<div class="position-share"><div class="position-share-label"><span>Anteil am Anbieter</span><strong>'+esc(new Intl.NumberFormat('de-AT',{maximumFractionDigits:1}).format(weight))+' %</strong></div>'+
   '<div class="position-share-track"><div style="width:'+Math.max(0,Math.min(100,weight)).toFixed(2)+'%"></div></div></div>';
 const economic=p.valuationMode==='excluded'?'<p class="position-detail-note">Nicht doppelt mitgezählt: Diese Position wird bereits durch eine andere Position repräsentiert.</p>':p.valuationMode==='liability'?'<p class="position-detail-note">Verbindlichkeit: Dieser Betrag wird vom Gesamtvermögen abgezogen.</p>':'';
 const isSecurity=securityKind(p);
 const imported=model.priceHistories?.[p.id];
 const nativeAvailable=Boolean(marketHistoryCapability(p,model.settings));
 const needsOwnChart=nativeAvailable||Boolean(imported);
 const hasMarketKey=Boolean((model.settings?.eodhdWorkerEndpoint&&model.settings?.eodhdWorkerAccessToken)||model.settings?.alphaVantageKey||model.settings?.marketstackKey);
 const noMarketChart=isSecurity&&!needsOwnChart?collapsedHistory(
   (hasMarketKey?'Kein nativer Kursverlauf: Bitte Kursanbieter in „Mehr“, bestätigten Handelsplatz, Börsen-MIC, Ticker und Handelswährung dieser Position prüfen.':'Kein nativer Kursverlauf: Optional Alpha Vantage, Marketstack oder einen eigenen EODHD-Worker unter „Mehr“ einrichten und Handelsplatz, Ticker und Währung prüfen.')+
   ' Lokale Kurse kannst du über ⋯ importieren.',
   {esc}):'';
 const timeline=positionBookingTimeline(model,p.id);
 const eventLabels={buy:'Kauf',sell:'Verkauf',deliver_in:'Einlieferung',deliver_out:'Auslieferung',
  split:'Split',swap:'Tausch',merger:'Fusion',isin_change:'ISIN geändert',ticker_change:'Ticker geändert',
  dividend:'Dividende',interest:'Zinsen',reward:'Staking-Reward',airdrop:'Airdrop',
  transfer:'Transfer',adjust:'Bestandszugang',correction:'Korrektur',fee:'Gebühr',tax:'Steuer'};
 const events=timeline.events.map(e=>{
  const date=/^\d{4}-\d{2}-\d{2}$/.test(e.date)?calendarDateLabel(e.date):'Unbekanntes Datum';
  const qty=e.quantityExact!=null?' · '+esc(exactQuantityLabel(e.quantityExact))+' '+esc(p.symbol||'Stk.'):'';
  const source=e.source==='csv'?' · CSV-Import':'';
  const role=e.isTarget?' · Zielposition':'';
  return '<div class="history-row"><div><strong>'+esc(date)+' · '+esc(eventLabels[e.type]||e.type)+'</strong>'+
   '<p class="position-detail-note">'+qty+source+role+(e.note?' · '+esc(e.note):'')+'</p></div></div>';
 }).join('');
 const bookingHistory='<details class="position-booking-history"><summary>Gebuchte Vorgänge ('+timeline.total+')</summary>'+
  '<div class="position-chart-options-body">'+
  (timeline.total?events+(timeline.hasMore?'<p class="position-detail-note">Weitere Vorgänge unter „Buchungen“ anzeigen.</p>':''):
   '<p class="position-detail-note">Für diese Position sind noch keine zugeordneten Buchungen erfasst.</p>')+
  '<p class="position-detail-note">Nur dieser Position zugeordnete Buchungen. Ausführungskurse sind kein belegter Nettogewinn. Cash-Dividenden ohne eindeutige Anlagenzuordnung werden nicht hinzugefügt.</p>'+
  '</div></details>';
 return meta+allocation+economic+'<p class="position-detail-source">Kursquelle: '+quote+date+'</p>'+
   quoteCredit+positionChartTools(p,model,esc)+(needsOwnChart?'<div class="position-history-plot" role="status">Historische Daten werden geprüft …</div>':noMarketChart)+bookingHistory;
}
export async function loadPositionDetail(position,model,mount,{days=30,reuse=false,fetcher=globalThis.fetch,esc,money,dateLabel}){
 const target=mount.querySelector('.position-history-plot');
 if(!target)return;
 const token=String(Number(mount.dataset.loadSequence||0)+1);
 mount.dataset.loadSequence=token;
 const isCurrent=()=>mount.isConnected&&target.isConnected&&mount.dataset.loadSequence===token;
 const render=history=>{
  if(!isCurrent())return;
  let {points,kind,currency='EUR',source='',fxPoints}=history;
  const crypto=position.kind==='crypto';
  const now=Date.now();
  const periods=observedPositionPeriods(points,history.periods,{crypto,now});
  const selected=periods.includes(days)?days:periods.find(period=>typeof period==='number'&&period>=days)??periods.at(-1);
  if(selected!==undefined)points=filterHistoryByDays(points,selected,now);
  const windowStart=points[0].date,windowEnd=points.at(-1).date;
  const shortCoverage=selected===undefined;
  const toolbar=mount.querySelector('.position-period');
  if(toolbar?.querySelector){
   const presets=toolbar.querySelector('.position-period-presets');
   const extended=toolbar.querySelector('.position-period-extended');
   const popup=toolbar.querySelector('.position-period-more');
   if(!reuse){
    presets.innerHTML=renderChartPeriodButtons('market','data-position-range',selected,periods.filter(period=>typeof period==='number'&&period<=365));
    extended.innerHTML=renderChartPeriodButtons('market','data-position-range',selected,periods.filter(period=>period==='max'||period>365));
    popup.hidden=!securityKind(position)&&!extended.children.length;
   }
   syncChartPeriodButtons(toolbar,'data-position-range',selected);
   const summary=popup.querySelector('summary');
   const longLabel=extended.querySelector('[aria-pressed="true"]')?.textContent;
   summary.textContent=longLabel||'⋯';
   summary.setAttribute('aria-label',(longLabel?longLabel+' ausgewählt. ':'')+'Weitere Zeiträume und Kursdaten');
  }
  positionCharts.set(mount,history);
  if(kind==='market'){
   const projection=projectHistoricalPosition(model,position.id,{marketHistory:{points,currency,source,fxPoints,priceType:position.kind==='crypto'?'crypto-daily':'close'}});
   const valued=projection.rows.filter(r=>r.valueEURExact!==null);
   if(valued.length>=2&&!projection.partial){points=valued.map(r=>({date:r.date,totalEURExact:r.valueEURExact,detail:'Bestand '+r.quantityExact+' · Kurs '+r.priceExact+' '+position.currency+' · EUR-Faktor '+r.fxExact+' · '+r.source}));kind='historical-value';currency='EUR';}
  }
  const fmt=kind==='market'?x=>quoteCurrency(x,currency):money;
  const axisFormat=kind==='market'?x=>new Intl.NumberFormat('de-AT',{
   style:'currency',currency,notation:Math.abs(x)>=1000?'compact':'standard',
   maximumFractionDigits:Math.abs(x)<0.0001?8:Math.abs(x)<1?6:1
  }).format(x):undefined;
  const maximumGap=(crypto?2:6)*86400000;
  points=points.map((point,index)=>index>0&&Date.parse(point.date)-Date.parse(points[index-1].date)>maximumGap?
   {...point,breakBefore:true}:point);
  target.innerHTML='<div class="position-history-label">'+esc(kind==='market'?'Marktkurs je Einheit':kind==='historical-value'?'Historischer Positionswert (€)':'Gespeicherter Positionswert')+'</div>'+
   '<div class="position-history-chart chart-area">'+drawInteractiveChart(points,{money:fmt,esc,dateLabel,axisFormat,disjoint:points.some(point=>point.breakBefore)})+'</div>'+
   '<p class="position-detail-note">'+esc(kind==='market'?(source==='CSV (selbst geprüft)'?'CSV-Daten vom Nutzer übernommen, nicht unabhängig verifiziert. Kein persönlicher Renditeverlauf.':source+' · Marktpreis, nicht deine persönliche Rendite.'):kind==='historical-value'?source+' · damaliger Bestand × damaliger Kurs. Keine Rendite.':'Lokale Stichtagswerte inkl. Bestandsänderungen, keine bereinigte Rendite.')+'</p>'+
   (shortCoverage||selected>365||selected==='max'?'<p class="position-detail-note">Tatsächlich verfügbare Kurse: '+esc(dateLabel(windowStart))+' bis '+esc(dateLabel(windowEnd))+'. Fehlende Kurse werden nicht ergänzt.</p>':'');
  attachChartInteractions(target);
  if(source.startsWith('CoinPaprika')){
   const credit=document.createElement('a');credit.href='https://coinpaprika.com/';
   credit.textContent='Powered by CoinPaprika';credit.target='_blank';credit.rel='noopener noreferrer';
   credit.className='position-history-external';
   target.append(credit);
  }
 };
 const fallback=(message)=>{
  if(!isCurrent())return;
  target.innerHTML=collapsedHistory(message+(securityKind(position)?' Lokale Kurse kannst du über ⋯ importieren.':''),{esc,id:position.id,retry:true});
  if(position.kind==='crypto'&&/^[a-z0-9-]{2,100}$/.test(position.coinId||'')){
   const link=document.createElement('a');
   link.href='https://www.coingecko.com/en/coins/'+encodeURIComponent(position.coinId);
   link.target='_blank';link.rel='noopener noreferrer';
   link.className='position-history-external';
   link.textContent='Kursverlauf bei CoinGecko öffnen ↗';
   target.querySelector('.position-history-compact')?.append(link);
  }
 };
 try{
  if(reuse&&positionCharts.has(mount)){render(positionCharts.get(mount));return;}
  positionCharts.delete(mount);
  const periods=availablePositionPeriods(position,model);
  const imported=importedHistoryForPeriod(model,position,'max');
  if(imported?.points.length>=2){render({...imported,periods});return;}
  if(marketHistoryCapability(position,model.settings)){
   const widest=periods.includes(1826)?1826:365;
   const history=await fetchPositionMarketHistory(position,model.settings,widest,fetcher);
   render({...history,periods:periods.filter(period=>period!=='max')});
   return;
  }
  fallback('Keine bestätigte Kursquelle eingerichtet.');
 }catch(error){fallback(safeHistoryError(error,{security:securityKind(position)}));}
}
