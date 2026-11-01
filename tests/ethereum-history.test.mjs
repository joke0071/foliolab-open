import test from 'node:test';import assert from 'node:assert/strict';
import {ethereumHistoryEvents,fetchEthereumHistory,validateEthereumCursor} from '../src/ethereum-history.js';
import {A,B,T,H,now,wallets,tokens,fixture,transaction,transfer,provider,openings} from './ethereum-history-fixtures.mjs';
const options={wallets,tokens,openings,observedAt:now,retryDelayMs:0};
const cursors={transactions:{index:1,block_number:10,items_count:50,fee:null,value:'900719925474099300000000001',inserted_at:'2023-11-14T22:13:20.123456Z',hash:H(1)},'token-transfers':{items_count:50,batch_log_index:0,batch_block_hash:H(10),batch_transaction_hash:H(1),index_in_batch:'2'}};
test('Official transaction and token-batch cursors retain exact large strings/nulls without changing events',async()=>{
 const p=provider({cursors}),r=await fetchEthereumHistory({...options,fetcher:p.fetcher});
 assert.ok(r.replay);assert.equal(r.replay.balances.find(b=>b.contract===T).quantityBaseUnits,'7');assert.equal(r.events.length,2);
 const next=p.calls.map(c=>new URL(c.url)).find(u=>u.pathname.endsWith('/transactions')&&u.searchParams.has('index'));
 assert.equal(next.searchParams.get('fee'),'null');assert.equal(next.searchParams.get('value'),cursors.transactions.value);assert.equal(next.searchParams.get('inserted_at'),cursors.transactions.inserted_at);
 assert.ok(p.calls.some(c=>new URL(c.url).searchParams.get('index_in_batch')==='2'));
 let resumed=await fetchEthereumHistory({...options,maxPages:1,fetcher:provider({cursors}).fetcher});let rounds=0;
 while(resumed.resume&&rounds++<8)resumed=await fetchEthereumHistory({...options,maxPages:1,fetcher:provider({cursors}).fetcher,resume:resumed.resume});
 assert.deepEqual(resumed.events,r.events);assert.ok(resumed.replay);
});
test('Cursor endpoint/type limits reject unknown fields, unsafe numbers, query strings and wrong hashes',()=>{
 for(const [kind,cursor]of [['transactions',{index:1,index_in_batch:2}],['internal-transactions',{index:1,fee:'2'}],['token-transfers',{index:1,redirect:'https://untrusted.invalid'}],['transactions',{index:-1}],['transactions',{index:Number.MAX_SAFE_INTEGER+1}],['transactions',{index:'1&apikey=secret'}],['transactions',{index:1,hash:'0x123'}],['transactions',{index:1,fee:{value:'1'}}],['transactions',{index:1,inserted_at:'invalid'}],['token-transfers',{index_in_batch:'9'.repeat(101)}]])assert.throws(()=>validateEthereumCursor(cursor,kind),/provider-cursor-format-changed/);
 assert.deepEqual(validateEthereumCursor({index:'1',block_number:null,fee:null,value:'0',hash:H(1),inserted_at:cursors.transactions.inserted_at},'transactions').fee,null);
});
test('An early network checkpoint has initialized jobs; an old empty checkpoint safely restarts in the same scope',async()=>{
 const first=await fetchEthereumHistory({...options,fetcher:async()=>{throw TypeError('Failed to fetch');}});
 assert.deepEqual(first.issues,['network']);assert.equal(first.restartRequired,false);assert.equal(first.resume.jobs.length,3);
 const old=structuredClone(first.resume);old.jobs=[];
 const recovered=await fetchEthereumHistory({...options,fetcher:provider().fetcher,resume:old});assert.ok(recovered.replay);
 const bad=structuredClone(first.resume);bad.jobs=[];bad.tip={hash:H(10),number:'0xa'};
 const rejected=await fetchEthereumHistory({...options,fetcher:provider().fetcher,resume:bad});assert.equal(rejected.restartRequired,true);assert.equal(rejected.resume,null);
});
test('Unsupported or cycling cursors and changed retained pages are restart-only, never partial import previews',async()=>{
 const p=provider({cursors:{'token-transfers':{index:1,unexpected:'SYNTHETIC_PRIVATE_VALUE'}}}),r=await fetchEthereumHistory({...options,fetcher:p.fetcher});
 assert.equal(r.resume,null);assert.equal(r.restartRequired,true);assert.equal(r.replay,null);assert.deepEqual(r.issues,['provider-cursor-format-changed']);assert.equal(r.sourceSection,'token-transfers');
 assert.ok(!JSON.stringify(r).includes('SYNTHETIC_PRIVATE_VALUE'));assert.ok(!p.calls.some(c=>c.url.includes('unexpected=')));
 const first=await fetchEthereumHistory({...options,maxPages:1,fetcher:provider({pages:true}).fetcher});first.resume.jobs[0].items[0].value='999';
 const mutated=await fetchEthereumHistory({...options,fetcher:provider({pages:true}).fetcher,resume:first.resume});assert.equal(mutated.resume,null);assert.equal(mutated.restartRequired,true);
});
test('ETH plus ERC20 use exact receipt-backed values and preserve two log indices',()=>{
 const f=fixture(),l=transfer(1,{value:'123456789012345678901234567890'});f.transfers.push(l.item);f.evidence[H(1)].receipt.logs.push(l.log);
 const r=ethereumHistoryEvents(f);assert.deepEqual(r.issues,[]);assert.equal(r.events.length,3);assert.ok(r.events.some(e=>e.quantityBaseUnits===l.item.total.value));assert.deepEqual(JSON.parse(JSON.stringify(r)),r);
});
test('failed sender is fee-only and successful self-send has net zero transfer',()=>{
 const t=transaction(1,{from:A,to:A,success:false});const r=ethereumHistoryEvents({wallets,transactions:[t.tx],evidence:{[H(1)]:t.evidence},observedAt:now});assert.equal(r.events.length,1);assert.equal(r.events[0].type,'fee');assert.equal(r.events[0].quantityBaseUnits,'-6');
 t.evidence.receipt.status='0x1';t.tx.status='ok';const success=ethereumHistoryEvents({wallets,transactions:[t.tx],evidence:{[H(1)]:t.evidence},observedAt:now});assert.equal(success.events.filter(e=>e.type==='internal_transfer').reduce((s,e)=>s+BigInt(e.quantityBaseUnits),0n),0n);
});
test('own-wallet aliases, repeated endpoints and embedded transfers dedupe',()=>{
 const f=fixture();f.transactions[0].token_transfers=f.transfers;f.transfers.push({...f.transfers[0]});f.wallets=[...wallets,{address:A.toUpperCase().replace('0X','0x'),accountId:'b'}];const r=ethereumHistoryEvents(f);assert.equal(r.events.length,2);assert.equal(r.aliases.length,1);assert.deepEqual(r.issues,[]);
});
test('unknown contract, mismatched decimals, receipt/log provenance and rebasing stay partial',()=>{
 for(const mutate of [f=>f.tokens=[],f=>f.tokens[0].decimals=6,f=>f.evidence[H(1)].receipt.logs[0].removed=true,f=>f.evidence[H(1)].receipt.logs[0].data='0x99',f=>f.tokens[0].balanceModel='rebase']){const f=structuredClone(fixture());mutate(f);assert.ok(ethereumHistoryEvents(f).issues.length);}
});
test('internal trace requires successful parent, stable index and matching provenance; root not doubled',()=>{
 const f=fixture(),base={transaction_hash:H(1),block_number:10,timestamp:'2023-11-14T22:13:20.000000Z',from:{hash:B},to:{hash:A},value:'100',success:true,error:null,type:'call'};
 f.internals=[{...base,index:0},{...base,index:1,value:'2'}];const r=ethereumHistoryEvents(f);assert.equal(r.events.filter(e=>e.locator.kind==='instruction').length,1);assert.deepEqual(r.issues,[]);
 f.internals[1].timestamp='2023-11-13T22:13:20Z';assert.ok(ethereumHistoryEvents(f).issues.includes('internal-provenance-missing'));
});
test('actual gas fee conflict and reorg are never hidden',()=>{
 const f=fixture();f.transactions[0].from.hash=A;f.evidence[H(1)].transaction.from=A;f.transactions[0].fee.value='7';assert.ok(ethereumHistoryEvents(f).issues.includes('fee-conflict'));
 const g=fixture();g.evidence[H(1)].block.hash=H(20);assert.ok(ethereumHistoryEvents(g).issues.includes('reorg'));
});
test('Blockscout next_page_params are followed, token checkpoint reconciles, native limits explicit',async()=>{
 const p=provider({pages:true}),r=await fetchEthereumHistory({...options,fetcher:p.fetcher});assert.ok(r.replay,JSON.stringify(r.issues));assert.equal(r.replay.balances.find(b=>b.contract===T).quantityBaseUnits,'7');assert.equal(r.replay.balances.find(b=>!b.contract).quantityBaseUnits,null);assert.ok(r.issues.includes('native-protocol-credits-uncovered'));assert.ok(p.calls.some(c=>c.url.includes('index=1')));
 const again=await fetchEthereumHistory({...options,fetcher:provider({pages:true}).fetcher});assert.deepEqual(r.events,again.events);
});
test('page budget, safe replay resume and scope binding',async()=>{
 const p=provider({pages:true}),first=await fetchEthereumHistory({...options,fetcher:p.fetcher,maxPages:1});assert.deepEqual(first.issues,['page-limit']);assert.ok(first.resume);
 const resumed=await fetchEthereumHistory({...options,fetcher:p.fetcher,resume:first.resume});assert.ok(resumed.replay,JSON.stringify(resumed.issues));
 await assert.rejects(fetchEthereumHistory({...options,chainId:137}));await assert.rejects(fetchEthereumHistory({...options,wallets:[{accountId:'other',address:A}],resume:first.resume}));
});
test('HTTP errors, recovery, CORS and fetch/body timeout never yield zero',async()=>{
 for(const status of [403,429,500]){const p=provider({status}),r=await fetchEthereumHistory({...options,fetcher:p.fetcher});assert.equal(Boolean(r.replay),status!==403);if(status===403)assert.deepEqual(r.issues,['http-403']);}
 for(const [i,fetcher] of [async()=>{throw TypeError('CORS');},()=>new Promise(()=>{}),async()=>({ok:true,json:()=>new Promise(()=>{})})].entries()){const r=await fetchEthereumHistory({...options,fetcher,timeoutMs:10});assert.equal(r.replay,null);assert.equal(r.coverage,'partial');if(i>0)assert.deepEqual(r.issues,['timeout']);}
});
test('AbortSignal, provider internals failure, scanner mismatch and unfinalized/reorg quality',async()=>{
 const c=new AbortController();c.abort();const a=await fetchEthereumHistory({...options,signal:c.signal,fetcher:provider().fetcher});assert.deepEqual(a.issues,['aborted']);
 for(const config of [{internalsFail:true},{reorg:true},{mismatch:true}]){const r=await fetchEthereumHistory({...options,fetcher:provider(config).fetcher});assert.equal(r.coverage,'partial');assert.ok(!r.replay||r.replay.balances.every(b=>b.quantityBaseUnits===null));}
 const r=await fetchEthereumHistory({...options,openings:[],fetcher:provider().fetcher});assert.ok(r.replay.balances.every(b=>b.quantityBaseUnits===null));
});
test('failed token/internal rows cannot introduce phantom credits',()=>{
 const f=fixture();f.evidence[H(1)].receipt.status='0x0';const r=ethereumHistoryEvents(f);assert.equal(r.events.length,0);assert.ok(r.issues.includes('failed-transfer-suppressed'));
});
test('24-decimal raw token values stay exact and conflicting duplicate logs quarantine',()=>{
 const f=fixture();f.tokens[0].decimals=24;f.transfers[0].token.decimals='24';f.transfers[0].total.decimals='24';assert.equal(ethereumHistoryEvents(f).events.find(e=>e.contract).quantityBaseUnits,'7');
 const g=fixture();const duplicate=structuredClone(g.transfers[0]);duplicate.total.value='8';g.transfers.push(duplicate);assert.ok(ethereumHistoryEvents(g).issues.includes('log-value-conflict'));
});
test('blob fees and unknown token models never understate gas or assert completeness',()=>{
 const f=fixture();f.transactions[0].from.hash=A;const e=f.evidence[H(1)];e.transaction.from=A;e.transaction.type='0x3';e.receipt.blobGasUsed='0x2';e.receipt.blobGasPrice='0x3';f.transactions[0].fee.value='12';const r=ethereumHistoryEvents(f);assert.equal(r.events.find(e=>e.type==='fee').quantityBaseUnits,'-12');
 delete e.receipt.blobGasPrice;assert.ok(ethereumHistoryEvents(f).issues.includes('missing-blob-fee'));
});
test('nonadvancing cursors, corrupted provider metadata and cancelled fetch are partial',async()=>{
 const p=provider({pages:true});const r=await fetchEthereumHistory({...options,fetcher:async(u,o)=>{const response=await p.fetcher(u,o);if(u.includes('/token-transfers'))return {ok:true,json:async()=>({items:[fixture().transfers[0]],next_page_params:{index:1}})};return response;}});assert.deepEqual(r.issues,['nonadvancing-cursor']);
 const c=new AbortController();setTimeout(()=>c.abort(),5);const a=await fetchEthereumHistory({...options,signal:c.signal,fetcher:()=>new Promise(()=>{})});assert.deepEqual(a.issues,['aborted']);
});

test('resume makes progress with the SAME one-page budget and rejects edited retained rows',async()=>{
 const p=provider({pages:true});let result=await fetchEthereumHistory({...options,maxPages:1,fetcher:p.fetcher});let rounds=0;
 while(result.resume&&rounds++<5)result=await fetchEthereumHistory({...options,maxPages:1,fetcher:p.fetcher,resume:result.resume});
 assert.ok(result.replay,JSON.stringify(result.issues));assert.equal(result.replay.balances.find(b=>b.contract===T).quantityBaseUnits,'7');
 const first=await fetchEthereumHistory({...options,maxPages:1,fetcher:provider({pages:true}).fetcher});first.resume.jobs[0].items[0].value='999';
 const corrupted=await fetchEthereumHistory({...options,fetcher:provider({pages:true}).fetcher,resume:first.resume});assert.equal(corrupted.replay,null);assert.deepEqual(corrupted.issues,['cursor-provider-changed']);
});
test('transfer between two own wallets is neutral except one actual gas fee',()=>{
 const t=transaction(1,{from:A,to:B});const r=ethereumHistoryEvents({wallets:[{accountId:'a',address:A},{accountId:'b',address:B}],transactions:[t.tx],evidence:{[H(1)]:t.evidence},observedAt:now});
 assert.deepEqual(r.issues,[]);assert.equal(r.events.filter(e=>e.type==='fee').length,1);assert.equal(r.events.reduce((sum,e)=>sum+BigInt(e.quantityBaseUnits),0n),-6n);assert.equal(r.events.filter(e=>e.type==='internal_transfer').length,2);
});
test('unfinalized receipt and wrong RPC chain cannot produce verified balances',async()=>{
 for(const wrongChain of [true,false]){
  const p=provider(),r=await fetchEthereumHistory({...options,fetcher:async(u,o)=>{
   const d=await p.fetcher(u,o);if(o?.body){const req=JSON.parse(o.body);if(wrongChain&&req.method==='eth_chainId')return {ok:true,json:async()=>({result:'0x2'})};if(!wrongChain&&req.method==='eth_getTransactionReceipt'){const value=await d.json();value.result.blockNumber='0xb';return {ok:true,json:async()=>value};}}return d;
  }});
  if(wrongChain)assert.deepEqual(r.issues,['wrong-chain']);else assert.ok(r.issues.includes('unfinalized-events'));
  assert.ok(!r.replay||r.replay.balances.every(b=>b.quantityBaseUnits===null));
 }
});
