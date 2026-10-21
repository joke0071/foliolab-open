import {rebuildAssets} from './assets.js';
import {executeTransaction} from './transactions.js';
import {units,exact,preciseValue} from './decimal.js';
export const STORE_KEY='foliolab-open-v1';
export const TYPES={etf:'ETF',stock:'Aktie',fund:'Fonds',crypto:'Krypto',cash:'Guthaben',other:'Sonstiges'};
export const KINDS=Object.keys(TYPES);
export const defaultSettings=()=>({currency:'EUR',twelveKey:'',coinGeckoKey:'',etherscanKey:'',solanaRpc:'https://solana-rpc.publicnode.com',showSmall:true,autoRefresh:true,lastAccountId:''});
export const blankModel=()=>({version:2,providers:[],accounts:[],assets:[],positions:[],bookings:[],externalCashFlows:[],snapshots:[],performanceFlowTrackingSince:null,settings:defaultSettings()});
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
  if(chain==='btc'&&!(/^(bc1[ac-hj-np-z02-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{24,47})$/.test(address)))throw Error(error);
  if((chain==='evm'||chain==='erc20')&&!/^0x[a-fA-F0-9]{40}$/.test(address))throw Error(error);
  if(chain==='erc20'&&!/^0x[a-fA-F0-9]{40}$/.test(contract))throw Error('Bitte eine ERC-20-Contract-Adresse angeben.');
  if((chain==='sol'||chain==='spl')&&!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address))throw Error(error);if(chain==='xrp'&&!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address))throw Error(error);
  if(chain==='spl'&&!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract))throw Error('Bitte eine SPL-Mint-Adresse angeben.');
  if(!['btc','evm','erc20','sol','spl','xrp'].includes(chain))throw Error('Nicht unterstütztes Wallet-Netzwerk.');
  const decimals=(chain==='erc20'||chain==='spl')?safeNumber(wallet.decimals??18,0,30):chain==='btc'?8:chain==='sol'?9:chain==='xrp'?6:18;
  const chainId=['evm','erc20'].includes(chain)?safeNumber(wallet.chainId??1,1,1e9):undefined;
  return {enabled:true,chain,address,contract,decimals,chainId};
}
export function createPosition(v,model){const name=cleanString(v.name,110);if(!name)throw Error('Bitte einen Positionsnamen eingeben.');if(!model.providers.some(x=>x.id===v.providerId))throw Error('Bitte einen gültigen Anbieter auswählen.');
  model.accounts??=[];const account=v.accountId?model.accounts.find(a=>a.id===v.accountId):defaultAccount(model,v.providerId);if(!account||account.providerId!==v.providerId)throw Error('Bitte ein Konto dieses Anbieters auswählen.');
  const kind=KINDS.includes(v.kind)?v.kind:'other';const quantityExact=exact(units(v.quantityExact??v.quantity??0));const quantity=safeNumber(quantityExact);const price=safeNumber(v.price??0);const currency=['EUR','USD','CHF','GBP','CAD','AUD','JPY','NOK','SEK','DKK','PLN','CZK','HUF','NZD','SGD'].includes(v.currency)?v.currency:'EUR';const fxRate=currency==='EUR'?1:safeNumber(v.fxRate??1,0.00000001,1000);
  const wallet=kind==='crypto'?validateWallet(v.wallet):null;const managementSource=wallet?.enabled?'wallet':v.managementSource==='transactions'?'transactions':'manual';
  const costBasisEUR=(v.costBasisEUR==null||v.costBasisEUR==='')?null:safeNumber(v.costBasisEUR);
  const realizedPnLEUR=v.realizedPnLEUR==null?null:number(v.realizedPnLEUR);if(realizedPnLEUR!=null&&!Number.isFinite(realizedPnLEUR))throw Error('Ungültiger realisierter Gewinn.');
  return {id:v.id||uid(),providerId:v.providerId,accountId:account.id,managementSource,costBasisEUR,realizedPnLEUR,assetId:cleanString(v.assetId,220)||null,kind,name,exchange:cleanString(v.exchange,60),symbol:cleanString(v.symbol,32).toUpperCase(),isin:cleanString(v.isin,20).toUpperCase(),coinId:cleanString(v.coinId,110).toLowerCase(),quantity,quantityExact,price,currency,fxRate,wallet,updatedAt:cleanString(v.updatedAt,40)||null,notes:cleanString(v.notes,300)};
}
export function valueEUR(p){return Number(preciseValue(p.quantityExact??p.quantity,p.price,p.currency==='EUR'?1:p.fxRate));}
export function totalEUR(model){return Number(exact(model.positions.reduce((sum,p)=>sum+units(preciseValue(p.quantityExact??p.quantity,p.price,p.currency==='EUR'?1:p.fxRate)),0n)));}
export function gainSummary(model){let unrealized=0,realized=0,withBasis=0,withRealized=0;for(const p of model.positions){if(p.costBasisEUR!=null){unrealized+=valueEUR(p)-p.costBasisEUR;withBasis++;}if(p.realizedPnLEUR!=null){realized+=p.realizedPnLEUR;withRealized++;}}return {unrealized,realized,withBasis,withRealized,unvalued:model.positions.length-withBasis};}
export function groupByKind(model){return Object.entries(TYPES).map(([key,name])=>({key,name,total:model.positions.filter(p=>p.kind===key).reduce((n,p)=>n+valueEUR(p),0)})).filter(x=>x.total>0);}
export function snapshot(model,date=new Date().toISOString().slice(0,10),note=''){if(!/^\d{4}-\d\d-\d\d$/.test(date)||Number.isNaN(Date.parse(date)))throw Error('Ungültiges Datum.');const amount=totalEUR(model);const existing=model.snapshots.find(x=>x.date===date);if(existing){existing.total=amount;existing.note=cleanString(note||existing.note,180);}else model.snapshots.push({id:uid(),date,recordedAt:new Date().toISOString(),total:amount,note:cleanString(note,180),byAccount:Object.fromEntries(model.accounts.map(a=>[a.id,model.positions.filter(p=>p.accountId===a.id).reduce((s,p)=>s+valueEUR(p),0)])),valuationStatus:'teilweise/ungeprüft',quoteTimes:model.positions.filter(p=>p.updatedAt).map(p=>({positionId:p.id,updatedAt:p.updatedAt}))});model.snapshots.sort((a,b)=>a.date.localeCompare(b.date));return amount;}
/** Transactions modify shares but never overwrite the independent market quote. */
export function addBooking(model,v){const entry=executeTransaction(model,{...v,type:v.type||'buy'});if(v.date===new Date().toISOString().slice(0,10))snapshot(model,v.date);return model.positions.find(p=>p.id===entry.positionId);}

const uniqueIds=(array,label)=>{const ids=new Set();for(const x of array){if(!x.id||ids.has(x.id))throw Error('Doppelte oder leere ID bei '+label+'.');ids.add(x.id);}};
/** Importiert alte v1-Backups sicher und hebt sie in das normalisierte v2-Modell. */
export function safeImport(raw){
  if(!raw||![1,2].includes(raw.version)||!Array.isArray(raw.providers)||!Array.isArray(raw.positions)||!Array.isArray(raw.snapshots))throw Error('Datei ist kein unterstütztes FolioLab-Backup.');
  if(raw.version===2&&!Array.isArray(raw.accounts))throw Error('Die Kontendaten des Backups fehlen.');
  if(raw.providers.length>500||raw.positions.length>5000||raw.snapshots.length>15000||(raw.accounts||[]).length>2000||!Array.isArray(raw.bookings||[])||(raw.bookings||[]).length>25000)throw Error('Backup überschreitet die vorgesehenen Größenlimits oder ist beschädigt.');
  const m=blankModel();
  m.providers=raw.providers.map(createProvider);uniqueIds(m.providers,'Anbietern');
  if(raw.version===2){m.accounts=raw.accounts.map(a=>createAccount(a,m));uniqueIds(m.accounts,'Konten');}
  // v1 stored holdings directly under providers; create a default account per provider.
  if(raw.version===1)for(const p of m.providers)defaultAccount(m,p.id);
  m.positions=raw.positions.map(p=>createPosition(p,m));uniqueIds(m.positions,'Positionen');rebuildAssets(m);
  m.performanceFlowTrackingSince=raw.performanceFlowTrackingSince&&/^\d{4}-\d{2}-\d{2}$/.test(raw.performanceFlowTrackingSince)?raw.performanceFlowTrackingSince:null;
  if(raw.externalCashFlows!=null&&!Array.isArray(raw.externalCashFlows))throw Error('Ungültige Cashflow-Historie.');
  m.externalCashFlows=(raw.externalCashFlows||[]).map(x=>{if(!x||!x.id||!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!Number.isFinite(Number(x.amountEUR)))throw Error('Cashflow-Historie beschädigt.');return {id:cleanString(x.id,120),date:x.date,amountEUR:Number(x.amountEUR),amountExactEUR:exact(units(x.amountExactEUR??x.amountEUR))};});
  uniqueIds(m.externalCashFlows,'externen Geldflüssen');
  m.bookings=(raw.bookings||[]).map(x=>{
    if(!x||typeof x!=='object'||!x.id||!x.positionId||!/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')||!Number.isFinite(number(x.quantity)))throw Error('Ungültige Buchung im Backup.');
    return {...x,notes:cleanString(x.notes,180)};
  });uniqueIds(m.bookings,'Buchungen');
  m.snapshots=raw.snapshots.map(x=>{
    if(!x||!x.id||!/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')||Number.isNaN(Date.parse(x.date)))throw Error('Ungültiger Stichtag im Backup.');
    return {id:cleanString(x.id,120),date:x.date,total:safeNumber(x.total),recordedAt:cleanString(x.recordedAt,40)||null,byAccount:x.byAccount&&typeof x.byAccount==='object'?x.byAccount:null,valuationStatus:cleanString(x.valuationStatus,40)||'historisch',note:cleanString(x.note,180)};
  }).sort((a,b)=>a.date.localeCompare(b.date));uniqueIds(m.snapshots,'Stichtagen');
  return m;
}
export function backup(model){const copy=structuredClone(model);rebuildAssets(copy);copy.settings=defaultSettings();return JSON.stringify(copy,null,2);}
/** Daten niemals stillschweigend durch ein leeres Portfolio ersetzen, wenn der Speicher fehlerhaft ist. */
export function load(storage=globalThis.localStorage){
  const raw=storage.getItem(STORE_KEY);if(!raw)return blankModel();
  const parsed=JSON.parse(raw);
  // Before a v1 -> v2 migration preserve exactly the original bytes for local recovery.
  if(parsed?.version===1){const key=STORE_KEY+'-premigration-v1';if(!storage.getItem(key))storage.setItem(key,raw);}
  const result=safeImport(parsed);
  const input=parsed.settings||{},settings=defaultSettings();
  for(const k of Object.keys(settings))if(Object.hasOwn(input,k))settings[k]=input[k];
  if(settings.solanaRpc==='https://api.mainnet-beta.solana.com')settings.solanaRpc='https://solana-rpc.publicnode.com';
  result.settings=settings;
  return result;
}
export function persist(model,storage=globalThis.localStorage){if(model.version!==2)throw Error('Unbekannte Datenversion. Speichern abgebrochen.');rebuildAssets(model);storage.setItem(STORE_KEY,JSON.stringify(model));}
export const money=(n,c='EUR')=>new Intl.NumberFormat('de-AT',{style:'currency',currency:c,maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);
export const quant=n=>new Intl.NumberFormat('de-AT',{maximumFractionDigits:8}).format(n);
export function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
