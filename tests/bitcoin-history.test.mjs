import test from 'node:test';import assert from 'node:assert/strict';
import {fetchBitcoinHistory,bitcoinHistoryEvents} from '../src/bitcoin-history.js';
import {A,B,H,wallets,tx,provider} from './bitcoin-history-fixtures.mjs';
const opts={wallets,observedAt:'2026-10-24T12:00:00.000Z',retryDelayMs:0};
test('Esplora 25+1 pagination and exact scanner reconciliation',async()=>{
 const p=provider(Array.from({length:26},(_,i)=>tx(i+1)));
 const r=await fetchBitcoinHistory({...opts,fetcher:p.fetcher});assert.equal(r.coverage,'verified',JSON.stringify(r.issues));assert.equal(r.replay.balances[0].quantityBaseUnits,'2600');assert.equal(r.utxos.length,26);assert.equal(r.reconciliation[0].status,'verified');assert.equal(p.calls.filter(x=>x.includes('/txs/chain')).length,2);
 assert.deepEqual(JSON.parse(JSON.stringify(r)),r);
});
test('raw input, change, selfsend, fee and overlap deduplicate',()=>{
 const funding=tx(1),spend={...tx(2),fee:1,vin:[{txid:H(1),vout:0,prevout:{scriptpubkey_address:A,value:100}}],vout:[{scriptpubkey_address:A,value:39},{scriptpubkey_address:B,value:60}]};
 const ws=[{accountId:'a',addresses:[A]},{accountId:'b',addresses:[A]}];
 const r=bitcoinHistoryEvents([funding,spend,spend],ws);
 assert.equal(r.accounts.length,1);assert.equal(r.aliases.length,1);assert.equal(r.events.filter(e=>e.type==='fee').length,1);assert.equal(r.utxos.length,1);assert.equal(r.utxos[0].satoshis,'39');assert.ok(r.events.some(e=>e.type==='internal_transfer'));
});
test('resume after page budget, idempotence and scope rejection',async()=>{
 const p=provider(Array.from({length:26},(_,i)=>tx(i+1)));let saved;
 const first=await fetchBitcoinHistory({...opts,fetcher:p.fetcher,maxPages:1,onCheckpoint:s=>saved=s});assert.deepEqual(first.issues,['page-limit']);assert.equal(saved.transactions.length,25);
 const r=await fetchBitcoinHistory({...opts,fetcher:p.fetcher,resume:first.resume});assert.equal(r.coverage,'verified');assert.equal(r.events.length,26);
 await assert.rejects(fetchBitcoinHistory({...opts,wallets:[{...wallets[0],accountId:'different'}],fetcher:p.fetcher,resume:first.resume}));
});
test('abort saves checkpoint; resume revalidates tip',async()=>{
 const c=new AbortController(),p=provider(Array.from({length:26},(_,i)=>tx(i+1)));
 const first=await fetchBitcoinHistory({...opts,fetcher:p.fetcher,signal:c.signal,onCheckpoint:s=>{if(s.transactions.length)c.abort();}});assert.deepEqual(first.issues,['aborted']);assert.equal(first.resume.transactions.length,25);
 const result=await fetchBitcoinHistory({...opts,fetcher:provider([tx(1)]).fetcher,resume:{...first.resume,tip:{hash:H(11),height:'11'}}});assert.deepEqual(result.issues,['tip-changed-restart-required']);
});
test('403,429,500,CORS, timeout are partial and bounded',async()=>{
 for(const status of [403,429,500]){const p=provider([tx(1)],{fail:{path:'/txs/chain',status}});const r=await fetchBitcoinHistory({...opts,fetcher:p.fetcher});assert.equal(r.coverage,'partial');assert.ok(r.issues.includes('http-'+status));assert.equal(p.calls.filter(x=>x.includes('/txs/chain')).length,status===403?1:2);}
 for(const fetcher of [async()=>{throw TypeError('Failed to fetch');},()=>new Promise(()=>{})]){const r=await fetchBitcoinHistory({...opts,fetcher,timeoutMs:10});assert.equal(r.coverage,'partial');assert.equal(r.replay,null);}
});
test('missing prevout, history gaps, mempool and reorg never claim full history',async()=>{
 const missing=tx(1);missing.vin[0].prevout=null;
 const r=await fetchBitcoinHistory({...opts,fetcher:provider([missing]).fetcher});assert.equal(r.coverage,'partial');assert.ok(r.issues.includes('missing-prevout'));assert.equal(r.replay.balances[0].quantityBaseUnits,null);
 const pending={...tx(2),status:{confirmed:false}};
 const m=await fetchBitcoinHistory({...opts,fetcher:provider([tx(1)],{mempool:[pending]}).fetcher});assert.equal(m.replay.balances[0].quantityBaseUnits,'100');assert.equal(m.mempool.events[0].coverage,'unconfirmed');
 for(const options of [{tipChange:true},{override:(p,d)=>p.startsWith('/block-height')?H(9):d},{override:(p,d)=>p.endsWith('/txs/chain')?[]:d}]){
  const result=await fetchBitcoinHistory({...opts,fetcher:provider([tx(1)],options).fetcher});assert.equal(result.coverage,'partial');assert.ok(!result.replay||result.replay.balances[0].quantityBaseUnits===null);
 }
});
test('unsafe integers, mixed fee ownership and empty complete history',async()=>{
 const bad=tx(1);bad.vout[0].value=Number.MAX_SAFE_INTEGER+1;assert.throws(()=>bitcoinHistoryEvents([bad],[{accountId:'a',addresses:[A]}]));
 const r=await fetchBitcoinHistory({...opts,fetcher:provider([]).fetcher});assert.equal(r.coverage,'verified');assert.equal(r.replay.balances[0].quantityBaseUnits,'0');
 const t=tx(1);t.vin.push({txid:H(4),vout:0,prevout:{scriptpubkey_address:A,value:10}});t.fee=10;
 assert.ok(bitcoinHistoryEvents([t],[{accountId:'a',addresses:[A]}]).issues.includes('fee-allocation-unknown'));
});
import {deriveBitcoinAddress} from '../src/bitcoin-hd.js';
import {createHash} from 'node:crypto';
const Z='zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs';
function key(version){const abc='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';let n=0n;for(const c of Z)n=n*58n+BigInt(abc.indexOf(c));const b=Buffer.alloc(82);for(let i=81;i>=0;i--){b[i]=Number(n&255n);n>>=8n;}b.set(version);const sha=x=>createHash('sha256').update(x).digest();sha(sha(b.subarray(0,78))).copy(b,78,0,4);n=BigInt('0x'+b.toString('hex'));let out='';while(n){out=abc[Number(n%58n)]+out;n/=58n;}return out;}
test('HD reuse: xpub/ypub/zpub receive+change gap20 and single-address overlap',async()=>{
 for(const k of [key([4,136,178,30]),key([4,157,124,178]),Z]){
  const format=k.startsWith('xpub')?'p2wpkh':null;
  const receive=await deriveBitcoinAddress(k,0,0,format),change=await deriveBitcoinAddress(k,1,0,format);
  const transactions=[{...tx(1),vout:[{scriptpubkey_address:receive,value:100}]},{...tx(2),fee:1,vin:[{txid:H(1),vout:0,prevout:{scriptpubkey_address:receive,value:100}}],vout:[{scriptpubkey_address:change,value:99}]}];
  const p=provider(transactions),result=await fetchBitcoinHistory({...opts,wallets:[{chain:'btc-hd',address:k,accountId:'hd',addressType:format||'auto'},{chain:'btc',address:receive,accountId:'single'}],fetcher:p.fetcher});
  assert.equal(result.coverage,'verified',JSON.stringify(result.issues));assert.equal(result.accounts.length,1);assert.equal(result.replay.balances[0].quantityBaseUnits,'99');assert.equal(result.events.filter(e=>e.type==='fee').length,1);
  assert.ok(p.calls.filter(u=>!u.includes('/txs/')&&u.includes('/address/')).length>=42,'both branches reach gap20');
 }
});
test('unknown empty xpub and Taproot remain explicit partial/unsupported',async()=>{
 const empty=await fetchBitcoinHistory({...opts,wallets:[{chain:'btc-hd',address:key([4,136,178,30]),accountId:'hd'}],fetcher:provider([]).fetcher});assert.equal(empty.coverage,'partial');assert.equal(empty.replay,null);
 const tap=await fetchBitcoinHistory({...opts,wallets:[{chain:'btc',accountId:'tap',address:'bc1p'+'q'.repeat(38)}],fetcher:provider([]).fetcher});assert.equal(tap.coverage,'unsupported');
});
test('provider retries can recover; summary and malformed-page quality gates',async()=>{
 const good=provider([tx(1)]);let failed=false;
 const retry=await fetchBitcoinHistory({...opts,fetcher:async(u,o)=>{if(u.includes('/txs/chain')&&!failed){failed=true;return {ok:false,status:429,headers:new Headers({'retry-after':'0'})};}return good.fetcher(u,o);}});assert.equal(retry.coverage,'verified');
 for(const override of [(p,d)=>p.endsWith('/txs/chain')?[...Array(26)].map((_,i)=>tx(i+1)):d,(p,d)=>p.startsWith('/address/')&&!p.includes('/txs')?{...d,chain_stats:{...d.chain_stats,funded_txo_sum:999}}:d]){
  const r=await fetchBitcoinHistory({...opts,fetcher:provider([tx(1)],{override}).fetcher});assert.equal(r.coverage,'partial');assert.ok(!r.replay||r.replay.balances[0].quantityBaseUnits===null);
 }
});
test('body timeout, hanging-fetch abort and corrupted resume are safe',async()=>{
 const r=await fetchBitcoinHistory({...opts,timeoutMs:10,fetcher:async()=>({ok:true,json:()=>new Promise(()=>{}),text:()=>new Promise(()=>{})})});assert.equal(r.coverage,'partial');assert.equal(r.replay,null);
 const c=new AbortController();setTimeout(()=>c.abort(),5);
 const aborted=await fetchBitcoinHistory({...opts,signal:c.signal,fetcher:()=>new Promise(()=>{})});assert.deepEqual(aborted.issues,['aborted']);
 const p=provider(Array.from({length:26},(_,i)=>tx(i+1)));const first=await fetchBitcoinHistory({...opts,fetcher:p.fetcher,maxPages:1});
 const corrupted=structuredClone(first.resume);corrupted.addresses=[];corrupted.transactions[0].vout[0].value=999;
 const resumed=await fetchBitcoinHistory({...opts,fetcher:p.fetcher,resume:corrupted});assert.equal(resumed.coverage,'partial');assert.equal(resumed.replay,null);
});
