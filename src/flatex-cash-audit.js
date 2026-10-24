import {units,exact} from './decimal.js';

/**
 * A statement audit, not a booking engine: provider-matched EUR cash accounts
 * are offered for EXPLICIT mapping, and cash movements remain untouched.
 *
 * CSV fields such as "Zahlungspfl." may describe a counterparty rather
 * than the user's own IBAN. Therefore a value found in that column NEVER
 * triggers automatic association with an account or position.
 */
export function flatexCashAccountChoices(model,securitiesAccountId){
 const custody=(model?.accounts||[]).find(a=>a.id===securitiesAccountId&&a.type==='securities');
 if(!custody)return [];
 const provider=(model?.providers||[]).find(p=>p.id===custody.providerId);
 if(!provider||!/flatex/i.test(provider.name))return [];
 return (model.accounts||[]).filter(a=>a.providerId===custody.providerId&&
  ['checking','savings','other'].includes(a.type)&&a.currency==='EUR')
  .flatMap(a=>(model.positions||[]).filter(p=>p.accountId===a.id&&p.kind==='cash'&&
    p.currency==='EUR'&&!p.wallet?.enabled)
    .map(p=>({accountId:a.id,positionId:p.id,accountName:a.name,positionName:p.name})));
}
const dateOK=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&
 !Number.isNaN(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;

/**
 * Strictly informational sum by distinct CSV account reference. This is
 * NOT a chronological proof of opening cash, not a performance cash flow,
 * and not a verified current bank balance. Transaction kind is never
 * silently inferred from the amount's sign.
 */
export function auditFlatexCashStatements(prepared,{accountAmountsEUR=false}={}){
 const items=prepared?.cashItems;
 if(!Array.isArray(items))throw Error('Flatex-Kontoumsätze fehlen.');
 const groups=new Map();
 const problems=[];
 for(const [index,item] of items.entries()){
  const ref=String(item.account||'').trim();
  if(!ref){problems.push({index,reason:'Kontoreferenz im CSV fehlt oder ist nicht eindeutig.'});continue;}
  if(!dateOK(item.date)){
   problems.push({index,reason:'Ungültiges Buchungsdatum.'});continue;
  }
  let amount;
  try{amount=units(item.amount);}catch{
   problems.push({index,reason:'Ungültiger oder nicht exakt lesbarer Kontobetrag.'});continue;
  }
  if(!groups.has(ref))groups.set(ref,{reference:ref,count:0,credit:0n,debit:0n,net:0n,
   earliest:item.date,latest:item.date,kinds:Object.create(null)});
  const group=groups.get(ref);
  group.count++;
  group.earliest=item.date<group.earliest?item.date:group.earliest;
  group.latest=item.date>group.latest?item.date:group.latest;
  if(amount>0n)group.credit+=amount;
  if(amount<0n)group.debit-=amount;
  group.net+=amount;
  const kind=String(item.kind||'unknown');
  group.kinds[kind]=(group.kinds[kind]||0)+1;
 }
 return {
  currencyConfirmed:accountAmountsEUR,
  groups:[...groups.values()].map(group=>({
   reference:group.reference,count:group.count,earliest:group.earliest,latest:group.latest,
   inflowsExact:accountAmountsEUR?exact(group.credit):null,
   outflowsExact:accountAmountsEUR?exact(group.debit):null,
   netExact:accountAmountsEUR?exact(group.net):null,
   kinds:{...group.kinds}
  })),
  issues:problems,
  // Crucial: an outgoing buy is NOT necessarily an external contribution;
  // no implicit cash account posting or tax categorisation.
  note:'Beträge sind nur die Summe der hochgeladenen Zeilen pro CSV-Kontoreferenz. Diese Referenz kann auch einen Zahlungspartner bezeichnen. Weder Kontovollständigkeit noch Anfangs-/Endsaldo oder externe Kapitalflüsse werden daraus abgeleitet.'
 };
}
