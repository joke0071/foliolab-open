/** Ledger native CSV observations only. No booking, balance, history or persistence API. */
import {parseCSV} from './csv-import.js';
import {units,exact} from './decimal.js';
import {sourceDigest} from './import-identity.js';
import {walletStreamMatches,positionWalletSession} from './historical-position-value.js';
import {previewPurchaseEvidence} from './purchase-evidence.js';
export const LEDGER_LIVE_HEADERS=Object.freeze(['Operation Date','Status','Currency Ticker','Operation Type','Operation Amount','Operation Fees','Operation Hash','Account Name','Account xpub','Countervalue Ticker','Countervalue at Operation Date','Countervalue at CSV Export']);
const types={IN:'Zugang: Herkunft und Gegenkonto prüfen.',OUT:'Abgang: Gegenkonto und Gebührenabgrenzung prüfen.',FEES:'Gebühren: Eigentum und bereits enthaltene Gebühren prüfen.',DELEGATE:'Delegation: kein nachgewiesener externer Abfluss.',UNDELEGATE:'Unbonding: Zustand und Verfügbarkeit prüfen.',WITHDRAW_UNBONDED:'Unbonding-Auszahlung: bereits erfassten Bestand prüfen.'};
const text=(value,max=300)=>{if(typeof value!=='string'||value.length>max||/[\u0000-\u001f]/.test(value))throw Error('Ungültiger Ledger-Textwert.');return value;};
const number=value=>{if(value==='')return null;if(!/^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value))throw Error('Unbelegtes Zahlenformat.');return exact(units(value));};
const utc=value=>{if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value.replace(/Z$/,value.includes('.')?'Z':'.000Z'))throw Error('Ungültiger UTC-Zeitpunkt.');return new Date(value).toISOString();};
/** Recognizable incomplete native files are quarantined too, never routed to generic trade mapping. */
export function looksLikeLedgerLiveCSV(parsed){return ['Operation Date','Operation Type','Operation Hash','Account xpub','Countervalue at CSV Export'].filter(h=>parsed?.headers?.includes(h)).length>=2;}
export function parseLedgerLiveCSV(input){
 const parsed=parseCSV(input);
 if(parsed.headers.length!==LEDGER_LIVE_HEADERS.length||LEDGER_LIVE_HEADERS.some(h=>!parsed.headers.includes(h)))throw Error('Ledger Live: das belegte native 12-Spalten-Format wird benötigt. Fehlende oder zusätzliche Spalten zuerst prüfen.');
 const operations=parsed.rows.map((row,index)=>{
  const issues=[];
  const read=(fn,label)=>{try{return fn();}catch{issues.push(label);return null;}};
  const timestamp=read(()=>utc(row['Operation Date']),'Zeitpunkt nicht als gültiges UTC belegt.');
  const status=read(()=>text(row.Status,40),'Status ungültig.'),type=read(()=>text(row['Operation Type'],60),'Operationstyp ungültig.');
  const currency=read(()=>text(row['Currency Ticker'],40),'Assetkennung ungültig.'),accountIdentity=read(()=>text(row['Account xpub'],300),'Kontoidentität ungültig.');
  const accountName=read(()=>text(row['Account Name'],200),'Kontoname ungültig.'),txid=read(()=>text(row['Operation Hash'],200),'Transaktionsreferenz ungültig.');
  const amountExact=read(()=>number(row['Operation Amount']),'Menge nicht exakt lesbar.'),feeExact=read(()=>number(row['Operation Fees']),'Gebühr nicht exakt lesbar.');
  const counterCurrency=read(()=>text(row['Countervalue Ticker'],40),'Gegenwertwährung ungültig.');
  const counterAtOperation=read(()=>number(row['Countervalue at Operation Date']),'Marktgegenwert am Vorgangstag nicht lesbar.');
  const counterAtExport=read(()=>number(row['Countervalue at CSV Export']),'Marktgegenwert am Exporttag nicht lesbar.');
  if(!accountIdentity)issues.push('Kontoidentität fehlt; Kontoname allein genügt nicht.');
  if(!currency)issues.push('Assetkennung fehlt.');if(!txid)issues.push('Transaktionsreferenz fehlt.');
  if(amountExact===null)issues.push('Keine belegte Menge.');
  if(amountExact!==null&&units(amountExact)<0n)issues.push('Betragsvorzeichen nicht wirtschaftlich auflösen.');
  if(feeExact!==null&&units(feeExact)<0n)issues.push('Gebührenvorzeichen ungeklärt.');
  if(!['Confirmed','Failed'].includes(status))issues.push('Unbekannter Status.');
  if(!Object.hasOwn(types,type))issues.push('Unbekannter Operationstyp; keine Buchungsannahme.');
  if(status==='Failed')issues.push('Fehlgeschlagen: keine erfolgreiche Mengenbewegung ableiten; Gebühren separat belegen.');
  const accountRef=sourceDigest(JSON.stringify(accountIdentity||['missing',accountName]));
  const scopeId=sourceDigest(JSON.stringify([accountRef,currency]));
  // A stable documentary observation, NOT an on-chain event ID/locator or import consent.
  // Export-time market observations and mutable account names never define identity.
  const observationId=sourceDigest(JSON.stringify([accountRef,currency,timestamp,status,type,txid,amountExact,feeExact]));
  return {line:index+2,observationId,scopeId,accountRef,accountIdentity,accountName,currency,timestamp,status,type,txid,amountExact,feeExact,counterCurrency,counterAtOperation,counterAtExport,issues,meaning:Object.hasOwn(types,type)?types[type]:'Wirtschaftliche Bedeutung ungeklärt.'};
 });
 const counts=new Map();for(const row of operations)counts.set(row.observationId,(counts.get(row.observationId)||0)+1);
 for(const row of operations)if(counts.get(row.observationId)>1)row.issues.push('Identische Exportzeilen: ohne nativen Ereignis-Locator nicht eindeutig unterscheidbar.');
 const scopes=[...new Map(operations.map(row=>[row.scopeId,{id:row.scopeId,accountRef:row.accountRef,accountIdentity:row.accountIdentity,accountName:row.accountName,currency:row.currency}])).values()];
 return {kind:'ledger-live-observations',version:1,writeEnabled:false,operations,scopes};
}
function transactionKey(txid,chain){return ['btc','btc-hd','evm','erc20'].includes(chain)?txid?.toLowerCase():txid;}
/** Explicit mapping is local preview state. A same hash is only a reference, never an economic event match. */
export function previewLedgerLive(model,document,assignments={}){
 if(document?.kind!=='ledger-live-observations'||document.version!==1||document.writeEnabled!==false||!Array.isArray(document.operations)||document.operations.length>5000||!Array.isArray(document.scopes)||document.scopes.length>100)throw Error('Ungültige Ledger-Vorschau.');
 if(!Array.isArray(model?.positions)||!assignments||typeof assignments!=='object'||Array.isArray(assignments))throw Error('Walletzuordnung nicht prüfbar.');
 const scopes=new Map(document.scopes.map(s=>[s.id,s]));
 if(Object.keys(assignments).some(id=>!scopes.has(id)))throw Error('Ledger-Zuordnung ist veraltet.');
 const mapped=new Map(),referenceCache=new Map();
 for(const scope of document.scopes){
  const positionId=assignments[scope.id]||'',matches=model.positions.filter(p=>p.id===positionId);
  if(positionId&&(matches.length!==1||!matches[0].wallet?.enabled))throw Error('Zugeordnete Wallet nicht mehr eindeutig vorhanden.');
  const position=matches[0]||null,session=position?positionWalletSession(model,position):null;
  const currentSession=session?.walletKey===position?.id?session:null;
  const issues=[];
  if(!position)issues.push('Wallet, Netzwerk und Asset ausdrücklich zuordnen.');
  else{
   const w=position.wallet,fold=['evm','erc20'].includes(w.chain),source=scope.accountIdentity;
   if(!source||(fold?source.toLowerCase()!==w.address.toLowerCase():source!==w.address))issues.push('Exportidentität und hinterlegte Wallet stimmen nicht exakt überein; Eigentumsbezug ungeklärt.');
   if(['erc20','spl','xrp-token'].includes(w.chain))issues.push('Ticker allein belegt keine Token-/Contract-Identität.');
   if(!currentSession)issues.push('Keine eindeutig dieser Wallet zugeordnete übernommene Historie.');
  }
  const proof=new Map();
  if(position&&['btc','btc-hd'].includes(position.wallet.chain)&&scope.currency==='BTC'&&currentSession){
   const receipts=model.purchaseEvidence?.receipts||[];
   if(receipts.length>1000||currentSession.events.length>10000)issues.push('Kaufbelegabgleich zu groß; vorhandene Kaufbelegansicht verwenden.');
   else for(const group of previewPurchaseEvidence(model,[],currentSession,position.accountId))proof.set(transactionKey(group.txid,position.wallet.chain),{status:group.status,receiptCount:group.receipts.length,netBTC:group.netBTC,fiatEUR:group.fiatEUR});
  }
  if(position&&currentSession&&!referenceCache.has(position.id)){
   const references=new Map();for(const e of currentSession.events||[])if(walletStreamMatches(e,position)){const key=transactionKey(e.txid,position.wallet.chain);if(!references.has(key))references.set(key,[]);references.get(key).push({id:e.id,type:e.type,status:e.status,quantityBaseUnits:e.quantityBaseUnits});}
   referenceCache.set(position.id,references);
  }
  mapped.set(scope.id,{position,session:currentSession,issues,proof});
 }
 const operations=document.operations.map(row=>{
  const map=mapped.get(row.scopeId);if(!map)throw Error('Ledger-Kontobezug fehlt.');
  const position=map.position,key=transactionKey(row.txid,position?.wallet.chain);
  const references=position&&map.session?referenceCache.get(position.id)?.get(key)||[]:[];
  return {...row,positionId:position?.id||null,network:position?.wallet.chain||null,chainId:position?.wallet.chainId??null,issues:[...row.issues,...map.issues],walletReferences:references,purchaseEvidence:row.type==='IN'&&row.status==='Confirmed'?map.proof.get(key)||null:null};
 });
 return {kind:'ledger-live-preview',writeEnabled:false,ready:false,operations,scopes:document.scopes,assignments:{...assignments},reason:'Nur lokale Vorschau. Keine Buchungen, Bestände, Cashflows, Einstandswerte oder Historien werden übernommen. Gebühren, Gegenbuchungen und native Ereignis-Locators sind zuerst beleggebunden abzugleichen.'};
}
