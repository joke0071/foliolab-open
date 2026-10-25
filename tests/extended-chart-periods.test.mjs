import test from 'node:test';
import assert from 'node:assert/strict';
import {availablePositionPeriods,fetchPositionMarketHistory} from '../src/position-history.js';
const ago=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
const security={id:'etf',kind:'etf',symbol:'VWCE',exchange:'Xetra',mic:'XETR',currency:'EUR'};
const crypto={id:'btc',kind:'crypto',coinId:'bitcoin',symbol:'BTC'};
test('Free crypto histories stay capped at one year even when keys are configured',async()=>{
 assert.deepEqual(availablePositionPeriods(crypto,{settings:{coinGeckoKey:'DEMO_KEY'}}),[7,30,90,180,365]);
 await assert.rejects(()=>fetchPositionMarketHistory(crypto,{},1826,async()=>{throw Error('Must not request');}),/höchstens 1 Jahr/);
});
test('Long periods are conditional on a verified listing and actual CSV history',()=>{
 assert.deepEqual(availablePositionPeriods(security,{settings:{}}),[7,30,90,180,365]);
 assert.deepEqual(availablePositionPeriods(security,{settings:{eodhdKey:'synthetic'}}),[7,30,90,180,365,1096,1826]);
 const csv={points:[{date:ago(2200),total:50},{date:ago(1600),total:80},{date:ago(1),total:100}]};
 assert.deepEqual(availablePositionPeriods(security,{settings:{},priceHistories:{etf:csv}}),[7,30,90,180,365,1096,1826,'max']);
 const shorter={points:[{date:ago(700),total:50},{date:ago(1),total:100}]};
 assert.deepEqual(availablePositionPeriods(security,{settings:{},priceHistories:{etf:shorter}}),[7,30,90,180,365,'max']);
 assert.deepEqual(availablePositionPeriods({...security,exchange:'',mic:''},{settings:{eodhdKey:'synthetic'}}),[7,30,90,180,365]);
});
test('Max cannot be fabricated from a partial remote feed',async()=>{
 await assert.rejects(()=>fetchPositionMarketHistory(security,{eodhdKey:'key'},'max',async()=>{throw Error('Never called');}),/nur für lokal importierte/);
});
