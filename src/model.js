import {rebuildAssets,listingId} from './assets.js';
import {validateEconomicPosition,valueSign} from './defi.js';
import {executeTransaction,captureOpenings,validateJournalEntry,ledgerQuantityAudit} from './transactions.js';
import {units,exact,preciseValue} from './decimal.js';
import {currentPositionValues} from './position-history.js';
import {validateImportedPriceHistory} from './historical-csv.js';
import {enhanceKnownReferenceListing} from './reference-listings.js';
import {normalizeLegacyCoinId} from './coin-identity.js';
import {validateNativeStakingAddress} from './native-staking-networks.js';
export const STORE_KEY='foliolab-open-v1';
export const TYPES={etf:'ETF',stock:'Aktie',fund:'Fonds',crypto:'Krypto',cash:'Guthaben',other:'Sonstiges'};
export const KINDS=Object.keys(TYPES);
export const defaultSettings=()=>({currency:'EUR',twelveKey:'',eodhdKey:'',fmpKey:'',securitySource:'auto',coinGeckoKey:'',etherscanKey:'',solanaRpc:'https://solana-rpc.publicnode.com',showSmall:true,autoRefresh:true,lastAccountId:'',publicInstrumentEndpoint:''});
export const blankModel=()=>({version:3,providers:[],accounts:[],assets:[],positions:[],bookings:[],journalEntries:[],openingPositions:[],externalCashFlows:[],snapshots:[],priceHistories:Object.create(null),performanceFlowTrackingSince:null,settings:defaultSettings()});
const cleanString=(s,max=120)=>String(s??'').trim().slice(0,max);
export const uid=()=>globalThis.crypto?.randomUUID?.()??`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function number(v){if(typeof v==='string')v=v.trim().replace(/\s/g,'').replace(',','.');const n=Number(v);return Number.isFinite(n)?n:NaN;}
export function safeNumber(v,min=0,max=1e18){const n=number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Bitte eine gültige Zahl zwischen ${min} und ${max} eingeben.`);return n;}
export function createProvider(v){const name=cleanString(v.name,80);if(!name)throw Error('Bitte einen Anbieternamen eingeben.');return {id:v.id||uid(),name,type:['broker','bank','wallet','other'].includes(v.type)?v.type:'other'};}

/** @typedef {'securities'|'checking'|'savings'|'exchange'|'wallet'|'other'} AccountType */
/** @typedef {{id:string,providerId:string,name:string,type:AccountType,currency:string}} Account */
/** Create a distinct custody/account record under a provider; providers can own many accounts. */
export function createAccount(v,model){
  if(!model.providers.some(p=>p.id===v.providerId))throw Error('Unbekannter Anbieter für dieses Konto.');
  const name=cleanString(v.name,100);if(!name)throw Error('Bitte einen Kontonamen eingeben.');
  const type=['securities','checking','savings','exchange','wallet','other'].includes(v.type)?v.type:'other';
  const currency=cleanString(v.currency||'EUR',3).toUpperCase();
  if(!/^[A-Z]{3}$/.test(currency))throw Error('Ungültige Kontowährung.');
  return {id:v.id||uid(),providerId:v.providerId,name,type,currency};
}
export const suggestedAccountType=kind=>({etf:'securities',stock:'securities',fund:'securities',crypto:'wallet',cash:'savings'})[kind]||'other';
function defaultAccount(model,providerId){
  const provider=model.providers.find(p=>p.id===providerId);
  if(!provider)throw Error('Unbekannter Anbieter.');
  const existing=model.accounts.find(a=>a.providerId===providerId);
  if(existing)return existing;
  const type={broker:'securities',bank:'savings',wallet:'wallet'}[provider.type]||'other';
  const account=createAccount({providerId,name:provider.type==='wallet'?'Wallet':provider.type==='bank'?'Guthabenkonto':provider.type==='broker'?'Depot':'Standardkonto',type},model);
  model.accounts.push(account);return account;
}
export function validateWallet(wallet){if(!wallet?.enabled)return null;const chain=cleanString(wallet.chain,20);const address=cleanString(wallet.address,180);const contract=cleanString(wallet.contract,120);const error='Ungültige öffentliche Wallet-Adresse. Keine privaten Schlüssel eingeben.';
  if(/\b(seed|mnemonic|xprv|yprv|zprv)\b/i.test(address)||/^(xprv|yprv|zprv)/i.test(address))throw Error(error);
  if(chain==='btc-hd'&&!/^(xpub|ypub|zpub)[1-9A-HJ-NP-Za-km-z]{90,120}$/.test(address))throw Error('Bitcoin-HD: bitte öffentlichen Account-xpub/ypub/zpub eingeben.');
  if(chain==='btc'&&!(/^(bc1[ac-hj-np-z02-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{24,47})$/.test(address)))throw Error(error);
  if((chain==='evm'||chain==='erc20')&&!/^0x[a-fA-F0-9]{40}$/.test(address))throw Error(error);
  if(chain==='erc20'&&!/^0x[a-fA-F0-9]{40}$/.test(contract))throw Error('Bitte eine ERC-20-Contract-Adresse angeben.');
  if(['sol','spl','sol-stake'].includes(chain)&&!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address))throw Error(error);
  if(['cosmos','cosmos-stake','cosmos-unbonding','hedera','near','near-locked'].includes(chain))validateNativeStakingAddress(chain.startsWith('cosmos')?'cosmos':chain.startsWith('near')?'near':'hedera',address);
  if(chain==='sonic-stake'&&!/^0x[0-9a-fA-F]{40}$/.test(address))throw Error(error);if(['xrp','xrp-token'].includes(chain)&&!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address))throw Error(error);
  if(chain==='xrp-token'&&!/^r[1-9A-HJ-NP-Za-km-z]{24,34}:(?:[A-Z0-9]{3}|[A-Fa-f0-9]{40})$/.test(contract))throw Error('Ungültiger XRP-Token-Identifier.');
  if(chain==='spl'&&!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract))throw Error('Bitte eine SPL-Mint-Adresse angeben.');
  if(chain==='sol-stake'&&!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract))throw Error('Ungültige Solana-Stake-Adresse.');
  if(['cosmos-stake','cosmos-unbonding'].includes(chain)&&!/^cosmosvaloper1[023456789acdefghjklmnpqrstuvwxyz]{20,80}$/.test(contract))throw Error('Ungültige Cosmos-Validator-ID.');
  if(chain==='sonic-stake'&&!/^[1-9]\d{0,5}$/.test(contract))throw Error('Ungültige Sonic-Validator-ID.');
  if(!['btc','btc-hd','evm','erc20','sol','spl','sol-stake','sonic-stake','cosmos','cosmos-stake','cosmos-unbonding','hedera','near','near-locked','xrp','xrp-token'].includes(chain))throw Error('Nicht unterstütztes Wallet-Netzwerk.');
  const decimals=(chain==='erc20'||chain==='spl'||chain==='xrp-token')?safeNumber(wallet.decimals??18,0,30):['btc','btc-hd'].includes(chain)?8:['sol','sol-stake'].includes(chain)?9:['cosmos','cosmos-stake','cosmos-unbonding','xrp'].includes(chain)?6:chain==='hedera'?8:['near','near-locked'].includes(chain)?24:18;
  const chainId=['evm','erc20'].includes(chain)?safeNumber(wallet.chainId??1,1,1e9):undefined;
  const addressType=chain==='btc-hd'?cleanString(wallet.addressType||'auto',25):undefined;
  if(chain==='btc-hd'&&!['auto','p2wpkh','p2sh-p2wpkh','p2pkh'].includes(addressType))throw Error('Unbekannter Bitcoin-HD-Adresstyp.');
  return {enabled:true,chain,address,contract,decimals,chainId,addressType};
}
export function createPosition(v,model){const name=cleanString(v.name,110);if(!name)throw Error('Bitte einen Positionsnamen eingeben.');if(!model.providers.some(x=>x.id===v.providerId))throw Error('Bitte einen gültigen Anbieter auswählen.');
  model.accounts??=[];const account=v.accountId?model.accounts.find(a=>a.id===v.accountId):defaultAccount(model,v.providerId);if(!account||account.providerId!==v.providerId)throw Error('Bitte ein Konto dieses Anbieters auswählen.');
  const mic=cleanString(v.mic,8).toUpperCase();
  if(mic&&!/^[A-Z0-9]{4}$/.test(mic))throw Error('Börsen-MIC muss aus vier Zeichen bestehen.');
  const kind=KINDS.includes(v.kind)?v.kind:'other';const quantityExact=exact(units(v.quantityExact??v.quantity??0));const quantity=safeNumber(quantityExact);const price=safeNumber(v.price??0);const currency=['EUR','USD','CHF','GBP','CAD','AUD','JPY','NOK','SEK','DKK','PLN','CZK','HUF','NZD','SGD'].includes(v.currency)?v.currency:'EUR';const fxRate=currency==='EUR'?1:safeNumber(v.fxRate??1,0.00000001,1000);
  const wallet=kind==='crypto'?validateWallet(v.wallet):null;const managementSource=wallet?.enabled?'wallet':v.managementSource==='transactions'?'transactions':'manual';
  const costBasisExact=v.costBasisExact==null?(v.costBasisEUR==null||v.costBasisEUR===''?null:exact(units(v.costBasisEUR))):exact(units(v.costBasisExact));
  const costBasisEUR=costBasisExact==null?null:safeNumber(costBasisExact);
  const realizedPnLExact=v.realizedPnLExact==null?(v.realizedPnLEUR==null?null:exact(units(v.realizedPnLEUR))):exact(units(v.realizedPnLExact));
  const realizedPnLEUR=realizedPnLExact==null?null:number(realizedPnLExact);
  if(realizedPnLEUR!=null&&!Number.isFinite(realizedPnLEUR))throw Error('Ungültiger realisierter Gewinn.');
  const priceExact=v.priceExact==null?exact(units(price)):exact(units(v.priceExact));
  const identity=normalizeLegacyCoinId({kind,name,symbol:v.symbol,coinId:v.coinId,coinIdMigration:v.coinIdMigration});
  return {id:v.id||uid(),providerId:v.providerId,accountId:account.id,managementSource,costBasisEUR,costBasisExact,realizedPnLEUR,realizedPnLExact,priceExact,priceStatus:cleanString(v.priceStatus,120)||null,fxUpdatedAt:cleanString(v.fxUpdatedAt,40)||null,assetId:cleanString(v.assetId,220)||null,kind,name,mic,listingId:cleanString(v.listingId,400)||null,
    economicRole:cleanString(v.economicRole,30)||'standard',valuationMode:cleanString(v.valuationMode,20)||'included',representedByPositionId:cleanString(v.representedByPositionId,120)||null,
    quoteSource:cleanString(v.quoteSource,70)||null,quoteAsOf:cleanString(v.quoteAsOf,45)||null,
    quoteFetchedAt:cleanString(v.quoteFetchedAt,45)||null,quoteQuality:cleanString(v.quoteQuality,45)||null,
    fxSource:cleanString(v.fxSource,70)||null,fxRateDate:cleanString(v.fxRateDate,20)||null,
    fxRateExact:v.fxRateExact==null?exact(units(fxRate)):exact(units(v.fxRateExact)),
    eodhdSymbol:cleanString(v.eodhdSymbol,45).toUpperCase(),fmpSymbol:cleanString(v.fmpSymbol,45).toUpperCase(),tradingViewSymbol:cleanString(v.tradingViewSymbol,48).toUpperCase(),
    exchange:cleanString(v.exchange,60),symbol:cleanString(v.symbol,32).toUpperCase(),isin:cleanString(v.isin,20).toUpperCase(),coinId:cleanString(identity.id,110),coinIdMigration:identity.migration,quantity,quantityExact,price,currency,fxRate,wallet,updatedAt:cleanString(v.updatedAt,40)||null,notes:cleanString(v.notes,300)};
}
export function grossValueEUR(p){return Number(preciseValue(p.quantityExact??p.quantity,p.priceExact??p.price,p.currency==='EUR'?'1':(p.fxRateExact??p.fxRate)));}
export function valueEUR(p){return grossValueEUR(p)*valueSign(p);}
export function totalExactEUR(model){return exact(model.positions.reduce((sum,p)=>sum+units(preciseValue(p.quantityExact??p.quantity,p.priceExact??p.price,p.currency==='EUR'?'1':(p.fxRateExact??p.fxRate)))*BigInt(valueSign(p)),0n));}
export function totalEUR(model){return Number(totalExactEUR(model));}
export function gainSummary(model){let unrealized=0,realized=0,withBasis=0,withRealized=0;for(const p of model.positions){if(p.costBasisEUR!=null){unrealized+=valueEUR(p)-p.costBasisEUR;withBasis++;}if(p.realizedPnLEUR!=null){realized+=p.realizedPnLEUR;withRealized++;}}return {unrealized,realized,withBasis,withRealized,unvalued:model.positions.length-withBasis};}
export function groupByKind(model){return Object.entries(TYPES).map(([key,name])=>({key,name,total:model.positions.filter(p=>p.kind===key).reduce((n,p)=>n+valueEUR(p),0)})).filter(x=>x.total>0);}
/**
 * Historical valuations may ONLY be recorded when their value is explicitly supplied.
 * A backdated snapshot cannot use today's portfolio prices or balances.
 */
export function snapshot(model,date=new Date().toISOString().slice(0,10),note='',options={}){
 if(!/^\d{4}-\d\d-\d\d$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Ungültiges Datum.');
 const today=new Date().toISOString().slice(0,10);
 if(date>today)throw Error('Zukünftige Stichtage sind nicht möglich.');
 const manual=options.manualTotalEUR!=null&&String(options.manualTotalEUR).trim()!=='';
 if(date!==today&&!manual)throw Error('Für historische Stichtage bitte den tatsächlich damals bekannten Portfoliowert eingeben; heutige Kurse sind keine historischen Daten.');
 const amountExact=manual?exact(units(options.manualTotalEUR)):totalExactEUR(model);
 // Net liabilities may lead to a legitimate negative portfolio value.
 const amount=Number(amountExact),recordedAt=new Date().toISOString();
 const partial=!manual&&model.positions.some(p=>(Number(p.quantityExact??p.quantity)>0&&(!(Number(p.priceExact??p.price)>0)||Boolean(p.priceStatus)))||(p.quoteAsOf&&Number.isFinite(Date.parse(p.quoteAsOf))&&(Date.now()-Date.parse(p.quoteAsOf)>7*864e5)));
 const valuationStatus=manual?'manual':partial?'partial':'observed',source=manual?'manual':'current';
 const byAccount=manual?null:(()=>{const totals=Object.fromEntries(model.accounts.map(a=>[a.id,0]));for(const p of model.positions)if(Object.hasOwn(totals,p.accountId))totals[p.accountId]+=valueEUR(p);return totals;})();
 const byPosition=manual?null:currentPositionValues(model);
 const quoteTimes=manual?[]:model.positions.filter(p=>p.updatedAt).map(p=>({positionId:p.id,updatedAt:p.updatedAt,quoteAsOf:p.quoteAsOf||null,quoteSource:p.quoteSource||null,fxRateDate:p.fxRateDate||null}));
 const existing=model.snapshots.find(x=>x.date===date);
 if(existing){
   // Preserve preceding versions rather than silently rewriting historical evidence.
   existing.revisions??=[];
   existing.revisions.push({recordedAt:existing.recordedAt||null,totalEURExact:existing.totalEURExact??String(existing.total),valuationStatus:existing.valuationStatus||'unknown',source:existing.source||'legacy'});
   Object.assign(existing,{total:amount,totalEURExact:amountExact,recordedAt,valuationStatus,source,byAccount,byPosition,quoteTimes,note:cleanString(note||existing.note,180)});
 }else model.snapshots.push({id:uid(),date,recordedAt,total:amount,totalEURExact:amountExact,valuationStatus,source,byAccount,byPosition,quoteTimes,revisions:[],note:cleanString(note,180)});
 model.snapshots.sort((a,b)=>a.date.localeCompare(b.date));
 return amount;
}
/** Transactions modify shares but never overwrite the independent market quote. */
export function addBooking(model,v){const entry=executeTransaction(model,{...v,type:v.type||'buy'});if(v.date===new Date().toISOString().slice(0,10))snapshot(model,v.date);return model.positions.find(p=>p.id===entry.positionId);}

const uniqueIds=(array,label)=>{const ids=new Set();for(const x of array){if(!x.id||ids.has(x.id))throw Error('Doppelte oder leere ID bei '+label+'.');ids.add(x.id);}};
/** Importiert v1/v2-Backups ohne erfundene Transaktionen als dokumentierte v3-Eröffnungsbestände. */
export function safeImport(raw){
  if(!raw||![1,2,3].includes(raw.version)||!Array.isArray(raw.providers)||!Array.isArray(raw.positions)||!Array.isArray(raw.snapshots))throw Error('Datei ist kein unterstütztes FolioLab-Backup.');
  if(raw.version>=2&&!Array.isArray(raw.accounts))throw Error('Die Kontendaten des Backups fehlen.');
  if(raw.providers.length>500||raw.positions.length>5000||raw.snapshots.length>15000||(raw.accounts||[]).length>2000||!Array.isArray(raw.bookings||[])||(raw.bookings||[]).length>25000||(raw.journalEntries||[]).length>25000||(raw.openingPositions||[]).length>5000)throw Error('Backup überschreitet die vorgesehenen Größenlimits oder ist beschädigt.');
  const m=blankModel();
  m.providers=raw.providers.map(createProvider);uniqueIds(m.providers,'Anbietern');
  if(raw.version>=2){m.accounts=raw.accounts.map(a=>createAccount(a,m));uniqueIds(m.accounts,'Konten');}
  // v1 stored holdings directly under providers; create a default account per provider.
  if(raw.version===1)for(const p of m.providers)defaultAccount(m,p.id);
  m.positions=raw.positions.map(p=>createPosition(enhanceKnownReferenceListing(p),m));uniqueIds(m.positions,'Positionen');
  if(raw.priceHistories!=null){
   if(typeof raw.priceHistories!=='object'||Array.isArray(raw.priceHistories))throw Error('Kurshistorien im Backup sind beschädigt.');
   const entries=Object.entries(raw.priceHistories);
   if(entries.length>500||entries.reduce((sum,[,v])=>sum+(Array.isArray(v?.points)?v.points.length:0),0)>100000)throw Error('Zu viele importierte Kursdaten.');
   for(const [id,h] of entries){
    const p=m.positions.find(p=>p.id===id);
    if(!p||!['etf','fund','stock','crypto'].includes(p.kind)||id==='__proto__'||id==='constructor')throw Error('Kurshistorie hat keinen gültigen Positionsbezug.');
    m.priceHistories[id]=validateImportedPriceHistory(h,p);
   }
  }
  for(const p of m.positions)validateEconomicPosition(p,m);
  rebuildAssets(m);
  m.performanceFlowTrackingSince=raw.performanceFlowTrackingSince&&/^\d{4}-\d{2}-\d{2}$/.test(raw.performanceFlowTrackingSince)?raw.performanceFlowTrackingSince:null;
  if(raw.externalCashFlows!=null&&!Array.isArray(raw.externalCashFlows))throw Error('Ungültige Cashflow-Historie.');
  m.externalCashFlows=(raw.externalCashFlows||[]).map(x=>{if(!x||!x.id||!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!Number.isFinite(Number(x.amountEUR)))throw Error('Cashflow-Historie beschädigt.');return {id:cleanString(x.id,120),date:x.date,amountEUR:Number(x.amountEUR),amountExactEUR:exact(units(x.amountExactEUR??x.amountEUR))};});
  uniqueIds(m.externalCashFlows,'externen Geldflüssen');
  m.openingPositions=raw.version===3&&Array.isArray(raw.openingPositions)?raw.openingPositions.map(x=>{
    if(!x||!x.positionId||!m.positions.some(p=>p.id===x.positionId))throw Error('Ungültiger Eröffnungsbestand.');
    return {positionId:cleanString(x.positionId,120),quantityExact:exact(units(x.quantityExact)),costBasisExact:x.costBasisExact==null?null:exact(units(x.costBasisExact)),realizedPnLExact:x.realizedPnLExact==null?null:exact(units(x.realizedPnLExact)),source:'observed-opening',asOf:null};
  }):[];
  if(raw.version<3)captureOpenings(m);
  if(raw.version===3){
    if(!Array.isArray(raw.journalEntries)||!Array.isArray(raw.openingPositions))throw Error('Journal oder Eröffnungsbestände fehlen.');
    m.journalEntries=raw.journalEntries.map(x=>structuredClone(validateJournalEntry(x)));
    uniqueIds(m.journalEntries,'Journal-Einträgen');
    const postingIds=new Set();
    for(const entry of m.journalEntries)for(const p of entry.postings){
      if(postingIds.has(p.id))throw Error('Doppelte Journal-Buchungs-ID.');
      postingIds.add(p.id);
    }
  }
  uniqueIds(m.openingPositions.map(x=>({id:x.positionId})),'Eröffnungsbeständen');
  m.bookings=(raw.bookings||[]).map(x=>{
    if(!x||typeof x!=='object'||!x.id||!x.positionId||!/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')||!Number.isFinite(number(x.quantity)))throw Error('Ungültige Buchung im Backup.');
    return {...x,notes:cleanString(x.notes,180)};
  });uniqueIds(m.bookings,'Buchungen');
  m.snapshots=raw.snapshots.map(x=>{
    if(!x||!x.id||!/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')||Number.isNaN(Date.parse(x.date)))throw Error('Ungültiger Stichtag im Backup.');
    return {id:cleanString(x.id,120),date:x.date,total:safeNumber(x.total,-1e18,1e18),
      totalEURExact:exact(units(x.totalEURExact??x.total)),recordedAt:cleanString(x.recordedAt,40)||null,
      byAccount:x.byAccount&&typeof x.byAccount==='object'?structuredClone(x.byAccount):null,
      byPosition:(()=>{
        if(x.byPosition==null)return null;
        if(x.source!=='current'||!x.byPosition||typeof x.byPosition!=='object'||Array.isArray(x.byPosition))throw Error('Ungültige historische Einzelpositionswerte im Backup.');
        const entries=Object.entries(x.byPosition);
        if(entries.length>5000)throw Error('Zu viele historische Einzelpositionswerte.');
        const values=Object.create(null);
        for(const [positionId,amount] of entries){
          if(!positionId||positionId.length>120||positionId==='__proto__'||positionId==='constructor')throw Error('Ungültiger Positionsbezug im historischen Verlauf.');
          values[positionId]=exact(units(amount));
        }
        return values;
      })(),
      valuationStatus:raw.version<3?'legacy-unverified':cleanString(x.valuationStatus,40)||'unknown',
      source:raw.version<3?'legacy':cleanString(x.source,40)||'unknown',
      quoteTimes:Array.isArray(x.quoteTimes)?structuredClone(x.quoteTimes):[],
      revisions:Array.isArray(x.revisions)?structuredClone(x.revisions):[],
      note:cleanString(x.note,180)};
  }).sort((a,b)=>a.date.localeCompare(b.date));uniqueIds(m.snapshots,'Stichtagen');
  if(raw.version===3&&m.journalEntries.length){
   const audit=ledgerQuantityAudit(m);
   if(!audit.ok)throw Error('Backup: Journal und aktuelle Positionsmengen stimmen nicht überein. Import abgebrochen.');
  }
  return m;
}
export function backup(model){const copy=structuredClone(model);rebuildAssets(copy);copy.settings=defaultSettings();return JSON.stringify(copy,null,2);}
/** Daten niemals stillschweigend durch ein leeres Portfolio ersetzen, wenn der Speicher fehlerhaft ist. */
const observedStorage=new WeakMap();
export function load(storage=globalThis.localStorage){
  const raw=storage.getItem(STORE_KEY);
  if(!raw){observedStorage.set(storage,null);return blankModel();}
  const parsed=JSON.parse(raw);
  // Before a v1 -> v2 migration preserve exactly the original bytes for local recovery.
  if(parsed?.version===1||parsed?.version===2){const key=STORE_KEY+'-premigration-v'+parsed.version;if(!storage.getItem(key))storage.setItem(key,raw);}
  const result=safeImport(parsed);
  const input=parsed.settings||{},settings=defaultSettings();
  for(const k of Object.keys(settings))if(Object.hasOwn(input,k))settings[k]=input[k];
  if(settings.solanaRpc==='https://api.mainnet-beta.solana.com')settings.solanaRpc='https://solana-rpc.publicnode.com';
  result.settings=settings;
  observedStorage.set(storage,raw);
  return result;
}
export function persist(model,storage=globalThis.localStorage){
 if(model.version!==3)throw Error('Unbekannte Datenversion. Speichern abgebrochen.');
 const current=storage.getItem(STORE_KEY);
 if(observedStorage.has(storage)&&current!==observedStorage.get(storage))throw Error('Portfolio wurde in einem anderen Tab geändert. Bitte diesen Tab neu laden und Änderungen erneut vornehmen.');
 rebuildAssets(model);
 const serialized=JSON.stringify(model);
 storage.setItem(STORE_KEY,serialized);
 observedStorage.set(storage,serialized);
}
export const money=(n,c='EUR')=>new Intl.NumberFormat('de-AT',{style:'currency',currency:c,maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);
export const quant=n=>new Intl.NumberFormat('de-AT',{maximumFractionDigits:8}).format(n);
export function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
