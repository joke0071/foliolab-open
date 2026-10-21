export const STORE_KEY='foliolab-open-v1';
export const TYPES={etf:'ETF',stock:'Aktie',fund:'Fonds',crypto:'Krypto',cash:'Guthaben',other:'Sonstiges'};
export const KINDS=Object.keys(TYPES);
export const defaultSettings=()=>({currency:'EUR',twelveKey:'',coinGeckoKey:'',etherscanKey:'',solanaRpc:'https://api.mainnet-beta.solana.com',showSmall:true,autoRefresh:true});
export const blankModel=()=>({version:1,providers:[],positions:[],bookings:[],snapshots:[],settings:defaultSettings()});
const cleanString=(s,max=120)=>String(s??'').trim().slice(0,max);
export const uid=()=>globalThis.crypto?.randomUUID?.()??`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function number(v){if(typeof v==='string')v=v.trim().replace(/\s/g,'').replace(',','.');const n=Number(v);return Number.isFinite(n)?n:NaN;}
export function safeNumber(v,min=0,max=1e18){const n=number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Bitte eine gültige Zahl zwischen ${min} und ${max} eingeben.`);return n;}
export function createProvider(v){const name=cleanString(v.name,80);if(!name)throw Error('Bitte einen Anbieternamen eingeben.');return {id:v.id||uid(),name,type:['broker','bank','wallet','other'].includes(v.type)?v.type:'other'};}
export function validateWallet(wallet){if(!wallet?.enabled)return null;const chain=cleanString(wallet.chain,20);const address=cleanString(wallet.address,180);const contract=cleanString(wallet.contract,120);const error='Ungültige öffentliche Wallet-Adresse. Keine privaten Schlüssel eingeben.';
  if(/\b(seed|mnemonic|xprv|yprv|zprv)\b/i.test(address)||/^(xprv|yprv|zprv)/i.test(address))throw Error(error);
  if(chain==='btc'&&!(/^(bc1[ac-hj-np-z02-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{24,47})$/.test(address)))throw Error(error);
  if((chain==='evm'||chain==='erc20')&&!/^0x[a-fA-F0-9]{40}$/.test(address))throw Error(error);
  if(chain==='erc20'&&!/^0x[a-fA-F0-9]{40}$/.test(contract))throw Error('Bitte eine ERC-20-Contract-Adresse angeben.');
  if((chain==='sol'||chain==='spl')&&!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address))throw Error(error);
  if(chain==='spl'&&!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract))throw Error('Bitte eine SPL-Mint-Adresse angeben.');
  if(!['btc','evm','erc20','sol','spl'].includes(chain))throw Error('Nicht unterstütztes Wallet-Netzwerk.');
  const decimals=(chain==='erc20'||chain==='spl')?safeNumber(wallet.decimals??18,0,30):chain==='btc'?8:chain==='sol'?9:18;
  const chainId=['evm','erc20'].includes(chain)?safeNumber(wallet.chainId??1,1,1e9):undefined;
  return {enabled:true,chain,address,contract,decimals,chainId};
}
export function createPosition(v,model){const name=cleanString(v.name,110);if(!name)throw Error('Bitte einen Positionsnamen eingeben.');if(!model.providers.some(x=>x.id===v.providerId))throw Error('Bitte einen gültigen Anbieter auswählen.');
  const kind=KINDS.includes(v.kind)?v.kind:'other';const quantity=safeNumber(v.quantity??0);const price=safeNumber(v.price??0);const currency=['EUR','USD','CHF','GBP'].includes(v.currency)?v.currency:'EUR';const fxRate=currency==='EUR'?1:safeNumber(v.fxRate??1,0.00000001,1000);
  const wallet=kind==='crypto'?validateWallet(v.wallet):null;
  return {id:v.id||uid(),providerId:v.providerId,kind,name,symbol:cleanString(v.symbol,32).toUpperCase(),isin:cleanString(v.isin,20).toUpperCase(),coinId:cleanString(v.coinId,110).toLowerCase(),quantity,price,currency,fxRate,wallet,updatedAt:cleanString(v.updatedAt,40)||null,notes:cleanString(v.notes,300)};
}
export function valueEUR(p){const qty=number(p.quantity),price=number(p.price),rate=p.currency==='EUR'?1:number(p.fxRate);return [qty,price,rate].every(Number.isFinite)?qty*price*rate:0;}
export function totalEUR(model){return model.positions.reduce((sum,p)=>sum+valueEUR(p),0);}
export function groupByKind(model){return Object.entries(TYPES).map(([key,name])=>({key,name,total:model.positions.filter(p=>p.kind===key).reduce((n,p)=>n+valueEUR(p),0)})).filter(x=>x.total>0);}
export function snapshot(model,date=new Date().toISOString().slice(0,10),note=''){if(!/^\d{4}-\d\d-\d\d$/.test(date)||Number.isNaN(Date.parse(date)))throw Error('Ungültiges Datum.');const amount=totalEUR(model);const existing=model.snapshots.find(x=>x.date===date);if(existing){existing.total=amount;existing.note=cleanString(note||existing.note,180);}else model.snapshots.push({id:uid(),date,total:amount,note:cleanString(note,180)});model.snapshots.sort((a,b)=>a.date.localeCompare(b.date));return amount;}
export function addBooking(model,v){const p=model.positions.find(x=>x.id===v.positionId);if(!p)throw Error('Position nicht gefunden.');const type=['buy','sell','reward','adjust'].includes(v.type)?v.type:'buy';const quantity=safeNumber(v.quantity,0.00000000000001);const unitPrice=safeNumber(v.unitPrice??p.price);const date=cleanString(v.date,10);if(!/^\d{4}-\d\d-\d\d$/.test(date)||Number.isNaN(Date.parse(date)))throw Error('Datum ungültig.');const delta=type==='sell'?-quantity:quantity;if(p.quantity+delta < -1e-9)throw Error('Verkauf übersteigt den Bestand.');p.quantity=Math.max(0,p.quantity+delta);if(type!=='adjust'&&unitPrice>0)p.price=unitPrice;model.bookings.unshift({id:uid(),positionId:p.id,positionName:p.name,type,quantity,unitPrice,date,notes:cleanString(v.notes,180)});snapshot(model,date);return p;}
export function safeImport(raw){if(!raw||raw.version!==1||!Array.isArray(raw.providers)||!Array.isArray(raw.positions)||!Array.isArray(raw.snapshots))throw Error('Datei ist kein unterstütztes FolioLab-Backup.');if(raw.providers.length>500||raw.positions.length>5000||raw.snapshots.length>15000||((raw.bookings||[]).length>25000))throw Error('Backup überschreitet die vorgesehenen Größenlimits.');const model=blankModel();model.providers=raw.providers.map(createProvider);model.positions=raw.positions.map(p=>createPosition(p,model));model.bookings=(raw.bookings||[]).filter(x=>x&&typeof x==='object').map(x=>({...x,notes:cleanString(x.notes,180)}));model.snapshots=raw.snapshots.map(s=>({id:cleanString(s.id,120)||uid(),date:cleanString(s.date,10),total:safeNumber(s.total),note:cleanString(s.note,180)})).filter(s=>/^\d{4}-\d\d-\d\d$/.test(s.date)).sort((a,b)=>a.date.localeCompare(b.date));return model;}
export function backup(model){const copy=structuredClone(model);copy.settings=defaultSettings();return JSON.stringify(copy,null,2);}
export function load(storage=globalThis.localStorage){try{const raw=storage.getItem(STORE_KEY);if(!raw)return blankModel();const parsed=JSON.parse(raw);const result=safeImport(parsed);result.settings={...defaultSettings(),...parsed.settings};return result;}catch(e){console.warn('Lokales Portfolio konnte nicht geladen werden.',e);return blankModel();}}
export function persist(model,storage=globalThis.localStorage){storage.setItem(STORE_KEY,JSON.stringify(model));}
export const money=(n,c='EUR')=>new Intl.NumberFormat('de-AT',{style:'currency',currency:c,maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);
export const quant=n=>new Intl.NumberFormat('de-AT',{maximumFractionDigits:8}).format(n);
export function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
