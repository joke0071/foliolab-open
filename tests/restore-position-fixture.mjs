import {blankModel,createProvider,createAccount,createPosition,snapshot} from '../src/model.js';
export function fixture(version=3){
 const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic depot'},m));
 m.positions.push(createPosition({id:'asset',providerId:'p',accountId:'a',name:'Synthetic ETF',kind:'etf',quantity:2,price:100},m));
 if(version===4){snapshot(m,'2026-01-02','Synthetic manual observation',{manualTotalEUR:'200'});m.bookingPresentation={version:2,archivedIds:[],referenceArchivedIds:[m.snapshots[0].id]};}
 m.version=version;if(version===1){delete m.accounts;delete m.positions[0].accountId;}
 return m;
}
