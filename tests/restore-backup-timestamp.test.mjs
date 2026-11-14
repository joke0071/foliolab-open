import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {blankModel,createProvider,createAccount,createPosition,backup,safeImport,defaultSettings} from '../src/model.js';
const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
const marker='foliolab-open-last-backup-at',counter='foliolab-open-unbacked-changes',old='2026-01-02T12:00:00.000Z',now='2026-11-14T06:00:00.000Z';
const done=app.split('\n').find(l=>l.startsWith('function backupDone('));
const status=app.slice(app.indexOf('function renderBackupStatus(){'),app.indexOf('let dialogOpener=null'));
const begin=app.indexOf('      async restoreData(data,configuration=null){'),end=app.indexOf('      onBackedUp()',begin);
function data(){const m=blankModel();m.settings.autoRefresh='off';m.providers.push(createProvider({id:'p',name:'Synthetic'}));m.accounts.push(createAccount({id:'a',providerId:'p',name:'Synthetic cash'},m));m.positions.push(createPosition({id:'cash',providerId:'p',accountId:'a',kind:'cash',name:'Cash',quantity:123.45,price:1},m));return m;}
function setup({existing=false,previous=null,fail=false}={}){
 const model=existing?data():blankModel(),storage=new Map([[counter,'7']]);if(previous)storage.set(marker,previous);
 const label={textContent:''},messages=[];let saves=0,offers=0,revision=2,stored=backup(model,{includeHistory:true});
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return Date.parse(now);}}
 const ctx=vm.createContext({model,saving:false,otherTabChangedPortfolio:false,loadFailure:null,recoveryDownloaded:false,Date:Clock,safeImport,defaultSettings,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},$:()=>label,
  decideImportedConfiguration:()=>null,hasBackupPassword:async()=>false,confirm:()=>true,
  downloadBackup:()=>{offers++;vm.runInContext('backupDone()',ctx);},
  save:async()=>{if(fail)throw Error('SYNTHETIC_PRECOMMIT_FAILURE');saves++;revision++;stored=backup(ctx.model,{includeHistory:true});},notify:(text,error)=>messages.push({text,error})});
 vm.runInContext(done+'\n'+status,ctx);const restore=vm.runInContext('({'+app.slice(begin,end)+'}).restoreData',ctx);
 return {ctx,storage,label,messages,restore,saves:()=>saves,offers:()=>offers,revision:()=>revision,stored:()=>stored};
}
test('Fresh Drive restore does not manufacture a local backup creation timestamp',async()=>{
 const h=setup();await h.restore(data());assert.equal(h.storage.get(marker),undefined);assert.match(h.label.textContent,/Noch kein Backup erstellt/);assert.equal(h.storage.get(counter),'0');assert.equal(h.offers(),0);assert.equal(h.saves(),1);assert.equal(h.revision(),3);assert.equal(JSON.parse(h.stored()).positions[0].quantityExact,'123.45');assert.equal(h.messages.at(-1).text,'Portfoliodaten aus Google Drive übernommen.');
});
test('Restore preserves an existing real backup timestamp instead of refreshing it',async()=>{
 const h=setup({previous:old});await h.restore(data());assert.equal(h.storage.get(marker),old);assert.equal(h.offers(),0);assert.equal(h.storage.get(counter),'0');assert.equal(h.revision(),3);
});
test('Meaningful old portfolio still offers a real rollback backup and preserves its creation event',async()=>{
 const h=setup({existing:true,previous:old});await h.restore(data());assert.equal(h.offers(),1);assert.equal(h.storage.get(marker),now);assert.equal(h.saves(),1);assert.equal(h.revision(),3);assert.equal(h.storage.get(counter),'0');
});
test('A rejected restore does not mark an uncreated backup or reset unsaved change count',async()=>{
 const h=setup({previous:old,fail:true}),before=h.stored();await assert.rejects(()=>h.restore(data()),/SYNTHETIC_PRECOMMIT_FAILURE/);assert.equal(h.storage.get(marker),old);assert.equal(h.storage.get(counter),'7');assert.equal(h.stored(),before);assert.equal(h.revision(),2);assert.equal(h.saves(),0);
});
test('Actual backup creation keeps the existing timestamp and counter behavior',()=>{
 const h=setup({previous:old});vm.runInContext('backupDone()',h.ctx);assert.equal(h.storage.get(marker),now);assert.equal(h.storage.get(counter),'0');assert.match(h.label.textContent,/Zuletzt für einen Download erstellt/);
});
test('Drive restore help scopes the rollback offer to existing local data',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/Wenn auf diesem Gerät bereits Daten vorhanden sind, wird vor der Wiederherstellung eine lokale Rückfallsicherung angeboten\./);assert.doesNotMatch(html,/>Vor dem Wiederherstellen wird eine lokale Rückfallsicherung angeboten\.</);
});
