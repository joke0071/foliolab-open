import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [productCheckout, responseDirectory] = process.argv.slice(2);
const {replayWalletHistory, reconcileWalletHistory} = await import(pathToFileURL(resolve(productCheckout, 'src/wallet-history-core.js')).href);
const read = name => JSON.parse(readFileSync(resolve(responseDirectory, name), 'utf8')).result;
const sha = bytes => createHash('sha256').update(bytes).digest('hex').toUpperCase();
const height = '34048131';
const parent = '34048130';
const expectedStart = '2529318';
const expectedEnd = '4972381';
const account = 'cosmos1tyqmer8ul0l7msewx82wnhu9f0kswd79hxh6ee';
const validators = [
 ['11', '614783'],
 ['17', '614783'],
 ['23', '614783'],
 ['29', '614721']
];
const txid = 'A4D60F019289A8AA924B55FB34971CC55FC4A51402E8743291161D6276790D7E';
const blockHash = 'F852636DAE787A5FC910E23E938D03403F620C38DC1206D2764B923EFBAB0CB0';
const network = 'cosmos';
const identity = {network, chainId: 'cosmoshub-4', accountId: account, assetId: 'uatom'};
const timestamp = '2026-11-25T21:53:29.980Z';
const observedAt = '2026-11-25T22:18:00.000Z';
const byKey = e => Object.fromEntries(e.attributes.map(a => [a.key,a.value]));
const amount = value => { assert.match(value, /^\d+uatom$/); return value.slice(0, -5); };

function archivedBalance(host, at) {
 const result = read(host+'-'+at+'.json').response;
 assert.equal(result.height, at);
 assert.equal(result.code, 0);
 const value = Buffer.from(result.value, 'base64');
 assert.equal(value[1] + 2, value.length);
 assert.equal(value[10] + 11, value.length);
 assert.equal(value[0], 0x0a);
 assert.equal(value.subarray(2, 10).toString('hex'), '0a057561746f6d12');
 const quantity = value.subarray(11).toString('ascii');
 assert.match(quantity, /^\d+$/);
 return quantity;
}

function eventsFor(source, label){
 const chain = read(label+'-block.json');
 assert.equal(chain.block.header.height, height);
 assert.equal(chain.block.header.chain_id, identity.chainId);
 assert.equal(chain.block_id.hash, blockHash);
 assert.equal(chain.block.data.txs.length, 1);
 assert.equal(sha(Buffer.from(chain.block.data.txs[0], 'base64')), txid);
 const receipts = read(label+'-receipts.json');
 assert.equal(receipts.height, height);
 assert.equal(receipts.txs_results.length, 1);
 assert.equal(receipts.txs_results[0].code, 0);
 const events = receipts.txs_results[0].events;
 const payout = events.flatMap((event, index) => {
  if (event.type !== 'withdraw_rewards') return [];
  const {delegator, msg_index, amount: received} = byKey(event);
  assert.equal(delegator, account);
  const [credit] = events.filter(e => e.type==='coin_received' && byKey(e).msg_index===msg_index && byKey(e).receiver===account);
  assert.equal(byKey(credit).amount, received);
  return [[String(index), amount(received)]];
 });
 assert.deepEqual(payout, validators);
 const debits = events.filter(e => e.type === 'coin_spent' && byKey(e).spender === account).map(e => amount(byKey(e).amount));
 assert.deepEqual(debits, ['16007']);
 const tipping = events.find(e => e.type === 'tip_pay');
 assert.equal(byKey(tipping).tip, '7120uatom');
 const protocol = events.find(e => e.type === 'fee_pay');
 assert.equal(byKey(protocol).fee, '8887uatom');
 const accountReceipts = events.filter(e => e.type === 'coin_received' && byKey(e).receiver === account);
 assert.equal(accountReceipts.length, 4);
 const base = {...identity, walletId:account, txid, blockHash, txIndex:'0', blockHeight:height, timestamp, observedAt,
  decimals:6, source, status:'confirmed', finality:'finalized', coverage:'verified', qualityCode:'block-and-bank-reconciled'};
 return [
  {...base,type:'fee',quantityBaseUnits:'-'+debits[0],locator:{kind:'fee',index:'0',subindex:'0'}},
  ...payout.map(([index, quantityBaseUnits]) => ({...base,type:'staking_reward',quantityBaseUnits,locator:{kind:'log',index,subindex:'0'}}))
 ];
}

const operators = [['cosmos-rpc.polkachu.com', 'polkachu'], ['cosmoshub.rpc.kjnodes.com', 'kjnodes']];
const events = operators.flatMap(([host, label]) => {
 assert.equal(archivedBalance(host, parent), expectedStart);
 assert.equal(archivedBalance(host, height), expectedEnd);
 return eventsFor(host, label);
});
const stream = {...identity, decimals:6, throughBlock:height,
 opening:{quantityBaseUnits:expectedStart,beforeBlock:height,source:'confirmed exact-height bank state at parent'},
 coverage:{status:'verified',fromBlock:height,toBlock:height,tipHash:blockHash,source:'independent complete block results'}};
const proof = replayWalletHistory({events:[...events, ...events.slice().reverse()],streams:[stream]});
assert.equal(proof.events.length, 5);
assert.equal(proof.events.filter(e=>e.type==='staking_reward' && e.quantityBaseUnits==='614783').length, 3);
assert.equal(proof.conflicts.length, 0);
assert.equal(proof.balances[0].quantityBaseUnits, expectedEnd);
assert.equal(proof.balances[0].knownDeltaBaseUnits, '2443063');
const actual = reconcileWalletHistory(proof,[{...identity, blockHeight:height,blockHash,decimals:6,
 quantityBaseUnits:expectedEnd,source:'confirmed exact-height bank state'}]);
assert.equal(actual[0].status,'verified');
assert.equal(actual[0].differenceBaseUnits,'0');

const tampered = {...events[1],quantityBaseUnits:'614784'};
const conflicting = replayWalletHistory({events:[...events,tampered],streams:[stream]});
assert.equal(conflicting.conflicts.length,1);
assert.equal(conflicting.balances[0].quantityBaseUnits,null);
assert.equal(conflicting.balances[0].coverage,'error');
console.log(JSON.stringify({ block:height, exactClosingBalance:expectedEnd, netDeltaMicroATOM:'2443063', distinctEvents:5,
  stableWithRepeatedInput:true, rejectsConflict:true, matchesIndependentOperators:true }));
