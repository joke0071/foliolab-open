import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {inspectFlatexNetPairs} from '../src/flatex-net-settlement.js';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
export function fixture(){
 const model=blankModel();model.providers.push(createProvider({id:'p',name:'Flatex Synthetic'}));
 for(const [id,type]of [['d','securities'],['c','checking']])model.accounts.push(createAccount({id,providerId:'p',name:id,type,currency:'EUR'},model));
 model.positions.push(createPosition({id:'etf',providerId:'p',accountId:'d',name:'ETF',kind:'etf',isin:'IE00SYNTH001',quantity:0,price:10,costBasisEUR:null},model),createPosition({id:'cash',providerId:'p',accountId:'c',name:'EUR',kind:'cash',quantity:100,price:1,costBasisEUR:null},model));
 const documents=[parseFlatexNativeCSV(nativeFlatexCSV('depot',[{5:'2',9:'10'}])),parseFlatexNativeCSV(nativeFlatexCSV('account',[{6:'-21,75'}]))];
 const inspection=inspectFlatexNetPairs(documents),assignments={};
 for(const r of inspection.identities.rows)assignments[r.sourceId]={accountId:r.sourceType==='depot'?'d':'c'};
 for(const ctx of reviewNativeFlatexBindings(model,inspection.identities,assignments).contexts)Object.assign(assignments[ctx.sourceId],{confirmed:true,accountSnapshot:ctx.accountSnapshot});
 const options={selectedIds:inspection.pairs.map(p=>p.id),openingDate:'1999-01-01',openingConfirmed:true};
 return {model,documents,assignments,options,inspection};
}
export function laterDocuments({date='10.01.1999',type='buy'}={}){
 const details='ORDER '+(type==='buy'?'Kauf':'Verkauf')+' IE00SYNTH001 200';
 return [parseFlatexNativeCSV(nativeFlatexCSV('depot',[{1:date,2:date,5:type==='buy'?'1':'-1',7:details,8:'SYN-DEPOT-LATER',9:'12'}])),
  parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:date,1:date,4:details,5:'SYN-CASH-LATER',6:type==='buy'?'-12,25':'11,75'}]))];
}

/** Fully synthetic native history, including a sale; no live/private values. */
export function nativeBatchDocuments(){
 return [parseFlatexNativeCSV(nativeFlatexCSV('depot',[
  {5:'2',9:'10'},
  {1:'03.01.1999',2:'05.01.1999',5:'-1',9:'12',7:'ORDER Verkauf IE00SYNTH001 200',8:'SYN-DEPOT-SELL'}
 ])),parseFlatexNativeCSV(nativeFlatexCSV('account',[
  {6:'-21,75'},
  {0:'03.01.1999',1:'05.01.1999',6:'11,75',4:'ORDER Verkauf IE00SYNTH001 200',5:'SYN-CASH-SELL'}
 ]))];
}
