import {units,exact} from './decimal.js';

export const localToday=()=>new Intl.DateTimeFormat('sv-SE').format(new Date());
export const LIQUIDITY_LABELS={free:'Frei verfügbar',bound:'Gebunden',unknown:'Nicht bestätigt'};
const validDate=value=>typeof value==='string'&&/^(?:19|20|21)\d\d-\d\d-\d\d$/.test(value)&&
 !Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
const date=value=>{
 if(value==null||value==='')return null;
 if(!validDate(value))throw Error('Bitte ein gültiges Kalenderdatum für das Guthabenkonto angeben.');
 return value;
};
/** Optional documentary account metadata. Never writes money or journal entries. */
export function normalizeCashTerms(raw){
 if(raw==null)return null;
 if(typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||typeof raw.fixedTerm!=='boolean'||
  !['free','bound','unknown'].includes(raw.status)||!['unconfirmed','paid-out','renewed'].includes(raw.outcome))
  throw Error('Ungültige Liquiditäts- oder Festgeldinformationen.');
 const result={version:1,status:raw.status,fixedTerm:raw.fixedTerm,startDate:date(raw.startDate),maturityDate:date(raw.maturityDate),
  outcome:raw.outcome,outcomeDate:date(raw.outcomeDate),evidence:raw.evidence==null?null:(String(raw.evidence).trim()||null),renewalMaturityDate:date(raw.renewalMaturityDate)};
 if(result.evidence!=null&&(typeof raw.evidence!=='string'||result.evidence.length>160))throw Error('Belegverweis muss Text mit höchstens 160 Zeichen sein.');
 if(result.startDate&&result.maturityDate&&result.startDate>=result.maturityDate)throw Error('Die Fälligkeit muss nach dem Vertragsbeginn liegen.');
 if(!result.fixedTerm&&(result.startDate||result.maturityDate||result.outcome!=='unconfirmed'||result.outcomeDate||result.evidence||result.renewalMaturityDate))
  throw Error('Vertragsdaten benötigen die Kennzeichnung als Festgeld.');
 if(result.outcome==='unconfirmed'){
  if(result.outcomeDate||result.evidence||result.renewalMaturityDate)throw Error('Unbestätigter Vertrag darf keine bestätigte Auszahlung oder Wiederanlage enthalten.');
 }else{
  if(!result.outcomeDate||!result.evidence)throw Error('Bestätigung benötigt das tatsächliche Datum und einen Belegverweis.');
  if(result.startDate&&result.outcomeDate<result.startDate)throw Error('Bestätigung liegt vor dem Vertragsbeginn.');
 }
 if(result.fixedTerm&&result.status==='free'&&result.outcome!=='paid-out')throw Error('Festgeld wird erst nach bestätigter Auszahlung und ausdrücklich bestätigter Verfügbarkeit frei.');
 if(result.outcome==='paid-out'&&(result.status==='bound'||result.renewalMaturityDate))throw Error('Auszahlung: Verfügbarkeit bestätigen oder unbekannt lassen; keine Wiederanlagefälligkeit angeben.');
 if(result.renewalMaturityDate&&(result.outcome!=='renewed'||result.renewalMaturityDate<=result.outcomeDate))throw Error('Neue Fälligkeit muss nach der bestätigten Wiederanlage liegen.');
 return result;
}
/** Calendar passage never confirms payment, rollover, cash movement or availability. */
export function accountLiquidity(account,asOf=localToday()){
 if(!validDate(asOf))throw Error('Ungültiger Stichtag für Liquiditätsanzeige.');
 const t=normalizeCashTerms(account.cashTerms);
 if(!t)return {status:'unknown',reason:'not-recorded',maturityDate:null};
 if(!t.fixedTerm)return {status:t.status,reason:'user-stated',maturityDate:null};
 const renewed=t.outcome==='renewed',maturityDate=renewed?t.renewalMaturityDate:t.maturityDate;
 if(t.outcomeDate&&t.outcomeDate>asOf)return {status:'unknown',reason:'future-confirmation',maturityDate};
 if(t.outcome==='paid-out')return {status:t.status,reason:'paid-out',maturityDate:null};
 if(!renewed&&t.startDate&&t.startDate>asOf)return {status:'unknown',reason:'not-started',maturityDate};
 if(maturityDate&&maturityDate<=asOf)return {status:'unknown',reason:'maturity-review',maturityDate};
 return {status:t.status,reason:renewed?(maturityDate?'renewed':'renewed-missing-maturity'):maturityDate?'fixed-term':'missing-maturity',maturityDate};
}
/** Nominal cash only; no FX, asset prices or added portfolio totals. */
export function accountCashNominal(model,account){
 const positions=model.positions.filter(p=>p.accountId===account.id&&p.kind==='cash'&&p.valuationMode!=='excluded');
 if(!positions.length)return null;
 if(positions.some(p=>p.currency!==account.currency||(p.economicRole&&p.economicRole!=='standard')))return null;
 try{return exact(positions.reduce((sum,p)=>sum+units(p.quantityExact??p.quantity),0n));}catch{return null;}
}
export function cashTermsFromForm(values,previous=null,asOf=localToday()){
 if(!values.cashTermsEnabled)return null;
 const fixedTerm=Boolean(values.fixedTerm),outcome=fixedTerm?values.termOutcome:'unconfirmed';
 const result=normalizeCashTerms({version:1,status:values.liquidityStatus,fixedTerm,
  startDate:fixedTerm?values.termStartDate:null,maturityDate:fixedTerm?values.termMaturityDate:null,outcome,
  outcomeDate:outcome!=='unconfirmed'?values.termOutcomeDate:null,evidence:outcome!=='unconfirmed'?values.termEvidence:null,
  renewalMaturityDate:outcome==='renewed'?values.termRenewalMaturityDate:null});
 if(result.outcomeDate&&result.outcomeDate>asOf)throw Error('Eine tatsächliche Auszahlung oder Wiederanlage darf nicht in der Zukunft liegen.');
 const prior=normalizeCashTerms(previous);
 if(result.outcome!=='unconfirmed'&&JSON.stringify(result)!==JSON.stringify(prior)&&!values.termEvidenceConfirmed)
  throw Error('Bitte Auszahlung oder Wiederanlage anhand deines Belegs ausdrücklich bestätigen.');
 return result;
}
