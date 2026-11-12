import test from 'node:test';
import assert from 'node:assert/strict';
import {createInstallHintPreference,INSTALL_HINT_KEY} from '../src/install-hint-preference.js';
const storage=()=>{const values=new Map(),writes=[];return {values,writes,getItem:k=>values.get(k)??null,setItem:(k,v)=>{writes.push([k,v]);values.set(k,v);}};};
test('dismissal persists across new page instances and writes only its own nonfinancial preference',()=>{
 const local=storage(),session=storage(),first=createInstallHintPreference([()=>local,()=>session]);
 assert.equal(first.dismissed,false);first.dismiss();assert.equal(first.dismissed,true);
 assert.equal(createInstallHintPreference([()=>local,()=>session]).dismissed,true);
 assert.deepEqual(local.writes,[[INSTALL_HINT_KEY,'1']]);assert.deepEqual(session.writes,[[INSTALL_HINT_KEY,'1']]);
});
test('blocked persistent storage still preserves the dismissal over reload through session storage',()=>{
 const local=()=>{throw new DOMException('blocked','SecurityError');},session=storage();
 const first=createInstallHintPreference([local,()=>session]);first.dismiss();
 assert.equal(createInstallHintPreference([local,()=>session]).dismissed,true);
});
test('post-choice write failures cannot reopen the hint in the running page',()=>{
 const broken={getItem:()=>null,setItem:()=>{throw new DOMException('quota','QuotaExceededError');}};
 const pref=createInstallHintPreference([()=>broken,()=>broken]);assert.doesNotThrow(()=>pref.dismiss());
 for(let navigation=0;navigation<10;navigation++)assert.equal(pref.dismissed,true);
});
test('both inaccessible storage getters leave a usable session memory fallback',()=>{
 const blocked=()=>{throw Error('storage unavailable');};const pref=createInstallHintPreference([blocked,blocked]);
 assert.equal(pref.dismissed,false);pref.dismiss();assert.equal(pref.dismissed,true);
});
test('only explicit dismissal value hides an available offer',()=>{
 for(const raw of [null,'','0','false','invalid']){const s=storage();if(raw!==null)s.values.set(INSTALL_HINT_KEY,raw);assert.equal(createInstallHintPreference([()=>s]).dismissed,false);}
 const s=storage();s.values.set(INSTALL_HINT_KEY,'1');assert.equal(createInstallHintPreference([()=>s]).dismissed,true);
});
