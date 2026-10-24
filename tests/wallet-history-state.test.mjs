import test from 'node:test';import assert from 'node:assert/strict';
import {blankModel,backup,safeImport} from '../src/model.js';
import {acceptHistory,historyPreview,checkpointHistory,validateWalletHistory,portableWalletHistory} from '../src/wallet-history-state.js';
import {createCompleteBackup,unpackCompleteBackup} from '../src/complete-backup.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';
import {replayWalletHistory} from '../src/wallet-history-core.js';
import {event,stream,NOW} from './wallet-history-fixtures.mjs';
const preview=()=>historyPreview({replay:replayWalletHistory({events:[event()],streams:[stream()]}),issues:[]},{id:'a',chain:'eth',walletKey:'public-wallet',acceptedAt:NOW});
test('WH04 accepted projection is idempotent, isolated and credential-free',()=>{
 const m=blankModel(),original=JSON.stringify(m),p=preview();p.password='secret';p.events[0].source='https://rpc.test/path?apikey=secret';
 const draft=acceptHistory(m,p),again=acceptHistory(draft,p);assert.equal(JSON.stringify(m),original);assert.equal(again.walletHistory.sessions.length,1);assert.ok(!JSON.stringify(again).includes('secret'));
 assert.deepEqual(safeImport(JSON.parse(backup(again,{includeHistory:true}))).walletHistory,again.walletHistory);assert.ok(!backup(again).includes('walletHistory'));
});
test('WH04 partial coverage cannot acquire a zero opening; provider cache excluded',()=>{
 const p=preview();p.streams[0].opening=null;p.streams[0].coverage.status='partial';const d=acceptHistory(blankModel(),p);assert.equal(d.walletHistory.sessions[0].streams[0].opening,null);
 const next=checkpointHistory(d,{id:'b',chain:'eth',walletKey:'address',provider:'https://rpc.test/key?token=secret',filter:'all',tip:'10',updatedAt:NOW,raw:{token:'secret'}});
 assert.ok(!JSON.stringify(next).includes('secret'));assert.equal(next.walletHistory.pending[0].status,'re-fetch-needed');assert.deepEqual(portableWalletHistory(next.walletHistory).pending,[]);
});
test('WH04 encrypted full history roundtrip, old complete backup and corrupted history reject',async()=>{
 const m=acceptHistory(blankModel(),preview()),data=JSON.parse(backup(m));const full=createCompleteBackup(data,null,m.walletHistory);
 const restored=unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(await encryptBackup(JSON.stringify(full),'long-test-password')),'long-test-password')));
 assert.deepEqual(safeImport(restored.data).walletHistory,m.walletHistory);assert.ok(!('walletHistory' in unpackCompleteBackup(createCompleteBackup(data)).data));
 assert.throws(()=>validateWalletHistory({schema:99,sessions:[],pending:[]}));full.walletHistory.sessions[0].events[0].quantityBaseUnits='1.2';assert.throws(()=>unpackCompleteBackup(full));
});
import {invalidateHistory} from '../src/wallet-history-state.js';
test('WH04 reorg invalidation retains accepted facts but cannot retain verified claims',()=>{
 const m=acceptHistory(blankModel(),preview()),changed=invalidateHistory(m,'a','reorg');
 assert.equal(m.walletHistory.sessions[0].streams[0].coverage.status,'verified');assert.equal(changed.walletHistory.sessions[0].streams[0].coverage.status,'partial');
 assert.deepEqual(changed.walletHistory.sessions[0].events,m.walletHistory.sessions[0].events);assert.equal(changed.walletHistory.sessions[0].decision,'accepted');
});
test('WH04/07 duplicate accepted facts normalize and contradictory revisions reject',()=>{
 const p=preview();p.events.push(structuredClone(p.events[0]));assert.equal(acceptHistory(blankModel(),p).walletHistory.sessions[0].events.length,1);
 p.events.push({...p.events[0],quantityBaseUnits:'9'});assert.throws(()=>acceptHistory(blankModel(),p));
});
