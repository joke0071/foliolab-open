import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {blankModel,defaultSettings,safeImport} from '../src/model.js';
import {validatedPublicEndpoint} from '../src/public-instruments-client.js';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const keys=['securitySource','alphaVantageKey','marketstackKey','coinGeckoKey','etherscanKey','binplorerKey','publicInstrumentEndpoint','eodhdWorkerEndpoint','eodhdWorkerAccessToken'];
function harness({accept=true,fail=false,cacheFail=false,configuration=true}={}){
 const settings={...defaultSettings(),coinGeckoKey:'SYNTHETIC_STORED'};
 const elements=Object.fromEntries(keys.map(key=>[key,{value:settings[key]||'',type:key.endsWith('Key')||key.endsWith('Token')?'text':'text'}]));
 for(const field of Object.values(elements))field.closest=()=>({querySelector:()=>({click(){field.type='password';}})});
 elements.namedItem=key=>elements[key]||null;
 const nodes={apiSettings:{elements},optionalConnectionStatus:{},solanaRpc:{type:'password'},backupStatus:{},backupFile:{addEventListener(type,handler){context.fileHandler=handler;}},deleteAll:{addEventListener(type,handler){context.resetHandler=handler;}}};
 let committed={...blankModel(),settings},removed=false;
 const imported=blankModel();imported.settings={...defaultSettings(),coinGeckoKey:'SYNTHETIC_NEW'};
 const config=configuration?{settings:imported.settings,drive:{}}:null;
 const context=vm.createContext({model:structuredClone(committed),$:id=>nodes[id],blankModel,defaultSettings,safeImport,validatedPublicEndpoint,
  confirm:()=>accept,prompt:()=>'SYNTHETIC_PASSWORD',notify(){},setLoading(){},renderBackupStatus(){},render(){},syncPortfolioState(){},
  saving:false,busy:false,otherTabChangedPortfolio:false,loadFailure:null,filter:'all',lastStorageError:'',page:'more',
  backupCounter:()=>0,localStorage:{setItem(){}},
  portfolioStore:{async save(model){if(fail)throw Error('SYNTHETIC_COMMIT_FAILURE');committed=structuredClone(model);},async reload(){return structuredClone(committed);},async removeAll(){if(fail)throw Error('SYNTHETIC_REMOVE_FAILURE');removed=true;}},
  async clearAlphaCache(){if(cacheFail)throw Error('SYNTHETIC_CACHE_FAILURE');},
  assertLocalBackupFileSize(){},isPasswordBackup:()=>true,COMPLETE_BACKUP_KIND:'SYNTHETIC_COMPLETE',
  async decryptPasswordBackup(){return JSON.stringify({kind:'SYNTHETIC_COMPLETE'});},async adoptBackupPassword(){},async refreshBackupPasswordStatus(){},
  unpackCompleteBackup:()=>({data:imported,configuration:config}),unresolvedListings:()=>[],
  async hasBackupPassword(){return false;},downloadBackup(){},backupDone(){},applyImportedDriveConfiguration(){},
  window:{FolioDriveBackup:{}},location:{reload(){throw Error('unexpected reload');}}
 });
 const run=(a,b)=>vm.runInContext(source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a))),context);
 run('async function save(){','function notify(');
 run('function decideImportedConfiguration(','function applyImportedDriveConfiguration(');
 if(source.includes('function syncApiSettingsForm('))run('function syncApiSettingsForm(','function initEvents(');
 run("$('backupFile').addEventListener('change'",'  // Drive only receives');
 run("$('deleteAll').addEventListener('click'",'  const apiCredentialFields=');
 context.drive=vm.runInContext('({'+source.slice(source.indexOf('async restoreData('),source.indexOf('      onBackedUp()'))+'})',context);
 run('function apiSettingsHasDraft(){','function pwaUpdateShouldDefer(');
 return {context,elements,imported,config,committed:()=>committed,removed:()=>removed,dirty:()=>vm.runInContext('apiSettingsHasDraft()',context),
  reset:()=>context.resetHandler(),file:()=>context.fileHandler({target:{files:[{size:1,text:async()=>JSON.stringify({kind:'SYNTHETIC_COMPLETE'})}],value:'selected'}}),
  drive:()=>context.drive.restoreData(imported,config)};
}
test('confirmed reset clears every API field and the update draft flag',async()=>{
 const h=harness();await h.reset();assert.equal(h.removed(),true);assert.equal(h.elements.coinGeckoKey.value,'');assert.equal(h.dirty(),false);
});
test('reset cancellation and failed deletion preserve the draft and canonical model',async()=>{
 for(const options of [{accept:false},{fail:true}]){const h=harness(options),before=JSON.stringify(h.context.model);h.elements.coinGeckoKey.value='SYNTHETIC_DRAFT';await h.reset();assert.equal(h.removed(),false);assert.equal(h.elements.coinGeckoKey.value,'SYNTHETIC_DRAFT');assert.equal(JSON.stringify(h.context.model),before);}
});
test('successful deletion still clears the form if quote-cache cleanup fails',async()=>{
 const h=harness({cacheFail:true});await h.reset();assert.equal(h.removed(),true);assert.equal(h.elements.coinGeckoKey.value,'');assert.equal(h.dirty(),false);
});
for(const path of ['file','drive']){
 test(path+' accepted settings follow committed model and are masked',async()=>{
  const h=harness();h.elements.coinGeckoKey.value='SYNTHETIC_DRAFT';await h[path]();assert.equal(h.committed().settings.coinGeckoKey,'SYNTHETIC_NEW');assert.equal(h.elements.coinGeckoKey.value,'SYNTHETIC_NEW');assert.equal(h.elements.coinGeckoKey.type,'password');assert.equal(h.dirty(),false);
 });
 test(path+' missing configuration preserves the draft',async()=>{
  const h=harness({configuration:false});h.elements.coinGeckoKey.value='SYNTHETIC_DRAFT';await h[path]();assert.equal(h.committed().settings.coinGeckoKey,'SYNTHETIC_STORED');assert.equal(h.elements.coinGeckoKey.value,'SYNTHETIC_DRAFT');assert.equal(h.dirty(),true);
 });
 test(path+' declined settings preserve the draft',async()=>{
  const h=harness();h.context.confirm=message=>!message.includes('möglicherweise API-Schlüssel');h.elements.coinGeckoKey.value='SYNTHETIC_DRAFT';await h[path]();assert.equal(h.committed().settings.coinGeckoKey,'SYNTHETIC_STORED');assert.equal(h.elements.coinGeckoKey.value,'SYNTHETIC_DRAFT');
 });
 test(path+' failed commit preserves the draft and previous settings',async()=>{
  const h=harness({fail:true});h.elements.coinGeckoKey.value='SYNTHETIC_DRAFT';if(path==='drive')await assert.rejects(h.drive(),/SYNTHETIC_COMMIT_FAILURE/);else await h.file();assert.equal(h.committed().settings.coinGeckoKey,'SYNTHETIC_STORED');assert.equal(h.elements.coinGeckoKey.value,'SYNTHETIC_DRAFT');assert.equal(h.context.model.settings.coinGeckoKey,'SYNTHETIC_STORED');
 });
}
