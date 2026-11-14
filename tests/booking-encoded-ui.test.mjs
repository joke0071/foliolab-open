import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {blankModel,createProvider,createAccount,createPosition,escapeHTML} from '../src/model.js';
import {executeTransaction,TX_TYPES} from '../src/transactions.js';
import {previewBookingChange,prepareBookingChange,bookingChangePermissions,bookingEditRequest,bookingSelectionSummary} from '../src/booking-management.js';
import {blockedReasonsMarkup} from '../src/blocked-reasons-ui.js';

const source=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
const open=source.slice(source.indexOf('function openBookingChange('),source.indexOf('function openBookingUndo('));
const rowClick=source.split('\n').find(l=>l.startsWith(" $('bookingList').addEventListener('click'"));
function harness(blocked,costs={}){
 const model=blankModel();model.providers.push(createProvider({id:'provider',name:'Synthetic'}));model.accounts.push(createAccount({id:'account',providerId:'provider',name:'Cash'},model));
 model.positions.push(createPosition({id:'cash',providerId:'provider',accountId:'account',name:'Cash',kind:'cash',quantity:100,price:1},model));
 const booking=executeTransaction(model,{id:'booking-a',positionId:'cash',type:'deposit',quantity:20,date:'2026-01-02',unitPrice:1,fxRate:1});
 Object.assign(booking,costs);
 if(blocked)model.positions[0].notes='{"reference":"'+String.fromCharCode(92)+'u0062ooking-a"}';
 const nodes=new Map(),dialogs=[],messages=[];let saves=0,currentChecks=0,stored=JSON.stringify(model);
 const $=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:'',events:{},addEventListener(type,fn){this.events[type]=fn;},insertAdjacentHTML(_where,html){this.html=(this.html||'')+html;}});return nodes.get(id);};
 const context=vm.createContext({model,$,document:{activeElement:{}},editor:null,dialogOpener:null,bookingMatchingIds:[booking.id],selectedBookingIds:[],bookingSelecting:true,bookingChangeReceipt:null,TX_TYPES,esc:escapeHTML,dateLabel:x=>x,
  field:(label,name,value,type,attrs)=>'<input name="'+name+'" '+attrs+'>',
  showDialog:(title,kicker,html,onSave,options={})=>dialogs.push({title,kicker,html,onSave,options}),
  assertBookingWritable(){},portfolioStore:{assertCurrent:async()=>{currentChecks++;}},save:async()=>{saves++;stored=JSON.stringify(context.model);},renderBookings(){},notify:(text,error)=>messages.push({text,error}),
  previewBookingChange,prepareBookingChange,bookingChangePermissions,bookingEditRequest,bookingSelectionSummary,blockedReasonsMarkup});
 vm.runInContext(open+'\n'+rowClick,context);
 return {context,booking,$,dialogs,messages,before:stored,saves:()=>saves,currentChecks:()=>currentChecks,stored:()=>stored};
}
test('Actual booking-row edit listener keeps encoded-reference mutations unavailable',()=>{
 const h=harness(true),button={disabled:false,dataset:{id:h.booking.id,bookingRowAction:'edit'}};
 h.$('bookingList').events.click({target:{closest:()=>button}});
 assert.equal(h.dialogs.length,1);assert.equal(h.$('saveDialog').hidden,true);
 assert.match(h.dialogs[0].html,/id="deleteBooking" disabled/);assert.match(h.$('dialogFields').html,/Referenzen/);
 assert.equal(h.saves(),0);assert.equal(h.stored(),h.before);assert.equal(JSON.stringify(h.context.model),h.before);
});
test('Actual removal preview blocks encoded references without storage calls or model changes',async()=>{
 const h=harness(true);vm.runInContext('openBookingChange("remove",["booking-a"])',h.context);
 await h.dialogs[0].onSave({reason:'Synthetic receipt'});
 assert.equal(h.dialogs.length,2);assert.equal(h.dialogs[1].options.readOnly,true);assert.equal(h.$('saveDialog').hidden,true);
 assert.match(h.dialogs[1].html,/Referenzen/);assert.equal(h.saves(),0);assert.equal(h.currentChecks(),0);
 assert.equal(JSON.stringify(h.context.model),h.before);assert.equal(h.stored(),h.before);
});
test('Actual permitted removal preview still commits the independent 120-to-100 result once',async()=>{
 const h=harness(false);vm.runInContext('openBookingChange("remove",["booking-a"])',h.context);
 await h.dialogs[0].onSave({reason:'Synthetic receipt'});
 assert.equal(h.dialogs[1].options.readOnly,false);assert.match(h.dialogs[1].html,/120 → 100 EUR/);
 await h.dialogs[1].onSave({confirmBookingChange:'on'});
 assert.equal(h.currentChecks(),1);assert.equal(h.saves(),1);
 const stored=JSON.parse(h.stored());assert.equal(stored.positions[0].quantityExact,'100');assert.equal(stored.bookings.length,0);assert.equal(stored.externalCashFlows.length,0);
 assert.equal(h.messages.at(-1).text,'Buchungsänderung gespeichert.');
});
test('Actual note-only editor names unknown costs and preserves them after one confirmed save',async()=>{
 const h=harness(false,{feeEUR:null,taxEUR:null});
 h.$('bookingList').events.click({target:{closest:()=>({disabled:false,dataset:{id:h.booking.id,bookingRowAction:'edit'}})}});
 assert.equal(h.$('saveDialog').hidden,false);
 await h.dialogs[0].onSave({reason:'Receipt checked',notes:'New note'});
 assert.equal(h.dialogs[1].options.readOnly,false);
 assert.match(h.dialogs[1].html,/Gebühren: unbekannt → unbekannt EUR · Steuern: unbekannt → unbekannt EUR/);
 await h.dialogs[1].onSave({confirmBookingChange:'on'});
 const stored=JSON.parse(h.stored());assert.equal(h.saves(),1);assert.equal(stored.positions[0].quantityExact,'120');
 assert.equal(stored.bookings[0].feeEUR,null);assert.equal(stored.bookings[0].taxEUR,null);assert.equal(stored.bookings[0].notes,'New note');
 assert.deepEqual(stored.positions,JSON.parse(h.before).positions);assert.deepEqual(stored.externalCashFlows,JSON.parse(h.before).externalCashFlows);
});
