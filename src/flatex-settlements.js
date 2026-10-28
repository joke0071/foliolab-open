import {units} from './decimal.js';

/**
 * Read-only cash-settlement matching. This function never posts cash,
 * attributes fees, or assumes an unmatched bank movement is an external flow.
 *
 * A match is only a plausible correspondence, not proof of net settlement or
 * a permission to change the journal. Uniqueness is enforced on both sides.
 */
export function pairFlatexSettlements(prepared,{maxDays=7}={}){
 if(!Number.isInteger(maxDays)||maxDays<0||maxDays>30)throw Error('Ungültiger Zeitraum für den Abrechnungsabgleich.');
 const trades=(prepared?.sourceTrades||[]).filter(x=>['buy','sell'].includes(x.type));
 const cash=(prepared?.cashItems||[]).filter(x=>x.kind==='settlement');
 const day=s=>Date.parse(String(s)+'T12:00:00Z');
 const dayGap=(a,b)=>Math.abs(day(a)-day(b))/86400000;
 const candidates=trades.map((trade,i)=>{
  const matches=[];
  for(let j=0;j<cash.length;j++){
   const movement=cash[j];
   if(!(dayGap(trade.date,movement.date)<=maxDays))continue;
   const amount=Number(movement.amount);
   if(!Number.isFinite(amount)||amount===0)continue;
   if(trade.type==='buy'&&amount>=0||trade.type==='sell'&&amount<=0)continue;
   const reportedIsins=String(movement.details||'').toUpperCase().match(/\b[A-Z]{2}[A-Z0-9]{10}\b/g)||[];
   // Matching references do NOT override an explicit conflicting security ID.
   if(reportedIsins.length&&!reportedIsins.includes(String(trade.isin||'').toUpperCase()))continue;
   const reference=Boolean(trade.reference&&movement.reference&&
    trade.reference.trim()===movement.reference.trim());
   const isin=Boolean(trade.isin&&reportedIsins.includes(trade.isin.toUpperCase()));
   if(!reference&&!isin)continue;
   matches.push({cashIndex:j,evidence:reference&&isin?'Referenz und ISIN':reference?'Transaktionsreferenz':'ISIN im Buchungstext',reference});
  }
  // If a real booking reference agrees, it takes precedence over coincidental
  // ISIN mentions in other account movements. Never invent a best guess.
  const referenced=matches.filter(m=>m.reference);
  return {tradeIndex:i,matches:referenced.length?referenced:matches};
 });
 const incomingCounts=new Map();
 for(const x of candidates)for(const m of x.matches)incomingCounts.set(m.cashIndex,(incomingCounts.get(m.cashIndex)||0)+1);
 const paired=[],uncertain=[],unmatched=[];
 const used=new Set();
 for(const x of candidates){
  const trade=trades[x.tradeIndex];
  const sole=x.matches.length===1?x.matches[0]:null;
  if(sole&&incomingCounts.get(sole.cashIndex)===1){
   used.add(sole.cashIndex);
   paired.push({trade,accountMovement:cash[sole.cashIndex],evidence:sole.evidence,status:'possible'});
  }else if(x.matches.length){
   uncertain.push({trade,candidates:x.matches.length,reason:'Mehrere mögliche Zuordnungen'});
  }else unmatched.push(trade);
 }
 return {paired,uncertain,unmatched,unmatchedCash:cash.filter((x,i)=>!used.has(i)),
  otherCash:(prepared?.cashItems||[]).filter(x=>x.kind!=='settlement'),
  note:'Eine Zuordnung zeigt nur mögliche zusammengehörige Belege. Abgerechnete Gebühren, Steuern und Cashkontobewegungen werden damit nicht automatisch gebucht.'};
}

/** Native documentary order groups. Not a settlement allocation or import API. */
export function inspectNativeFlatexOrderLinks(documents,{maxDays=7}={}){
 // Reuse the unchanged legacy horizon contract, including invalid-option checks.
 pairFlatexSettlements({sourceTrades:[],cashItems:[]},{maxDays});
 if(!Array.isArray(documents)||!documents.length||documents.length>20||documents.some(d=>d?.kind!=='flatex-native-document-preview'||d.version!==1||!Object.isFrozen(d)||d.ready!==false||d.writeEnabled!==false||!['depot','account'].includes(d.type)||!Array.isArray(d.rows)))throw Error('Native Flatex-Quelldokumente fehlen oder sind ungeprüft.');
 const total=documents.reduce((n,d)=>n+d.rows.length,0);
 if(!total||total>5000)throw Error('Flatex-Orderprüfung benötigt 1 bis maximal 5.000 Quellzeilen.');
 const known=v=>typeof v==='string'&&v.trim()!==''&&v.trim()!=='-'&&v.length<=200&&!/[\u0000-\u001f\u007f-\u009f]/.test(v);
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\d$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
 const entries=[],bankIds=new Map(),orders=new Map();
 for(const [sourceIndex,doc]of documents.entries()){
  const lines=new Set();
  for(const row of doc.rows){
   if(!Number.isSafeInteger(row?.line)||row.line<2||lines.has(row.line)||!Object.isFrozen(row)||!Object.isFrozen(row.values)||!Object.isFrozen(row.numbers)||!Object.isFrozen(row.dates)||typeof row.kind!=='string'||typeof row.values.details!=='string'||typeof row.values.transactionReference!=='string')throw Error('Native Flatex-Quellzeile nicht eindeutig prüfbar.');
   lines.add(row.line);
   const v=row.values,scope=doc.type==='depot'?v.depot:v.account,ref=v.transactionReference,order=row.order;
   if(typeof scope!=='string'||(order!==null&&(!order||!['buy','sell'].includes(order.type)||!/^\d+$/.test(order.reference)||!/^[A-Z]{2}[A-Z0-9]{10}$/.test(order.isin))))throw Error('Native Flatex-Quellreferenzen nicht prüfbar.');
   const locator={sourceIndex,line:row.line,sourceType:doc.type,sourceScope:scope,bankReference:ref,orderReference:order?.reference??null,kind:row.kind};
   const e={doc,row,scope,ref,order,locator,reasons:[],overlap:false,conflict:false};entries.push(e);
   if(known(scope)&&known(ref)){
    const key=JSON.stringify([doc.type,scope,ref]),list=bankIds.get(key)||[];
    // Export row numbers are provenance, never an economic change or identity.
    e.payload=JSON.stringify(Object.entries(v).filter(([key])=>key!=='number'));
    list.push(e);bankIds.set(key,list);
   }
   if(order){const list=orders.get(order.reference)||[];list.push(e);orders.set(order.reference,list);}
  }
 }
 for(const list of bankIds.values())if(list.length>1){const conflict=new Set(list.map(e=>e.payload)).size>1;for(const e of list){e.conflict=conflict;e.overlap=!conflict;}}
 for(const e of entries){
  if(!e.order)continue;
  const {row:r,doc,order:o}=e,v=r.values,n=r.numbers;
  if(!known(e.scope))e.reasons.push('Quellkontext fehlt; Eigentum nicht bestätigt.');
  if(!known(e.ref))e.reasons.push('Bank-Transaktionsreferenz fehlt oder ist ungeklärt.');
  if(o.reference.length>200)e.reasons.push('Orderreferenz überschreitet die sichere Referenzgrenze.');
  if(!validDate(r.dates.bookingDate)||!validDate(r.dates.valueDate))e.reasons.push('Buchtag oder Valuta ungeklärt.');
  const isins=v.details.toUpperCase().match(/\b[A-Z]{2}[A-Z0-9]{10}\b/g)||[];
  if((v.details.match(/\bORDER\b/gi)||[]).length!==1)e.reasons.push('Mehrere oder ungeklärte ORDER-Angaben in einer Quellzeile.');
  if(!isins.length||isins.some(isin=>isin!==o.isin)||(doc.type==='depot'&&v.isin?.toUpperCase()!==o.isin))e.reasons.push('Widersprüchliche oder fehlende Quell-ISIN.');
  if(!['order-buy','order-sell'].includes(r.kind)||r.kind!==(o.type==='buy'?'order-buy':'order-sell'))e.reasons.push('Kein freigegebenes unstorniertes ORDER-Quellereignis.');
  e.currency=doc.type==='depot'?v.priceCurrency:v.amountCurrency;
  if(!/^[A-Z]{3}$/.test(e.currency||''))e.reasons.push('Deklarierte Quellwährung ungeklärt.');
  try{
   if(doc.type==='depot'){
    if(n.nominal===null||n.rate===null||units(n.nominal)===0n||units(n.rate)<=0n||!known(v.unit))throw Error();
   }else{
    if(n.amount===null)throw Error();const amount=units(n.amount);
    if(amount===0n||(o.type==='buy'?amount>=0n:amount<=0n))throw Error();
   }
  }catch{e.reasons.push('Exakte Quellzahl, Einheit oder Geldrichtung ungeklärt.');}
 }
 const groups=[];
 for(const [orderReference,list]of orders){
  const depot=list.filter(e=>e.doc.type==='depot'),cash=list.filter(e=>e.doc.type==='account');
  const isins=new Set(list.map(e=>e.order.isin)),types=new Set(list.map(e=>e.order.type));
  const reasons=[...new Set(list.flatMap(e=>e.reasons))];let status;
  if(isins.size!==1||types.size!==1||list.some(e=>e.conflict)){status='conflict';reasons.unshift('Dieselbe Referenz enthält widersprüchliche Quellangaben.');}
  else if(list.some(e=>/storno|cancellation/i.test(e.row.kind+' '+e.row.values.details))){status='cancelled-review';reasons.unshift('Storno in der Ordergruppe; keine automatische Rücknahme oder Teilzuordnung.');}
  else if(list.some(e=>e.overlap)){status='overlap-review';reasons.unshift('Wiederholte Bankreferenz: alle Exportvorkommen bleiben erhalten.');}
  else if(reasons.length)status='source-review';
  else if(new Set(depot.map(e=>e.scope)).size>1||new Set(cash.map(e=>e.scope)).size>1){status='scope-review';reasons.push('Mehrere Depot-/Kontoquellkontexte in derselben Ordergruppe.');}
  else if(!depot.length){status='missing-depot';reasons.push('Depotgegenbeleg fehlt.');}
  else if(!cash.length){status='missing-cash';reasons.push('Kontogegenbeleg fehlt.');}
  else if(new Set(list.map(e=>e.currency)).size!==1){status='source-review';reasons.push('Unterschiedliche Quellwährungen; keine Umrechnung.');}
  else{
   const within=key=>{const days=list.map(e=>Date.parse(e.row.dates[key]+'T12:00:00Z'));return Math.max(...days)-Math.min(...days)<=maxDays*86400000;};
   if(!within('bookingDate')||!within('valueDate')){status='source-review';reasons.push('Buchtag oder Valuta außerhalb des begrenzten Abgleichzeitraums.');}
   else if(depot.length>1){status='multiple-depot-review';reasons.push('Mehrere Depotausführungen, keine Verteilung auf Cashbeine.');}
   else if(cash.length>1){status='multiple-cash-review';reasons.push('Mehrere getrennte Cashbeine; keine Summierung oder Gebühren-/Steueraufteilung.');}
   else{
    const t=depot[0],c=cash[0];
    const legacy=pairFlatexSettlements({sourceTrades:[{reference:orderReference,date:t.row.dates.bookingDate,isin:t.order.isin,type:t.order.type}],cashItems:[{reference:orderReference,date:c.row.dates.bookingDate,amount:c.row.numbers.amount,kind:'settlement',details:c.row.values.details}]},{maxDays});
    status=legacy.paired.length===1?'possible-single':'source-review';
    reasons.push(status==='possible-single'?'Mögliche dokumentlokale Orderkorrespondenz, keine bestätigte Abrechnung oder Kontoeigentümerschaft.':'Bestehender 1:1-Abgleich bestätigt keine mögliche Korrespondenz.');
   }
  }
  groups.push({orderReference,isin:isins.size===1?[...isins][0]:null,type:types.size===1?[...types][0]:null,status,reasons,depot:depot.map(e=>e.locator),cash:cash.map(e=>e.locator)});
 }
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
 return freeze({kind:'flatex-native-order-links',version:1,ready:false,writeEnabled:false,rows:entries.map(e=>e.locator),groups,unassigned:entries.filter(e=>!e.order).map(e=>e.locator),
  note:'Dokumentlokale Quellenbeziehungen ohne Buchung, Deduplizierung, Gegenbeinerfindung, Geldsummen oder bestätigte Historien-/Bestands-/Cashflowaussage.'});
}
