import {fixture} from './kraken-import-fixture.mjs';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
import {createProvider,createAccount,createPosition} from '../src/model.js';
import {captureOpenings} from '../src/transactions.js';
import {bitcoinHistoryEvents} from '../src/bitcoin-history.js';
import {validateHistorySession,bitcoinHistoryScope} from '../src/wallet-history-state.js';
import {ledgerCSV} from './ledger-live-fixture.mjs';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
export const address='bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',txid='c'.repeat(64);
export function bridgeFixture(){
 const text=krakenCSV([{txid:'SYNTHETIC-BRIDGE-LEDGER',refid:'SYNTHETIC-WITHDRAWAL-REFERENCE',type:'withdrawal',subtype:'',asset:'BTC',amount:'-0.02',fee:'0.00003',balance:'0',feecurrency:'BTC'}]),{m,assignments}=fixture(text);
 m.providers.push(createProvider({id:'wallet-provider',name:'Synthetic wallet provider',type:'wallet'}));m.accounts.push(createAccount({id:'wallet-account',providerId:'wallet-provider',name:'Synthetic wallet',type:'wallet'},m));
 m.positions.push(createPosition({id:'own-btc',providerId:'wallet-provider',accountId:'wallet-account',name:'Synthetic own BTC',kind:'crypto',coinId:'bitcoin',symbol:'BTC',quantity:'0.02',price:'1',wallet:{enabled:true,chain:'btc',address}},m));captureOpenings(m);
 const transaction={txid,fee:400,vin:[{txid:'d'.repeat(64),vout:0,prevout:{value:5000400,scriptpubkey_address:'foreign'}}],vout:[{value:2000000,scriptpubkey_address:address},{value:3000000,scriptpubkey_address:'foreign-change'}],status:{confirmed:true,block_height:20,block_hash:'e'.repeat(64),block_time:915278460}};
 const result=bitcoinHistoryEvents([transaction],[{accountId:'wallet-account',addresses:[address]}],{observedAt:'1999-01-03T00:00:00.000Z'}),at=result.events[0].timestamp;
 m.walletHistory={schema:1,pending:[],sessions:[validateHistorySession({id:'synthetic-btc-history',chain:'btc',walletKey:'own-btc',walletScopeDigest:bitcoinHistoryScope(m.positions.at(-1).wallet),acceptedAt:at,events:result.events,streams:[{network:'bitcoin',chainId:'mainnet',accountId:'wallet-account',assetId:'bitcoin',contract:null,mint:null,decimals:8,throughBlock:'20',opening:{quantityBaseUnits:'0',beforeBlock:'0',source:'synthetic'},coverage:{status:'verified',fromBlock:'0',toBlock:'20',tipHash:'e'.repeat(64),source:'synthetic'}}]})]};
 const group=prepareKrakenSourcePlan([text]).groups[0],ledger=ledgerCSV([{'Operation Date':at,'Operation Amount':'0.02','Operation Fees':'0.000004','Operation Hash':txid,'Account xpub':address}]);
 return {m,text,assignments,group,transaction,ledger,proofInput:{positionId:'own-btc',reference:group.rows[0].values.refid,txid,destination:address,ledgerCSV:ledger,transaction}};
}
