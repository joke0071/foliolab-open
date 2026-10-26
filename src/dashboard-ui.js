import {cashTermsAccountHint} from './cash-terms-ui.js';
import {historicalWealthView} from './historical-portfolio-value.js';
import {units,exact} from './decimal.js';
/** Presentation-only dashboard helpers. Never imply performance when only wealth history exists. */
const compactAmount = value => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '–';
  const abs = Math.abs(n), format = x => new Intl.NumberFormat('de-AT', {maximumFractionDigits:1}).format(x);
  if (abs >= 1000000) return '€ ' + format(n/1000000) + ' Mio.';
  if (abs >= 1000) return '€ ' + format(n/1000) + ' Tsd.';
  return '€ ' + format(n);
};
export {compactAmount};

export function renderSummaryTiles(model, money, valueEUR, esc, dateLabel, wealth=historicalWealthView(model)) {
  const data = model.positions;
  const partitions = [
    {title:'Wertpapiere',items:data.filter(p=>['etf','stock','fund','other'].includes(p.kind)),unit:'Positionen'},
    {title:'Guthaben',items:data.filter(p=>p.kind==='cash'),unit:'Guthabenpositionen'},
    {title:'Kryptowährungen',items:data.filter(p=>p.kind==='crypto'),unit:'Coin-Positionen'}
  ];
  const tiles = partitions.map(section => {
    const total = section.items.reduce((sum,p)=>sum+valueEUR(p),0);
    const note = section.items.length+' '+section.unit;
    return [section.title,money(total),note];
  });
  const samples=wealth.samples;
  let comparable=samples;
  if(wealth.basis==='reconstructed'){
    const boundary=samples.findLastIndex((s,i)=>i>0&&s.breakBefore);
    if(boundary>=0)comparable=samples.slice(boundary);
  }
  const usable=['observed','reconstructed'].includes(wealth.basis)&&comparable.length>=2;
  const previous=usable?(wealth.basis==='observed'?comparable.at(-2):comparable[0]):null,latest=usable?comparable.at(-1):null;
  const delta=usable?exact(units(latest.totalEURExact??latest.total)-units(previous.totalEURExact??previous.total)):null;
  const foot=delta!==null?dateLabel(previous.date)+' – '+dateLabel(latest.date)+' · inkl. Geldflüsse · keine Rendite':
    wealth.basis==='partial'?'Teilportfolio: vollständige Bestands-, Kurs- oder FX-Nachweise fehlen.':
    samples.length?'Ein weiterer vergleichbar belegter Zeitpunkt fehlt.':wealth.reason;
  tiles.push(['Veränderung',delta===null?'–':(units(delta)>0n?'+':'')+money(Number(delta)),foot]);
  return tiles.map(([label,value,foot]) =>
    '<div class="stat"><div class="stat-label">'+esc(label)+'</div><div class="stat-value">'+esc(value)+'</div><div class="stat-hint">'+esc(foot)+'</div></div>'
  ).join('');
}

export function renderProviderAccounts(model, money, valueEUR, esc, expanded=new Set(),expandedPositions=new Set()) {
  if(!model.providers.length) return '<div class="empty">Lege unter „Mehr“ deinen ersten Anbieter an.</div>';
  const positionsByAccount=new Map();
  for(const position of model.positions){
    if(!positionsByAccount.has(position.accountId))positionsByAccount.set(position.accountId,[]);
    positionsByAccount.get(position.accountId).push(position);
  }
  return model.providers.map(provider=>{
    const accounts=model.accounts.filter(a=>a.providerId===provider.id);
    const items=accounts.flatMap(a=>positionsByAccount.get(a.id)||[]);
    const providerTotal=items.reduce((sum,p)=>sum+valueEUR(p),0);
    const rows=accounts.map(account=>{
      const positions=positionsByAccount.get(account.id)||[];
      const sum=positions.reduce((n,p)=>n+valueEUR(p),0);
      const holdings=positions.map(p=>{
        const id=esc(p.id),opened=expandedPositions.has(p.id);
        return '<details class="provider-position-accordion" data-position-id="'+id+'"'+(opened?' open':'')+'>'+
          '<summary class="provider-holding" aria-label="'+esc(p.name)+': Details '+(opened?'einklappen':'aufklappen')+'"><span class="provider-holding-name">'+esc(p.name)+'</span>'+
          '<span class="provider-holding-right"><strong>'+esc(money(valueEUR(p)))+'</strong><span class="provider-position-chevron" aria-hidden="true"></span></span></summary>'+
          '<div class="provider-position-detail" data-position-detail="'+id+'"></div></details>';
      }).join('');
      return '<div class="provider-account"><div class="provider-account-head"><div><strong>'+esc(account.name)+'</strong><small>'+positions.length+' Positionen</small>'+cashTermsAccountHint(account,esc)+'</div><strong>'+esc(money(sum))+'</strong><button class="link-button" type="button" data-action="view-account" data-id="'+esc(account.id)+'" aria-label="Positionen von '+esc(account.name)+' anzeigen">Positionen →</button></div>'+
        (holdings?'<div class="provider-holdings">'+holdings+'</div>':'')+'</div>';
    }).join('');
    const open=expanded.has(provider.id)?' open':'';
    return '<details class="provider-accordion" data-provider-id="'+esc(provider.id)+'"'+open+'>'+
      '<summary class="provider-row"><div class="provider-l"><span class="provider-mark">'+esc(provider.name.slice(0,1).toUpperCase())+'</span>'+
      '<div><div class="provider-name">'+esc(provider.name)+'</div><div class="provider-note">'+accounts.length+' Konten · '+items.length+' Positionen</div></div></div>'+
      '<span class="provider-total">'+esc(money(providerTotal))+'</span><span class="provider-chevron" aria-hidden="true"></span></summary>'+
      '<div class="provider-detail">'+(rows||'<p class="small-help">Noch keine Konten angelegt.</p>')+'</div></details>';
  }).join('');
}

export function drawInteractiveChart(samples,{money,esc,dateLabel,axisFormat=compactAmount,comparison=null,disjoint=false}){
 if(!samples||samples.length<2) return '<p class="chart-zero">'+(samples?.length?'Ein weiterer belegter Zeitpunkt für den Verlauf fehlt.':'Noch keine Stichtage. Du kannst einen im Reiter „Verlauf“ speichern.')+'</p>';
 const step=Math.max(1,Math.ceil(samples.length/140));
 const sampled=samples.filter((s,i)=>i===0||i===samples.length-1||i%step===0||disjoint&&(s.breakBefore||samples[i+1]?.breakBefore));
 const values=sampled.map(s=>Number(s.totalEURExact??s.total));
 if(values.some(x=>!Number.isFinite(x)))return '<p class="chart-zero">Diagrammwerte nicht verfügbar.</p>';
 const compared=comparison?new Map(comparison.map(x=>[x.date,Number(x.total)])):null;
 const second=compared&&sampled.every(s=>Number.isFinite(compared.get(s.date)))?
  sampled.map(s=>compared.get(s.date)):null;
 const bounds=second?[...values,...second]:values;
 const lo=Math.min(...bounds),hi=Math.max(...bounds);
 const magnitude=Math.max(Math.abs(hi),Math.abs(lo));
 const span=Math.max(hi-lo,magnitude*.055,magnitude?Number.MIN_VALUE:1);
 const yMin=lo-span*.30,yMax=hi+span*.20,range=yMax-yMin;
 const width=600,height=180,pad=5;
 const points=sampled.map((s,i)=>({
   x:pad+i*(width-pad*2)/(sampled.length-1),
   y:pad+(yMax-values[i])/range*(height-pad*2),
   value:money(values[i]),date:dateLabel(s.date),...(s.detail?{detail:String(s.detail)}:{})
 }));
 const path=points.map((p,i)=>(i&&!(disjoint&&sampled[i].breakBefore)?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');
 const comparePath=second?points.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+' '+(pad+(yMax-second[i])/range*(height-pad*2)).toFixed(2)).join(' '):'';
 if(second)points.forEach((p,i)=>{p.compareValue='Kapitalreferenz: '+money(second[i]);});
 const fill=path+' L'+points.at(-1).x.toFixed(2)+' '+height+' L'+pad+' '+height+' Z';
 const series=esc(JSON.stringify(points));
 const labels=[yMax,(yMax+yMin)/2,yMin].map(v=>'<span>'+esc(axisFormat(v))+'</span>').join('');
 const axis='<div class="chart-x-labels"><span>'+esc(dateLabel(sampled[0].date))+'</span><span>'+esc(dateLabel(sampled.at(-1).date))+'</span></div>';
 return '<div class="chart-interactive"><div class="chart-y-labels" aria-hidden="true">'+labels+'</div>'+
 '<div class="chart-plot" role="group" tabindex="0" aria-label="Interaktiver Vermögensverlauf. Pfeiltasten links und rechts zeigen Stichtage." data-chart-points="'+series+'">'+
 '<svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
 [5,90,175].map(y=>'<line x1="0" x2="'+width+'" y1="'+y+'" y2="'+y+'" stroke="#e5eee6" stroke-dasharray="4 6"/>').join('')+
 (disjoint?'':'<path d="'+fill+'" fill="#e8f2ea"/>')+'<path d="'+path+'" fill="none" stroke="#3b8659" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>'+
 (disjoint?points.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="2" fill="#3b8659" vector-effect="non-scaling-stroke"/>').join(''):'')+
 (comparePath?'<path d="'+comparePath+'" fill="none" stroke="#708c9a" stroke-dasharray="7 5" stroke-width="2.5" vector-effect="non-scaling-stroke"/>':'')+
 '<circle cx="'+points.at(-1).x+'" cy="'+points.at(-1).y+'" r="4.5" fill="#3b8659" stroke="white" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>'+
 '<span class="chart-cursor hidden" aria-hidden="true"></span><div class="chart-tooltip hidden" role="status"></div></div>'+axis+
 (comparePath?'<p class="small-help">Gestrichelt: Startvermögen zuzüglich erfasster externer Nettozuflüsse. Keine Rendite und kein vollständiger Einstandswert.</p>':'')+'</div>';
}

export function attachChartInteractions(container) {
 const plot=container.querySelector('.chart-plot');
 if(!plot)return;
 const points=JSON.parse(plot.dataset.chartPoints||'[]');
 if(!points.length)return;
 const cursor=plot.querySelector('.chart-cursor'),tip=plot.querySelector('.chart-tooltip');
 let active=points.length-1, touched=false;
 function select(index) {
   active=Math.min(points.length-1,Math.max(0,index));
   const point=points[active];
   cursor.style.left=(point.x/600*100)+'%';
   cursor.style.top=(point.y/180*100)+'%';
   tip.style.left=Math.min(80,Math.max(20,point.x/600*100))+'%';
   tip.replaceChildren();
   const date=document.createElement('span'),value=document.createElement('strong');
   date.textContent=point.date;value.textContent=point.value;
   tip.append(date,value);
   if(point.detail){const extra=document.createElement('span');extra.textContent=point.detail;tip.append(extra);}
   if(point.compareValue){const extra=document.createElement('span');extra.textContent=point.compareValue;tip.append(extra);}
   cursor.classList.remove('hidden');tip.classList.remove('hidden');
 }
 function nearest(event) {
   const bounds=plot.getBoundingClientRect();
   const percent=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width));
   select(Math.round(percent*(points.length-1)));
 }
 plot.addEventListener('pointermove',event=>{if(event.pointerType!=='touch')nearest(event);});
 plot.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')touched=true;nearest(event);});
 plot.addEventListener('click',nearest);
 plot.addEventListener('pointerleave',()=>{if(!touched&&document.activeElement!==plot){cursor.classList.add('hidden');tip.classList.add('hidden');}});
 plot.addEventListener('focus',()=>select(active));
 plot.addEventListener('keydown',event=>{
   if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
     event.preventDefault();
     select(event.key==='Home'?0:event.key==='End'?points.length-1:active+(event.key==='ArrowRight'?1:-1));
   }
 });
}
