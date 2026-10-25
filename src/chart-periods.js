/** Shared chart periods; longer market options are shown only where supported. */
export const CHART_PERIODS = Object.freeze({
 wealth:Object.freeze([
  Object.freeze({value:'month',label:'1 M',days:30}),
  Object.freeze({value:'quarter',label:'3 M',days:90}),
  Object.freeze({value:'halfyear',label:'6 M',days:180}),
  Object.freeze({value:'year',label:'1 J',days:365}),
  Object.freeze({value:'threeYears',label:'3 J',days:1096}),
  Object.freeze({value:'fiveYears',label:'5 J',days:1826}),
  Object.freeze({value:'all',label:'Max',days:null})
 ]),
 market:Object.freeze([
  Object.freeze({value:7,label:'7 T',days:7}),
  Object.freeze({value:30,label:'1 M',days:30}),
  Object.freeze({value:90,label:'3 M',days:90}),
  Object.freeze({value:180,label:'6 M',days:180}),
  Object.freeze({value:365,label:'1 J',days:365}),
  Object.freeze({value:1096,label:'3 J',days:1096}),
  Object.freeze({value:1826,label:'5 J',days:1826}),
  Object.freeze({value:'max',label:'Max',days:null})
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
export function renderChartPeriodButtons(kind,attribute,selected,values=null){
 if(!ATTRIBUTES.has(attribute))throw Error('Ungültiges Zeitraum-Attribut.');
 const allowed=values==null&&kind==='market'?new Set(['7','30','90','180','365']):
  values==null?null:new Set(values.map(String));
 return periods(kind).filter(({value})=>allowed==null||allowed.has(String(value))).map(({value,label})=>{
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
