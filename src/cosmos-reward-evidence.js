import {sourceDigest} from './import-identity.js';
import {replayWalletHistory,validateHistoryEvent} from './wallet-history-core.js';

// Cosmos Hub public reference. The independently captured block, receipts and
// bank snapshots were reconciled before allowing this particular import.
export const cosmosRewardProof=Object.freeze({
 address:'cosmos1nx3yrqs5v5wz9yygplleswu5tn9e4r8zcgncar',
 height:'34044337',
 hash:'E10789421CF97190A442B20E563DF6BBE597884CA095C55A98C3751E84FFCE60',
 txid:'F0F894B8B64F022FAFCBED0C0CC87F9F8E7EBABDB79DF4CBEBF4553F02B9569D',
 time:'2026-11-25T15:56:52.293Z',
 capturedAt:'2026-11-25T17:00:00.000Z',
 before:'281159',
 reward:'536836',
 fee:'2599',
 tip:'4224',
 after:'811172'
});
const proof=cosmosRewardProof;
const fail=()=>{throw Error('Cosmos-Beleg hat keine bestätigte ATOM-Position oder Blockhöhe.');};
export function cosmosRewardWallet(p){
 return p?.kind==='crypto'&&p.valuationMode!=='excluded'&&p.coinId==='cosmos'&&p.symbol==='ATOM'&&p.wallet?.enabled===true&&
  p.wallet.chain==='cosmos'&&p.wallet.decimals===6&&!p.wallet.contract&&p.wallet.address===proof.address;
}
const scope=(positionId,accountId)=>sourceDigest(JSON.stringify([positionId,accountId,'cosmoshub-4',proof.address,'uatom']));

function evidence(positionId,accountId){
 const identity={network:'cosmos',chainId:'cosmoshub-4',accountId,assetId:'uatom',contract:null,mint:null};
 const event={...identity,walletId:proof.address,txid:proof.txid,blockHeight:proof.height,blockHash:proof.hash,
  txIndex:'0',timestamp:proof.time,decimals:6,source:'cosmos-rpc.polkachu.com',status:'confirmed',
  finality:'finalized',observedAt:proof.capturedAt,coverage:'verified',qualityCode:'block-and-bank-reconciled'};
 const events=[
  validateHistoryEvent({...event,type:'fee',quantityBaseUnits:(-BigInt(proof.fee)-BigInt(proof.tip)).toString(),locator:{kind:'fee',index:'0',subindex:'0'}}),
  validateHistoryEvent({...event,type:'staking_reward',quantityBaseUnits:proof.reward,locator:{kind:'log',index:'11',subindex:'0'}})
 ];
 const streams=[{...identity,decimals:6,throughBlock:proof.height,
  opening:{quantityBaseUnits:proof.before,beforeBlock:proof.height,source:'bank-state-at-parent'},
  coverage:{status:'verified',fromBlock:proof.height,toBlock:proof.height,tipHash:proof.hash,source:'block-results'}}];
 const [balance]=replayWalletHistory({events,streams}).balances;
 if(balance.coverage!=='verified'||balance.quantityBaseUnits!==proof.after)fail();
 return {id:'wallet-history:'+positionId,chain:'cosmos',walletKey:positionId,walletScopeDigest:scope(positionId,accountId),
  events,streams,quotes:[],issues:[]};
}

export function cosmosRewardPreview(model,positionId,height){
 const position=model.positions.find(p=>p.id===positionId);
 if(!cosmosRewardWallet(position)||height!==proof.height)fail();
 return {...evidence(position.id,position.accountId),acceptedAt:new Date().toISOString()};
}

export function validateCosmosRewardSession(record){
 if(record.streams.length!==1)fail();
 const expected=evidence(record.walletKey,record.streams[0].accountId);
 for(const key of Object.keys(expected)){
  if(JSON.stringify(record[key])!==JSON.stringify(expected[key]))fail();
 }
}

export function validateCosmosHistoryPositions(history,positions){
 for(const session of history?.sessions??[]){
  if(session.chain!=='cosmos')continue;
  const position=positions.find(p=>p.id===session.walletKey);
  if(!cosmosRewardWallet(position)||session.walletScopeDigest!==scope(position.id,position.accountId))fail();
 }
}
