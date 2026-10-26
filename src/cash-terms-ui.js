import {accountLiquidity,accountCashNominal,LIQUIDITY_LABELS,localToday} from './cash-terms.js';
const dateLabel=value=>value?value.split('-').reverse().join('.'):'Nicht hinterlegt';
const reasonLabel={
 'not-recorded':'Verfügbarkeit noch nicht angegeben',
 'not-started':'Vertragsbeginn liegt noch in der Zukunft',
 'maturity-review':'Fälligkeit erreicht · Auszahlung oder Wiederanlage prüfen',
 'missing-maturity':'Fälligkeitsdatum fehlt',
 'future-confirmation':'Bestätigung liegt nach dem gewählten Stichtag',
 'paid-out':'Auszahlung laut Beleg bestätigt · Kontostand gesondert prüfen',
 'renewed':'Wiederanlage laut Beleg bestätigt',
 'renewed-missing-maturity':'Wiederanlage laut Beleg bestätigt · neue Fälligkeit fehlt',
 'fixed-term':'Vertrag läuft',
 'user-stated':'Vom Nutzer angegeben'
};
export function cashTermsAccountHint(account,esc,asOf=localToday()){
 if(!account.cashTerms)return '';
 const state=accountLiquidity(account,asOf);
 return '<span class="liquidity-status liquidity-'+state.status+'">'+esc(LIQUIDITY_LABELS[state.status])+'</span>'+
  '<span class="liquidity-note">'+esc(reasonLabel[state.reason])+ (state.maturityDate?' · Fällig '+dateLabel(state.maturityDate):'')+'</span>';
}
export function renderCashTermsOverview(model,esc,{asOf=localToday(),open=false}={}){
 if(!model.accounts.some(a=>a.cashTerms))return '';
 const accounts=model.accounts.filter(a=>a.cashTerms||model.positions.some(p=>p.accountId===a.id&&p.kind==='cash'));
 const rows=accounts.map(account=>({account,state:accountLiquidity(account,asOf)}));
 const counts={free:0,bound:0,unknown:0};for(const row of rows)counts[row.state.status]++;
 rows.sort((a,b)=>(a.state.maturityDate||'9999').localeCompare(b.state.maturityDate||'9999')||a.account.name.localeCompare(b.account.name));
 const markup=rows.map(({account,state})=>{
  const provider=model.providers.find(p=>p.id===account.providerId),amount=accountCashNominal(model,account);
  return '<div class="cash-term-row" data-cash-account="'+esc(account.id)+'"><div><strong>'+esc(account.name)+'</strong>'+
   '<small>'+esc(provider?.name||'Anbieter')+' · '+esc(account.currency)+'</small>'+(account.cashTerms?cashTermsAccountHint(account,esc,asOf):'<span class="liquidity-status liquidity-unknown">Nicht bestätigt</span><span class="liquidity-note">Verfügbarkeit noch nicht angegeben</span>')+
   '<small>'+esc(amount==null?'Guthaben nicht eindeutig erfasst':amount.replace('.',',')+' '+account.currency+' erfasst')+'</small></div>'+
   '<button type="button" class="link-button" data-action="edit-account" data-id="'+esc(account.id)+'" aria-label="Liquidität von '+esc(account.name)+' bearbeiten">Bearbeiten</button></div>';
 });
 return '<details id="cashTermsOverview" class="cash-terms-overview performance-details"'+(open?' open':'')+'><summary><span>Liquidität und Fälligkeiten</span><small>'+accounts.length+' Konten</small></summary>'+
  '<p class="small-help">'+counts.free+' frei verfügbar · '+counts.bound+' gebunden · '+counts.unknown+' nicht bestätigt. Guthaben in Kontowährung; keine zusätzlichen Vermögenswerte.</p>'+
  markup.slice(0,5).join('')+(markup.length>5?'<details class="advanced-apis"><summary>Weitere '+(markup.length-5)+' Konten</summary>'+markup.slice(5).join('')+'</details>':'')+'</details>';
}
export function cashTermsFormMarkup(terms,esc,options){
 const t=terms||{status:'unknown',fixedTerm:false,outcome:'unconfirmed'};
 return '<details class="advanced-apis" id="cashTermsDisclosure"><summary>Liquidität und Festgeld · optional</summary>'+
  '<label class="csv-skip"><input type="checkbox" name="cashTermsEnabled" id="cashTermsEnabled"'+(terms?' checked':'')+'> Liquiditätsinformationen ergänzen</label>'+
  '<div id="cashTermsFields"><label class="field"><span>Verfügbarkeit laut deiner Angabe</span><select name="liquidityStatus" id="liquidityStatus">'+options(Object.entries(LIQUIDITY_LABELS),t.status)+'</select></label>'+
  '<label class="csv-skip"><input type="checkbox" name="fixedTerm" id="fixedTerm"'+(t.fixedTerm?' checked':'')+'> Festgeld mit Vertragslaufzeit</label>'+
  '<div id="fixedTermFields"><div class="field-row"><label class="field"><span>Vertragsbeginn · optional</span><input type="date" name="termStartDate" id="termStartDate" value="'+esc(t.startDate||'')+'"></label>'+
  '<label class="field"><span>Vereinbarte Fälligkeit · optional</span><input type="date" name="termMaturityDate" id="termMaturityDate" value="'+esc(t.maturityDate||'')+'"></label></div>'+
  '<label class="field"><span>Auszahlung oder Wiederanlage</span><select name="termOutcome" id="termOutcome">'+options([['unconfirmed','Noch nicht bestätigt'],['paid-out','Auszahlung anhand Beleg bestätigen'],['renewed','Wiederanlage anhand Beleg bestätigen']],t.outcome)+'</select></label>'+
  '<p class="small-help">Eine Fälligkeit bestätigt keine Auszahlung. Diese Angaben ändern weder Guthaben noch Buchungen; prüfe den tatsächlichen Kontostand gesondert.</p>'+
  '<div id="termConfirmationFields"><label class="field"><span>Tatsächliches Datum der Auszahlung oder Wiederanlage</span><input type="date" name="termOutcomeDate" id="termOutcomeDate" max="'+localToday()+'" value="'+esc(t.outcomeDate||'')+'"></label>'+
  '<label class="field"><span>Belegverweis</span><input name="termEvidence" id="termEvidence" maxlength="160" value="'+esc(t.evidence||'')+'" placeholder="z. B. Abrechnung vom 25.10.2026"><small>Bezeichnung deines Belegs; kein Upload und keine Bank-Zugangsdaten.</small></label>'+
  '<label class="field" id="termRenewalWrap"><span>Neue Fälligkeit nach Wiederanlage · optional</span><input type="date" name="termRenewalMaturityDate" id="termRenewalMaturityDate" value="'+esc(t.renewalMaturityDate||'')+'"></label>'+
  '<label class="csv-skip"><input type="checkbox" name="termEvidenceConfirmed" id="termEvidenceConfirmed"> Auszahlung oder Wiederanlage anhand meines Belegs geprüft</label></div></div></div></details>';
}
export function bindCashTermsForm(root){
 const get=id=>root.querySelector('#'+id);
 const sync=()=>{
  const enabled=get('cashTermsEnabled').checked,fixed=enabled&&get('fixedTerm').checked,outcome=get('termOutcome').value;
  get('cashTermsFields').hidden=!enabled;get('fixedTermFields').hidden=!fixed;
  get('termConfirmationFields').hidden=!fixed||outcome==='unconfirmed';
  get('termRenewalWrap').hidden=outcome!=='renewed';
  for(const input of get('cashTermsFields').querySelectorAll('input,select'))input.disabled=!enabled;
  for(const input of get('fixedTermFields').querySelectorAll('input,select'))input.disabled=!fixed;
  for(const input of get('termConfirmationFields').querySelectorAll('input'))input.disabled=!fixed||outcome==='unconfirmed';
  get('termRenewalMaturityDate').disabled=!fixed||outcome!=='renewed';
  const status=get('liquidityStatus');
  status.querySelector('[value="free"]').disabled=fixed&&outcome!=='paid-out';
  status.querySelector('[value="bound"]').disabled=fixed&&outcome==='paid-out';
  if(status.selectedOptions[0]?.disabled)status.value='unknown';
 };
 for(const id of ['cashTermsEnabled','fixedTerm','termOutcome'])get(id).addEventListener('change',sync);
 sync();
}
