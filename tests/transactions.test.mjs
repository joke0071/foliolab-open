import test from 'node:test';import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,totalEUR,backup,safeImport} from '../src/model.js';
import {executeTransaction,TX_TYPES} from '../src/transactions.js';
function setup(){
 const m=blankModel(),provider=createProvider({name:'Testbank'});m.providers.push(provider);
 const dep=createAccount({providerId:provider.id,name:'Depot',type:'securities'},m);
 const dep2=createAccount({providerId:provider.id,name:'Zweitdepot',type:'securities'},m);
 const cash=createAccount({providerId:provider.id,name:'Cash',type:'checking'},m);m.accounts.push(dep,dep2,cash);
 const make=(acc,quantity,kind='etf')=>{const p=createPosition({providerId:provider.id,accountId:acc.id,name:kind==='cash'?'EUR':'ETF',kind,isin:kind==='cash'?'':'IE00BK5BQT80',quantity,price:kind==='cash'?1:100,currency:'EUR',costBasisEUR:quantity*100*(kind!=='cash')},m);m.positions.push(p);return p;};
 const p=make(dep,10),target=make(dep2,0),c=make(cash,1000,'cash');return {m,p,target,c};
}
const book=(m,p,type,extra={})=>executeTransaction(m,{positionId:p.id,type,date:'2026-10-21',quantity:'1',unitPrice:100,...extra});
test('Journal implements supported transaction vocabulary',()=>{for(const kind of ['buy','sell','deposit','withdraw','deliver_in','deliver_out','transfer','dividend','interest','reward','airdrop','fee','tax','correction','split','swap','merger','ticker_change','isin_change','delist'])assert.ok(TX_TYPES[kind]);});
test('Transfers conserve value and cost basis, and never create an external flow',()=>{const {m,p,target}=setup(),prior=totalEUR(m);book(m,p,'transfer',{quantity:'2',targetPositionId:target.id});assert.equal(p.quantity,8);assert.equal(target.quantity,2);assert.equal(p.costBasisEUR,800);assert.equal(target.costBasisEUR,200);assert.equal(totalEUR(m),prior);assert.equal(m.externalCashFlows.length,0);});
test('Deposits and withdrawals change cash and record signed external flows',()=>{const {m,c}=setup();book(m,c,'deposit',{quantity:'200',unitPrice:1});book(m,c,'withdraw',{quantity:'50',unitPrice:1});assert.equal(c.quantity,1150);assert.deepEqual(m.externalCashFlows.map(x=>x.amountEUR),[200,-50]);assert.equal(m.bookings[0].external,true);const b=safeImport(JSON.parse(backup(m)));assert.equal(b.externalCashFlows.length,2);});
test('Shares split and reverse split conserve position value and cost basis',()=>{const {m,p}=setup();const v=totalEUR(m);book(m,p,'split',{ratioNumerator:2,ratioDenominator:1,quantity:0});assert.equal(p.quantity,20);assert.equal(p.price,50);assert.equal(p.costBasisEUR,1000);assert.equal(totalEUR(m),v);book(m,p,'split',{ratioNumerator:1,ratioDenominator:2,quantity:0});assert.equal(p.quantity,10);assert.equal(p.price,100);});
test('Swap consumes input and transfers basis without inventing tax profit',()=>{const {m,p,target}=setup();book(m,p,'swap',{quantity:'2',targetPositionId:target.id,targetQuantity:'3'});assert.equal(p.quantity,8);assert.equal(target.quantity,3);assert.equal(p.realizedPnLEUR,null);});
test('Validated failures cannot mutate holdings or journal',()=>{const {m,p,target}=setup();const raw=JSON.stringify(m);assert.throws(()=>book(m,p,'transfer',{quantity:100,targetPositionId:target.id}),/übersteigt/);assert.equal(JSON.stringify(m),raw);assert.throws(()=>book(m,p,'ticker_change',{newSymbol:'<script>',quantity:0}),/Ticker/);assert.equal(JSON.stringify(m),raw);});
test('Delisting never zeroes out the last observed price',()=>{const {m,p}=setup();book(m,p,'delist',{quantity:0});assert.equal(p.price,100);assert.match(p.priceStatus,/Delisting/);});
test('Staking reward preserves explicit unknown acquisition basis',()=>{const {m,p}=setup();book(m,p,'reward',{quantity:'0.125'});assert.equal(p.quantity,10.125);assert.equal(p.costBasisEUR,null);});
test('18-decimal transactions remain exact in serialized quantityExact',()=>{const {m,p}=setup();book(m,p,'buy',{quantity:'0.000000000000000001',unitPrice:100});assert.equal(p.quantityExact,'10.000000000000000001');});
