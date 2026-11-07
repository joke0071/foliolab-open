import {fixture} from './flatex-net-fixture.mjs';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
import {inspectFlatexFundingGroups} from '../src/flatex-net-settlement.js';
export function fundingFixture({cash='100',fundingDate='03.01.1999',quantity='2',price='10',settlement='-21,75',funding='21,75',reverse=false}={}){
 const f=fixture();f.model.positions.find(p=>p.id==='cash').quantityExact=cash;f.model.positions.find(p=>p.id==='cash').quantity=Number(cash);
 f.documents=[parseFlatexNativeCSV(nativeFlatexCSV('depot',[{5:quantity,9:price}])),parseFlatexNativeCSV(nativeFlatexCSV('account',[{6:settlement},{0:fundingDate,4:'Kauf IE00SYNTH001 0009007199254740993',5:'SYN-FUND',6:funding}]))];
 if(reverse)f.documents.reverse();
 f.inspection=inspectFlatexFundingGroups(f.documents);
 f.options.selectedIds=f.inspection.pairs.map(p=>p.id);
 f.options.fundingRoles=Object.fromEntries(f.options.selectedIds.map(id=>[id,{role:'external',confirmed:true}]));
 for(const c of reviewNativeFlatexBindings(f.model,f.inspection.identities,f.assignments).contexts)Object.assign(f.assignments[c.sourceId],{confirmed:true,accountSnapshot:c.accountSnapshot});
 f.files=f.documents.map((document,i)=>({name:'Synthetic funding '+i,document}));
 return f;
}
