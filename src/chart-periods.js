/** Unified chart time-range presets. Wealth can show every saved snapshot;
 * provider-backed market charts intentionally stop at one year. */
export const CHART_PERIODS = Object.freeze({
 wealth:Object.freeze([
  Object.freeze({value:'month',label:'1 M',days:30}),
  Object.freeze({value:'quarter',label:'3 M',days:90}),
  Object.freeze({value:'year',label:'1 J',days:365}),
  Object.freeze({value:'all',label:'Alles',days:null})
 ]),
 market:Object.freeze([
  Object.freeze({value:7,label:'7 T',days:7}),
  Object.freeze({value:30,label:'1 M',days:30}),
  Object.freeze({value:90,label:'3 M',days:90}),
  Object.freeze({value:365,label:'1 J',days:365})
 ])
});
const ATTRIBUTES=new Set(['data-mini-range','data-range','data-position-range']);
function periods(kind){
 const choices=CHART_PERIODS[kind];
 if(!choices)throw Error('Unbekannter Diagrammtyp.');
 return choices;
}
export function chartPeriodDays(kind,value){
 const choice=periods(kind).find(x=>String(x.value)===String(value));
 if(!choice)throw Error('Ungültiger Diagrammzeitraum.');
 return choice.days;
}
export function renderChartPeriodButtons(kind,attribute,selected){
 if(!ATTRIBUTES.has(attribute))throw Error('Ungültiges Zeitraum-Attribut.');
 return periods(kind).map(({value,label})=>{
  const active=String(selected)===String(value);
  return '<button type="button" '+attribute+'="'+value+'" aria-pressed="'+active+'"'+
   (active?' class="selected"':'')+'>'+label+'</button>';
 }).join('');
}
export function filterChartPeriod(points,kind,selected,now=Date.now()){
 const days=chartPeriodDays(kind,selected);
 if(days===null)return points;
 const cutoff=new Date(now-(days-1)*864e5).toISOString().slice(0,10);
 return points.filter(point=>point.date>=cutoff);
}
export function syncChartPeriodButtons(root,attribute,selected,canSelect){
 if(!root||!ATTRIBUTES.has(attribute))return;
 root.querySelectorAll('['+attribute+']').forEach(button=>{
  const active=String(button.getAttribute(attribute))===String(selected);
  button.classList.toggle('selected',active);
  button.setAttribute('aria-pressed',String(active));
  if(typeof canSelect==='function')button.disabled=!active&&!canSelect(button.getAttribute(attribute));
 });
}
