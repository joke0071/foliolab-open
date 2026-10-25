import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBittrEvidence,validatePurchaseReceipt,previewPurchaseEvidence,confirmPurchaseEvidence,unlinkPurchaseEvidence,validatePurchaseEvidence} from '../src/purchase-evidence.js';
import {blankModel,backup,safeImport} from '../src/model.js';
import {validateHistorySession} from '../src/wallet-history-state.js';
import {createCompleteBackup,unpackCompleteBackup} from '../src/complete-backup.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';
const txid='a'.repeat(64),at='2025-01-01T12:00:00.000Z';
const receipt=(v={})=>validatePurchaseReceipt({provider:'bittr',currency:'EUR',timestamp:at,txid,fiatEUR:'500',serviceFeeEUR:'9',grossBTC:'0.0125',miningFeeBTC:'0.0001',netBTC:'0.0124',...v});
const event=(v={})=>({network:'bitcoin',chainId:'mainnet',accountId:'own',walletId:'own',assetId:'bitcoin',contract:null,mint:null,txid,locator:{kind:'vout',index:'0',subindex:'0'},blockHeight:'10',blockHash:'b'.repeat(64),txIndex:null,timestamp:at,decimals:8,quantityBaseUnits:'1240000',includedInEventId:null,type:'incoming',source:'synthetic',status:'confirmed',finality:'confirmed',observedAt:at,coverage:'verified',qualityCode:'synthetic',...v});
const session=(events=[event()])=>validateHistorySession({id:'synthetic',chain:'btc',walletKey:'wallet',acceptedAt:at,events,streams:[{network:'bitcoin',chainId:'mainnet',accountId:'own',assetId:'bitcoin',contract:null,mint:null,decimals:8,throughBlock:'10',opening:{quantityBaseUnits:'0',beforeBlock:'0',source:'synthetic'},coverage:{status:'verified',fromBlock:'0',toBlock:'10',tipHash:'b'.repeat(64),source:'synthetic'}}],quotes:[],issues:[]});
const model=(s=session())=>({...blankModel(),walletHistory:{schema:1,sessions:[s],pending:[]}});
const csv=(lines)=>'Currency,Fiat Amount,Bittr Fee,Bitcoin Purchased,Mining Fee,Bitcoin Amount,Bitcoin Transaction ID,Timestamp,IBAN,From,Deposit Code,Current Value\n'+lines.join('\n');
const line=(eur='500',time=at)=>`EUR,${eur},9,0.0125,0.0001,0.0124,${txid},${time},PRIVATE-IBAN,PRIVATE-NAME,PRIVATE-CODE,9999`;
test('Bittr projection strips private fields, exact fees, duplicate rows vs reused txids',()=>{
 const parsed=parseBittrEvidence('\uFEFF'+csv([line(),line(),line('501')]));assert.equal(parsed.duplicates,1);assert.equal(parsed.receipts.length,2);assert.ok(!JSON.stringify(parsed).includes('PRIVATE'));assert.ok(!JSON.stringify(parsed).includes('9999'));
 assert.equal(parsed.receipts[0].fiatEUR,'500');assert.equal(parsed.receipts[0].netBTC,'0.0124');assert.notEqual(parsed.receipts[0].id,parsed.receipts[1].id);
 assert.deepEqual(parseBittrEvidence(csv([line()]).replaceAll(',',';')).receipts,parseBittrEvidence(csv([line()])).receipts);
 for(const v of [{netBTC:'0.012400001'},{netBTC:'0.0123'},{grossBTC:'-1'},{fiatEUR:'0'},{serviceFeeEUR:'501'},{currency:'USD'},{timestamp:'2025-02-30T12:00:00Z'},{timestamp:'2025-01-01T12:00:00'},{txid:'<script>'},{netBTC:'1e-8'}])assert.throws(()=>receipt(v));
 assert.throws(()=>parseBittrEvidence(csv([line()]).replace('500','"500')));
});
test('N:1 and N:M receipt sums use exact satoshis; split output and timestamp differences',()=>{
 const r=receipt(),r2=receipt({fiatEUR:'501'}),s=session([event({quantityBaseUnits:'2480000',timestamp:'2025-01-05T12:00:00.000Z'})]);
 assert.equal(previewPurchaseEvidence(model(s),[r,r2],s,'own')[0].status,'exact');
 const split=session([event({quantityBaseUnits:'600000'}),event({locator:{kind:'vout',index:'1',subindex:'0'},quantityBaseUnits:'640000'})]);assert.equal(previewPurchaseEvidence(model(split),[r],split,'own')[0].status,'exact');
 const bad=session([event({quantityBaseUnits:'1240001'})]);assert.equal(previewPurchaseEvidence(model(bad),[r],bad,'own')[0].status,'conflict');
 assert.equal(previewPurchaseEvidence(model(),[r],session(),'foreign')[0].status,'unmatched');
});
test('Explicit confirmation/undo changes documentary provenance only; reimport idempotent',()=>{
 const m=model(),s=m.walletHistory.sessions[0],r=receipt(),before=JSON.stringify(m);assert.throws(()=>confirmPurchaseEvidence(m,{receipts:[r]}));
 const imported=confirmPurchaseEvidence(m,{receipts:[r],confirmed:true});const again=confirmPurchaseEvidence(imported,{receipts:[r],confirmed:true});assert.deepEqual(imported,again);
 const linked=confirmPurchaseEvidence(imported,{receipts:[],receiptIds:[r.id],eventIds:[s.events[0].id],session:s,accountId:'own',confirmed:true,at});
 const {purchaseEvidence,...finance}=linked;assert.equal(JSON.stringify(finance),before);assert.equal(JSON.stringify(m),before);assert.equal(previewPurchaseEvidence(linked,[],s,'own')[0].status,'linked');
 assert.throws(()=>confirmPurchaseEvidence(linked,{receipts:[],receiptIds:[r.id],eventIds:[s.events[0].id],session:s,accountId:'own',confirmed:true}));
 const undone=unlinkPurchaseEvidence(linked,r.id,at);assert.equal(previewPurchaseEvidence(undone,[],s,'own')[0].status,'exact');assert.equal(undone.purchaseEvidence.decisions.length,2);
 const reorg=structuredClone(s);reorg.streams[0].coverage.status='partial';assert.equal(previewPurchaseEvidence(linked,[],reorg,'own')[0].status,'conflict');
 const changed=structuredClone(s);changed.events[0].blockHash='c'.repeat(64);assert.equal(previewPurchaseEvidence(linked,[],changed,'own')[0].status,'conflict');
});
test('Unknown openings, change, outputs, unconfirmed and missing history cannot acquire a buy',()=>{
 const r=receipt();assert.equal(previewPurchaseEvidence(blankModel(),[r],null,'own')[0].status,'unmatched');
 for(const e of [event({type:'internal_transfer'}),event({type:'outgoing',quantityBaseUnits:'-1240000',locator:{kind:'vin',index:'0',subindex:'0'}}),event({status:'unconfirmed',finality:'unconfirmed',coverage:'unconfirmed',blockHash:null,blockHeight:null,timestamp:null})]){
  const s=session([e]);assert.equal(previewPurchaseEvidence(model(s),[r],s,'own')[0].status,'unmatched');
 }
 const s=session(),m=model(s);s.streams[0].opening=null;s.streams[0].coverage.status='partial';assert.equal(previewPurchaseEvidence(m,[r],s,'own')[0].status,'unmatched');
});
test('Different txid amount/time yields only proposals or ambiguity, not confirmation',()=>{
 const r=receipt(),s=session([event({txid:'c'.repeat(64)})]);assert.equal(previewPurchaseEvidence(model(s),[r],s,'own')[0].status,'proposal');
 const ambiguous=session([event({txid:'c'.repeat(64)}),event({txid:'d'.repeat(64)})]);assert.equal(previewPurchaseEvidence(model(ambiguous),[r],ambiguous,'own')[0].status,'ambiguous');
});
test('Full encrypted and ordinary backup roundtrip; legacy backups, corrupt identity reject',async()=>{
 const m=confirmPurchaseEvidence(model(),{receipts:[receipt()],confirmed:true}),restored=safeImport(JSON.parse(backup(m,{includeHistory:true})));assert.deepEqual(restored.purchaseEvidence,m.purchaseEvidence);
 const full=createCompleteBackup(JSON.parse(backup(m)),null,m.walletHistory),encrypted=JSON.parse(await encryptBackup(JSON.stringify(full),'synthetic-password'));
 const unpacked=unpackCompleteBackup(JSON.parse(await decryptBackup(encrypted,'synthetic-password')));assert.deepEqual(safeImport(unpacked.data).purchaseEvidence,m.purchaseEvidence);
 assert.equal(safeImport(blankModel()).purchaseEvidence,undefined);
 const bad=structuredClone(m.purchaseEvidence);bad.receipts[0].fiatEUR='501';assert.throws(()=>validatePurchaseEvidence(bad));
});
