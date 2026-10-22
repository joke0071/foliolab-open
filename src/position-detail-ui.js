import {POSITION_PERIODS,marketHistoryCapability,recordedPositionHistory,fetchPositionMarketHistory} from './position-history.js';
import {drawInteractiveChart,attachChartInteractions} from './dashboard-ui.js';
import {importedHistoryForPeriod} from './historical-csv.js';

const quoteCurrency=(value,currency)=>new Intl.NumberFormat('de-AT',{style:'currency',currency,maximumFractionDigits:currency==='JPY'?0:6}).format(value);
export function positionDetailMarkup(p,model,{esc,money,quant,valueEUR,days=30}){
 const account=model.accounts.find(a=>a.id===p.accountId);
 const accValue=model.positions.filter(x=>x.accountId===p.accountId).reduce((sum,x)=>sum+valueEUR(x),0);
 const amount=valueEUR(p),weight=accValue>0&&amount>=0?100*amount/accValue:null;
 const cost=p.costBasisEUR==null?'–':money(p.costBasisEUR);
 const price=quoteCurrency(Number(p.priceExact??p.price)||0,p.currency||'EUR');
 const quote=p.quoteSource?esc(p.quoteSource):'Manuell',date=p.quoteAsOf?' · '+esc(p.quoteAsOf):'';
 const meta='<div class="position-detail-grid">'+
   [['Bestand',quant(Number(p.quantityExact??p.quantity))+' '+(p.symbol||'Stk.')],
    ['Kurs je Einheit',price],['Positionswert',money(amount)],['Einstandswert',cost]]
   .map(([name,value])=>'<div class="position-detail-stat"><span>'+esc(name)+'</span><strong>'+esc(value)+'</strong></div>').join('')+'</div>';
 const allocation=weight==null?'<p class="position-detail-note">Anteil am Konto nicht sinnvoll bestimmbar (Nullsaldo oder Verbindlichkeit).</p>':
   '<div class="position-share"><div class="position-share-label"><span>Anteil am Konto</span><strong>'+esc(new Intl.NumberFormat('de-AT',{maximumFractionDigits:1}).format(weight))+' %</strong></div>'+
   '<div class="position-share-track"><div style="width:'+Math.max(0,Math.min(100,weight)).toFixed(2)+'%"></div></div></div>';
 const economic=p.valuationMode==='excluded'?'<p class="position-detail-note">Nicht doppelt mitgezählt: Diese Position wird bereits durch eine andere Position repräsentiert.</p>':p.valuationMode==='liability'?'<p class="position-detail-note">Verbindlichkeit: Dieser Betrag wird vom Gesamtvermögen abgezogen.</p>':'';
 const imported=model.priceHistories?.[p.id];
 const csvTool=['etf','stock','fund'].includes(p.kind)?'<div class="position-csv-actions"><button class="position-csv-import" type="button" data-action="import-price-history" data-id="'+esc(p.id)+'">'+(imported?'CSV-Kursverlauf ersetzen':'CSV-Kursverlauf importieren')+'</button>'+
  (imported?'<button type="button" class="position-csv-remove" data-action="remove-price-history" data-id="'+esc(p.id)+'" aria-label="Importierten Kursverlauf entfernen">Entfernen</button>':'')+
  '</div><p class="position-csv-help">Ohne API-Schlüssel · lokal gespeichert. Benötigt Datum und Schlusskurs in der Handelswährung dieser Position.</p>':'';
 const controls='<div class="position-period" role="group" aria-label="Zeitraum des Positionsverlaufs">'+
   POSITION_PERIODS.map(([n,label])=>'<button type="button" data-position-range="'+n+'" aria-pressed="'+(days===n)+'" class="'+(days===n?'selected':'')+'">'+label+'</button>').join('')+'</div>';
 return meta+allocation+economic+'<p class="position-detail-source">Kursquelle: '+quote+date+'</p>'+
   csvTool+controls+'<div class="position-history-plot" role="status">Historische Daten werden geprüft …</div>';
}
export async function loadPositionDetail(position,model,mount,{days=30,fetcher=globalThis.fetch,esc,money,quant,valueEUR,dateLabel}){
 const target=mount.querySelector('.position-history-plot');
 if(!target)return;
 const token=String(Number(mount.dataset.loadSequence||0)+1);
 mount.dataset.loadSequence=token;
 const isCurrent=()=>mount.isConnected&&target.isConnected&&mount.dataset.loadSequence===token;
 const local=recordedPositionHistory(model,position.id,days);
 const render=(points,kind,currency='EUR',source='')=>{
  if(!isCurrent())return;
  const fmt=kind==='market'?x=>quoteCurrency(x,currency):money;
  target.innerHTML='<div class="position-history-label">'+esc(kind==='market'?'Marktkurs je Einheit':'Gespeicherter Positionswert')+'</div>'+
   '<div class="position-history-chart chart-area">'+drawInteractiveChart(points,{money:fmt,esc,dateLabel})+'</div>'+
   '<p class="position-detail-note">'+esc(kind==='market'?(source==='CSV (selbst geprüft)'?'CSV-Daten vom Nutzer übernommen, nicht unabhängig verifiziert. Kein persönlicher Renditeverlauf.':source+' · Marktpreis, nicht deine persönliche Rendite.'):'Lokale Stichtagswerte inkl. Bestandsänderungen, keine bereinigte Rendite.')+'</p>';
  attachChartInteractions(target);
 };
 const fallback=(message)=>{
  if(local.length>=2){render(local,'local');return;}
  if(!isCurrent())return;
  target.replaceChildren();
  const p=document.createElement('p');p.className='position-history-unavailable';
  p.textContent=(message?message+' ':'')+
   (local.length===1?'Für diese Position liegt erst ein gespeicherter Stichtag vor.':'Noch keine belastbare historische Einzelpositionsreihe gespeichert.')+
   ' Neue Stichtage erfassen künftig Einzelpositionswerte.';
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
 if(imported?.points.length>=2){render(imported.points,'market',imported.currency,imported.source);return;}
 const capability=marketHistoryCapability(position,model.settings);
 if(!capability){fallback(imported?'Für diesen Zeitraum liegen weniger als zwei CSV-Kurstage vor. Bitte längeren Zeitraum wählen.':position.kind==='cash'?'Für Guthaben gibt es keinen Börsenkurs.':'Keine bestätigte Kursquelle eingerichtet.');return;}
 try{
  const history=await fetchPositionMarketHistory(position,model.settings,days,fetcher);
  render(history.points,history.kind,history.currency,history.source);
 }catch(error){
  fallback('Kursverlauf nicht verfügbar: '+String(error?.message||'Datenquelle nicht erreichbar.').slice(0,130));
 }
}
