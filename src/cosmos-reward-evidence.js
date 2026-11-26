import {sourceDigest} from './import-identity.js';
import {replayWalletHistory,validateHistoryEvent} from './wallet-history-core.js';

// The public block receipts and independent bank snapshots were reconciled for
// each supported Cosmos Hub reference.
const proofs=[{
 address:'cosmos1nx3yrqs5v5wz9yygplleswu5tn9e4r8zcgncar',
 height:'34044337',
 hash:'E10789421CF97190A442B20E563DF6BBE597884CA095C55A98C3751E84FFCE60',
 txid:'F0F894B8B64F022FAFCBED0C0CC87F9F8E7EBABDB79DF4CBEBF4553F02B9569D',
 time:'2026-11-25T15:56:52.293Z',
 capturedAt:'2026-11-25T17:00:00.000Z',
 before:'281159',
 rewards:[['11','536836']],
 fee:'2599',
 tip:'4224',
 after:'811172'
},{
 address:'cosmos1tyqmer8ul0l7msewx82wnhu9f0kswd79hxh6ee',
 height:'34048131',
 hash:'F852636DAE787A5FC910E23E938D03403F620C38DC1206D2764B923EFBAB0CB0',
 txid:'A4D60F019289A8AA924B55FB34971CC55FC4A51402E8743291161D6276790D7E',
 time:'2026-11-25T21:53:29.980Z',
 capturedAt:'2026-11-26T13:53:15.000Z',
 before:'2529318',
 rewards:[['11','614783'],['17','614783'],['23','614783'],['29','614721']],
 fee:'8887',
 tip:'7120',
 after:'4972381'
}];
for(const proof of proofs){
 for(const reward of proof.rewards)Object.freeze(reward);
 Object.freeze(proof.rewards);
 Object.freeze(proof);
}
const fail=()=>{throw Error('Cosmos-Beleg hat keine bestätigte ATOM-Position oder Blockhöhe.');};
export function cosmosRewardProof(p){
 if(p?.kind==='crypto'&&p.valuationMode!=='excluded'&&p.coinId==='cosmos'&&p.symbol==='ATOM'&&p.wallet?.enabled===true&&
  p.wallet.chain==='cosmos'&&p.wallet.decimals===6&&!p.wallet.contract)return proofs.find(proof=>proof.address===p.wallet.address);
}
export function cosmosRewardWallet(p){
 return Boolean(cosmosRewardProof(p));
}
const scope=(positionId,accountId,address)=>sourceDigest(JSON.stringify([positionId,accountId,'cosmoshub-4',address,'uatom']));

function evidence(proof,positionId,accountId){
 const identity={network:'cosmos',chainId:'cosmoshub-4',accountId,assetId:'uatom',contract:null,mint:null};
 const event={...identity,walletId:proof.address,txid:proof.txid,blockHeight:proof.height,blockHash:proof.hash,
  txIndex:'0',timestamp:proof.time,decimals:6,source:'cosmos-rpc.polkachu.com',status:'confirmed',
  finality:'finalized',observedAt:proof.capturedAt,coverage:'verified',qualityCode:'block-and-bank-reconciled'};
 const events=[
  validateHistoryEvent({...event,type:'fee',quantityBaseUnits:(-BigInt(proof.fee)-BigInt(proof.tip)).toString(),locator:{kind:'fee',index:'0',subindex:'0'}}),
  ...proof.rewards.map(([index,amount])=>validateHistoryEvent({...event,type:'staking_reward',quantityBaseUnits:amount,
   locator:{kind:'log',index,subindex:'0'}}))
 ];
 const streams=[{...identity,decimals:6,throughBlock:proof.height,
  opening:{quantityBaseUnits:proof.before,beforeBlock:proof.height,source:'bank-state-at-parent'},
  coverage:{status:'verified',fromBlock:proof.height,toBlock:proof.height,tipHash:proof.hash,source:'block-results'}}];
 const [balance]=replayWalletHistory({events,streams}).balances;
 if(balance.coverage!=='verified'||balance.quantityBaseUnits!==proof.after)fail();
 return {id:'wallet-history:'+positionId,chain:'cosmos',walletKey:positionId,walletScopeDigest:scope(positionId,accountId,proof.address),
  events,streams,quotes:[],issues:[]};
}

export function cosmosRewardPreview(model,positionId,height){
 const position=model.positions.find(p=>p.id===positionId);
 const proof=cosmosRewardProof(position);
 if(!proof||height!==proof.height)fail();
 return {...evidence(proof,position.id,position.accountId),acceptedAt:new Date().toISOString()};
}

export function validateCosmosRewardSession(record){
 const proof=proofs.find(proof=>proof.address===record.events[0]?.walletId);
 if(!proof||record.streams.length!==1)fail();
 const expected=evidence(proof,record.walletKey,record.streams[0].accountId);
 for(const key of Object.keys(expected)){
  if(JSON.stringify(record[key])!==JSON.stringify(expected[key]))fail();
 }
}

export function validateCosmosHistoryPositions(history,positions){
 for(const session of history?.sessions??[]){
  if(session.chain!=='cosmos')continue;
  const position=positions.find(p=>p.id===session.walletKey);
  const proof=cosmosRewardProof(position);
  if(!proof||session.walletScopeDigest!==scope(position.id,position.accountId,proof.address))fail();
 }
}
