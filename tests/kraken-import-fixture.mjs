import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {captureOpenings} from '../src/transactions.js';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
export const source=()=>krakenCSV([
 {txid:'SYN-EUR',asset:'EUR',subclass:'fiat',amount:'-100',fee:'0',balance:'100',feecurrency:'EUR'},
 {txid:'SYN-ETH',asset:'ETH',amount:'3',fee:'0',balance:'3',feecurrency:'ETH'},
 {txid:'SYN-FEE',asset:'BTC',amount:'0',fee:'0.00000017',balance:'0.00000083',feecurrency:'BTC'}
]);
// The fee belongs to the acquired asset; the CSV may list it before the trade.
export const sameAssetSource=()=>krakenCSV([
 {txid:'SYN-EUR',asset:'EUR',subclass:'fiat',amount:'-100',fee:'0',balance:'100',feecurrency:'EUR'},
 {txid:'SYN-ETH',asset:'ETH',amount:'3',fee:'0',balance:'3',feecurrency:'ETH'},
 {txid:'SYN-FEE-ETH',asset:'ETH',amount:'0',fee:'0.01',balance:'2.99',feecurrency:'ETH'}
]);
export function fixture(text=source()){
 const m=blankModel(),provider=createProvider({id:'kraken',name:'Synthetic Kraken'});m.providers.push(provider);
 const assignments={};
 for(const row of prepareKrakenSourcePlan([text]).observations){
  if(assignments[row.streamId])continue;
  const id='p'+Object.keys(assignments).length,a=createAccount({id:'a'+id,providerId:provider.id,name:row.values.wallet+' '+row.values.asset,type:row.values.asset==='EUR'?'checking':'crypto'},m);m.accounts.push(a);
  m.positions.push(createPosition({id,accountId:a.id,providerId:provider.id,name:row.values.asset,symbol:row.values.asset,coinId:{ETH:'ethereum',BTC:'bitcoin',SOL:'solana'}[row.values.asset]||'',kind:row.values.asset==='EUR'?'cash':'crypto',currency:'EUR',quantity:row.beforeExact,price:1},m));assignments[row.streamId]=id;
 }
 captureOpenings(m);return {m,assignments};
}
// Same timestamp, two references. The second trade depends on the first in both streams.
export const crossReferenceSource=()=>krakenCSV([
 {txid:'SYN-CROSS-EUR-1',refid:'SYN-CROSS-SECOND',asset:'EUR',subclass:'fiat',amount:'-100',fee:'0',balance:'100',feecurrency:'EUR'},
 {txid:'SYN-CROSS-ETH-1',refid:'SYN-CROSS-SECOND',asset:'ETH',amount:'3',fee:'0',balance:'3',feecurrency:'ETH'},
 {txid:'SYN-CROSS-EUR-2',refid:'SYN-CROSS-FIRST',asset:'EUR',subclass:'fiat',amount:'-50',fee:'0',balance:'50',feecurrency:'EUR'},
 {txid:'SYN-CROSS-ETH-2',refid:'SYN-CROSS-FIRST',asset:'ETH',amount:'2',fee:'0',balance:'5',feecurrency:'ETH'}
]);
