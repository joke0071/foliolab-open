/** Interaktives, rein lokales Allokationsdiagramm ohne Chart-Bibliothek. */
import {compactMoney} from './format.js';
const shareFormat=new Intl.NumberFormat('de-AT',{maximumFractionDigits:1});
export function formatAllocationShare(value){
 if(value>0&&value<.1)return '< 0,1 %';
 return shareFormat.format(value)+' %';
}
/** Pie shares represent positive asset values, never net worth after liabilities. */
/** Accessible name always starts with the visible label and share (WCAG 2.5.3). */
export function allocationCenterName(label,share,value){return label+', '+share+': '+value+' · Gesamtwert des Portfolios anzeigen';}
export function allocationBreakdown(model,valueEUR,types){
 const byKind=new Map(Object.keys(types).map(key=>[key,0]));
 let gross=0,liabilities=0;
 for(const position of model.positions||[]){
  const amount=Number(valueEUR(position));
  if(!Number.isFinite(amount))continue;
  if(amount<0){liabilities+=-amount;continue;}
  if(amount===0)continue;
  const kind=byKind.has(position.kind)?position.kind:'other';
  byKind.set(kind,byKind.get(kind)+amount);
  gross+=amount;
 }
 const slices=[...byKind].filter(([,value])=>value>0).map(([key,value])=>({
  key,name:types[key],value,percent:gross>0?100*value/gross:0
 }));
 return {slices,gross,liabilities};
}
export function renderAllocationDonut(data,{money,esc,colors,netTotal,selectedKey=null}){
 const {slices,liabilities,gross}=data;
 const chosen=slices.find(x=>x.key===selectedKey);
 let offset=0;
 const segments=slices.map((item,index)=>{
  const start=offset;offset+=item.percent;
  const title=esc(item.name+': '+money(item.value)+' ('+formatAllocationShare(item.percent)+')');
  return '<circle class="allocation-segment" data-allocation-index="'+index+'" data-allocation-key="'+esc(item.key)+'" tabindex="0" role="button" aria-label="'+title+'" aria-pressed="'+(chosen?.key===item.key)+'" cx="100" cy="100" r="84" pathLength="100" stroke-width="30" fill="none"'+
  ' transform="rotate(-90 100 100)" stroke="'+esc(colors[item.key]||'#a2a3b2')+'" stroke-dasharray="'+item.percent.toFixed(8)+' '+(100-item.percent).toFixed(8)+'" stroke-dashoffset="'+(-start).toFixed(8)+'"></circle>';
 }).join('');
 const rows=slices.map((item,index)=>'<button class="alloc-legend-row" type="button" data-allocation-index="'+index+'" data-allocation-key="'+esc(item.key)+'" aria-pressed="'+(chosen?.key===item.key)+'">'+
  '<span class="legend-left"><span class="legend-dot" style="background:'+esc(colors[item.key]||'#a2a3b2')+'"></span>'+
  '<span class="alloc-legend-copy"><strong>'+esc(item.name)+'</strong><small>'+esc(money(item.value))+'</small></span></span>'+
  '<b>'+esc(formatAllocationShare(item.percent))+'</b></button>').join('');
 const explanatory=liabilities>0?'<p class="allocation-note">Anteile der positiven Anlagen. Verbindlichkeiten: '+esc(money(-liabilities))+' (vom Netto abgezogen).</p>':'';
 const rest= !slices.length?'<div class="allocation-empty">Keine positiven Anlagen vorhanden.</div>':rows+explanatory;
 const value=chosen?money(chosen.value):money(netTotal);
 const label=chosen?chosen.name:'Portfolio';
 const share=chosen?formatAllocationShare(chosen.percent):liabilities>0?'Nettovermögen':'Gesamtwert';
 return {donut:'<svg class="allocation-svg" viewBox="0 0 200 200" role="group" aria-label="Anlageklassen. Segmente auswählen, um Werte anzuzeigen.">'+
  '<circle class="allocation-track" cx="100" cy="100" r="84" stroke="#e8efe9" stroke-width="30" fill="none"/>'+segments+'</svg>'+
  '<button class="donut-inner allocation-center" type="button" aria-label="'+esc(allocationCenterName(label,share,value))+'" title="'+esc(money(netTotal))+'">'+
  '<span id="donutLabel">'+esc(label)+'</span><strong id="donutTotal" title="'+esc(value)+'">'+esc(compactMoney(chosen?chosen.value:netTotal))+'</strong>'+
  '<small id="donutShare">'+esc(share)+'</small></button>',
  legend:rest,activeIndex:chosen?slices.indexOf(chosen):-1};
}
export function attachAllocationInteractions(root,{slices,money,netTotal,initialIndex=-1}){
 const donut=root.querySelector('#donut'),legend=root.querySelector('#allocationLegend');
 if(!donut||!legend)return;
 const center=donut.querySelector('.allocation-center');
 const label=donut.querySelector('#donutLabel'),value=donut.querySelector('#donutTotal'),share=donut.querySelector('#donutShare');
 const segments=[...donut.querySelectorAll('[data-allocation-index]')];
 const buttons=[...legend.querySelectorAll('[data-allocation-index]')];
 const controls=[...segments,...buttons];
 let pinned=initialIndex>=0?initialIndex:-1;
 function display(index){
  const item=slices[index];
  label.textContent=item?.name||'Portfolio';
  value.textContent=compactMoney(item?.value??netTotal);
  value.title=money(item?.value??netTotal);
  share.textContent=item?formatAllocationShare(item.percent):(root.dataset.hasLiabilities==='true'?'Nettovermögen':'Gesamtwert');
  controls.forEach(el=>{
   const active=Number(el.dataset.allocationIndex)===index;
   el.classList.toggle('active',active);
   el.setAttribute('aria-pressed',String(Number(el.dataset.allocationIndex)===pinned));
  });
  center.setAttribute('aria-label',allocationCenterName(label.textContent,share.textContent,money(item?.value??netTotal)));
 }
 function pin(index){
  pinned=pinned===index?-1:index;
  display(pinned);
 }
 for(const control of controls){
  const index=Number(control.dataset.allocationIndex);
  control.addEventListener('pointerenter',()=>display(index));
  control.addEventListener('pointerleave',()=>display(pinned));
  control.addEventListener('focus',()=>display(index));
  control.addEventListener('blur',()=>display(pinned));
  control.addEventListener('click',()=>pin(index));
  control.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();pinned=-1;display(-1);center.focus();return;}
   if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
    e.preventDefault();
    const set=segments.includes(control)?segments:buttons;
    set[(index+(e.key==='ArrowRight'?1:-1)+set.length)%set.length]?.focus();
   }
   if(segments.includes(control)&&(e.key==='Enter'||e.key===' ')){e.preventDefault();pin(index);}
  });
 }
 center.addEventListener('click',()=>{pinned=-1;display(-1);});
 display(pinned);
}
