import {POSITION_PERIODS,marketHistoryCapability,fetchPositionMarketHistory} from './position-history.js';
import {drawInteractiveChart,attachChartInteractions} from './dashboard-ui.js';
import {importedHistoryForPeriod} from './historical-csv.js';
import {tradingViewIdentifier} from './security-sources.js';

const quoteCurrency=(value,currency)=>new Intl.NumberFormat('de-AT',{style:'currency',currency,maximumFractionDigits:currency==='JPY'?0:6}).format(value);
export function positionDetailMarkup(p,model,{esc,money,quant,valueEUR,days=30}){
 const account=model.accounts.find(a=>a.id===p.accountId);
 const accValue=model.positions.filter(x=>x.accountId===p.accountId).reduce((sum,x)=>sum+valueEUR(x),0);
 const amount=valueEUR(p),weight=accValue>0&&amount>=0?100*amount/accValue:null;
 const cost=p.costBasisEUR==null?'–':money(p.costBasisEUR);
 const price=quoteCurrency(Number(p.priceExact??p.price)||0,p.currency||'EUR');
 const quote=p.quoteSource?esc(p.quoteSource):'Manuell',date=p.quoteAsOf?' · '+esc(p.quoteAsOf):'';
 const quoteCredit=p.quoteSource==='CoinPaprika'?'<a class="position-history-external" href="https://coinpaprika.com/" target="_blank" rel="noopener noreferrer">Powered by CoinPaprika</a>':'';
 const meta='<div class="position-detail-grid">'+
   [['Bestand',quant(Number(p.quantityExact??p.quantity))+' '+(p.symbol||'Stk.')],
    ['Kurs je Einheit',price],['Positionswert',money(amount)],['Einstandswert',cost]]
   .map(([name,value])=>'<div class="position-detail-stat"><span>'+esc(name)+'</span><strong>'+esc(value)+'</strong></div>').join('')+'</div>';
 const allocation=weight==null?'<p class="position-detail-note">Anteil am Konto nicht sinnvoll bestimmbar (Nullsaldo oder Verbindlichkeit).</p>':
   '<div class="position-share"><div class="position-share-label"><span>Anteil am Konto</span><strong>'+esc(new Intl.NumberFormat('de-AT',{maximumFractionDigits:1}).format(weight))+' %</strong></div>'+
   '<div class="position-share-track"><div style="width:'+Math.max(0,Math.min(100,weight)).toFixed(2)+'%"></div></div></div>';
 const economic=p.valuationMode==='excluded'?'<p class="position-detail-note">Nicht doppelt mitgezählt: Diese Position wird bereits durch eine andere Position repräsentiert.</p>':p.valuationMode==='liability'?'<p class="position-detail-note">Verbindlichkeit: Dieser Betrag wird vom Gesamtvermögen abgezogen.</p>':'';
 const isSecurity=['etf','stock','fund'].includes(p.kind);
 const imported=model.priceHistories?.[p.id];
 const csvTool=isSecurity?'<div class="position-csv-actions"><button class="position-csv-import" type="button" data-action="import-price-history" data-id="'+esc(p.id)+'">'+(imported?'CSV-Kursverlauf ersetzen':'CSV-Kursverlauf importieren')+'</button>'+
  (imported?'<button type="button" class="position-csv-remove" data-action="remove-price-history" data-id="'+esc(p.id)+'" aria-label="Importierten Kursverlauf entfernen">Entfernen</button>':'')+
  '</div><p class="position-csv-help">Ohne API-Schlüssel · lokal gespeichert. Benötigt Datum und Schlusskurs in der Handelswährung dieser Position.</p>':'';
 const tvSymbol=isSecurity?tradingViewIdentifier(p):null;
 const publicChart=tvSymbol?'<div class="public-chart"><p class="position-csv-help">Öffentliches Börsendiagramm von TradingView · erscheint erst nach Klick. Dabei wird eine Verbindung zu TradingView aufgebaut; die dort angezeigten Kurse werden nicht zur Portfoliobewertung übernommen.</p><button type="button" class="position-csv-import" data-action="load-tradingview" data-id="'+esc(p.id)+'">Öffentliches Diagramm laden</button><div data-tv-slot="'+esc(p.id)+'" class="tradingview-slot"></div></div>':
  isSecurity?'<p class="position-csv-help">TradingView benötigt einen bestätigten Handelsplatz (z. B. Xetra) oder ein TradingView-Börsenkürzel.</p>':'';
 const nativeAvailable=Boolean(marketHistoryCapability(p,model.settings));
 const needsOwnChart=nativeAvailable||Boolean(imported);
 const controls=needsOwnChart?'<div class="position-period" role="group" aria-label="Zeitraum des Kursverlaufs">'+
   POSITION_PERIODS.map(([n,label])=>'<button type="button" data-position-range="'+n+'" aria-pressed="'+(days===n)+'" class="'+(days===n?'selected':'')+'">'+label+'</button>').join('')+'</div>':'';
 const hasMarketKey=Boolean(model.settings?.eodhdKey||model.settings?.fmpKey||model.settings?.twelveKey);
 const noMarketChart=isSecurity&&!needsOwnChart?'<p class="position-history-unavailable">'+
   (hasMarketKey?'Kein nativer Kursverlauf: Bitte Kursanbieter in „Mehr“, bestätigten Handelsplatz, Börsen-MIC, Ticker und Handelswährung dieser Position prüfen.':'Kein nativer Kursverlauf: Optional einen eigenen EODHD-, FMP- oder Twelve-Data-Schlüssel unter „Mehr“ hinterlegen.')+
   '</p>':'';
 const extraTools=isSecurity?'<details class="position-chart-options"><summary>Weitere Kursoptionen</summary><div class="position-chart-options-body">'+csvTool+publicChart+'</div></details>':'';
 return meta+allocation+economic+'<p class="position-detail-source">Kursquelle: '+quote+date+'</p>'+
   quoteCredit+controls+(needsOwnChart?'<div class="position-history-plot" role="status">Historische Daten werden geprüft …</div>':noMarketChart)+extraTools;
}
export async function loadPositionDetail(position,model,mount,{days=30,fetcher=globalThis.fetch,esc,money,quant,valueEUR,dateLabel}){
 const target=mount.querySelector('.position-history-plot');
 if(!target)return;
 const token=String(Number(mount.dataset.loadSequence||0)+1);
 mount.dataset.loadSequence=token;
 const isCurrent=()=>mount.isConnected&&target.isConnected&&mount.dataset.loadSequence===token;
 const render=(points,kind,currency='EUR',source='')=>{
  if(!isCurrent())return;
  const fmt=kind==='market'?x=>quoteCurrency(x,currency):money;
  const axisFormat=kind==='market'?x=>new Intl.NumberFormat('de-AT',{
   style:'currency',currency,notation:Math.abs(x)>=1000?'compact':'standard',
   maximumFractionDigits:Math.abs(x)<0.0001?8:Math.abs(x)<1?6:1
  }).format(x):undefined;
  target.innerHTML='<div class="position-history-label">'+esc(kind==='market'?'Marktkurs je Einheit':'Gespeicherter Positionswert')+'</div>'+
   '<div class="position-history-chart chart-area">'+drawInteractiveChart(points,{money:fmt,esc,dateLabel,axisFormat})+'</div>'+
   '<p class="position-detail-note">'+esc(kind==='market'?(source==='CSV (selbst geprüft)'?'CSV-Daten vom Nutzer übernommen, nicht unabhängig verifiziert. Kein persönlicher Renditeverlauf.':source+' · Marktpreis, nicht deine persönliche Rendite.'):'Lokale Stichtagswerte inkl. Bestandsänderungen, keine bereinigte Rendite.')+'</p>';
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
  target.replaceChildren();
  const p=document.createElement('p');p.className='position-history-unavailable';
  p.textContent=message||'Kein verifizierter Marktpreisverlauf für diesen Zeitraum verfügbar.';
  target.append(p);
  if(position.kind==='crypto'&&/^[a-z0-9-]{2,100}$/.test(position.coinId||'')){
   const link=document.createElement('a');
   link.href='https://www.coingecko.com/en/coins/'+encodeURIComponent(position.coinId);
   link.target='_blank';link.rel='noopener noreferrer';
   link.className='position-history-external';
   link.textContent='Kursverlauf bei CoinGecko öffnen ↗';
   target.append(link);
  }
 };
 const imported=importedHistoryForPeriod(model,position,days);
 const capability=marketHistoryCapability(position,model.settings);
 if(capability){
  try{
   // Prefer a real, provider-backed market chart over locally imported CSV.
   const history=await fetchPositionMarketHistory(position,model.settings,days,fetcher);
   render(history.points,history.kind,history.currency,history.source);
   return;
  }catch(error){
   if(imported?.points.length>=2){render(imported.points,'market',imported.currency,imported.source);return;}
   fallback('Kursverlauf nicht verfügbar: '+String(error?.message||'Datenquelle nicht erreichbar.').slice(0,130));
   return;
  }
 }
 if(imported?.points.length>=2){render(imported.points,'market',imported.currency,imported.source);return;}
 fallback(imported?'Für diesen Zeitraum liegen weniger als zwei CSV-Kurstage vor. Bitte einen längeren Zeitraum wählen.':'Keine bestätigte Kursquelle eingerichtet.');
}
