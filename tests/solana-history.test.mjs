import test from 'node:test';import assert from 'node:assert/strict';
import {solanaHistoryEvents,fetchSolanaHistory} from '../src/solana-history.js';
import {solanaRpcRead} from '../src/solana-rpc.js';
import {transaction,provider,wallets,SIG,A,B,HASH} from './solana-history-fixtures.mjs';
const opts={wallets,configured:'https://archive.test/?api-key=secret',observedAt:'2026-10-24T12:00:00.000Z'};
test('WH06 exact SOL movement and fee; failed is fee-only',()=>{
 const ok=solanaHistoryEvents([transaction()],wallets);assert.deepEqual(ok.events.map(e=>e.quantityBaseUnits).sort(),['-10','-5']);
 const fail=solanaHistoryEvents([transaction(1,{failed:true})],wallets);assert.equal(fail.events.length,1);assert.equal(fail.events[0].type,'fee');assert.equal(fail.events[0].quantityBaseUnits,'-5');
});
test('WH06 v0 loaded accounts, exact SPL24 amounts, closed/unknown owner and Token2022 conservative',()=>{
 const r=solanaHistoryEvents([transaction(1,{tokens:true,version0:true})],wallets);assert.equal(r.events.find(e=>e.mint).quantityBaseUnits,'7');assert.ok(r.issues.includes('closed-token-accounts-may-be-missing'));
 for(const flags of [{tokens:true,closed:true},{tokens:true,unknownOwner:true}]){const r=solanaHistoryEvents([transaction(1,flags)],wallets);assert.ok(r.issues.length);assert.equal(r.events.filter(e=>e.mint).length,0);}
 const t=transaction(1,{tokens:true});t.meta.postTokenBalances[0].programId='TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';assert.ok(solanaHistoryEvents([t],wallets).issues.includes('token-program-or-extension-unknown'));
});
test('WH06 duplicates, own transfers and unsafe balances',()=>{
 const t=transaction();const r=solanaHistoryEvents([t,t],[...wallets,{accountId:'b',address:B}]);assert.equal(r.events.reduce((n,e)=>n+BigInt(e.quantityBaseUnits),0n),-5n);
 t.meta.preBalances[0]=Number.MAX_SAFE_INTEGER+1;assert.throws(()=>solanaHistoryEvents([t],wallets));
});
test('WH06 finalized scan reconciliation and archive gaps never invented zero',async()=>{
 const r=await fetchSolanaHistory({...opts,fetcher:provider().fetcher});assert.ok(r.replay,JSON.stringify(r.issues));assert.equal(r.replay.balances[0].quantityBaseUnits,'85');assert.equal(r.coverage,'verified');assert.ok(!JSON.stringify(r).includes('secret'));
 const gap=await fetchSolanaHistory({...opts,fetcher:provider({nullTx:true}).fetcher});assert.equal(gap.coverage,'partial');assert.ok(gap.issues.includes('archive-gap'));assert.equal(gap.replay.balances[0].quantityBaseUnits,null);
});
test('WH06 bounded pages, resume and abort preserve safe checkpoint',async()=>{
 const p=provider({transactions:[transaction(),transaction(2)]});const first=await fetchSolanaHistory({...opts,pageSize:1,maxPages:1,fetcher:p.fetcher});assert.deepEqual(first.issues,['page-limit']);
 const result=await fetchSolanaHistory({...opts,pageSize:1,fetcher:p.fetcher,resume:first.resume});assert.ok(result.replay,JSON.stringify(result.issues));
 const c=new AbortController();c.abort();const cancelled=await fetchSolanaHistory({...opts,signal:c.signal,fetcher:p.fetcher});assert.deepEqual(cancelled.issues,['aborted']);
 await assert.rejects(fetchSolanaHistory({...opts,pageSize:2,fetcher:p.fetcher,resume:first.resume}));
});
test('WH06 provider failures, timeout and whitelist',async()=>{
 for(const status of [403,429,500]){const r=await fetchSolanaHistory({...opts,fetcher:provider({status}).fetcher});assert.equal(Boolean(r.replay),status!==403);}
 const timeout=await fetchSolanaHistory({...opts,timeoutMs:10,fetcher:()=>new Promise(()=>{})});assert.deepEqual(timeout.issues,['timeout']);
 await assert.rejects(solanaRpcRead(opts.configured,'sendTransaction',[],provider().fetcher,{history:true}));
});
test('WH06 archive gap persists across resume and altered signature cursor is rejected',async()=>{
 const p=provider({nullTx:true}),first=await fetchSolanaHistory({...opts,pageSize:1,maxPages:1,fetcher:p.fetcher});assert.ok(first.resume.issues.includes('archive-gap'));
 const resumed=await fetchSolanaHistory({...opts,pageSize:1,fetcher:p.fetcher,resume:first.resume});assert.ok(resumed.issues.includes('archive-gap'));assert.ok(resumed.replay.balances.every(b=>b.quantityBaseUnits===null));
 const good=await fetchSolanaHistory({...opts,pageSize:1,maxPages:1,fetcher:provider().fetcher});good.resume.queue[0].seen[0]=SIG(3);const invalid=await fetchSolanaHistory({...opts,pageSize:1,fetcher:provider().fetcher,resume:good.resume});assert.equal(invalid.replay,null);
});
