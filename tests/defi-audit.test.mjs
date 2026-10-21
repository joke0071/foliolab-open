import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,totalExactEUR,snapshot,backup,safeImport} from '../src/model.js';
import {validateEconomicPosition,economicSummary} from '../src/defi.js';
import {portfolioXirr} from '../src/performance.js';
function fixture(){
 const m=blankModel(),p=createProvider({name:'Defi Audit'});m.providers.push(p);
 const account=createAccount({providerId:p.id,name:'Wallet',type:'wallet'},m);m.accounts.push(account);
 const add=(id,name,quantity,price,rest={})=>{
  const pos=createPosition({id,kind:'crypto',providerId:p.id,accountId:account.id,name,quantity,price,...rest},m);
  m.positions.push(pos);return pos;
 };
 return {m,add};
}
test('Liquid staking counts the economic ETH exposure exactly once',()=>{
 const {m,add}=fixture();
 add('eth','ETH',1,2000);
 add('steth','stETH',1,2000,{economicRole:'liquid-staking',valuationMode:'excluded',representedByPositionId:'eth'});
 assert.equal(totalExactEUR(m),'2000');
 assert.equal(economicSummary(m).excluded,1);
 assert.equal(totalExactEUR(safeImport(JSON.parse(backup(m)))),'2000');
});
test('Lending retains owned collateral and subtracts debt exactly once',()=>{
 const {m,add}=fixture();
 add('collateral','ETH deposit',1,2000,{economicRole:'collateral'});
 add('borrowed','USDC loan',500,1,{economicRole:'borrowed',valuationMode:'liability'});
 add('wallet-usdc','Borrowed USDC proceeds',500,1);
 assert.equal(totalExactEUR(m),'2000');
 assert.equal(economicSummary(m).liabilities,1);
});
test('Liquidity pool and wrapped position links do not inflate wealth',()=>{
 const {m,add}=fixture();
 add('lp','Liquidity Pool',1,300);
 add('a','Token A',100,1,{economicRole:'liquidity-pool',valuationMode:'excluded',representedByPositionId:'lp'});
 add('b','Token B',200,1,{economicRole:'liquidity-pool',valuationMode:'excluded',representedByPositionId:'lp'});
 add('btc','Wrapped BTC',1,20000);
 add('original','Locked BTC',1,20000,{economicRole:'wrapped',valuationMode:'excluded',representedByPositionId:'btc'});
 assert.equal(totalExactEUR(m),'20300');
});
test('Missing references, self-links and multi-hop cycles refuse to import',()=>{
 const {m,add}=fixture();
 const a=add('a','A',1,2),b=add('b','B',1,2);
 a.representedByPositionId='b';b.representedByPositionId='a';
 assert.throws(()=>validateEconomicPosition(a,m),/Zyklische/);
 assert.throws(()=>safeImport(JSON.parse(backup(m))),/Zyklische/);
 b.representedByPositionId='missing';
 assert.throws(()=>safeImport(JSON.parse(backup(m))),/fehlt/);
});
test('Unknown token prices produce partial snapshots and block XIRR',()=>{
 const {m,add}=fixture();
 add('unknown','Unknown token',1,0);
 snapshot(m,'2025-01-01','Verified statement',{manualTotalEUR:'100'});
 const today=new Date().toISOString().slice(0,10);
 snapshot(m,today);
 assert.equal(m.snapshots.at(-1).valuationStatus,'partial');
 assert.equal(portfolioXirr(m,'2025-01-01',today),null);
});
