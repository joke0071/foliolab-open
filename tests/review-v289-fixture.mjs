import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
export function reviewWalletFixture({booking=true}={}){
 const model=blankModel();model.providers.push(createProvider({id:'p',name:'Synthetic wallet',type:'wallet'}));
 for(const [id,type]of [['a','wallet'],['b','wallet'],['c','checking']])model.accounts.push(createAccount({id,providerId:'p',name:id,type},model));
 model.positions.push(createPosition({id:'wallet',providerId:'p',accountId:'a',name:'Synthetic ETH',kind:'crypto',symbol:'ETH',quantity:1,price:100,wallet:{enabled:true,chain:'evm',chainId:1,address:'0x'+'a'.repeat(40)}},model),createPosition({id:'cash',providerId:'p',accountId:'c',name:'EUR',kind:'cash',quantity:100,price:1},model));
 model.settings.autoRefresh=false;if(booking)executeTransaction(model,{id:'cash-in',date:'1999-01-02',type:'deposit',positionId:'cash',quantity:1});return model;
}
