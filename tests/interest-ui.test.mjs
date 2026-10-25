import test from 'node:test';
import assert from 'node:assert/strict';
import {interestFormMarkup,renderInterestForecast} from '../src/interest-ui.js';
import {calculateInterestScenario} from '../src/interest-scenario.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options=(rows,selected)=>rows.map(([v,t])=>'<option value="'+esc(v)+'"'+(v===selected?' selected':'')+'>'+esc(t)+'</option>').join('');
test('normal new account gets a collapsed optional section and no required condition fields',()=>{
 const html=interestFormMarkup(null,esc,options,{asOf:'2026-10-25'});
 assert.match(html,/<details class="advanced-apis" id="interestDisclosure"><summary>/);assert.doesNotMatch(html,/ required|id="interestCalculate"/);
 assert.match(html,/value="unknown" selected/);assert.match(html,/nach dem Speichern/);
});
test('editable metadata escapes values and native-currency scenario explains all assumptions',()=>{
 const terms={version:1,dayCount:'ACT/365F',rates:[{fromDate:'2026-01-01',annualRateExact:'2.5',knownThrough:null}]};
 const html=interestFormMarkup({...terms,rates:[{...terms.rates[0],annualRateExact:'"><img src=x>'}]},esc,options,{canForecast:true,asOf:'2026-01-01'});
 assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);
 const result=calculateInterestScenario({principal:'10000',currency:'USD',asOf:'2026-01-01',startDate:'2026-01-01',endDate:'2027-01-01',terms,allowScenario:true});
 const before=JSON.stringify(result),rendered=renderInterestForecast(result,esc);
 for(const text of ['250,00 USD','vor Steuern','Kapitalbasis','ACT/365 Fixed','Szenario','keine Ein-/Auszahlungen','kein Zinseszins','nicht zum Vermögen','Ende nicht mitgerechnet'])assert.ok(rendered.includes(text),text);
 assert.doesNotMatch(rendered,/EUR/);assert.equal(JSON.stringify(result),before);
});
