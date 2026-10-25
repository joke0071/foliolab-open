import {calculateInterestScenario} from './interest-scenario.js';
import {accountCashNominal,localToday} from './cash-terms.js';
import {ledgerQuantityAudit} from './transactions.js';

/** Read current recorded cash only. A caller cannot backdate this account balance. */
export function forecastAccountInterest(model,options={}){
 const {accountId,asOf,startDate,endDate,allowScenario=false}=options;
 if(asOf!==localToday())throw Error('Berechnungsstichtag ist nicht mehr aktuell. Bitte neu öffnen; kein historischer Kontostand bekannt.');
 const account=model.accounts.find(a=>a.id===accountId);
 if(!account||!model.providers.some(p=>p.id===account.providerId))throw Error('Bitte ein vorhandenes Konto auswählen.');
 if(account.cashTerms?.fixedTerm)throw Error('Diese Prognose gilt für Tages-/Kontoguthaben. Festgeld wird hier nicht prognostiziert.');
 const positions=model.positions.filter(p=>p.accountId===accountId&&p.kind==='cash'&&p.valuationMode!=='excluded');
 if(positions.some(p=>p.providerId!==account.providerId))throw Error('Guthaben ist dem Anbieter nicht eindeutig zugeordnet.');
 const principal=accountCashNominal(model,account);
 if(principal===null)throw Error('Keine eindeutige erfasste Kapitalbasis in Kontowährung vorhanden.');
 const audit=ledgerQuantityAudit(model);
 if(audit.mismatches.some(row=>positions.some(p=>p.id===row.positionId)))throw Error('Guthaben und Finanzjournal widersprechen sich. Bitte zuerst prüfen.');
 const terms=Object.hasOwn(options,'terms')?options.terms:account.interestTerms;
 const result=calculateInterestScenario({principal,currency:account.currency,asOf,startDate,endDate,terms,allowScenario});
 return {...result,accountId,positionIds:positions.map(p=>p.id),basis:'current-recorded-cash'};
}
