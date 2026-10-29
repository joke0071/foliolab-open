import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {inspectNativeFlatexSourceIdentities} from '../src/import-identity.js';
import {reviewNativeFlatexBindings} from '../src/flatex-native-ui.js';
import {nativeFlatexCSV as csv} from './flatex-native-fixture.mjs';
export const nativeTradeText=(rows=[{}])=>csv('depot',rows.map(r=>({5:'2',9:'3,25',7:'ORDER Kauf IE00SYNTH001 100',8:'SYN-BUY',...r})));
export function nativeProjectionFixture({quantity=0,basis=null,rows=[{}, {1:'05.01.1999',2:'06.01.1999',5:'-1',7:'ORDER Verkauf IE00SYNTH001 101',8:'SYN-SELL',9:'4'}]}={}){
 const model=blankModel();model.providers.push(createProvider({id:'provider',name:'Flatex Synthetic'}));model.accounts.push(createAccount({id:'depot',providerId:'provider',name:'Synthetic depot',type:'securities'},model));model.positions.push(createPosition({id:'asset',providerId:'provider',accountId:'depot',name:'Synthetic ETF',isin:'IE00SYNTH001',kind:'etf',quantity,price:1,costBasisEUR:basis},model));
 const text=nativeTradeText(rows),documents=[parseFlatexNativeCSV(text)],identities=inspectNativeFlatexSourceIdentities(documents),source=identities.rows[0].sourceId;
 const assignments={[source]:{accountId:'depot'}},context=reviewNativeFlatexBindings(model,identities,assignments).contexts[0];Object.assign(assignments[source],{confirmed:true,accountSnapshot:context.accountSnapshot});
 return {model,documents,assignments,text};
}
