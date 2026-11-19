import {money} from './model.js';
import {compactMoney} from './format.js';
import {projectPortfolio,projectionStart} from './portfolio-projection.js';

const labels=['Unteres Szenario','Mittleres Szenario','Oberes Szenario'];

function projectionChart(scenarios){
 const max=Math.max(1,...scenarios.flatMap(s=>s.points.map(p=>p.nominal)));
 const years=scenarios[0].points.at(-1).year;
 const lines=scenarios.map((s,i)=>'<polyline class="projection-line projection-line-'+i+'" points="'+
  s.points.map(p=>(10+p.year/years*340).toFixed(2)+','+(104-p.nominal/max*94).toFixed(2)).join(' ')+'"/>').join('');
 return '<div class="projection-chart-scale"><span>'+compactMoney(max)+'</span><span>0 €</span></div>'+
  '<svg viewBox="0 0 360 114" aria-hidden="true" focusable="false">'+lines+'</svg>'+
  '<div class="projection-chart-time"><span>Heute</span><span>In '+years+(years===1?' Jahr':' Jahren')+'</span></div>';
}

export function bindPortfolioProjection(section,getModel){
 const form=section.querySelector('form'),output=section.querySelector('.projection-results');
 const message=section.querySelector('.projection-message'),source=section.querySelector('.projection-source');
 const copy=section.querySelector('.projection-use-current'),start=form.elements.namedItem('start');
 const status=section.querySelector('.projection-announcement');
 const refresh=()=>{
  if(!section.open)return;
  const current=projectionStart(getModel().positions);
  copy.disabled=current.value===null;
  source.textContent=current.value===null?current.reason:'Aktueller belegter Portfoliowert: '+money(current.value);
 };
 section.addEventListener('toggle',refresh);
 copy.addEventListener('click',()=>{
  const {value}=projectionStart(getModel().positions);
  if(value===null){refresh();return;}
  start.value=value.toFixed(2).replace('.',',');
  output.replaceChildren();
  message.textContent='';
  start.focus();
 });
 form.addEventListener('input',()=>{
  output.replaceChildren();
  message.textContent='';
  status.textContent='';
 });
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const data=new FormData(form);
  try{
   const scenarios=projectPortfolio({start:data.get('start'),monthly:data.get('monthly'),years:data.get('years'),
    rates:[data.get('low'),data.get('middle'),data.get('high')],inflation:data.get('inflation')});
   const years=scenarios[0].points.at(-1).year;
   const cards=scenarios.map((s,i)=>{
    const end=s.points.at(-1);
    return '<div class="projection-result"><h4><span class="projection-key projection-key-'+i+'" aria-hidden="true"></span>'+labels[i]+'</h4>'+
      '<p class="small-help">'+s.rate.toLocaleString('de-AT')+' % p. a.</p>'+
      '<strong>'+money(end.nominal)+'</strong><p class="small-help">Kaufkraft heute: '+money(end.real)+'</p>'+
      (s.unfunded>0?'<p class="small-help">Ungedeckte Entnahmen: '+money(s.unfunded)+'</p>':'')+'</div>';
   }).join('');
   message.textContent='';
   status.textContent='Drei Szenarien berechnet.';
   output.innerHTML='<h3>Simulierter Vermögensverlauf</h3><div class="projection-chart">'+projectionChart(scenarios)+'</div>'+
    '<h3>Endwerte nach '+years+(years===1?' Jahr':' Jahren')+'</h3><div class="projection-results-grid">'+cards+'</div>';
  }catch(error){
   output.replaceChildren();
   status.textContent='';
   message.textContent=error.message;
  }
 });
 return refresh;
}
