import {INTEREST_METHODS,normalizeInterestTerms,interestDateAfter} from './interest-scenario.js';
import {localToday} from './cash-terms.js';
const dateLabel=value=>value.split('-').reverse().join('.');
function rateRow(rate,index,esc){
 return '<fieldset class="interest-rate-row"><legend>Zinssatz '+(index+1)+'</legend><div class="field-row">'+
  '<label class="field"><span>Gültig ab</span><input type="date" name="interestFrom" value="'+esc(rate.fromDate||'')+'"></label>'+
  '<label class="field"><span>Jahreszinssatz (%)</span><input type="text" inputmode="decimal" name="interestRate" maxlength="55" value="'+esc(rate.annualRateExact||'')+'" placeholder="z. B. 2,5"></label></div>'+
  '<label class="field"><span>Kondition bekannt bis einschließlich · optional</span><input type="date" name="interestThrough" value="'+esc(rate.knownThrough||'')+'"></label>'+
  '<button type="button" class="link-button" data-interest-remove aria-label="Zinssatz '+(index+1)+' entfernen">Entfernen</button></fieldset>';
}
export function interestFormMarkup(terms,esc,options,{canForecast=false,asOf=localToday()}={}){
 const t=terms||{dayCount:'unknown',rates:[{fromDate:asOf,annualRateExact:'',knownThrough:null}]};
 return '<details class="advanced-apis" id="interestDisclosure"><summary>Zinssätze und Prognose</summary>'+
  '<label class="csv-skip"><input type="checkbox" id="interestEnabled" name="interestEnabled"'+(terms?' checked':'')+'> Zinssätze für dieses Konto hinterlegen</label>'+
  '<div id="interestFields"><p id="interestCurrentRate" class="small-help"></p>'+
  '<label class="field"><span>Zinsmethode laut Kontokonditionen</span><select id="interestMethod" name="interestMethod">'+options(Object.entries(INTEREST_METHODS),t.dayCount)+'</select></label>'+
  '<p class="small-help">Beide Methoden zählen echte Kalendertage. ACT/365 Fixed teilt durch 365, ACT/360 durch 360 – auch im Schaltjahr. Nicht bekannt? Keine Methode raten; dann ist keine Prognose möglich.</p>'+
  '<div id="interestRates">'+t.rates.map((r,i)=>rateRow(r,i,esc)).join('')+'</div>'+
  '<button type="button" class="btn outline" id="interestAddRate">+ Zinssatzänderung</button>'+
  '<p class="small-help">Vergangene und geplante Änderungen getrennt erfassen. Ohne Bekannt-bis-Datum ist eine spätere Fortführung nur eine Annahme. Einträge bestätigen keine zukünftige Bankleistung.</p>'+
  '<p id="interestEditorStatus" class="small-help" role="status"></p>'+
  (canForecast?'<details class="advanced-apis" data-interest-preview><summary>Brutto-Zinsen hochrechnen</summary>'+
   '<p class="small-help">Berechnungsstichtag: '+dateLabel(asOf)+'. Kapitalbasis ist dein aktuell erfasstes Guthaben dieses Kontos, kein historischer Bankbestand. Bedingungen im Formular werden für die Vorschau verwendet; Speichern erfolgt gesondert.</p>'+
   '<div class="field-row"><label class="field"><span>Von · einschließlich</span><input type="date" id="interestStart" value="'+asOf+'"></label>'+
   '<label class="field"><span>Bis · ausschließlich</span><input type="date" id="interestEnd" value="'+interestDateAfter(asOf,365)+'"></label></div>'+
   '<label class="csv-skip"><input type="checkbox" id="interestAllowScenario"> Fehlende zukünftige Konditionen mit dem letzten hinterlegten Zinssatz als Szenario fortschreiben</label>'+
   '<button type="button" class="btn outline" id="interestCalculate">Prognose berechnen</button>'+
   '<div id="interestResult" class="interest-result" role="status" aria-live="polite" tabindex="-1"></div></details>'
   :'<p class="small-help">Prognose nach dem Speichern des Kontos verfügbar.</p>')+'</div></details>';
}
export function interestTermsFromForm(root){
 if(!root.querySelector('#interestEnabled').checked)return null;
 const rates=[...root.querySelectorAll('.interest-rate-row')].map(row=>({fromDate:row.querySelector('[name="interestFrom"]').value,
  annualRateExact:row.querySelector('[name="interestRate"]').value,knownThrough:row.querySelector('[name="interestThrough"]').value}));
 return normalizeInterestTerms({version:1,dayCount:root.querySelector('#interestMethod').value,rates});
}
export function renderInterestForecast(result,esc){
 const amount=value=>esc(value.replace('.',',')+' '+result.currency);
 return '<h3>Unverbindliche Brutto-Prognose</h3><p class="interest-gross"><strong>'+amount(result.grossExact)+'</strong> vor Steuern</p>'+
  '<p>'+dateLabel(result.startDate)+' bis '+dateLabel(result.endDate)+' (Ende nicht mitgerechnet) · '+result.totalDays+' Tage</p>'+
  '<p class="small-help">Kapitalbasis am '+dateLabel(result.asOf)+': '+amount(result.principalExact)+'. Dieses Kapital bleibt rechnerisch konstant: keine Ein-/Auszahlungen, kein Zinseszins, keine Steuerberechnung. Prognose zählt nicht zum Vermögen.</p>'+
  '<p class="small-help">'+esc(INTEREST_METHODS[result.dayCount])+'. Einmalige Endrundung auf '+result.currencyDigits+' Nachkommastellen, exakte Hälfte von null weg.</p>'+
  '<p class="small-help">'+(result.usesScenario?'Szenario: Fehlende Konditionen wurden ausdrücklich mit dem letzten hinterlegten Satz fortgeschrieben.':'Berechnung mit hinterlegten Konditionen.')+' Zukünftige Konditionen und Zinsgutschriften sind nicht garantiert.</p>'+
  '<div class="interest-periods" role="region" aria-label="Zinsabschnitte der Prognose" tabindex="0"><table><caption>Zinsabschnitte · Zeitraum ohne Zinseszinsen</caption><thead><tr><th scope="col">Von (inkl.)</th><th scope="col">Bis (exkl.)</th><th scope="col">Tage</th><th scope="col">% p. a.</th><th scope="col">Grundlage</th></tr></thead><tbody>'+
  result.segments.map(s=>'<tr><td>'+dateLabel(s.fromDate)+'</td><td>'+dateLabel(s.endDate)+'</td><td>'+s.days+'</td><td>'+esc(s.annualRateExact.replace('.',','))+'</td><td>'+(s.scenario?'Szenario: letzter Satz':'Hinterlegte Kondition')+'</td></tr>').join('')+'</tbody></table></div>';
}
export function bindInterestForm(root,{calculate,onEdit=()=>{}}={}){
 const get=id=>root.querySelector('#'+id),rates=get('interestRates'),result=get('interestResult');
 let generation=0;
 const clear=()=>{generation++;result?.replaceChildren();get('interestEditorStatus').textContent='';};
 const summary=()=>{
  const today=localToday();
  const latest=[...rates.querySelectorAll('.interest-rate-row')].map(row=>({date:row.querySelector('[name="interestFrom"]').value,rate:row.querySelector('[name="interestRate"]').value}))
   .filter(r=>r.date&&r.date<=today&&r.rate.trim()).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
  get('interestCurrentRate').textContent=latest?'Zuletzt hinterlegter Satz: '+latest.rate+' % p. a. · gültig ab '+dateLabel(latest.date):'Für heute ist kein Zinssatz hinterlegt.';
 };
 const sync=()=>{
  const enabled=get('interestEnabled').checked;get('interestFields').hidden=!enabled;
  for(const input of get('interestFields').querySelectorAll('input,select,button'))input.disabled=!enabled;
  summary();clear();
 };
 get('interestEnabled').addEventListener('change',sync);
 const clearValidation=()=>root.querySelector('#dialogError')?.classList.add('hidden');
 const section=get('interestDisclosure'),changed=event=>{clear();summary();if(section.contains(event.target)&&!event.target.closest('[data-interest-preview]'))clearValidation();};
 section.addEventListener('input',changed);section.addEventListener('change',changed);
 for(const input of root.querySelectorAll('input,select,textarea'))if(!section.contains(input)){input.addEventListener('input',changed);input.addEventListener('change',changed);}
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const renumber=()=>{[...rates.children].forEach((row,i)=>{row.querySelector('legend').textContent='Zinssatz '+(i+1);row.querySelector('[data-interest-remove]').setAttribute('aria-label','Zinssatz '+(i+1)+' entfernen');});};
 get('interestAddRate').addEventListener('click',()=>{
  if(rates.children.length>=60){get('interestEditorStatus').textContent='Höchstens 60 Zinsabschnitte pro Konto.';return;}
  rates.insertAdjacentHTML('beforeend',rateRow({},rates.children.length,esc));clear();clearValidation();onEdit();rates.lastElementChild.querySelector('input').focus();
 });
 rates.addEventListener('click',e=>{const button=e.target.closest('[data-interest-remove]');if(!button)return;
  const row=button.closest('.interest-rate-row'),next=row.nextElementSibling||row.previousElementSibling;row.remove();
  if(!rates.children.length)rates.insertAdjacentHTML('beforeend',rateRow({},0,esc));renumber();clear();clearValidation();summary();onEdit();(next||rates.firstElementChild).querySelector('input').focus();
 });
 get('interestCalculate')?.addEventListener('click',async()=>{
  clear();const request=generation,button=get('interestCalculate'),enabled=get('interestEnabled');button.disabled=true;
  try{
   const output=await calculate({terms:interestTermsFromForm(root),startDate:get('interestStart').value,endDate:get('interestEnd').value,allowScenario:get('interestAllowScenario').checked});
   if(request!==generation||!result.isConnected)return;
   result.innerHTML=renderInterestForecast(output,esc);
  }catch(error){if(request===generation&&result.isConnected)result.textContent='Prognose nicht möglich: '+String(error.message||error);}
  finally{if(button.isConnected)button.disabled=!enabled.checked;}
  if(request===generation&&result.isConnected)result.focus({preventScroll:true});
 });
 sync();
}
