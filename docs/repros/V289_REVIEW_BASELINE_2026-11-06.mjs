/** Owner's executable diagnostics for FIXED v289 only; not a current release gate. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
const root=resolve(process.argv[2]||process.cwd()),load=path=>import(pathToFileURL(resolve(root,path)).href);
const {blankModel,createProvider,createAccount,createPosition,backup,safeImport,totalExactEUR,snapshot}=await load('src/model.js');
const {executeTransaction}=await load('src/transactions.js'),{prepareNativeFlatexPreview}=await load('src/flatex-backfill.js'),{importCSV}=await load('src/csv-import.js'),{reviewNativeFlatexBindings}=await load('src/flatex-native-ui.js'),{inspectNativeFlatexSourceIdentities}=await load('src/import-identity.js'),{assetKey}=await load('src/assets.js'),{portfolioTwr}=await load('src/performance.js'),{nativeProjectionFixture}=await load('tests/flatex-native-projection-fixture.mjs');
function walletFixture(){
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic wallet',type:'wallet'}));for(const [id,type]of [['a','wallet'],['b','wallet'],['c','checking']])m.accounts.push(createAccount({id,providerId:'p',name:id,type},m));
 const wallet=createPosition({id:'wallet',providerId:'p',accountId:'a',kind:'crypto',name:'Synthetic ETH',symbol:'ETH',quantity:1,price:100,wallet:{enabled:true,chain:'evm',chainId:1,address:'0x'+'a'.repeat(40)}},m);m.positions.push(wallet,createPosition({id:'cash',providerId:'p',accountId:'c',kind:'cash',name:'EUR',quantity:100,price:1},m));return {m,wallet};
}
const report={main:'652e80bcb31aec13c85a0457332bdf53cf98a521',tree:'ee506c874fa9578f1daf3387da24b299bba5103e',scope:'Entirely synthetic owner-run diagnostic on exact v289 source; expected old defects, not current capabilities or release reacceptance',findings:{}};
{
 const f=nativeProjectionFixture(),plan=prepareNativeFlatexPreview(f.model,f.documents,f.assignments,{mode:'append'});assert.ok(plan.eligible);importCSV(f.model,plan.preview);f.model.accounts.push(createAccount({id:'second',providerId:'provider',name:'Second',type:'securities'},f.model));f.model.positions.push(createPosition({id:'second-asset',providerId:'provider',accountId:'second',kind:'etf',name:'Same ETF',isin:'IE00SYNTH001',quantity:0,price:1},f.model));
 const id=inspectNativeFlatexSourceIdentities(f.documents),source=id.rows[0].sourceId,assignments={[source]:{accountId:'second'}},context=reviewNativeFlatexBindings(f.model,id,assignments).contexts[0];Object.assign(assignments[source],{confirmed:true,accountSnapshot:context.accountSnapshot});const before=JSON.stringify(f.model),repeat=prepareNativeFlatexPreview(f.model,f.documents,assignments,{mode:'append'});assert.equal(repeat.eligible,true);assert.equal(repeat.preview.ready,2);assert.equal(JSON.stringify(f.model),before);report.findings.H1={result:'REPRODUCED',offeredAdditionalTrades:2,previewMutatedInput:false};
}
{
 const {m,wallet}=walletFixture();executeTransaction(m,{date:'1999-01-02',type:'deposit',positionId:'cash',quantity:1});wallet.quantityExact='2';wallet.quantity=2;let error='';try{safeImport(JSON.parse(backup(m)));}catch(e){error=e.message;}assert.match(error,/Journal und aktuelle Positionsmengen/);report.findings.H2={result:'REPRODUCED',observedQuantity:'2',recordedOpening:m.openingPositions.find(p=>p.positionId==='wallet').quantityExact,restoreError:error};
}
{
 const {m,wallet}=walletFixture();m.positions.push(createPosition({...wallet,id:'duplicate',accountId:'b',wallet:{...wallet.wallet,address:'0x'+'A'.repeat(40)}},m));assert.equal(totalExactEUR(m),'300');report.findings.H3={result:'REPRODUCED',expectedSingleRepresentationTotalEUR:'200',actualTotalEUR:'300'};
}
{
 const a={kind:'crypto',wallet:{enabled:true,chain:'spl',contract:'Ab'+'1'.repeat(30)}},b={kind:'crypto',wallet:{enabled:true,chain:'spl',contract:'aB'+'1'.repeat(30)}};assert.equal(assetKey(a),assetKey(b));report.findings.M1={result:'REPRODUCED',caseDistinctMintKeysCollide:true};
}
{
 const {m,wallet}=walletFixture();m.positions=[wallet];wallet.price=110;wallet.priceExact='110';wallet.quoteSource='CoinGecko Token';wallet.quoteQuality='provider-undated';wallet.quoteAsOf=null;snapshot(m,'1999-01-01','',{manualTotalEUR:'100'});snapshot(m);assert.equal(m.snapshots.at(-1).valuationStatus,'observed');const twr=portfolioTwr(m,'1999-01-01',m.snapshots.at(-1).date);assert.ok(twr!==null);report.findings.M2={result:'REPRODUCED',undatedAutomaticEndpoint:m.snapshots.at(-1).valuationStatus,twr};
}
{
 const {m,wallet}=walletFixture();wallet.wallet=null;executeTransaction(m,{date:'1999-01-02',type:'buy',positionId:'wallet',cashPositionId:'cash',quantity:'0.5',unitPrice:100});const badDate=JSON.parse(backup(m));badDate.bookings[0].date='1999-01-03';assert.doesNotThrow(()=>safeImport(badDate));executeTransaction(m,{date:'1999-01-03',type:'deposit',positionId:'cash',quantity:1});const badSequence=JSON.parse(backup(m));badSequence.journalEntries[1].sequence=badSequence.journalEntries[0].sequence;assert.doesNotThrow(()=>safeImport(badSequence));report.findings.M3={result:'REPRODUCED',mismatchedModernDateAccepted:true,duplicateModernSequenceAccepted:true};
}
report.result='REPRODUCED';writeFileSync(resolve(process.argv[3]||'v289-review-baseline.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
