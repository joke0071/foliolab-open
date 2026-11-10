import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshFrequency,refreshSettings,beginAutoRefresh,REFRESH_STATE_KEY} from '../src/refresh-frequency.js';
import {blankModel,load,STORE_KEY} from '../src/model.js';
import {portableSettings,createCompleteBackup,unpackCompleteBackup} from '../src/complete-backup.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),map};};
const options=(now,extra={})=>({frequency:'daily',scope:'synthetic-scope',now,...extra});
const state=s=>JSON.parse(s.getItem(REFRESH_STATE_KEY));
test('one validated frequency preserves legacy opt-out and daily defaults',()=>{
 for(const [old,want] of [[false,'off'],[true,'daily'],[undefined,'daily'],['off','off'],['daily','daily'],['6h','6h'],['30m','30m']]){
  assert.equal(refreshFrequency(old),want);assert.equal(portableSettings({autoRefresh:old}).autoRefresh,want);
 }
 for(const bad of [null,0,1,'weekly','true',{},[]])assert.throws(()=>portableSettings({autoRefresh:bad}),/Einstellung/);
 assert.equal(blankModel().settings.autoRefresh,'daily');
});
test('legacy read normalizes in memory without writing source bytes',()=>{
 for(const [old,want] of [[false,'off'],[true,'daily'],[undefined,'daily']]){
  const s=memory(),m=blankModel();if(old===undefined)delete m.settings.autoRefresh;else m.settings.autoRefresh=old;
  const raw=JSON.stringify(m);s.setItem(STORE_KEY,raw);
  assert.equal(load(s).settings.autoRefresh,want);assert.equal(s.getItem(STORE_KEY),raw);
 }
});
test('all four encrypted opt-in preferences roundtrip, other configuration retained',async()=>{
 for(const value of ['off','daily','6h','30m']){
  const m=blankModel();m.settings=refreshSettings({...m.settings,autoRefresh:value,solanaRpc:'https://rpc.example.test',marketstackKey:'SYNTHETIC_K2_KEY'});
  const payload=createCompleteBackup(m,{settings:m.settings,drive:{}});
  const encrypted=await encryptBackup(JSON.stringify(payload),'synthetic frequency password');
  const r=unpackCompleteBackup(JSON.parse(await decryptBackup(JSON.parse(encrypted),'synthetic frequency password')));
  assert.deepEqual(r.configuration.settings,m.settings);
  assert.equal(r.data.settings.autoRefresh,'daily');
 }
});
test('exact intervals use persisted complete success, never mere attempt',()=>{
 for(const [frequency,interval] of [['daily',86400000],['6h',21600000],['30m',1800000]]){
  const s=memory(),a=beginAutoRefresh(s,options(1000,{frequency}));
  assert.equal(state(s).lastSuccessAt,null);
  a.success('quote:synthetic');a.finish({saved:true,complete:true,at:2000});
  assert.equal(beginAutoRefresh(s,options(1999+interval,{frequency})),null);
  assert.ok(beginAutoRefresh(s,options(2000+interval,{frequency})));
 }
});
test('partial save skips paid successes but retries missing work with bounded backoff',()=>{
 const s=memory(),first=beginAutoRefresh(s,options(0));first.success('quote:paid');first.finish({saved:true,at:0});
 assert.equal(state(s).lastSuccessAt,null);assert.equal(beginAutoRefresh(s,options(299999)),null);
 const second=beginAutoRefresh(s,options(300000));assert.equal(second.due('quote:paid'),false);assert.equal(second.due('wallet:missing'),true);
 second.finish({at:300000});assert.equal(state(s).nextAttemptAt,900000);
 for(let i=0;i<10;i++){const now=state(s).nextAttemptAt;beginAutoRefresh(s,options(now)).finish({at:now});assert.ok(state(s).nextAttemptAt-now<=1800000);}
 assert.equal(state(s).lastSuccessAt,null);
});
test('failed canonical save cannot promote either a task or full success',()=>{
 const s=memory(),a=beginAutoRefresh(s,options(0));a.success('quote:paid');a.finish({saved:false,complete:true,at:0});
 assert.equal(state(s).lastSuccessAt,null);assert.deepEqual(state(s).completed,{});
 assert.equal(beginAutoRefresh(s,options(300000)).due('quote:paid'),true);
});
test('offline and opt-out issue no claim; quota and corrupt state fail closed',()=>{
 const s=memory();assert.equal(beginAutoRefresh(s,options(0,{online:false})),null);
 assert.equal(beginAutoRefresh(s,options(0,{frequency:'off'})),null);assert.equal(s.map.size,0);
 assert.throws(()=>beginAutoRefresh({getItem:()=>null,setItem:()=>{throw Error('quota');}},options(0)),/quota/);
 s.setItem(REFRESH_STATE_KEY,'broken');assert.throws(()=>beginAutoRefresh(s,options(0)),/JSON/);
 assert.ok(beginAutoRefresh(s,options(0,{manual:true,frequency:'off'})));
});
test('manual remains independent and a backwards clock gets bounded recovery',()=>{
 const s=memory(),a=beginAutoRefresh(s,options(1000000));a.success('quote:paid');a.finish({saved:true,complete:true,at:1000000});
 assert.equal(beginAutoRefresh(s,options(1000)),null);assert.equal(state(s).lastSuccessAt,null);
 assert.equal(state(s).nextAttemptAt,301000);assert.ok(beginAutoRefresh(s,options(301000)));
 const manual=beginAutoRefresh(s,options(301001,{frequency:'off',manual:true}));assert.equal(manual.due('quote:paid'),true);
 manual.success('quote:paid');manual.finish({saved:true,complete:true,at:301001});
 assert.equal(beginAutoRefresh(s,options(301002)),null);
});
