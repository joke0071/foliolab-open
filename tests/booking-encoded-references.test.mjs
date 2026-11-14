import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition,safeImport,backup,totalExactEUR} from '../src/model.js';
import {executeTransaction,ledgerQuantityAudit} from '../src/transactions.js';
import {previewBookingChange,prepareBookingChange,prepareBookingUndo} from '../src/booking-management.js';

function setup(){
 const m=blankModel();m.providers.push(createProvider({id:'provider',name:'Synthetic broker'}));
 m.accounts.push(createAccount({id:'account',providerId:'provider',name:'Synthetic cash'},m));
 m.positions.push(createPosition({id:'cash',providerId:'provider',accountId:'account',name:'Synthetic cash',kind:'cash',quantity:'100',price:'1'},m));
 const b=executeTransaction(m,{id:'booking-a',positionId:'cash',type:'deposit',quantity:'20',date:'2026-01-02',unitPrice:1,fxRate:1});
 m.journalEntries.find(e=>e.id===b.journalEntryId).postings.forEach((p,i)=>{p.id='posting-'+i;});
 return {m,b};
}
const request=(id,action='remove')=>({ids:[id],action,reason:'Synthetic independent receipt',...(action==='notes'?{changes:{notes:'Checked'}}:action==='edit'?{changes:{quantity:'7.25'}}:{})});
const escaped=id=>String.fromCharCode(92)+'u'+id.charCodeAt(0).toString(16).padStart(4,'0')+id.slice(1);
test('Encoded booking and journal identities block the same destructive and note actions as literal references',()=>{
 for(const target of ['booking','journal','posting'])for(const shape of ['value','key','nested-string'])for(const action of ['remove','edit','notes']){
  const {m,b}=setup(),j=m.journalEntries.find(e=>e.id===b.journalEntryId),id=target==='posting'?j.postings[0].id:target==='journal'?j.id:b.id;
  // Escape every character: decimal-leading generated posting IDs otherwise
  // can still occur literally at the end of a first-character Unicode escape.
  const token=Array.from(id,c=>String.fromCharCode(92)+'u'+c.charCodeAt(0).toString(16).padStart(4,'0')).join('');
  const encoded=shape==='key'?'{"'+token+'":"counterpart"}':'{"reference":"'+token+'"}';
  m.positions[0].notes=shape==='nested-string'?JSON.stringify(encoded):encoded;
  assert.equal(m.positions[0].notes.includes(id),false);
  // The normal reader retains this reference; do not use arbitrary top-level
  // test fields that would disappear on a real backup restore.
  const restored=safeImport(JSON.parse(backup(m)));assert.equal(restored.positions[0].notes,m.positions[0].notes);
  const before=JSON.stringify(restored),p=previewBookingChange(restored,request(b.id,action));
  assert.equal(p.ready,false,target+'/'+shape+'/'+action);assert.match(p.blocks.map(x=>x.reason).join(' '),/Referenzen/);
  assert.throws(()=>prepareBookingChange(restored,request(b.id,action),{expectedModel:before,confirmed:true}),/Referenzen/);
  assert.equal(JSON.stringify(restored),before);assert.equal(totalExactEUR(restored),'120');assert.equal(ledgerQuantityAudit(restored).ok,true);
 }
});
test('Opaque Unicode references fail closed while ordinary bracketed notes remain usable',()=>{
 for(const note of ['{"reference":"'+escaped('booking-a'),escaped('booking-a')]){
  const {m,b}=setup();m.positions[0].notes=note;const before=JSON.stringify(m);
  assert.throws(()=>previewBookingChange(m,request(b.id)),/Referenz/);assert.equal(JSON.stringify(m),before);
 }
 const {m,b}=setup();m.positions[0].notes='[checked manually]';
 assert.equal(previewBookingChange(m,request(b.id)).ready,true);
});
test('Unrelated encoded JSON and a normal receipt still permit exact removal and undo',()=>{
 const {m,b}=setup();m.positions[0].notes='{"reference":"'+escaped('different-booking')+'"}';
 const before=JSON.stringify(m),p=previewBookingChange(m,request(b.id));assert.equal(p.ready,true);assert.equal(p.beforeTotalEURExact,'120');assert.equal(p.afterTotalEURExact,'100');
 const {candidate,receipt}=prepareBookingChange(m,request(b.id),{expectedModel:before,confirmed:true});
 assert.equal(candidate.positions[0].quantityExact,'100');assert.equal(candidate.bookings.length,0);assert.equal(candidate.externalCashFlows.length,0);assert.equal(ledgerQuantityAudit(candidate).ok,true);
 assert.equal(JSON.stringify(prepareBookingUndo(candidate,receipt)),before);
});
