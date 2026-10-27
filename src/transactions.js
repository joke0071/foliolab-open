import {assetKey} from './assets.js';
import {units,exact,mul,div} from './decimal.js';
import {bookingOwnership,sourceDigest} from './import-identity.js';

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
// Perform a/b proportional fixed-point arithmetic with ONE final rounding.
// Computing mul(value,div(a,b)) rounds a/b first and introduces phantom dust
// even when value*a/b is mathematically exact (e.g. 300 * 2 / 3).
const proportional=(value,numerator,denominator)=>{
 if(denominator<=0n||numerator<0n)throw Error('Ungültiges Mengenverhältnis.');
 const product=value*numerator,abs=product<0n?-product:product;
 const rounded=(abs+denominator/2n)/denominator;
 return product<0n?-rounded:rounded;
};
const remember=(m,p,v,quantity,fee,tax,fx,tradeEUR)=>{
 const entry={id:v.id||((globalThis.crypto?.randomUUID?.())||'tx-'+Date.now()+'-'+Math.random()),type:v.type,date:v.date,
   positionId:p.id,accountId:p.accountId,positionName:p.name,quantity:Number(exact(quantity)),
   quantityExact:exact(quantity),unitPrice:Number(v.unitPrice??p.price),feeEUR:Number(exact(fee)),taxEUR:Number(exact(tax)),
   fxRate:Number(exact(fx)),fxRateDate:words(v.fxRateDate,20)||null,fxSource:words(v.fxSource,80)||null,amountEUR:Number(exact(tradeEUR)),amountExactEUR:exact(tradeEUR),
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
 if(entry.type==='booking-management-audit'){
  const a=entry.managementAudit;
  if(entry.source!=='management-audit'||entry.postings.length!==1||entry.postings[0].role!=='documentation'||entry.postings[0].positionId!=null||entry.postings[0].accountId!=null||entry.postings[0].quantityDeltaExact!=null||units(entry.postings[0].amountBookEURExact)!==zero||
   !a||a.version!==1||!['notes','edit','remove'].includes(a.action)||typeof a.reason!=='string'||!a.reason.trim()||a.reason.length>180||!Array.isArray(a.originals)||a.originals.length<1||a.originals.length>200||!Array.isArray(a.afterBookings)||a.afterBookings.length!==a.originals.length||JSON.stringify(a).length>512000)
    throw Error('Ungültiger Buchungsänderungsnachweis.');
  const auditIds=new Set();
  for(let i=0;i<a.originals.length;i++){
   const o=a.originals[i],b=o?.booking,j=o?.journal,after=a.afterBookings[i];
   if(!b?.id||auditIds.has(b.id)||j?.source!=='manual'||j?.type==='booking-management-audit'||b.journalEntryId!==j?.id||b.type!==j.type||b.date!==j.date||!j.postings?.some(p=>p.positionId===b.positionId)||!Array.isArray(o.flows)||o.flows.length>1||o.flows.some(f=>f.id!==b.id)||
    (a.action==='remove'?after!==null:!after||after.id!==b.id))throw Error('Unvollständiger Buchungsänderungsnachweis.');
   auditIds.add(b.id);validateJournalEntry(j);
  }
 }

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
 // No mixed stock-and-cash corporate action ledger exists yet. Never silently
 // ignore a separately specified broker cash settlement on conversion/split.
 if(['split','swap','merger'].includes(kind)&&input.cashInLieuEUR!=null&&
    amount(input.cashInLieuEUR)>0n)
   throw Error('Barabfindung/Barausgleich wird bei dieser Kapitalmaßnahme nicht automatisch gebucht. Brokerabrechnung separat prüfen.');
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
   const used=proportional(b,qty,prev);setBasis(p,b-used);return used;
 };
 switch(kind){
 case 'buy':positive();setQ(p,prev+qty);setBasis(p,prev===0n?cash+fee+tax:b==null?null:b+cash+fee+tax);changed=true;break;
 case 'sell':positive();enough();{const used=deductBasis();setQ(p,prev-qty);
   if(used!==null){const realized=units(p.realizedPnLExact??p.realizedPnLEUR??0)+cash-used-fee-tax;p.realizedPnLEUR=Number(exact(realized));p.realizedPnLExact=exact(realized);}
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
   const tb=basis(target),taken=b===null||prev===0n?null:proportional(b,qty,prev);
   setQ(p,prev-qty);setQ(target,q(target)+qty);
   setBasis(p,taken==null?null:b-taken);
   setBasis(target,taken==null||tb==null?null:tb+taken);
   changed=true;break;}
 case 'correction':{
   const replacement=amount(input.targetQuantity??input.quantity);
   setQ(p,replacement);setBasis(p,null);changed=true;break;}
 case 'split':{
   if(p.kind==='cash')throw Error('Aktiensplit ist auf einem Geldkonto nicht zulässig.');
   const numer=amount(input.ratioNumerator??input.quantity,1n),denom=amount(input.ratioDenominator??1,1n);
   const next=proportional(prev,numer,denom);
   if(prev>0n&&next===0n)
     throw Error('Reverse Split würde einen Kleinstbestand auf null runden. Barabfindung und Brokerabrechnung separat prüfen.');
   setQ(p,next);
   // Adjust quote mechanically only; do not present this as a new live market quote.
   const newPrice=proportional(units(p.priceExact??p.price),denom,numer);
   p.price=Number(exact(newPrice));p.priceExact=exact(newPrice);p.updatedAt=null;p.priceStatus='rechnerisch nach Split angepasst';
   changed=true;break;}
 case 'swap':case 'merger':{
   positive();enough();const target=checkTarget(copy,p,input.targetPositionId),out=amount(input.targetQuantity,1n);
   if(p.kind==='cash'||target.kind==='cash')
     throw Error('Ein Umtausch mit Geldkonto benötigt nachvollziehbare Kauf-/Verkaufs- und Geldbuchungen; kein bargeldloser Token-Swap.');
   const tb=basis(target),taken=b===null||prev===0n?null:proportional(b,qty,prev);
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

// Explicit classification of existing cash movements. This never replays a
// transfer or changes numerical postings, positions, openings or snapshots.
function transferEvidence(model,b,matched=false){
 if(!b||!['withdraw','deposit'].includes(b.type))throw Error('Ein- und Ausgang müssen vorhandene Geldbewegungen sein.');
 const p=model.positions.find(p=>p.id===b.positionId);
 if(!p||p.kind!=='cash'||p.wallet?.enabled||!p.accountId||b.accountId!==p.accountId||!model.accounts.some(a=>a.id===p.accountId&&a.providerId===p.providerId))throw Error('Eigenes Geldkonto nicht eindeutig belegt.');
 if(!matched&&b.transferMatch)throw Error('Bewegung ist bereits zugeordnet.');
 if(!matched&&b.external!==true)throw Error('Externe Ausgangsklassifikation nicht eindeutig belegt.');
 if(b.feeEUR==null||b.taxEUR==null||units(b.feeEUR)!==0n||units(b.taxEUR)!==0n)throw Error('Gebühren oder Abzüge unbekannt oder nicht separat belegt. Zuerst prüfen.');
 const entry=model.journalEntries?.find(e=>e.id===b.journalEntryId);
 if(!entry||entry.type!==b.type||entry.date!==b.date||entry.postings.length!==2)throw Error('Eindeutiger Journalbeleg fehlt.');
 validateJournalEntry(entry);
 const cash=entry.postings.find(x=>x.role==='cash'&&x.positionId===p.id),clearing=entry.postings.find(x=>x.role===(matched?'transfer-clearing':'external-clearing')&&x.positionId==null);
 const quantity=units(b.quantityExact??b.quantity),sign=b.type==='withdraw'?-1n:1n;
 if(quantity<=0n||!cash||!clearing||units(cash.quantityDeltaExact)!==quantity*sign||units(cash.amountBookEURExact)!==sign*units(b.amountExactEUR??b.amountEUR))throw Error('Buchung und Journalbetrag widersprechen sich.');
 const flows=matched?[b.transferMatch?.originalFlow]:(model.externalCashFlows||[]).filter(f=>f.id===b.id);
 if(flows.length!==1||!flows[0]||flows[0].id!==b.id||flows[0].date!==b.date||!Number.isFinite(flows[0].amountEUR)||Number(exact(units(flows[0].amountExactEUR??flows[0].amountEUR)))!==flows[0].amountEUR||units(flows[0].amountExactEUR??flows[0].amountEUR)!==units(cash.amountBookEURExact))throw Error('Passender externer Geldfluss fehlt oder widerspricht dem Beleg.');
 return {booking:b,position:p,entry,clearing,quantity,flow:flows[0]};
}
export function previewTransferMatch(model,outgoingId,incomingIds){
 if(Array.isArray(incomingIds))incomingIds=[...incomingIds].sort();
 const reasons=[];let out=null,ins=[];
 try{
  if(!Array.isArray(incomingIds)||incomingIds.length<1||incomingIds.length>12||new Set(incomingIds).size!==incomingIds.length||incomingIds.includes(outgoingId))throw Error('Einen Ausgang und bis zu zwölf unterschiedliche Eingänge auswählen.');
  out=transferEvidence(model,model.bookings.find(b=>b.id===outgoingId));
  if(out.booking.type!=='withdraw')throw Error('Ausgang muss eine Auszahlung sein.');
  ins=incomingIds.map(id=>transferEvidence(model,model.bookings.find(b=>b.id===id)));
  for(const x of ins){
   if(x.booking.type!=='deposit'||x.position.accountId===out.position.accountId)throw Error('Eingang muss auf einem anderen eigenen Konto liegen.');
   if(x.position.currency!==out.position.currency)throw Error('Währungswechsel benötigt zusätzliche FX-Belege; keine automatische Zuordnung.');
   if(Math.abs(Date.parse(x.booking.date)-Date.parse(out.booking.date))>7*864e5)throw Error('Buchungsdaten liegen mehr als sieben Tage auseinander. Valuta/Belege separat prüfen.');
  }
  if(ins.reduce((n,x)=>n+x.quantity,0n)!==out.quantity)throw Error('Gesamtmenge stimmt nicht überein. Fehlenden Teilbetrag oder Gebühren prüfen.');
  if(!ledgerQuantityAudit(model).ok)throw Error('Journal und Bestände widersprechen sich.');
 }catch(e){reasons.push(e.message);}
 const selected=[out,...ins].filter(Boolean);
 const fingerprint=sourceDigest(JSON.stringify(selected.map(x=>[bookingOwnership(model,x.booking),x.position.accountId,x.position.currency,x.flow])));
 return {ready:reasons.length===0,reasons,fingerprint,outgoingId,incomingIds:Array.isArray(incomingIds)?[...incomingIds]:[],currency:out?.position.currency??null,
  quantityExact:out?exact(out.quantity):null,incomingQuantityExact:ins.length?exact(ins.reduce((n,x)=>n+x.quantity,0n)):null};
}
export function confirmTransferMatch(model,{outgoingId,incomingIds,reference,confirmed,fingerprint}){
 if(Array.isArray(incomingIds))incomingIds=[...incomingIds].sort();
 const ref=words(reference,180);if(!confirmed||!ref)throw Error('Belegreferenz und ausdrückliche Bestätigung beider eigenen Konten fehlen.');
 const existing=model.bookings.find(b=>b.id===outgoingId)?.transferMatch;
 if(existing&&existing.reference===ref&&JSON.stringify([...existing.incomingIds].sort())===JSON.stringify(incomingIds)){validateTransferMatches(model);return {changed:false,id:existing.id};}
 const preview=previewTransferMatch(model,outgoingId,incomingIds);
 if(!preview.ready)throw Error(preview.reasons.join(' '));
 if(preview.fingerprint!==fingerprint)throw Error('Bewegungen seit der Vorschau geändert. Neu prüfen.');
 const draft=structuredClone(model),ids=[outgoingId,...incomingIds],matchId='tm-'+sourceDigest(JSON.stringify([outgoingId,incomingIds,ref]));
 for(const bid of ids){
  const b=draft.bookings.find(b=>b.id===bid),e=transferEvidence(draft,b);
  b.transferMatch={version:1,id:matchId,outgoingId,incomingIds:[...incomingIds],reference:ref,confirmedAt:new Date().toISOString(),originalFlow:{id:e.flow.id,date:e.flow.date,amountEUR:e.flow.amountEUR,amountExactEUR:e.flow.amountExactEUR??exact(units(e.flow.amountEUR))},originalFlowIndex:draft.externalCashFlows.findIndex(f=>f.id===bid),originalStatus:e.entry.status,originalOwnership:b.importSource?.ownership??null};
  e.clearing.role='transfer-clearing';e.entry.status='matched-internal-transfer';b.external=false;
  if(b.importSource)b.importSource.ownership='manual'; // preserve source identity and protect explicit user decision on reimport
  b.transferMatch.matchedOwnership=bookingOwnership(draft,b);
 }
 draft.externalCashFlows=draft.externalCashFlows.filter(f=>!ids.includes(f.id));
 validateTransferMatches(draft);Object.assign(model,draft);return {changed:true,id:matchId};
}
export function validateTransferMatches(model){
 const linked=new Set();
 for(const b of model.bookings||[]){
  const t=b.transferMatch;if(t==null)continue;
  if(!t||t.version!==1||typeof t.id!=='string'||t.id.length>100||!/^tm-[a-f0-9]{64}$/.test(t.id)||typeof t.reference!=='string'||!t.reference.trim()||t.reference.length>180||typeof t.confirmedAt!=='string'||!Number.isFinite(Date.parse(t.confirmedAt))||!Array.isArray(t.incomingIds)||t.incomingIds.length<1||t.incomingIds.length>12||new Set(t.incomingIds).size!==t.incomingIds.length||t.incomingIds.includes(t.outgoingId)||typeof t.matchedOwnership!=='string'||t.matchedOwnership.length>20000||!['imported','manual',null].includes(t.originalOwnership)||typeof t.originalStatus!=='string'||t.originalStatus.length>120)throw Error('Transferzuordnung im Backup ungültig.');
  const ids=[t.outgoingId,...t.incomingIds];if(!ids.includes(b.id)||!Number.isInteger(t.originalFlowIndex)||t.originalFlowIndex<0||t.originalFlowIndex>25000)throw Error('Transferzuordnung referenziert falsche Bewegung.');
  if((b.importSource?!['imported','manual'].includes(t.originalOwnership):t.originalOwnership!==null)||!t.originalStatus||t.originalStatus==='matched-internal-transfer')throw Error('Ursprüngliche Transferherkunft oder Journalstatus ungültig.');
  const evidence=transferEvidence(model,b,true);linked.add(evidence.entry.id);
  if(b.external!==false||evidence.entry.status!=='matched-internal-transfer'||model.externalCashFlows.some(f=>f.id===b.id))throw Error('Transferzuordnung widerspricht externer Geldfluss-Klassifikation.');
  for(const bid of ids){const other=model.bookings.find(x=>x.id===bid),o=other?.transferMatch;
   if(!o||o.id!==t.id||o.outgoingId!==t.outgoingId||JSON.stringify(o.incomingIds)!==JSON.stringify(t.incomingIds)||o.reference!==t.reference)throw Error('Transfergegenbuchung fehlt oder widerspricht der Zuordnung.');
   if((bid===t.outgoingId?'withdraw':'deposit')!==other.type)throw Error('Transfer-Richtung widersprüchlich.');
  }
  const out=transferEvidence(model,model.bookings.find(x=>x.id===t.outgoingId),true),ins=t.incomingIds.map(id=>transferEvidence(model,model.bookings.find(x=>x.id===id),true));
  if(ins.reduce((n,x)=>n+x.quantity,0n)!==out.quantity||ins.some(x=>x.position.accountId===out.position.accountId||x.position.currency!==out.position.currency||Math.abs(Date.parse(x.booking.date)-Date.parse(out.booking.date))>7*864e5))throw Error('Transferkonten, Beträge oder Zeitraum widersprüchlich.');
 }
 for(const e of model.journalEntries||[])if(e.status==='matched-internal-transfer'&&!linked.has(e.id))throw Error('Transferjournal ohne vollständige Zuordnung.');
 return model;
}
export function undoTransferMatch(model,matchId){
 validateTransferMatches(model);const selected=model.bookings.filter(b=>b.transferMatch?.id===matchId);if(!selected.length)return {changed:false};
 for(const b of selected)if(bookingOwnership(model,b)!==b.transferMatch.matchedOwnership)throw Error('Zugeordnete Bewegung nachträglich geändert. Aufheben zuerst fachlich prüfen.');
 const draft=structuredClone(model);
 for(const original of selected.sort((a,b)=>a.transferMatch.originalFlowIndex-b.transferMatch.originalFlowIndex)){const b=draft.bookings.find(x=>x.id===original.id),t=b.transferMatch,e=transferEvidence(draft,b,true);
  draft.externalCashFlows.splice(t.originalFlowIndex,0,structuredClone(t.originalFlow));e.clearing.role='external-clearing';e.entry.status=t.originalStatus;b.external=true;
  if(b.importSource)b.importSource.ownership=t.originalOwnership;delete b.transferMatch;
 }
 if(!ledgerQuantityAudit(draft).ok)throw Error('Journal und Bestände widersprechen sich.');
 Object.assign(model,draft);return {changed:true};
}
/** A snapshot taken while cash is in transit cannot prove portfolio returns. */
export function transferValuationIssue(model,snapshots=[]){
 try{validateTransferMatches(model);}catch{return 'Interne Transferzuordnung unvollständig oder widersprüchlich';}
 const groups=new Map();for(const b of model.bookings||[])if(b.transferMatch){const dates=groups.get(b.transferMatch.id)||[];dates.push(b.date);groups.set(b.transferMatch.id,dates);}
 for(const dates of groups.values()){dates.sort();if(snapshots.some(s=>s.date>=dates[0]&&s.date<dates.at(-1)))return 'Interner Transfer am Bewertungsstichtag noch nicht abgeschlossen';}
 return null;
}
