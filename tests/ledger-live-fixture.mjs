import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {validatePurchaseReceipt} from '../src/purchase-evidence.js';
import {validateHistorySession} from '../src/wallet-history-state.js';
// Synthetic native export; no private original rows/addresses/hashes are retained.
export const nativeHeader='Operation Date,Status,Currency Ticker,Operation Type,Operation Amount,Operation Fees,Operation Hash,Account Name,Account xpub,Countervalue Ticker,Countervalue at Operation Date,Countervalue at CSV Export';
export const owner='1BoatSLRHtKNngkdXEeobR76b53LETtpyT',txid='a'.repeat(64),at='2025-01-01T12:00:00.000Z';
export function ledgerCSV(rows=[{}]){
 const fields=nativeHeader.split(',');
 const defaults={'Operation Date':at,Status:'Confirmed','Currency Ticker':'BTC','Operation Type':'IN','Operation Amount':'0.0248','Operation Fees':'','Operation Hash':txid,'Account Name':'Synthetic wallet','Account xpub':owner,'Countervalue Ticker':'USD','Countervalue at Operation Date':'1700','Countervalue at CSV Export':'2300'};
 const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
 return nativeHeader+'\r\n'+rows.map(row=>fields.map(f=>quote({...defaults,...row}[f])).join(',')).join('\r\n');
}

export function ledgerModel(){const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic'}));m.accounts.push(createAccount({id:'own',providerId:'p',name:'Wallet account',type:'wallet'},m));m.positions.push(createPosition({id:'wallet',providerId:'p',accountId:'own',name:'Synthetic BTC',kind:'crypto',coinId:'bitcoin',symbol:'BTC',quantity:'0.0248',price:1,wallet:{enabled:true,chain:'btc',address:owner}},m));return m;}
export function ledgerEvidence(m){
 const event={network:'bitcoin',chainId:'mainnet',accountId:'own',walletId:'own',assetId:'bitcoin',contract:null,mint:null,txid,locator:{kind:'vout',index:'0',subindex:'0'},blockHeight:'10',blockHash:'b'.repeat(64),txIndex:null,timestamp:at,decimals:8,quantityBaseUnits:'2480000',includedInEventId:null,type:'incoming',source:'synthetic',status:'confirmed',finality:'confirmed',observedAt:at,coverage:'verified',qualityCode:'synthetic'};
 m.walletHistory={schema:1,sessions:[validateHistorySession({id:'wallet-history:wallet',chain:'btc',walletKey:'wallet',acceptedAt:at,events:[event],streams:[{network:'bitcoin',chainId:'mainnet',accountId:'own',assetId:'bitcoin',contract:null,mint:null,decimals:8,throughBlock:'10',opening:{quantityBaseUnits:'0',beforeBlock:'0',source:'synthetic'},coverage:{status:'verified',fromBlock:'0',toBlock:'10',tipHash:'b'.repeat(64),source:'synthetic'}}],quotes:[],issues:[]})],pending:[]};
 m.purchaseEvidence={schema:1,decisions:[],receipts:[0,1].map(i=>validatePurchaseReceipt({provider:'bittr',currency:'EUR',timestamp:i?'2025-01-01T12:01:00.000Z':at,txid,fiatEUR:'500',serviceFeeEUR:'9',grossBTC:'0.0125',miningFeeBTC:'0.0001',netBTC:'0.0124'}))};return m;
}
