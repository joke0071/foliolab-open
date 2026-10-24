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
test('WH06 finalized tip advances during pagination without losing the observed snapshot',async()=>{
 const later=transaction(2);later.slot=12;const p=provider({transactions:[transaction(),later]});let slots=0;
 const fetcher=async(url,options)=>{const q=JSON.parse(options.body),r=await p.fetcher(url,options),body=await r.json();
  if(q.method==='getSlot')body.result=slots++?13:10;
  if(q.method==='getBalance')body.result={context:{slot:11},value:85};
  return {...r,json:async()=>body};
 };
 const r=await fetchSolanaHistory({...opts,fetcher});assert.ok(r.replay,JSON.stringify(r.issues));assert.equal(r.coverage,'verified');assert.equal(r.tip.slot,11);assert.equal(r.replay.balances[0].quantityBaseUnits,'85');assert.equal(r.events.some(e=>e.txid===SIG(2)),false);
});
test('WH06 changed canonical snapshot rejects; advancing resume never mislabels newer scanner observations',async()=>{
 const p=provider();let blocks=0;const changed=async(url,options)=>{const q=JSON.parse(options.body),r=await p.fetcher(url,options),body=await r.json();if(q.method==='getBlock'&&++blocks>=3)body.result.blockhash=B;return {...r,json:async()=>body};};
 const bad=await fetchSolanaHistory({...opts,fetcher:changed});assert.equal(bad.replay,null);assert.ok(bad.issues.includes('sol-reorg-or-tip-changed'));
 const first=await fetchSolanaHistory({...opts,pageSize:1,maxPages:1,fetcher:p.fetcher});
 const advanced=async(url,options)=>{const q=JSON.parse(options.body),r=await p.fetcher(url,options),body=await r.json();if(q.method==='getSlot')body.result=20;if(q.method==='getBalance')body.result={context:{slot:20},value:500};return {...r,json:async()=>body};};
 const resumed=await fetchSolanaHistory({...opts,pageSize:1,resume:first.resume,fetcher:advanced});assert.ok(resumed.replay,JSON.stringify(resumed.issues));assert.equal(resumed.coverage,'partial');assert.ok(resumed.issues.includes('sol-scanner-slot-mismatch'));assert.equal(resumed.replay.balances[0].quantityBaseUnits,null);
});
test('WH06 missing transaction outcome and conflicting failed token changes cannot verify',()=>{
 const t=transaction();delete t.meta.err;assert.throws(()=>solanaHistoryEvents([t],wallets));
 const failed=transaction(1,{failed:true,tokens:true});const r=solanaHistoryEvents([failed],wallets);assert.ok(r.issues.includes('failed-token-state-conflict'));assert.equal(r.events.filter(e=>e.type!=='fee').length,0);
});
test('WH06/07 SPL gaps do not suppress independently proven SOL, and never acquire a token valuation',async()=>{
 const r=await fetchSolanaHistory({...opts,fetcher:provider({transactions:[transaction(1,{tokens:true,version0:true})]}).fetcher});
 assert.equal(r.coverage,'partial');const native=r.replay.balances.find(b=>!b.mint),token=r.replay.balances.find(b=>b.mint);assert.equal(native.coverage,'verified');assert.equal(native.quantityBaseUnits,'85');assert.equal(token.coverage,'missing');assert.equal(token.quantityBaseUnits,null);
 const {historyPreview}=await import('../src/wallet-history-state.js'),{historyDays}=await import('../src/wallet-history-days.js'),{valueHistoryRows}=await import('../src/wallet-history-valuation.js');
 const s=historyPreview(r,{id:'sol-eur-quality',chain:'sol',walletKey:'sol',acceptedAt:opts.observedAt}),rows=historyDays(s),date=rows[0].date;
 const valued=valueHistoryRows(rows,[{...native,date,priceExact:'20',currency:'EUR',source:'fixture',binding:'native-network'}]);assert.equal(valued.find(b=>!b.mint).eurExact,'0.0000017');assert.equal(valued.find(b=>b.mint).eurExact,null);
});
