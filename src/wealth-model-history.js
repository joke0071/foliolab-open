import {exact,units} from './decimal.js';
import {valueSign} from './defi.js';
import {historicalEURValue,historicalPositionMarket,walletStreamMatches} from './historical-position-value.js';
import {validCalendarDate} from './transactions.js';
import {duplicateWalletHoldings,walletHoldingKey} from './wallet-identity.js';

const incompatibleActions=new Set(['split','swap','merger','ticker_change','isin_change','delist']);
const maxPositionsByDay=2000000;

function compatibleAfter(model){
 const dates=new Map();
 const mark=(id,date)=>{
  if(!id)return;
  if(!validCalendarDate(date))throw Error('Datum einer Kapitalmaßnahme fehlt.');
  if(date>(dates.get(id)??''))dates.set(id,date);
 };
 for(const item of model.bookings??[]){
  if(!incompatibleActions.has(item.type))continue;
  mark(item.positionId,item.date);
  mark(item.targetPositionId,item.date);
 }
 for(const item of model.journalEntries??[]){
  if(!incompatibleActions.has(item.type))continue;
  for(const posting of item.postings)mark(posting.positionId,item.date);
 }
 return dates;
}

function currentHoldings(model){
 const positions=model.positions.filter(p=>units(p.quantityExact??p.quantity)>0n);
 const byId=new Map(positions.map(p=>[p.id,p]));
 const included=positions.filter(p=>valueSign(p)!==0);
 if(duplicateWalletHoldings({positions:included}).length)throw Error('Überlappende Wallet-Bestände zuerst zuordnen.');
 for(const position of positions){
  if(valueSign(position)!==0)continue;
  const target=byId.get(position.representedByPositionId),key=walletHoldingKey(position.wallet);
  if(!key||!target||valueSign(target)!==1||key!==walletHoldingKey(target.wallet)||units(position.quantityExact??position.quantity)!==units(target.quantityExact??target.quantity)){
   throw Error('Die wirtschaftliche Zuordnung eines ausgeschlossenen Bestands ist offen.');
  }
 }
 return included;
}

/** Constant current holdings over local price evidence. Has no storage or network access. */
export function modeledWealthSeries(model){
 try{
  const positions=currentHoldings(model);
  if(!positions.length)return {samples:[],reason:'Für den Modellverlauf fehlt ein eindeutig zugeordneter heutiger Bestand.'};
  const cutoff=compatibleAfter(model),strictDaily=positions.every(p=>p.kind==='crypto'||p.kind==='cash');
  const calendar=new Set(),fxByCurrency=new Map(),markets=[];
  for(const p of positions){
   const market=historicalPositionMarket(model,p);
   if(market.session&&!model.priceHistories?.[p.id]){
    const sources=new Set(market.session.quotes.filter(q=>walletStreamMatches({...q,accountId:p.accountId},p)).map(q=>q.source));
    if(sources.size>1)throw Error('Für eine Walletposition sind mehrere Kursquellen vermischt.');
   }
   for(const date of market.quotes.keys())calendar.add(date);
   if(market.fx.size){
    const known=fxByCurrency.get(p.currency)??new Map();
    for(const [date,rate] of market.fx){
     const reference=market.fxDates.get(date);
     const previous=known.get(date);
     const value={rate,reference};
     known.set(date,previous===undefined||previous?.rate===rate&&previous.reference===reference?value:null);
    }
    fxByCurrency.set(p.currency,known);
   }
   markets.push({position:p,market,quantity:exact(units(p.quantityExact??p.quantity)),sign:BigInt(valueSign(p))});
  }
  if(positions.every(p=>p.kind==='cash'))for(const fx of fxByCurrency.values())for(const date of fx.keys())calendar.add(date);
  if(calendar.size*positions.length>maxPositionsByDay)throw Error('Zu viele Kombinationen aus Position und Modelltagen für eine direkte Übersicht.');
  const dates=[...calendar].sort(),samples=[],reasons=new Set();
  let interrupted=false,previousDate=null;
  for(const date of dates){
   let sum=0n,complete=true;
   for(const {position:p,market,quantity,sign} of markets){
    const price=p.kind==='cash'?'1':market.quotes.get(date)??null;
    const sharedFX=fxByCurrency.get(p.currency)?.get(date);
    const fx=market.valuationCurrency==='EUR'?'1':p.kind==='cash'?sharedFX?.rate??null:sharedFX===null?null:market.fx.get(date)??null;
    if(date<=(cutoff.get(p.id)??'')){
     reasons.add('Vor oder am Tag einer Kapitalmaßnahme fehlt eine vergleichbare Kursbasis.');
     complete=false;
    }else if(price===null||fx===null){
     reasons.add(price===null?'An einzelnen Tagen fehlt ein historischer Kurs.':'An einzelnen Tagen fehlt ein eindeutiger historischer EUR-Wechselkurs.');
     complete=false;
    }else sum+=units(historicalEURValue(quantity,price,fx))*sign;
   }
   if(!complete){interrupted=true;continue;}
   const gap=previousDate&&(Date.parse(date)-Date.parse(previousDate))/864e5>(strictDaily?1:4);
   samples.push({date,totalEURExact:exact(sum),breakBefore:samples.length>0&&Boolean(interrupted||gap),detail:'Modellwert · heutige Stückzahlen, belegte Tageskurse und Wechselkurse'});
   previousDate=date;
   interrupted=false;
  }
  const reason=[...reasons].join(' ');
  if(samples.length<2)return {samples:[],reason:reason||'Mindestens zwei vollständig bewertbare historische Tage sind erforderlich.'};
  return {samples,reason};
 }catch(error){return {samples:[],reason:error.message};}
}
