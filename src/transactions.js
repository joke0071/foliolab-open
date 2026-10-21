import {assetKey} from './assets.js';
import {units,exact,mul,div} from './decimal.js';

/** @typedef {'buy'|'sell'|'deposit'|'withdraw'|'deliver_in'|'deliver_out'|'transfer'|'dividend'|'interest'|'reward'|'airdrop'|'fee'|'tax'|'adjust'|'correction'|'split'|'swap'|'merger'|'ticker_change'|'isin_change'|'delist'} TransactionType */
/** @typedef {{id:string,type:TransactionType,date:string,positionId:string,quantity:number,feeEUR:number,taxEUR:number,notes:string}} Transaction */
export const TX_TYPES={
 buy:'Kauf',sell:'Verkauf',deposit:'Einzahlung',withdraw:'Auszahlung',
 deliver_in:'Einlieferung',deliver_out:'Auslieferung',transfer:'Interner Transfer',
 dividend:'Dividende',interest:'Zinsen',reward:'Staking-Reward',airdrop:'Airdrop',
 fee:'Gebühr',tax:'Steuer',adjust:'Bestandszugang',correction:'Bestandskorrektur',
 split:'Aktiensplit / Reverse Split',swap:'Token-Swap',merger:'Fusion / Umtausch',
 ticker_change:'Ticker ändern',isin_change:'ISIN ändern',delist:'Delisting markieren'
};
const words=(s,len=200)=>String(s??'').trim().slice(0,len);
const amount=(v,min=0n)=>{const x=units(v);if(x<min||x>10n**45n)throw Error('Ungültige Menge oder Betrag.');return x;};
const dateOk=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
const pos=(m,id)=>{const p=m.positions.find(p=>p.id===id);if(!p)throw Error('Position nicht gefunden.');if(p.wallet?.enabled)throw Error('Automatisch gescannte Wallet-Bestände sind nicht manuell buchbar.');return p;};
const q=p=>units(p.quantityExact??p.quantity);
const setQ=(p,u)=>{p.quantityExact=exact(u);p.quantity=Number(p.quantityExact);};
const basis=p=>p.costBasisExact!=null?units(p.costBasisExact):p.costBasisEUR==null?null:units(p.costBasisEUR);
const setBasis=(p,u)=>{p.costBasisEUR=u==null?null:Number(exact(u));p.costBasisExact=u==null?null:exact(u);};
const remember=(m,p,v,quantity,fee,tax,fx,tradeEUR)=>{
 const entry={id:v.id||((globalThis.crypto?.randomUUID?.())||'tx-'+Date.now()+'-'+Math.random()),type:v.type,date:v.date,
   positionId:p.id,accountId:p.accountId,positionName:p.name,quantity:Number(exact(quantity)),
   quantityExact:exact(quantity),unitPrice:Number(v.unitPrice??p.price),feeEUR:Number(exact(fee)),taxEUR:Number(exact(tax)),
   fxRate:Number(exact(fx)),amountEUR:Number(exact(tradeEUR)),amountExactEUR:exact(tradeEUR),
   targetPositionId:v.targetPositionId||null,external:v.type==='deposit'||v.type==='withdraw',notes:words(v.notes,180)};
 if(m.bookings.some(t=>t.id===entry.id))throw Error('Buchungs-ID existiert bereits.');
 m.bookings.unshift(entry);
 return entry;
};
const checkTarget=(m,p,id)=>{const t=pos(m,id);if(t.id===p.id)throw Error('Ziel muss eine andere Position sein.');return t;};

/** @typedef {{id:string,positionId:string|null,accountId:string|null,role:string,quantityDeltaExact:string|null,amountBookEURExact:string}} Posting */
/** @typedef {{id:string,type:string,date:string,recordedAt:string,sequence:number,postings:Posting[],cashPositionId:string|null,status:string}} JournalEntry */
const id=()=>globalThis.crypto?.randomUUID?.()||'j-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const zero=0n;
/** Preserve an explicit, undated opening baseline; never reconstruct invented historical trades. */
export function captureOpenings(model){
 model.openingPositions??=[];
 for(const p of model.positions){
  const opening=model.openingPositions.find(x=>x.positionId===p.id);
  const baseline={positionId:p.id,quantityExact:String(p.quantityExact??p.quantity),costBasisExact:p.costBasisExact??(p.costBasisEUR==null?null:String(p.costBasisEUR)),realizedPnLExact:p.realizedPnLExact??(p.realizedPnLEUR==null?null:String(p.realizedPnLEUR)),source:'observed-opening',asOf:null};
  if(!opening)model.openingPositions.push(baseline);
  else if(!(model.journalEntries||[]).some(e=>e.postings.some(post=>post.positionId===p.id)))
    Object.assign(opening,baseline); // Manual or wallet position not yet journal-managed.
 }
}
/** Atomic journal records are independent of current market valuations. */
export function validateJournalEntry(entry){
 if(!entry||!entry.id||!/^(?:19|20)\d\d-\d\d-\d\d$/.test(entry.date)||Number.isNaN(Date.parse(entry.date))||new Date(entry.date+'T12:00:00Z').toISOString().slice(0,10)!==entry.date||!Array.isArray(entry.postings)||!entry.postings.length||entry.postings.length>24)throw Error('Journal-Eintrag ungültig.');
 const ids=new Set(),sum=entry.postings.reduce((n,p)=>{
  if(!p.id||ids.has(p.id)||!p.role||p.amountBookEURExact==null)throw Error('Journal-Buchung ungültig.');
  ids.add(p.id);if(p.quantityDeltaExact!=null)units(p.quantityDeltaExact);
  return n+units(p.amountBookEURExact);
 },zero);
 if(sum!==zero)throw Error('Buchungssätze sind nicht ausgeglichen.');
 return entry;
}
/** Compare recorded holdings to opening balance plus chronological, exact journal movements. */
export function ledgerQuantityAudit(model){
 const balances=new Map((model.openingPositions||[]).map(x=>[x.positionId,units(x.quantityExact)]));
 const ordered=[...(model.journalEntries||[])].sort((a,b)=>a.date.localeCompare(b.date)||(a.sequence||0)-(b.sequence||0));
 for(const entry of ordered){
  validateJournalEntry(entry);
  for(const posting of entry.postings){
   if(posting.quantityDeltaExact===null||posting.quantityDeltaExact===undefined)continue;
   if(!balances.has(posting.positionId))throw Error('Journal ohne dokumentierten Eröffnungsbestand.');
   balances.set(posting.positionId,balances.get(posting.positionId)+units(posting.quantityDeltaExact));
   if(balances.get(posting.positionId)<0n)throw Error('Chronologischer Buchungsverlauf führt zu negativem Bestand.');
  }
 }
 const mismatches=[];
 for(const p of model.positions){
  const expected=balances.get(p.id);if(expected===undefined)continue;
  if(expected!==units(p.quantityExact??p.quantity))mismatches.push({positionId:p.id,expected:exact(expected),actual:String(p.quantityExact??p.quantity)});
 }
 return {ok:mismatches.length===0,mismatches};
}
function lastJournalDate(model,positionId){
 return (model.journalEntries||[]).filter(e=>e.postings.some(p=>p.positionId===positionId)).map(e=>e.date).sort().at(-1)||null;
}
function postingsFor(copy,p,kind,v,qty,fee,tax,fx,cash,linkedCash,previousQuantity){
 const postings=[],post=(role,value,position=null,delta=null)=>{
   const n=typeof value==='bigint'?value:units(value);
   postings.push({id:id(),role,positionId:position?.id??null,accountId:position?.accountId??null,quantityDeltaExact:delta==null?null:exact(delta),amountBookEURExact:exact(n)});
 };
 const charges=fee+tax;
 if(kind==='buy'||kind==='sell'){
   const side=kind==='buy'?1n:-1n;
   post('asset',side*cash,p,side*qty);
   const net=kind==='buy'?-(cash+charges):cash-charges;
   post(linkedCash?'cash':'clearing',net,linkedCash,linkedCash?units(linkedCash.lastCashDeltaExact):null);
   if(fee)post('fee',fee);
   if(tax)post('tax',tax);
 }else if(['deposit','withdraw','dividend','interest','fee','tax'].includes(kind)){
   const sign=['deposit','dividend','interest'].includes(kind)?1n:-1n;
   const amt=mul(qty,fx)*sign;
   post('cash',amt,p,sign*qty);
   post(kind==='deposit'||kind==='withdraw'?'external-clearing':kind==='fee'?'fee':kind==='tax'?'tax':'income',-amt);
 }else if(kind==='transfer'){
   const target=copy.positions.find(x=>x.id===v.targetPositionId);
   post('transfer-out',-cash,p,-qty);post('transfer-in',cash,target,qty);
 }else if(kind==='swap'||kind==='merger'){
   const target=copy.positions.find(x=>x.id===v.targetPositionId);
   post('nonmonetary-out',zero,p,-qty);
   post('nonmonetary-in',zero,target,units(v.targetQuantity));
 }else {
   // Corporate actions, manual adjustments and in-kind movements are zero-book-value
   // postings until an independent fair market valuation exists.
   post('nonmonetary',zero,p,q(p)-previousQuantity);
 }
 const entry={id:v.id??id(),type:kind,date:v.date,recordedAt:new Date().toISOString(),
  sequence:(copy.journalEntries?.length||0)+1,postings,
  cashPositionId:linkedCash?.id||null,
  status:['buy','sell'].includes(kind)&&!linkedCash?'unresolved-clearing':'recorded',
  source:'manual'};
 return validateJournalEntry(entry);
}
/**
 * Atomic, auditable journal operation. Never replays an earlier transaction over
 * today's holdings; historical entries are preserved, not retroactively inserted.
 * @param {object} model
 * @param {object} input
 * @returns {Transaction}
 */
export function executeTransaction(model,input){
 if(!TX_TYPES[input?.type])throw Error('Buchungstyp wird nicht unterstützt.');
 if(!dateOk(input.date))throw Error('Ungültiges Datum.');
 const copy=structuredClone(model),p=pos(copy,input.positionId),kind=input.type;
 captureOpenings(copy);
 const affected=[p.id,input.targetPositionId,input.cashPositionId].filter(Boolean);
 for(const positionId of affected){const last=lastJournalDate(copy,positionId);if(last&&input.date<last)throw Error('Rückdatierte Buchung vor einem bereits verbuchten Vorgang: bitte zuerst die Chronologie klären.');}
 const qty=amount(input.quantity??0),prev=q(p),fee=amount(input.feeEUR??0),tax=amount(input.taxEUR??0);
 if((fee>0n||tax>0n)&&!['buy','sell'].includes(kind))throw Error('Nebenkosten für diesen Vorgang bitte separat als Gebühren-/Steuerbuchung erfassen.');
 if(p.kind==='cash'&&['buy','sell'].includes(kind))throw Error('Geldkonten über Ein-/Auszahlung oder Transfer buchen, nicht als Wertpapier kaufen/verkaufen.');
 const unitPrice=amount(input.unitPrice??p.price),fx=p.currency==='EUR'?units(1):input.fxRate==null||input.fxRate===''?(()=>{throw Error('Bitte eine gültige Zahl als historischen Wechselkurs eingeben.');})():amount(input.fxRate,1n);
 const cash=mul(mul(qty,unitPrice),fx);
 const b=basis(p);let changed=false,linkedCash=null;
 if(['buy','sell'].includes(kind)&&input.cashPositionId){
   linkedCash=pos(copy,input.cashPositionId);
   if(linkedCash.id===p.id||linkedCash.kind!=='cash'||!['EUR',p.currency].includes(linkedCash.currency))throw Error('Ein passendes Verrechnungskonto in EUR oder Handelswährung wählen.');
   const eur=kind==='buy'?-(cash+fee+tax):cash-fee-tax;
   const cashChange=linkedCash.currency==='EUR'?eur:div(eur,fx);
   if(q(linkedCash)+cashChange<0n)throw Error('Verrechnungskonto hat nicht genügend Guthaben.');
   linkedCash.lastCashDeltaExact=exact(cashChange);
   setQ(linkedCash,q(linkedCash)+cashChange);
   linkedCash.managementSource='transactions';
 }
 const positive=()=>{if(qty<=0n)throw Error('Menge muss positiv sein.');};
 const enough=()=>{if(qty>prev)throw Error('Abgang übersteigt den Bestand.');};
 const deductBasis=()=>{
   if(b===null||prev===0n){setBasis(p,null);return null;}
   const used=mul(b,div(qty,prev));setBasis(p,b-used);return used;
 };
 switch(kind){
 case 'buy':positive();setQ(p,prev+qty);setBasis(p,prev===0n?cash+fee+tax:b==null?null:b+cash+fee+tax);changed=true;break;
 case 'sell':positive();enough();{const used=deductBasis();setQ(p,prev-qty);
   if(used!==null){const realized=units(p.realizedPnLEUR??0)+cash-used-fee-tax;p.realizedPnLEUR=Number(exact(realized));p.realizedPnLExact=exact(realized);}
   changed=true;break;}
 case 'deposit':case 'withdraw':case 'dividend':case 'interest':case 'fee':case 'tax':
   if(p.kind!=='cash')throw Error('Geldbewegungen benötigen eine manuelle Guthabenposition.');
   positive();if(kind==='deposit'||kind==='dividend'||kind==='interest')setQ(p,prev+qty);else {enough();setQ(p,prev-qty);}
   // Fiat money is not treated as investment cost basis or market profit.
   changed=true;break;
 case 'deliver_in':case 'reward':case 'airdrop':case 'adjust':
   positive();setQ(p,prev+qty);setBasis(p,null);changed=true;break;
 case 'deliver_out':positive();enough();setQ(p,prev-qty);setBasis(p,null);changed=true;break;
 case 'transfer':{
   positive();enough();const target=checkTarget(copy,p,input.targetPositionId);
   if(assetKey(p)!==assetKey(target)||p.currency!==target.currency)throw Error('Interner Transfer erfordert dasselbe Asset und dieselbe Währung.');
   if(target.wallet?.enabled)throw Error('Automatisches Wallet-Ziel ist nicht manuell veränderbar.');
   const tb=basis(target),taken=b===null||prev===0n?null:mul(b,div(qty,prev));
   setQ(p,prev-qty);setQ(target,q(target)+qty);
   setBasis(p,taken==null?null:b-taken);
   setBasis(target,taken==null||tb==null?null:tb+taken);
   changed=true;break;}
 case 'correction':{
   const replacement=amount(input.targetQuantity??input.quantity);
   setQ(p,replacement);setBasis(p,null);changed=true;break;}
 case 'split':{
   const numer=amount(input.ratioNumerator??input.quantity,1n),denom=amount(input.ratioDenominator??1,1n);
   const ratio=div(numer,denom);
   if(ratio<=0n)throw Error('Splitfaktor muss positiv sein.');
   setQ(p,mul(prev,ratio));
   // Adjust quote mechanically only; do not present this as a new live market quote.
   const newPrice=div(units(p.priceExact??p.price),ratio);
   p.price=Number(exact(newPrice));p.priceExact=exact(newPrice);p.updatedAt=null;p.priceStatus='rechnerisch nach Split angepasst';
   changed=true;break;}
 case 'swap':case 'merger':{
   positive();enough();const target=checkTarget(copy,p,input.targetPositionId),out=amount(input.targetQuantity,1n);
   const tb=basis(target),taken=b===null||prev===0n?null:mul(b,div(qty,prev));
   setQ(p,prev-qty);setQ(target,q(target)+out);
   setBasis(p,taken==null?null:b-taken);setBasis(target,taken==null||tb==null?null:tb+taken);
   // No assumed tax treatment on conversions or mergers.
   changed=true;break;}
 case 'ticker_change':{const ticker=words(input.newSymbol,32).toUpperCase();if(!/^[A-Z0-9._-]{1,32}$/.test(ticker))throw Error('Neuer Ticker fehlt.');p.symbol=ticker;changed=true;break;}
 case 'isin_change':{const isin=words(input.newIsin,20).toUpperCase();if(!/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin))throw Error('Neue ISIN ungültig.');p.isin=isin;changed=true;break;}
 case 'delist':p.priceStatus='Delisting – letzten Kurs prüfen';p.updatedAt=null;changed=true;break;
 default:throw Error('Unbekannte Buchung.');
 }
 if(!changed)throw Error('Keine Änderung.');
 p.managementSource='transactions';if(['transfer','swap','merger'].includes(kind))copy.positions.find(x=>x.id===input.targetPositionId).managementSource='transactions';
 const entry=remember(copy,p,input,qty,fee,tax,fx,cash);
 if(kind==='transfer'||kind==='swap'||kind==='merger')entry.targetQuantityExact=kind==='transfer'?exact(qty):exact(amount(input.targetQuantity,1n));
 if(kind==='split'){entry.ratioNumerator=String(input.ratioNumerator??input.quantity);entry.ratioDenominator=String(input.ratioDenominator??1);}
 if(kind==='correction')entry.targetQuantityExact=exact(amount(input.targetQuantity??input.quantity));
 if(kind==='ticker_change')entry.newSymbol=p.symbol;
 if(kind==='isin_change')entry.newIsin=p.isin;
 copy.journalEntries??=[];
 const journal=postingsFor(copy,p,kind,input,qty,fee,tax,fx,cash,linkedCash,prev);
 copy.journalEntries.push(journal);
 entry.journalEntryId=journal.id;
 entry.cashPositionId=journal.cashPositionId;
 entry.reconciliationStatus=journal.status;
 if(linkedCash)delete linkedCash.lastCashDeltaExact;
 if(['deposit','withdraw'].includes(kind)){
   copy.externalCashFlows??=[];
   // Positive net flow denotes new money entering the portfolio.
   const signed=kind==='deposit'?mul(qty,fx):-mul(qty,fx);
   copy.externalCashFlows.push({id:entry.id,date:input.date,amountEUR:Number(exact(signed)),amountExactEUR:exact(signed)});
 }
 const audit=ledgerQuantityAudit(copy);
 if(!audit.ok)throw Error('Journal und Bestände stimmen nicht überein. Buchung abgebrochen.');
 // Commit validated changes while preserving references used by currently open dialogs.
 const originals=new Map(model.positions.map(p=>[p.id,p]));
 copy.positions=copy.positions.map(p=>{const original=originals.get(p.id);if(!original)return p;Object.assign(original,p);return original;});
 Object.assign(model,copy);
 return entry;
}
