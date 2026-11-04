/** Public fixture: invented owners, IDs, quantities and block. LINK contract is public metadata. */
import {sourceDigest} from '../src/import-identity.js';
import {LINK_CONTRACT,parseLinkEvidence,partialLinkHistory} from '../src/link-explorer-evidence.js';
import {fixture} from './kraken-import-fixture.mjs';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
import {ledgerCSV} from './ledger-live-fixture.mjs';
import {createProvider,createAccount,createPosition,backup,safeImport} from '../src/model.js';
import {captureOpenings} from '../src/transactions.js';
import {acceptHistory} from '../src/wallet-history-state.js';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
export function linkBridgeFixture({accepted=true}={}){
 const txid='0x'+'c'.repeat(64),blockHash='0x'+'d'.repeat(64),from='0x'+'2'.repeat(40),destination='0x'+'1'.repeat(40),principal='0.123456789012345678',quantity=123456789012345678n,slot='100',timestamp=new Date((1606824023+1200)*1000).toISOString(),observed='2026-01-01T00:00:00.000Z';
 const text=krakenCSV([{txid:'SYNTHETIC-LINK-LEDGER',refid:'SYNTHETIC-LINK-WITHDRAWAL',type:'withdrawal',subtype:'',asset:'LINK',amount:'-'+principal,fee:'0.01',balance:'0',feecurrency:'LINK'}]);let {m,assignments}=fixture(text);m.positions[0].coinId='chainlink';m.providers.push(createProvider({id:'wp',name:'Synthetic wallet',type:'wallet'}));m.accounts.push(createAccount({id:'wa',providerId:'wp',name:'Synthetic own wallet',type:'wallet'},m));m.positions.push(createPosition({id:'own-link',providerId:'wp',accountId:'wa',name:'Synthetic own LINK',kind:'crypto',coinId:'chainlink',symbol:'LINK',quantity:'2',price:'1',wallet:{enabled:true,chain:'erc20',chainId:1,contract:LINK_CONTRACT,address:destination}},m));captureOpenings(m);
 const transaction={hash:txid,status:'ok',result:'success',is_pending_update:false,revert_reason:null,created_contract:null,has_error_in_internal_transactions:false,type:2,value:'0',from:{hash:from},to:{hash:LINK_CONTRACT},position:0,block_number:20,timestamp,gas_used:'21000',gas_price:'2',gas_limit:'50000',fee:{type:'actual',value:'42000'},raw_input:'0xa9059cbb'+'0'.repeat(24)+destination.slice(2)+quantity.toString(16).padStart(64,'0')};
 const block={hash:blockHash,height:20,timestamp,is_pending_update:false,type:'block'},logs={items:[{transaction_hash:txid,block_hash:blockHash,block_number:20,block_timestamp:timestamp,address:{hash:LINK_CONTRACT},index:7,data:'0x'+quantity.toString(16).padStart(64,'0'),topics:['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef','0x'+'0'.repeat(24)+from.slice(2),'0x'+'0'.repeat(24)+destination.slice(2),null]}],next_page_params:null};
 const bodies={transaction,logs,blockByHash:block,blockByNumber:structuredClone(block),blockTransactions:{items:[transaction],next_page_params:null},beacon:{version:'fulu',finalized:true,execution_optimistic:false,data:{message:{slot,body:{execution_payload:{block_hash:blockHash,block_number:'20',timestamp:String(1606824023+1200)}}}}},genesis:{data:{genesis_time:'1606824023',genesis_validators_root:'0x4b363db94e286120d76eb905340fdd4e54bfe9f06bf33ff6cf5ad27f511bfe95'}}};
 const paths={transaction:'/api/v2/transactions/'+txid,logs:'/api/v2/transactions/'+txid+'/logs',blockByHash:'/api/v2/blocks/'+blockHash,blockByNumber:'/api/v2/blocks/20',blockTransactions:'/api/v2/blocks/'+blockHash+'/transactions',beacon:'/eth/v2/beacon/blocks/'+slot,genesis:'/eth/v1/beacon/genesis'};
 const pack={format:'foliolab-link-explorer-beacon-v1',chainId:'1',captures:Object.fromEntries(Object.entries(bodies).map(([k,v])=>{const body=JSON.stringify(v);return [k,{body,capture:{url:'https://'+(['beacon','genesis'].includes(k)?'lodestar-mainnet.chainsafe.io':'eth.blockscout.com')+paths[k],method:'GET',startedAt:observed,finishedAt:observed,status:200,tlsVerification:true,redirectsFollowed:false,retries:0,sha256:sourceDigest(body),bytes:new TextEncoder().encode(body).length}}];}))};
 const evidenceJSON=JSON.stringify(pack),execution=parseLinkEvidence(evidenceJSON);if(accepted)m=acceptHistory(m,partialLinkHistory(m,'own-link',execution));
 m=safeImport(JSON.parse(backup(m,{includeHistory:true})));
 const group=prepareKrakenSourcePlan([text]).groups[0],ledger=ledgerCSV([{'Currency Ticker':'LINK','Operation Date':timestamp,'Operation Amount':principal,'Operation Fees':'','Operation Hash':txid,'Account xpub':destination}]);
 return {m,text,assignments,group,pack,evidenceJSON,ledger,execution,proofInput:{positionId:'own-link',reference:group.rows[0].values.refid,txid,destination,ledgerCSV:ledger,evidenceJSON}};
}
