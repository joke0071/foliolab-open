/** Shared chart periods; longer market options are shown only where supported. */
export const CHART_PERIODS = Object.freeze({
 wealth:Object.freeze([
  Object.freeze({value:'week',label:'7 T',days:7}),
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
/* Moves the 3 J / 5 J buttons of rendered wealth periods into a "Mehr" disclosure;
   it stays open on wide screens (see app.js). Selection and availability stay on the buttons. */
export function groupExtraWealthPeriods(html){
 const extra=/<button type="button" data-(?:mini-)?range="(?:threeYears|fiveYears)"[^>]*>[^<]*<\/button>/g;
 const moved=html.match(extra);
 if(!moved)return html;
 const rest=html.replace(extra,'');
 const year=/<button[^>]*data-(?:mini-)?range="year"[^>]*>[^<]*<\/button>/.exec(rest);
 if(!year)return html;
 const close=year.index+year[0].length;
 const selected=moved.find(button=>/aria-pressed="true"/.test(button));
 const label=selected?.match(/>([^<]*)<\/button>$/)?.[1]||'';
 const summaryLabel=label?label+' ausgewählt; weitere Zeiträume: 3 J und 5 J':'Mehr: weitere Zeiträume: 3 J und 5 J';
 return rest.slice(0,close)+'<details class="period-more"><summary aria-label="'+summaryLabel+'" title="Weitere Zeiträume"><span class="period-more-label">'+(label||'Mehr')+'</span></summary><span class="period-more-list">'+moved.join('')+'</span></details>'+rest.slice(close);
}
const WIDE='(min-width:721px)',NARROW='(max-width:374px)';
const rangeOf=el=>el.getAttribute('data-range')||el.getAttribute('data-mini-range');
/* Places the buttons for the current width without re-rendering, so selected and disabled states survive:
   wide = all inline, medium = 3 J/5 J in "Mehr", narrow = 1 J moves into "Mehr" as well. */
export function layoutPeriodMore(doc=document,match=q=>matchMedia(q).matches){
 doc.querySelectorAll('.period-more').forEach(more=>{
  const group=more.parentElement,list=more.querySelector('.period-more-list'),summary=more.querySelector('summary');
  const half=[...group.querySelectorAll('button')].find(b=>rangeOf(b)==='year');
  if(half){
   if(match(NARROW)&&!match(WIDE)){if(half.parentElement!==list)list.prepend(half);}
   else if(half.parentElement===list)group.insertBefore(half,more);
  }
  const wide=match(WIDE);
  if(wide)more.open=true;else if(more.dataset.wasWide==="1")more.open=false;
  more.dataset.wasWide=wide?"1":"0";
  const active=[...list.querySelectorAll('button')].find(b=>b.getAttribute('aria-pressed')==='true');
  summary.textContent=active?active.textContent:'Mehr';
  const choices=[...list.querySelectorAll('button')].map(b=>b.textContent.trim()).join(', ');
  summary.setAttribute('aria-label',active?
   active.textContent.trim()+' ausgewählt; weitere Zeiträume: '+choices:
   'Mehr: weitere Zeiträume'+(choices?': '+choices:''));
  more.classList.toggle('has-active',Boolean(active));
 });
}
let periodMoreBound=false;
export function bindPeriodMore(doc=document){
 if(periodMoreBound)return;
 periodMoreBound=true;
 const refresh=()=>layoutPeriodMore(doc);
 for(const q of [WIDE,NARROW])matchMedia(q).addEventListener('change',refresh);
 new MutationObserver(refresh).observe(doc.body,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
 const close=(more,focus)=>{if(more.open&&!matchMedia(WIDE).matches){more.open=false;if(focus)more.querySelector('summary').focus();}};
 doc.addEventListener('click',e=>{
  const inside=e.target.closest('.period-more');
  doc.querySelectorAll('.period-more[open]').forEach(m=>{if(m!==inside||e.target.closest('.period-more-list button'))close(m,false);});
 });
 doc.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  const more=e.target.closest?.('.period-more');
  if(more)close(more,true);
 });
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
 const selectedButton=root.querySelector('.period-more-list button[aria-pressed="true"]');
 const summary=root.querySelector('.period-more>summary');
 const label=summary?.querySelector('.period-more-label');
 if(summary&&label){
  const activeLabel=selectedButton?.textContent.trim()||'';
  label.textContent=activeLabel||'Mehr';
  summary.setAttribute('aria-label',activeLabel?
   activeLabel+' ausgewählt; weitere Zeiträume: 3 J und 5 J':'Mehr: weitere Zeiträume: 3 J und 5 J');
 }
}
