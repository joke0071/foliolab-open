import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';

export async function openInstallation(profile,setup){
 const context=await chromium.launchPersistentContext(profile);
 try{
  const page=await context.newPage();
  await setup(page);
  await page.evaluate(async()=>{
   const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
   const store=new PortfolioStorage();
   await store.initialize();
   window.installation=store;
  });
  return {context,page};
 }catch(error){await context.close();throw error;}
}

export async function checkProfileRestore({setup,operation}){
 const directory=await mkdtemp(join(tmpdir(),'foliolab-profile-restore-'));
 let source,destination;
 try{
  source=await openInstallation(join(directory,'source'),setup);
  destination=await openInstallation(join(directory,'destination'),setup);
  const original=await source.page.evaluate(async()=>{
   const {createProvider,createAccount,createPosition,backup}=window.syncTest.model;
   const model=await window.installation.reload();
   model.providers.push(createProvider({id:'profile-broker',name:'Profile restore',type:'broker'}));
   model.accounts.push(createAccount({id:'securities',providerId:'profile-broker',name:'Securities',type:'securities'},model));
   model.positions.push(createPosition({id:'asset',providerId:'profile-broker',accountId:'securities',
    kind:'stock',name:'Synthetic holding',currency:'USD',quantityExact:'1.000000000000000001',price:7,fxRate:null},model));
   await window.installation.save(model);
   return backup(model,{includeHistory:true});
  });
  const sourceIdentity=await operation(source.page,'prepare-anchor');
  const sourceProof=await operation(source.page,'anchor-proof');
  const sourceState=await operation(source.page,'read');
  assert.equal(sourceState.portfolio.raw,original);
  const secondTab=await destination.context.newPage();await setup(secondTab);
  const attempts=await Promise.allSettled([destination.page,secondTab].map(page=>operation(page,'prepare-anchor')));
  assert.equal(attempts.filter(result=>result.status==='fulfilled').length,1);
  const rejected=attempts.find(result=>result.status==='rejected');
  assert.ok(rejected);
  assert.match(String(rejected.reason),/existing-anchor/);
  const destinationIdentity=attempts.find(result=>result.status==='fulfilled').value;
  const destinationProof=await operation(destination.page,'anchor-proof');
  for(const attribute of ['lineId','portfolioId','epochId','deviceId']){
   assert.notEqual(sourceIdentity[attribute],destinationIdentity[attribute]);
  }
  assert.notDeepEqual(sourceProof.publicKey,destinationProof.publicKey);
  assert.equal(destinationProof.lineId,destinationIdentity.lineId);
  assert.equal(sourceProof.lineId,sourceIdentity.lineId);
  for(const identity of [sourceIdentity,destinationIdentity]){
   assert.equal(identity.status,'prepared-locked');assert.equal(identity.enrollmentAuthorized,false);
  }
  const before=await operation(destination.page,'read');
  await destination.page.evaluate(async portable=>{
   const model=window.syncTest.model.safeImport(JSON.parse(portable));
   await window.installation.save(model,{intent:'restore'});
  },original);
  const restored=await operation(secondTab,'read');
  assert.equal(restored.portfolio.revision,before.portfolio.revision+1);
  assert.equal(restored.portfolio.raw,original);
  const [holding]=JSON.parse(restored.portfolio.raw).positions;
  assert.equal(holding.quantityExact,'1.000000000000000001');assert.equal(holding.fxRateExact,'UNKNOWN');
  assert.equal(restored.portfolio.syncEnrollmentRequired,true);assert.equal(restored.sync,null);
  const expected=[[source,sourceState,sourceProof],[destination,restored,destinationProof]];
  for(const [installation,state,proof] of expected){
   assert.deepEqual(await operation(installation.page,'read'),state);
   assert.deepEqual(await operation(installation.page,'anchor-proof'),proof);
   await assert.rejects(()=>operation(installation.page,'recover'),/enrollment-required/);
  }
  await destination.context.close();
  destination=await openInstallation(join(directory,'destination'),setup);
  assert.deepEqual(await operation(destination.page,'read'),restored);
  assert.deepEqual(await operation(destination.page,'anchor-proof'),destinationProof);
  await assert.rejects(()=>operation(destination.page,'prepare-anchor'),/existing-anchor/);
  await assert.rejects(()=>operation(destination.page,'recover'),/enrollment-required/);
  console.log(JSON.stringify({kind:'FLH04ProfileRestore',status:'PASS',engine:destination.context.browser().version(),
   persistentProfiles:2,concurrentPreparations:2,committedPreparations:1,financialBackupPreserved:true,ownKeysAfterRestart:true}));
 }finally{
  try{await Promise.all([source,destination].map(installation=>installation?.context.close()));}
  finally{await rm(directory,{recursive:true,force:true});}
 }
}
