import {fixture} from './kraken-import-fixture.mjs';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
import {ledgerCSV} from './ledger-live-fixture.mjs';
import {createProvider,createAccount,createPosition} from '../src/model.js';
import {captureOpenings} from '../src/transactions.js';
import {solanaHistoryEvents} from '../src/solana-history.js';
import {validateHistorySession} from '../src/wallet-history-state.js';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58(bytes){let n=bytes.reduce((n,v)=>n*256n+BigInt(v),0n),s='';while(n){s=alphabet[Number(n%58n)]+s;n/=58n;}for(const v of bytes){if(v)break;s='1'+s;}return s;}
export const solAddress=base58(Array(32).fill(1)),solSender=base58(Array(32).fill(2)),solTxid=base58(Array(64).fill(3)),solBlock=base58(Array(32).fill(4));
export function solanaBridgeFixture({balance="0"}={}){
 const text=krakenCSV([{txid:'SYNTHETIC-SOL-LEDGER',refid:'SYNTHETIC-SOL-WITHDRAWAL',type:'withdrawal',subtype:'',asset:'SOL',amount:'-0.123456789',fee:'0.00042',balance,feecurrency:'SOL'}]),{m,assignments}=fixture(text);
 m.providers.push(createProvider({id:'wallet-provider',name:'Synthetic wallet provider',type:'wallet'}));m.accounts.push(createAccount({id:'wallet-account',providerId:'wallet-provider',name:'Synthetic wallet',type:'wallet'},m));
 m.positions.push(createPosition({id:'own-sol',providerId:'wallet-provider',accountId:'wallet-account',name:'Synthetic own SOL',kind:'crypto',coinId:'solana',symbol:'SOL',quantity:'0.123456789',price:'1',wallet:{enabled:true,chain:'sol',address:solAddress}},m));captureOpenings(m);
 const transaction={version:'legacy',slot:20,blockTime:916185916,transaction:{signatures:[solTxid],message:{header:{numRequiredSignatures:1,numReadonlySignedAccounts:0,numReadonlyUnsignedAccounts:2},accountKeys:[solSender,solAddress,'11111111111111111111111111111111','ComputeBudget111111111111111111111111111111'],recentBlockhash:solBlock,instructions:[{programIdIndex:3,accounts:[],data:base58([2,64,66,15,0])},{programIdIndex:3,accounts:[],data:base58([3,1,0,0,0,0,0,0,0])},{programIdIndex:2,accounts:[0,1],data:base58([2,0,0,0,21,205,91,7,0,0,0,0])}]}},meta:{err:null,fee:5000,preBalances:[123461789,0,0,0],postBalances:[0,123456789,0,0],innerInstructions:[],preTokenBalances:[],postTokenBalances:[]}},block={blockhash:solBlock,blockTime:transaction.blockTime,signatures:[solTxid]},finalizedSlot=100,genesis='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';
 const normalized=solanaHistoryEvents([{...transaction,blockhash:solBlock,txIndex:0}],[{accountId:'wallet-account',address:solAddress}],{observedAt:'2026-01-01T00:00:00.000Z'}),at=normalized.events[0].timestamp;
 const event=normalized.events[0],stream={network:'solana',chainId:'mainnet-beta',accountId:'wallet-account',assetId:'solana',contract:null,mint:null,decimals:9,throughBlock:'20',opening:{quantityBaseUnits:'0',beforeBlock:'0',source:'synthetic-opening'},coverage:{status:'partial',fromBlock:'0',toBlock:'20',tipHash:solBlock,source:'synthetic'}};
 m.walletHistory={schema:1,pending:[],sessions:[validateHistorySession({id:'synthetic-eth-history',chain:'sol',walletKey:'own-sol',acceptedAt:at,events:[event],streams:[stream],issues:['native-protocol-credits-uncovered']})]};
 const group=prepareKrakenSourcePlan([text]).groups[0],ledger=ledgerCSV([{'Currency Ticker':'SOL','Operation Date':at,'Operation Amount':'0.123456789','Operation Fees':'0.000005','Operation Hash':solTxid,'Account xpub':solAddress}]);
 return {m,text,assignments,group,ledger,transaction,block,finalizedSlot,genesis,proofInput:{positionId:'own-sol',reference:group.rows[0].values.refid,txid:solTxid,destination:solAddress,ledgerCSV:ledger,transaction,block,finalizedSlot,genesis}};
}
