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
