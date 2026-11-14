import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport,defaultSettings,totalEUR,money} from '../src/model.js';
import {storagePresentation} from '../src/header-status.js';
import {aggregateValuePresentation} from '../src/quote-quality.js';
const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
const saveSource=app.slice(app.indexOf('async function save(){'),app.indexOf('function notify('));
const a=app.indexOf('      async restoreData(data,configuration=null){'),b=app.indexOf('      onBackedUp()',a),restoreSource=app.slice(a,b);
function candidate(){const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'Cash'},m));m.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',kind:'cash',name:'Cash',quantity:123.45,price:1},m));return m;}
function harness({renderFailures=0,syncFailureAt=0,storeFailure=false,notifyFailure=false,page='more',managementFailure=false}={}){
 const initial=blankModel(),initialRaw=backup(initial),messages=[];let raw=initialRaw,revision=2,commits=0,reloads=0,renders=0,syncs=0;
 const ctx=vm.createContext({model:initial,saving:false,otherTabChangedPortfolio:false,loadFailure:null,lastStorageError:'',lastDisplayError:'',page,filter:'all',safeImport,defaultSettings,
  syncPortfolioState(){if(++syncs===syncFailureAt)throw Error('SYNTHETIC_FINAL_STATUS_DISPLAY');},
  portfolioStore:{save:async m=>{if(storeFailure){const e=Error('SYNTHETIC_PRECOMMIT_QUOTA');e.name='QuotaExceededError';throw e;}raw=backup(m);revision++;commits++;},reload:async()=>{reloads++;return safeImport(JSON.parse(raw));}},
  render(){if(++renders<=renderFailures)throw Error('SYNTHETIC_POSTCOMMIT_RENDER');},renderReferences(){},renderBookingManagement(){if(managementFailure)throw Error('SYNTHETIC_MANAGEMENT_DISPLAY');},
  notify:(text,error)=>{messages.push({text,error});if(notifyFailure)throw Error('SYNTHETIC_TOAST_DISPLAY');},localStorage:{setItem(){}},backupCounter:()=>0,
  decideImportedConfiguration:()=>null,hasBackupPassword:async()=>false,backupDone(){}});
 vm.runInContext(saveSource,ctx);const restore=vm.runInContext('({'+restoreSource+'}).restoreData',ctx);
 return {ctx,messages,restore,initialRaw,save:()=>vm.runInContext('save()',ctx),raw:()=>raw,revision:()=>revision,commits:()=>commits,reloads:()=>reloads};
}
test('Confirmed save followed by render failure keeps committed model and does not report an unsaved change',async()=>{
 const h=harness({renderFailures:1});h.ctx.model=candidate();await h.save();assert.equal(h.commits(),1);assert.equal(h.revision(),3);assert.equal(h.reloads(),0);assert.equal(h.ctx.model.positions[0].quantityExact,'123.45');assert.equal(JSON.parse(h.raw()).positions[0].quantityExact,'123.45');assert.equal(h.ctx.saving,false);assert.match(h.ctx.lastDisplayError,/gespeichert.*Anzeige/i);assert.equal(h.ctx.lastStorageError,'');assert.equal(h.messages.some(m=>/nicht gespeichert/i.test(m.text)),false);assert.ok(h.messages.some(m=>/gespeichert.*Anzeige/i.test(m.text)));
});
test('Actual Drive restore callback does not roll back visible model after a confirmed save with a display failure',async()=>{
 const h=harness({renderFailures:1});await h.restore(candidate());assert.equal(h.revision(),3);assert.equal(h.commits(),1);assert.equal(h.reloads(),0);assert.equal(h.ctx.model.positions[0].quantityExact,'123.45');assert.equal(backup(h.ctx.model),h.raw());assert.equal(h.messages.at(-1).text,'Portfoliodaten aus Google Drive übernommen.');assert.match(h.ctx.lastDisplayError,/gespeichert.*Anzeige/i);assert.equal(h.ctx.lastStorageError,'');
});
test('Genuine precommit failure still rejects and reloads the unchanged original',async()=>{
 const h=harness({storeFailure:true});h.ctx.model=candidate();await assert.rejects(h.save(),{name:'QuotaExceededError'});assert.equal(h.raw(),h.initialRaw);assert.equal(h.revision(),2);assert.equal(h.commits(),0);assert.equal(h.reloads(),1);assert.equal(h.ctx.model.positions.length,0);assert.equal(h.ctx.saving,false);assert.match(h.ctx.lastStorageError,/nicht gespeichert/);assert.ok(h.messages.some(m=>/Änderung nicht gespeichert/.test(m.text)));
});
test('Final status failure after a confirmed commit cannot convert it to a failed save',async()=>{
 const h=harness({syncFailureAt:2});h.ctx.model=candidate();await h.save();assert.equal(h.revision(),3);assert.equal(h.commits(),1);assert.equal(h.reloads(),0);assert.equal(h.ctx.saving,false);assert.match(h.ctx.lastDisplayError,/gespeichert.*Anzeige/i);assert.equal(h.ctx.lastStorageError,'');
});
test('Booking-management display failure after commit preserves exactly one saved mutation',async()=>{
 const h=harness({page:'bookings',managementFailure:true});h.ctx.model=candidate();await h.save();assert.equal(h.commits(),1);assert.equal(h.revision(),3);assert.equal(h.reloads(),0);assert.equal(h.ctx.saving,false);assert.match(h.ctx.lastDisplayError,/gespeichert.*Anzeige/i);assert.equal(h.ctx.lastStorageError,'');
});
test('Persistent render and warning-toast failure cannot invite a second storage attempt',async()=>{
 const h=harness({renderFailures:Infinity,notifyFailure:true});h.ctx.model=candidate();await h.save();assert.equal(h.commits(),1);assert.equal(h.revision(),3);assert.equal(h.ctx.saving,false);assert.equal(h.reloads(),0);assert.equal(h.ctx.model.positions[0].quantityExact,'123.45');assert.match(h.ctx.lastDisplayError,/gespeichert.*Anzeige/i);assert.equal(h.ctx.lastStorageError,'');
});
test('Ordinary successful save keeps the existing one-commit behavior',async()=>{
 const h=harness();h.ctx.model=candidate();await h.save();assert.equal(h.commits(),1);assert.equal(h.revision(),3);assert.equal(h.reloads(),0);assert.equal(h.ctx.lastStorageError,'');assert.deepEqual(h.messages,[]);assert.equal(h.ctx.saving,false);
});
test('Persistent header warning describes committed data while real storage failures keep priority',()=>{
 const warning='Daten gespeichert. Anzeige konnte nicht vollständig aktualisiert werden.';
 assert.deepEqual(storagePresentation({displayError:warning}),{state:'warning',label:warning,mark:'!'});
 assert.equal(storagePresentation({displayError:warning,error:'Quota'}).state,'error');
 assert.equal(storagePresentation({displayError:warning,conflict:true}).state,'conflict');
 assert.equal(storagePresentation({displayError:warning,saving:true}).state,'saving');
});
test('Actual shared desktop and mobile status keep the saved boundary visible after a display failure',()=>{
 const src=app.slice(app.indexOf('function syncPortfolioState(){'),app.indexOf('function render(){'));
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:false});return nodes.get(id);};
 let refreshes=0;
 const ctx=vm.createContext({model:candidate(),$,loadFailure:null,otherTabChangedPortfolio:false,saving:false,lastStorageError:'',lastDisplayError:'Daten gespeichert. Anzeige prüfen.',headerStatus:{refresh(){refreshes++;}},portfolioStore:{isIndexedDB:true},document:{body:{classList:{toggle(){}}},querySelectorAll:()=>[]},aggregateValuePresentation,totalEUR,money});
 vm.runInContext(src+'\nsyncPortfolioState()',ctx);
 for(const id of ['localPortfolioStatus','mobilePortfolioStatus']){assert.equal($(id).textContent,'Daten gespeichert · Anzeige prüfen');assert.doesNotMatch($(id).textContent,/nicht gespeichert/);}
 assert.equal($('sidebarPortfolioStatus').hidden,false);assert.equal($('totalValue').textContent.replace(/\s/g,''),'€123,45');assert.equal(refreshes,1);
 ctx.lastStorageError='Quota';vm.runInContext('syncPortfolioState()',ctx);assert.match($('localPortfolioStatus').textContent,/nicht gespeichert/);
});
