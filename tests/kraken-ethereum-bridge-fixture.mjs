import {fixture} from './kraken-import-fixture.mjs';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
import {ledgerCSV} from './ledger-live-fixture.mjs';
import {createProvider,createAccount,createPosition} from '../src/model.js';
import {captureOpenings} from '../src/transactions.js';
import {ethereumHistoryEvents} from '../src/ethereum-history.js';
import {validateHistorySession} from '../src/wallet-history-state.js';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
export const ethAddress='0x'+'1'.repeat(40),ethSender='0x'+'2'.repeat(40),ethTxid='0x'+'c'.repeat(64),ethBlock='0x'+'d'.repeat(64);
export function ethereumBridgeFixture(){
 const text=krakenCSV([{txid:'SYNTHETIC-ETH-LEDGER',refid:'SYNTHETIC-ETH-WITHDRAWAL',type:'withdrawal',subtype:'',asset:'ETH',amount:'-0.123456789012345678',fee:'0.00042',balance:'0',feecurrency:'ETH'}]),{m,assignments}=fixture(text);
 m.providers.push(createProvider({id:'wallet-provider',name:'Synthetic wallet provider',type:'wallet'}));m.accounts.push(createAccount({id:'wallet-account',providerId:'wallet-provider',name:'Synthetic wallet',type:'wallet'},m));
 m.positions.push(createPosition({id:'own-eth',providerId:'wallet-provider',accountId:'wallet-account',name:'Synthetic own ETH',kind:'crypto',coinId:'ethereum',symbol:'ETH',quantity:'0.123456789012345678',price:'1',wallet:{enabled:true,chain:'evm',chainId:1,address:ethAddress}},m));captureOpenings(m);
 const transaction={hash:ethTxid,chainId:'0x1',type:'0x2',from:ethSender,to:ethAddress,value:'0x'+(123456789012345678n).toString(16),input:'0x',blockHash:ethBlock,blockNumber:'0x14',transactionIndex:'0x0'},receipt={transactionHash:ethTxid,from:ethSender,to:ethAddress,blockHash:ethBlock,blockNumber:'0x14',transactionIndex:'0x0',status:'0x1',gasUsed:'0x5208',effectiveGasPrice:'0x2',logs:[],contractAddress:null},block={hash:ethBlock,number:'0x14',timestamp:'0x369be33c',transactions:[ethTxid]},finalized={hash:'0x'+'e'.repeat(64),number:'0x64'};
 const normalized=ethereumHistoryEvents({wallets:[{accountId:'wallet-account',address:ethAddress}],transactions:[{hash:ethTxid,from:{hash:ethSender,is_contract:false},to:{hash:ethAddress,is_contract:false},value:'123456789012345678',block_number:20}],evidence:{[ethTxid]:{transaction,receipt,block}},observedAt:'2026-01-01T00:00:00.000Z'}),at=normalized.events[0].timestamp;
 const event=normalized.events[0],stream={network:'ethereum',chainId:'1',accountId:'wallet-account',assetId:'ethereum',contract:null,mint:null,decimals:18,throughBlock:'20',opening:{quantityBaseUnits:'0',beforeBlock:'0',source:'synthetic-opening'},coverage:{status:'partial',fromBlock:'0',toBlock:'20',tipHash:ethBlock,source:'synthetic'}};
 m.walletHistory={schema:1,pending:[],sessions:[validateHistorySession({id:'synthetic-eth-history',chain:'eth',walletKey:'own-eth',acceptedAt:at,events:[event],streams:[stream],issues:['native-protocol-credits-uncovered']})]};
 const group=prepareKrakenSourcePlan([text]).groups[0],ledger=ledgerCSV([{'Currency Ticker':'ETH','Operation Date':at,'Operation Amount':'0.123456789012345678','Operation Fees':'0.000000000000042','Operation Hash':ethTxid,'Account xpub':ethAddress}]);
 return {m,text,assignments,group,ledger,transaction,receipt,block,finalized,proofInput:{positionId:'own-eth',reference:group.rows[0].values.refid,txid:ethTxid,destination:ethAddress,ledgerCSV:ledger,transaction,receipt,block,finalized}};
}
