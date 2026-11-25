import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const evidence=JSON.parse(await readFile(new URL('./sw340-cosmos-paid-reward-2026-11-25.json',import.meta.url)));
const [captures,product]=process.argv.slice(2);
const fromProduct=path=>import(pathToFileURL(resolve(product,'src',path)));
const {replayWalletHistory,reconcileWalletHistory}=await fromProduct('wallet-history-core.js');
const {acceptHistory}=await fromProduct('wallet-history-state.js');
const {previewCSV,parseCSV,inferMapping}=await fromProduct('csv-import.js');
const {blankModel,createProvider,createAccount,createPosition}=await fromProduct('model.js');
const hash=(bytes)=>createHash('sha256').update(bytes).digest('hex');
const json=async label=>{
 const bytes=await readFile(resolve(captures,label+'.json'));
 assert.equal(hash(bytes),evidence.digests[label],label);
 return JSON.parse(bytes);
};
const {blockHash,transactionHash,height,transactionIndex,account,validator,chain}=evidence;
const transactionResult=doc=>doc.result.txs.find(tx=>tx.hash===transactionHash);
const value=event=>Object.fromEntries(event.attributes.map(({key,value})=>[key,value]));
const single=(events,predicate)=>{
 const matches=events.filter(predicate);
 assert.equal(matches.length,1);
 return matches[0];
};
const searches=await Promise.all(evidence.providers.rpcs.map(json));
const tx=transactionResult(searches[0]);
for(const result of searches)assert.deepEqual(transactionResult(result),tx);
assert.equal(tx.height,height);
assert.equal(tx.index,transactionIndex);
assert.equal(hash(Buffer.from(tx.tx,'base64')),transactionHash.toLowerCase());
assert.equal(tx.tx_result.code,0);
const positionEvents=(result,id)=>result.events.map((e,index)=>({index,type:e.type,...value(e)}))
 .filter(e=>Object.values(e).includes(id));
const movement=positionEvents(tx.tx_result,account);
assert.deepEqual(movement.filter(e=>e.type==='coin_received').map(e=>[e.index,e.msg_index,e.amount]),[[8,'0','536836uatom']]);
assert.deepEqual(movement.filter(e=>e.type==='coin_spent').map(e=>[e.index,e.msg_index??null,e.amount]),[[2,null,'6823uatom']]);
const reward=single(movement,e=>e.type==='withdraw_rewards');
assert.deepEqual([reward.index,reward.msg_index,reward.validator,reward.amount],[11,'0',validator,'536836uatom']);
const fees=tx.tx_result.events.map((e,index)=>({index,type:e.type,...value(e)}));
assert.deepEqual(fees.filter(e=>e.type==='fee_pay'||e.type==='tip_pay').map(e=>[e.index,e.fee??e.tip]),[[16,'2599uatom'],[17,'4224uatom']]);
for(const rpc of evidence.providers.rpcs.slice(0,2)){
 const block=(await json(rpc+'-block')).result,receipts=(await json(rpc+'-block-results')).result;
 assert.equal(block.block_id.hash,blockHash);
 assert.equal(block.block.header.chain_id,chain);
 assert.equal(block.block.header.height,height);
 assert.equal(block.block.header.time,evidence.time);
 assert.equal(block.block.data.txs[transactionIndex],tx.tx);
 assert.equal(receipts.height,height);
 const receipt=receipts.txs_results[transactionIndex];
 assert.deepEqual(receipt.events,tx.tx_result.events);
 assert.equal(receipt.code,0);
 assert.equal(receipts.txs_results.flatMap(r=>positionEvents(r,account)).filter(e=>['coin_received','coin_spent'].includes(e.type)).length,2);
 assert.equal(positionEvents({events:receipts.finalize_block_events},account).filter(e=>['coin_received','coin_spent'].includes(e.type)).length,0);
}
const {bankBeforeMicroATOM,bankAfterMicroATOM,paidRewardMicroATOM,feeMicroATOM}=evidence.expected;
for(const lcd of evidence.providers.lcds)for(const [at,quantity] of [[(BigInt(height)-1n).toString(),bankBeforeMicroATOM],[height,bankAfterMicroATOM]]){
 const label=lcd+'-bank-'+at,headers=await readFile(resolve(captures,label+'.headers'),'utf8');
 assert.equal(headers.match(/^x-cosmos-block-height:\s*(\d+)/im)?.[1],at);
 assert.deepEqual((await json(label)).balance,{denom:'uatom',amount:quantity});
}
assert.equal(BigInt(bankBeforeMicroATOM)+BigInt(paidRewardMicroATOM)-BigInt(feeMicroATOM),BigInt(bankAfterMicroATOM));
assert.equal(2599n+4224n,BigInt(feeMicroATOM));

const identity={network:'cosmos',chainId:chain,accountId:account,assetId:'uatom'};
const common={...identity,walletId:account,txid:transactionHash,blockHeight:height,blockHash,txIndex:String(transactionIndex),
 timestamp:new Date(evidence.time).toISOString(),decimals:6,source:'cosmos-rpc.publicnode.com',status:'confirmed',finality:'finalized',
 observedAt:'2026-11-25T17:00:00.000Z',coverage:'verified',qualityCode:'block-and-bank-reconciled'};
const events=[
 {...common,locator:{kind:'log',index:String(reward.index),subindex:reward.msg_index},quantityBaseUnits:paidRewardMicroATOM,type:'staking_reward'},
 {...common,locator:{kind:'fee',index:'0',subindex:'0'},quantityBaseUnits:'-'+feeMicroATOM,type:'fee'}
];
const stream={...identity,decimals:6,throughBlock:height,
 opening:{quantityBaseUnits:bankBeforeMicroATOM,beforeBlock:height,source:'bank-state-at-parent'},
 coverage:{status:'verified',fromBlock:height,toBlock:height,tipHash:blockHash,source:'block-results'}};
const [observed]=[{...identity,quantityBaseUnits:bankAfterMicroATOM,blockHeight:height,blockHash,decimals:6,source:'bank-state-at-block'}];
const exactReplay=replayWalletHistory({events,streams:[stream]});
const repeated=replayWalletHistory({events:[...events,...events],streams:[stream]});
assert.deepEqual(repeated,exactReplay);
assert.equal(repeated.events.length,2);
assert.equal(reconcileWalletHistory(repeated,[observed])[0].status,'verified');
const falseOpening={...stream,opening:{...stream.opening,quantityBaseUnits:bankAfterMicroATOM}};
const doubleCount=reconcileWalletHistory(replayWalletHistory({events,streams:[falseOpening]}),[observed])[0];
assert.deepEqual([doubleCount.status,doubleCount.differenceBaseUnits],['mismatch','530013']);

const portfolio=blankModel();
const provider=createProvider({id:'cosmos-public-fixture',name:'Public Cosmos case',type:'wallet'});
portfolio.providers.push(provider);
const local=createAccount({id:'cosmos-test-wallet',providerId:provider.id,name:'Public fixture',type:'wallet'},portfolio);
portfolio.accounts.push(local);
portfolio.positions.push(createPosition({id:'atom-liquid',name:'ATOM',kind:'crypto',providerId:provider.id,accountId:local.id,
 quantity:'0.811172',price:'0',wallet:{enabled:true,chain:'cosmos',address:account}},portfolio));
const unchanged=JSON.stringify(portfolio);
assert.throws(()=>acceptHistory(portfolio,{id:'cosmos-public',chain:'cosmos',events,streams:[stream]}),/Historie ist ungültig/);
const csv=parseCSV('date;type;position;quantity;id\n2026-11-25;reward;atom-liquid;0.536836;'+transactionHash);
const preview=previewCSV(portfolio,csv,inferMapping(csv.headers));
assert.equal(preview.ready,0);
assert.match(preview.issues[0].message,/Automatisch gescannte Wallet-Bestände sind nicht manuell buchbar/);
assert.equal(JSON.stringify(portfolio),unchanged);

console.log(JSON.stringify({sourceEvidence:evidence.transactionHash,block:height,blockHash,atom:evidence.expected,
 debits:{protocolFeeMicroATOM:'2599',tipMicroATOM:'4224',payerTotalMicroATOM:'6823'},
 eventIndices:{payerDebit:2,recipientCredit:8,reward:11,fee:16,tip:17},
 oneBlockReadOnlyReplay:{events:repeated.events.length,dedupedIdentities:repeated.events.map(e=>e.id),
  endingMicroATOM:repeated.balances[0].quantityBaseUnits,independentReconciliation:'verified',
  postBalanceAsOpeningMismatchMicroATOM:doubleCount.differenceBaseUnits},
 productWrite:{acceptedHistory:false,acceptedGenericCSV:false,portfolioUnchanged:true}},null,2));
