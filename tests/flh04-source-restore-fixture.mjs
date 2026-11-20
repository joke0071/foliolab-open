import assert from 'node:assert/strict';
import {snapshotFrame} from './sync-outbox-fixture.mjs';
import {blankModel,createProvider,createPosition,backup} from '../src/model.js';
import {validateHistorySession} from '../src/wallet-history-state.js';
import {event,stream,NOW} from './wallet-history-fixtures.mjs';

export function commonPortfolio(){
 const model=blankModel();
 model.providers.push(createProvider({id:'broker',name:'Synthetic broker',type:'broker'}));
 model.positions.push(createPosition({id:'cash',providerId:'broker',kind:'cash',name:'EUR',quantity:10,price:1,currency:'EUR'},model));
 const session=validateHistorySession({id:'accepted',chain:'eth',walletKey:'test-wallet',acceptedAt:NOW,
  events:[event({quantityBaseUnits:'90071992547409930001'})],streams:[stream()],quotes:[],issues:[]});
 model.walletHistory={schema:1,sessions:[session],pending:[]};
 return backup(model,{includeHistory:true});
}

export async function appendBookings(page,raw,id,amounts){
 return page.evaluate(async({raw,id,amounts})=>{
  const {executeTransaction}=await import('/src/transactions.js');
  const {safeImport,backup}=window.syncTest.model,model=safeImport(JSON.parse(raw));
  amounts.forEach((amount,index)=>executeTransaction(model,{id:id+index,type:'deposit',date:'2026-11-01',
   positionId:'cash',quantity:amount,unitPrice:'1'}));
  return backup(model,{includeHistory:true});
 },{raw,id,amounts});
}

export async function prepareSourceRestore(page,operation){
 const root=await operation(page,'save',{revision:null,raw:commonPortfolio()});
 const first=await operation(page,'capture',{expectedLocalRevision:root.revision,expectedSyncVersion:null,
  frameText:snapshotFrame(root.raw)});
 const local=await operation(page,'save',{revision:root.revision,raw:await appendBookings(page,root.raw,'L',['2.25'])});
 const queue=await operation(page,'capture',{expectedLocalRevision:local.revision,expectedSyncVersion:first.version,
  frameText:snapshotFrame(local.raw,'L','R','2','a1'.repeat(32),undefined,'device-L')});
 const selectedRaw=await appendBookings(page,root.raw,'S',['3','0.125']);
 const request=await page.evaluate(async({cas,remote})=>{
  const {api}=window.syncTest,password='Local fixture recovery 2026';
  const vault=await import('/src/backup-vault.js');
  await vault.configureBackupPassword(password,password);
  const {archive}=await api.createConflictArchive({...cas,observationComplete:true,frameTexts:[remote]});
  const {text,digest}=archive;
  const pin=await api.pinConflictArchive({...cas,text,expectedDigest:digest,expectedPinVersion:0});
  const choice=await api.recordPinnedSelection({text,selectedHead:'S',expectedPinVersion:pin.pinVersion});
  const selection={text,expectedPinVersion:choice.pinVersion};
  const {recoveryFiles}=await api.exportPinnedRecoveryFiles(selection);
  return {...selection,...recoveryFiles,confirmedHead:'S',password};
 },{cas:{expectedLocalRevision:local.revision,expectedSyncVersion:queue.version},
  remote:snapshotFrame(selectedRaw,'S','R','2','a2'.repeat(32),undefined,'device-S')});
 return {request,local,queue,selectedRaw};
}

export async function verifyRestoredSource(page,operation,{request,local,queue,selectedRaw}){
 const state=await operation(page,'read');
 assert.equal(JSON.parse(local.raw).positions[0].quantityExact,'12.25');
 assert.equal(JSON.parse(state.portfolio.raw).positions[0].quantityExact,'13.125');
 assert.equal(state.portfolio.raw,selectedRaw);
 assert.deepEqual(state.portfolio.settings,local.settings);
 assert.equal(state.portfolio.revision,local.revision+1);
 assert.equal(state.portfolio.syncEnrollmentRequired,true);
 assert.deepEqual(state.sync,{...queue,disabled:'portfolio-restored'});
 await assert.rejects(()=>operation(page,'recover'),/enrollment-required/);
 await assert.rejects(()=>page.evaluate(req=>window.syncTest.api.restorePinnedLocalCopy(req),request),/stale-preimage/);
 assert.deepEqual(await operation(page,'read'),state);
}
